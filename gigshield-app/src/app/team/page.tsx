"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { demoStore } from "@/lib/store/demo-store";
import { PERMISSIONS, Role } from "@/lib/auth/permissions";
import { Users, UserPlus, Shield, Check, X, Mail } from "lucide-react";

export default function TeamPage() {
  const [users, setUsers] = useState(demoStore.users);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("viewer");
  const [inviteSent, setInviteSent] = useState(false);

  const roles: Role[] = ["admin", "compliance_manager", "finance_manager", "viewer"];

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    const derivedName = inviteEmail
      .split("@")[0]
      .replace(/[._]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const newUser = {
      id: `usr-${Date.now()}`,
      email: inviteEmail,
      name: derivedName,
      role: inviteRole,
      organizationId: demoStore.org.id,
    };

    demoStore.users.push(newUser);
    setUsers([...demoStore.users]);

    demoStore.logAudit(
      "user.invited",
      "team",
      newUser.id,
      `Invited ${derivedName} (${inviteEmail}) with role: ${inviteRole.replace("_", " ")}.`
    );
    setInviteSent(true);
    setTimeout(() => {
      setInviteSent(false);
      setInviteEmail("");
      setShowInviteModal(false);
    }, 1500);
  };

  const s = {
    input: { width: "100%", padding: "8px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1e293b", outline: "none", fontFamily: "inherit" },
    select: { width: "100%", padding: "8px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1e293b", outline: "none", fontFamily: "inherit", cursor: "pointer" },
    label: { display: "block" as const, fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: "0.04em" },
  };

  return (
    <AppShell>
      {/* ── Page Header ── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
            <Users style={{ width: 20, height: 20, color: "#4f46e5" }} />
            Team Members & Role-Based Access Control
          </h1>
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>
            Tenant-scoped permissions enforced on every API route and calculation run.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowInviteModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 6px rgba(79,70,229,0.3)" }}
        >
          <UserPlus style={{ width: 14, height: 14 }} />
          Invite Team Member
        </button>
      </div>

      {/* ── User List ── */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8" }}>
            Workspace Members ({users.length})
          </span>
          <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>Tenant: {demoStore.org.name}</span>
        </div>

        <div>
          {users.map((u) => (
            <div key={u.id} style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f8fafc" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#ede9fe", color: "#4f46e5", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
                  {u.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                    {u.name}
                    {u.id === demoStore.activeUser.id && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: "#ede9fe", color: "#4f46e5", border: "1px solid #c7d2fe" }}>
                        You
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{u.email}</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", textTransform: "capitalize" }}>
                  {u.role.replace("_", " ")}
                </span>
              </div>
            </div>
          ))}
        </div>

        {users.length === 1 && (
          <div style={{ padding: "12px 16px", background: "#f8fafc", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 11.5, color: "#64748b" }}>
              💡 Single-user workspace. Invite team members (Finance Manager, Legal, Admin) to delegate review tasks and segregation of duties.
            </span>
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              style={{ background: "none", border: "none", color: "#4f46e5", fontSize: 11.5, fontWeight: 700, cursor: "pointer", padding: 0 }}
            >
              + Invite Collaborator
            </button>
          </div>
        )}
      </div>

      {/* ── RBAC Permission Matrix ── */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
            <Shield style={{ width: 15, height: 15, color: "#4f46e5" }} />
            Server-Side RBAC Permission Matrix
          </h2>
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>
            Defines which roles can upload, calculate, reconcile, and approve regulatory updates.
          </p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8" }}>
                  Permission
                </th>
                {roles.map((r) => (
                  <th key={r} style={{ padding: "8px 12px", textAlign: "center", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8" }}>
                    {r.replace("_", " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(PERMISSIONS).slice(0, 12).map(([perm, allowedRoles], i) => (
                <tr key={perm} style={{ borderBottom: "1px solid #f8fafc", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 11, color: "#374151", fontWeight: 600 }}>{perm}</td>
                  {roles.map((r) => (
                    <td key={r} style={{ padding: "9px 12px", textAlign: "center" }}>
                      {allowedRoles.includes(r) ? (
                        <Check style={{ width: 14, height: 14, color: "#10b981", margin: "0 auto" }} />
                      ) : (
                        <span style={{ color: "#e2e8f0", fontSize: 16 }}>—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Invite Modal ── */}
      {showInviteModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 24px 60px rgba(0,0,0,0.2)", border: "1px solid #e2e8f0", width: "100%", maxWidth: 420 }}>
            <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Invite Team Member</div>
              <button type="button" onClick={() => setShowInviteModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <form onSubmit={handleInvite} style={{ padding: "18px 22px" }}>
              {inviteSent ? (
                <div style={{ padding: "16px", background: "#f0fdf4", border: "1px solid #a7f3d0", borderRadius: 10, display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <Mail style={{ width: 20, height: 20, color: "#059669" }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#065f46" }}>Invitation Sent!</div>
                    <div style={{ fontSize: 11, color: "#6ee7b7" }}>An invite was sent to {inviteEmail}</div>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <label style={s.label}>Email Address</label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      style={s.input}
                    />
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label style={s.label}>Access Role</label>
                    <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as Role)} style={s.select}>
                      <option value="viewer">Viewer — Read-only dashboard access</option>
                      <option value="finance_manager">Finance Manager — Ledger & reconciliation</option>
                      <option value="compliance_manager">Compliance Manager — Full workflow access</option>
                      <option value="admin">Admin — All permissions including settings</option>
                    </select>
                  </div>
                </>
              )}

              {!inviteSent && (
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => setShowInviteModal(false)}
                    style={{ padding: "8px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button type="submit"
                    style={{ padding: "8px 20px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    Send Invite
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
