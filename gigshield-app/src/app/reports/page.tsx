"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { demoStore } from "@/lib/store/demo-store";
import { formatINR } from "@/lib/engines/calculation-engine";
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Calendar,
  Building2,
  ShieldCheck,
  FileCheck,
  Printer,
} from "lucide-react";

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false);
  const [generatedSuccess, setGeneratedSuccess] = useState(false);

  const calcs = demoStore.calculatedItems;
  const totalPayout = calcs.reduce((s, c) => s + c.payout, 0);
  const totalWelfareFee = calcs.reduce((s, c) => s + c.welfareFee, 0);
  const recon = demoStore.reconSummary || demoStore.runReconciliation();

  const handleDownloadCSV = () => {
    // Generate CSV data from calculations
    const headers = [
      "transaction_id",
      "worker_id",
      "state_code",
      "sector",
      "vehicle_type",
      "platform_payout",
      "fee_rate",
      "cap_applied",
      "statutory_welfare_fee",
      "rule_version_code",
      "legal_source_status",
    ];

    const rows = calcs.slice(0, 100).map((c) => [
      c.transactionId,
      c.stateCode,
      c.sector,
      c.vehicleType,
      c.payout,
      c.rate,
      c.capApplied ? "YES" : "NO",
      c.welfareFee,
      c.ruleVersionCode,
      "calculated",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `GigShield_Karnataka_Q2_2026_Statutory_Report_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    demoStore.logAudit(
      "report.downloaded",
      "report",
      "rep-ka-q2-2026",
      "Exported Karnataka Q2 Statutory Welfare Fee CSV report."
    );
  };

  const handleGenerateReport = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGeneratedSuccess(true);
      demoStore.logAudit(
        "report.generated",
        "report",
        "rep-ka-q2-2026",
        "Generated and locked Karnataka Gig Workers Act 2025 Q2 statutory compliance audit report."
      );
      setTimeout(() => setGeneratedSuccess(false), 3000);
    }, 600);
  };

  return (
    <AppShell>
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            <span>Statutory Compliance Reports & Snapshots</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-ready reporting for welfare fee remittance under the Karnataka Gig Workers Act, 2025 framework.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadCSV}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Line-Item CSV</span>
          </button>
        </div>
      </div>

      {/* ── Report Card Preview ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs mb-6 max-w-4xl mx-auto">
        <div className="border-b border-slate-200 pb-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Karnataka Labour Welfare Board • Schedule KBWWB-04
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">
              Quarterly Gig Worker Welfare Cess Compliance Report (Q2 2026)
            </h2>
            <p className="text-xs text-slate-500">
              Period: 01-Apr-2026 to 30-Jun-2026 • Reporting Jurisdiction: Karnataka (KA)
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Calculation Verified • Notified Rules (2025 Act)</span>
            </span>
          </div>
        </div>

        {/* Aggregates Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Platform Operator</span>
            <span className="font-semibold text-slate-900 block">{demoStore.org.name}</span>
            <span className="text-[10px] text-slate-400 font-mono">Reg: {demoStore.org.registrationNo}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Eligible Payout Base</span>
            <span className="font-bold text-slate-900 font-mono text-sm block">{formatINR(totalPayout)}</span>
            <span className="text-[10px] text-slate-400">{calcs.length.toLocaleString()} Platform Trips</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Total Welfare Cess</span>
            <span className="font-bold text-indigo-700 font-mono text-sm block">{formatINR(totalWelfareFee)}</span>
            <span className="text-[10px] text-slate-400">Sector & Vehicle Capped</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Reconciliation Status</span>
            <span className="font-bold text-emerald-700 block text-sm">{((recon.matchedCount / recon.totalRecords) * 100).toFixed(1)}% Matched</span>
            <span className="text-[10px] text-slate-400">{recon.matchedCount.toLocaleString()} Verified Records</span>
          </div>
        </div>

        {/* Legal Disclaimer Footnote */}
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-900 mb-6 leading-relaxed">
          <strong>Mandatory Notice:</strong> Calculations are generated under Karnataka Platform Based Gig Workers Welfare Rules, 2025 notified schedule. GigShield is an internal compliance operations system and does not directly file returns on government portals without authorized officer transmission.
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {generatedSuccess && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Report Snapshot Locked & Stored in Audit Trail
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={generating}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>{generating ? "Compiling Audit Data..." : "Review & Lock Report Snapshot"}</span>
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
