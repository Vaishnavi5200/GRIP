"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { demoStore } from "@/lib/store/demo-store";
import {
  Globe2,
  ShieldCheck,
  FileText,
  Clock,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  ArrowRight,
} from "lucide-react";

export default function RegulationsPage() {
  const [regulations] = useState(demoStore.regulations);
  const [selectedState, setSelectedState] = useState(demoStore.regulations[0]);

  return (
    <AppShell>
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-indigo-600" />
            <span>State Regulatory Coverage & Gazette Map</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Jurisdictional tracker for gig worker social security legislation across India.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/monitor"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch AI Regulatory Agent →</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── State List ── */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Jurisdictional States ({regulations.length})
          </h2>

          <div className="space-y-2">
            {regulations.map((reg) => {
              const isSelected = selectedState.id === reg.id;
              return (
                <div
                  key={reg.id}
                  onClick={() => setSelectedState(reg)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/50 shadow-2xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {reg.stateCode}
                      </span>
                      <h3 className="font-bold text-xs text-slate-900">{reg.shortName}</h3>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        reg.status === "operational"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {reg.status === "operational" ? "Active Engine" : "Research Mode"}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{reg.title}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── State Detail Panel ── */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded bg-indigo-600 text-white">
                  {selectedState.stateCode}
                </span>
                <h2 className="text-base font-bold text-slate-900">{selectedState.title}</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Statutory Reference:{" "}
                <span className="font-mono text-slate-700">{selectedState.gazetteRef}</span> • Last Verified:{" "}
                {selectedState.lastVerified}
              </p>
            </div>

            <span
              className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider self-start ${
                selectedState.status === "operational"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-slate-100 text-slate-700 border border-slate-300"
              }`}
            >
              {selectedState.status === "operational" ? "Enacted & Active" : "Research / Draft"}
            </span>
          </div>

          <div className="space-y-5 text-xs text-slate-700">
            {/* Official Primary Legal Source Links */}
            {selectedState.stateCode === "KA" && (
              <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-indigo-950 text-xs">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Verified India Code Statutory Sources</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                  <a
                    href="https://www.indiacode.nic.in/bitstream/123456789/22201/1/72_of_2025_%28e%29.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-white border border-indigo-100 hover:border-indigo-300 rounded-lg flex items-center justify-between text-slate-800 group"
                  >
                    <span>Karnataka Act 72 of 2025 (Official PDF)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-500 group-hover:text-indigo-700" />
                  </a>
                  <a
                    href="https://upload.indiacode.nic.in/showfile?actid=AC_KA_71_593_00008_00008_1771495569804&filename=karnataka_platform_based_gig_workers_%28social_security_and_welfare%29_rules%2C_2025.pdf&type=rule"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-white border border-indigo-100 hover:border-indigo-300 rounded-lg flex items-center justify-between text-slate-800 group"
                  >
                    <span>Karnataka Rules, 2025 (Schedule I)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-500 group-hover:text-indigo-700" />
                  </a>
                </div>
              </div>
            )}

            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px] tracking-wider mb-1">
                Operational Scope & Notes
              </span>
              <p className="p-3 bg-slate-50 rounded-lg border border-slate-200 leading-relaxed text-xs">
                {selectedState.notes}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px] tracking-wider mb-1">
                  Applicable Sectors
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedState.applicableSectors.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-medium capitalize text-[11px]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px] tracking-wider mb-1">
                  Effective Statutory Date
                </span>
                <span className="font-semibold text-slate-900 text-xs">
                  {selectedState.effectiveDate || "Pending Official Notification"}
                </span>
              </div>
            </div>

            {selectedState.status === "operational" && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 text-xs">
                    Active Executable Rule Versions ({demoStore.ruleVersions.length} Versions)
                  </h3>
                  <Link
                    href="/rule-versions"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <span>View Rule Registry</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="space-y-1.5">
                  {demoStore.ruleVersions.slice(0, 6).map((rv) => (
                    <div
                      key={rv.id}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-700">{rv.versionCode}</span>
                        <span className="text-slate-500 capitalize">
                          {rv.sector || "All"} ({rv.vehicleType || "All"})
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-slate-900">
                        {(parseFloat(rv.rate) * 100).toFixed(2)}% (Cap {rv.cap ? `₹${rv.cap}` : "None"})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
