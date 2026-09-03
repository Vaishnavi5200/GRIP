"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { demoStore } from "@/lib/store/demo-store";
import {
  Settings,
  Building2,
  CreditCard,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
  Mail,
} from "lucide-react";

export default function SettingsPage() {
  const [org, setOrg] = useState(demoStore.org);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    demoStore.org = { ...org };
    setSaveSuccess(true);
    demoStore.logAudit(
      "org.updated",
      "organization",
      org.id,
      `Updated organization profile details for ${org.name}.`
    );
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleReset = () => {
    demoStore.reset();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 2500);
  };

  return (
    <AppShell>
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <span>Workspace Settings & Compliance Configuration</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage organization legal profile, statutory registration details, and subscription tiers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Organization Profile Form ── */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Legal Entity Profile
            </h2>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Legal Entity Name
                </label>
                <input
                  type="text"
                  value={org.name}
                  onChange={(e) => setOrg({ ...org, name: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  State Welfare Registration No.
                </label>
                <input
                  type="text"
                  value={org.registrationNo}
                  onChange={(e) => setOrg({ ...org, registrationNo: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  PAN / Tax Identifier
                </label>
                <input
                  type="text"
                  value={org.pan}
                  onChange={(e) => setOrg({ ...org, pan: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Primary Operating State
                </label>
                <input
                  type="text"
                  disabled
                  value="Karnataka (KA)"
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-600 font-medium"
                />
              </div>
            </div>

            {saveSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Organization profile updated and logged to audit trail.</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Save Entity Changes
              </button>
            </div>
          </form>
        </div>

        {/* ── Subscription Plan Card & Demo Controls ── */}
        <div className="space-y-6">
          {/* Subscription Tier */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Subscription & Billing
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-indigo-100 text-indigo-800">
                {demoStore.getCurrentPlan().name}
              </span>
            </div>

            <div className="mb-3">
              <div className="text-lg font-black text-slate-900">{demoStore.getCurrentPlan().priceINR} <span className="text-xs text-slate-500 font-normal">{demoStore.getCurrentPlan().period}</span></div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {demoStore.getCurrentPlan().tagline}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 mb-4 text-[11px] space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Monthly Volume Limit:</span>
                <strong className="text-slate-900 font-mono">{demoStore.getCurrentPlan().monthlyTransactionLimit.toLocaleString()} txns</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Coverage:</span>
                <strong className="text-slate-900">{demoStore.getCurrentPlan().allowedStates.join(", ")}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Collaborator Seats:</span>
                <strong className="text-slate-900">{demoStore.getCurrentPlan().maxSeats === 999 ? "Unlimited" : `${demoStore.getCurrentPlan().maxSeats} Seat`}</strong>
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-1.5">
                {(["free", "growth", "enterprise"] as const).map((pk) => {
                  const isActive = demoStore.org.plan === pk;
                  return (
                    <button
                      key={pk}
                      type="button"
                      onClick={() => {
                        demoStore.switchPlan(pk);
                        setOrg({ ...demoStore.org });
                      }}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                      }`}
                    >
                      {pk}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 text-center">Click any tier to simulate live workspace plan switching</p>
            </div>
          </div>

          {/* Demo Reset Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-2 text-rose-700">
              <RotateCcw className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Sample Data Management
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Reset the workspace back to the baseline 5,000-record Karnataka sample dataset state.
            </p>

            {resetSuccess && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Baseline state restored!</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Reset Sample Data Baseline
            </button>
          </div>
        </div>
      </div>

      {/* ── Contact Sales Modal ── */}
      {showSalesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center">
            <Mail className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <h3 className="font-bold text-slate-900 text-base mb-1">
              GigShield Enterprise Tier
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Multi-state regulatory compliance coverage, custom ERP finance connectors (SAP/Oracle), and SLA-backed statutory filings.
            </p>
            <p className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs font-mono font-semibold text-slate-800 mb-4">
              sales@gigshield.in
            </p>
            <button
              type="button"
              onClick={() => setShowSalesModal(false)}
              className="w-full py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
