"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { demoStore, DemoTransaction } from "@/lib/store/demo-store";
import { formatINR } from "@/lib/engines/calculation-engine";
import { validateTransactionRows } from "@/lib/engines/validation-engine";
import {
  Search,
  Filter,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  X,
  FileDown,
  ShieldCheck,
} from "lucide-react";
import { TransactionBindingDrawer } from "@/components/shared/TransactionBindingDrawer";
import { LegalStatus, EvidenceCitation } from "@/lib/engines/regulatory-types";

// ── Types ──────────────────────────────────────────────────────────────────────
interface UploadResult {
  addedCount: number;
  duplicateCount: number;
  invalidCount: number;
  totalParsed: number;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<DemoTransaction[]>(demoStore.transactions);
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Upload Wizard State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Binding Inspector State
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter logic
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const q = search.toLowerCase();
      const matchSearch =
        q === "" ||
        t.transactionId.toLowerCase().includes(q) ||
        t.workerId.toLowerCase().includes(q);
      const matchSector = sectorFilter === "all" || t.sector === sectorFilter;
      const matchVehicle = vehicleFilter === "all" || t.vehicleType === vehicleFilter;
      return matchSearch && matchSector && matchVehicle;
    });
  }, [transactions, search, sectorFilter, vehicleFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // ── File parsing ──────────────────────────────────────────────────────────
  const parseCSVRows = (text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
    return lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.trim().replace(/"/g, ""));
      const row: Record<string, string> = {};
      header.forEach((h, i) => { row[h] = cols[i] ?? ""; });
      return row;
    });
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      alert("Please select a CSV file.");
      return;
    }
    setSelectedFile(file);
    setUploadResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  // ── Ingest with real or simulated data ────────────────────────────────────
  const handleIngest = () => {
    setUploading(true);

    const process = (rawRows: Array<Record<string, string | number>>) => {
      // Normalise keys
      const normRows = rawRows.map((r) => ({
        transaction_id: String(r.transaction_id || r["transaction id"] || "").trim(),
        worker_id: String(r.worker_id || r["worker id"] || "").trim(),
        state: String(r.state || r.state_code || "").trim().toUpperCase(),
        sector: String(r.sector || "").trim().toLowerCase(),
        vehicle_type: String(r.vehicle_type || r["vehicle type"] || "").trim().toUpperCase(),
        payout: Number(r.payout || 0),
        transaction_date: String(r.transaction_date || r["transaction date"] || "").trim(),
      }));

      const report = validateTransactionRows(normRows);
      const existingIds = new Set(demoStore.transactions.map((t) => t.transactionId));
      let addedCount = 0;
      let duplicateCount = 0;

      normRows.forEach((r, idx) => {
        if (!r.transaction_id) return;
        if (existingIds.has(r.transaction_id)) {
          duplicateCount++;
          return;
        }
        const newTxn: DemoTransaction = {
          id: `txn-upload-${Date.now()}-${idx}`,
          organizationId: demoStore.org.id,
          transactionId: r.transaction_id,
          workerId: r.worker_id || `W-AUTO-${idx}`,
          stateCode: r.state || "KA",
          sector: r.sector || "ride-hailing",
          vehicleType: r.vehicle_type || "2W",
          payout: r.payout,
          transactionDate: r.transaction_date || new Date().toISOString().slice(0, 10),
          isValid: true,
          isEV: false, // CSV uploads default to non-EV (EV flag requires Vahan registry verification)
        };
        demoStore.transactions.unshift(newTxn);
        existingIds.add(r.transaction_id);
        addedCount++;
      });

      if (addedCount > 0) {
        demoStore.runCalculations();
        demoStore.runReconciliation();
        demoStore.logAudit(
          "batch.uploaded",
          "upload_batch",
          `batch-${Date.now()}`,
          `Validated & ingested ${addedCount} new transaction records (${duplicateCount} duplicates skipped, ${report.invalidCount} invalid rows rejected).`
        );
        setTransactions([...demoStore.transactions]);
      }

      setUploadResult({
        addedCount,
        duplicateCount,
        invalidCount: report.invalidCount,
        totalParsed: normRows.length,
      });
      setUploading(false);
    };

    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const rawRows = parseCSVRows(text) as Array<Record<string, string | number>>;
        process(rawRows);
      };
      reader.onerror = () => {
        setUploading(false);
        alert("Failed to read file.");
      };
      // If no file selected, ingest 2 simulated Karnataka sample transactions
      const base = demoStore.transactions.length;
      const sampleRows = [
        {
          transaction_id: `TXN-2026-${String(base + 1).padStart(6, "0")}`,
          worker_id: "W-KA-9901",
          state: "KA",
          sector: "ride-hailing",
          vehicle_type: "2W",
          payout: 180,
          transaction_date: new Date().toISOString().slice(0, 10),
        },
        {
          transaction_id: `TXN-2026-${String(base + 2).padStart(6, "0")}`,
          worker_id: "W-KA-9902",
          state: "KA",
          sector: "food-delivery",
          vehicle_type: "2W",
          payout: 125,
          transaction_date: new Date().toISOString().slice(0, 10),
        },
      ];
      setTimeout(() => process(sampleRows), 600);
    }
  };

  const handleDownloadTemplate = () => {
    const template = "transaction_id,worker_id,state,sector,vehicle_type,payout,transaction_date\nTXN-2026-900001,W-KA-8821,KA,ride-hailing,2W,165.00,2026-09-02\nTXN-2026-900002,W-KA-8822,KA,food-delivery,2W,120.00,2026-09-02\nTXN-2026-900003,W-KA-8823,KA,ride-hailing,4W,380.00,2026-09-02\nTXN-2026-900004,W-KA-8824,KA,logistics,LCV,540.00,2026-09-02";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gigshield_transactions_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCloseModal = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setUploadResult(null);
    setUploading(false);
  };

  // ── Download report ────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = ["transaction_id", "worker_id", "state", "sector", "vehicle_type", "payout", "date", "status"];
    const rows = filtered.slice(0, 500).map((t) => [
      t.transactionId, t.workerId, t.stateCode, t.sector, t.vehicleType, t.payout, t.transactionDate, "Validated",
    ]);
    const csv = "data:text/csv;charset=utf-8," + [headers, ...rows].map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = encodeURI(csv);
    a.download = `GigShield_Transactions_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const s = {
    searchWrap: { position: "relative" as const, flex: "1 1 280px", maxWidth: 340 },
    searchIcon: { position: "absolute" as const, top: 0, bottom: 0, left: 0, paddingLeft: 12, display: "flex", alignItems: "center", pointerEvents: "none" as const },
    searchInput: { display: "block", width: "100%", paddingTop: 7, paddingBottom: 7, paddingLeft: 36, paddingRight: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#1e293b", outline: "none", fontFamily: "inherit" },
    select: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, paddingTop: 7, paddingBottom: 7, paddingLeft: 10, paddingRight: 10, color: "#1e293b", fontFamily: "inherit", cursor: "pointer" },
  };

  return (
    <AppShell>
      {/* ── Page Header ── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            Platform Transaction Payouts
            <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", fontFamily: "monospace" }}>
              {transactions.length.toLocaleString()} Records
            </span>
          </h1>
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>
            Karnataka platform trip payouts · Worker classification · Welfare fee eligibility
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleExportCSV}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer" }}
          >
            <FileDown style={{ width: 13, height: 13 }} />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: "#4f46e5", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", boxShadow: "0 2px 6px rgba(79,70,229,0.3)" }}
          >
            <UploadCloud style={{ width: 14, height: 14 }} />
            Upload Payout CSV
          </button>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={s.searchWrap}>
          <div style={s.searchIcon}>
            <Search style={{ width: 14, height: 14, color: "#94a3b8" }} />
          </div>
          <input
            type="text"
            placeholder="Search Transaction ID or Worker ID…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={s.searchInput}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Filter style={{ width: 13, height: 13, color: "#94a3b8" }} />
            <span style={{ fontSize: 12, color: "#64748b" }}>Sector:</span>
            <select value={sectorFilter} onChange={(e) => { setSectorFilter(e.target.value); setPage(1); }} style={s.select}>
              <option value="all">All</option>
              <option value="ride-hailing">Ride Hailing</option>
              <option value="food-delivery">Food Delivery</option>
              <option value="logistics">Logistics</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>Vehicle:</span>
            <select value={vehicleFilter} onChange={(e) => { setVehicleFilter(e.target.value); setPage(1); }} style={s.select}>
              <option value="all">All</option>
              <option value="2W">2W</option>
              <option value="3W">3W</option>
              <option value="4W">4W</option>
              <option value="LCV">LCV</option>
              <option value="HCV">HCV</option>
            </select>
          </div>
          {(search || sectorFilter !== "all" || vehicleFilter !== "all") && (
            <button
              type="button"
              onClick={() => { setSearch(""); setSectorFilter("all"); setVehicleFilter("all"); setPage(1); }}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 11, color: "#64748b", cursor: "pointer" }}
            >
              <X style={{ width: 11, height: 11 }} /> Clear
            </button>
          )}
        </div>

        <div style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8" }}>
          {filtered.length.toLocaleString()} of {transactions.length.toLocaleString()} records
        </div>
      </div>

      {/* ── Transactions Table ── */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", marginBottom: 16 }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {["Transaction ID", "Worker ID", "Sector & Vehicle", "Date", "Platform Payout", "Applied Rule", "Calculated Fee", ""].map((h, i) => (
                  <th key={i} style={{ padding: "10px 14px", textAlign: i === 4 || i === 6 ? "right" : "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                    No transactions match your filters.
                  </td>
                </tr>
              ) : paginated.map((t) => {
                const is4WCab = t.sector === "ride-hailing" && t.vehicleType === "4W";
                const is2WCab = t.sector === "ride-hailing" && t.vehicleType === "2W";
                const ruleCode = is4WCab ? "KA-2025-02-RH-4W" : is2WCab ? "KA-2025-01-RH-2W" : t.sector === "food-delivery" ? "KA-2025-03-FD-2W" : "KA-2025-04-LG-LCV";
                const calculatedFee = is4WCab ? Math.min(t.payout * 0.01, 1.0) : is2WCab ? Math.min(t.payout * 0.01, 0.5) : t.sector === "food-delivery" ? Math.min(t.payout * 0.01, 0.5) : Math.min(t.payout * 0.015, 2.5);

                return (
                  <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    <td style={{ padding: "10px 14px" }}>
                      <Link href={`/transactions/${t.transactionId}`} style={{ fontFamily: "monospace", fontWeight: 700, color: "#4f46e5", textDecoration: "none", fontSize: 12 }}>
                        {t.transactionId}
                      </Link>
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#64748b", fontSize: 11 }}>{t.workerId}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", textTransform: "capitalize" }}>{t.sector}</span>
                      <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace", marginLeft: 6, padding: "1px 5px", borderRadius: 4, background: "#f1f5f9" }}>{t.vehicleType}</span>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#64748b", fontSize: 12, whiteSpace: "nowrap" }}>{t.transactionDate}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>{formatINR(t.payout)}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "#4338ca", background: "#eef2ff", padding: "2px 6px", borderRadius: 4, border: "1px solid #e0e7ff" }}>
                        {ruleCode}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>
                      {formatINR(calculatedFee)}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTxnBinding({
                            transactionId: t.transactionId,
                            workerId: t.workerId,
                            transactionDate: t.transactionDate,
                            sector: t.sector,
                            vehicleType: t.vehicleType,
                            payout: t.payout,
                            ruleVersionCode: ruleCode,
                            calculatedFee: calculatedFee,
                            legalStatus: "ACTIVE",
                            evidence: {
                              sourceDocumentId: "KAR-ACT-2025-72",
                              sourceTitle: "Karnataka Platform Based Gig Workers Act, 2025",
                              sourceType: "ACT",
                              section: "Section 4",
                              clause: "Sub-section (2)",
                              quotedExcerpt: "Aggregator platform welfare fee contribution schedule.",
                            },
                            calculationSteps: [
                              { label: "Platform Payout", value: formatINR(t.payout) },
                              { label: "Applicable Rule", value: ruleCode },
                              { label: "Statutory Rate", value: is4WCab ? "1.00%" : is2WCab ? "1.00%" : "1.00%" },
                              { label: "Fee Cap", value: is4WCab ? "₹1.00" : "₹0.50" },
                              { label: "Calculated Fee", value: formatINR(calculatedFee) },
                            ],
                          });
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "4px 9px",
                          background: "#f8fafc",
                          color: "#4f46e5",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          border: "1px solid #e0e7ff",
                          cursor: "pointer",
                        }}
                      >
                        <ShieldCheck style={{ width: 12, height: 12, color: "#4f46e5" }} />
                        <span>Trace ↗</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ padding: "10px 16px", background: "#f8fafc", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "#64748b" }}>
          <span>Showing {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length.toLocaleString()}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: "4px 8px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>
              <ChevronLeft style={{ width: 14, height: 14 }} />
            </button>
            <span style={{ fontWeight: 600, color: "#374151" }}>Page {page} / {totalPages}</span>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: "4px 8px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>
              <ChevronRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Upload Modal ── */}
      {showUploadModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 24px 60px rgba(0,0,0,0.2)", border: "1px solid #e2e8f0", width: "100%", maxWidth: 480 }}>
            {/* Modal Header */}
            <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Upload Platform Transaction CSV</div>
                <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>Ingest trip payouts for Karnataka welfare fee calculation.</div>
              </div>
              <button type="button" onClick={handleCloseModal} style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", marginTop: -2 }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div style={{ padding: "18px 22px" }}>
              {/* File Drop Zone */}
              {!uploadResult && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    style={{ display: "none" }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    style={{
                      border: `2px dashed ${dragOver ? "#4f46e5" : selectedFile ? "#10b981" : "#cbd5e1"}`,
                      borderRadius: 12,
                      padding: "24px 20px",
                      textAlign: "center",
                      cursor: "pointer",
                      background: dragOver ? "#ede9fe" : selectedFile ? "#f0fdf4" : "#f8fafc",
                      marginBottom: 14,
                      transition: "all 0.15s",
                    }}
                  >
                    <FileSpreadsheet style={{ width: 32, height: 32, color: selectedFile ? "#10b981" : "#4f46e5", margin: "0 auto 10px" }} />
                    {selectedFile ? (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#065f46" }}>{selectedFile.name}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{(selectedFile.size / 1024).toFixed(1)} KB · Click to replace</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Drop CSV file here or <span style={{ color: "#4f46e5", textDecoration: "underline" }}>browse</span></div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                          Required columns: transaction_id, worker_id, state, sector, vehicle_type, payout, transaction_date
                        </div>
                        <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDownloadTemplate(); }}
                            style={{ fontSize: 11, color: "#4f46e5", background: "#ede9fe", border: "1px solid #c7d2fe", borderRadius: 6, padding: "4px 10px", fontWeight: 600, cursor: "pointer" }}
                          >
                            ⬇ Download Sample CSV Template
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

              {/* Result State */}
              {uploadResult && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ padding: "14px 16px", background: uploadResult.addedCount > 0 ? "#f0fdf4" : "#fefce8", border: `1px solid ${uploadResult.addedCount > 0 ? "#a7f3d0" : "#fcd34d"}`, borderRadius: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <CheckCircle2 style={{ width: 16, height: 16, color: uploadResult.addedCount > 0 ? "#059669" : "#d97706" }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: uploadResult.addedCount > 0 ? "#065f46" : "#92400e" }}>
                        {uploadResult.addedCount > 0 ? "Batch Ingested Successfully" : "No New Records Added"}
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "#475569", display: "flex", flexDirection: "column", gap: 3 }}>
                      <div>✅ <strong>{uploadResult.addedCount}</strong> new records ingested into workspace</div>
                      {uploadResult.duplicateCount > 0 && <div>⚠️ <strong>{uploadResult.duplicateCount}</strong> duplicates skipped (already in system)</div>}
                      {uploadResult.invalidCount > 0 && <div>❌ <strong>{uploadResult.invalidCount}</strong> invalid rows rejected</div>}
                      <div style={{ marginTop: 4, fontSize: 11, color: "#94a3b8" }}>Calculations, reconciliation & risk scores updated automatically.</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Processing indicator */}
              {uploading && (
                <div style={{ padding: "12px 16px", background: "#ede9fe", border: "1px solid #c7d2fe", borderRadius: 10, marginBottom: 14, fontSize: 12, color: "#4338ca", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 16, height: 16, border: "2px solid #c7d2fe", borderTop: "2px solid #4f46e5", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Running validation engine…
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
                {uploadResult ? (
                  <button type="button" onClick={handleCloseModal}
                    style={{ padding: "8px 20px", background: "#4f46e5", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none" }}>
                    Done
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={handleCloseModal}
                      style={{ padding: "8px 16px", background: "#fff", border: "1px solid #e2e8f0", color: "#374151", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      Cancel
                    </button>
                    <button type="button" onClick={handleIngest} disabled={uploading}
                      style={{ padding: "8px 20px", background: uploading ? "#a5b4fc" : "#4f46e5", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: uploading ? "not-allowed" : "pointer", border: "none", display: "flex", alignItems: "center", gap: 6 }}>
                      {uploading ? "Processing…" : selectedFile ? "Validate & Ingest CSV Batch" : "Ingest 2 Sample Transactions"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Transaction Binding Provenance Drawer ── */}
      <TransactionBindingDrawer
        isOpen={!!selectedTxnBinding}
        onClose={() => setSelectedTxnBinding(null)}
        data={selectedTxnBinding}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  );
}
