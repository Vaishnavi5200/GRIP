/**
 * GigShield Calculation Engine
 *
 * RULES (non-negotiable):
 * 1. AI MUST NEVER call this function or any function in this file.
 * 2. This is a PURE FUNCTION — no DB calls, no side effects, no external I/O.
 * 3. The output includes a full step-by-step explanation object for every calculation.
 * 4. All monetary values are handled as strings-turned-to-numbers to avoid floating point.
 * 5. Inputs must be pre-validated by the validation engine before reaching here.
 *
 * Architecture: Called by the calculation-run Server Action which:
 *   1. Resolves the applicable rule version from the DB (this engine does NOT do that)
 *   2. Passes it here as a typed RuleVersionInput
 *   3. Stores the output (including calculationDetail) in calculation_line_items
 */

import type { RuleVersion } from "@/lib/db/schema";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CalculationInput {
  transactionId: string;
  workerId?: string | null;
  stateCode: string;
  sector: string;
  vehicleType: string;
  payout: number; // in INR
  transactionDate: string; // ISO date string 'YYYY-MM-DD'
}

export interface RuleVersionInput {
  id: string;
  versionCode: string;
  sector: string | null;
  vehicleType: string | null;
  rateType: "percentage" | "flat";
  rate: string; // numeric from DB — parse to float here
  cap: string | null;
  minimumFee: string | null;
  baseType: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  verificationStatus: string;
  sourceDocumentTitle: string | null;
  sourceGazetteRef: string | null;
}

export interface CalculationStep {
  label: string;
  value: string | number;
  display: string; // human-readable e.g. "₹2.50", "1%", "Yes"
  note?: string;
}

export interface CalculationDetail {
  // Inputs
  jurisdiction: string;
  sector: string;
  vehicleType: string;
  payout: number;
  payoutDisplay: string;

  // Rule applied
  appliedRuleVersionCode: string;
  ruleVerificationStatus: string;
  sourceDocumentTitle: string | null;

  // Calculation steps
  rateType: "percentage" | "flat";
  rate: number;
  rateDisplay: string;
  calculationBase: number;
  calculationBaseDisplay: string;
  baseFee: number;
  baseFeeDisplay: string;
  capApplicable: boolean;
  capAmount: number | null;
  capAmountDisplay: string | null;
  capApplied: boolean; // true if base fee exceeded cap
  minimumFeeApplicable: boolean;
  minimumFeeAmount: number | null;
  minimumApplied: boolean;

  // Outcome
  finalWelfareFee: number;
  finalWelfareFeeDisplay: string;
  isExempt: boolean;
  exemptReason: string | null;

  // Audit
  steps: CalculationStep[];
  engineVersion: "1.0";
}

export interface CalculationResult {
  transactionId: string;
  ruleVersionId: string;
  ruleVersionCode: string;
  stateCode: string;
  sector: string;
  vehicleType: string;
  payout: number;
  rate: number;
  baseFee: number;
  capApplied: boolean;
  capAmount: number | null;
  minimumApplied: boolean;
  welfareFee: number;
  isExempt: boolean;
  exemptReason: string | null;
  calculationDetail: CalculationDetail;
}

export interface ExemptResult {
  transactionId: string;
  ruleVersionId: null;
  ruleVersionCode: null;
  stateCode: string;
  sector: string;
  vehicleType: string;
  payout: number;
  welfareFee: 0;
  isExempt: true;
  exemptReason: string;
  calculationDetail: null;
}

export type SingleCalculationResult = CalculationResult | ExemptResult;

// ─────────────────────────────────────────────────────────────────────────────
// Core calculation function (pure, no DB calls)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the welfare fee for a single transaction.
 *
 * @param input  - The transaction data
 * @param rule   - The applicable rule version (resolved externally by the DB query layer)
 * @returns      - A full CalculationResult with step-by-step explanation
 */
