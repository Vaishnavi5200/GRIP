"use client";

import React from "react";
import { ProposedRuleExtraction } from "@/lib/engines/regulatory-types";
import { formatINR } from "@/lib/engines/calculation-engine";
import {
  GitCompare,
  Sparkles,
  ShieldAlert,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Info,
  Zap,
} from "lucide-react";

export interface RuleDiffViewProps {
  proposal: ProposedRuleExtraction;
  onSimulateClick?: () => void;
  isSimulating?: boolean;
  /** If true, show "CACHED INTERPRETATION" fallback banner */
  isFallback?: boolean;
  fallbackReason?: string;
}

export function RuleDiffView({
  proposal,
  onSimulateClick,
  isSimulating = false,
  isFallback = false,
  fallbackReason,
}: RuleDiffViewProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
      {/* ── Synthetic / Fallback Banner ── */}
      {proposal.isSyntheticScenario && (
        <div className="px-5 pt-3 pb-0">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <span className="text-[10.5px] font-bold text-amber-800 block">
                SYNTHETIC SCENARIO — Real Legal Basis
              </span>
              <span className="text-[10.5px] text-amber-700">
                {proposal.syntheticScenarioLabel?.realLegalBasis}
              </span>
            </div>
          </div>
        </div>
      )}

      {isFallback && (
        <div className="px-5 pt-3 pb-0">
          <div className="bg-slate-100 border border-slate-300 rounded-lg px-3.5 py-2 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-slate-600 mt-0.5 shrink-0" />
            <span className="text-[10.5px] text-slate-600">
              <strong>CACHED INTERPRETATION</strong> — {fallbackReason || "Live AI extraction unavailable. Pre-computed interpretation displayed."}
            </span>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center flex-wrap gap-2">
            <GitCompare className="w-4 h-4 text-indigo-600 shrink-0" />
            <h3 className="font-bold text-slate-900 text-xs tracking-tight">
              Regulatory Change Diff: {proposal.previousRuleCode} → Proposed Rule
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                proposal.confidence === "HIGH"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                  : proposal.confidence === "MEDIUM"
                  ? "bg-amber-100 text-amber-800 border-amber-200"
                  : "bg-rose-100 text-rose-800 border-rose-200"
              }`}
            >
              AI Confidence: {proposal.confidence}
            </span>
            {!proposal.schemaValid && (
              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-rose-100 text-rose-800 border border-rose-200">
                ⚠ Schema Validation Failed
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Structured delta extracted from: {proposal.documentTitle}
          </p>
        </div>

        {onSimulateClick && (
          <button
            type="button"
            onClick={onSimulateClick}
            disabled={isSimulating || !proposal.schemaValid}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSimulating ? "Simulating Across 5,000 Txns..." : "Simulate Impact on 5,000 Txns →"}</span>
          </button>
        )}
      </div>

      {/* ── AI Interpretation Narrative ── */}
      {proposal.interpretationNarrative && (
        <div className="px-5 pt-4 pb-0">
          <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-1">
              AI Interpretation Narrative
            </span>
            <p className="text-[11.5px] text-slate-700 leading-relaxed">
              {proposal.interpretationNarrative}
            </p>
            {proposal.confidenceRationale && (
              <p className="text-[10.5px] text-slate-500 mt-1 italic">
                Confidence rationale: {proposal.confidenceRationale.notes}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Side-by-Side Comparison Matrix ── */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Previous Active Rule */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
              Current Active Rule Version
            </span>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
              {proposal.previousRuleCode}
            </span>
          </div>

          <div className="space-y-2 font-mono text-[11.5px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">Statutory Rate:</span>
              <span className="font-bold text-slate-800">
                {(proposal.previousRate * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">Transaction Cap:</span>
              <span className="font-bold text-slate-800">
                {proposal.previousCap ? formatINR(proposal.previousCap) : "No Cap"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">Applicable Scope:</span>
              <span className="font-semibold text-slate-800 capitalize font-sans">
                {proposal.sector} ({proposal.vehicleType || "All Vehicles"})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">Legal-Op State:</span>
              <span className="font-semibold text-emerald-700 font-sans">ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Proposed Rule Version */}
        <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
            <span className="font-bold text-[11px] uppercase tracking-wider text-indigo-900">
              Proposed Rule (AI Extracted)
            </span>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-600 text-white">
              PROPOSED
            </span>
          </div>

          <div className="space-y-2 font-mono text-[11.5px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">Statutory Rate:</span>
              <span className="font-bold text-indigo-700">
                {(proposal.proposedRate * 100).toFixed(2)}%
                <span className="text-[10px] text-amber-700 ml-1 font-sans">
                  ({proposal.proposedRate > proposal.previousRate ? "+" : ""}
                  {((proposal.proposedRate - proposal.previousRate) * 100).toFixed(2)}%)
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">Transaction Cap:</span>
              <span className="font-bold text-indigo-700">
                {proposal.proposedCap ? formatINR(proposal.proposedCap) : "No Cap"}
                {proposal.previousCap && proposal.proposedCap && (
                  <span className="text-[10px] text-amber-700 ml-1 font-sans">
                    (+{formatINR(proposal.proposedCap - proposal.previousCap)})
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">Effective Date:</span>
              <span className="font-bold text-slate-900 font-sans">
                {proposal.effectiveDate}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">AI-Proposed State:</span>
              <span className={`font-semibold font-sans text-[10.5px] ${
                proposal.aiProposedState === "ACTIVE"
                  ? "text-emerald-700"
                  : proposal.aiProposedState === "REQUIRES_REVIEW"
                  ? "text-amber-700"
                  : "text-purple-700"
              }`}>
                {proposal.aiProposedState || proposal.legalStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Detected Changes + Potential Inconsistencies ── */}
      <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Change Deltas */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Detected Parameter Changes:
          </span>
          {proposal.changeHighlights.map((chg, idx) => (
            <div key={idx} className="flex items-center justify-between text-[11px]">
              <span className="text-slate-600 font-medium">{chg.field}:</span>
              <span className="font-mono font-semibold text-slate-800">
                {chg.oldValue} →{" "}
                <strong
                  className={
                    chg.impact === "increase"
                      ? "text-amber-700"
                      : chg.impact === "decrease"
                      ? "text-emerald-700"
                      : "text-indigo-700"
                  }
                >
                  {chg.newValue}
                </strong>
              </span>
            </div>
          ))}
        </div>

        {/* Potential Inconsistencies + Human Review Notice */}
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1.5 text-amber-950">
          <div className="flex items-center gap-1.5 font-bold text-[10.5px] uppercase tracking-wider text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Human Review Required Prior to Activation</span>
          </div>
          <p className="text-[11px] text-slate-700 leading-relaxed">{proposal.summary}</p>

          {(proposal.potentialInconsistencies?.length ?? 0) > 0 && (
            <div className="space-y-1 pt-1 border-t border-amber-200/60">
              <span className="text-[10px] font-bold text-amber-800 block">
                AI-Flagged Potential Inconsistencies (NOT confirmed conflicts):
              </span>
              {proposal.potentialInconsistencies!.map((inc, idx) => (
                <div key={idx} className="flex items-start gap-1">
                  <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                    inc.severity === "HIGH"
                      ? "bg-rose-100 text-rose-800"
                      : inc.severity === "MEDIUM"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {inc.severity}
                  </span>
                  <span className="text-[10.5px] text-slate-700">{inc.description}</span>
                </div>
              ))}
            </div>
          )}

          {proposal.ambiguities.length > 0 && (proposal.potentialInconsistencies?.length ?? 0) === 0 && (
            <p className="text-[10.5px] text-amber-800 italic pt-1 border-t border-amber-200/60">
              Ambiguity: {proposal.ambiguities[0]}
            </p>
          )}
        </div>
      </div>

      {/* ── Recommended Action (from AI) ── */}
      {proposal.recommendedAction && (
        <div className="px-5 pb-5">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                <Zap className="w-3 h-3 text-indigo-500" />
                <span>AI-Recommended Action</span>
              </span>
              <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${
                proposal.recommendedAction.urgency === "IMMEDIATE"
                  ? "bg-rose-100 text-rose-800"
                  : proposal.recommendedAction.urgency === "BEFORE_EFFECTIVE_DATE"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-600"
              }`}>
                {proposal.recommendedAction.urgency.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-800">
              {proposal.recommendedAction.title}
            </p>
            <div className="space-y-0.5">
              {proposal.recommendedAction.steps.map((step, idx) => (
                <div key={idx} className="text-[10.5px] text-slate-600 flex items-start gap-1">
                  <span className="text-indigo-400 font-bold shrink-0">{idx + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 italic border-t border-slate-100 pt-1">
              Basis: {proposal.recommendedAction.basis}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
