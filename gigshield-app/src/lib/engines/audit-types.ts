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
