"use client";

import React, { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { demoStore } from "@/lib/store/demo-store";
import { formatINR } from "@/lib/engines/calculation-engine";
import { RegulatoryProvenance } from "@/components/shared/RegulatoryProvenance";
import {
  ArrowLeft,
  Calculator,
  ShieldCheck,
  FileCheck,
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
} from "lucide-react";

export default function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  // Find transaction
  const txn = demoStore.transactions.find(
    (t) => t.transactionId.toLowerCase() === id.toLowerCase()
  );

  if (!txn) {
    return (
      <AppShell>
        <div className="p-12 text-center">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Transaction Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Could not find record for ID: <span className="font-mono">{id}</span>
          </p>
          <Link
            href="/transactions"
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
          >
            Back to Transactions
          </Link>
        </div>
      </AppShell>
    );
  }

  // Find calculation result
  const calc = demoStore.calculatedItems.find(
    (c) => c.transactionId.toLowerCase() === txn.transactionId.toLowerCase()
  );

  // Find applicable rule version
  const rule = demoStore.ruleVersions.find((r) => r.versionCode === calc?.ruleVersionCode);

  return (
    <AppShell>
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/transactions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Transactions</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Transaction State:</span>
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Validated & Calculated
          </span>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
                {txn.transactionId}
              </h1>
              {rule && (
                <RegulatoryProvenance
                  versionCode={rule.versionCode}
                  verificationStatus={rule.verificationStatus}
                  sourceDocumentTitle={rule.sourceDocumentTitle}
                  sourceGazetteRef={rule.sourceGazetteRef}
                  sourceNotificationNo={rule.sourceNotificationNo}
                  sourceDocumentDate={rule.sourceDocumentDate}
                  effectiveFrom={rule.effectiveFrom}
                  effectiveTo={rule.effectiveTo}
                  interpretationNotes={rule.interpretationNotes}
                />
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Platform Payout Settled on {txn.transactionDate} • Worker ID:{" "}
              <span className="font-mono font-medium text-slate-700">{txn.workerId}</span>
            </p>
          </div>

          <div className="text-left md:text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Final Statutory Welfare Cess
            </p>
            <p className="text-2xl font-black text-slate-900 font-mono">
              {calc ? formatINR(calc.welfareFee) : "—"}
            </p>
            {calc?.capApplied && (
              <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300">
                Vehicle Cap Applied (Max {formatINR(calc.capAmount || 0)})
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left 2 Columns: The Step-by-Step Explainability Panel ── */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-600" />
                <span>Deterministic Calculation Explanation Chain</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every calculation step is auditable, deterministic, and tied to an immutable rule version.
              </p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              Engine v1.0
            </span>
          </div>

          {calc ? (
            <div className="space-y-3 text-xs">
              {calc.calculationDetail.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="calc-step-row flex items-start justify-between py-2 border-b border-slate-50 gap-4"
                >
                  <div className="flex-1">
                    <span className="text-slate-500 font-medium block">{step.label}</span>
                    {step.note && (
                      <span className="text-[11px] text-slate-400 mt-0.5 block font-mono">
                        {step.note}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-900 font-mono text-sm">
                      {step.display}
                    </span>
                  </div>
                </div>
              ))}

              {/* Final Highlighted Summary Block */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Net Welfare Cess Liability
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {calc.capApplied
                      ? `Uncapped fee ${formatINR(calc.baseFee)} exceeded ${calc.vehicleType} cap of ${formatINR(calc.capAmount || 0)}`
                      : `Rate of ${(calc.rate * 100).toFixed(2)}% applied directly on payout base`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold font-mono text-slate-900">
                    {formatINR(calc.welfareFee)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Calculation not available for this record.</p>
          )}
        </div>

        {/* ── Right Column: Rule Provenance & Legal Context ── */}
        <div className="space-y-6">
          {/* Rule Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Applicable Legal Rule
            </h3>

            {rule ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">Rule Version Code</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {rule.versionCode}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px] block">Verification Status</span>
                  <div className="mt-1">
                    <RegulatoryProvenance
                      versionCode={rule.versionCode}
                      verificationStatus={rule.verificationStatus}
                      sourceDocumentTitle={rule.sourceDocumentTitle}
                      sourceGazetteRef={rule.sourceGazetteRef}
                      sourceNotificationNo={rule.sourceNotificationNo}
                      sourceDocumentDate={rule.sourceDocumentDate}
                      effectiveFrom={rule.effectiveFrom}
                      effectiveTo={rule.effectiveTo}
                      interpretationNotes={rule.interpretationNotes}
                    />
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px] block">Sector & Vehicle Scope</span>
                  <span className="font-medium text-slate-800 capitalize">
                    {rule.sector || "All Sectors"} • {rule.vehicleType || "All Vehicles"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px] block">Statutory Parameter</span>
                  <p className="font-medium text-slate-800">
                    {(parseFloat(rule.rate) * 100).toFixed(2)}% fee with{" "}
                    {rule.cap ? `${formatINR(parseFloat(rule.cap))} cap` : "no cap"}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <Link
                    href={`/rule-versions`}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    View Version Lifecycle History →
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No rule version mapped.</p>
            )}
          </div>

          {/* Audit Trail Context */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Audit Integrity
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This calculation was recorded deterministically in Calculation Run #CR-001. Historical calculation runs permanently freeze and link the exact rule version applied.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
