"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { demoStore, DemoAuditLog } from "@/lib/store/demo-store";
import { ScrollText, ShieldCheck, Lock, Search, Filter } from "lucide-react";

export default function AuditTrailPage() {
  const [logs] = useState<DemoAuditLog[]>(demoStore.auditLogs);
  const [search, setSearch] = useState("");

  const filtered = logs.filter(
    (l) =>
      search === "" ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.userName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-indigo-600" />
            <span>Immutable Statutory Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Append-only system record. Every batch upload, calculation run, reconciliation resolution, and regulatory approval is recorded in this immutable audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-emerald-600" /> Append-Only Log
          </span>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-2xs">
        <div style={{ position: "relative", width: "100%", maxWidth: 384 }}>
          <div style={{ position: "absolute", inset: "0 auto 0 0", paddingLeft: 12, display: "flex", alignItems: "center", pointerEvents: "none" }}>
            <Search style={{ width: 14, height: 14, color: "#94a3b8" }} />
          </div>
          <input
            type="text"
            placeholder="Search audit trail by action or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ display: "block", width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 6, paddingBottom: 6, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#1e293b", outline: "none" }}
          />
        </div>
      </div>

      {/* ── Audit Logs Table ── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Audited Action</th>
                <th className="py-3 px-3">Actor / Role</th>
                <th className="py-3 px-3">Target Entity</th>
                <th className="py-3 px-4">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {log.createdAt.replace("T", " ").split(".")[0]}
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-indigo-700">
                    {log.action}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-900 block">{log.userName}</span>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {log.userRole.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                    {log.entityType} ({log.entityId})
                  </td>
                  <td className="py-3 px-4 text-slate-800 text-[11px] leading-relaxed">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
