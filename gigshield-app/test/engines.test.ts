/**
 * Engine Verification Suite
 * Validates the core deterministic calculations, rule resolutions,
 * reconciliations, and health score normalization.
 */

import { calculateWelfareFee, formatINR } from "../src/lib/engines/calculation-engine";
import { resolveApplicableRule } from "../src/lib/engines/rule-engine";
import { reconcile } from "../src/lib/engines/reconciliation-engine";
import { computeComplianceHealthScore } from "../src/lib/engines/risk-engine";
import { validateTransactionRows } from "../src/lib/engines/validation-engine";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log("\n================ GIGSHIELD ENGINE VERIFICATION ================\n");

// 1. Karnataka 2W Cap Test (1.0%, Cap ₹0.50)
const rule2W = {
  id: "rv-2w",
  versionCode: "KA-2025-02-RH-2W",
  sector: "ride-hailing",
  vehicleType: "2W",
  rateType: "percentage" as const,
  rate: "0.0100",
  cap: "0.50",
  minimumFee: null,
  baseType: "payout",
  effectiveFrom: "2026-02-16",
  effectiveTo: null,
  verificationStatus: "verified",
  sourceDocumentTitle: "Karnataka Platform Based Gig Workers Welfare Rules, 2025",
  sourceGazetteRef: "KAG-2025-NOTIF-02",
};

const calc2W = calculateWelfareFee(
  {
    transactionId: "TXN-TEST-1",
    stateCode: "KA",
    sector: "ride-hailing",
    vehicleType: "2W",
    payout: 250, // 1% = ₹2.50, but cap = ₹0.50
    transactionDate: "2026-08-20",
  },
  rule2W
);

assert(calc2W.welfareFee === 0.5, `Expected fee ₹0.50 on ₹250 payout under 2W cap, got ₹${calc2W.welfareFee}`);
assert(calc2W.capApplied === true, "Cap should be marked as applied");
assert(calc2W.baseFee === 2.5, "Base fee should be ₹2.50 before cap");

// 2. Karnataka 4W Cap Test (1.0%, Cap ₹1.00)
const rule4W = {
  ...rule2W,
  id: "rv-4w",
  versionCode: "KA-2025-02-RH-4W",
  vehicleType: "4W",
  cap: "1.00",
};

const calc4W = calculateWelfareFee(
  {
    transactionId: "TXN-TEST-2",
    stateCode: "KA",
    sector: "ride-hailing",
    vehicleType: "4W",
    payout: 400, // 1% = ₹4.00, cap = ₹1.00
    transactionDate: "2026-08-20",
  },
  rule4W
);

assert(calc4W.welfareFee === 1.0, `Expected fee ₹1.00 on ₹400 payout under 4W cap, got ₹${calc4W.welfareFee}`);
assert(calc4W.capApplied === true, "4W Cap should be marked as applied");

// 3. Rule Engine Priority (Exact sector+vehicle wins over catch-all)
const defaultRule = {
  ...rule2W,
  id: "rv-def",
  versionCode: "KA-2026-02-DEFAULT",
  sector: null,
  vehicleType: null,
  cap: "5.00",
};

const resolved = resolveApplicableRule(
  {
    stateCode: "KA",
    sector: "ride-hailing",
    vehicleType: "2W",
    transactionDate: "2026-08-20",
  },
  [defaultRule, rule2W, rule4W]
);

assert(resolved?.versionCode === "KA-2025-02-RH-2W", `Expected KA-2025-02-RH-2W, resolved ${resolved?.versionCode}`);

// 4. Reconciliation 4-Column Check
const reconRes = reconcile(
  [
    { transactionId: "T1", platformPayout: 200, expectedFee: 1.0, ruleVersionCode: "KA-2W" },
    { transactionId: "T2", platformPayout: 300, expectedFee: 2.0, ruleVersionCode: "KA-4W" },
  ],
  [
    { transactionId: "T1", recordedPayout: 200, recordedFee: 1.0 },
    { transactionId: "T2", recordedPayout: 300, recordedFee: 3.0 }, // fee mismatch!
  ]
);

assert(reconRes.matchedCount === 1, `Expected 1 match, got ${reconRes.matchedCount}`);
assert(reconRes.feeMismatchCount === 1, `Expected 1 fee mismatch, got ${reconRes.feeMismatchCount}`);
assert(reconRes.totalFeeGap === 1.0, `Expected ₹1.00 fee gap, got ₹${reconRes.totalFeeGap}`);

// 5. Risk Score Applicability Normalization (N/A ≠ 0)
const riskScore = computeComplianceHealthScore({
  totalTransactions: 5000,
  validTransactions: 5000,
  invalidTransactions: 0,
  transactionsWithCalculation: 5000,
  lastCalculationRunAt: new Date(),
  daysSinceLastCalculation: 0,
  hasLedgerData: false, // Reconciliation is N/A! Should NOT drag score to 0!
  totalReconItems: 0,
  resolvedReconItems: 0,
  unresolvedCriticalItems: 0,
  unresolvedHighItems: 0,
  matchRate: null,
  totalDeadlines: 0, // N/A
  overdueDeadlines: 0,
  upcomingUrgentDeadlines: 0,
  totalActions: 0, // N/A
  resolvedActions: 0,
  overdueActions: 0,
  isRegistered: true,
  hasSubmittedReport: true,
  lastReportSubmittedAt: new Date(),
});

assert(riskScore.total === 100, `Expected 100 with applicable components 100% healthy, got ${riskScore.total}`);
assert(riskScore.applicableComponentCount === 3, `Expected 3 applicable components, got ${riskScore.applicableComponentCount}`);

console.log("\n================ ALL ENGINE TESTS PASSED SUCCESSFULLY ================\n");
