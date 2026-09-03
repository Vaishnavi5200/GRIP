/**
 * GigShield Reconciliation Engine
 *
 * Compares platform transaction/payout data against finance ledger data.
 * Produces a 4-column comparison for each transaction:
 *   Platform Payout | Ledger Payout | Expected Fee | Recorded Fee
 *
 * 7 mismatch classifications:
 * - matched
 * - payout_mismatch
 * - fee_mismatch
 * - full_mismatch
 * - missing_from_ledger
 * - unexpected_in_ledger
 * - duplicate_in_ledger
 *
 * PURE FUNCTION — no DB calls.
 */

import type { CalculationResult } from "./calculation-engine";

export type ReconStatus =
  | "matched"
  | "payout_mismatch"
  | "fee_mismatch"
  | "full_mismatch"
  | "missing_from_ledger"
  | "unexpected_in_ledger"
  | "duplicate_in_ledger";

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface LedgerRecord {
  transactionId: string;
  recordedPayout: number | null;
  recordedFee: number | null;
  isDuplicate?: boolean;
}

export interface ReconciliationItem {
  transactionId: string;

  // 4-column evidence
  platformPayout: number | null;      // from platform transaction CSV
  ledgerPayout: number | null;        // from finance ledger CSV
  expectedFee: number | null;         // calculated by engine
  recordedFee: number | null;         // from finance ledger CSV

  // Differences
  payoutDiff: number | null;
  feeDiff: number | null;

  // Classification
  status: ReconStatus;
  severity: Severity;

  // Rule version used (for explainability)
  ruleVersionCode: string | null;

  // Human-readable explanation of why this is a mismatch
  explanation: string;
}

