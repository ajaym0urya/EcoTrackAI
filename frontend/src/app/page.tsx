import { getDashboardData } from "./actions";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { Leaf } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialData = await getDashboardData();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Page Header Area */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <Leaf className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-100 tracking-tight leading-tight">
                EcoTrace <span className="text-emerald-400">AI</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Carbon Footprint Tracking
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              Active Environmental Audit
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Workspace Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-100 tracking-tight mb-2">
            Environmental Dashboard
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Simplify tracking by uploading utility bill files (PDF, PNG, JPEG). 
            Our ingestion pipeline leverages Gemini Flash to pull consumption metrics and compute CO₂ equivalent footprint.
          </p>
        </div>

        <DashboardClient initialData={initialData} />
      </main>

      {/* Footer Branding */}
      <footer className="border-t border-slate-900 bg-slate-950/20 py-8 text-center text-xs text-slate-500 font-medium">
        <p>© 2026 EcoTrace AI Carbon Awareness Platform. Built with Next.js & Gemini Vision APIs.</p>
      </footer>
    </div>
  );
}
