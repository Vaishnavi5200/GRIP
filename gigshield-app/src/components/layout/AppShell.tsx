"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  MapPin,
  Users,
  Receipt,
  Calculator,
  GitCompare,
  ShieldAlert,
  History,
  FileSpreadsheet,
  BellRing,
  Building2,
  ScrollText,
  Bell,
  Upload,
  RotateCcw,
  Sparkles,
  Check,
  Zap,
  X,
  CreditCard,
} from "lucide-react";
import { demoStore, SAAS_PLANS, PlanDefinition } from "@/lib/store/demo-store";

export interface AppShellProps {
  children: React.ReactNode;
}

const navGroups = [
  {
    label: "",
    items: [{ label: "Overview", href: "/dashboard", icon: Home }],
  },
  {
    label: "INTELLIGENCE AGENT",
    items: [
      { label: "Regulatory Agent", href: "/monitor", icon: BellRing, badge: "AI Agent" },
      { label: "Impact Simulator", href: "/simulator", icon: Calculator, badge: "5,000 Txns" },
      { label: "Rule Diff & Registry", href: "/rule-versions", icon: History },
      { label: "Regulatory Map", href: "/regulations", icon: MapPin },
    ],
  },
  {
    label: "DETERMINISTIC OPS",
    items: [
      { label: "Transactions", href: "/transactions", icon: Receipt },
      { label: "Fee Calculations", href: "/calculations", icon: Calculator },
      { label: "Reconciliation Hub", href: "/reconciliation", icon: GitCompare },
      { label: "Compliance Risk", href: "/risk", icon: ShieldAlert },
      { label: "Statutory Reports", href: "/reports", icon: FileSpreadsheet },
    ],
  },
  {
    label: "SETTINGS & AUDIT",
    items: [
      { label: "Organization & Billing", href: "/settings", icon: Building2 },
      { label: "Users & Roles", href: "/team", icon: Users },
      { label: "Immutable Audit Trail", href: "/audit", icon: ScrollText },
    ],
  },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser] = useState(demoStore.activeUser);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanDefinition>(demoStore.getCurrentPlan());
  const [planSuccessMsg, setPlanSuccessMsg] = useState<string | null>(null);

  const txnCount = demoStore.transactions.length;
  const usagePct = Math.min(100, Math.round((txnCount / currentPlan.monthlyTransactionLimit) * 100));

  const handleSwitchPlan = (planKey: "free" | "growth" | "enterprise") => {
    demoStore.switchPlan(planKey);
    setCurrentPlan(demoStore.getCurrentPlan());
    setPlanSuccessMsg(`Workspace tier updated to ${SAAS_PLANS[planKey].name}!`);
    setTimeout(() => {
      setPlanSuccessMsg(null);
      setShowPlansModal(false);
      router.refresh();
    }, 1200);
  };

  const handleReset = () => {
    if (window.confirm("Reset Sample Data?\n\nThis will reload the 5,000-record Karnataka platform transaction dataset and clear all issue resolutions.")) {
      demoStore.reset();
      setCurrentPlan(demoStore.getCurrentPlan());
      router.refresh();
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: 232,
        minWidth: 232,
        background: "#ffffff",
        borderRight: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 40,
        overflowY: "auto",
      }}>
        {/* Brand */}
        <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, overflow: "hidden", border: "1.5px solid #e0e7ff", background: "#eef2ff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Image src="/gigshield-logo.png" alt="GigShield" width={38} height={38} style={{ objectFit: "cover", width: "100%", height: "100%" }} priority />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.2 }}>GigShield</div>
            <div style={{ fontSize: 10, color: "#4f46e5", fontWeight: 600, marginTop: 2, lineHeight: 1 }}>Regulatory Intelligence Agent</div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: "10px 10px", overflowY: "auto" }}>
          {navGroups.map((group, gi) => (
            <div key={gi} style={{ marginBottom: gi < navGroups.length - 1 ? 16 : 0 }}>
              {group.label && (
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", padding: "0 8px", marginBottom: 4, marginTop: gi === 0 ? 0 : 0 }}>
                  {group.label}
                </div>
              )}
              {group.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/dashboard" && item.href !== "/transactions" && item.href !== "/calculations" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label + item.href}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "7px 10px",
                      borderRadius: 8,
                      marginBottom: 1,
                      textDecoration: "none",
                      fontSize: 13,
                      fontWeight: active ? 600 : 450,
                      color: active ? "#4f46e5" : "#64748b",
                      background: active ? "#ede9fe" : "transparent",
                      transition: "all 0.12s",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <Icon style={{ width: 15, height: 15, color: active ? "#4f46e5" : "#94a3b8", flexShrink: 0 }} />
                      <span>{item.label}</span>
                    </span>
                    {"badge" in item && item.badge && (
                      <span style={{ fontSize: 9, fontWeight: 700, background: "#4f46e5", color: "#fff", padding: "1px 6px", borderRadius: 20 }}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Subscription Plan Card */}
        <div style={{ padding: "10px 12px", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ background: currentPlan.id === "free" ? "#f8fafc" : "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)", border: currentPlan.id === "free" ? "1px solid #e2e8f0" : "1px solid #ddd6fe", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: currentPlan.id === "free" ? "#64748b" : "#4f46e5" }}>
                {currentPlan.name}
              </span>
              <span style={{ fontSize: 9.5, fontWeight: 700, padding: "1px 6px", borderRadius: 12, background: currentPlan.id === "free" ? "#e2e8f0" : "#4f46e5", color: currentPlan.id === "free" ? "#475569" : "#fff" }}>
                {currentPlan.priceINR}
              </span>
            </div>

            {/* Usage Progress */}
            <div style={{ marginTop: 6, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: "#64748b", marginBottom: 3 }}>
                <span>Monthly Volume</span>
                <span style={{ fontWeight: 600 }}>{txnCount.toLocaleString()} / {currentPlan.monthlyTransactionLimit.toLocaleString()}</span>
              </div>
              <div style={{ width: "100%", height: 5, background: "#e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ width: `${usagePct}%`, height: "100%", background: usagePct > 90 ? "#ef4444" : "#4f46e5", borderRadius: 10, transition: "width 0.3s" }} />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPlansModal(true)}
              style={{ width: "100%", padding: "6px 8px", background: "#4f46e5", color: "#fff", borderRadius: 7, border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, boxShadow: "0 1px 3px rgba(79,70,229,0.25)" }}
            >
              <Sparkles style={{ width: 12, height: 12 }} />
              <span>{currentPlan.id === "free" ? "Upgrade to Growth" : "Manage Subscription"}</span>
            </button>
          </div>
        </div>

        {/* Workspace Status Footer */}
        <div style={{ padding: "10px 14px", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 9.5, color: "#94a3b8", fontFamily: "monospace", letterSpacing: "0.04em" }}>v3.0 • Karnataka Module</span>
            <button
              type="button"
              onClick={handleReset}
              title="Reset to sample data baseline"
              style={{ fontSize: 10, color: "#cbd5e1", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, padding: "2px 4px" }}
            >
              <RotateCcw style={{ width: 10, height: 10 }} />
              Reset Data
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div style={{ flex: 1, marginLeft: 232, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* Top Bar */}
        <header style={{
          height: 60,
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          position: "sticky",
          top: 0,
          zIndex: 30,
          gap: 12,
        }}>
          {/* Org Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff" }}>
            <Building2 style={{ width: 14, height: 14, color: "#64748b" }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b" }}>{demoStore.org.name}</span>
          </div>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Plan indicator badge */}
            <button
              type="button"
              onClick={() => setShowPlansModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 20, border: "1px solid #c7d2fe", background: "#ede9fe", color: "#4f46e5", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
            >
              <Zap style={{ width: 12, height: 12, fill: "#4f46e5" }} />
              <span>{currentPlan.name}</span>
            </button>

            {/* Upload */}
            <Link
              href="/transactions"
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", background: "#4f46e5", color: "#fff", borderRadius: 10, fontSize: 12.5, fontWeight: 700, textDecoration: "none", boxShadow: "0 2px 6px rgba(79,70,229,0.3)" }}
            >
              <Upload style={{ width: 13, height: 13 }} />
              Upload Data
            </Link>

            {/* Bell */}
            <Link href="/risk" style={{ position: "relative", padding: 8, borderRadius: 10, color: "#64748b", textDecoration: "none", display: "flex" }}>
              <Bell style={{ width: 18, height: 18 }} />
              <span style={{ position: "absolute", top: 5, right: 5, width: 16, height: 16, background: "#ef4444", borderRadius: "50%", fontSize: 8.5, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>6</span>
            </Link>

            {/* User */}
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1e293b", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                {currentUser.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1e293b", lineHeight: 1.2 }}>{currentUser.name}</div>
                <div style={{ fontSize: 10.5, color: "#94a3b8", lineHeight: 1, textTransform: "capitalize" }}>{currentUser.role.replace("_", " ")}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: "28px 28px", maxWidth: 1440, width: "100%" }}>
          {children}
        </main>

        {/* Footer */}
        <footer style={{ background: "#fff", borderTop: "1px solid #e2e8f0", padding: "10px 28px", fontSize: 10.5, color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
          <span>
            <strong style={{ color: "#64748b" }}>Note:</strong> GigShield processes regulatory parameters based on publicly notified Karnataka state gazette data. Verify all calculations before statutory remittance.
          </span>
          <span style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "0.04em" }}>GigShield v3.0 • Karnataka Compliance Module</span>
        </footer>
      </div>

      {/* ── Subscription & Freemium Plans Modal ── */}
      {showPlansModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 24px 60px rgba(0,0,0,0.25)", border: "1px solid #e2e8f0", width: "100%", maxWidth: 860, maxHeight: "90vh", overflowY: "auto", padding: "28px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Sparkles style={{ width: 22, height: 22, color: "#4f46e5" }} />
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>GigShield Subscription & Freemium Plans</h2>
                </div>
                <p style={{ fontSize: 12.5, color: "#64748b", marginTop: 4 }}>
                  Transparent, volume-tiered SaaS pricing designed for gig-economy compliance operations in India.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPlansModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            {planSuccessMsg && (
              <div style={{ padding: "10px 16px", background: "#f0fdf4", border: "1px solid #a7f3d0", borderRadius: 10, color: "#065f46", fontSize: 12, fontWeight: 600, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
                <Check style={{ width: 16, height: 16, color: "#059669" }} />
                <span>{planSuccessMsg}</span>
              </div>
            )}

            {/* 3 Tier Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 20 }}>
              {(["free", "growth", "enterprise"] as const).map((key) => {
                const plan = SAAS_PLANS[key];
                const isSelected = currentPlan.id === key;
                return (
                  <div
                    key={key}
                    style={{
                      borderRadius: 14,
                      border: isSelected ? "2px solid #4f46e5" : "1px solid #e2e8f0",
                      background: isSelected ? "#faf5ff" : "#fff",
                      padding: "20px 18px",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      boxShadow: isSelected ? "0 8px 24px rgba(79,70,229,0.12)" : "none",
                    }}
                  >
                    {isSelected && (
                      <span style={{ position: "absolute", top: -10, left: 16, background: "#4f46e5", color: "#fff", fontSize: 9.5, fontWeight: 800, padding: "2px 8px", borderRadius: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Active Plan
                      </span>
                    )}

                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 2 }}>{plan.name}</div>
                    <p style={{ fontSize: 11, color: "#64748b", minHeight: 32, marginBottom: 12, lineHeight: 1.4 }}>{plan.tagline}</p>

                    <div style={{ marginBottom: 16 }}>
                      <span style={{ fontSize: 24, fontWeight: 900, color: "#0f172a" }}>{plan.priceINR}</span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{plan.period}</span>
                    </div>

                    <div style={{ flex: 1, borderTop: "1px solid #f1f5f9", paddingTop: 12, marginBottom: 16 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: 8 }}>Included Capabilities</div>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                        {plan.features.map((feat, fi) => (
                          <li key={fi} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 11, color: "#374151" }}>
                            <Check style={{ width: 13, height: 13, color: isSelected ? "#4f46e5" : "#10b981", flexShrink: 0, marginTop: 2 }} />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSwitchPlan(key)}
                      disabled={isSelected}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "none",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: isSelected ? "default" : "pointer",
                        background: isSelected ? "#e2e8f0" : key === "growth" ? "#4f46e5" : "#0f172a",
                        color: isSelected ? "#64748b" : "#fff",
                        transition: "all 0.15s",
                      }}
                    >
                      {isSelected ? "Current Workspace Tier" : key === "free" ? "Downgrade to Free" : key === "growth" ? "Select Growth Tier" : "Upgrade to Enterprise"}
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
              Need custom GST invoicing, SLA agreements, or on-premise deployment? Contact <span style={{ color: "#4f46e5", fontWeight: 600 }}>enterprise@gigshield.in</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

