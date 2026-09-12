"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowRight, UserCheck, AlertCircle } from "lucide-react";
import { demoStore } from "@/lib/store/demo-store";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("amit@quickride.in");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const user = demoStore.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (user) {
      demoStore.activeUser = user;
      setTimeout(() => {
        router.push("/dashboard");
      }, 400);
    } else {
      demoStore.activeUser = {
        id: "usr-custom",
        email,
        name: email.split("@")[0],
        role: "compliance_manager",
        organizationId: demoStore.org.id,
      };
      setTimeout(() => {
        router.push("/dashboard");
      }, 400);
    }
  };

  const selectPersona = (userEmail: string) => {
    setEmail(userEmail);
    const user = demoStore.users.find((u) => u.email === userEmail);
    if (user) demoStore.activeUser = user;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="px-3 py-1.5 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/30 font-mono tracking-wider">
            GRIP
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">GRIP</h1>
            <p className="text-xs text-slate-500">Gig Regulatory Intelligence Platform</p>
          </div>
        </div>

        {/* Notice */}
        <div className="mb-6 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-950">
          <div className="font-semibold flex items-center gap-1.5 mb-0.5">
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Workspace Account: Vaishnavi Dwivedi</span>
          </div>
          <p className="text-[11px] text-slate-600">Compliance Lead • QuickRide Technologies Pvt Ltd</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
            />
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-sm font-semibold shadow-md shadow-indigo-600/20 transition-colors cursor-pointer"
          >
            <span>{loading ? "Signing in..." : "Sign In to Workspace"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Tenant: QuickRide Technologies Pvt Ltd • Karnataka Compliance Operations
          </p>
        </div>
      </div>
    </div>
  );
}
