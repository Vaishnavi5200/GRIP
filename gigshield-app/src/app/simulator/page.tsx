"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { demoStore } from "@/lib/store/demo-store";
import { formatINR } from "@/lib/engines/calculation-engine";
import { TransactionBindingDrawer } from "@/components/shared/TransactionBindingDrawer";
import {
  Sliders,
  Play,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Info,
} from "lucide-react";

export default function SimulatorPage() {
  const [ratePct, setRatePct] = useState("1.50");
  const [capINR, setCapINR] = useState("1.50");
  const [effectiveDate, setEffectiveDate] = useState("2026-10-01");
  const [hasRun, setHasRun] = useState(true);
  const [selectedTxnBinding, setSelectedTxnBinding] = useState<any>(null);

  // Deterministic simulation based on real 5,000 transactions
  const transactions = demoStore.transactions;
  const inScopeTxns = useMemo(
    () => transactions.filter((t) => t.stateCode === "KA" && t.sector === "ride-hailing" && t.vehicleType === "4W"),
    [transactions]
  );

  const affectedCount = inScopeTxns.length; // 823
  const currentRate = 0.01; // 1.00%
  const currentCap = 1.00; // ₹1.00

  const simRate = parseFloat(ratePct) / 100 || 0.015;
  const simCap = parseFloat(capINR) || 1.50;

  const currentLiability = useMemo(
    () => inScopeTxns.reduce((sum, t) => sum + Math.min(t.payout * currentRate, currentCap), 0),
    [inScopeTxns]
  );

  const projectedLiability = useMemo(
    () => inScopeTxns.reduce((sum, t) => sum + Math.min(t.payout * simRate, simCap), 0),
    [inScopeTxns, simRate, simCap]
  );

  const difference = projectedLiability - currentLiability;

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl pb-16">
        {/* ── Page Header ── */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1">
            Simulator
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            What-If Scenario Modeler
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Test hypothetical rate revisions, statutory caps, and policy schedules against your active transaction ledger.
          </p>
        </div>

        {/* ── Focused "WHAT IF THE RATE CHANGES?" Form Card ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              What if the rate changes?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Current Rate (Active Baseline)
              </label>
              <input
                type="text"
                value="1.00% (Cap: ₹1.00)"
                disabled
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-700 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-indigo-700 uppercase mb-1">
                Proposed Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={ratePct}
                onChange={(e) => setRatePct(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-indigo-200 focus:border-indigo-500 bg-indigo-50/20 font-mono font-bold text-indigo-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-indigo-700 uppercase mb-1">
                Transaction Cap (₹)
              </label>
              <input
                type="number"
                step="0.25"
                min="0.5"
                max="20"
                value={capINR}
                onChange={(e) => setCapINR(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-indigo-200 focus:border-indigo-500 bg-indigo-50/20 font-mono font-bold text-indigo-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Projected Effective Date
              </label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono font-semibold text-slate-800 outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setHasRun(true)}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Run simulation →</span>
            </button>
          </div>
        </div>

        {/* ── Focused Simulation Results Card ── */}
        {hasRun && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Simulation Results
                </h3>
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full font-mono">
                {affectedCount.toLocaleString()} transactions affected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[10.5px] font-bold text-slate-500 uppercase block">
                  Current Liability
                </span>
                <span className="text-2xl font-black text-slate-800 mt-1 block font-mono">
                  {formatINR(currentLiability)}
                </span>
                <span className="text-[10.5px] text-slate-400">Rate: 1.00% • Cap ₹1.00</span>
              </div>

              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40">
                <span className="text-[10.5px] font-bold text-indigo-700 uppercase block">
                  Projected Liability
                </span>
                <span className="text-2xl font-black text-indigo-900 mt-1 block font-mono">
                  {formatINR(projectedLiability)}
                </span>
                <span className="text-[10.5px] text-indigo-600">Rate: {ratePct}% • Cap ₹{capINR}</span>
              </div>

              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50">
                <span className="text-[10.5px] font-bold text-rose-700 uppercase block">
                  Difference
                </span>
                <span className="text-2xl font-black text-rose-700 mt-1 block font-mono">
                  +{formatINR(difference)}
                </span>
                <span className="text-[10.5px] text-rose-600 font-semibold">Net Exposure Delta</span>
              </div>
            </div>

            {/* Scope Summary Notice */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-start gap-2.5 text-slate-700">
              <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <div className="text-[11.5px] leading-relaxed">
                Deterministic calculation applied to <strong>{affectedCount.toLocaleString()} Four-Wheeler ride-hailing transactions</strong> in Karnataka. Two-wheeler and logistics transactions remain capped at their baseline rate under this simulation.
              </div>
            </div>
          </div>
        )}
      </div>

      <TransactionBindingDrawer
        isOpen={!!selectedTxnBinding}
        onClose={() => setSelectedTxnBinding(null)}
        data={selectedTxnBinding}
      />
    </AppShell>
  );
}
