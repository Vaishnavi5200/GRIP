"use client";

import React from "react";
import { formatINR } from "@/lib/engines/calculation-engine";
import { LegalStatus, EvidenceCitation } from "@/lib/engines/regulatory-types";
import {
  X,
  FileCheck,
  ShieldCheck,
  Calculator,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Lock,
  Sparkles,
} from "lucide-react";

export interface TransactionBindingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    transactionId: string;
    workerId: string;
    transactionDate: string;
    sector: string;
    vehicleType: string;
    payout: number;
    ruleVersionCode: string;
    calculatedFee: number;
    legalStatus: LegalStatus;
    evidence: EvidenceCitation;
    calculationSteps: Array<{ label: string; value: string }>;
    appliedRate?: string;
    appliedCap?: string;
  } | null;
}

export function TransactionBindingDrawer({
  isOpen,
  onClose,
  data,
}: TransactionBindingDrawerProps) {
  if (!isOpen || !data) return null;

  const getStatusBadge = (status: LegalStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            ACTIVE (Enacted)
          </span>
        );
      case "UNDER_INTERIM_ORDER":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            UNDER INTERIM ORDER (Escrow)
          </span>
        );
      case "UNDER_CHALLENGE":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            UNDER CHALLENGE
          </span>
        );
      case "REQUIRES_REVIEW":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
            REQUIRES REVIEW (Draft)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-lg h-full bg-white shadow-2xl border-l border-slate-200 overflow-y-auto flex flex-col">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 sticky top-0 z-10">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Transaction-to-Regulation Binding</span>
            </span>
            <h2 className="text-base font-bold text-slate-900 font-mono mt-0.5">
              {data.transactionId}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-5 space-y-5 flex-1 text-xs">
          {/* Question Banner */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-indigo-950">
            <p className="font-semibold text-[11px] mb-1">
              “Which rule governs this transaction and why?”
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              GigShield deterministically binds every transaction to its active regulatory rule, applies the mathematical statutory calculation, and links to verified legal evidence.
            </p>
          </div>

          {/* Core Transaction Metadata */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-2.5">
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
              1. Ingested Transaction Fact
            </h3>
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Worker ID</span>
                <span className="font-mono font-bold text-slate-800">{data.workerId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Transaction Date</span>
                <span className="font-medium text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {data.transactionDate}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Sector & Vehicle</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {data.sector} ({data.vehicleType || "General"})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Gross Payout</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatINR(data.payout)}
                </span>
              </div>
            </div>
          </div>

          {/* Bound Rule Version */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
                2. Applicable Rule Version
              </h3>
              {getStatusBadge(data.legalStatus)}
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between font-mono font-bold text-xs text-indigo-700">
                <span>{data.ruleVersionCode}</span>
                <span className="text-[10px] text-slate-500 font-normal">Karnataka Act 2025</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Resolved by deterministic hierarchy: Exact Sector ({data.sector}) + Exact Vehicle ({data.vehicleType}).
              </p>
            </div>
          </div>

          {/* Step-by-Step Deterministic Math Breakdown */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-2.5">
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5 text-slate-500" />
              <span>3. Deterministic Fee Calculation</span>
            </h3>
            <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px]">
              {data.calculationSteps.map((step, idx) => (
                <div key={idx} className="flex items-center justify-between text-slate-700">
                  <span className="text-slate-500">{step.label}</span>
                  <span className="font-semibold text-slate-900">{step.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-indigo-900">
                <span>Final Statutory Welfare Fee:</span>
                <span className="text-sm text-indigo-700">{formatINR(data.calculatedFee)}</span>
              </div>
            </div>
          </div>

          {/* Legal Source Provenance & Evidence Citation */}
          <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50/40 shadow-2xs space-y-2.5">
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-indigo-900 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>4. Statutory Evidence & Provenance</span>
            </h3>
            <div className="space-y-2 text-[11px]">
              <div className="font-semibold text-slate-900">
                {data.evidence.sourceTitle}
              </div>
              <div className="flex flex-wrap gap-2 text-[10.5px] text-slate-600 font-mono">
                {data.evidence.section && (
                  <span className="px-2 py-0.5 bg-white border border-indigo-100 rounded">
                    {data.evidence.section}
                  </span>
                )}
                {data.evidence.clause && (
                  <span className="px-2 py-0.5 bg-white border border-indigo-100 rounded">
                    {data.evidence.clause}
                  </span>
                )}
              </div>
              {data.evidence.quotedExcerpt && (
                <blockquote className="p-2.5 bg-white border-l-2 border-indigo-500 rounded text-slate-700 italic text-[11px] leading-relaxed">
                  “{data.evidence.quotedExcerpt}”
                </blockquote>
              )}
              {data.evidence.sourceUrl && (
                <a
                  href={data.evidence.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline pt-1"
                >
                  <span>Verify Official Government Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">
            Deterministic Engine • Zero LLM Arithmetic
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