export function calculateWelfareFee(
  input: CalculationInput,
  rule: RuleVersionInput
): CalculationResult {
  const payout = roundToTwoDecimals(input.payout);
  const rate = parseFloat(rule.rate);
  const cap = rule.cap !== null ? parseFloat(rule.cap) : null;
  const minimumFee = rule.minimumFee !== null ? parseFloat(rule.minimumFee) : null;

  // Step 1: Calculate base fee
  let baseFee: number;
  let rateDisplay: string;
  if (rule.rateType === "percentage") {
    baseFee = roundToTwoDecimals(payout * rate);
    rateDisplay = `${(rate * 100).toFixed(2)}%`;
  } else {
    // flat rate
    baseFee = roundToTwoDecimals(rate);
    rateDisplay = `₹${rate.toFixed(2)} (flat)`;
  }

  // Step 2: Apply cap
  let welfareFee = baseFee;
  let capApplied = false;
  if (cap !== null && baseFee > cap) {
    welfareFee = cap;
    capApplied = true;
  }

  // Step 3: Apply minimum fee
  let minimumApplied = false;
  if (minimumFee !== null && welfareFee < minimumFee) {
    welfareFee = minimumFee;
    minimumApplied = true;
  }

  welfareFee = roundToTwoDecimals(welfareFee);

  // Build step-by-step explanation
  const steps: CalculationStep[] = [
    {
      label: "Jurisdiction",
      value: input.stateCode,
      display: getStateName(input.stateCode),
    },
    {
      label: "Sector",
      value: input.sector,
      display: formatSector(input.sector),
    },
    {
      label: "Vehicle Type",
      value: input.vehicleType,
      display: formatVehicleType(input.vehicleType),
    },
    {
      label: "Applicable Rule",
      value: rule.versionCode,
      display: rule.versionCode,
    },
    {
      label: "Rule Source",
      value: rule.verificationStatus,
      display: formatVerificationStatus(rule.verificationStatus),
      note: rule.verificationStatus === "demo"
        ? "Sample schedule — confirm against official gazette"
        : rule.sourceGazetteRef ?? "See source document",
    },
    {
      label: "Platform Payout",
      value: payout,
      display: formatINR(payout),
    },
    {
      label: "Calculation Base",
      value: payout,
      display: `${formatINR(payout)} (${rule.baseType})`,
    },
    {
      label: "Fee Rate",
      value: rate,
      display: rateDisplay,
    },
    {
      label: "Base Fee (before cap)",
      value: baseFee,
      display: formatINR(baseFee),
      note: rule.rateType === "percentage"
        ? `${formatINR(payout)} × ${rateDisplay} = ${formatINR(baseFee)}`
        : `Flat rate applied`,
    },
  ];

  if (cap !== null) {
    steps.push({
      label: "Per-Transaction Cap",
      value: cap,
      display: formatINR(cap),
      note: capApplied
        ? `Base fee ${formatINR(baseFee)} exceeds cap — fee reduced to ${formatINR(cap)}`
        : `Base fee ${formatINR(baseFee)} is within cap — cap not applied`,
    });
  } else {
    steps.push({
      label: "Per-Transaction Cap",
      value: "None",
      display: "No cap",
    });
  }

  if (minimumFee !== null) {
    steps.push({
      label: "Minimum Fee",
      value: minimumFee,
      display: formatINR(minimumFee),
      note: minimumApplied
        ? `Fee raised to minimum of ${formatINR(minimumFee)}`
        : `Minimum not triggered`,
    });
  }

  steps.push({
    label: "Final Welfare Fee",
    value: welfareFee,
    display: formatINR(welfareFee),
    note: capApplied
      ? `Capped at ${formatINR(cap!)}`
      : minimumApplied
      ? `Minimum applied: ${formatINR(minimumFee!)}`
      : `= ${formatINR(baseFee)}`,
  });

  const calculationDetail: CalculationDetail = {
    jurisdiction: input.stateCode,
    sector: input.sector,
    vehicleType: input.vehicleType,
    payout,
    payoutDisplay: formatINR(payout),
    appliedRuleVersionCode: rule.versionCode,
    ruleVerificationStatus: rule.verificationStatus,
    sourceDocumentTitle: rule.sourceDocumentTitle,
    rateType: rule.rateType,
    rate,
    rateDisplay,
    calculationBase: payout,
    calculationBaseDisplay: formatINR(payout),
    baseFee,
    baseFeeDisplay: formatINR(baseFee),
    capApplicable: cap !== null,
    capAmount: cap,
    capAmountDisplay: cap !== null ? formatINR(cap) : null,
    capApplied,
    minimumFeeApplicable: minimumFee !== null,
    minimumFeeAmount: minimumFee,
    minimumApplied,
    finalWelfareFee: welfareFee,
    finalWelfareFeeDisplay: formatINR(welfareFee),
    isExempt: false,
    exemptReason: null,
    steps,
    engineVersion: "1.0",
  };

  return {
    transactionId: input.transactionId,
    ruleVersionId: rule.id,
    ruleVersionCode: rule.versionCode,
    stateCode: input.stateCode,
    sector: input.sector,
    vehicleType: input.vehicleType,
    payout,
    rate,
    baseFee,
    capApplied,
    capAmount: cap,
    minimumApplied,
    welfareFee,
    isExempt: false,
    exemptReason: null,
    calculationDetail,
  };
}

