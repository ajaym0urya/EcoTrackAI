"use client";

import React, { useState, useRef } from "react";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { uploadBillAction } from "@/app/actions";

interface BillUploadZoneProps {
  onSuccess: () => void;
}

export default function BillUploadZone({ onSuccess }: BillUploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Validation Rules
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];

  const validateAndUpload = async (file: File) => {
    setErrorMsg("");
    setUploadedFileName(file.name);

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setStatus("error");
      setErrorMsg(`File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB).`);
      return;
    }

    // Validate mime-type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setStatus("error");
      setErrorMsg("Unsupported file type. Please upload a PDF, PNG, or JPEG.");
      return;
    }

    try {
      setStatus("uploading");
      
      // We simulate progressive UI states for maximum user delight
      // State 1: Uploading file
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      // State 2: AI Parsing utility bill
      setStatus("processing");
      
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await uploadBillAction(formData);

      if (response.success) {
        setStatus("success");
        onSuccess();
        // Reset back to idle after a success message delay
        setTimeout(() => {
          setStatus("idle");
          setUploadedFileName("");
        }, 3000);
      } else {
        setStatus("error");
        setErrorMsg(response.error || "An unexpected error occurred during bill processing.");
      }
    } catch (err) {
      setStatus("error");
      const message = err instanceof Error ? err.message : "Failed to establish connection with server pipeline.";
      setErrorMsg(message);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0]);
    }
  };

  const triggerFileBrowser = () => {
    fileInputRef.current?.click();
  };

  // Keyboard navigation for accessibillity
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      triggerFileBrowser();
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Hidden input for standard folder selections */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
        id="bill-file-uploader"
        aria-label="Upload utility bill"
      />

      {/* Screen Reader Announcements for Accessibility */}
      <div className="sr-only" aria-live="polite">
        {status === "uploading" && `Uploading ${uploadedFileName}...`}
        {status === "processing" && "AI Vision LLM is analyzing the bill. Ignore personal details."}
        {status === "success" && "Utility bill parsed and saved successfully."}
        {status === "error" && `Error: ${errorMsg}`}
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={triggerFileBrowser}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer min-h-[220px] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
          dragOver
            ? "border-emerald-500 bg-emerald-50/10 scale-[1.02]"
            : "border-slate-700 bg-slate-900/40 hover:border-slate-500 hover:bg-slate-900/70"
        }`}
        aria-describedby="upload-instructions"
      >
        {status === "idle" && (
          <>
            <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-full mb-4 animate-pulse">
              <Upload className="h-8 w-8" />
            </div>
            <h3 id="upload-instructions" className="text-lg font-semibold text-slate-200 mb-1">
              Drag & drop your utility bill here
            </h3>
            <p className="text-sm text-slate-400 max-w-sm mb-2">
              Supports <strong className="text-slate-300">PDF, PNG, or JPEG</strong> formats up to 5MB.
            </p>
            <span className="text-xs text-emerald-400/80 font-medium">
              Click to browse computer files
            </span>
          </>
        )}

        {(status === "uploading" || status === "processing") && (
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 text-emerald-400 animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-slate-200 mb-1">
              {status === "uploading" ? "Uploading Document..." : "Analyzing bill with AI..."}
            </h3>
            <p className="text-sm text-slate-400 max-w-xs">
              {status === "uploading" 
                ? `Transmitting "${uploadedFileName}" to pipeline.` 
                : "Gemini Vision is parsing consumption data. Personal details are being redacted."}
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center text-emerald-400 animate-bounce">
            <CheckCircle className="h-12 w-12 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Upload Successful!</h3>
            <p className="text-sm text-emerald-500/80">
              Extracted consumption data & added to carbon summary.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center text-rose-400">
            <AlertCircle className="h-12 w-12 mb-3 animate-shake" />
            <h3 className="text-lg font-semibold mb-1">Processing Failed</h3>
            <p className="text-sm text-rose-400/80 max-w-xs mb-3 text-center">
              {errorMsg}
            </p>
            <span className="text-xs text-slate-300 underline hover:text-emerald-400 transition-colors">
              Try another file
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
