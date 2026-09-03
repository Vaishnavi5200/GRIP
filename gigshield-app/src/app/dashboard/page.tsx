"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { demoStore } from "@/lib/store/demo-store";
import { formatINR } from "@/lib/engines/calculation-engine";
import {
  BookOpen,
  Database,
  Calculator,
  RotateCw,
  ShieldCheck,
  FileText,
  ArrowRight,
  AlertTriangle,
  Info,
  Sparkles,
  X,
  RefreshCw,
  CheckCircle2,
  Users2,
} from "lucide-react";

// ─── 19-Step Workflow ──────────────────────────────────────────────────────────
const WORKFLOW_STEPS = [
  {
    num: 1,
    title: "Company joins GigShield",
    desc: "Company creates its organization and adds its compliance/finance users.",
  },
  {
    num: 2,
    title: "Company selects its states",
    desc: "GigShield checks which regulatory frameworks apply to the company's operations.",
  },
  {
    num: 3,
    title: "GigShield understands the regulations",
    desc: "Regulations are stored as versioned rules.",
  },
  {
    num: 4,
    title: "Company uploads data",
    desc: "Worker data + payout/transaction data comes into the system.",
  },
  {
    num: 5,
    title: "GigShield checks the data",
    desc: "Missing, duplicate, invalid or incomplete records are identified.",
  },
  {
    num: 6,
    title: "GigShield calculates compliance liability",
    desc: "The Rule Engine applies the correct state, sector, vehicle, rate, cap and effective-date rules.",
  },
  {
    num: 7,
    title: "GigShield reconciles",
    desc: "Platform records are compared with finance records.",
  },
  {
    num: 8,
    title: "Problems are identified",
    desc: "Mismatches, missing records and calculation discrepancies become compliance issues.",
  },
  {
    num: 9,
    title: "GigShield generates a Risk Score",
    desc: "All compliance factors are converted into a 0–100 Compliance Health Score.",
  },
  {
    num: 10,
    title: "User fixes issues",
    desc: "GigShield shows what needs attention.",
  },
  {
    num: 11,
    title: "Deadlines and alerts",
    desc: "The system tracks upcoming compliance tasks and alerts the relevant user.",
  },
  {
    num: 12,
    title: "Report is generated",
    desc: "Once data is ready, GigShield generates the compliance report.",
  },
  {
    num: 13,
    title: "Audit trail is created",
    desc: "Important calculations, approvals, changes and actions are recorded.",
  },
  {
    num: 14,
    title: "GigShield keeps monitoring",
    desc: "This is where the SaaS recurring workflow begins again.",
  },
  {
    num: 15,
    title: "Regulatory AI detects the change",
    desc: "AI compares the previous and new regulatory documents.",
  },
  {
    num: 16,
    title: "AI explains the impact",
    desc: "Fee changed → affected sector → effective date → estimated liability impact.",
  },
  {
    num: 17,
    title: "Human reviews the proposed change",
    desc: "Compliance officer reviews the AI-proposed rule version.",
  },
  {
    num: 18,
    title: "Approved change becomes a new Rule Version",
    desc: "The approved change is instantiated as an immutable rule version.",
  },
  {
    num: 19,
    title: "Future calculations use the new rule",
    desc: "🔁 And the cycle continues.",
  },
];

// ─── Workflow 6-step summary bar ────────────────────────────────────────────
const FLOW_STEPS = [
  { num: 1, label: "Regulations", sub: "We track state laws", href: "/regulations", color: "#4f46e5", bg: "#ede9fe" },
  { num: 2, label: "Your Data", sub: "Upload payouts & worker data", href: "/transactions", color: "#059669", bg: "#d1fae5" },
  { num: 3, label: "Calculations", sub: "Apply rules & compute fees", href: "/calculations", color: "#d97706", bg: "#fef3c7" },
  { num: 4, label: "Reconcile", sub: "Match & verify transactions", href: "/reconciliation", color: "#2563eb", bg: "#dbeafe" },
  { num: 5, label: "Risk Score", sub: "Measure compliance health", href: "/risk", color: "#dc2626", bg: "#fee2e2" },
  { num: 6, label: "Report", sub: "Generate reports & alerts", href: "/reports", color: "#7c3aed", bg: "#ede9fe" },
];

