"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { demoStore } from "@/lib/store/demo-store";
import { formatINR, runScenario, ScenarioResult } from "@/lib/engines/calculation-engine";
import { resolveApplicableRule } from "@/lib/engines/rule-engine";
import {
  Calculator,
  Layers,
  Sliders,
  Play,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function CalculationsPage() {
  const [calcs] = useState(demoStore.calculatedItems);
  const totalPayout = calcs.reduce((s, c) => s + c.payout, 0);
  const totalWelfareFee = calcs.reduce((s, c) => s + c.welfareFee, 0);
  const cappedCount = calcs.filter((c) => c.capApplied).length;

  // ── Scenario Modeler State ──
  const [proposedRatePct, setProposedRatePct] = useState(1.5); // 1.5%
  const [proposedCap, setProposedCap] = useState<number | null>(1.5); // ₹1.50
  const [payoutGrowthPct, setPayoutGrowthPct] = useState(10); // +10%
  const [scenarioResult, setScenarioResult] = useState<ScenarioResult | null>(null);

  const baselineRule = demoStore.ruleVersions[1]; // KA-2026-02-RH-4W
  const activeRules = demoStore.ruleVersions.filter((r) => r.lifecycleStatus === "active");

  const handleRunScenario = () => {
    // Re-run the real calculation engine with scenario parameters!
    // NEVER multiply by an arbitrary number — actual calculation engine executes per transaction.
    const inputs = demoStore.transactions.map((t) => ({
      transactionId: t.transactionId,
      workerId: t.workerId,
      stateCode: t.stateCode,
      sector: t.sector,
      vehicleType: t.vehicleType,
      payout: t.payout,
      transactionDate: t.transactionDate,
    }));

    const result = runScenario(
      inputs,
      baselineRule,
      {
        proposedRate: proposedRatePct / 100,
        proposedCap: proposedCap,
        payoutGrowthFactor: 1 + payoutGrowthPct / 100,
      },
      (query) =>
        resolveApplicableRule(
          {
            stateCode: query.stateCode,
            sector: query.sector,
            vehicleType: query.vehicleType,
            transactionDate: query.transactionDate,
          },
          activeRules
        )
    );

    setScenarioResult(result);
  };

  return (
    <AppShell>
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-600" />
            <span>Deterministic Calculation Engine</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
              Run #CR-2026-Q2
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transaction-level fee calculations executed under Karnataka sector/vehicle rule versions (KA-2026-02).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/transactions"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold"
          >
            Inspect Transaction Line Items
          </Link>
        </div>
      </div>

      {/* ── Run Overview Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs border-l-4 border-l-indigo-600">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Total Welfare Cess Liability
          </p>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">
            {formatINR(totalWelfareFee)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Effective aggregate fee: {((totalWelfareFee / totalPayout) * 100).toFixed(3)}%
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs border-l-4 border-l-emerald-600">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Eligible Platform Payouts
          </p>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">
            {formatINR(totalPayout)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Across {calcs.length.toLocaleString()} processed trips
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs border-l-4 border-l-amber-500">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Vehicle Caps Triggered
          </p>
          <p className="text-2xl font-black text-amber-700 font-mono mt-1">
            {cappedCount.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {((cappedCount / calcs.length) * 100).toFixed(1)}% of trips absorbed by cap
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs border-l-4 border-l-blue-500">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Active Rule Versions
          </p>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">
            5 Versions
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            KA-2026-02 (2W, 4W, LCV, Food)
          </p>
        </div>
      </div>

      {/* ── Scenario Modeler ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs mb-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Liability Scenario Simulation (Engine Re-Run)</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                Deterministic Rule Recalculation
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate proposed rate changes, vehicle cap modifications, or trip volume variations by re-executing the active calculation engine.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Proposed Welfare Fee Rate: <span className="text-indigo-600 font-mono font-bold">{proposedRatePct}%</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={proposedRatePct}
              onChange={(e) => setProposedRatePct(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0.5%</span>
              <span>1.0% (Current)</span>
              <span>3.0%</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Per-Transaction Cap:{" "}
              <span className="text-indigo-600 font-mono font-bold">
                {proposedCap ? formatINR(proposedCap) : "No Cap"}
              </span>
            </label>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.25"
              value={proposedCap || 1.0}
              onChange={(e) => setProposedCap(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>₹0.50 (2W)</span>
              <span>₹1.00 (Current 4W)</span>
              <span>₹5.00</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payout Volume Growth: <span className="text-indigo-600 font-mono font-bold">+{payoutGrowthPct}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={payoutGrowthPct}
              onChange={(e) => setPayoutGrowthPct(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0%</span>
              <span>+25%</span>
              <span>+50%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500">
            Evaluates all {calcs.length.toLocaleString()} platform transactions through the pure calculation engine.
          </span>
          <button
            type="button"
            onClick={handleRunScenario}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simulate Scenario Impact</span>
          </button>
        </div>

        {/* ── Scenario Result Output ── */}
        {scenarioResult && (
          <div className="mt-6 p-5 rounded-xl bg-slate-50 border border-slate-200 animate-in fade-in duration-150">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
              Scenario Simulation Results
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  Current Baseline Liability
                </span>
                <span className="text-xl font-bold text-slate-900 font-mono">
                  {formatINR(scenarioResult.baselineTotalFee)}
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  Projected Scenario Liability
                </span>
                <span className="text-xl font-bold text-indigo-700 font-mono">
                  {formatINR(scenarioResult.proposedTotalFee)}
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  Variance Exposure Impact
                </span>
                <span
                  className={`text-xl font-bold font-mono ${
                    scenarioResult.feeDifference > 0 ? "text-rose-600" : "text-emerald-700"
                  }`}
                >
                  {scenarioResult.feeDifference > 0 ? "+" : ""}
                  {formatINR(scenarioResult.feeDifference)} ({scenarioResult.feeChangePercent}%)
                </span>
              </div>
            </div>

            {scenarioResult.capImpactNote && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 mb-3">
                <strong className="block mb-0.5">Cap Absorption Dynamic:</strong>
                {scenarioResult.capImpactNote}
              </div>
            )}

            <div className="text-[11px] text-slate-500 space-y-1">
              <span className="font-semibold block">Simulation Assumptions:</span>
              <ul className="list-disc list-inside space-y-0.5">
                {scenarioResult.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
