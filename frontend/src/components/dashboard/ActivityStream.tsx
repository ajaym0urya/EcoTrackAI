"use client";

import React, { useState } from "react";
import { Zap, Flame, Droplet, Trash2, Calendar, FileText, Loader2 } from "lucide-react";
import { deleteBillAction } from "@/app/actions";

interface Bill {
  id: string;
  utilityType: string;
  consumptionValue: number;
  unit: string;
  emissions: number;
  startDate: Date | string | null;
  endDate: Date | string | null;
  fileName: string;
  createdAt: Date | string;
}

interface ActivityStreamProps {
  bills: Bill[];
  onDeleteSuccess: () => void;
}

export default function ActivityStream({ bills, onDeleteSuccess }: ActivityStreamProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      const res = await deleteBillAction(id);
      if (res.success) {
        onDeleteSuccess();
      } else {
        alert(res.error || "Failed to delete the billing entry.");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred during deletion.");
    } finally {
      setDeletingId(null);
    }
  };

  const getUtilityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "electricity":
        return <Zap className="h-5 w-5 text-emerald-400" />;
      case "gas":
        return <Flame className="h-5 w-5 text-amber-400" />;
      case "water":
        return <Droplet className="h-5 w-5 text-blue-400" />;
      default:
        return <FileText className="h-5 w-5 text-slate-400" />;
    }
  };

  const getUtilityBadgeClass = (type: string) => {
    switch (type.toLowerCase()) {
      case "electricity":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "gas":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "water":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  const formatDate = (dateInput: Date | string | null) => {
    if (!dateInput) return "N/A";
    const date = new Date(dateInput);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-200">Activity History</h3>
          <p className="text-xs text-slate-400">Log entries extracted from uploaded documents.</p>
        </div>
        <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full font-medium">
          {bills.length} total
        </span>
      </div>

      {bills.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
          <FileText className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300">No bills tracked yet</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
            Upload your utility bill PDF or Image above to automatically extract your footprint.
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
          {bills.map((bill) => (
            <div
              key={bill.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-slate-700 transition-all duration-300 gap-4"
            >
              {/* Left Column: Utility Type and Details */}
              <div className="flex items-start gap-3">
                <div className={`p-3 rounded-lg flex items-center justify-center shrink-0 ${getUtilityBadgeClass(bill.utilityType)}`}>
                  {getUtilityIcon(bill.utilityType)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-200 capitalize">
                      {bill.utilityType} Bill
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium max-w-[150px] truncate" title={bill.fileName}>
                      • {bill.fileName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {formatDate(bill.startDate)} - {formatDate(bill.endDate)}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-emerald-400/90 mt-2">
                    Consumption: <span className="text-slate-200">{bill.consumptionValue.toLocaleString()} {bill.unit}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Emissions and Delete Action */}
              <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-slate-900 sm:border-t-0 pt-2 sm:pt-0">
                <div className="text-left sm:text-right">
                  <div className="text-lg font-extrabold text-slate-100 leading-tight">
                    {bill.emissions.toLocaleString()} <span className="text-xs font-semibold text-slate-400">kg CO₂e</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">calculated emissions</span>
                </div>

                <button
                  onClick={() => handleDelete(bill.id)}
                  disabled={deletingId === bill.id}
                  className="p-2 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/60 rounded-lg transition-all duration-300 disabled:opacity-50"
                  aria-label={`Delete ${bill.utilityType} bill log`}
                >
                  {deletingId === bill.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