export interface ReconciliationSummary {
  totalRecords: number;
  matchedCount: number;
  payoutMismatchCount: number;
  feeMismatchCount: number;
  fullMismatchCount: number;
  missingFromLedgerCount: number;
  unexpectedInLedgerCount: number;
  duplicateInLedgerCount: number;
  matchRate: number; // 0-100
  totalFeeGap: number;
  items: ReconciliationItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Tolerances (to handle floating point rounding in CSV exports)
// ─────────────────────────────────────────────────────────────────────────────
const PAYOUT_TOLERANCE = 0.01; // ₹0.01
const FEE_TOLERANCE = 0.01;    // ₹0.01

// ─────────────────────────────────────────────────────────────────────────────
// Main reconciliation function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reconcile platform calculation results against finance ledger records.
 *
 * @param calculatedItems  - Output from calculation engine (platform side)
 * @param ledgerRecords    - Records from finance ledger CSV (finance side)
 */
export function reconcile(
  calculatedItems: Array<{
    transactionId: string;
    platformPayout: number;
    expectedFee: number;
    ruleVersionCode: string | null;
  }>,
  ledgerRecords: LedgerRecord[]
): ReconciliationSummary {
  const items: ReconciliationItem[] = [];

  // Index ledger records by transaction_id
  const ledgerMap = new Map<string, LedgerRecord[]>();
  for (const lr of ledgerRecords) {
    const existing = ledgerMap.get(lr.transactionId) ?? [];
    existing.push(lr);
    ledgerMap.set(lr.transactionId, existing);
  }

  // Track which ledger records were matched
  const matchedLedgerIds = new Set<string>();

  // --- Pass 1: Process all platform records ---
  for (const calc of calculatedItems) {
    const ledgerMatches = ledgerMap.get(calc.transactionId) ?? [];

    if (ledgerMatches.length === 0) {
      // Missing from ledger
      items.push({
        transactionId: calc.transactionId,
        platformPayout: calc.platformPayout,
        ledgerPayout: null,
        expectedFee: calc.expectedFee,
        recordedFee: null,
        payoutDiff: null,
        feeDiff: null,
        status: "missing_from_ledger",
        severity: "high",
        ruleVersionCode: calc.ruleVersionCode,
        explanation: `Transaction ${calc.transactionId} is in platform data but not in the finance ledger. Expected fee: ₹${calc.expectedFee.toFixed(2)}`,
      });
      continue;
    }

    if (ledgerMatches.length > 1) {
      // Duplicate in ledger — classify all as duplicates
      for (const lr of ledgerMatches) {
        matchedLedgerIds.add(lr.transactionId + "_" + ledgerRecords.indexOf(lr));
        const feeDiff = diffOrNull(calc.expectedFee, lr.recordedFee);
        items.push({
          transactionId: calc.transactionId,
          platformPayout: calc.platformPayout,
          ledgerPayout: lr.recordedPayout,
          expectedFee: calc.expectedFee,
          recordedFee: lr.recordedFee,
          payoutDiff: diffOrNull(calc.platformPayout, lr.recordedPayout),
          feeDiff,
          status: "duplicate_in_ledger",
          severity: "medium",
          ruleVersionCode: calc.ruleVersionCode,
          explanation: `Transaction ${calc.transactionId} has ${ledgerMatches.length} entries in the ledger. Review to confirm if these are legitimate repeated transactions or duplicate entries.`,
        });
      }
      continue;
    }

    // Single ledger match
    const lr = ledgerMatches[0];
    matchedLedgerIds.add(calc.transactionId);

    const payoutDiff = diffOrNull(calc.platformPayout, lr.recordedPayout);
    const feeDiff = diffOrNull(calc.expectedFee, lr.recordedFee);

    const payoutMismatch =
      payoutDiff !== null && Math.abs(payoutDiff) > PAYOUT_TOLERANCE;
    const feeMismatch =
      feeDiff !== null && Math.abs(feeDiff) > FEE_TOLERANCE;

    let status: ReconStatus;
    let severity: Severity;
    let explanation: string;

    if (!payoutMismatch && !feeMismatch) {
      status = "matched";
      severity = "info";
      explanation = `All values match. Platform payout ₹${calc.platformPayout.toFixed(2)}, expected fee ₹${calc.expectedFee.toFixed(2)}, both confirmed in ledger.`;
    } else if (payoutMismatch && feeMismatch) {
      status = "full_mismatch";
      severity = "critical";
      explanation = `Both payout and fee differ. Platform: ₹${calc.platformPayout.toFixed(2)}, Ledger: ₹${(lr.recordedPayout ?? 0).toFixed(2)} (diff: ₹${Math.abs(payoutDiff!).toFixed(2)}). Expected fee: ₹${calc.expectedFee.toFixed(2)}, Recorded: ₹${(lr.recordedFee ?? 0).toFixed(2)} (diff: ₹${Math.abs(feeDiff!).toFixed(2)}).`;
    } else if (payoutMismatch) {
      status = "payout_mismatch";
      severity = "high";
      explanation = `Payout differs by ₹${Math.abs(payoutDiff!).toFixed(2)}. Platform: ₹${calc.platformPayout.toFixed(2)}, Ledger: ₹${(lr.recordedPayout ?? 0).toFixed(2)}. Fee may also be impacted.`;
    } else {
      status = "fee_mismatch";
      severity = "medium";
      explanation = `Fee differs by ₹${Math.abs(feeDiff!).toFixed(2)}. Expected: ₹${calc.expectedFee.toFixed(2)}, Recorded in ledger: ₹${(lr.recordedFee ?? 0).toFixed(2)}. Payout matches.`;
    }

    items.push({
      transactionId: calc.transactionId,
      platformPayout: calc.platformPayout,
      ledgerPayout: lr.recordedPayout,
      expectedFee: calc.expectedFee,
      recordedFee: lr.recordedFee,
      payoutDiff,
      feeDiff,
      status,
      severity,
      ruleVersionCode: calc.ruleVersionCode,
      explanation,
    });
  }

  // --- Pass 2: Find unexpected ledger records (in ledger but not in platform) ---
  for (const lr of ledgerRecords) {
    if (!matchedLedgerIds.has(lr.transactionId)) {
      // Check if this transaction was in platform data at all
      const inPlatform = calculatedItems.some(
        (c) => c.transactionId === lr.transactionId
      );
      if (!inPlatform) {
        items.push({
          transactionId: lr.transactionId,
          platformPayout: null,
          ledgerPayout: lr.recordedPayout,
          expectedFee: null,
          recordedFee: lr.recordedFee,
          payoutDiff: null,
          feeDiff: null,
          status: "unexpected_in_ledger",
          severity: "high",
          ruleVersionCode: null,
          explanation: `Transaction ${lr.transactionId} appears in the finance ledger but is not in the platform transaction data for this period.`,
        });
      }
    }
  }

  // ─── Summary counts ───
  const matched = items.filter((i) => i.status === "matched").length;
  const payoutMismatch = items.filter((i) => i.status === "payout_mismatch").length;
  const feeMismatch = items.filter((i) => i.status === "fee_mismatch").length;
  const fullMismatch = items.filter((i) => i.status === "full_mismatch").length;
  const missingFromLedger = items.filter((i) => i.status === "missing_from_ledger").length;
  const unexpectedInLedger = items.filter((i) => i.status === "unexpected_in_ledger").length;
  const duplicateInLedger = items.filter((i) => i.status === "duplicate_in_ledger").length;

  const totalRecords = items.length;
  const matchRate = totalRecords > 0 ? Math.round((matched / totalRecords) * 100) : 100;

  const totalFeeGap = items.reduce((sum, item) => {
    if (item.status === "matched") return sum;
    if (item.feeDiff !== null) return sum + Math.abs(item.feeDiff);
    if (item.status === "missing_from_ledger" && item.expectedFee !== null)
      return sum + item.expectedFee;
    return sum;
  }, 0);

  return {
    totalRecords,
    matchedCount: matched,
    payoutMismatchCount: payoutMismatch,
    feeMismatchCount: feeMismatch,
    fullMismatchCount: fullMismatch,
    missingFromLedgerCount: missingFromLedger,
    unexpectedInLedgerCount: unexpectedInLedger,
    duplicateInLedgerCount: duplicateInLedger,
    matchRate,
    totalFeeGap: Math.round(totalFeeGap * 100) / 100,
    items,
  };
}

function diffOrNull(a: number | null | undefined, b: number | null | undefined): number | null {
  if (a === null || a === undefined || b === null || b === undefined) return null;
  return Math.round((a - b) * 100) / 100;
}
