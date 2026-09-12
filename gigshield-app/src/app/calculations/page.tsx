"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { demoStore } from "@/lib/store/demo-store";
import { formatINR } from "@/lib/engines/calculation-engine";
import { TransactionBindingDrawer } from "@/components/shared/TransactionBindingDrawer";
import {
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Info,
} from "lucide-react";

export default function ImpactAnalysisPage() {
  const [showAffectedOnly, setShowAffectedOnly] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTxnBinding, setSelectedTxnBinding] = useState<any>(null);

  // Compute impact deterministically from the 5,000 transactions
  const transactions = demoStore.transactions;
  const inScopeTxns = useMemo(
    () => transactions.filter((t) => t.stateCode === "KA" && t.sector === "ride-hailing" && t.vehicleType === "4W"),
    [transactions]
  );

  const affectedCount = inScopeTxns.length; // 823
  const currentRate = 0.01; // 1.00%
  const currentCap = 1.00; // ₹1.00
  const proposedRate = 0.015; // 1.50%
  const proposedCap = 1.50; // ₹1.50

  const currentLiability = useMemo(
    () => inScopeTxns.reduce((sum, t) => sum + Math.min(t.payout * currentRate, currentCap), 0),
    [inScopeTxns]
  );

  const proposedLiability = useMemo(
    () => inScopeTxns.reduce((sum, t) => sum + Math.min(t.payout * proposedRate, proposedCap), 0),
    [inScopeTxns]
  );

  const netChange = proposedLiability - currentLiability; // +₹413.50

  // Filtered transactions for drill-down table
  const displayedTxns = useMemo(() => {
    const pool = showAffectedOnly ? inScopeTxns : transactions;
    return pool.filter(
      (t) =>
        search === "" ||
        t.transactionId.toLowerCase().includes(search.toLowerCase()) ||
        t.workerId.toLowerCase().includes(search.toLowerCase())
    );
  }, [showAffectedOnly, inScopeTxns, transactions, search]);

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl pb-16">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1">
              Impact Analysis
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Regulatory Financial Impact
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic comparison of baseline rule vs proposed regulatory rate adjustment across 5,000 Karnataka platform trips.
            </p>
          </div>

          <Link
            href="/intelligence"
            className="self-start sm:self-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Review & Approve Rule →</span>
          </Link>
        </div>

        {/* ── Clean Financial Impact Card ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
          {/* Rate Comparison Header */}
          <div className="grid grid-cols-2 gap-4 pb-5 border-b border-slate-100">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 block">
                Current Rule (KA-2025-02-RH-4W)
              </span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-3xl font-black text-slate-800">1.00%</span>
                <span className="text-xs font-semibold text-slate-500">Cap: ₹1.00</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Active since 01-Jul-2025</span>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-200">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-indigo-700 block">
                Proposed Rule (KA-2026-10-RH-4W)
              </span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-3xl font-black text-indigo-700">1.50%</span>
                <span className="text-xs font-semibold text-indigo-600">Cap: ₹1.50</span>
              </div>
              <span className="text-[11px] text-indigo-500 mt-1 block">Staged for 01-Oct-2026</span>
            </div>
          </div>

          {/* Financial Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-[10.5px] font-bold text-slate-500 uppercase block">Affected Transactions</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block font-mono">
                {affectedCount.toLocaleString()}
              </span>
              <span className="text-[10.5px] text-slate-400">4W Motor Cabs</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-[10.5px] font-bold text-slate-500 uppercase block">Current Liability</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block font-mono">
                {formatINR(currentLiability)}
              </span>
              <span className="text-[10.5px] text-slate-400">Baseline ₹1.00/ride</span>
            </div>

            <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50">
              <span className="text-[10.5px] font-bold text-indigo-700 uppercase block">Proposed Liability</span>
              <span className="text-2xl font-black text-indigo-900 mt-1 block font-mono">
                {formatINR(proposedLiability)}
              </span>
              <span className="text-[10.5px] text-indigo-600">Projected ₹1.50/ride</span>
            </div>

            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/60">
              <span className="text-[10.5px] font-bold text-rose-700 uppercase block">Net Change</span>
              <span className="text-2xl font-black text-rose-700 mt-1 block font-mono">
                +{formatINR(netChange)}
              </span>
              <span className="text-[10.5px] text-rose-600 font-semibold">+50.2% fee delta</span>
            </div>
          </div>

          {/* Why? Explanation Callout */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start gap-3">
            <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            <div className="space-y-1 text-slate-700">
              <div className="font-bold text-slate-900 text-[12.5px]">
                Why are these transactions affected?
              </div>
              <p className="leading-relaxed">
                <strong>{affectedCount.toLocaleString()} Four-Wheeler (4W) passenger motor cab transactions</strong> in Karnataka matched the proposed rule scope. All 2W rides (₹0.50 cap) and food/delivery orders remain unaffected under the draft amendment.
              </p>
            </div>
          </div>
        </div>

        {/* ── Transaction Drill-Down Workspace ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Inspect In-Scope Transactions ({displayedTxns.length.toLocaleString()})
              </h2>
              <p className="text-xs text-slate-500">
                Every transaction fee is computed deterministically and tied to an auditable rule version.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search Trip ID / Worker..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none w-48"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowAffectedOnly(!showAffectedOnly)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  showAffectedOnly
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : "bg-white border-slate-200 text-slate-600"
                }`}
              >
                {showAffectedOnly ? "In-Scope Only (823)" : "All Transactions (5,000)"}
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-[420px]">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-xs border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Trip ID</th>
                    <th className="p-3">Worker</th>
                    <th className="p-3">Sector</th>
                    <th className="p-3 text-right">Platform Payout</th>
                    <th className="p-3 text-right">Current Fee (1%)</th>
                    <th className="p-3 text-right">Proposed Fee (1.5%)</th>
                    <th className="p-3 text-right">Net Delta</th>
                    <th className="p-3 text-center">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {displayedTxns.slice(0, 30).map((t) => {
                    const is4W = t.sector === "ride-hailing" && t.vehicleType === "4W";
                    const currentFee = is4W ? Math.min(t.payout * currentRate, currentCap) : Math.min(t.payout * 0.01, 0.5);
                    const proposedFee = is4W ? Math.min(t.payout * proposedRate, proposedCap) : currentFee;
                    const delta = proposedFee - currentFee;

                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-slate-900">{t.transactionId}</td>
                        <td className="p-3 text-slate-600">{t.workerId}</td>
                        <td className="p-3 font-sans capitalize text-slate-700">
                          {t.sector} ({t.vehicleType})
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900">{formatINR(t.payout)}</td>
                        <td className="p-3 text-right text-slate-600">{formatINR(currentFee)}</td>
                        <td className="p-3 text-right font-bold text-indigo-700">{formatINR(proposedFee)}</td>
                        <td className={`p-3 text-right font-bold ${delta > 0 ? "text-rose-600" : "text-slate-400"}`}>
                          {delta > 0 ? `+${formatINR(delta)}` : "—"}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedTxnBinding({
                                transactionId: t.transactionId,
                                workerId: t.workerId,
                                transactionDate: t.transactionDate,
                                sector: t.sector,
                                vehicleType: t.vehicleType,
                                payout: t.payout,
                                ruleVersionCode: is4W ? "KA-2026-10-RH-4W (Proposed)" : "KA-2025-02-RH-4W",
                                calculatedFee: proposedFee,
                                legalStatus: "ACTIVE",
                                evidence: {
                                  sourceDocumentId: "KAR-ACT-2025-72",
                                  sourceTitle: "Karnataka Platform Based Gig Workers Act, 2025",
                                  sourceType: "ACT",
                                  section: "Section 24",
                                  clause: "Rule 4(2) Rate Revision",
                                  quotedExcerpt: "Welfare cess rate adjustment for 4W motor cabs: 1.50% capped at ₹1.50.",
                                },
                                calculationSteps: [
                                  { label: "Platform Payout", value: formatINR(t.payout) },
                                  { label: "Proposed Rate", value: "1.50%" },
                                  { label: "Transaction Cap", value: "₹1.50" },
                                  { label: "Calculated Fee", value: formatINR(proposedFee) },
                                  { label: "Baseline Difference", value: `+${formatINR(delta)}` },
                                ],
                              })
                            }
                            className="px-2 py-0.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded bg-indigo-50/50 cursor-pointer"
                          >
                            Trace ↗
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <TransactionBindingDrawer
        isOpen={!!selectedTxnBinding}
        onClose={() => setSelectedTxnBinding(null)}
        data={selectedTxnBinding}
      />
    </AppShell>
  );
}
