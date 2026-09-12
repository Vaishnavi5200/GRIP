"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { demoStore, DemoAuditLog, ProvenanceAuditLog } from "@/lib/store/demo-store";
import {
  ShieldCheck,
  Search,
  FileText,
  Brain,
  CheckCircle2,
  Lock,
  ArrowRight,
  UserCheck,
  Filter,
} from "lucide-react";

export default function AuditTrailPage() {
  const [provenanceLogs] = useState<ProvenanceAuditLog[]>(demoStore.provenanceLog);
  const [auditLogs] = useState<DemoAuditLog[]>(demoStore.auditLogs);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"provenance" | "system">("provenance");

  const filteredProvenance = provenanceLogs.filter(
    (l) =>
      search === "" ||
      l.eventType.toLowerCase().includes(search.toLowerCase()) ||
      l.actor.toLowerCase().includes(search.toLowerCase()) ||
      (l.note || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredAudit = auditLogs.filter(
    (l) =>
      search === "" ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.userName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl pb-16">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1">
              Forensic Provenance
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
              <span>Append-only Provenance Trail</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Forensic audit chain linking Source Document → AI Interpretation → Schema Validation → Proposed Rule → Transaction Binding → Human Approval.
            </p>
          </div>

          <span className="self-start sm:self-auto text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-600" /> Append-Only Log
          </span>
        </div>

        {/* ── Forensic Lineage Chain Ribbon ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
            Core Regulatory Provenance Chain:
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase">1. Source</div>
              <div className="font-bold text-slate-800 mt-0.5">Government Doc</div>
              <div className="text-[10px] text-slate-500 mt-1">PDF / Gazette</div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200">
              <div className="text-[10px] font-bold text-indigo-500 uppercase">2. Extract</div>
              <div className="font-bold text-indigo-900 mt-0.5">AI Interpretation</div>
              <div className="text-[10px] text-indigo-600 mt-1">Semantic Meaning</div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
              <div className="text-[10px] font-bold text-emerald-500 uppercase">3. Safeguard</div>
              <div className="font-bold text-emerald-900 mt-0.5">Schema Validation</div>
              <div className="text-[10px] text-emerald-600 mt-1">Non-AI Gate</div>
            </div>

            <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-200">
              <div className="text-[10px] font-bold text-purple-500 uppercase">4. Proposal</div>
              <div className="font-bold text-purple-900 mt-0.5">Rule Diff</div>
              <div className="text-[10px] text-purple-600 mt-1">Staged Version</div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200">
              <div className="text-[10px] font-bold text-blue-500 uppercase">5. Binding</div>
              <div className="font-bold text-blue-900 mt-0.5">5,000 Txns</div>
              <div className="text-[10px] text-blue-600 mt-1">₹ Impact Calc</div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200">
              <div className="text-[10px] font-bold text-amber-600 uppercase">6. Decision</div>
              <div className="font-bold text-amber-900 mt-0.5">Human Gate</div>
              <div className="text-[10px] text-amber-700 mt-1">Officer Approval</div>
            </div>
          </div>
        </div>

        {/* ── Search & Log Switcher ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("provenance")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "provenance"
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Regulatory Provenance Chain ({provenanceLogs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("system")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "system"
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              System Events & Actions ({auditLogs.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter audit events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none"
            />
          </div>
        </div>

        {/* ── Forensic Log Table ── */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            {activeTab === "provenance" ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-3">Actor</th>
                    <th className="py-3 px-3">Event Type</th>
                    <th className="py-3 px-3">Entity Ref</th>
                    <th className="py-3 px-4">Forensic Trace Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                  {filteredProvenance.slice().reverse().map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {entry.timestamp.replace("T", " ").split(".")[0]}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {entry.actor}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 font-sans">
                        {entry.eventType}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {entry.proposedRuleId || entry.ruleVersionCode || "SYSTEM"}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-700 text-xs leading-relaxed">
                        {entry.note}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-3">Audited Action</th>
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Target Entity</th>
                    <th className="py-3 px-4">Event Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                  {filteredAudit.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {log.createdAt.replace("T", " ").split(".")[0]}
                      </td>
                      <td className="py-3 px-3 font-bold text-indigo-700">
                        {log.action}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className="font-semibold text-slate-900 block">{log.userName}</span>
                        <span className="text-[10px] text-slate-400 capitalize">
                          {log.userRole.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {log.entityType} ({log.entityId})
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-700 text-xs leading-relaxed">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
