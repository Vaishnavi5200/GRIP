/**
 * GigShield Validation Engine
 *
 * Validates transaction CSV rows before ingestion.
 * All 14+ validation rules from the spec are implemented here.
 *
 * PURE FUNCTION — no DB calls.
 * The caller passes the set of known worker IDs, valid states, etc.
 * so the engine can check referential integrity without DB queries inside.
 */

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  rowNumber: number;
  field?: string;
  issueType: string;
  issueDetail: string;
  severity: ValidationSeverity;
}

export interface RawTransactionRow {
  transaction_id?: string;
  worker_id?: string;
  state?: string;
  sector?: string;
  vehicle_type?: string;
  payout?: string | number;
  transaction_date?: string;
  [key: string]: unknown; // allow extra columns
}

export type ValidationStatus = "valid" | "invalid" | "warning" | "not_applicable";

export interface ValidatedTransaction {
  rowNumber: number;
  raw: RawTransactionRow;
  status: ValidationStatus;
  issues: ValidationIssue[];
  // Parsed, type-safe fields (only populated for valid/warning rows)
  parsed?: {
    transactionId: string;
    workerId: string | null;
    stateCode: string;
    sector: string;
    vehicleType: string;
    payout: number;
    transactionDate: string;
  };
}

export interface ValidationReport {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  warningCount: number;
  notApplicableCount: number;
  issues: ValidationIssue[];
  validated: ValidatedTransaction[];
  knownColumns: string[];
  unexpectedColumns: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SUPPORTED_STATES = new Set(["KA", "RJ", "TG", "JH", "MH", "DL", "UP", "TN", "AP"]);
const ACTIVE_CALCULATION_STATES = new Set(["KA"]); // only KA has active rules

const VALID_SECTORS = new Set([
  "ride-hailing",
  "logistics",
  "food-delivery",
  "ecommerce",
]);

const VALID_VEHICLE_TYPES = new Set(["2W", "4W", "LCV", "HCV", "bicycle"]);

const EXPECTED_COLUMNS = new Set([
  "transaction_id",
  "worker_id",
  "state",
  "sector",
  "vehicle_type",
  "payout",
  "transaction_date",
]);

// ─────────────────────────────────────────────────────────────────────────────
// Main validation function
// ─────────────────────────────────────────────────────────────────────────────

export function validateTransactionRows(
  rows: RawTransactionRow[],
  options: {
    existingTransactionIds?: Set<string>; // to detect duplicates
    seenInBatch?: Set<string>; // tracks within-batch duplicates
  } = {}
): ValidationReport {
  const existingIds = options.existingTransactionIds ?? new Set<string>();
  const seenInBatch = new Set<string>();

  const report: ValidationReport = {
    totalRows: rows.length,
    validCount: 0,
    invalidCount: 0,
    warningCount: 0,
    notApplicableCount: 0,
    issues: [],
    validated: [],
    knownColumns: [],
    unexpectedColumns: [],
  };

  // Check columns (only on first row)
  if (rows.length > 0) {
    const cols = Object.keys(rows[0]);
    report.knownColumns = cols.filter((c) => EXPECTED_COLUMNS.has(c));
    report.unexpectedColumns = cols.filter((c) => !EXPECTED_COLUMNS.has(c));
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 1;
    const issues: ValidationIssue[] = [];

    // ── R01: transaction_id must be present
    if (!row.transaction_id || String(row.transaction_id).trim() === "") {
      issues.push({
        rowNumber,
        field: "transaction_id",
        issueType: "missing_transaction_id",
        issueDetail: "transaction_id is required and cannot be empty",
        severity: "error",
      });
    }

    const transactionId = String(row.transaction_id ?? "").trim();

    // ── R02: duplicate within batch
    if (transactionId && seenInBatch.has(transactionId)) {
      issues.push({
        rowNumber,
        field: "transaction_id",
        issueType: "duplicate_transaction_id_in_batch",
        issueDetail: `transaction_id '${transactionId}' appears more than once in this upload`,
        severity: "error",
      });
    } else if (transactionId) {
      seenInBatch.add(transactionId);
    }

    // ── R03: already exists in DB
    if (transactionId && existingIds.has(transactionId)) {
      issues.push({
        rowNumber,
        field: "transaction_id",
        issueType: "duplicate_transaction_id_existing",
        issueDetail: `transaction_id '${transactionId}' already exists in the database`,
        severity: "error",
      });
    }

    // ── R04: worker_id should be present (warning if missing)
    const workerId = row.worker_id ? String(row.worker_id).trim() : null;
    if (!workerId) {
      issues.push({
        rowNumber,
        field: "worker_id",
        issueType: "missing_worker_id",
        issueDetail: "worker_id is missing — this transaction cannot be linked to a worker",
        severity: "warning",
      });
    }

    // ── R05: state must be present
    const stateCode = row.state ? String(row.state).trim().toUpperCase() : "";
    if (!stateCode) {
      issues.push({
        rowNumber,
        field: "state",
        issueType: "missing_state",
        issueDetail: "state is required",
        severity: "error",
      });
    } else if (!SUPPORTED_STATES.has(stateCode)) {
      issues.push({
        rowNumber,
        field: "state",
        issueType: "unsupported_state",
        issueDetail: `State '${stateCode}' is not recognised. Supported: ${Array.from(SUPPORTED_STATES).join(", ")}`,
        severity: "error",
      });
    }

    // ── R06: sector must be present and valid
    const sector = row.sector ? String(row.sector).trim().toLowerCase() : "";
    if (!sector) {
      issues.push({
        rowNumber,
        field: "sector",
        issueType: "missing_sector",
        issueDetail: "sector is required",
        severity: "error",
      });
    } else if (!VALID_SECTORS.has(sector)) {
      issues.push({
        rowNumber,
        field: "sector",
        issueType: "unsupported_sector",
        issueDetail: `Sector '${sector}' is not supported. Valid values: ${Array.from(VALID_SECTORS).join(", ")}`,
        severity: "error",
      });
    }

    // ── R07: vehicle_type must be valid
    const vehicleType = row.vehicle_type
      ? String(row.vehicle_type).trim().toUpperCase()
      : "";
    if (!vehicleType) {
      issues.push({
        rowNumber,
        field: "vehicle_type",
        issueType: "missing_vehicle_type",
        issueDetail: "vehicle_type is required",
        severity: "error",
      });
    } else if (!VALID_VEHICLE_TYPES.has(vehicleType)) {
      issues.push({
        rowNumber,
        field: "vehicle_type",
        issueType: "unsupported_vehicle_type",
        issueDetail: `vehicle_type '${vehicleType}' is not supported. Valid values: ${Array.from(VALID_VEHICLE_TYPES).join(", ")}`,
        severity: "error",
      });
    }

    // ── R08: payout must be a positive number
    const rawPayout = row.payout;
    let payout: number | null = null;
    if (rawPayout === undefined || rawPayout === null || rawPayout === "") {
      issues.push({
        rowNumber,
        field: "payout",
        issueType: "missing_payout",
        issueDetail: "payout is required",
        severity: "error",
      });
    } else {
      const parsed = parseFloat(String(rawPayout).replace(/,/g, "").trim());
      if (isNaN(parsed)) {
        issues.push({
          rowNumber,
          field: "payout",
          issueType: "invalid_payout",
          issueDetail: `payout '${rawPayout}' is not a valid number`,
          severity: "error",
        });
      } else if (parsed < 0) {
        issues.push({
          rowNumber,
          field: "payout",
          issueType: "negative_payout",
          issueDetail: `payout cannot be negative (got ${parsed})`,
          severity: "error",
        });
      } else if (parsed === 0) {
        issues.push({
          rowNumber,
          field: "payout",
          issueType: "zero_payout",
          issueDetail: `payout is zero — this transaction will have zero welfare fee`,
          severity: "warning",
        });
        payout = 0;
      } else {
        payout = parsed;
      }
    }

    // ── R09: transaction_date must be a valid ISO date
    const rawDate = row.transaction_date
      ? String(row.transaction_date).trim()
      : "";
    let transactionDate: string | null = null;
    if (!rawDate) {
      issues.push({
        rowNumber,
        field: "transaction_date",
        issueType: "missing_date",
        issueDetail: "transaction_date is required (format: YYYY-MM-DD or DD/MM/YYYY)",
        severity: "error",
      });
    } else {
      const parsed = parseDate(rawDate);
      if (!parsed) {
        issues.push({
          rowNumber,
          field: "transaction_date",
          issueType: "invalid_date",
          issueDetail: `transaction_date '${rawDate}' could not be parsed. Use YYYY-MM-DD format`,
          severity: "error",
        });
      } else {
        transactionDate = parsed;
        // Future date warning
        if (new Date(parsed) > new Date()) {
          issues.push({
            rowNumber,
            field: "transaction_date",
            issueType: "future_date",
            issueDetail: `transaction_date '${rawDate}' is in the future`,
            severity: "warning",
          });
        }
      }
    }

    // ── R10: state not yet covered (not_applicable status)
    const isNotApplicable =
      stateCode && SUPPORTED_STATES.has(stateCode) && !ACTIVE_CALCULATION_STATES.has(stateCode);

    // ── Determine status
    const hasErrors = issues.some((i) => i.severity === "error");
    const hasWarnings = issues.some((i) => i.severity === "warning");

    let status: ValidationStatus;
    if (hasErrors) {
      status = "invalid";
      report.invalidCount++;
    } else if (isNotApplicable) {
      status = "not_applicable";
      report.notApplicableCount++;
    } else if (hasWarnings) {
      status = "warning";
      report.warningCount++;
    } else {
      status = "valid";
      report.validCount++;
    }

    const validated: ValidatedTransaction = {
      rowNumber,
      raw: row,
      status,
      issues,
    };

    // Populate parsed fields for importable rows
    if (!hasErrors && transactionId && stateCode && sector && vehicleType && payout !== null && transactionDate) {
      validated.parsed = {
        transactionId,
        workerId,
        stateCode,
        sector,
        vehicleType,
        payout,
        transactionDate,
      };
    }

    report.validated.push(validated);
    report.issues.push(...issues);
  }

  return report;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ledger CSV validation
// ─────────────────────────────────────────────────────────────────────────────

export interface RawLedgerRow {
  transaction_id?: string;
  payout?: string | number;
  welfare_fee?: string | number;
  entry_date?: string;
  [key: string]: unknown;
}

export interface ValidatedLedgerRow {
  rowNumber: number;
  raw: RawLedgerRow;
  status: ValidationStatus;
  issues: ValidationIssue[];
  parsed?: {
    transactionId: string;
    recordedPayout: number | null;
    recordedFee: number | null;
    entryDate: string | null;
  };
}

export function validateLedgerRows(rows: RawLedgerRow[]): {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  validated: ValidatedLedgerRow[];
  issues: ValidationIssue[];
} {
  const result = {
    totalRows: rows.length,
    validCount: 0,
    invalidCount: 0,
    validated: [] as ValidatedLedgerRow[],
    issues: [] as ValidationIssue[],
  };

  const seenInBatch = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 1;
    const issues: ValidationIssue[] = [];

    // transaction_id required
    const transactionId = row.transaction_id
      ? String(row.transaction_id).trim()
      : "";
    if (!transactionId) {
      issues.push({
        rowNumber,
        field: "transaction_id",
        issueType: "missing_transaction_id",
        issueDetail: "transaction_id is required",
        severity: "error",
      });
    }

    // Duplicate in batch (NOT auto-flagged as fraudulent — just flagged for review)
    const isDuplicateInBatch = transactionId && seenInBatch.has(transactionId);
    if (isDuplicateInBatch) {
      issues.push({
        rowNumber,
        field: "transaction_id",
        issueType: "duplicate_in_ledger_batch",
        issueDetail: `transaction_id '${transactionId}' appears multiple times in ledger. Review to confirm if this is a legitimate repeat transaction or a duplicate entry.`,
        severity: "warning", // warning, NOT error — could be legitimate
      });
    } else if (transactionId) {
      seenInBatch.add(transactionId);
    }

    // Parse payout
    const recordedPayout = parseOptionalNumber(row.payout);
    if (row.payout !== undefined && row.payout !== null && row.payout !== "" && recordedPayout === null) {
      issues.push({
        rowNumber,
        field: "payout",
        issueType: "invalid_payout",
        issueDetail: `payout '${row.payout}' is not a valid number`,
        severity: "error",
      });
    }

    // Parse fee
    const recordedFee = parseOptionalNumber(row.welfare_fee);
    if (row.welfare_fee !== undefined && row.welfare_fee !== null && row.welfare_fee !== "" && recordedFee === null) {
      issues.push({
        rowNumber,
        field: "welfare_fee",
        issueType: "invalid_fee",
        issueDetail: `welfare_fee '${row.welfare_fee}' is not a valid number`,
        severity: "error",
      });
    }

    // Parse date
    const entryDate = row.entry_date ? parseDate(String(row.entry_date).trim()) : null;

    const hasErrors = issues.some((i) => i.severity === "error");
    const status: ValidationStatus = hasErrors ? "invalid" : "valid";

    if (hasErrors) result.invalidCount++;
    else result.validCount++;

    result.validated.push({
      rowNumber,
      raw: row,
      status,
      issues,
      ...(transactionId && !hasErrors
        ? {
            parsed: {
              transactionId,
              recordedPayout,
              recordedFee,
              entryDate,
            },
          }
        : {}),
    });

    result.issues.push(...issues);
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function parseDate(raw: string): string | null {
  // Accept YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return raw;
  }
  // Accept DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [dd, mm, yyyy] = raw.split("/");
    const iso = `${yyyy}-${mm}-${dd}`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return iso;
  }
  // Accept DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
    const [dd, mm, yyyy] = raw.split("-");
    const iso = `${yyyy}-${mm}-${dd}`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return iso;
  }
  return null;
}

function parseOptionalNumber(val: unknown): number | null {
  if (val === undefined || val === null || val === "") return null;
  const n = parseFloat(String(val).replace(/,/g, "").trim());
  return isNaN(n) ? null : n;
}
