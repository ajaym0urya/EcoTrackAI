import { prisma } from "@/lib/prisma";

export interface CreateBillInput {
  utilityType: string;
  consumptionValue: number;
  unit: string;
  emissions: number;
  startDate?: Date | null;
  endDate?: Date | null;
  fileName: string;
}

export class BillRepository {
  /**
   * Retrieves all bills sorted by creation date descending
   */
  static async getAllBills() {
    return prisma.bill.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Saves a new bill entry to the database
   */
  static async createBill(data: CreateBillInput) {
    return prisma.bill.create({
      data: {
        utilityType: data.utilityType.toLowerCase(),
        consumptionValue: data.consumptionValue,
        unit: data.unit,
        emissions: data.emissions,
        startDate: data.startDate,
        endDate: data.endDate,
        fileName: data.fileName,
      },
    });
  }

  /**
   * Deletes a bill entry by its unique identifier
   */
  static async deleteBill(id: string) {
    return prisma.bill.delete({
      where: { id },
    });
  }
}
