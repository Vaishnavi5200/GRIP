/**
 * GigShield Risk Engine
 *
 * Computes the "Compliance Health Score" — an internal operational risk indicator.
 * This is NOT a government compliance score. It is NOT a legal guarantee.
 *
 * Architecture:
 * - Applicability-aware: components that don't apply (e.g., no ledger data uploaded yet)
 *   are excluded from normalization. N/A ≠ 0.
 * - All inputs come from the DB/other engines — the score is always derived from real data.
 * - Every component has: score, weight, applicable, reason, improvementAction, potentialImpact
 * - Formula version is stored with every score snapshot for reproducibility.
 *
 * PURE FUNCTION — caller fetches all required data and passes it here.
 * Result is persisted to compliance_scores table as a snapshot.
 */

export interface RiskInput {
  // Transaction data quality
  totalTransactions: number;
  validTransactions: number;
  invalidTransactions: number;

  // Calculation completeness
  transactionsWithCalculation: number;
  lastCalculationRunAt: Date | null;
  daysSinceLastCalculation: number | null;

  // Reconciliation health
  hasLedgerData: boolean;
  totalReconItems: number;
  resolvedReconItems: number;
  unresolvedCriticalItems: number;
  unresolvedHighItems: number;
  matchRate: number | null; // 0-100, null if no recon run

  // Deadline compliance
  totalDeadlines: number;
  overdueDeadlines: number;
  upcomingUrgentDeadlines: number;

  // Action resolution
  totalActions: number;
  resolvedActions: number;
  overdueActions: number;

  // Registration/reporting compliance
  isRegistered: boolean;
  hasSubmittedReport: boolean;
  lastReportSubmittedAt: Date | null;
}

export interface RiskComponent {
  name: string;
  score: number;        // 0-100 for this component
  weight: number;       // 0-1, sum of applicable weights must = 1 after normalization
  applicable: boolean;  // N/A ≠ 0. If false, excluded from total normalization
  reason: string;       // why this score
  improvementAction: string;
  potentialImpact: number; // how many points this could add to total if maxed
}

