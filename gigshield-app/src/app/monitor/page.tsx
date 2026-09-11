"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { demoStore, DemoTransaction } from "@/lib/store/demo-store";
import { formatINR } from "@/lib/engines/calculation-engine";
import {
  extractRegulatoryRule,
  SAMPLE_REGULATORY_DOCUMENTS,
} from "@/lib/ai/regulatory-extractor";
import {
  ProposedRuleExtraction,
  BatchImpactSummary,
  TransactionImpactResult,
  LegalStatus,
  EvidenceCitation,
} from "@/lib/engines/regulatory-types";
import { RuleDiffView } from "@/components/shared/RuleDiffView";
import { TransactionBindingDrawer } from "@/components/shared/TransactionBindingDrawer";
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
  Layers,
  Calculator,
  Search,
  Filter,
  Play,
  FileSpreadsheet,
  RotateCcw,
  BookOpen,
  GitBranch,
  ShieldAlert,
} from "lucide-react";

export default function RegulatoryIntelligenceAgentPage() {
  // Document Selection & Ingestion State
  const [selectedDocId, setSelectedDocId] = useState(SAMPLE_REGULATORY_DOCUMENTS[0].id);
  const [customText, setCustomText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedProposal, setExtractedProposal] = useState<ProposedRuleExtraction | null>(null);

  // Simulation & Impact State
  const [isSimulating, setIsSimulating] = useState(false);
  const [impactSummary, setImpactSummary] = useState<BatchImpactSummary | null>(null);
  const [impactResults, setImpactResults] = useState<TransactionImpactResult[]>([]);

  // Transaction Inspection Drawer State
  const [selectedTxnBinding, setSelectedTxnBinding] = useState<{
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
  } | null>(null);

  // Human-in-the-Loop Approval State
  const [approvalNote, setApprovalNote] = useState(
    "Verified against draft gazette text. Approved parameter revision for Four-Wheeler cab trips effective 01-Oct-2026."
  );
  const [approvalStatus, setApprovalStatus] = useState<"pending" | "approved" | "rejected">(
    "pending"
  );
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Filter & Pagination for Transactions Table
  const [txnSearch, setTxnSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const activeDoc = useMemo(() => {
    return (
      SAMPLE_REGULATORY_DOCUMENTS.find((d) => d.id === selectedDocId) ||
      SAMPLE_REGULATORY_DOCUMENTS[0]
    );
  }, [selectedDocId]);

  // ── Step 1: AI Document Extraction ─────────────────────────────────────────
  const handleExtractRule = async () => {
    setIsExtracting(true);
    setActionMessage(null);
    setImpactSummary(null);
    setImpactResults([]);
    setApprovalStatus("pending");

    try {
      const proposal = await extractRegulatoryRule({
        documentTitle: activeDoc.title,
        sourceType: activeDoc.sourceType,
        jurisdiction: activeDoc.jurisdiction,
        rawText: customText.trim() || activeDoc.rawText,
        sourceUrl: activeDoc.sourceUrl,
      });

      setExtractedProposal(proposal);
    } catch (err) {
      console.error("AI extraction error:", err);
    } finally {
      setIsExtracting(false);
    }
  };

  // ── Step 2: Deterministic Batch Impact Simulation ──────────────────────────
  const handleSimulateImpact = () => {
    if (!extractedProposal) return;
    setIsSimulating(true);

    setTimeout(() => {
      const { summary, results } = demoStore.simulateRegulatoryImpact(extractedProposal);
      setImpactSummary(summary);
      setImpactResults(results);
      setIsSimulating(false);
    }, 450);
  };

  // ── Step 3: Human Approval & Immutable Rule Generation ─────────────────────
  const handleApproveRule = () => {
    if (!extractedProposal) return;
    try {
      const newRule = demoStore.approveRegulatoryChange(
        demoStore.regulatoryChanges[0]?.id || "chg-ka-2026-09",
        approvalNote
      );
      setApprovalStatus("approved");
      setActionMessage(
        `Approved! Created Immutable Rule Version [${newRule.versionCode}] with lifecycle_status='approved'. Audit event recorded.`
      );
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const handleRejectRule = () => {
    setApprovalStatus("rejected");
    demoStore.logAudit(
      "reg_change.rejected",
      "regulatory_change",
      extractedProposal?.id || "prop-unknown",
      "Compliance Officer rejected proposed regulatory rule update."
    );
    setActionMessage("Regulatory rule proposal rejected. No active rules were modified.");
  };

  // Filtered transactions for the table
  const filteredTxns = useMemo(() => {
    return impactResults.filter((item) => {
      const q = txnSearch.toLowerCase();
      const matchSearch =
        q === "" ||
        item.transactionId.toLowerCase().includes(q) ||
        item.workerId.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "affected" && item.isAffected) ||
        (statusFilter === "exception" && item.status === "exception") ||
        (statusFilter === "review" && item.status === "requires_review") ||
        (statusFilter === "unaffected" && !item.isAffected);

      return matchSearch && matchStatus;
    });
  }, [impactResults, txnSearch, statusFilter]);

  const totalPages = Math.ceil(filteredTxns.length / pageSize) || 1;
  const paginatedTxns = filteredTxns.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <AppShell>
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BellRing className="w-5 h-5 text-indigo-600" />
              <span>Regulatory Change Intelligence Agent</span>
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold border border-indigo-200">
              Karnataka Act, 2025
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic binding: Regulation → Rule Version → 5,000 Transactions → Financial Impact → Human Approval → Provenance Evidence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-medium px-2.5 py-1 rounded bg-slate-100 border border-slate-200 font-mono">
            Synthetic Prototype Data • 5,000 Txns
          </span>
        </div>
      </div>

      {/* ── 12-Step Killer Demo Flow Stepper ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            End-to-End Regulatory Agent Lifecycle:
          </p>
          <span className="text-[10px] font-mono font-semibold text-indigo-600">
            {extractedProposal ? (impactSummary ? (approvalStatus === "approved" ? "Step 12: Audit Provenance" : "Step 10: Human Sign-Off") : "Step 5: Rule Diff Ready") : "Step 1: Document Ingestion"}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
          <div className={`p-2 rounded-lg border text-center font-medium ${!extractedProposal ? "bg-indigo-50 border-indigo-300 text-indigo-900" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
            <span className="block text-[10px] text-slate-400 font-bold">1. INGEST</span>
            <span className="text-[11px]">Gazette / Order</span>
          </div>
          <div className={`p-2 rounded-lg border text-center font-medium ${extractedProposal && !impactSummary ? "bg-indigo-50 border-indigo-300 text-indigo-900" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
            <span className="block text-[10px] text-slate-400 font-bold">2. AI EXTRACT</span>
            <span className="text-[11px]">Rates & Clauses</span>
          </div>
          <div className={`p-2 rounded-lg border text-center font-medium ${extractedProposal && !impactSummary ? "bg-indigo-50 border-indigo-300 text-indigo-900" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
            <span className="block text-[10px] text-slate-400 font-bold">3. RULE DIFF</span>
            <span className="text-[11px]">V1 → Proposed</span>
          </div>
          <div className={`p-2 rounded-lg border text-center font-medium ${impactSummary && approvalStatus === "pending" ? "bg-indigo-50 border-indigo-300 text-indigo-900" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
            <span className="block text-[10px] text-slate-400 font-bold">4. SIMULATE</span>
            <span className="text-[11px]">5,000 Transactions</span>
          </div>
          <div className={`p-2 rounded-lg border text-center font-medium ${impactSummary && approvalStatus === "pending" ? "bg-indigo-50 border-indigo-300 text-indigo-900" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
            <span className="block text-[10px] text-slate-400 font-bold">5. BIND & TRACE</span>
            <span className="text-[11px]">Txn → Law Citation</span>
          </div>
          <div className={`p-2 rounded-lg border text-center font-medium ${approvalStatus === "approved" ? "bg-emerald-50 border-emerald-300 text-emerald-900" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
            <span className="block text-[10px] text-slate-400 font-bold">6. APPROVE</span>
            <span className="text-[11px]">Human Sign-Off</span>
          </div>
          <div className={`p-2 rounded-lg border text-center font-medium ${approvalStatus === "approved" ? "bg-emerald-50 border-emerald-300 text-emerald-900" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
            <span className="block text-[10px] text-slate-400 font-bold">7. AUDIT TRAIL</span>
            <span className="text-[11px]">Immutable Log</span>
          </div>
        </div>
      </div>

      {/* ── Section 1: Ingestion & AI Extraction ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left: Document Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Regulatory Source Document
            </h2>
            <span className="text-[10px] font-mono text-slate-500">
              {SAMPLE_REGULATORY_DOCUMENTS.length} Official Cases
            </span>
          </div>

          <div className="space-y-2">
            {SAMPLE_REGULATORY_DOCUMENTS.map((doc) => {
              const isSelected = selectedDocId === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    setSelectedDocId(doc.id);
                    setExtractedProposal(null);
                    setImpactSummary(null);
                    setImpactResults([]);
                  }}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/50 shadow-2xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono">
                      {doc.sourceType}
                    </span>
                    <span className="text-[10px] font-semibold text-indigo-700">
                      {doc.jurisdiction}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-slate-900 line-clamp-2">{doc.title}</h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{doc.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Document Text & AI Extraction Trigger */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Document Preview & Gazette Text
                </span>
                <h3 className="text-xs font-bold text-slate-900 mt-0.5">{activeDoc.title}</h3>
              </div>
              {activeDoc.sourceUrl && (
                <a
                  href={activeDoc.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <span>Official Gazette</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <pre className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto mb-4">
              {customText || activeDoc.rawText}
            </pre>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500">
              AI parses statutory obligations, rates, caps & dates without doing final financial arithmetic.
            </span>
            <button
              type="button"
              onClick={handleExtractRule}
              disabled={isExtracting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all self-end sm:self-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isExtracting ? "AI Extracting Parameters..." : "Run AI Regulatory Extraction →"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Section 2: Rule Diff Screen ── */}
      {extractedProposal && (
        <div className="mb-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span>Step 2: Rule Diff & Parameter Extraction</span>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-indigo-100 text-indigo-800 font-bold">
              AI Extracted Output
            </span>
          </h2>

          <RuleDiffView
            proposal={extractedProposal}
            onSimulateClick={handleSimulateImpact}
            isSimulating={isSimulating}
          />
        </div>
      )}

      {/* ── Section 3: Deterministic Impact Analysis (5,000 Transactions) ── */}
      {impactSummary && (
        <div className="mb-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span>Step 3: Deterministic Transaction Impact (5,000 Txns)</span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                Deterministic Calculation Result
              </span>
            </h2>
          </div>

          {/* Big KPI Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Transactions Analyzed
              </span>
              <span className="text-xl font-extrabold text-slate-900 block mt-1">
                {impactSummary.totalAnalyzed.toLocaleString()}
              </span>
              <span className="text-[10.5px] text-slate-500 mt-0.5 block">Synthetic Prototype Data</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                Affected Transactions
              </span>
              <span className="text-xl font-extrabold text-indigo-700 block mt-1">
                {impactSummary.totalAffected.toLocaleString()}
              </span>
              <span className="text-[10.5px] text-slate-500 mt-0.5 block">
                {impactSummary.totalUnaffected.toLocaleString()} Unaffected
              </span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Previous Exposure
              </span>
              <span className="text-xl font-extrabold text-slate-800 block mt-1">
                {formatINR(impactSummary.previousExposure)}
              </span>
              <span className="text-[10.5px] text-slate-500 mt-0.5 block font-mono">KA-2025-02 Baseline</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Revised Exposure
              </span>
              <span className="text-xl font-extrabold text-slate-900 block mt-1">
                {formatINR(impactSummary.revisedExposure)}
              </span>
              <span className="text-[10.5px] text-indigo-600 font-bold mt-0.5 block">
                {impactSummary.percentageChange >= 0 ? "+" : ""}
                {impactSummary.percentageChange}% Change
              </span>
            </div>

            <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 block">
                Net Liability Delta
              </span>
              <span className="text-xl font-black text-indigo-900 block mt-1">
                {impactSummary.liabilityDelta >= 0 ? "+" : ""}
                {formatINR(impactSummary.liabilityDelta)}
              </span>
              <span className="text-[10.5px] text-slate-600 mt-0.5 block">
                {impactSummary.exceptionCount} Exceptions • {impactSummary.humanReviewCount} Reviews
              </span>
            </div>
          </div>

          {/* Sector Breakdown & Action Center Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sector Impact Breakdown */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-xs text-slate-900">
                  Sector & Vehicle Exposure Matrix
                </h3>
                <span className="text-[10.5px] text-slate-500">Karnataka Platform Data</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-[9.5px] font-bold tracking-wider">
                      <th className="py-2">Sector & Vehicle</th>
                      <th className="py-2">Analyzed Txns</th>
                      <th className="py-2">Affected Txns</th>
                      <th className="py-2">Prev Exposure</th>
                      <th className="py-2">Revised Exposure</th>
                      <th className="py-2 text-right">Liability Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-[11px]">
                    {impactSummary.sectorBreakdown.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 font-semibold text-slate-900 capitalize">
                          {row.sector} ({row.vehicleType})
                        </td>
                        <td className="py-2.5 font-mono">{row.totalTxns.toLocaleString()}</td>
                        <td className="py-2.5 font-mono font-bold text-indigo-700">
                          {row.affectedTxns.toLocaleString()}
                        </td>
                        <td className="py-2.5 font-mono">{formatINR(row.prevExposure)}</td>
                        <td className="py-2.5 font-mono">{formatINR(row.revisedExposure)}</td>
                        <td className="py-2.5 font-mono font-bold text-right">
                          <span
                            className={
                              row.delta > 0
                                ? "text-amber-700"
                                : row.delta < 0
                                ? "text-emerald-700"
                                : "text-slate-400"
                            }
                          >
                            {row.delta > 0 ? "+" : ""}
                            {formatINR(row.delta)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Agent Recommendation & Human Review Controls */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Action Center Recommendation</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    {impactSummary.recommendedAction.severity}
                  </span>
                </div>

                <h4 className="font-bold text-xs text-slate-900 leading-snug">
                  {impactSummary.recommendedAction.title}
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {impactSummary.recommendedAction.description}
                </p>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-[10.5px] text-slate-700 font-mono">
                  {impactSummary.recommendedAction.recommendedSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-1">
                      <span>•</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Human-in-the-Loop Sign-Off Form */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                {approvalStatus === "pending" ? (
                  <>
                    <div>
                      <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Compliance Officer Audit Justification:
                      </label>
                      <textarea
                        rows={2}
                        value={approvalNote}
                        onChange={(e) => setApprovalNote(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleRejectRule}
                        className="px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={handleApproveRule}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Approve & Deploy RuleVersion</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{actionMessage || "Approved by Vaishnavi Dwivedi (Compliance Officer)"}</span>
                    </div>
                    <Link
                      href="/audit"
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 inline-block pt-1"
                    >
                      Inspect Immutable Audit Record →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Transactions Line Items Table with Provenance Binding */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-3">
            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  <span>Transaction Line Items & Provenance Binding</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Click any transaction to trace its exact mathematical formula and statutory law citation.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search transaction / worker..."
                    value={txnSearch}
                    onChange={(e) => {
                      setTxnSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                >
                  <option value="all">All Statuses ({impactResults.length})</option>
                  <option value="affected">Affected Only</option>
                  <option value="exception">Integrity Exceptions</option>
                  <option value="review">Requires Human Review</option>
                  <option value="unaffected">Unaffected</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[9.5px] font-bold tracking-wider">
                    <th className="py-2.5 px-4">Transaction ID</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Sector & Vehicle</th>
                    <th className="py-2.5 px-3">Payout</th>
                    <th className="py-2.5 px-3">Prev Fee</th>
                    <th className="py-2.5 px-3">Revised Fee</th>
                    <th className="py-2.5 px-3">Delta</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-4 text-right">Provenance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-[11px]">
                  {paginatedTxns.map((t) => (
                    <tr
                      key={t.transactionId}
                      onClick={() =>
                        setSelectedTxnBinding({
                          transactionId: t.transactionId,
                          workerId: t.workerId,
                          transactionDate: t.transactionDate,
                          sector: t.sector,
                          vehicleType: t.vehicleType,
                          payout: t.payout,
                          ruleVersionCode: t.revisedRuleCode,
                          calculatedFee: t.revisedLiability,
                          legalStatus: t.legalStatus,
                          evidence: t.evidenceCitation,
                          calculationSteps: t.calculationSteps,
                        })
                      }
                      className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                        {t.transactionId}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[10.5px]">
                        {t.transactionDate}
                      </td>
                      <td className="py-2.5 px-3 capitalize">
                        {t.sector} <span className="text-slate-400 font-mono">({t.vehicleType})</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">{formatINR(t.payout)}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {formatINR(t.previousLiability)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                        {formatINR(t.revisedLiability)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        <span
                          className={
                            t.delta > 0
                              ? "text-amber-700"
                              : t.delta < 0
                              ? "text-emerald-700"
                              : "text-slate-400"
                          }
                        >
                          {t.delta > 0 ? "+" : ""}
                          {formatINR(t.delta)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {t.status === "exception" ? (
                          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-rose-100 text-rose-800">
                            Exception
                          </span>
                        ) : t.status === "requires_review" ? (
                          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-100 text-amber-800">
                            Review Required
                          </span>
                        ) : t.isAffected ? (
                          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-indigo-100 text-indigo-800">
                            Affected (+Rate)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-medium bg-slate-100 text-slate-600">
                            Unaffected
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] inline-flex items-center gap-1">
                          <span>Inspect Binding</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing {(currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, filteredTxns.length)} of {filteredTxns.length} records
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded font-medium"
                >
                  Previous
                </button>
                <span className="font-mono text-[11px]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Transaction Binding Drawer Modal ── */}
      <TransactionBindingDrawer
        isOpen={!!selectedTxnBinding}
        onClose={() => setSelectedTxnBinding(null)}
        data={selectedTxnBinding}
      />
    </AppShell>
  );
}
