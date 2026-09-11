"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { demoStore, DemoRuleVersion } from "@/lib/store/demo-store";
import { formatINR } from "@/lib/engines/calculation-engine";
import { RegulatoryProvenance } from "@/components/shared/RegulatoryProvenance";
import {
  History,
  Lock,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileText,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function RuleVersionsPage() {
  const [rules] = useState<DemoRuleVersion[]>(demoStore.ruleVersions);

  const getLifecycleBadge = (status: string, legalStatus?: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Lock className="w-3 h-3 text-emerald-700" /> Active (Immutable)
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <CheckCircle2 className="w-3 h-3 text-blue-700" /> Approved (Scheduled)
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-700" /> Draft
          </span>
        );
      case "superseded":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
            Superseded
          </span>
        );
    }
  };

  const getLegalStatusBadge = (status?: string) => {
    switch (status) {
      case "UNDER_INTERIM_ORDER":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            Escrow Ordered
          </span>
        );
      case "UNDER_CHALLENGE":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            Under Challenge
          </span>
        );
      case "REQUIRES_REVIEW":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            Review Required
          </span>
        );
      case "ACTIVE":
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Active
          </span>
        );
    }
  };

  return (
    <AppShell>
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <span>Immutable Rule Version Registry</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Append-only auditable lifecycle state machine: DRAFT → APPROVED → ACTIVE → SUPERSEDED. Active rules cannot be mutated.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/monitor"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Simulate Regulatory Change →</span>
          </Link>
        </div>
      </div>

      {/* ── State Machine Notice ── */}
      <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl text-xs mb-6 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>
            <strong>Immutability Guarantee:</strong> Historical calculations are permanently linked to the exact rule version code active at execution time. Changing a rate requires creating a new version.
          </span>
        </div>
      </div>

      {/* ── Rule Versions Table ── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Version Code</th>
                <th className="py-3 px-3">Sector & Vehicle</th>
                <th className="py-3 px-3">Statutory Rate</th>
                <th className="py-3 px-3">Transaction Cap</th>
                <th className="py-3 px-3">Effective Range</th>
                <th className="py-3 px-3">Lifecycle State</th>
                <th className="py-3 px-3">Legal Status</th>
                <th className="py-3 px-4">Legal Provenance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rules.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    <span className="text-indigo-600">{r.versionCode}</span>
                    <span className="block text-[10px] text-slate-400 font-normal">
                      v{r.versionNumber}.0
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-800 capitalize">
                      {r.sector || "All Sectors"}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      Vehicle: {r.vehicleType || "All Vehicles"}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    {(parseFloat(r.rate) * 100).toFixed(2)}%
                  </td>

                  <td className="py-3 px-3 font-mono">
                    {r.cap ? (
                      <span className="font-bold text-slate-900">{formatINR(parseFloat(r.cap))}</span>
                    ) : (
                      <span className="text-slate-400">No Cap</span>
                    )}
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                    {r.effectiveFrom} → {r.effectiveTo || "Present"}
                  </td>

                  <td className="py-3 px-3">{getLifecycleBadge(r.lifecycleStatus, r.legalStatus)}</td>

                  <td className="py-3 px-3">{getLegalStatusBadge(r.legalStatus)}</td>

                  <td className="py-3 px-4">
                    <RegulatoryProvenance
                      versionCode={r.versionCode}
                      verificationStatus={r.verificationStatus}
                      sourceDocumentTitle={r.sourceDocumentTitle}
                      sourceGazetteRef={r.sourceGazetteRef}
                      sourceNotificationNo={r.sourceNotificationNo}
                      sourceDocumentDate={r.sourceDocumentDate}
                      effectiveFrom={r.effectiveFrom}
                      effectiveTo={r.effectiveTo}
                      interpretationNotes={r.interpretationNotes}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