// ─── India Map SVG (simplified outline for Compliance by State) ─────────────
function IndiaSVGMap() {
  return (
    <svg viewBox="0 0 220 280" style={{ width: "100%", maxWidth: 200 }}>
      {/* Simplified India outline */}
      <path
        d="M 80 15 L 110 10 L 150 20 L 170 30 L 175 50 L 185 60 L 180 85 L 195 100 L 200 120 L 190 140 L 175 155 L 165 180 L 150 210 L 140 235 L 125 260 L 115 270 L 105 260 L 95 240 L 80 215 L 65 190 L 50 175 L 35 160 L 25 135 L 30 110 L 25 85 L 35 65 L 45 50 L 55 35 L 65 22 Z"
        fill="#f1f5f9"
        stroke="#e2e8f0"
        strokeWidth="1.5"
      />
      {/* Karnataka highlight - operational */}
      <path
        d="M 75 165 L 95 160 L 110 163 L 120 170 L 115 185 L 100 195 L 80 190 L 68 180 Z"
        fill="#10b981"
        opacity="0.7"
      />
      {/* Rajasthan - operational */}
      <path
        d="M 60 80 L 100 70 L 115 80 L 110 100 L 90 110 L 65 105 L 52 95 Z"
        fill="#10b981"
        opacity="0.6"
      />
      {/* Telangana - draft */}
      <path
        d="M 110 160 L 130 155 L 140 163 L 135 178 L 118 183 L 105 175 Z"
        fill="#f59e0b"
        opacity="0.7"
      />
      {/* Maharashtra - operational */}
      <path
        d="M 65 130 L 100 122 L 118 128 L 120 148 L 102 158 L 72 155 L 55 145 Z"
        fill="#10b981"
        opacity="0.55"
      />
      {/* Uttar Pradesh - policy activity */}
      <path
        d="M 95 65 L 140 58 L 150 70 L 145 85 L 115 90 L 95 82 Z"
        fill="#3b82f6"
        opacity="0.55"
      />
      {/* Delhi dot */}
      <circle cx="108" cy="70" r="4" fill="#4f46e5" />
    </svg>
  );
}

