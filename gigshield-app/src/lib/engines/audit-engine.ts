/**
 * GigShield Audit Engine
 *
 * Provides a single function to write immutable audit log entries.
 * All application code that changes data MUST call recordAuditEvent.
 *
 * Audit logs are append-only — no route ever DELETEs from audit_logs.
 */

import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

export interface AuditEventParams {
  organizationId: string;
  userId?: string | null;
  userName?: string | null;
  userRole?: string | null;
  action: string;             // e.g. 'calculation.run', 'recon.resolve_issue', 'rule_version.activate'
  entityType?: string | null; // e.g. 'calculation_run', 'reconciliation_item', 'rule_version'
  entityId?: string | null;
  previousValue?: object | null;
  newValue?: object | null;
  metadata?: object | null;
  ipAddress?: string | null;
}

/**
 * Record an immutable audit event.
 * Call this in every Server Action and API route that modifies data.
 *
 * Errors are caught and logged to stderr — never re-thrown.
 * Audit failure must never block the primary operation.
 */
export async function recordAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      organizationId: params.organizationId,
      userId: params.userId ?? null,
      userName: params.userName ?? null,
      userRole: params.userRole ?? null,
      action: params.action,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
      previousValue: params.previousValue ? JSON.parse(JSON.stringify(params.previousValue)) : null,
      newValue: params.newValue ? JSON.parse(JSON.stringify(params.newValue)) : null,
      metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : null,
      ipAddress: params.ipAddress ?? null,
    });
  } catch (err) {
    // Never throw from audit. Log to stderr.
    console.error("[AuditEngine] Failed to write audit event:", params.action, err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Typed action constants (use these everywhere to prevent typos)
// ─────────────────────────────────────────────────────────────────────────────
export const AUDIT_ACTIONS = {
  // Auth
  AUTH_LOGIN: "auth.login",
  AUTH_LOGOUT: "auth.logout",

  // Organization
  ORG_CREATED: "org.created",
  ORG_UPDATED: "org.updated",
  ORG_MEMBER_INVITED: "org.member.invited",
  ORG_MEMBER_REMOVED: "org.member.removed",
  ORG_ROLE_CHANGED: "org.role.changed",

  // Transactions
  BATCH_UPLOADED: "batch.uploaded",
  BATCH_VALIDATED: "batch.validated",
  BATCH_IMPORTED: "batch.imported",

  // Calculations
  CALCULATION_RUN_STARTED: "calculation.run.started",
  CALCULATION_RUN_COMPLETED: "calculation.run.completed",

  // Ledger
  LEDGER_BATCH_UPLOADED: "ledger.batch.uploaded",
  LEDGER_BATCH_IMPORTED: "ledger.batch.imported",

  // Reconciliation
  RECON_RUN_STARTED: "recon.run.started",
  RECON_RUN_COMPLETED: "recon.run.completed",
  RECON_ISSUE_RESOLVED: "recon.issue.resolved",
  RECON_ISSUE_ASSIGNED: "recon.issue.assigned",

  // Compliance Score
  COMPLIANCE_SCORE_COMPUTED: "compliance_score.computed",

  // Actions
  ACTION_CREATED: "action.created",
  ACTION_STATUS_CHANGED: "action.status_changed",
  ACTION_ASSIGNED: "action.assigned",
  ACTION_COMPLETED: "action.completed",

  // Reports
  REPORT_GENERATED: "report.generated",
  REPORT_DOWNLOADED: "report.downloaded",

  // Regulatory
  REG_CHANGE_ANALYZED: "reg_change.analyzed",
  REG_CHANGE_APPROVED: "reg_change.approved",
  REG_CHANGE_REJECTED: "reg_change.rejected",

  // Rule versions
  RULE_VERSION_CREATED: "rule_version.created",
  RULE_VERSION_ACTIVATED: "rule_version.activated",
  RULE_VERSION_SUPERSEDED: "rule_version.superseded",
  RULE_VERSION_APPROVED: "rule_version.approved",

  // Demo
  DEMO_RESET: "demo.reset",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
