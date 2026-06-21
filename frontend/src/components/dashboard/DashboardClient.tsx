"use client";

import React, { useState } from "react";
import { Zap, Flame, Droplet, Leaf, Award, TrendingDown } from "lucide-react";
import BillUploadZone from "./BillUploadZone";
import EmissionsCharts from "./EmissionsCharts";
import ActivityStream from "./ActivityStream";
import ActionCenter from "./ActionCenter";
import { getDashboardData } from "@/app/actions";
import { UserActionWithAction } from "@/lib/repositories/actionRepository";

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

interface Action {
  id: string;
  title: string;
  description: string;
  utilityType: string;
  savings: number;
  difficulty: string;
}

interface DashboardSummary {
  totalEmissions: number;
  electricityEmissions: number;
  gasEmissions: number;
  waterEmissions: number;
  billCount: number;
  avoidedEmissions: number;
  insights: string[];
}

interface DashboardClientProps {
  initialData: {
    bills: Bill[];
    summary: DashboardSummary;
    availableActions: Action[];
    userActions: UserActionWithAction[];
  };
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const [data, setData] = useState(initialData);

  const handleRefresh = async () => {
    try {
      const freshData = await getDashboardData();
      setData(freshData);
    } catch (err) {
      console.error("Failed to refresh dashboard data:", err);
    }
  };

  const { bills, summary, availableActions, userActions } = data;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Dashboard Overview Metrics Grid */}
      <div className="space-y-6">
        
        {/* Row 1: Primary Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Carbon Footprint Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/25 hover:border-emerald-500/40 rounded-2xl p-6 transition-all duration-300 shadow-xl group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Leaf className="h-32 w-32 text-emerald-400" />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Leaf className="h-5 w-5" />
              </div>
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Total Carbon Footprint</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-100 tracking-tight">
                {summary.totalEmissions.toLocaleString()}
              </span>
              <span className="text-sm font-semibold text-emerald-400">kg CO₂e</span>
            </div>
            <p className="text-xs text-slate-450 mt-2 flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
              <span>Net carbon emissions logged from bills</span>
            </p>
          </div>

          {/* Avoided Emissions Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 border border-cyan-500/25 hover:border-cyan-500/45 rounded-2xl p-6 transition-all duration-300 shadow-xl group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Award className="h-32 w-32 text-cyan-400" />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                <Award className="h-5 w-5" />
              </div>
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Avoided Emissions</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-100 tracking-tight">
                {summary.avoidedEmissions.toLocaleString()}
              </span>
              <span className="text-sm font-semibold text-cyan-400">kg CO₂e / mo</span>
            </div>
            <p className="text-xs text-slate-450 mt-2 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Carbon offset via active checklists</span>
            </p>
          </div>
        </div>

        {/* Row 2: Utility Breakdowns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Electricity Card */}
          <div className="bg-slate-900/40 border border-slate-800 hover:border-emerald-500/20 rounded-2xl p-5 transition-all duration-300 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Zap className="h-4.5 w-4.5" />
              </div>
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Electricity</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-slate-200 tracking-tight">
                {summary.electricityEmissions.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-500">kg CO₂e</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              Power grid carbon emissions
            </p>
          </div>

          {/* Gas Card */}
          <div className="bg-slate-900/40 border border-slate-800 hover:border-amber-500/20 rounded-2xl p-5 transition-all duration-300 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400">
                <Flame className="h-4.5 w-4.5" />
              </div>
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Natural Gas</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-slate-200 tracking-tight">
                {summary.gasEmissions.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-500">kg CO₂e</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              Heating & gas combustion footprint
            </p>
          </div>

          {/* Water Card */}
          <div className="bg-slate-900/40 border border-slate-800 hover:border-blue-500/20 rounded-2xl p-5 transition-all duration-300 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
                <Droplet className="h-4.5 w-4.5" />
              </div>
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Water Utility</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-slate-200 tracking-tight">
                {summary.waterEmissions.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-500">kg CO₂e</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              Water treatment carbon cost
            </p>
          </div>
        </div>
      </div>

      {/* 2. Workspace Core: Upload, Charts & Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Upload Zone & Visualizations */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-100">Bill Ingestion Hub</h2>
              <p className="text-sm text-slate-400">Drop utility invoices below. Gemini AI parses values and computes footprint automatically.</p>
            </div>
            <BillUploadZone onSuccess={handleRefresh} />
          </div>
          
          <EmissionsCharts bills={bills} />
        </div>

        {/* Reduction Center & Historical Activity Logs */}
        <div className="xl:col-span-1 space-y-6">
          <ActionCenter
            availableActions={availableActions}
            userActions={userActions}
            onActionChange={handleRefresh}
            insights={summary.insights}
          />
          
          <ActivityStream bills={bills} onDeleteSuccess={handleRefresh} />
        </div>
      </div>
    </div>
  );
}