export default function DashboardPage() {
  const [showModal, setShowModal] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const recon = demoStore.reconSummary || demoStore.runReconciliation();
  const health = demoStore.getComplianceHealthScore();
  const totalFee = demoStore.calculatedItems.reduce((s, c) => s + c.welfareFee, 0);
  const lastImport = demoStore.auditLogs.find(l => l.action === "batch.uploaded" || l.entityType === "upload_batch");
  const lastDataLabel = lastImport ? `Data imported: ${lastImport.createdAt.split("T")[0]}` : "No data imported yet";

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => { setSyncing(false); }, 800);
  };

  // Gauge arc math
  const score = health.total;
  const gaugeAngle = (score / 100) * 180; // 0–180°
  const r = 70;
  const cx = 100, cy = 95;
  const startX = cx - r, startY = cy;
  const rad = (deg: number) => (deg - 180) * Math.PI / 180;
  const endX = cx + r * Math.cos(rad(gaugeAngle));
  const endY = cy + r * Math.sin(rad(gaugeAngle));

  const gaugeColor = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <AppShell>
      {/* ── Top Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 8 }}>
            Welcome, {demoStore.activeUser.name.split(" ")[0]}! 👋
          </h1>
          <p style={{ fontSize: 12.5, color: "#94a3b8", marginTop: 3, fontWeight: 400 }}>
            Stay compliant. We handle the complexity.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            {lastDataLabel}
          </span>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 9, fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer" }}
          >
            <RefreshCw style={{ width: 13, height: 13, color: "#64748b" }} className={syncing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── 6-Step Workflow Bar ── */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "14px 18px", marginBottom: 22, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94a3b8" }}>
            End-to-End Compliance Operations Flow:
          </span>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#4f46e5", background: "none", border: "none", cursor: "pointer" }}
          >
            <Sparkles style={{ width: 13, height: 13 }} />
            View Full 19-Step Closed Loop Workflow →
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
          {FLOW_STEPS.map((step, i) => (
            <React.Fragment key={step.num}>
              <Link
                href={step.href}
                style={{ display: "flex", flexDirection: "column", padding: "11px 12px", borderRadius: 10, border: "1px solid #f1f5f9", background: "#fff", textDecoration: "none", cursor: "pointer", transition: "all 0.15s" }}
                className="flow-step-card"
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, background: step.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8, flexShrink: 0 }}>
                  {step.num === 1 && <BookOpen style={{ width: 16, height: 16, color: step.color }} />}
                  {step.num === 2 && <Database style={{ width: 16, height: 16, color: step.color }} />}
                  {step.num === 3 && <Calculator style={{ width: 16, height: 16, color: step.color }} />}
                  {step.num === 4 && <RotateCw style={{ width: 16, height: 16, color: step.color }} />}
                  {step.num === 5 && <ShieldCheck style={{ width: 16, height: 16, color: step.color }} />}
                  {step.num === 6 && <FileText style={{ width: 16, height: 16, color: step.color }} />}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{step.num}. {step.label}</div>
                <div style={{ fontSize: 10.5, color: "#94a3b8", lineHeight: 1.4, marginTop: 2 }}>{step.sub}</div>
              </Link>
              {i < FLOW_STEPS.length - 1 && (
                <div style={{ display: "none" }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Row 2: Compliance by State | Karnataka | Compliance Health | Upcoming Tasks ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, marginBottom: 18 }}>

        {/* Card A: Compliance by State (India Map) */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>Compliance by State</div>
          <div style={{ fontSize: 10.5, color: "#94a3b8", marginBottom: 12 }}>Regulatory tracking across India</div>

          <IndiaSVGMap />

          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 5 }}>
            {[
              { dot: "#10b981", label: "Operational", sub: "Law Active", count: "3 States" },
              { dot: "#f59e0b", label: "Draft / In Progress", sub: "Rules Notified", count: "2 States" },
              { dot: "#3b82f6", label: "Policy Activity", sub: "Bill / Discussion", count: "1 State" },
              { dot: "#cbd5e1", label: "Not Started", sub: "No Law Yet", count: "25 States" },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 10.5 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#475569" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: row.dot, flexShrink: 0 }} />
                  <span>
                    <span style={{ fontWeight: 600 }}>{row.label}</span>
                    <br />
                    <span style={{ fontSize: 9.5, color: "#94a3b8" }}>{row.sub}</span>
                  </span>
                </span>
                <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 11 }}>{row.count}</span>
              </div>
            ))}
          </div>

          <Link href="/regulations" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600, color: "#4f46e5", textDecoration: "none", marginTop: 12 }}>
            Explore All States <ArrowRight style={{ width: 12, height: 12 }} />
          </Link>
        </div>

        {/* Card B: Karnataka Detail */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Karnataka</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#d1fae5", color: "#065f46" }}>Operational</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 11.5 }}>
            <div>
              <div style={{ color: "#94a3b8", fontSize: 10, marginBottom: 2 }}>Law Name</div>
              <div style={{ fontWeight: 600, color: "#1e293b" }}>Karnataka Gig Workers Act, 2025</div>
            </div>
            <div>
              <div style={{ color: "#94a3b8", fontSize: 10, marginBottom: 2 }}>Welfare Fee</div>
              <div style={{ fontWeight: 600, color: "#1e293b", display: "flex", alignItems: "center", gap: 4 }}>
                1% of Payout (Capped)
                <Info style={{ width: 12, height: 12, color: "#94a3b8" }} />
              </div>
            </div>
            <div>
              <div style={{ color: "#94a3b8", fontSize: 10, marginBottom: 2 }}>Effective Date</div>
              <div style={{ fontWeight: 600, color: "#1e293b" }}>16 Feb 2026</div>
            </div>
            <div>
              <div style={{ color: "#94a3b8", fontSize: 10, marginBottom: 2 }}>Reporting Frequency</div>
              <div style={{ fontWeight: 600, color: "#1e293b" }}>Quarterly</div>
            </div>
            <div>
              <div style={{ color: "#94a3b8", fontSize: 10, marginBottom: 2 }}>Registration Deadline</div>
              <div style={{ fontWeight: 600, color: "#1e293b" }}>Within 45 Days</div>
            </div>
            <div>
              <div style={{ color: "#94a3b8", fontSize: 10, marginBottom: 2 }}>Worker Update Deadline</div>
              <div style={{ fontWeight: 600, color: "#1e293b" }}>Within 7 Days</div>
            </div>
          </div>

          <Link href="/regulations" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600, color: "#4f46e5", textDecoration: "none", marginTop: 16, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
            View Full Details <ArrowRight style={{ width: 12, height: 12 }} />
          </Link>
        </div>

        {/* Card C: Compliance Health Gauge */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Compliance Health</div>

          {/* Semicircle gauge */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center" }}>
            <svg viewBox="0 0 200 115" style={{ width: "100%", maxWidth: 200, overflow: "visible" }}>
              <defs>
                <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="45%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              {/* Background arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {/* Colored arc - score-driven */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#gaugeGrad)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray="251.3"
                strokeDashoffset={251.3 - 251.3 * (score / 100)}
                style={{ transition: "stroke-dashoffset 1.2s ease" }}
              />
              {/* Score text */}
              <text x="100" y="82" textAnchor="middle" fontSize="32" fontWeight="800" fill="#0f172a" fontFamily="Inter, sans-serif">
                {score}
              </text>
              <text x="100" y="97" textAnchor="middle" fontSize="11" fill="#94a3b8" fontFamily="Inter, sans-serif">
                / 100
              </text>
            </svg>

            <span style={{ display: "inline-block", padding: "4px 14px", borderRadius: 20, background: "#d1fae5", color: "#065f46", fontSize: 12, fontWeight: 800, marginTop: 4 }}>
              Healthy
            </span>
            <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 6, lineHeight: 1.5 }}>
              You are compliant.<br />Keep up the good work!
            </p>
          </div>

          <Link href="/risk" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#4f46e5", textDecoration: "none", paddingTop: 12, borderTop: "1px solid #f1f5f9", marginTop: 8 }}>
            View Risk Analysis <ArrowRight style={{ width: 12, height: 12 }} />
          </Link>
        </div>

        {/* Card D: Upcoming Tasks */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Upcoming Tasks</span>
            <Link href="/risk" style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 600, color: "#4f46e5", textDecoration: "none" }}>
              View Calendar <ArrowRight style={{ width: 11, height: 11 }} />
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            {[
              { icon: <Users2 style={{ width: 14, height: 14 }} />, bg: "#ede9fe", color: "#4f46e5", title: "Worker Data Reconciliation", sub: "Reconcile worker count with payouts", days: "3 Days", daysColor: "#dc2626", date: "08 Sep 2026" },
              { icon: <Calculator style={{ width: 14, height: 14 }} />, bg: "#fef3c7", color: "#d97706", title: "Fee Validation", sub: "Validate Q3 welfare fee calculations", days: "10 Days", daysColor: "#64748b", date: "15 Sep 2026" },
              { icon: <FileText style={{ width: 14, height: 14 }} />, bg: "#dbeafe", color: "#2563eb", title: "Quarterly Compliance Report", sub: "Q3 report submission for Karnataka", days: "25 Days", daysColor: "#64748b", date: "30 Sep 2026" },
              { icon: <RotateCw style={{ width: 14, height: 14 }} />, bg: "#d1fae5", color: "#059669", title: "Worker Update Reporting", sub: "Report new/removed workers", days: "2 Days", daysColor: "#dc2626", date: "07 Sep 2026" },
            ].map((task, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 8px", borderRadius: 9, background: i === 0 || i === 3 ? "#fef2f2" : "#fafafa" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: task.bg, display: "flex", alignItems: "center", justifyContent: "center", color: task.color, flexShrink: 0 }}>
                    {task.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "#0f172a" }}>{task.title}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>{task.sub}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: task.daysColor }}>{task.days}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>{task.date}</div>
                </div>
              </div>
            ))}
          </div>

          <Link href="/risk" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#4f46e5", textDecoration: "none", paddingTop: 12, borderTop: "1px solid #f1f5f9", marginTop: 10 }}>
            View All Tasks <ArrowRight style={{ width: 12, height: 12 }} />
          </Link>
        </div>
      </div>

      {/* ── Row 3: Welfare Liability Trend | Reconciliation Overview | Recent Alerts ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, marginBottom: showBanner ? 70 : 20 }}>

        {/* Card E: Welfare Liability Trend */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>Welfare Liability Trend</div>
          <div style={{ fontSize: 10.5, color: "#94a3b8", marginBottom: 12 }}>This Quarter</div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", fontFamily: "monospace", letterSpacing: "-0.03em" }}>
              {formatINR(totalFee)}
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#d1fae5", color: "#065f46", border: "1px solid #a7f3d0" }}>
              ↑ 18.7% vs Last Quarter
            </span>
          </div>

          {/* Chart */}
          <svg viewBox="0 0 300 130" style={{ width: "100%", overflow: "visible" }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Grid */}
            {[20, 50, 80, 110].map(y => (
              <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="#f1f5f9" strokeWidth="1" />
            ))}
            {/* Y labels */}
            <text x="0" y="15" fontSize="8" fill="#94a3b8">₹60L</text>
            <text x="0" y="50" fontSize="8" fill="#94a3b8">₹40L</text>
            <text x="0" y="85" fontSize="8" fill="#94a3b8">₹20L</text>
            <text x="0" y="118" fontSize="8" fill="#94a3b8">₹0</text>
            {/* Area fill */}
            <polygon points="30,100 110,72 195,52 275,30 275,125 30,125" fill="url(#areaGrad)" />
            {/* Line */}
            <polyline points="30,100 110,72 195,52 275,30" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Dots */}
            {[[30, 100], [110, 72], [195, 52], [275, 30]].map(([x, y]) => (
              <circle key={x} cx={x} cy={y} r="4" fill="#6366f1" stroke="#fff" strokeWidth="2" />
            ))}
            {/* X labels */}
            <text x="30" y="128" fontSize="8" fill="#94a3b8" textAnchor="middle">Jul &apos;26</text>
            <text x="110" y="128" fontSize="8" fill="#94a3b8" textAnchor="middle">Aug &apos;26</text>
            <text x="275" y="128" fontSize="8" fill="#94a3b8" textAnchor="middle">Sep &apos;26</text>
          </svg>
        </div>

        {/* Card F: Reconciliation Overview (Donut) */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>Reconciliation Overview</div>
          <div style={{ fontSize: 10.5, color: "#94a3b8", marginBottom: 14 }}>This Quarter</div>

          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {/* Donut */}
            <div style={{ position: "relative", width: 110, height: 110, flexShrink: 0 }}>
              <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" strokeWidth="14" />
                {/* Matched ~98.7% */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" strokeWidth="14"
                  strokeDasharray={`${238 * 0.987} ${238 * 0.013}`} />
                {/* Mismatched segment */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#f59e0b" strokeWidth="14"
                  strokeDasharray={`${238 * 0.008} ${238 * 0.992}`}
                  strokeDashoffset={-(238 * 0.987)} />
                {/* Missing segment */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#ef4444" strokeWidth="14"
                  strokeDasharray={`${238 * 0.003} ${238 * 0.997}`}
                  strokeDashoffset={-(238 * 0.995)} />
                {/* Duplicates */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#6366f1" strokeWidth="14"
                  strokeDasharray={`${238 * 0.002} ${238 * 0.998}`}
                  strokeDashoffset={-(238 * 0.998)} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", fontFamily: "monospace", lineHeight: 1 }}>
                  {recon.totalRecords.toLocaleString()}
                </span>
                <span style={{ fontSize: 8.5, textTransform: "uppercase", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.04em" }}>Trips</span>
              </div>
            </div>

            {/* Legend */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { dot: "#10b981", label: "Matched", count: recon.matchedCount.toLocaleString(), pct: `${((recon.matchedCount / recon.totalRecords) * 100).toFixed(1)}%` },
                { dot: "#f59e0b", label: "Financial Discrepancies", count: (recon.feeMismatchCount + recon.payoutMismatchCount + recon.fullMismatchCount).toString(), pct: `${(((recon.feeMismatchCount + recon.payoutMismatchCount + recon.fullMismatchCount) / recon.totalRecords) * 100).toFixed(1)}%` },
                { dot: "#ef4444", label: "Missing from Ledger", count: recon.missingFromLedgerCount.toString(), pct: `${((recon.missingFromLedgerCount / recon.totalRecords) * 100).toFixed(1)}%` },
                { dot: "#6366f1", label: "Integrity Exceptions", count: (recon.duplicateInLedgerCount + recon.unexpectedInLedgerCount).toString(), pct: `${(((recon.duplicateInLedgerCount + recon.unexpectedInLedgerCount) / recon.totalRecords) * 100).toFixed(1)}%` },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 7, color: "#475569" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: row.dot, flexShrink: 0 }} />
                    {row.label}
                  </span>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>
                    {row.count} <span style={{ fontSize: 9.5, color: "#94a3b8", fontWeight: 400 }}>({row.pct})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Link href="/reconciliation" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#4f46e5", textDecoration: "none", paddingTop: 12, borderTop: "1px solid #f1f5f9", marginTop: 14 }}>
            View Reconciliation Details <ArrowRight style={{ width: 12, height: 12 }} />
          </Link>
        </div>

        {/* Card G: Recent Alerts */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Recent Alerts</span>
            <Link href="/risk" style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 600, color: "#4f46e5", textDecoration: "none" }}>
              View All Alerts <ArrowRight style={{ width: 11, height: 11 }} />
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
            {[
              { Icon: AlertTriangle, iconColor: "#dc2626", title: "61 transactions have financial discrepancies", sub: "Fee and payout reconciliation pending", badge: "High", badgeColor: "#dc2626", time: "1h ago" },
              { Icon: AlertTriangle, iconColor: "#d97706", title: "612 worker records missing bank details", sub: "May impact benefit disbursement", badge: "Medium", badgeColor: "#d97706", time: "3h ago" },
              { Icon: Info, iconColor: "#2563eb", title: "Karnataka regulation updated", sub: "New draft amendment published on 01 Sep 2026", badge: "Low", badgeColor: "#2563eb", time: "5h ago" },
              { Icon: CheckCircle2, iconColor: "#059669", title: "Q2 Report successfully prepared", sub: "Karnataka Q2 compliance report ready for review", badge: "Info", badgeColor: "#64748b", time: "1 day ago" },
            ].map((alert, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "6px 4px" }}>
                <div style={{ display: "flex", gap: 9, flex: 1 }}>
                  <alert.Icon style={{ width: 14, height: 14, color: alert.iconColor, flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>{alert.title}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{alert.sub}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: alert.badgeColor }}>{alert.badge}</div>
                  <div style={{ fontSize: 9.5, color: "#cbd5e1" }}>{alert.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Floating Banner (AI Regulatory Update) ── */}
      {showBanner && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: "var(--sidebar-width, 256px)",
          right: 0,
          zIndex: 50,
        }}>
          <div style={{
            background: "#1e1b4b",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 28px",
            gap: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Sparkles style={{ width: 18, height: 18, color: "#a5b4fc" }} />
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                  Regulatory Update Detected
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(99,102,241,0.3)", color: "#a5b4fc", fontWeight: 700 }}>Draft Bill</span>
                </div>
                <div style={{ fontSize: 11.5, color: "#a5b4fc", marginTop: 2 }}>New draft bill published for Telangana Gig Workers Welfare Act, 2026</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link href="/monitor" style={{ padding: "8px 16px", border: "1px solid rgba(99,102,241,0.5)", borderRadius: 9, fontSize: 12, fontWeight: 600, color: "#a5b4fc", textDecoration: "none" }}>
                View Changes
              </Link>
              <Link href="/calculations" style={{ padding: "8px 18px", background: "#fff", borderRadius: 9, fontSize: 12, fontWeight: 700, color: "#1e293b", textDecoration: "none" }}>
                Impact Analysis
              </Link>
              <button type="button" onClick={() => setShowBanner(false)} style={{ padding: 6, background: "none", border: "none", cursor: "pointer", color: "#6366f1" }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 19-Step Closed Loop Modal ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(15,23,42,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 18, maxWidth: 680, width: "100%", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,0.25)", overflow: "hidden" }}>
            {/* Modal Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafafa" }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#4f46e5", marginBottom: 4 }}>GigShield Core Architecture</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>The 19-Step Closed-Loop Compliance Workflow</div>
              </div>
              <button type="button" onClick={() => setShowModal(false)} style={{ padding: 6, borderRadius: 8, background: "#f1f5f9", border: "none", cursor: "pointer", display: "flex" }}>
                <X style={{ width: 18, height: 18, color: "#64748b" }} />
              </button>
            </div>

            {/* Steps list */}
            <div style={{ overflowY: "auto", padding: "20px 24px" }}>
              {WORKFLOW_STEPS.map((step, i) => (
                <div key={step.num}>
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: step.num > 14 ? "#fef3c7" : "#ede9fe", border: `1.5px solid ${step.num > 14 ? "#fcd34d" : "#c7d2fe"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: step.num > 14 ? "#92400e" : "#4338ca", flexShrink: 0 }}>
                      {step.num}
                    </div>
                    <div style={{ paddingBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{step.title}</div>
                      <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 3, lineHeight: 1.5 }}>{step.desc}</div>
                    </div>
                  </div>
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <div style={{ marginLeft: 13, marginBottom: 2, height: 14, width: 2, background: "#e2e8f0", borderRadius: 2 }} />
                  )}
                  {step.num === 14 && (
                    <div style={{ marginLeft: 42, marginBottom: 10, padding: "6px 10px", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, fontSize: 11, color: "#92400e", fontWeight: 600 }}>
                      🔁 If a regulation changes, the AI-powered loop activates:
                    </div>
                  )}
                </div>
              ))}
              <div style={{ marginTop: 16, padding: "12px 16px", background: "#ede9fe", borderRadius: 10, fontSize: 12, color: "#3730a3", fontWeight: 700, textAlign: "center" }}>
                🔁 And the cycle continues. GigShield never stops monitoring.
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
