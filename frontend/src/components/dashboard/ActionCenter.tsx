"use client";

import React, { useState } from "react";
import { Leaf, CheckSquare, Square, Trash2, Award, Star, Loader2 } from "lucide-react";
import { commitToActionAction, toggleActionCompleteAction, deleteUserActionAction } from "@/app/actions";
import { UserActionWithAction } from "@/lib/repositories/actionRepository";

interface Action {
  id: string;
  title: string;
  description: string;
  utilityType: string;
  savings: number;
  difficulty: string;
}

interface ActionCenterProps {
  availableActions: Action[];
  userActions: UserActionWithAction[];
  onActionChange: () => void;
  insights: string[];
}

export default function ActionCenter({
  availableActions,
  userActions,
  onActionChange,
  insights,
}: ActionCenterProps) {
  const [activeTab, setActiveTab] = useState<"insights" | "available" | "commitments">("insights");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const isCommitted = (actionId: string) => {
    return userActions.some((ua) => ua.actionId === actionId);
  };

  const handleCommit = async (actionId: string) => {
    setLoadingId(actionId);
    try {
      const res = await commitToActionAction(actionId);
      if (res.success) {
        onActionChange();
      } else {
        alert(res.error || "Failed to commit to action.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleToggleComplete = async (userActionId: string, isComplete: boolean) => {
    setLoadingId(userActionId);
    try {
      const res = await toggleActionCompleteAction(userActionId, isComplete);
      if (res.success) {
        onActionChange();
      } else {
        alert(res.error || "Failed to update action status.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteCommitment = async (userActionId: string) => {
    setLoadingId(userActionId);
    try {
      const res = await deleteUserActionAction(userActionId);
      if (res.success) {
        onActionChange();
      } else {
        alert(res.error || "Failed to delete commitment.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    const diff = difficulty.toLowerCase();
    if (diff === "easy") {
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    } else if (diff === "medium") {
      return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    }
    return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-200">Reduction Hub</h3>
            <p className="text-xs text-slate-400">Personalized insights and carbon reduction checklists.</p>
          </div>
          <Leaf className="h-5 w-5 text-emerald-400" />
        </div>

        {/* Custom Tab Selection */}
        <div className="flex border-b border-slate-800 mb-6 gap-4">
          <button
            onClick={() => setActiveTab("insights")}
            className={`pb-2.5 text-sm font-semibold transition-colors focus:outline-none border-b-2 ${
              activeTab === "insights"
                ? "text-emerald-400 border-emerald-400"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            Insights
          </button>
          <button
            onClick={() => setActiveTab("available")}
            className={`pb-2.5 text-sm font-semibold transition-colors focus:outline-none border-b-2 ${
              activeTab === "available"
                ? "text-emerald-400 border-emerald-400"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            Initiatives
          </button>
          <button
            onClick={() => setActiveTab("commitments")}
            className={`pb-2.5 text-sm font-semibold transition-colors focus:outline-none border-b-2 ${
              activeTab === "commitments"
                ? "text-emerald-400 border-emerald-400"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            My Checklists ({userActions.length})
          </button>
        </div>

        {/* Tab 1: AI Insights */}
        {activeTab === "insights" && (
          <div className="space-y-4">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl flex items-start gap-3 hover:border-slate-800 transition-all duration-300"
              >
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 shrink-0 mt-0.5">
                  <Star className="h-4 w-4 fill-emerald-400/20" />
                </div>
                <p className="text-xs leading-relaxed text-slate-300 font-medium">
                  {insight}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Available Initiatives */}
        {activeTab === "available" && (
          <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
            {availableActions.map((action) => {
              const committed = isCommitted(action.id);
              return (
                <div
                  key={action.id}
                  className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-slate-850 transition-all duration-300 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-200">{action.title}</h4>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getDifficultyBadge(action.difficulty)}`}>
                          {action.difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{action.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-900/60">
                    <span className="text-xs text-emerald-400/90 font-semibold">
                      Saves {action.savings} kg CO₂e/mo
                    </span>
                    <button
                      onClick={() => handleCommit(action.id)}
                      disabled={committed || loadingId === action.id}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-all duration-300 flex items-center gap-1.5 ${
                        committed
                          ? "bg-slate-900 text-slate-500 border-slate-850 cursor-default"
                          : "bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border-emerald-500/20 hover:border-transparent"
                      }`}
                    >
                      {loadingId === action.id ? (
                        <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
                      ) : committed ? (
                        "Committed"
                      ) : (
                        "Commit to Action"
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: User Commitments Checklist */}
        {activeTab === "commitments" && (
          <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
            {userActions.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-850 rounded-xl">
                <CheckSquare className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-400">Checklist is empty</h4>
                <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto mt-1">
                  Commit to items in the Initiatives tab to populate your tracker.
                </p>
              </div>
            ) : (
              userActions.map((ua) => {
                const isCompleted = ua.status === "completed";
                return (
                  <div
                    key={ua.id}
                    className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-slate-800 transition-all duration-300 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleComplete(ua.id, !isCompleted)}
                        disabled={loadingId === ua.id}
                        className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5 transition-colors focus:outline-none mt-0.5"
                        aria-label={isCompleted ? "Mark action as incomplete" : "Mark action as complete"}
                      >
                        {isCompleted ? (
                          <CheckSquare className="h-5 w-5 text-emerald-400 fill-emerald-400/10" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-500" />
                        )}
                      </button>
                      <div>
                        <h4 className={`text-sm font-bold leading-tight ${isCompleted ? "line-through text-slate-500" : "text-slate-200"}`}>
                          {ua.action.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-emerald-400/90 font-medium">
                            {ua.action.savings} kg CO₂e saved
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteCommitment(ua.id)}
                      disabled={loadingId === ua.id}
                      className="p-1.5 bg-slate-900 hover:bg-rose-950/30 text-slate-500 hover:text-rose-400 border border-slate-850 hover:border-rose-900/60 rounded transition-colors"
                      aria-label="Remove action commitment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {userActions.some((ua) => ua.status === "completed") && (
        <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-3 animate-pulse">
          <Award className="h-8 w-8 text-emerald-400 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-emerald-400">Carbon Champion!</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">
              You are actively preventing carbon emissions. Check out your avoided emissions card!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