/**
 * Process multiple transactions in a batch.
 * Pure function — no DB calls.
 *
 * @param inputs     - Array of transaction inputs
 * @param resolveRule - Function to resolve the applicable rule for each input
 *                      (injected externally so engine stays pure)
 * @returns           - Batch summary + individual line items
 */
export function calculateBatch(
  inputs: CalculationInput[],
  resolveRule: (input: CalculationInput) => RuleVersionInput | null
): {
  results: SingleCalculationResult[];
  totalTransactions: number;
  validTransactions: number;
  exemptTransactions: number;
  totalPayout: number;
  totalWelfareFee: number;
  ruleVersionsUsed: string[];
} {
  const results: SingleCalculationResult[] = [];
  const ruleVersionsUsed = new Set<string>();
  let exemptCount = 0;
  let totalPayout = 0;
  let totalWelfareFee = 0;

  for (const input of inputs) {
    const rule = resolveRule(input);

    if (!rule) {
      // No applicable rule found — exempt (state not supported / no active rule)
      const exempt: ExemptResult = {
        transactionId: input.transactionId,
        ruleVersionId: null,
        ruleVersionCode: null,
        stateCode: input.stateCode,
        sector: input.sector,
        vehicleType: input.vehicleType,
        payout: input.payout,
        welfareFee: 0,
        isExempt: true,
        exemptReason: `No active rule version for ${input.stateCode}/${input.sector}/${input.vehicleType}`,
        calculationDetail: null,
      };
      results.push(exempt);
      exemptCount++;
      totalPayout += input.payout;
      continue;
    }

    const result = calculateWelfareFee(input, rule);
    results.push(result);
    ruleVersionsUsed.add(rule.versionCode);
    totalPayout += result.payout;
    totalWelfareFee += result.welfareFee;
  }

  return {
    results,
    totalTransactions: inputs.length,
    validTransactions: inputs.length - exemptCount,
    exemptTransactions: exemptCount,
    totalPayout: roundToTwoDecimals(totalPayout),
    totalWelfareFee: roundToTwoDecimals(totalWelfareFee),
    ruleVersionsUsed: Array.from(ruleVersionsUsed),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario Analysis (re-runs real engine under proposed rule parameters)
// NEVER uses multipliers — always re-executes calculateWelfareFee
// ─────────────────────────────────────────────────────────────────────────────

export interface ScenarioParams {
  proposedRate?: number;       // e.g. 0.015 for 1.5%
  proposedCap?: number | null; // e.g. 1.50 or null (remove cap)
  payoutGrowthFactor?: number; // e.g. 1.2 for 20% growth
}

export interface ScenarioResult {
  baselineTotalFee: number;
  proposedTotalFee: number;
  feeDifference: number;
  feeChangePercent: number;
  baselineRuleCode: string;
  assumptions: string[];
  capImpactNote: string | null;
  transactionCount: number;
}

export function runScenario(
  inputs: CalculationInput[],
  baselineRule: RuleVersionInput,
  scenarioParams: ScenarioParams,
  resolveBaselineRule: (input: CalculationInput) => RuleVersionInput | null
): ScenarioResult {
  // Baseline: run with current rules
  const baseline = calculateBatch(inputs, resolveBaselineRule);

  // Proposed rule: clone and override
  const proposedRule: RuleVersionInput = {
    ...baselineRule,
    rate: String(scenarioParams.proposedRate ?? parseFloat(baselineRule.rate)),
    cap:
      scenarioParams.proposedCap !== undefined
        ? scenarioParams.proposedCap !== null
          ? String(scenarioParams.proposedCap)
          : null
        : baselineRule.cap,
  };

  // Apply payout growth if specified
  const adjustedInputs = scenarioParams.payoutGrowthFactor
    ? inputs.map((t) => ({
        ...t,
        payout: roundToTwoDecimals(
          t.payout * (scenarioParams.payoutGrowthFactor ?? 1)
        ),
      }))
    : inputs;

  const proposed = calculateBatch(
    adjustedInputs,
    () => proposedRule // same rule for all in scenario
  );

  const assumptions: string[] = [];
  if (scenarioParams.proposedRate !== undefined) {
    assumptions.push(
      `Rate changed from ${(parseFloat(baselineRule.rate) * 100).toFixed(2)}% to ${(scenarioParams.proposedRate * 100).toFixed(2)}%`
    );
  }
  if (scenarioParams.proposedCap !== undefined) {
    if (scenarioParams.proposedCap === null) {
      assumptions.push(`Cap removed (was ${formatINR(parseFloat(baselineRule.cap ?? "0"))})`);
    } else {
      assumptions.push(
        `Cap changed from ${formatINR(parseFloat(baselineRule.cap ?? "0"))} to ${formatINR(scenarioParams.proposedCap)}`
      );
    }
  }
  if (scenarioParams.payoutGrowthFactor && scenarioParams.payoutGrowthFactor !== 1) {
    assumptions.push(
      `Payout volume increased by ${((scenarioParams.payoutGrowthFactor - 1) * 100).toFixed(0)}%`
    );
  }

  // Cap impact note: did cap absorb most of the rate increase?
  let capImpactNote: string | null = null;
  if (
    proposedRule.cap !== null &&
    scenarioParams.proposedRate !== undefined &&
    scenarioParams.proposedRate > parseFloat(baselineRule.rate)
  ) {
    const capValue = parseFloat(proposedRule.cap);
    const avgPayout =
      inputs.reduce((sum, t) => sum + t.payout, 0) / inputs.length;
    const uncappedFeeAtNewRate = avgPayout * scenarioParams.proposedRate;
    if (uncappedFeeAtNewRate > capValue) {
      capImpactNote = `Note: For average payout of ${formatINR(avgPayout)}, the new rate would produce ${formatINR(uncappedFeeAtNewRate)} per transaction, but the cap of ${formatINR(capValue)} limits the actual fee. The cap significantly absorbs the rate increase.`;
    }
  }

  const feeDiff = roundToTwoDecimals(
    proposed.totalWelfareFee - baseline.totalWelfareFee
  );
  const changePercent =
    baseline.totalWelfareFee > 0
      ? roundToTwoDecimals((feeDiff / baseline.totalWelfareFee) * 100)
      : 0;

  return {
    baselineTotalFee: baseline.totalWelfareFee,
    proposedTotalFee: proposed.totalWelfareFee,
    feeDifference: feeDiff,
    feeChangePercent: changePercent,
    baselineRuleCode: baselineRule.versionCode,
    assumptions,
    capImpactNote,
    transactionCount: inputs.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility functions
// ─────────────────────────────────────────────────────────────────────────────

function roundToTwoDecimals(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getStateName(code: string): string {
  const states: Record<string, string> = {
    KA: "Karnataka",
    RJ: "Rajasthan",
    TG: "Telangana",
    JH: "Jharkhand",
    MH: "Maharashtra",
  };
  return states[code] ?? code;
}

function formatSector(sector: string): string {
  const map: Record<string, string> = {
    "ride-hailing": "Ride Hailing",
    logistics: "Logistics",
    "food-delivery": "Food Delivery",
    ecommerce: "E-Commerce Delivery",
  };
  return map[sector] ?? sector;
}

function formatVehicleType(vt: string): string {
  const map: Record<string, string> = {
    "2W": "Two-Wheeler",
    "4W": "Four-Wheeler",
    LCV: "Light Commercial Vehicle",
    HCV: "Heavy Commercial Vehicle",
    bicycle: "Bicycle",
  };
  return map[vt] ?? vt;
}

function formatVerificationStatus(status: string): string {
  const map: Record<string, string> = {
    verified: "🟢 Verified",
    demo: "⚪ Sample Schedule",
    pending_verification: "🔵 Pending Verification",
    proposed: "🟠 AI Proposed",
    superseded: "⚫ Superseded",
  };
  return map[status] ?? status;
}
