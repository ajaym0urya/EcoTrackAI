import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi, describe, it, expect } from "vitest";
import BillUploadZone from "../components/dashboard/BillUploadZone";
import { uploadBillAction } from "../app/actions";

// Mock the server action module using Vitest
vi.mock("../app/actions", () => ({
  uploadBillAction: vi.fn()
}));

describe("BillUploadZone Component - Progressive State Transitions", () => {
  it("renders with the default Idle state elements", () => {
    const mockSuccess = vi.fn();
    render(<BillUploadZone onSuccess={mockSuccess} />);
    
    expect(screen.getByText(/Drag & drop your utility bill here/i)).toBeInTheDocument();
    expect(screen.getByText(/Click to browse computer files/i)).toBeInTheDocument();
  });

  it("transitions sequentially from Uploading -> Processing -> Success on file ingestion", async () => {
    const mockSuccess = vi.fn();
    let resolveAction: (val: unknown) => void = () => {};
    const actionPromise = new Promise((resolve) => {
      resolveAction = resolve;
    });
    (uploadBillAction as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue(actionPromise);

    render(<BillUploadZone onSuccess={mockSuccess} />);

    // Select a mock PDF file
    const file = new File(["test data"], "electricity_bill.pdf", { type: "application/pdf" });
    const fileInput = screen.getByLabelText(/Upload utility bill/i);

    // Act: Upload file
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Transition 1: Idle -> Uploading
    expect(screen.getByText(/Uploading Document.../i)).toBeInTheDocument();

    // Transition 2: Uploading -> Processing (triggers after 800ms)
    await waitFor(() => {
      expect(screen.getByText(/Analyzing bill with AI.../i)).toBeInTheDocument();
    }, { timeout: 1500 });

    // Resolve the upload action now
    resolveAction({ success: true, data: {} });

    // Transition 3: Processing -> Success (triggers after mock resolves)
    await waitFor(() => {
      expect(screen.getByText(/Upload Successful!/i)).toBeInTheDocument();
    }, { timeout: 1500 });

    expect(mockSuccess).toHaveBeenCalledTimes(1);
  });

  it("transitions from Uploading -> Processing -> Error when Server Action fails", async () => {
    const mockSuccess = vi.fn();
    let resolveAction: (val: unknown) => void = () => {};
    const actionPromise = new Promise((resolve) => {
      resolveAction = resolve;
    });
    (uploadBillAction as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue(actionPromise);

    render(<BillUploadZone onSuccess={mockSuccess} />);

    const file = new File(["test data"], "water_bill.png", { type: "image/png" });
    const fileInput = screen.getByLabelText(/Upload utility bill/i);

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Transition 1: Ingesting -> Processing
    await waitFor(() => {
      expect(screen.getByText(/Analyzing bill with AI.../i)).toBeInTheDocument();
    }, { timeout: 1500 });

    // Reject the upload action now
    resolveAction({
      success: false,
      error: "MOCK: Gemini vision processing failed."
    });

    // Transition 2: Processing -> Error
    await waitFor(() => {
      expect(screen.getByText(/^Processing Failed$/i)).toBeInTheDocument();
      expect(screen.getByText(/^MOCK: Gemini vision processing failed\.$/i)).toBeInTheDocument();
    }, { timeout: 1550 });

    expect(mockSuccess).not.toHaveBeenCalled();
  });
});
