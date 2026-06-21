"use server";

import { revalidatePath } from "next/cache";
import { Bill, Action } from "@prisma/client";
import { BillRepository } from "@/lib/repositories/billRepository";
import { ActionRepository, UserActionWithAction } from "@/lib/repositories/actionRepository";
import { calculateEmissions } from "@/lib/carbonCalculator";
import { InsightsEngine } from "@/lib/services/insightsEngine";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";
const BACKEND_INGEST_URL = `${BACKEND_API_URL}/api/v1/ingest`;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];

export interface ActionResponse {
  success: boolean;
  error?: string;
  data?: unknown;
}

export interface DashboardSummary {
  totalEmissions: number;
  electricityEmissions: number;
  gasEmissions: number;
  waterEmissions: number;
  billCount: number;
  avoidedEmissions: number;
  insights: string[];
}

export interface DashboardData {
  bills: Bill[];
  summary: DashboardSummary;
  availableActions: Action[];
  userActions: UserActionWithAction[];
}

/**
 * Server Action: Process and save uploaded utility bills
 */
export async function uploadBillAction(formData: FormData): Promise<ActionResponse> {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file uploaded." };
    }

    // Validate File Size
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: `File exceeds 5MB size limit (${(file.size / (1024 * 1024)).toFixed(2)}MB).` };
    }

    // Validate MIME Type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return { success: false, error: `Unsupported file type: ${file.type}. Please upload PDF, PNG, or JPEG.` };
    }

    // Forward File to FastAPI Backend Ingestion Pipeline
    const backendFormData = new FormData();
    backendFormData.append("file", file);

    const backendResponse = await fetch(BACKEND_INGEST_URL, {
      method: "POST",
      body: backendFormData,
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      const errorMsg = errorData.detail || errorData.error || `AI Parser returned status ${backendResponse.status}`;
      return { success: false, error: errorMsg };
    }

    const parsedData = await backendResponse.json();
    
    // Validate LLM output values (Ensure consumption is positive)
    if (parsedData.consumption_value <= 0) {
      return { success: false, error: "AI pipeline extracted invalid zero or negative consumption value." };
    }

    // Calculate Emissions
    const emissions = await calculateEmissions(
      parsedData.utility_type,
      parsedData.consumption_value,
      parsedData.unit
    );

    // Parse dates safely
    const startDate = parsedData.billing_period_start ? new Date(parsedData.billing_period_start) : null;
    const endDate = parsedData.billing_period_end ? new Date(parsedData.billing_period_end) : null;

    // Sanitize filename to prevent path traversal or Stored XSS
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");

    // Save parsed entry using Repository Pattern
    const savedBill = await BillRepository.createBill({
      utilityType: parsedData.utility_type,
      consumptionValue: parsedData.consumption_value,
      unit: parsedData.unit,
      emissions: emissions,
      startDate: startDate,
      endDate: endDate,
      fileName: sanitizedFileName,
    });

    revalidatePath("/");
    return { success: true, data: savedBill };

  } catch (error) {
    console.error("Failed to ingest bill action:", error);
    const message = error instanceof Error ? error.message : "An error occurred during backend AI ingestion pipeline processing.";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server Action: Delete a bill entry by ID
 */
export async function deleteBillAction(billId: string): Promise<ActionResponse> {
  try {
    await BillRepository.deleteBill(billId);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete bill action:", error);
    return { success: false, error: "Failed to delete billing entry from the database." };
  }
}

/**
 * Server Action: Commit to a carbon reduction action
 */
export async function commitToActionAction(actionId: string): Promise<ActionResponse> {
  try {
    const committed = await ActionRepository.commitToAction(actionId);
    revalidatePath("/");
    return { success: true, data: committed };
  } catch (error) {
    console.error("Failed to commit to action:", error);
    return { success: false, error: "Failed to save commitment to the database." };
  }
}

/**
 * Server Action: Toggle completion status of an action
 */
export async function toggleActionCompleteAction(userActionId: string, isComplete: boolean): Promise<ActionResponse> {
  try {
    await ActionRepository.toggleActionComplete(userActionId, isComplete);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle action complete:", error);
    return { success: false, error: "Failed to update action completion status in the database." };
  }
}

/**
 * Server Action: Remove commitment to a carbon reduction action
 */
export async function deleteUserActionAction(userActionId: string): Promise<ActionResponse> {
  try {
    await ActionRepository.deleteUserAction(userActionId);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete user action commitment:", error);
    return { success: false, error: "Failed to remove action commitment from the database." };
  }
}

/**
 * Server Action: Retrieve all bills and aggregate metrics
 */
export async function getDashboardData(): Promise<DashboardData> {
  try {
    const bills = await BillRepository.getAllBills();
    const availableActions = await ActionRepository.getAllActions();
    const userActions = await ActionRepository.getUserActions();
    const avoidedEmissions = await ActionRepository.getAvoidedEmissions();

    // Compute aggregates
    let totalEmissions = 0;
    let electricityEmissions = 0;
    let gasEmissions = 0;
    let waterEmissions = 0;

    bills.forEach((bill) => {
      totalEmissions += bill.emissions;
      if (bill.utilityType === "electricity") electricityEmissions += bill.emissions;
      else if (bill.utilityType === "gas") gasEmissions += bill.emissions;
      else if (bill.utilityType === "water") waterEmissions += bill.emissions;
    });

    // Round values
    totalEmissions = Math.round(totalEmissions * 100) / 100;
    electricityEmissions = Math.round(electricityEmissions * 100) / 100;
    gasEmissions = Math.round(gasEmissions * 100) / 100;
    waterEmissions = Math.round(waterEmissions * 100) / 100;

    const summaryBase = {
      totalEmissions,
      electricityEmissions,
      gasEmissions,
      waterEmissions,
    };

    // Generate personalized insights using InsightsEngine
    const insights = InsightsEngine.generateInsights(summaryBase);

    return {
      bills,
      summary: {
        ...summaryBase,
        billCount: bills.length,
        avoidedEmissions,
        insights,
      },
      availableActions,
      userActions,
    };
  } catch (error) {
    console.error("Failed to retrieve dashboard metrics:", error);
    return {
      bills: [],
      summary: {
        totalEmissions: 0,
        electricityEmissions: 0,
        gasEmissions: 0,
        waterEmissions: 0,
        billCount: 0,
        avoidedEmissions: 0,
        insights: ["An error occurred while loading insights. Please refresh."],
      },
      availableActions: [],
      userActions: [],
    };
  }
}
