"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Filter,
} from "lucide-react";

interface RegulatoryEventItem {
  id: string;
  date: string;
  displayDate: string;
  state: string;
  title: string;
  subtitle: string;
  category: "proposed" | "verified" | "research";
  categoryLabel: string;
  sourceDoc: string;
  actionUrl: string;
  actionLabel: string;
  isSynthetic?: boolean;
  details: string;
}

const REGULATORY_EVENTS: RegulatoryEventItem[] = [
  {
    id: "evt-ka-01",
    date: "2026-09-01",
    displayDate: "01 Sep 2026",
    state: "Karnataka",
    title: "Karnataka 4W Welfare Fee Rate Revision",
    subtitle: "Draft revision proposing fee rate adjustment for Four-Wheeler motor cabs (1.00% → 1.50%, cap ₹1.00 → ₹1.50).",
    category: "proposed",
    categoryLabel: "Proposed Change",
    sourceDoc: "Draft Amendment under Karnataka Act 72 of 2025, Section 24 read with Rule 4(2)",
    actionUrl: "/intelligence",
    actionLabel: "Review in Intelligence Agent →",
    isSynthetic: true,
    details: "Staged for 01-Oct-2026 effective date. Affects 823 Karnataka 4W cab trips in platform sample.",
  },
  {
    id: "evt-ka-02",
    date: "2026-08-18",
    displayDate: "18 Aug 2026",
    state: "Karnataka",
    title: "Karnataka Welfare Board Operational Clarification",
    subtitle: "Welfare board administrative advisory regarding calculation base and driver toll exclusions.",
    category: "verified",
    categoryLabel: "Verified Baseline",
    sourceDoc: "Karnataka Act 72 of 2025, Section 4 read with Schedule I",
    actionUrl: "/rule-versions",
    actionLabel: "View Versioned Rule →",
    details: "Established operative baseline rule KA-2025-02-RH-4W (1.00%, cap ₹1.00).",
  },
  {
    id: "evt-rj-01",
    date: "2026-08-04",
    displayDate: "04 Aug 2026",
    state: "Rajasthan",
    title: "Rajasthan Platform Based Gig Workers Act Notification",
    subtitle: "State gazette notification regarding welfare cess framework under Rajasthan Act 18 of 2023.",
    category: "research",
    categoryLabel: "Research / Out of Scope",
    sourceDoc: "Rajasthan Platform Based Gig Workers (Registration and Welfare) Act, 2023",
    actionUrl: "/rule-versions",
    actionLabel: "View Scope →",
    details: "Non-Karnataka jurisdiction. Tracked for multi-state regulatory roadmap.",
  },
];

export default function RegulatoryEventsPage() {
  const [filterTab, setFilterTab] = useState<"needs_review" | "all">("needs_review");

  const displayedEvents =
    filterTab === "needs_review"
      ? REGULATORY_EVENTS.filter((e) => e.category === "proposed")
      : REGULATORY_EVENTS;

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl pb-16">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1">
              Regulatory Events
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Regulatory Timeline & Change Inbox
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Chronological feed of government gazette notifications, draft orders, and welfare board directives.
            </p>
          </div>

          <Link
            href="/intelligence"
            className="self-start sm:self-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Open Intelligence Agent →</span>
          </Link>
        </div>

        {/* ── Filter Tabs: Needs Review | All Events ── */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setFilterTab("needs_review")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              filterTab === "needs_review"
                ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Needs Review</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono">
              1
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              filterTab === "all"
                ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>All Events</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono">
              {REGULATORY_EVENTS.length}
            </span>
          </button>
        </div>

        {/* ── Chronological Feed ── */}
        <div className="space-y-4">
          {displayedEvents.map((item) => {
            const isProposed = item.category === "proposed";
            const isVerified = item.category === "verified";

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-2xl p-5 transition-all shadow-2xs ${
                  isProposed
                    ? "border-indigo-200 ring-1 ring-indigo-50/50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    {/* Date Pill / Dot */}
                    <div className="flex items-center gap-1.5 pt-0.5 shrink-0">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isProposed
                            ? "bg-amber-500 ring-4 ring-amber-50"
                            : isVerified
                            ? "bg-emerald-500 ring-4 ring-emerald-50"
                            : "bg-slate-400"
                        }`}
                      />
                      <span className="text-xs font-bold text-slate-800 font-mono">
                        {item.displayDate}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-mono text-[10.5px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {item.state}
                        </span>
                        <h2 className="text-sm font-bold text-slate-900">
                          {item.title}
                        </h2>
                        {item.isSynthetic && (
                          <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            SYNTHETIC SCENARIO
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mt-1">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                      isProposed
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        : isVerified
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {item.categoryLabel}
                  </span>
                </div>

                {/* Footer details & Action */}
                <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5 text-slate-500">
                    <div>
                      <strong className="text-slate-700 font-medium">Source:</strong>{" "}
                      <span>{item.sourceDoc}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {item.details}
                    </div>
                  </div>

                  <Link
                    href={item.actionUrl}
                    className={`px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all ${
                      isProposed
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                    }`}
                  >
                    <span>{item.actionLabel}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