export interface ComplianceHealthScore {
  total: number;           // 0-100, derived from applicable components only
  components: RiskComponent[];
  formulaVersion: "2.0";
  applicableComponentCount: number;
  totalApplicableWeight: number;
  interpretation: "excellent" | "good" | "needs_attention" | "at_risk" | "critical";
  // Top 3 actions to improve score most
  topImprovementActions: Array<{
    action: string;
    potentialGain: number;
    priority: "critical" | "high" | "medium";
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component weights (sum = 1.0 when all are applicable)
// These MUST be documented and versioned. Change = new formula version.
// ─────────────────────────────────────────────────────────────────────────────
const COMPONENT_WEIGHTS = {
  data_quality: 0.20,
  calculation_completeness: 0.20,
  reconciliation_health: 0.25,
  deadline_compliance: 0.15,
  action_resolution: 0.10,
  registration_compliance: 0.10,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Main score computation
// ─────────────────────────────────────────────────────────────────────────────

export function computeComplianceHealthScore(input: RiskInput): ComplianceHealthScore {
  const components: RiskComponent[] = [];

  // ── Component 1: Data Quality (20%)
  const dataQualityApplicable = input.totalTransactions > 0;
  let dataQualityScore = 0;
  let dataQualityReason = "No transactions uploaded yet";
  let dataQualityAction = "Upload your transaction CSV to begin compliance monitoring";

  if (dataQualityApplicable) {
    const validRate = input.validTransactions / input.totalTransactions;
    dataQualityScore = Math.round(validRate * 100);
    const errorPct = (input.invalidTransactions / input.totalTransactions * 100).toFixed(1);
    dataQualityReason = dataQualityScore >= 95
      ? `Excellent data quality: ${dataQualityScore}% valid transactions`
      : `${errorPct}% of transactions have validation errors (${input.invalidTransactions} records)`;
    dataQualityAction = dataQualityScore >= 95
      ? "Maintain data validation at source"
      : `Fix ${input.invalidTransactions} invalid transaction records — run validation report`;
  }

  components.push({
    name: "Data Quality",
    score: dataQualityScore,
    weight: COMPONENT_WEIGHTS.data_quality,
    applicable: dataQualityApplicable,
    reason: dataQualityReason,
    improvementAction: dataQualityAction,
    potentialImpact: 0, // calculated below
  });

  // ── Component 2: Calculation Completeness (20%)
  const calcApplicable = input.totalTransactions > 0;
  let calcScore = 0;
  let calcReason = "No transactions to calculate";
  let calcAction = "Upload transaction data and run a calculation";

  if (calcApplicable) {
    const calcRate = input.transactionsWithCalculation / input.validTransactions || 0;
    calcScore = Math.round(calcRate * 100);

    if (input.daysSinceLastCalculation !== null && input.daysSinceLastCalculation > 30) {
      calcScore = Math.max(0, calcScore - 20); // penalize stale calculations
    }

    calcReason = calcScore >= 90
      ? `${input.transactionsWithCalculation} transactions calculated`
      : `${input.validTransactions - input.transactionsWithCalculation} valid transactions not yet calculated`;

    calcAction = calcScore >= 90
      ? "Keep calculations up to date each quarter"
      : "Run calculation on all valid transactions";
  }

  components.push({
    name: "Calculation Completeness",
    score: calcScore,
    weight: COMPONENT_WEIGHTS.calculation_completeness,
    applicable: calcApplicable,
    reason: calcReason,
    improvementAction: calcAction,
    potentialImpact: 0,
  });

  // ── Component 3: Reconciliation Health (25%)
  // N/A if no ledger data has been uploaded
  let reconScore = 0;
  let reconReason = "No finance ledger data uploaded";
  let reconAction = "Upload finance ledger CSV to enable reconciliation";

  if (input.hasLedgerData && input.totalReconItems > 0) {
    const baseScore = input.matchRate ?? 0;
    // Penalize heavily for critical/high unresolved items
    const criticalPenalty = Math.min(30, input.unresolvedCriticalItems * 10);
    const highPenalty = Math.min(15, input.unresolvedHighItems * 3);
    reconScore = Math.max(0, Math.round(baseScore - criticalPenalty - highPenalty));

    reconReason = reconScore >= 90
      ? `Strong reconciliation: ${input.matchRate?.toFixed(1)}% match rate, ${input.resolvedReconItems} issues resolved`
      : `${input.unresolvedCriticalItems} critical and ${input.unresolvedHighItems} high-severity mismatches unresolved`;

    reconAction = reconScore >= 90
      ? "Maintain regular reconciliation cadence"
      : `Resolve ${input.unresolvedCriticalItems + input.unresolvedHighItems} unresolved critical/high issues`;
  }

  components.push({
    name: "Reconciliation Health",
    score: reconScore,
    weight: COMPONENT_WEIGHTS.reconciliation_health,
    applicable: input.hasLedgerData,
    reason: reconReason,
    improvementAction: reconAction,
    potentialImpact: 0,
  });

  // ── Component 4: Deadline Compliance (15%)
  const deadlineApplicable = input.totalDeadlines > 0;
  let deadlineScore = 100;
  let deadlineReason = "No active regulatory deadlines";
  let deadlineAction = "No immediate action required";

  if (deadlineApplicable) {
    const overdueRate = input.overdueDeadlines / input.totalDeadlines;
    const urgentRate = input.upcomingUrgentDeadlines / input.totalDeadlines;
    deadlineScore = Math.round(100 - (overdueRate * 60) - (urgentRate * 20));
    deadlineScore = Math.max(0, deadlineScore);

    deadlineReason = input.overdueDeadlines > 0
      ? `${input.overdueDeadlines} overdue deadline(s) — immediate attention required`
      : input.upcomingUrgentDeadlines > 0
      ? `${input.upcomingUrgentDeadlines} deadline(s) due within 7 days`
      : "All deadlines on track";

    deadlineAction = input.overdueDeadlines > 0
      ? `Address ${input.overdueDeadlines} overdue compliance deadline(s) immediately`
      : `Prepare for ${input.upcomingUrgentDeadlines} upcoming deadline(s)`;
  }

  components.push({
    name: "Deadline Compliance",
    score: deadlineScore,
    weight: COMPONENT_WEIGHTS.deadline_compliance,
    applicable: deadlineApplicable,
    reason: deadlineReason,
    improvementAction: deadlineAction,
    potentialImpact: 0,
  });

  // ── Component 5: Action Resolution (10%)
  const actionsApplicable = input.totalActions > 0;
  let actionsScore = 100;
  let actionsReason = "No open compliance actions";
  let actionsAction = "No action required";

  if (actionsApplicable) {
    const resolvedRate = input.resolvedActions / input.totalActions;
    const overduePenalty = Math.min(30, input.overdueActions * 10);
    actionsScore = Math.max(0, Math.round(resolvedRate * 100 - overduePenalty));

    actionsReason = actionsScore >= 80
      ? `${input.resolvedActions}/${input.totalActions} actions resolved`
      : `${input.overdueActions} overdue action(s) pending`;

    actionsAction = input.overdueActions > 0
      ? `Address ${input.overdueActions} overdue compliance action(s)`
      : `Complete ${input.totalActions - input.resolvedActions} pending action(s)`;
  }

  components.push({
    name: "Action Resolution",
    score: actionsScore,
    weight: COMPONENT_WEIGHTS.action_resolution,
    applicable: actionsApplicable,
    reason: actionsReason,
    improvementAction: actionsAction,
    potentialImpact: 0,
  });

  // ── Component 6: Registration & Reporting (10%)
  const registrationScore = input.isRegistered && input.hasSubmittedReport
    ? 100
    : input.isRegistered
    ? 60
    : 0;

  const registrationReason = !input.isRegistered
    ? "Platform not registered under Karnataka Gig Workers Welfare Board"
    : !input.hasSubmittedReport
    ? "Registered but no compliance report submitted"
    : "Registered and quarterly report submitted";

  const registrationAction = !input.isRegistered
    ? "Complete platform registration under Karnataka 2025 Act"
    : !input.hasSubmittedReport
    ? "Generate and submit quarterly compliance report"
    : "Maintain reporting cadence";

  components.push({
    name: "Registration & Reporting",
    score: registrationScore,
    weight: COMPONENT_WEIGHTS.registration_compliance,
    applicable: true, // always applicable
    reason: registrationReason,
    improvementAction: registrationAction,
    potentialImpact: 0,
  });

  // ─────────────────────────────────────────────────────────────────────
  // Applicability-aware normalization
  // N/A components are EXCLUDED — they do not drag the score down.
  // Only applicable component weights are re-normalized to sum to 1.
  // ─────────────────────────────────────────────────────────────────────
  const applicableComponents = components.filter((c) => c.applicable);
  const totalApplicableWeight = applicableComponents.reduce((sum, c) => sum + c.weight, 0);

  let total = 0;
  if (applicableComponents.length > 0 && totalApplicableWeight > 0) {
    total = applicableComponents.reduce((sum, c) => {
      const normalizedWeight = c.weight / totalApplicableWeight;
      return sum + c.score * normalizedWeight;
    }, 0);
    total = Math.round(total);
  }

  // Calculate potential impact for each component
  for (const component of components) {
    if (!component.applicable) {
      component.potentialImpact = 0;
      continue;
    }
    const normalizedWeight = component.weight / totalApplicableWeight;
    const gapPoints = (100 - component.score) * normalizedWeight;
    component.potentialImpact = Math.round(gapPoints);
  }

  // Top improvement actions (by potential impact, applicable only)
  const topActions = applicableComponents
    .filter((c) => c.potentialImpact > 0)
    .sort((a, b) => b.potentialImpact - a.potentialImpact)
    .slice(0, 3)
    .map((c) => ({
      action: c.improvementAction,
      potentialGain: c.potentialImpact,
      priority: (c.potentialImpact >= 15 ? "critical" : c.potentialImpact >= 8 ? "high" : "medium") as
        | "critical"
        | "high"
        | "medium",
    }));

  const interpretation =
    total >= 90 ? "excellent" :
    total >= 75 ? "good" :
    total >= 60 ? "needs_attention" :
    total >= 40 ? "at_risk" :
    "critical";

  return {
    total,
    components,
    formulaVersion: "2.0",
    applicableComponentCount: applicableComponents.length,
    totalApplicableWeight,
    interpretation,
    topImprovementActions: topActions,
  };
}
