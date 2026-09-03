"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { demoStore, DemoRegulatoryChange } from "@/lib/store/demo-store";
import {
  BellRing,
  Sparkles,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Clock,
  ExternalLink,
} from "lucide-react";

export default function RegulatoryMonitorPage() {
  const [changes, setChanges] = useState<DemoRegulatoryChange[]>(demoStore.regulatoryChanges);
  const [selectedChange, setSelectedChange] = useState<DemoRegulatoryChange>(
    demoStore.regulatoryChanges[0]
  );
  const [approvalNote, setApprovalNote] = useState(
    "Verified against draft gazette text. Approved parameter revision for Four-Wheeler cab trips effective 01-Oct-2026."
  );
  const [isApproved, setIsApproved] = useState(selectedChange.reviewStatus === "approved");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleApprove = () => {
    try {
      const newRule = demoStore.approveRegulatoryChange(selectedChange.id, approvalNote);
      setIsApproved(true);
      setActionSuccess(
        `Change approved! Created new Rule Version [${newRule.versionCode}] with status='approved'.`
      );
      setChanges([...demoStore.regulatoryChanges]);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const handleReject = () => {
    selectedChange.reviewStatus = "rejected";
    selectedChange.reviewedBy = demoStore.activeUser.name;
    selectedChange.reviewedAt = new Date().toISOString();
    selectedChange.reviewNote = "Rejected proposal: inconsistent with state consultation guidelines.";
    demoStore.logAudit(
      "reg_change.rejected",
      "regulatory_change",
      selectedChange.id,
      "Rejected draft regulatory change proposal."
    );
    setActionSuccess("Change proposal marked as rejected.");
    setChanges([...demoStore.regulatoryChanges]);
  };

  return (
    <AppShell>
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BellRing className="w-5 h-5 text-indigo-600" />
            <span>AI-Assisted Regulatory Change Analysis</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold border border-indigo-200">
              Human-in-the-Loop Approval
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            AI extracts structured parameters from draft gazette notifications. No rule changes without explicit compliance officer sign-off.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-medium px-2.5 py-1 rounded bg-slate-100 border border-slate-200">
            📄 Sample Document — AI Extraction Workflow
          </span>
        </div>
      </div>

      {/* ── Workflow Diagram ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-2xs">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Regulatory Change Lifecycle:
        </p>
        <div className="flex items-center gap-2 text-xs overflow-x-auto text-slate-600">
          <span className="font-semibold text-slate-900">Source Gazette PDF</span>
          <span>→</span>
          <span className="font-semibold text-indigo-600 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> AI Parameter Extraction
          </span>
          <span>→</span>
          <span className="font-semibold text-amber-700">Proposed Change Draft</span>
          <span>→</span>
          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
            Human Compliance Sign-Off
          </span>
          <span>→</span>
          <span className="font-semibold text-emerald-700">New Versioned Rule (Approved)</span>
          <span>→</span>
          <span className="font-semibold text-slate-500">Future Calculation Runs</span>
        </div>
      </div>

      {/* ── Main Change Card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Change List */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Detected Regulatory Proposals ({changes.length})
          </h2>

          {changes.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                setSelectedChange(c);
                setIsApproved(c.reviewStatus === "approved");
                setActionSuccess(null);
              }}
              className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                selectedChange.id === c.id
                  ? "border-indigo-600 bg-indigo-50/50 shadow-2xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                  {c.stateCode}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                    c.reviewStatus === "approved"
                      ? "bg-emerald-100 text-emerald-800"
                      : c.reviewStatus === "rejected"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {c.reviewStatus}
                </span>
              </div>
              <h3 className="font-bold text-xs text-slate-900 line-clamp-2">{c.title}</h3>
              <p className="text-[11px] text-slate-500 mt-1">Detected: {c.detectedAt.split("T")[0]}</p>
            </div>
          ))}
        </div>

        {/* Right: Detailed AI Analysis & Human Approval Workflow */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
          <div className="flex items-start justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Source: {selectedChange.sourceDocumentTitle}
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-1">{selectedChange.title}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                <span>Target Effective Date: <strong className="text-slate-700">{selectedChange.aiEffectiveDate}</strong></span>
                <span>•</span>
                <span>Extraction confidence: <strong className="text-indigo-700 font-semibold">{(selectedChange.aiConfidence * 100).toFixed(0)}%</strong></span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium text-[11px]">
                  Legal status: Draft / Not enacted
                </span>
              </div>
            </div>

            <span
              className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                selectedChange.reviewStatus === "approved"
                  ? "bg-emerald-100 text-emerald-800"
                  : selectedChange.reviewStatus === "rejected"
                  ? "bg-rose-100 text-rose-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {selectedChange.reviewStatus}
            </span>
          </div>

          {/* AI Structured Extraction Box */}
          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200/80 mb-6 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-indigo-950 text-xs mb-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>AI-Assisted Regulatory Analysis</span>
            </div>

            <p className="text-slate-800 leading-relaxed mb-4">{selectedChange.aiSummary}</p>

            <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded-lg border border-indigo-100 text-[11px]">
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[9px]">
                  Current Active Rule
                </span>
                <span className="font-mono text-slate-800 font-medium block mt-0.5">
                  {selectedChange.aiOldValue}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[9px]">
                  Proposed Revised Rule
                </span>
                <span className="font-mono text-indigo-700 font-bold block mt-0.5">
                  {selectedChange.aiNewValue}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-indigo-100/70 space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-emerald-800 font-medium">
                <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">✓ Rate identified (1.5%)</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">✓ Cap identified (₹1.50)</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">✓ Sector identified (Ride-Hailing 4W)</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">✓ Effective date identified (01-Oct-2026)</span>
              </div>
              <p className="text-[10px] text-slate-500 italic mt-1.5">
                Note: {selectedChange.aiConfidenceNote}
              </p>
            </div>
          </div>

          {/* Raw Gazette Excerpt */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                SAMPLE REGULATORY DOCUMENT — Used for AI extraction workflow demonstration
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                Sample • Not officially enacted • For demonstration
              </span>
            </div>
            <pre className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
              {selectedChange.rawContent}
            </pre>
          </div>

          {/* Success Banner */}
          {actionSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* Human Review Sign-Off Form */}
          {selectedChange.reviewStatus === "pending" && !isApproved ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h3 className="font-bold text-xs text-slate-900">
                Compliance Officer Sign-Off & Approval
              </h3>
              <p className="text-xs text-slate-500">
                Approving this proposal will instantiate a new Rule Version in the system with lifecycle_status='approved' and record your signature in the immutable audit trail.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Audit Sign-Off Justification:
                </label>
                <textarea
                  rows={2}
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg text-xs p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Reject Proposal
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Approve & Generate New Rule Version</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Reviewed & Approved by {selectedChange.reviewedBy || demoStore.activeUser.name}</span>
              </div>
              <p className="text-slate-600">Audit Note: {selectedChange.reviewNote || approvalNote}</p>
              <div className="pt-2">
                <Link
                  href="/rule-versions"
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  View in Rule Version History →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
