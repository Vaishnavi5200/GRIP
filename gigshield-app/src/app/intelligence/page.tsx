"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { demoStore } from "@/lib/store/demo-store";
import { formatINR } from "@/lib/engines/calculation-engine";
import {
  extractWithProvenance,
  SAMPLE_REGULATORY_DOCUMENTS,
} from "@/lib/ai/regulatory-extractor";
import {
  ProposedRuleExtraction,
  BatchImpactSummary,
  TransactionImpactResult,
  LegalOperationalState,
  EvidenceCitation,
} from "@/lib/engines/regulatory-types";
import { RuleDiffView } from "@/components/shared/RuleDiffView";
import { TransactionBindingDrawer } from "@/components/shared/TransactionBindingDrawer";
import { AgentPipelineRail } from "@/components/shared/AgentPipelineRail";
import { extractTextFromPdf } from "@/lib/utils/pdf-extractor";
import {
  Upload,
  FileText,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Search,
  History,
  Info,
  Lock,
  BarChart3,
  Link as LinkIcon,
  Quote,
  Layers,
  Sparkles,
  ShieldCheck,
  UserCheck,
  ChevronRight,
} from "lucide-react";

export default function IntelligenceAgentPage() {
  // Ingestion Mode & Selection
  const [activeTab, setActiveTab] = useState<"upload" | "preloaded">("upload");
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<string>("ka-4w-cab");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedPdfText, setExtractedPdfText] = useState<string>("");
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pipeline Execution State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [pipelineStep, setPipelineStep] = useState<number>(0); // 0 = ready, 1..7
  const [isLiveGemini, setIsLiveGemini] = useState<boolean>(false);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [fallbackReason, setFallbackReason] = useState<string | undefined>(undefined);
  const [schemaValid, setSchemaValid] = useState<boolean>(true);
  const [schemaErrors, setSchemaErrors] = useState<string[]>([]);

  // Results State
  const [extractedProposal, setExtractedProposal] = useState<ProposedRuleExtraction | null>(null);

  // Impact Simulation State
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [impactSummary, setImpactSummary] = useState<BatchImpactSummary | null>(null);
  const [impactResults, setImpactResults] = useState<TransactionImpactResult[]>([]);
  const [selectedTxnBinding, setSelectedTxnBinding] = useState<{
    transactionId: string;
    workerId: string;
    transactionDate: string;
    sector: string;
    vehicleType: string;
    payout: number;
    ruleVersionCode: string;
    calculatedFee: number;
    legalStatus: LegalOperationalState;
    evidence: EvidenceCitation;
    calculationSteps: Array<{ label: string; value: string }>;
    appliedRate?: string;
    appliedCap?: string;
    bindingExplanation?: string;
    bindingResolutionStep?: 1 | 2 | 3 | 4 | 5;
    calculationBehaviour?: string;
  } | null>(null);

  // Human Approval State
  const [verifiedState, setVerifiedState] = useState<LegalOperationalState>("ACTIVE");
  const [approvalNote, setApprovalNote] = useState(
    "Verified against draft gazette text. Approved parameter revision for Four-Wheeler cab trips effective 01-Oct-2026."
  );
  const [approvalStatus, setApprovalStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [provenanceEntries, setProvenanceEntries] = useState(() => [...demoStore.provenanceLog]);

  // Transactions Filter & Pagination
  const [txnSearch, setTxnSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "affected" | "unaffected">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Pre-loaded Synthetic Scenarios Catalog
  const SCENARIOS = [
    {
      key: "ka-4w-cab",
      title: "Karnataka 4W Welfare Fee Rate Revision",
      subtitle: "Rate change from 1.00% to 1.50% (Synthetic)",
      docId: "doc-ka-cab-revision",
      realBasis: "Karnataka Act 72 of 2025, Section 24 read with Rule 4 / Schedule I",
    },
    {
      key: "ka-delivery-incentive",
      title: "Welfare Board Order (Delivery Incentive)",
      subtitle: "Welfare fee for delivery workers (Synthetic)",
      docId: "doc-ka-food-delivery-waiver",
      realBasis: "Karnataka Act 72 of 2025, Section 16(3) — clean mobility concession powers",
    },
    {
      key: "ka-hc-escrow",
      title: "High Court Interim Order (Logistics)",
      subtitle: "Escrow mechanism for HCV (Synthetic)",
      docId: "doc-ka-hc-interim-order",
      realBasis: "Karnataka Act 72 of 2025 Section 16 & Art. 226 judicial review escrow doctrine",
    },
  ];

  const currentScenario = useMemo(() => {
    return SCENARIOS.find((s) => s.key === selectedScenarioKey) || SCENARIOS[0];
  }, [selectedScenarioKey]);

  // Handle PDF upload
  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsPdfLoading(true);

    try {
      const pdfRes = await extractTextFromPdf(file);
      setExtractedPdfText(pdfRes.text);
    } catch (err) {
      console.error("PDF extraction error:", err);
      alert("Failed to parse PDF text in browser. Please check format.");
    } finally {
      setIsPdfLoading(false);
    }
  };

  // Run Agent Pipeline (7-Step execution)
  const handleRunAgent = async () => {
    setIsAnalyzing(true);
    setPipelineStep(1);
    setActionMessage(null);
    setImpactSummary(null);
    setImpactResults([]);
    setApprovalStatus("pending");
    setExtractedProposal(null);
    setSchemaValid(true);
    setSchemaErrors([]);

    const activeDoc =
      SAMPLE_REGULATORY_DOCUMENTS.find((d) => d.id === currentScenario.docId) ||
      SAMPLE_REGULATORY_DOCUMENTS[0];

    const rawTextToUse =
      activeTab === "upload" && uploadedFile && extractedPdfText.trim()
        ? extractedPdfText
        : activeDoc.rawText;

    const docTitle =
      activeTab === "upload" && uploadedFile
        ? uploadedFile.name
        : activeDoc.title;

    try {
      // Step 1: Ingest
      setPipelineStep(1);
      await new Promise((r) => setTimeout(r, 180));

      // Step 2: Extract
      setPipelineStep(2);
      const extractionResult = await extractWithProvenance(
        {
          documentTitle: docTitle,
          sourceType: activeDoc.sourceType,
          jurisdiction: activeDoc.jurisdiction,
          rawText: rawTextToUse,
          sourceUrl: activeDoc.sourceUrl,
        },
        { preferLive: true }
      );

      // Step 3: Interpret
      setPipelineStep(3);
      await new Promise((r) => setTimeout(r, 200));

      // Step 4: Compare
      setPipelineStep(4);
      await new Promise((r) => setTimeout(r, 200));

      // Step 5: Detect
      setPipelineStep(5);
      await new Promise((r) => setTimeout(r, 180));

      // Step 6: Validate Schema (Deterministic Gate)
      setPipelineStep(6);
      if (!extractionResult.proposal.schemaValid) {
        setSchemaValid(false);
        setSchemaErrors(extractionResult.proposal.schemaValidationErrors || ["Schema verification failed."]);
        demoStore.appendProvenanceLog({
          eventType: "schema_validation_failed",
          proposedRuleId: extractionResult.proposal.id,
          actor: "SYSTEM",
          note: `Deterministic schema gate rejected payload: ${(extractionResult.proposal.schemaValidationErrors || []).join(", ")}`,
        });
        setIsAnalyzing(false);
        return;
      }

      demoStore.appendProvenanceLog({
        eventType: "schema_validation_passed",
        proposedRuleId: extractionResult.proposal.id,
        actor: "SYSTEM",
        note: "Deterministic schema validation passed. Output approved for impact computation.",
      });

      // Step 7: Propose
      setPipelineStep(7);
      setExtractedProposal(extractionResult.proposal);
      setVerifiedState(extractionResult.proposal.aiProposedState || "ACTIVE");
      setIsLiveGemini(extractionResult.isLive);
      setIsFallback(!extractionResult.isLive);
      setFallbackReason(extractionResult.fallbackReason);

      demoStore.appendProvenanceLog({
        eventType: "ai_interpretation_complete",
        proposedRuleId: extractionResult.proposal.id,
        actor: extractionResult.isLive ? "AI_AGENT" : "SYSTEM",
        note: `Proposed interpretation staged: rate=${(extractionResult.proposal.proposedRate * 100).toFixed(2)}%, cap=₹${extractionResult.proposal.proposedCap ?? "none"}`,
      });

      // Deterministic Transaction Binding & Impact Engine over 5,000 Transactions
      const { summary, results } = demoStore.simulateRegulatoryImpact(extractionResult.proposal);
      setImpactSummary(summary);
      setImpactResults(results);

      demoStore.appendProvenanceLog({
        eventType: "impact_simulation_run",
        proposedRuleId: extractionResult.proposal.id,
        affectedTransactionCount: summary.totalAffected,
        financialDelta: summary.liabilityDelta,
        actor: "SYSTEM",
        note: `Deterministic transaction binding & calculation completed: ${summary.totalAffected.toLocaleString()} in-scope transactions identified, calculated net ₹ impact of +₹${summary.liabilityDelta.toFixed(2)}.`,
      });

      setProvenanceEntries([...demoStore.provenanceLog]);
    } catch (err) {
      console.error("Agent execution error:", err);
      alert("Error executing pipeline. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Simulate Impact on 5,000 Transactions
  const handleSimulateImpact = () => {
    if (!extractedProposal) return;
    setIsSimulating(true);

    setTimeout(() => {
      const { summary, results } = demoStore.simulateRegulatoryImpact(extractedProposal);
      setImpactSummary(summary);
      setImpactResults(results);
      setIsSimulating(false);

      demoStore.appendProvenanceLog({
        eventType: "impact_simulation_run",
        proposedRuleId: extractedProposal.id,
        affectedTransactionCount: summary.totalAffected,
        financialDelta: summary.liabilityDelta,
        actor: "SYSTEM",
        note: `Deterministic impact simulation completed: ${summary.totalAffected.toLocaleString()} affected transactions, net delta ${formatINR(summary.liabilityDelta)}.`,
      });
    }, 400);
  };

  // Human Approval Action
  const handleApproveRule = () => {
    if (!extractedProposal) return;
    try {
      const newRule = demoStore.approveRegulatoryChange(
        extractedProposal.id,
        approvalNote
      );

      setApprovalStatus("approved");
      setActionMessage(
        `✓ Proposal Approved! Activated versioned rule [${newRule.versionCode}]. Previous version superseded. Provenance audit logged.`
      );

      demoStore.appendProvenanceLog({
        eventType: "human_approved",
        proposedRuleId: extractedProposal.id,
        ruleVersionCode: newRule.versionCode,
        actor: demoStore.activeUser.name,
        note: `Compliance Officer approved proposed interpretation with verified state ${verifiedState}. Note: ${approvalNote}`,
      });
      demoStore.appendProvenanceLog({
        eventType: "rule_activated",
        ruleVersionCode: newRule.versionCode,
        actor: "SYSTEM",
        note: `Rule version [${newRule.versionCode}] is now ACTIVE in GRIP calculation engine.`,
      });
      setProvenanceEntries([...demoStore.provenanceLog]);
    } catch (err: unknown) {
      console.error(err);
      alert("Failed to activate rule version.");
    }
  };

  const handleRejectRule = () => {
    if (!extractedProposal) return;
    setApprovalStatus("rejected");
    demoStore.appendProvenanceLog({
      eventType: "human_rejected",
      proposedRuleId: extractedProposal.id,
      actor: demoStore.activeUser.name,
      note: `Compliance Officer rejected proposed interpretation. Reason: ${approvalNote}`,
    });
    setProvenanceEntries([...demoStore.provenanceLog]);
    setActionMessage("Regulatory rule proposal rejected. No active rules were modified in GRIP.");
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
      <div className="space-y-6 pb-20">
        {/* ── Top Header ── */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 tracking-wide uppercase mb-1">
            <span>✦</span> INTELLIGENCE AGENT
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Turn regulatory changes into clear business impact.
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Upload a government document or use a pre-loaded scenario. Our AI interprets it, validates the structure, and calculates the exact impact on your transactions.
          </p>
        </div>

        {/* ── Top Grid: Ingestion Box (Left) + Ready to Run Card (Right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          {/* Left Ingestion Card (Tabs + Upload + Quick Try) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              {/* Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("upload")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "upload"
                      ? "bg-white text-indigo-700 border border-indigo-300 shadow-2xs"
                      : "text-slate-600 bg-slate-100/70 hover:text-slate-900 border border-transparent"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Upload Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preloaded")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "preloaded"
                      ? "bg-white text-indigo-700 border border-indigo-300 shadow-2xs"
                      : "text-slate-600 bg-slate-100/70 hover:text-slate-900 border border-transparent"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Use a Pre-loaded Scenario</span>
                </button>
              </div>

              {/* Inside Body: Drag & Drop + Quick Try Radio List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Drag & Drop PDF */}
                <div className="border border-dashed border-slate-300 rounded-xl p-5 flex flex-col items-center justify-center text-center bg-slate-50/20 hover:bg-slate-50/60 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center mb-1">
                    <FileText className="w-7 h-7 text-slate-400 stroke-[1.5]" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    {uploadedFile ? uploadedFile.name : "Drag & drop a PDF here"}
                  </div>
                  <div className="text-[11px] text-slate-400 my-1">or</div>

                  <input
                    type="file"
                    accept="application/pdf"
                    ref={fileInputRef}
                    onChange={handlePdfChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isPdfLoading}
                    className="px-3.5 py-1.5 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isPdfLoading ? "Extracting..." : "Choose File"}</span>
                  </button>

                  <div className="text-[10px] text-slate-400 mt-3">
                    Max size 10 MB • PDF only
                  </div>
                </div>

                {/* Quick Try (Synthetic Scenarios) */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-700">
                    Quick Try (Synthetic Scenarios)
                  </div>

                  <div className="space-y-1.5">
                    {SCENARIOS.map((sc) => {
                      const isSelected = selectedScenarioKey === sc.key;
                      return (
                        <div
                          key={sc.key}
                          onClick={() => {
                            setSelectedScenarioKey(sc.key);
                            setUploadedFile(null);
                          }}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                            isSelected
                              ? "border-slate-800 bg-slate-50/80 shadow-2xs"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="pt-0.5">
                            <span
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? "border-slate-900 bg-slate-900"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                          </div>

                          <div>
                            <div className="text-xs font-bold text-slate-900 leading-tight">
                              {sc.title}
                            </div>
                            <div className="text-[10.5px] text-slate-500 mt-0.5">
                              {sc.subtitle}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Card: Ready to Run? */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <FileText className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">Ready to run?</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                The agent will analyse the document and show you the changes, impact, and recommended action.
              </p>

              <button
                type="button"
                onClick={handleRunAgent}
                disabled={isAnalyzing || isPdfLoading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <span>{isAnalyzing ? "Running Agent..." : "Run Agent →"}</span>
              </button>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-3">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Takes 1-2 minutes</span>
              </div>
            </div>

            {/* Synthetic scenario callout box */}
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-snug">
                This is a synthetic scenario created for demonstration purposes. Not an official government notification.
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: 7-Step Analysis Pipeline ── */}
        <AgentPipelineRail
          currentStepIndex={pipelineStep}
          isLiveGemini={isLiveGemini}
          isFallback={isFallback}
          fallbackReason={fallbackReason}
          schemaValid={schemaValid}
          schemaErrors={schemaErrors}
        />

        {/* ── SECTION 3: Results (Placeholder OR Live Rule Diff) ── */}
        {!extractedProposal ? (
          /* Placeholder State Before Agent Runs */
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900">Results</h3>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                Key outputs from the analysis will appear here.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-bold text-slate-800">Rule Diff</span>
                  </div>
                  <span className="text-[11px] text-slate-400">What changed?</span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-bold text-slate-800">Estimated Impact</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Affected transactions and ₹ impact</span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    <LinkIcon className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-bold text-slate-800">Recommended Action</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Proposed rule version</span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    <Quote className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-bold text-slate-800">Evidence & Citations</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Source sections and clauses</span>
                </div>
              </div>
            </div>

            {/* Human Review Locked Placeholder */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4.5 px-5 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                  <UserCheck className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Human Review & Approval</div>
                  <div className="text-[11px] text-slate-400">
                    Validate the AI interpretation, review the impact, and activate the rule version.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-500 bg-slate-100/90">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Locked until analysis is complete
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Provenance Locked Placeholder */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4.5 px-5 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <ShieldCheck className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Provenance Trail</div>
                  <div className="text-[11px] text-slate-400">
                    Complete trace of the document, AI outputs, validation and approvals.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-500 bg-slate-100/90">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Locked until analysis is complete
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
        ) : (
          /* Live Results Once Pipeline Runs: Pipeline → Rule Diff → Impact → Approval → Provenance */
          <div className="space-y-6">
            {/* Rule Diff Section */}
            <div>
              <RuleDiffView
                proposal={extractedProposal}
                onSimulateClick={handleSimulateImpact}
                isSimulating={isSimulating}
                isFallback={isFallback}
                fallbackReason={fallbackReason}
              />
            </div>

            {/* Impact Results Section (Shown once simulated) */}
            {impactSummary && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Transaction Impact Results (5,000 Sample Records)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Deterministic calculation engine bound the proposed rule across platform transactions.
                      </p>
                    </div>

                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                      {impactSummary.totalAffected.toLocaleString()} In-Scope Transactions
                    </span>
                  </div>

                  {/* 4 Focused KPI Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Dataset Analyzed</span>
                      <span className="text-xl font-black text-slate-900 mt-1 block">
                        {impactSummary.totalAnalyzed.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400">Karnataka transactions</span>
                    </div>

                    <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-200">
                      <span className="text-[10px] uppercase font-bold text-indigo-700 block">Affected Volume</span>
                      <span className="text-xl font-black text-indigo-700 mt-1 block">
                        {impactSummary.totalAffected.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-indigo-600">
                        {((impactSummary.totalAffected / impactSummary.totalAnalyzed) * 100).toFixed(1)}% of total
                      </span>
                    </div>

                    <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-200">
                      <span className="text-[10px] uppercase font-bold text-rose-700 block">Sample Liability Delta</span>
                      <span className="text-xl font-black text-rose-700 mt-1 block">
                        +{formatINR(impactSummary.liabilityDelta)}
                      </span>
                      <span className="text-[10px] text-rose-600">Sample batch increase</span>
                    </div>

                    <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-200">
                      <span className="text-[10px] uppercase font-bold text-purple-700 block">Exceptions / Flags</span>
                      <span className="text-xl font-black text-purple-700 mt-1 block">
                        {impactSummary.humanReviewCount || 0}
                      </span>
                      <span className="text-[10px] text-purple-600">Ambiguities flagged</span>
                    </div>
                  </div>

                  {/* Filterable Transactions Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                          <input
                            type="text"
                            value={txnSearch}
                            onChange={(e) => {
                              setTxnSearch(e.target.value);
                              setCurrentPage(1);
                            }}
                            placeholder="Search Trip ID / Worker..."
                            className="text-xs pl-8 pr-2.5 py-1 border border-slate-300 rounded-lg bg-white w-48"
                          />
                        </div>

                        <select
                          value={statusFilter}
                          onChange={(e) => {
                            setStatusFilter(e.target.value as any);
                            setCurrentPage(1);
                          }}
                          className="text-xs px-2 py-1 border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="all">All Transactions</option>
                          <option value="affected">Affected Only</option>
                          <option value="unaffected">Unaffected</option>
                        </select>
                      </div>

                      <span className="text-[11px] text-slate-500">
                        Showing {paginatedTxns.length} of {filteredTxns.length} records
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-100/60 text-[10px] font-bold text-slate-600 uppercase">
                            <th className="p-2.5">Trip ID</th>
                            <th className="p-2.5">Worker ID</th>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Sector</th>
                            <th className="p-2.5 text-right">Trip Payout</th>
                            <th className="p-2.5 text-right">Baseline Fee</th>
                            <th className="p-2.5 text-right">Proposed Fee</th>
                            <th className="p-2.5 text-right">Delta</th>
                            <th className="p-2.5 text-center">Inspect</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          {paginatedTxns.map((t) => (
                            <tr key={t.transactionId} className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold text-slate-900">{t.transactionId}</td>
                              <td className="p-2.5 text-slate-600">{t.workerId}</td>
                              <td className="p-2.5 text-slate-500 font-sans">{t.transactionDate}</td>
                              <td className="p-2.5 text-slate-800 font-sans capitalize">
                                {t.sector} ({t.vehicleType})
                              </td>
                              <td className="p-2.5 text-right text-slate-900">{formatINR(t.payout)}</td>
                              <td className="p-2.5 text-right text-slate-600">{formatINR(t.previousLiability)}</td>
                              <td className="p-2.5 text-right font-bold text-indigo-700">{formatINR(t.revisedLiability)}</td>
                              <td className={`p-2.5 text-right font-bold ${t.delta > 0 ? "text-rose-600" : "text-slate-400"}`}>
                                {t.delta > 0 ? `+${formatINR(t.delta)}` : "—"}
                              </td>
                              <td className="p-2.5 text-center">
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
                                      ruleVersionCode: t.revisedRuleCode,
                                      calculatedFee: t.revisedLiability,
                                      legalStatus: (t.legalStatus as LegalOperationalState) || "ACTIVE",
                                      evidence: t.evidenceCitation || {
                                        sourceDocumentId: "doc-ka-2025",
                                        sourceTitle: "Karnataka Platform Based Gig Workers Welfare Act, 2025",
                                        sourceType: "ACT",
                                        section: "Section 24(1)",
                                        clause: "Schedule I Fee Revision",
                                        quotedExcerpt: "Welfare fee for 4W motor cabs revised to 1.50% capped at ₹1.50.",
                                      },
                                      calculationSteps: [
                                        { label: "Net Payout", value: formatINR(t.payout) },
                                        { label: "Applied Rate", value: `${((extractedProposal?.proposedRate || 0.015) * 100).toFixed(2)}%` },
                                        { label: "Applied Cap", value: extractedProposal?.proposedCap ? formatINR(extractedProposal.proposedCap) : "None" },
                                        { label: "Final Computed Fee", value: formatINR(t.revisedLiability) },
                                      ],
                                      bindingExplanation: t.bindingExplanation,
                                      bindingResolutionStep: t.bindingResolutionStep,
                                      calculationBehaviour: t.calculationBehaviour,
                                    })
                                  }
                                  className="px-2 py-0.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded bg-indigo-50/50 cursor-pointer"
                                >
                                  Trace ↗
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Page {currentPage} of {totalPages}
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-2 py-0.5 border border-slate-300 rounded bg-white disabled:opacity-50 text-xs font-semibold"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-2 py-0.5 border border-slate-300 rounded bg-white disabled:opacity-50 text-xs font-semibold"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Human Review & Approval Gate (Unlocked) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Human Review & Approval Gate</h3>
                    <p className="text-xs text-slate-500">
                      Validate the AI interpretation, review the impact, and activate the rule version.
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  Gate Unlocked
                </span>
              </div>

              {actionMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{actionMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Verify Operational Legal State:
                    </label>
                    <select
                      value={verifiedState}
                      onChange={(e) => setVerifiedState(e.target.value as LegalOperationalState)}
                      disabled={approvalStatus !== "pending"}
                      className="w-full text-xs font-semibold p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="ACTIVE">ACTIVE — Operative rule in Karnataka</option>
                      <option value="UNDER_INTERIM_ORDER">UNDER_INTERIM_ORDER — Escrow segregation</option>
                      <option value="REQUIRES_REVIEW">REQUIRES_REVIEW — Awaiting final gazetting</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Compliance Officer Audit Note:
                    </label>
                    <textarea
                      value={approvalNote}
                      onChange={(e) => setApprovalNote(e.target.value)}
                      disabled={approvalStatus !== "pending"}
                      rows={3}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <div className="text-xs font-bold text-slate-800 mb-1">Approval Consequence:</div>
                    <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-1">
                      <li>Instantiates immutable rule version in calculation engine</li>
                      <li>Supersedes baseline rule ({extractedProposal.previousRuleCode})</li>
                      <li>Writes an append-only entry to the Provenance Audit Trail</li>
                    </ul>
                  </div>

                  <div className="flex items-center gap-2.5 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleApproveRule}
                      disabled={approvalStatus !== "pending"}
                      className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{approvalStatus === "approved" ? "Approved" : "Approve & Activate Rule"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRejectRule}
                      disabled={approvalStatus !== "pending"}
                      className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Provenance Trail (Unlocked) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Provenance Trail</h3>
                    <p className="text-xs text-slate-500">
                      Complete trace of the document, AI outputs, validation and approvals.
                    </p>
                  </div>
                </div>

                <Link
                  href="/audit"
                  className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  Full Audit Log ↗
                </Link>
              </div>

              {/* Lineage Chain */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">1. Document</div>
                  <div className="font-bold text-slate-800 mt-0.5 truncate">{currentScenario.title}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Ingested</div>
                </div>

                <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/40">
                  <div className="text-[10px] font-bold text-indigo-500 uppercase">2. AI Output</div>
                  <div className="font-bold text-indigo-900 mt-0.5">Semantic Interpret</div>
                  <div className="text-[10px] text-indigo-600 mt-1">
                    {isLiveGemini ? "Live Gemini" : "Structured Prompt"}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40">
                  <div className="text-[10px] font-bold text-emerald-500 uppercase">3. Safeguard</div>
                  <div className="font-bold text-emerald-900 mt-0.5">Schema Validation</div>
                  <div className="text-[10px] text-emerald-600 mt-1">Deterministic Gate Passed</div>
                </div>

                <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/40">
                  <div className="text-[10px] font-bold text-blue-500 uppercase">4. Impact</div>
                  <div className="font-bold text-blue-900 mt-0.5">5,000 Transactions</div>
                  <div className="text-[10px] text-blue-600 mt-1">
                    {impactSummary ? `${impactSummary.totalAffected.toLocaleString()} in-scope` : "Ready"}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/40">
                  <div className="text-[10px] font-bold text-purple-500 uppercase">5. Activation</div>
                  <div className="font-bold text-purple-900 mt-0.5">Human Decision</div>
                  <div className="text-[10px] text-purple-600 mt-1">
                    {approvalStatus === "approved" ? "Rule Activated" : "Awaiting Approval"}
                  </div>
                </div>
              </div>

              {/* Live Append-Only Log Entries */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="text-[10.5px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Append-Only Provenance Trail:
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {provenanceEntries.slice(-4).reverse().map((entry) => (
                    <div key={entry.id} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-indigo-100 text-indigo-800">
                          {entry.actor}
                        </span>
                        <div>
                          <span className="font-bold text-slate-800">{entry.eventType}</span>
                          <p className="font-sans text-[11px] text-slate-600 mt-0.5">{entry.note}</p>
                        </div>
                      </div>
                      <span className="font-sans text-[10px] text-slate-400 shrink-0">
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Transaction Binding Drawer ── */}
      <TransactionBindingDrawer
        isOpen={!!selectedTxnBinding}
        onClose={() => setSelectedTxnBinding(null)}
        data={selectedTxnBinding}
      />
    </AppShell>
  );
}
