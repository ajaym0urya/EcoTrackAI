"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface Bill {
  id: string;
  utilityType: string;
  consumptionValue: number;
  unit: string;
  emissions: number;
  startDate: Date | string | null;
  endDate: Date | string | null;
  createdAt: Date | string;
}

interface EmissionsChartsProps {
  bills: Bill[];
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color?: string;
  payload: {
    month?: string;
    color?: string;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

// Custom tooltips for clean dark-mode visuals declared outside of render
const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
        <p className="text-xs font-semibold text-slate-400 mb-1">{payload[0].payload.month || payload[0].name}</p>
        {payload.map((item, index) => (
          <p key={index} className="text-sm font-medium" style={{ color: item.color || item.payload.color }}>
            {item.name}: {item.value.toLocaleString()} kg CO₂e
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function EmissionsCharts({ bills }: EmissionsChartsProps) {
  // 1. Calculate Category Breakdown Data
  const categoryData = useMemo(() => {
    let electricity = 0;
    let gas = 0;
    let water = 0;

    bills.forEach((bill) => {
      const type = bill.utilityType.toLowerCase();
      if (type === "electricity") electricity += bill.emissions;
      else if (type === "gas") gas += bill.emissions;
      else if (type === "water") water += bill.emissions;
    });

    const total = electricity + gas + water;

    return [
      {
        name: "Electricity",
        value: Math.round(electricity * 100) / 100,
        percentage: total > 0 ? Math.round((electricity / total) * 100) : 0,
        color: "#10b981", // Emerald
      },
      {
        name: "Natural Gas",
        value: Math.round(gas * 100) / 100,
        percentage: total > 0 ? Math.round((gas / total) * 100) : 0,
        color: "#f59e0b", // Amber
      },
      {
        name: "Water Utility",
        value: Math.round(water * 100) / 100,
        percentage: total > 0 ? Math.round((water / total) * 100) : 0,
        color: "#3b82f6", // Blue
      },
    ].filter((item) => item.value > 0);
  }, [bills]);

  // 2. Calculate Trend Data (Grouped by Month)
  const trendData = useMemo(() => {
    const monthlyGroups: Record<string, { electricity: number; gas: number; water: number; total: number }> = {};

    // Sort bills by date ascending to plot chronological trend
    const sortedBills = [...bills].sort((a, b) => {
      const dateA = new Date(a.startDate || a.createdAt).getTime();
      const dateB = new Date(b.startDate || b.createdAt).getTime();
      return dateA - dateB;
    });

    sortedBills.forEach((bill) => {
      const date = new Date(bill.startDate || bill.createdAt);
      // Format as YYYY-MM
      const key = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`;

      if (!monthlyGroups[key]) {
        monthlyGroups[key] = { electricity: 0, gas: 0, water: 0, total: 0 };
      }

      const type = bill.utilityType.toLowerCase();
      if (type === "electricity") monthlyGroups[key].electricity += bill.emissions;
      else if (type === "gas") monthlyGroups[key].gas += bill.emissions;
      else if (type === "water") monthlyGroups[key].water += bill.emissions;
      monthlyGroups[key].total += bill.emissions;
    });

    return Object.entries(monthlyGroups).map(([month, data]) => ({
      month,
      Electricity: Math.round(data.electricity * 100) / 100,
      "Natural Gas": Math.round(data.gas * 100) / 100,
      Water: Math.round(data.water * 100) / 100,
      Total: Math.round(data.total * 100) / 100,
    }));
  }, [bills]);

  const totalEmissions = useMemo(() => {
    return Math.round(bills.reduce((sum, b) => sum + b.emissions, 0) * 100) / 100;
  }, [bills]);

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* 3. Screen Reader Fallback Table for WCAG 2.1 AA Compliance */}
      <div className="sr-only">
        <h2>Carbon Footprint Data Fallback Table</h2>
        
        <h3>Category Breakdown</h3>
        <table>
          <thead>
            <tr>
              <th scope="col">Utility Category</th>
              <th scope="col">Carbon Footprint (kg CO₂e)</th>
              <th scope="col">Percentage Share</th>
            </tr>
          </thead>
          <tbody>
            {categoryData.map((item, idx) => (
              <tr key={idx}>
                <td>{item.name}</td>
                <td>{item.value} kg CO₂e</td>
                <td>{item.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>Emissions Trend Over Time</h3>
        <table>
          <thead>
            <tr>
              <th scope="col">Billing Month</th>
              <th scope="col">Electricity (kg CO₂e)</th>
              <th scope="col">Natural Gas (kg CO₂e)</th>
              <th scope="col">Water (kg CO₂e)</th>
              <th scope="col">Total Emissions (kg CO₂e)</th>
            </tr>
          </thead>
          <tbody>
            {trendData.map((item, idx) => (
              <tr key={idx}>
                <td>{item.month}</td>
                <td>{item.Electricity} kg</td>
                <td>{item["Natural Gas"]} kg</td>
                <td>{item.Water} kg</td>
                <td>{item.Total} kg CO₂e</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chart Vis 1: Pie Breakdown */}
      <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-200">Emissions Breakdown</h3>
          <p className="text-xs text-slate-400">Distribution of kg CO₂e footprint by source utility.</p>
        </div>

        <div className="h-64 flex items-center justify-center relative my-4">
          {categoryData.length === 0 ? (
            <div className="text-slate-500 text-sm">No carbon logs logged yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}

          {totalEmissions > 0 && (
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-100">{totalEmissions.toLocaleString()}</span>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Total kg CO₂e</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {categoryData.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300 font-medium">{item.name}</span>
              </div>
              <span className="text-slate-400 font-semibold">
                {item.value.toLocaleString()} kg ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Vis 2: Area Trend */}
      <div className="lg:col-span-3 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-200">Emissions History</h3>
          <p className="text-xs text-slate-400">Carbon emission progression trend tracked month-over-month.</p>
        </div>

        <div className="h-64 my-4">
          {trendData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              No trend logs available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Total"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="text-xs text-slate-500 text-center font-medium">
          Horizontal axes denote billing months. Vertical axes denote emissions in kg CO₂e.
        </div>
      </div>
    </div>
  );
}
