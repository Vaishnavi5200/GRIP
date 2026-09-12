"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Brain,
  FileText,
  Database,
  ListFilter,
  BarChart3,
  Sliders,
  ShieldCheck,
  Building2,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { demoStore } from "@/lib/store/demo-store";

export interface AppShellProps {
  children: React.ReactNode;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Intelligence Agent", href: "/intelligence", icon: Brain },
  { label: "Regulatory Events", href: "/regulations", icon: FileText },
  { label: "Rules & Versions", href: "/rule-versions", icon: Database },
  { label: "Transactions", href: "/transactions", icon: ListFilter },
  { label: "Impact Analysis", href: "/calculations", icon: BarChart3 },
  { label: "Simulator", href: "/simulator", icon: Sliders },
  { label: "Provenance", href: "/audit", icon: ShieldCheck },
  { label: "Reports", href: "/reports", icon: FileText },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [currentUser] = useState(demoStore.activeUser);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      {/* ── Sidebar ── */}
      <aside
        style={{
          width: 240,
          minWidth: 240,
          background: "#ffffff",
          borderRight: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 40,
        }}
      >
        {/* Brand */}
        <div style={{ padding: "20px 20px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, overflow: "hidden", border: "1.5px solid #e0e7ff", background: "#eef2ff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Image src="/grip-logo.png" alt="GRIP" width={36} height={36} style={{ objectFit: "cover", width: "100%", height: "100%" }} priority />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.2 }}>GRIP</div>
            <div style={{ fontSize: 11, color: "#4f46e5", fontWeight: 600, marginTop: 2, lineHeight: 1 }}>Gig Regulatory Intelligence Platform</div>
          </div>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: "14px 10px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && item.href !== "/transactions" && item.href !== "/calculations" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.label + item.href}
                href={item.href}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "9px 14px 9px 16px",
                  borderRadius: 10,
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#4f46e5" : "#475569",
                  background: isActive ? "#f3f0ff" : "transparent",
                  transition: "all 0.12s",
                }}
              >
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      left: -2,
                      top: 4,
                      bottom: 4,
                      width: 3.5,
                      background: "#4f46e5",
                      borderRadius: "0 3px 3px 0",
                    }}
                  />
                )}
                <Icon
                  style={{
                    width: 17,
                    height: 17,
                    color: isActive ? "#4f46e5" : "#64748b",
                    flexShrink: 0,
                  }}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Bottom: Karnataka Use Case & v0.1 Prototype */}
        <div style={{ padding: "16px 14px 20px", borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Karnataka Use Case */}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 28, height: 32, borderRadius: 4, background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, padding: "2px" }}>
              {/* Karnataka State Silhouette SVG outline */}
              <svg viewBox="0 0 24 30" style={{ width: 20, height: 26, fill: "#94a3b8" }}>
                <path d="M12 2 C16 4, 19 8, 18 12 C17 15, 20 18, 17 22 C14 26, 10 28, 8 26 C6 24, 5 19, 7 15 C8 11, 7 6, 12 2 Z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", lineHeight: 1.25 }}>Karnataka Use Case</div>
              <div style={{ fontSize: 9.5, color: "#64748b", lineHeight: 1.35, marginTop: 3 }}>
                Karnataka Platform Based Gig Workers (Social Security and Welfare) Act, 2025 (Act 72 of 2025)
              </div>
            </div>
          </div>

          {/* GRIP v0.1 Prototype */}
          <div style={{ paddingLeft: 2 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>GRIP</div>
            <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2 }}>v0.1 Prototype</div>
          </div>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div style={{ flex: 1, marginLeft: 240, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* Top Header */}
        <header
          style={{
            height: 64,
            background: "#ffffff",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            position: "sticky",
            top: 0,
            zIndex: 30,
          }}
        >
          {/* Org Name */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0" }}>
              <Building2 style={{ width: 17, height: 17, color: "#475569" }} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
                {demoStore.org.name}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1 }}>
                Gig mobility platform
              </div>
            </div>
          </div>

          {/* Right Controls: Jurisdiction & User */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Karnataka Jurisdiction Pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 12px",
                borderRadius: 20,
                background: "#ede9fe",
                color: "#4f46e5",
                fontSize: 11.5,
                fontWeight: 600,
                border: "1px solid #ddd6fe",
              }}
            >
              <MapPin style={{ width: 13, height: 13 }} />
              <span>Karnataka</span>
            </div>

            {/* User Profile */}
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "#1e293b",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {currentUser.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1e293b", lineHeight: 1.2, display: "flex", alignItems: "center", gap: 4 }}>
                  <span>{currentUser.name}</span>
                  <ChevronDown style={{ width: 13, height: 13, color: "#64748b" }} />
                </div>
                <div style={{ fontSize: 10.5, color: "#64748b", lineHeight: 1 }}>
                  Compliance Manager
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: "28px 32px", maxWidth: 1440, width: "100%", margin: "0 auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
