/**
 * GigShield Database Schema
 * Drizzle ORM — PostgreSQL
 *
 * Architecture principles:
 * 1. Every tenant-owned table has organization_id as the first FK constraint
 * 2. RLS (Row-Level Security) is a second enforcement layer — application always
 *    also filters by organizationId explicitly
 * 3. Audit logs are append-only; no DELETE route touches audit_logs
 * 4. rule_versions carry full regulatory provenance (source document, verification status)
 * 5. lifecycle_status drives the DRAFT→APPROVED→ACTIVE→SUPERSEDED state machine
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  date,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export const orgPlanEnum = pgEnum("org_plan", [
  "trial",
  "growth",
  "enterprise",
]);

export const memberRoleEnum = pgEnum("member_role", [
  "admin",
  "compliance_manager",
  "finance_manager",
  "viewer",
]);

export const regulationStatusEnum = pgEnum("regulation_status", [
  "operational",
  "draft",
  "policy_activity",
  "not_started",
]);

export const lifecycleStatusEnum = pgEnum("lifecycle_status", [
  "draft",
  "approved",
  "active",
  "superseded",
]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "verified",
  "demo",
  "pending_verification",
  "proposed",
  "superseded",
]);

export const rateTypeEnum = pgEnum("rate_type", ["percentage", "flat"]);

export const batchTypeEnum = pgEnum("batch_type", [
  "transactions",
  "ledger",
]);

export const batchStatusEnum = pgEnum("batch_status", [
  "pending",
  "validating",
  "valid",
  "imported",
  "failed",
]);

export const reconStatusEnum = pgEnum("recon_status", [
  "matched",
  "payout_mismatch",
  "fee_mismatch",
  "full_mismatch",
  "missing_from_ledger",
  "unexpected_in_ledger",
  "duplicate_in_ledger",
]);

export const resolutionEnum = pgEnum("resolution_type", [
  "platform_correct",
  "ledger_correct",
  "escalated",
  "waived",
  "pending",
]);

export const severityEnum = pgEnum("severity", [
  "critical",
  "high",
  "medium",
  "low",
  "info",
]);

export const reportTypeEnum = pgEnum("report_type", [
  "quarterly_compliance",
  "annual",
  "custom",
]);

export const changeReviewEnum = pgEnum("change_review_status", [
  "pending",
  "approved",
  "rejected",
]);

export const sourceTypeEnum = pgEnum("source_document_type", [
  "gazette",
  "official_notification",
  "press_release",
  "seeded_demo",
]);

// ─────────────────────────────────────────────────────────────────────────────
// ORGANIZATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  sector: varchar("sector", { length: 100 }),
  registrationNo: varchar("registration_no", { length: 100 }),
  pan: varchar("pan", { length: 20 }),
  address: text("address"),
  stateCode: varchar("state_code", { length: 5 }),
  plan: orgPlanEnum("plan").notNull().default("trial"),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// USERS + ROLES
// ─────────────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  passwordHash: text("password_hash"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull(),
    invitedBy: uuid("invited_by").references(() => users.id),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [uniqueIndex("uq_org_user").on(t.organizationId, t.userId)]
);

// ─────────────────────────────────────────────────────────────────────────────
// REGULATIONS
// The regulation represents the enacted law/bill at state level.
// Multiple rule_versions hang off one regulation.
// ─────────────────────────────────────────────────────────────────────────────

export const regulations = pgTable("regulations", {
  id: uuid("id").primaryKey().defaultRandom(),
  stateCode: varchar("state_code", { length: 5 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  shortName: varchar("short_name", { length: 100 }),
  status: regulationStatusEnum("status").notNull(),
  effectiveDate: date("effective_date"),
  applicableSectors: text("applicable_sectors").array(),
  sourceUrl: text("source_url"),
  gazetteRef: varchar("gazette_ref", { length: 200 }),
  lastVerified: date("last_verified"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ─────────────────────────────────────────────────────────────────────────────
// RULE VERSIONS
// The executable fee rule, tied to a regulation. Carries full provenance.
// lifecycle: DRAFT → APPROVED → ACTIVE → SUPERSEDED (immutable once ACTIVE)
// ─────────────────────────────────────────────────────────────────────────────

export const ruleVersions = pgTable(
  "rule_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    regulationId: uuid("regulation_id")
      .notNull()
      .references(() => regulations.id),
    versionCode: varchar("version_code", { length: 50 }).notNull().unique(),
    versionNumber: integer("version_number").notNull(),

    // Applicability scope
    sector: varchar("sector", { length: 100 }), // NULL = all sectors
    vehicleType: varchar("vehicle_type", { length: 100 }), // NULL = all vehicle types

    // Fee parameters
    rateType: rateTypeEnum("rate_type").notNull().default("percentage"),
    rate: numeric("rate", { precision: 10, scale: 4 }).notNull(),
    cap: numeric("cap", { precision: 10, scale: 2 }), // max fee per transaction
    minimumFee: numeric("minimum_fee", { precision: 10, scale: 2 }),
    baseType: varchar("base_type", { length: 50 }).notNull().default("payout"),

    // Applicability window
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"), // NULL = open-ended

    // Compliance requirements (derived from regulation)
    reportingFrequency: varchar("reporting_frequency", { length: 50 }), // 'quarterly','monthly'
    registrationWindowDays: integer("registration_window_days"),
    workerUpdateWindowDays: integer("worker_update_window_days"),

    // Lifecycle state machine
    lifecycleStatus: lifecycleStatusEnum("lifecycle_status")
      .notNull()
      .default("draft"),

    // ─────────────────────────────────────────────────────────────────────
    // REGULATORY PROVENANCE — Every rule must document its source
    // This drives the 🟡 Demo / 🟢 Verified UI badges
    // ─────────────────────────────────────────────────────────────────────
    sourceDocumentTitle: text("source_document_title"),
    sourceDocumentUrl: text("source_document_url"),
    sourceDocumentDate: date("source_document_date"),
    sourceGazetteRef: varchar("source_gazette_ref", { length: 200 }),
    sourceNotificationNo: varchar("source_notification_no", { length: 200 }),

    // Verification status — controls UI badge
    verificationStatus: verificationStatusEnum("verification_status")
      .notNull()
      .default("demo"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedByName: varchar("verified_by_name", { length: 255 }),
    interpretationNotes: text("interpretation_notes"),

    // Traceability
    sourceChangeId: uuid("source_change_id"), // FK to regulatory_changes (set post-creation)
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    notes: text("notes"),
  },
  (t) => [
    // Enforce at-most-ONE active rule per (regulation × sector × vehicle_type)
    // NULLs are treated as '__ALL__' sentinel in application-level resolution
    uniqueIndex("uq_one_active_rule").on(
      t.regulationId,
      t.lifecycleStatus,
      t.sector,
      t.vehicleType
    ),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// WORKERS (populated from transaction CSV worker_ids)
// ─────────────────────────────────────────────────────────────────────────────

export const workers = pgTable(
  "workers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    workerId: varchar("worker_id", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }),
    phone: varchar("phone", { length: 20 }),
    stateCode: varchar("state_code", { length: 5 }),
    sector: varchar("sector", { length: 100 }),
    vehicleType: varchar("vehicle_type", { length: 100 }),
    status: varchar("status", { length: 50 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("uq_org_worker").on(t.organizationId, t.workerId),
    index("idx_workers_org").on(t.organizationId),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD BATCHES (tracks CSV upload sessions — both transaction and ledger)
// ─────────────────────────────────────────────────────────────────────────────

export const uploadBatches = pgTable(
  "upload_batches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    batchType: batchTypeEnum("batch_type").notNull(),
    filename: varchar("filename", { length: 500 }),
    totalRows: integer("total_rows"),
    validRows: integer("valid_rows"),
    invalidRows: integer("invalid_rows"),
    warningRows: integer("warning_rows"),
    status: batchStatusEnum("status").notNull().default("pending"),
    uploadedBy: uuid("uploaded_by").references(() => users.id),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("idx_batches_org").on(t.organizationId)]
);

// ─────────────────────────────────────────────────────────────────────────────
// TRANSACTIONS (platform payout records)
// ─────────────────────────────────────────────────────────────────────────────

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    batchId: uuid("batch_id").references(() => uploadBatches.id),
    transactionId: varchar("transaction_id", { length: 200 }).notNull(),
    workerId: varchar("worker_id", { length: 100 }),
    stateCode: varchar("state_code", { length: 5 }),
    sector: varchar("sector", { length: 100 }),
    vehicleType: varchar("vehicle_type", { length: 100 }),
    payout: numeric("payout", { precision: 12, scale: 2 }).notNull(),
    transactionDate: date("transaction_date").notNull(),
    isValid: boolean("is_valid").notNull().default(true),
    validationIssues: jsonb("validation_issues").default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("uq_org_txn").on(t.organizationId, t.transactionId),
    index("idx_txn_org_date").on(t.organizationId, t.transactionDate),
    index("idx_txn_org_state").on(t.organizationId, t.stateCode),
    index("idx_txn_worker").on(t.organizationId, t.workerId),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION ISSUES
// ─────────────────────────────────────────────────────────────────────────────

export const validationIssues = pgTable(
  "validation_issues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    batchId: uuid("batch_id").references(() => uploadBatches.id),
    transactionId: varchar("transaction_id", { length: 200 }),
    rowNumber: integer("row_number"),
    issueType: varchar("issue_type", { length: 100 }).notNull(),
    issueDetail: text("issue_detail"),
    severity: varchar("severity", { length: 20 }).notNull().default("error"),
    resolution: varchar("resolution", { length: 50 }).default("pending"),
    resolutionNote: text("resolution_note"),
    resolvedBy: uuid("resolved_by").references(() => users.id),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("idx_issues_batch").on(t.batchId)]
);

// ─────────────────────────────────────────────────────────────────────────────
// CALCULATION RUNS + LINE ITEMS
// calculation_runs: summary per batch/period
// calculation_line_items: one row per transaction, stores full explanation JSONB
// ─────────────────────────────────────────────────────────────────────────────

export const calculationRuns = pgTable(
  "calculation_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    batchId: uuid("batch_id").references(() => uploadBatches.id),
    periodStart: date("period_start"),
    periodEnd: date("period_end"),
    stateCode: varchar("state_code", { length: 5 }),
    ruleVersionId: uuid("rule_version_id").references(() => ruleVersions.id),
    ruleVersionCode: varchar("rule_version_code", { length: 50 }),
    totalTransactions: integer("total_transactions"),
    validTransactions: integer("valid_transactions"),
    exemptTransactions: integer("exempt_transactions"),
    totalPayout: numeric("total_payout", { precision: 15, scale: 2 }),
    totalWelfareFee: numeric("total_welfare_fee", { precision: 15, scale: 2 }),
    status: varchar("status", { length: 50 }).notNull().default("completed"),
    ruleVersionsUsed: jsonb("rule_versions_used").default(sql`'[]'::jsonb`),
    runBy: uuid("run_by").references(() => users.id),
    runAt: timestamp("run_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("idx_calc_org").on(t.organizationId)]
);

export const calculationLineItems = pgTable(
  "calculation_line_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    calculationRunId: uuid("calculation_run_id")
      .notNull()
      .references(() => calculationRuns.id),
    transactionId: uuid("transaction_id")
      .notNull()
      .references(() => transactions.id),
    ruleVersionId: uuid("rule_version_id").references(() => ruleVersions.id),
    ruleVersionCode: varchar("rule_version_code", { length: 50 }),

    // Input
    stateCode: varchar("state_code", { length: 5 }),
    sector: varchar("sector", { length: 100 }),
    vehicleType: varchar("vehicle_type", { length: 100 }),
    payout: numeric("payout", { precision: 12, scale: 2 }),

    // Calculation steps
    rate: numeric("rate", { precision: 10, scale: 4 }),
    baseFee: numeric("base_fee", { precision: 10, scale: 2 }),
    capApplied: boolean("cap_applied").notNull().default(false),
    capAmount: numeric("cap_amount", { precision: 10, scale: 2 }),
    minimumApplied: boolean("minimum_applied").notNull().default(false),
    welfareFee: numeric("welfare_fee", { precision: 10, scale: 2 }).notNull(),

    // Outcome
    isExempt: boolean("is_exempt").notNull().default(false),
    exemptReason: text("exempt_reason"),

    // Full step-by-step explanation (stored as JSONB, rendered in UI)
    calculationDetail: jsonb("calculation_detail"),
  },
  (t) => [
    index("idx_calc_items_run").on(t.calculationRunId),
    index("idx_calc_items_org").on(t.organizationId),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// LEDGER ENTRIES (finance ledger upload — the second data source for reconciliation)
// ─────────────────────────────────────────────────────────────────────────────

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    batchId: uuid("batch_id").references(() => uploadBatches.id),
    transactionId: varchar("transaction_id", { length: 200 }).notNull(),
    recordedPayout: numeric("recorded_payout", { precision: 12, scale: 2 }),
    recordedFee: numeric("recorded_fee", { precision: 10, scale: 2 }),
    entryDate: date("entry_date"),
    isDuplicate: boolean("is_duplicate").notNull().default(false),
  },
  (t) => [
    index("idx_ledger_org").on(t.organizationId),
    index("idx_ledger_txn").on(t.organizationId, t.transactionId),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// RECONCILIATION RUNS + ITEMS
// 4-column comparison: platform payout / ledger payout / expected fee / recorded fee
// ─────────────────────────────────────────────────────────────────────────────

export const reconciliationRuns = pgTable(
  "reconciliation_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    calculationRunId: uuid("calculation_run_id").references(
      () => calculationRuns.id
    ),
    ledgerBatchId: uuid("ledger_batch_id").references(() => uploadBatches.id),
    periodStart: date("period_start"),
    periodEnd: date("period_end"),

    // Summary counts
    totalRecords: integer("total_records"),
    matchedCount: integer("matched_count"),
    payoutMismatchCount: integer("payout_mismatch_count"),
    feeMismatchCount: integer("fee_mismatch_count"),
    fullMismatchCount: integer("full_mismatch_count"),
    missingFromLedgerCount: integer("missing_from_ledger_count"),
    unexpectedInLedgerCount: integer("unexpected_in_ledger_count"),
    duplicateInLedgerCount: integer("duplicate_in_ledger_count"),

    matchRate: numeric("match_rate", { precision: 5, scale: 2 }),
    totalFeeGap: numeric("total_fee_gap", { precision: 15, scale: 2 }),
    status: varchar("status", { length: 50 }).notNull().default("completed"),
    runBy: uuid("run_by").references(() => users.id),
    runAt: timestamp("run_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("idx_recon_org").on(t.organizationId)]
);

export const reconciliationItems = pgTable(
  "reconciliation_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    reconciliationRunId: uuid("reconciliation_run_id")
      .notNull()
      .references(() => reconciliationRuns.id),
    transactionId: varchar("transaction_id", { length: 200 }).notNull(),

    // 4-column evidence
    platformPayout: numeric("platform_payout", { precision: 12, scale: 2 }),
    ledgerPayout: numeric("ledger_payout", { precision: 12, scale: 2 }),
    expectedFee: numeric("expected_fee", { precision: 10, scale: 2 }),
    recordedFee: numeric("recorded_fee", { precision: 10, scale: 2 }),

    // Differences
    payoutDiff: numeric("payout_diff", { precision: 12, scale: 2 }),
    feeDiff: numeric("fee_diff", { precision: 10, scale: 2 }),

    // Classification
    status: reconStatusEnum("status").notNull(),
    severity: severityEnum("severity").notNull().default("medium"),

    // Rule version used for expected fee calculation
    ruleVersionCode: varchar("rule_version_code", { length: 50 }),

    // Resolution
    resolution: resolutionEnum("resolution").notNull().default("pending"),
    resolutionNote: text("resolution_note"),
    resolvedBy: uuid("resolved_by").references(() => users.id),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    assignedTo: uuid("assigned_to").references(() => users.id),
  },
  (t) => [
    index("idx_recon_items_run").on(t.reconciliationRunId),
    index("idx_recon_items_org").on(t.organizationId),
    index("idx_recon_items_status").on(t.organizationId, t.status),
    index("idx_recon_items_resolution").on(t.organizationId, t.resolution),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// COMPLIANCE SCORES (append-only snapshots — each recompute creates a new row)
// ─────────────────────────────────────────────────────────────────────────────

export const complianceScores = pgTable(
  "compliance_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    score: integer("score").notNull(), // 0–100
    // Component scores with applicability metadata
    scoreDetail: jsonb("score_detail").notNull(),
    // Formula version + weights used — ensures reproducibility
    scoreFormula: jsonb("score_formula").notNull(),
    computedAt: timestamp("computed_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("idx_scores_org").on(t.organizationId, t.computedAt)]
);

// ─────────────────────────────────────────────────────────────────────────────
// ACTIONS (replaces "deadlines" as a first-class feature with remediation info)
// ─────────────────────────────────────────────────────────────────────────────

export const actions = pgTable(
  "actions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    actionType: varchar("action_type", { length: 100 }), // 'reporting','reconciliation','data_quality','deadline'
    priority: severityEnum("priority").notNull().default("medium"),
    estimatedImpact: text("estimated_impact"), // e.g., "₹1,240 fee gap"
    recommendedAction: text("recommended_action"),
    dueDate: date("due_date"),
    regulationId: uuid("regulation_id").references(() => regulations.id),
    ruleVersionId: uuid("rule_version_id").references(() => ruleVersions.id),
    relatedEntityType: varchar("related_entity_type", { length: 100 }),
    relatedEntityId: uuid("related_entity_id"),
    assignedTo: uuid("assigned_to").references(() => users.id),
    status: varchar("status", { length: 50 }).notNull().default("pending"), // pending,in_progress,completed,overdue
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("idx_actions_org").on(t.organizationId, t.dueDate)]
);

// ─────────────────────────────────────────────────────────────────────────────
// ALERTS
// ─────────────────────────────────────────────────────────────────────────────

export const alerts = pgTable(
  "alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    severity: severityEnum("severity").notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    alertType: varchar("alert_type", { length: 100 }),
    actionUrl: varchar("action_url", { length: 500 }),
    relatedEntityType: varchar("related_entity_type", { length: 100 }),
    relatedEntityId: uuid("related_entity_id"),
    isRead: boolean("is_read").notNull().default(false),
    isDismissed: boolean("is_dismissed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    index("idx_alerts_org").on(
      t.organizationId,
      t.isDismissed,
      t.createdAt
    ),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// REGULATORY CHANGES (AI-detected or manually added change proposals)
// ─────────────────────────────────────────────────────────────────────────────

export const regulatoryChanges = pgTable(
  "regulatory_changes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    regulationId: uuid("regulation_id").references(() => regulations.id),
    stateCode: varchar("state_code", { length: 5 }),
    title: varchar("title", { length: 500 }).notNull(),
    sourceUrl: text("source_url"),
    sourceType: sourceTypeEnum("source_type"),
    sourceDocumentTitle: text("source_document_title"),
    rawContent: text("raw_content"),
    detectedAt: timestamp("detected_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),

    // AI analysis outputs
    aiSummary: text("ai_summary"),
    aiAffectedSectors: text("ai_affected_sectors").array(),
    aiChangeType: varchar("ai_change_type", { length: 100 }),
    aiOldValue: text("ai_old_value"),
    aiNewValue: text("ai_new_value"),
    aiEffectiveDate: date("ai_effective_date"),
    aiConfidence: numeric("ai_confidence", { precision: 3, scale: 2 }),
    aiConfidenceNote: text("ai_confidence_note"),
    aiAnalyzedAt: timestamp("ai_analyzed_at", { withTimezone: true }),

    // Human review
    reviewStatus: changeReviewEnum("review_status")
      .notNull()
      .default("pending"),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewNote: text("review_note"),

    // Resulting rule version (set after approval)
    resultingRuleVersionId: uuid("resulting_rule_version_id"),
  },
  (t) => [
    index("idx_reg_changes").on(t.stateCode, t.reviewStatus),
  ]
);

// ─────────────────────────────────────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────────────────────────────────────

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    title: varchar("title", { length: 500 }).notNull(),
    reportType: reportTypeEnum("report_type"),
    periodStart: date("period_start"),
    periodEnd: date("period_end"),
    stateCode: varchar("state_code", { length: 5 }),
    calculationRunId: uuid("calculation_run_id").references(
      () => calculationRuns.id
    ),
    reconciliationRunId: uuid("reconciliation_run_id").references(
      () => reconciliationRuns.id
    ),
    ruleVersionCode: varchar("rule_version_code", { length: 50 }),
    // Full report data snapshot at generation time (ensures reproducibility)
    dataSnapshot: jsonb("data_snapshot"),
    csvUrl: text("csv_url"),
    pdfUrl: text("pdf_url"),
    generatedBy: uuid("generated_by").references(() => users.id),
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    status: varchar("status", { length: 50 }).notNull().default("generated"),
  },
  (t) => [index("idx_reports_org").on(t.organizationId, t.generatedAt)]
);

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOGS (append-only — no DELETE route ever touches this table)
// ─────────────────────────────────────────────────────────────────────────────

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    userId: uuid("user_id").references(() => users.id),
    userName: varchar("user_name", { length: 255 }), // denormalized for history
    userRole: varchar("user_role", { length: 50 }), // denormalized for history
    action: varchar("action", { length: 200 }).notNull(), // e.g. 'calculation.run'
    entityType: varchar("entity_type", { length: 100 }),
    entityId: varchar("entity_id", { length: 200 }),
    previousValue: jsonb("previous_value"),
    newValue: jsonb("new_value"),
    metadata: jsonb("metadata"),
    ipAddress: varchar("ip_address", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("idx_audit_org_time").on(t.organizationId, t.createdAt)]
);

// ─────────────────────────────────────────────────────────────────────────────
// AUTH.JS TABLES (required by @auth/drizzle-adapter)
// ─────────────────────────────────────────────────────────────────────────────

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    idToken: text("id_token"),
    sessionState: varchar("session_state", { length: 255 }),
  },
  (t) => [
    uniqueIndex("uq_account").on(t.provider, t.providerAccountId),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: varchar("session_token", { length: 255 }).primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (t) => [uniqueIndex("uq_verification_token").on(t.identifier, t.token)]
);

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONS (for Drizzle relational queries)
// ─────────────────────────────────────────────────────────────────────────────

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  transactions: many(transactions),
  uploadBatches: many(uploadBatches),
  calculationRuns: many(calculationRuns),
  reconciliationRuns: many(reconciliationRuns),
  reports: many(reports),
  auditLogs: many(auditLogs),
  complianceScores: many(complianceScores),
  actions: many(actions),
  alerts: many(alerts),
}));

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(organizationMembers),
  auditLogs: many(auditLogs),
}));

export const regulationsRelations = relations(regulations, ({ many }) => ({
  ruleVersions: many(ruleVersions),
  regulatoryChanges: many(regulatoryChanges),
}));

export const ruleVersionsRelations = relations(ruleVersions, ({ one }) => ({
  regulation: one(regulations, {
    fields: [ruleVersions.regulationId],
    references: [regulations.id],
  }),
}));

export const transactionsRelations = relations(
  transactions,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [transactions.organizationId],
      references: [organizations.id],
    }),
    batch: one(uploadBatches, {
      fields: [transactions.batchId],
      references: [uploadBatches.id],
    }),
    calculationLineItems: many(calculationLineItems),
  })
);

export const calculationRunsRelations = relations(
  calculationRuns,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [calculationRuns.organizationId],
      references: [organizations.id],
    }),
    lineItems: many(calculationLineItems),
  })
);

export const reconciliationRunsRelations = relations(
  reconciliationRuns,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [reconciliationRuns.organizationId],
      references: [organizations.id],
    }),
    items: many(reconciliationItems),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// TYPE EXPORTS (for use in the application layer)
// ─────────────────────────────────────────────────────────────────────────────

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type Regulation = typeof regulations.$inferSelect;
export type NewRegulation = typeof regulations.$inferInsert;
export type RuleVersion = typeof ruleVersions.$inferSelect;
export type NewRuleVersion = typeof ruleVersions.$inferInsert;
export type Worker = typeof workers.$inferSelect;
export type UploadBatch = typeof uploadBatches.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type ValidationIssue = typeof validationIssues.$inferSelect;
export type CalculationRun = typeof calculationRuns.$inferSelect;
export type CalculationLineItem = typeof calculationLineItems.$inferSelect;
export type NewCalculationLineItem = typeof calculationLineItems.$inferInsert;
export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type NewLedgerEntry = typeof ledgerEntries.$inferInsert;
export type ReconciliationRun = typeof reconciliationRuns.$inferSelect;
export type ReconciliationItem = typeof reconciliationItems.$inferSelect;
export type ComplianceScore = typeof complianceScores.$inferSelect;
export type Action = typeof actions.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type RegulatoryChange = typeof regulatoryChanges.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
