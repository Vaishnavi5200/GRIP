"use client";

import React from "react";
import { ProposedRuleExtraction } from "@/lib/engines/regulatory-types";
import { formatINR } from "@/lib/engines/calculation-engine";
import {
  GitCompare,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  FileText,
  Clock,
  ExternalLink,
  Layers,
  AlertTriangle,
} from "lucide-react";

export interface RuleDiffViewProps {
  proposal: ProposedRuleExtraction;
  onSimulateClick?: () => void;
  isSimulating?: boolean;
}

export function RuleDiffView({
  proposal,
  onSimulateClick,
  isSimulating = false,
}: RuleDiffViewProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
      {/* Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-xs tracking-tight">
              Regulatory Change Diff: {proposal.previousRuleCode} → Proposed Rule
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold text-[10px] border border-indigo-200">
              {(proposal.confidenceScore * 100).toFixed(0)}% AI Confidence
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Structured delta extracted from: {proposal.documentTitle}
          </p>
        </div>

        {onSimulateClick && (
          <button
            type="button"
            onClick={onSimulateClick}
            disabled={isSimulating}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSimulating ? "Simulating Across 5,000 Txns..." : "Simulate Impact on 5,000 Txns →"}</span>
          </button>
        )}
      </div>

      {/* Side-by-Side Comparison Matrix */}
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
              <span className="text-slate-500 font-sans">Legal Status:</span>
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
              KA-2026-10-PROPOSED
            </span>
          </div>

          <div className="space-y-2 font-mono text-[11.5px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">Statutory Rate:</span>
              <span className="font-bold text-indigo-700">
                {(proposal.proposedRate * 100).toFixed(2)}%
                <span className="text-[10px] text-amber-700 ml-1 font-sans">
                  (+{((proposal.proposedRate - proposal.previousRate) * 100).toFixed(2)}%)
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
              <span className="text-slate-500 font-sans">Legal Status:</span>
              <span className="font-semibold text-purple-800 font-sans">
                {proposal.legalStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Highlights & Detected Ambiguities */}
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
                {chg.oldValue} → <strong className="text-indigo-700">{chg.newValue}</strong>
              </span>
            </div>
          ))}
        </div>

        {/* Provenance & Ambiguity Notes */}
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1.5 text-amber-950">
          <div className="flex items-center gap-1.5 font-bold text-[10.5px] uppercase tracking-wider text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Human Review Required Prior to Activation</span>
          </div>
          <p className="text-[11px] text-slate-700 leading-relaxed">
            {proposal.summary}
          </p>
          {proposal.ambiguities.length > 0 && (
            <p className="text-[10.5px] text-amber-800 italic pt-1 border-t border-amber-200/60">
              Ambiguity Flag: {proposal.ambiguities[0]}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
