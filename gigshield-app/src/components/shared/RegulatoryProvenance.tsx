"use client";

import React, { useState } from "react";
import { ShieldCheck, AlertCircle, HelpCircle, FileText, ExternalLink, Info } from "lucide-react";

export type VerificationStatus =
  | "verified"
  | "demo"
  | "pending_verification"
  | "proposed"
  | "superseded";

export interface RegulatoryProvenanceProps {
  versionCode: string;
  verificationStatus: VerificationStatus | string;
  sourceDocumentTitle?: string | null;
  sourceGazetteRef?: string | null;
  sourceNotificationNo?: string | null;
  sourceDocumentDate?: string | null;
  sourceDocumentUrl?: string | null;
  verifiedAt?: string | null;
  verifiedByName?: string | null;
  interpretationNotes?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  compact?: boolean;
}

export function RegulatoryProvenance({
  versionCode,
  verificationStatus,
  sourceDocumentTitle,
  sourceGazetteRef,
  sourceNotificationNo,
  sourceDocumentDate,
  sourceDocumentUrl,
  verifiedAt,
  verifiedByName,
  interpretationNotes,
  effectiveFrom,
  effectiveTo,
  compact = false,
}: RegulatoryProvenanceProps) {
  const [showModal, setShowModal] = useState(false);

  const status = (verificationStatus as VerificationStatus) || "demo";

  const getBadgeConfig = () => {
    switch (status) {
      case "verified":
        return {
          label: "Verified",
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />,
          classes: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
          tooltip: "Confirmed against official Karnataka Government Gazette",
        };
      case "demo":
        return {
          label: "Sample Schedule",
          icon: <AlertCircle className="w-3.5 h-3.5 text-slate-600" />,
          classes: "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200",
          tooltip: "Sample calibration schedule configured for demonstration",
        };
      case "pending_verification":
        return {
          label: "Pending Verification",
          icon: <HelpCircle className="w-3.5 h-3.5 text-blue-600" />,
          classes: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
          tooltip: "Gazette identified — formal legal audit in progress",
        };
      case "proposed":
        return {
          label: "AI Proposed",
          icon: <Info className="w-3.5 h-3.5 text-orange-600" />,
          classes: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
          tooltip: "AI-extracted from draft change — awaiting manager sign-off",
        };
      case "superseded":
      default:
        return {
          label: "Superseded",
          icon: <FileText className="w-3.5 h-3.5 text-slate-500" />,
          classes: "bg-slate-100 text-slate-600 border-slate-200",
          tooltip: "Historical version — superseded by newer notification",
        };
    }
  };

  const badge = getBadgeConfig();

  return (
    <>
      <div className="inline-flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors cursor-pointer shadow-xs ${badge.classes}`}
          title={`${badge.tooltip} (Click to inspect provenance)`}
        >
          {badge.icon}
          <span>{badge.label}</span>
          <span className="text-[10px] font-mono opacity-80 underline underline-offset-2 ml-0.5">
            Details
          </span>
        </button>

        {!compact && sourceGazetteRef && (
          <span className="text-[11px] text-slate-500 font-mono">
            [{sourceGazetteRef}]
          </span>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {badge.icon}
                <h3 className="font-semibold text-slate-900 text-base">
                  Regulatory Provenance Audit
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1 leading-none rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Rule Version Code:</span>
                <span className="font-mono font-semibold text-slate-900">{versionCode}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Verification Status:</span>
                <span className="font-medium flex items-center gap-1">{badge.label}</span>
              </div>

              <div className="py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium block mb-1">Source Legal Instrument:</span>
                <p className="text-slate-800 font-medium text-xs bg-slate-50 p-2 rounded-md border border-slate-200">
                  {sourceDocumentTitle ||
                    "Karnataka Platform Based Gig Workers (Social Security and Welfare) Act, 2025"}
                </p>
              </div>

              {sourceGazetteRef && (
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Gazette Reference:</span>
                  <span className="font-mono text-slate-900">{sourceGazetteRef}</span>
                </div>
              )}

              {sourceNotificationNo && (
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Notification No:</span>
                  <span className="font-mono text-slate-900">{sourceNotificationNo}</span>
                </div>
              )}

              {sourceDocumentDate && (
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Notification Date:</span>
                  <span>{sourceDocumentDate}</span>
                </div>
              )}

              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Effective Period:</span>
                <span>
                  {effectiveFrom || "2026-02-16"} → {effectiveTo || "Present (Active)"}
                </span>
              </div>

              {interpretationNotes && (
                <div className="py-2 bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 mt-2">
                  <span className="font-semibold block mb-0.5">Regulatory Disclaimer & Notes:</span>
                  {interpretationNotes}
                </div>
              )}

              {status === "demo" && !interpretationNotes && (
                <div className="py-2 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 mt-2">
                  <span className="font-semibold block mb-0.5">Sample Schedule Notes:</span>
                  Rate (e.g. 1.0%) and sector caps represent sample configuration parameters aligned with the notified 2025 Karnataka Act. Confirm statutory gazetted schedules before final legal remittance.
                </div>
              )}

              {sourceDocumentUrl && (
                <div className="pt-2">
                  <a
                    href={sourceDocumentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    View Official Gazette Document <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
