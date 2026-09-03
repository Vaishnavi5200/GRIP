"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { demoStore } from "@/lib/store/demo-store";
import { ReconciliationItem } from "@/lib/engines/reconciliation-engine";
import { formatINR } from "@/lib/engines/calculation-engine";
import {
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Filter,
  Search,
  UploadCloud,
  Check,
  ChevronRight,
  ChevronLeft,
  XCircle,
  FileCheck2,
  ShieldAlert,
} from "lucide-react";

export default function ReconciliationPage() {
  const [reconSummary, setReconSummary] = useState(
    demoStore.reconSummary || demoStore.runReconciliation()
  );
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Selected item for resolution modal
  const [selectedItem, setSelectedItem] = useState<ReconciliationItem | null>(null);
  const [resolutionType, setResolutionType] = useState<
    "platform_correct" | "ledger_correct" | "escalated" | "waived"
  >("platform_correct");
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolveSuccess, setResolveSuccess] = useState(false);

  // Filter items
  const filteredItems = useMemo(() => {
    return reconSummary.items.filter((item) => {
      const matchSearch =
        search === "" ||
        item.transactionId.toLowerCase().includes(search.toLowerCase());

      const matchFilter =
        filterStatus === "all"
          ? true
          : filterStatus === "unresolved"
          ? item.status !== "matched" && !demoStore.isItemResolved(item.transactionId)
          : filterStatus === "mismatches"
          ? item.status !== "matched"
          : item.status === filterStatus;

      return matchSearch && matchFilter;
    });
  }, [reconSummary, filterStatus, search]);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginated = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    demoStore.resolveReconIssue(
      selectedItem.transactionId,
      resolutionType,
      resolutionNote || "Confirmed platform calculation is statutory authority."
    );

    setResolveSuccess(true);
    setTimeout(() => {
      setResolveSuccess(false);
      setSelectedItem(null);
      setResolutionNote("");
      // Refresh summary
      setReconSummary({ ...demoStore.runReconciliation() });
    }, 800);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "matched":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Matched
          </span>
        );
      case "payout_mismatch":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-300">
            <AlertTriangle className="w-3 h-3" /> Payout Mismatch
          </span>
        );
      case "fee_mismatch":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-300">
            <AlertTriangle className="w-3 h-3" /> Fee Mismatch
          </span>
        );
      case "full_mismatch":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-300">
            <XCircle className="w-3 h-3" /> Full Mismatch
          </span>
        );
      case "missing_from_ledger":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-300">
            <AlertCircle className="w-3 h-3" /> Missing in Ledger
          </span>
        );
      case "duplicate_in_ledger":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-300">
            <Clock className="w-3 h-3" /> Duplicate Review
          </span>
        );
      case "unexpected_in_ledger":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-300">
            <AlertCircle className="w-3 h-3" /> Unexpected in Ledger
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
            <GitCompare className="w-5 h-5 text-indigo-600" />
            <span>Four-Column Reconciliation Engine</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-semibold border border-slate-200">
              Automated Cross-System Verification
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic cross-system comparison between Platform Payout CSV (5,000 trips) and Finance ERP Ledger exports (4,995 rows).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Datasets Compared:</span>
          <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono text-slate-700">
            Platform Trips (5,000) ⚡ Finance SAP Ledger (4,995) → Total Reconciliation Records: {reconSummary.totalRecords.toLocaleString()}
          </span>
        </div>
      </div>

      {/* ── Reconciliation Summary Cards (Mathematically Reconciled) ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs border-l-4 border-l-emerald-600">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Match Rate
          </p>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">
            {((reconSummary.matchedCount / reconSummary.totalRecords) * 100).toFixed(1)}%
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {reconSummary.matchedCount.toLocaleString()} / {reconSummary.totalRecords.toLocaleString()} fully verified
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs border-l-4 border-l-rose-600">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Total Exceptions
          </p>
          <p className="text-2xl font-black text-rose-600 font-mono mt-1">
            {reconSummary.totalRecords - reconSummary.matchedCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Fee gap exposure: {formatINR(reconSummary.totalFeeGap)}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs border-l-4 border-l-amber-500">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Financial Discrepancies
          </p>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">
            {reconSummary.feeMismatchCount + reconSummary.payoutMismatchCount + reconSummary.fullMismatchCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {reconSummary.feeMismatchCount} fee, {reconSummary.payoutMismatchCount} payout, {reconSummary.fullMismatchCount} full mismatches
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs border-l-4 border-l-indigo-500">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Data Integrity Exceptions
          </p>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">
            {reconSummary.missingFromLedgerCount + reconSummary.unexpectedInLedgerCount + reconSummary.duplicateInLedgerCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {reconSummary.missingFromLedgerCount} missing, {reconSummary.unexpectedInLedgerCount} unexpected, {reconSummary.duplicateInLedgerCount} duplicate
          </p>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 340 }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, paddingLeft: 12, display: "flex", alignItems: "center", pointerEvents: "none" }}>
            <Search style={{ width: 14, height: 14, color: "#94a3b8" }} />
          </div>
          <input
            type="text"
            placeholder="Search by Transaction ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ display: "block", width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 7, paddingBottom: 7, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#1e293b", outline: "none", fontFamily: "inherit" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Filter:</span>
          {[
            { id: "all", label: `All (${reconSummary.totalRecords})` },
            { id: "unresolved", label: "Unresolved" },
            { id: "fee_mismatch", label: `Fee Mismatch (${reconSummary.feeMismatchCount})` },
            { id: "missing_from_ledger", label: `Missing (${reconSummary.missingFromLedgerCount})` },
          ].map((f) => (
            <button key={f.id} type="button"
              onClick={() => { setFilterStatus(f.id); setPage(1); }}
              style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: filterStatus === f.id ? "none" : "1px solid #e2e8f0", background: filterStatus === f.id ? (f.id === "unresolved" ? "#dc2626" : "#0f172a") : "#f1f5f9", color: filterStatus === f.id ? "#fff" : "#475569" }}>
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8" }}>
          {filteredItems.length.toLocaleString()} records
        </div>
      </div>

      {/* ── The 4-Column Comparison Table ── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-3 text-right bg-indigo-50/30">Platform Payout</th>
                <th className="py-3 px-3 text-right bg-indigo-50/30">Ledger Payout</th>
                <th className="py-3 px-3 text-right bg-emerald-50/30 font-bold text-emerald-900">
                  Expected Fee
                </th>
                <th className="py-3 px-3 text-right bg-emerald-50/30 font-bold text-emerald-900">
                  Recorded Fee
                </th>
                <th className="py-3 px-3 text-right">Fee Variance</th>
                <th className="py-3 px-3">Classification</th>
                <th className="py-3 px-4 text-center">Resolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginated.map((item) => {
                const isResolved = demoStore.isItemResolved(item.transactionId);
                const resolvedRecord = demoStore.resolvedItemMap.get(item.transactionId);

                return (
                  <tr
                    key={item.transactionId}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      item.status !== "matched" && !isResolved ? "bg-rose-50/20" : ""
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      <Link
                        href={`/transactions/${item.transactionId}`}
                        className="text-indigo-600 hover:underline"
                      >
                        {item.transactionId}
                      </Link>
                    </td>

                    {/* Platform Payout */}
                    <td className="py-3 px-3 text-right font-mono text-slate-900">
                      {item.platformPayout !== null ? formatINR(item.platformPayout) : "—"}
                    </td>

                    {/* Ledger Payout */}
                    <td
                      className={`py-3 px-3 text-right font-mono ${
                        item.payoutDiff && Math.abs(item.payoutDiff) > 0.01
                          ? "text-rose-600 font-bold bg-rose-50/40"
                          : "text-slate-800"
                      }`}
                    >
                      {item.ledgerPayout !== null ? formatINR(item.ledgerPayout) : "—"}
                    </td>

                    {/* Expected Fee (Engine) */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800 bg-emerald-50/20">
                      {item.expectedFee !== null ? formatINR(item.expectedFee) : "—"}
                    </td>

                    {/* Recorded Fee (Ledger) */}
                    <td
                      className={`py-3 px-3 text-right font-mono font-bold ${
                        item.feeDiff && Math.abs(item.feeDiff) > 0.01
                          ? "text-rose-600 bg-rose-50/40"
                          : "text-slate-800"
                      }`}
                    >
                      {item.recordedFee !== null ? formatINR(item.recordedFee) : "—"}
                    </td>

                    {/* Variance */}
                    <td className="py-3 px-3 text-right font-mono">
                      {item.feeDiff !== null ? (
                        <span
                          className={
                            Math.abs(item.feeDiff) > 0.01
                              ? "text-rose-600 font-bold"
                              : "text-emerald-600 font-semibold"
                          }
                        >
                          {item.feeDiff > 0 ? `+${formatINR(item.feeDiff)}` : formatINR(item.feeDiff)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3">{getStatusBadge(item.status)}</td>

                    {/* Resolution Button / Status */}
                    <td className="py-3 px-4 text-center">
                      {isResolved ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                          title={`Resolved: ${resolvedRecord?.note}`}
                        >
                          <Check className="w-3 h-3 text-emerald-600" /> Resolved
                        </span>
                      ) : item.status === "matched" ? (
                        <span className="text-[11px] text-slate-400 font-medium">Reconciled</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold shadow-2xs transition-colors cursor-pointer"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="py-3 px-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, filteredItems.length)} of {filteredItems.length.toLocaleString()}{" "}
            records
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Issue Resolution Modal ── */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Resolve Reconciliation Discrepancy
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 text-sm p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="my-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-900">{selectedItem.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Discrepancy Category:</span>
                <div>{getStatusBadge(selectedItem.status)}</div>
              </div>
              <div className="border-t border-slate-200 my-1 pt-1 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Platform Expected Fee:</span>
                  <span className="font-mono font-bold text-emerald-800 text-sm">
                    {selectedItem.expectedFee !== null ? formatINR(selectedItem.expectedFee) : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Finance Recorded Fee:</span>
                  <span className="font-mono font-bold text-rose-600 text-sm">
                    {selectedItem.recordedFee !== null ? formatINR(selectedItem.recordedFee) : "—"}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100 mt-2">
                <strong>Audit Explanation:</strong> {selectedItem.explanation}
              </p>
            </div>

            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resolution Decision Type:
                </label>
                <select
                  value={resolutionType}
                  onChange={(e) =>
                    setResolutionType(
                      e.target.value as "platform_correct" | "ledger_correct" | "escalated" | "waived"
                    )
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs py-2 px-3 text-slate-900 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="platform_correct">
                    Platform Calculation Correct (Statutory Authority — update ledger)
                  </option>
                  <option value="ledger_correct">
                    Finance Ledger Correct (Adjust platform line item)
                  </option>
                  <option value="escalated">
                    Escalate to Joint Audit Committee (Compliance + Finance)
                  </option>
                  <option value="waived">Waive Immaterial Rounding Difference</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Audit Sign-Off Justification Note:
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Explain why this resolution is justified for statutory auditors..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="text-[11px] text-slate-500 bg-indigo-50/60 p-2.5 rounded border border-indigo-200/60">
                Audited by: <strong>{demoStore.activeUser.name}</strong> ({demoStore.activeUser.role.replace("_", " ")}) • Timestamp will be permanently recorded in immutable audit trail.
              </div>

              {resolveSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Resolution recorded! Compliance Health Score updated.</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Commit Resolution to Audit Trail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
