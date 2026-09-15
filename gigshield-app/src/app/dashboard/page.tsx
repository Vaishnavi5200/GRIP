"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { demoStore } from "@/lib/store/demo-store";
import { formatINR } from "@/lib/engines/calculation-engine";
import { ProposedRuleExtraction } from "@/lib/engines/regulatory-types";
import {
  FileText,
  Clock,
  ArrowRight,
  Info,
  Zap,
  Calendar,
  Users2,
  ListFilter,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

export default function DashboardPage() {
  // Deterministic source of truth: simulate the primary V4 cab revision scenario
  const primaryProposal: ProposedRuleExtraction = useMemo(() => {
    return {
      id: "prop-ka-cab-revision",
      documentTitle: "Karnataka 4W Welfare Fee Rate Revision",
      sourceType: "NOTIFICATION",
      jurisdiction: "KA",
      sector: "ride-hailing",
      vehicleType: "4W",
      proposedRate: 0.015,
      proposedCap: 1.5,
      effectiveDate: "2026-10-01",
      aiProposedState: "REQUIRES_REVIEW",
      legalStatus: "REQUIRES_REVIEW",
      confidence: "HIGH",
      confidenceRationale: {
        level: "HIGH",
        allRequiredFieldsExtracted: true,
        directEvidenceCitationFound: true,
        unresolvedAmbiguityCount: 1,
        notes: "All fields extracted with direct clause citations.",
      },
      interpretationNarrative:
        "Draft notification proposing to increase the welfare fee for Four-Wheeler (4W) ride-hailing cabs from 1.00% (cap ₹1.00) to 1.50% (cap ₹1.50) effective 01-Oct-2026.",
      potentialInconsistencies: [],
      applicabilityConditions: ["Vehicle type: 4W motor cabs only", "Sector: Ride-hailing", "Jurisdiction: Karnataka"],
      recommendedAction: {
        title: "Prepare 4W cab rate transition",
        steps: ["Review affected transactions", "Stage approved rule version"],
        urgency: "BEFORE_EFFECTIVE_DATE",
        confidence: "HIGH",
        basis: "Draft gazette open under Rule 12 consultation window.",
      },
      summary: "Welfare fee for 4W motor cabs revised to 1.50% capped at ₹1.50.",
      evidence: [
        {
          sourceDocumentId: "SYNTH-KA-4W-CAB-2026",
          sourceTitle: "Synthetic: 4W Cab Rate Revision",
          sourceType: "NOTIFICATION",
          section: "Section 24 read with Section 4(2)",
          clause: "Clauses 1, 2, 3 & 6",
          quotedExcerpt:
            "For motor cabs (Four-Wheeler / 4W) engaged in passenger ride-hailing services, the welfare cess rate shall be revised from 1.0% to 1.5% of net driver payout, with maximum cap revised from ₹1.00 to ₹1.50, effective 01 October 2026.",
        },
      ],
      ambiguities: [],
      exclusions: [],
      previousRuleCode: "KA-2025-02-RH-4W",
      previousRate: 0.01,
      previousCap: 1.0,
      changeHighlights: [
        { field: "Statutory Rate", oldValue: "1.00%", newValue: "1.50%", impact: "increase" },
        { field: "Transaction Cap", oldValue: "₹1.00", newValue: "₹1.50", impact: "increase" },
      ],
      schemaValid: true,
      schemaValidationErrors: [],
    };
  }, []);

  // Compute exact metrics deterministically through the calculation engine
  const simulation = useMemo(() => {
    return demoStore.simulateRegulatoryImpact(primaryProposal);
  }, [primaryProposal]);

  const affectedTxns = simulation.summary.totalAffected;
  const totalTxns = simulation.summary.totalAnalyzed;
  const sampleDelta = simulation.summary.liabilityDelta;
  // Deterministic annualized liability delta based on standard 4-quarter platform run-rate
  const annualizedDelta = sampleDelta * 4;

  const activeRulesCount = demoStore.ruleVersions.filter(
    (r) => r.lifecycleStatus === "active" || r.lifecycleStatus === "approved"
  ).length;
  const pendingEventsCount = demoStore.regulatoryEvents.filter(
    (e) => !e.verifiedState || e.aiProposedState === "REQUIRES_REVIEW"
  ).length;

  return (
    <AppShell>
      {/* ── Top Hero Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em", margin: 0, lineHeight: 1.2 }}>
            What changed, and what does it mean for your business?
          </h1>
          <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 5, fontWeight: 400 }}>
            GRIP understands regulatory changes and shows you the real transaction-level impact.
          </p>
        </div>

        {/* Regulatory Intelligence Badge Box */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 16px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#475569",
            }}
          >
            <Zap style={{ width: 17, height: 17 }} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#0f172a" }}>Regulatory Intelligence</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>From legal text to financial impact</div>
          </div>
        </div>
      </div>

      {/* ── Featured Regulatory Event Card (Pending Validation) ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: "24px 28px",
          marginBottom: 24,
          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.1fr 0.8fr", gap: 28, alignItems: "center" }}>
          {/* Left: Title, Description, and Synthetic Disclaimer */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "3px 9px",
                  borderRadius: 20,
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #e2e8f0",
                  letterSpacing: "0.04em",
                }}
              >
                SYNTHETIC SCENARIO
              </span>
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 6, lineHeight: 1.3 }}>
              Karnataka 4W Welfare Fee Rate Revision
            </h2>
            <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, marginBottom: 14 }}>
              Demonstrates a hypothetical rate increase based on the Karnataka Platform Based Gig Workers (Social Security and Welfare) Act, 2025.
            </p>

            {/* Synthetic Alert Box */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "8px 12px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 11,
                color: "#64748b",
              }}
            >
              <Info style={{ width: 14, height: 14, flexShrink: 0, color: "#64748b" }} />
              <span>This is a synthetic scenario created for demonstration purposes. Not an official government notification.</span>
            </div>
          </div>

          {/* Middle: Financial & Transaction Impact Metrics (Computed Deterministically) */}
          <div style={{ borderLeft: "1px solid #f1f5f9", paddingLeft: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: 20,
                  background: "#f8fafc",
                  color: "#475569",
                  border: "1px solid #e2e8f0",
                }}
              >
                <Clock style={{ width: 12, height: 12, color: "#64748b" }} />
                Pending Human Validation
              </span>
            </div>

            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginBottom: 2 }}>
              Calculated Sample Liability Delta
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              + {formatINR(sampleDelta)}
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 3, marginBottom: 10 }}>
              across {affectedTxns.toLocaleString()} in-scope 4W trips ({totalTxns.toLocaleString()} total)
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#334155", fontWeight: 600 }}>
              <span>Current: <strong>1.00% (cap ₹1.00)</strong></span>
              <span style={{ color: "#94a3b8" }}>→</span>
              <span style={{ color: "#0f172a" }}>Proposed: <strong>1.50% (cap ₹1.50)</strong></span>
            </div>
            <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 3 }}>
              Effective from: <strong>01 Oct 2026</strong>
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", gap: 10 }}>
            <Link
              href="/intelligence"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 22px",
                background: "#0f172a",
                color: "#ffffff",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                transition: "all 0.15s",
                width: "100%",
              }}
            >
              <span>Open in Intelligence Agent</span>
              <ArrowRight style={{ width: 15, height: 15 }} />
            </Link>

            <Link
              href="/intelligence"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11.5,
                fontWeight: 600,
                color: "#475569",
                textDecoration: "none",
                alignSelf: "center",
              }}
            >
              <FileText style={{ width: 13, height: 13 }} />
              <span>Inspect Source Document</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Business & Regulatory Impact Summary (Focused, Non-Cluttered) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {/* Metric 1: Pending Event Validation */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Clock style={{ width: 20, height: 20 }} />
          </div>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.04em" }}>
              Pending Validation
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", lineHeight: 1.2 }}>
              {pendingEventsCount} Event
            </div>
            <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 1 }}>
              Requires compliance review
            </div>
          </div>
        </div>

        {/* Metric 2: In-Scope Transactions */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ListFilter style={{ width: 20, height: 20 }} />
          </div>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.04em" }}>
              In-Scope Transactions
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", lineHeight: 1.2 }}>
              {affectedTxns.toLocaleString()}
            </div>
            <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 1 }}>
              Out of {totalTxns.toLocaleString()} platform sample
            </div>
          </div>
        </div>

        {/* Metric 3: Deterministic Liability Delta */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <BarChart3 style={{ width: 20, height: 20 }} />
          </div>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.04em" }}>
              Sample Liability Delta
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", lineHeight: 1.2 }}>
              +{formatINR(sampleDelta)}
            </div>
            <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 1 }}>
              Deterministic engine output
            </div>
          </div>
        </div>

        {/* Metric 4: Active Rules */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ShieldCheck style={{ width: 20, height: 20 }} />
          </div>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.04em" }}>
              Active Rules
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", lineHeight: 1.2 }}>
              {activeRulesCount} Rules
            </div>
            <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 1 }}>
              Currently applied in calculations
            </div>
          </div>
        </div>
      </div>

      {/* ── Context Grid: Latest Regulatory Event | Active Rule | Upcoming Deadlines ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, marginBottom: 12 }}>
        {/* Card 1: Latest Regulatory Event */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Latest Regulatory Event</span>
              <Link href="/regulations" style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", textDecoration: "none", display: "flex", alignItems: "center", gap: 2 }}>
                View All <ArrowRight style={{ width: 11, height: 11 }} />
              </Link>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FileText style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>
                  Karnataka 4W Welfare Fee Rate Revision
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}>
                    SYNTHETIC SCENARIO
                  </span>
                  <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}>
                    AI PROPOSED
                  </span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>
              01 Sep 2026 • Synthetic: 4W Cab Rate Revision
            </div>
            <p style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.45, margin: 0 }}>
              Draft amendment proposing 1.00% → 1.50% (cap ₹1.00 → ₹1.50) rate change for Four-Wheeler motor cabs.
            </p>
          </div>
        </div>

        {/* Card 2: Active Rule (Current) */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Active Rule (Current)</span>
              <Link href="/rule-versions" style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", textDecoration: "none", display: "flex", alignItems: "center", gap: 2 }}>
                View All <ArrowRight style={{ width: 11, height: 11 }} />
              </Link>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                KA-2025-02-RH-4W
              </div>
              <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: "#f0fdf4", color: "#166534", border: "1px solid #dcfce7" }}>
                ACTIVE
              </span>
            </div>

            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 14 }}>
              Ride-hailing • 4W • Non-EV
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div>
                <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>Fee Rate</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>1.00% of payout (capped at ₹1.00)</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>Effective From</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>16 Feb 2026</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Upcoming Deadlines */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Upcoming Deadlines</span>
              <Link href="/audit" style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", textDecoration: "none", display: "flex", alignItems: "center", gap: 2 }}>
                View Calendar <ArrowRight style={{ width: 11, height: 11 }} />
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Item 1 */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 6, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Calendar style={{ width: 15, height: 15 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>Quarterly Filing (Q3 2026)</div>
                    <div style={{ fontSize: 10.5, color: "#94a3b8" }}>30 Sep 2026</div>
                  </div>
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}>
                  19 Days
                </span>
              </div>

              {/* Item 2 */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 6, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Users2 style={{ width: 15, height: 15 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>Worker Data Reconciliation</div>
                    <div style={{ fontSize: 10.5, color: "#94a3b8" }}>15 Sep 2026</div>
                  </div>
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}>
                  4 Days
                </span>
              </div>

              {/* Item 3 */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 6, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FileText style={{ width: 15, height: 15 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>Rule Impact Review</div>
                    <div style={{ fontSize: 10.5, color: "#94a3b8" }}>01 Oct 2026</div>
                  </div>
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}>
                  20 Days
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
