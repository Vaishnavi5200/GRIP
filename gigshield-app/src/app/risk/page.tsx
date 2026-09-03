"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { demoStore } from "@/lib/store/demo-store";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  HelpCircle,
  TrendingUp,
  Award,
  Check,
  User,
  Calendar,
} from "lucide-react";

export default function RiskAndActionsPage() {
  const [healthScore, setHealthScore] = useState(demoStore.getComplianceHealthScore());
  const [actions, setActions] = useState(demoStore.actions);

  const handleCompleteAction = (actionId: string) => {
    const action = demoStore.actions.find((a) => a.id === actionId);
    if (action) {
      action.status = "completed";
      demoStore.logAudit(
        "action.completed",
        "action",
        actionId,
        `Marked compliance action '${action.title}' as completed.`
      );
      setActions([...demoStore.actions]);
      setHealthScore(demoStore.getComplianceHealthScore());
    }
  };

  return (
    <AppShell>
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            <span>Compliance Health Score & Remediation Engine</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Internal operational risk audit. Derived dynamically from real data, reconciliation variances, and deadline tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
            Formula v2.0 (Applicability-Aware Normalization)
          </span>
        </div>
      </div>

      {/* ── Top Score Showcase ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Score Ring / Number */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Internal Operational Risk Score
            </span>
            <div className="flex items-baseline gap-2 my-1">
              <span className="text-5xl font-black text-slate-900 font-mono tracking-tight">
                {healthScore.total}
              </span>
              <span className="text-sm font-semibold text-slate-400">/ 100</span>
            </div>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mt-1 ${
                healthScore.interpretation === "excellent"
                  ? "bg-emerald-100 text-emerald-800"
                  : healthScore.interpretation === "good"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {healthScore.interpretation.replace("_", " ")}
            </span>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              (Not a government rating • Operational risk indicator)
            </p>
          </div>

          {/* Top Remediation Actions */}
          <div className="md:col-span-2 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recommended Remediation Actions:
            </h2>
            <div className="space-y-2">
              {healthScore.topImprovementActions.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-slate-800">{item.action}</span>
                  </div>
                  <span className="font-bold text-emerald-700 font-mono shrink-0 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    +{item.potentialGain} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Score Components Breakdown ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Score Breakdown Across 6 Compliance Dimensions
            </h2>
            <p className="text-xs text-slate-500">
              Applicability-aware: Non-applicable areas (N/A) do not drag the score down.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {healthScore.components.map((comp) => (
            <div
              key={comp.name}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs text-slate-900">{comp.name}</h3>
                  <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.2 rounded bg-slate-200/70">
                    Weight: {(comp.weight * 100).toFixed(0)}%
                  </span>
                  {!comp.applicable && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                      N/A (Excluded)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    Potential Impact:{" "}
                    <strong className="text-emerald-700 font-mono">+{comp.potentialImpact} pts</strong>
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {comp.score} / 100
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    comp.score >= 80
                      ? "bg-emerald-600"
                      : comp.score >= 50
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${comp.score}%` }}
                />
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between text-[11px] text-slate-500 gap-1">
                <span>
                  <strong>Reason:</strong> {comp.reason}
                </span>
                <span className="text-indigo-700 font-medium">
                  <strong>Action:</strong> {comp.improvementAction}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── First-Class Action & Remediation Workflow ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Remediation & Compliance Action Board</span>
            </h2>
            <p className="text-xs text-slate-500">
              Concrete operational tasks to resolve risk exposure and statutory deadlines.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {actions.map((act) => (
            <div
              key={act.id}
              className={`p-4 rounded-xl border text-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                act.status === "completed"
                  ? "bg-slate-50/60 border-slate-200 opacity-70"
                  : act.priority === "critical"
                  ? "bg-rose-50/30 border-rose-200"
                  : "bg-white border-slate-200 shadow-2xs"
              }`}
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                      act.priority === "critical"
                        ? "bg-rose-100 text-rose-800"
                        : act.priority === "high"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {act.priority}
                  </span>
                  <h3 className="font-bold text-slate-900 text-xs">{act.title}</h3>
                  {act.status === "completed" && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Completed
                    </span>
                  )}
                </div>

                <p className="text-slate-600 text-[11px] leading-relaxed">{act.description}</p>

                <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-500" />
                    <strong>Impact:</strong> {act.estimatedImpact}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <strong>Owner:</strong> {act.assignedToName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <strong>Due:</strong> {act.dueDate}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {act.status !== "completed" && (
                  <button
                    type="button"
                    onClick={() => handleCompleteAction(act.id)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                )}
                {act.actionType === "reconciliation" && (
                  <Link
                    href="/reconciliation"
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs border border-indigo-200"
                  >
                    Open in Recon →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
