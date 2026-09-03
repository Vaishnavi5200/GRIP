/**
 * GigShield Rule Engine
 *
 * Resolves the correct active rule version for a given
 * (stateCode, sector, vehicleType, transactionDate) tuple.
 *
 * Resolution priority (most-specific wins):
 * 1. Exact sector + exact vehicleType match
 * 2. Exact sector + NULL vehicleType (applies to all vehicles in sector)
 * 3. NULL sector + exact vehicleType
 * 4. NULL sector + NULL vehicleType (catch-all for state)
 *
 * A rule is applicable if:
 * - lifecycle_status = 'active'
 * - effectiveFrom <= transactionDate
 * - effectiveTo IS NULL OR effectiveTo >= transactionDate
 *
 * PURE FUNCTION — no DB calls. The caller fetches all active rules
 * for the state and passes them here.
 */

import type { RuleVersionInput } from "./calculation-engine";

export interface ApplicableRuleQuery {
  stateCode: string;
  sector: string;
  vehicleType: string;
  transactionDate: string; // 'YYYY-MM-DD'
}

/**
 * Resolve the most specific applicable rule for a transaction.
 *
 * @param query       - The lookup parameters
 * @param activeRules - All ACTIVE rule versions for the state (pre-fetched from DB)
 * @returns           - The most specific matching rule, or null if none applies
 */
export function resolveApplicableRule(
  query: ApplicableRuleQuery,
  activeRules: RuleVersionInput[]
): RuleVersionInput | null {
  const { stateCode, sector, vehicleType, transactionDate } = query;

  // Filter to rules that are within effective date range
  const effectiveRules = activeRules.filter((rule) =>
    isRuleEffective(rule, transactionDate)
  );

  if (effectiveRules.length === 0) return null;

  // Priority 1: Exact sector + exact vehicle type
  const exactMatch = effectiveRules.find(
    (r) => r.sector === sector && r.vehicleType === vehicleType
  );
  if (exactMatch) return exactMatch;

  // Priority 2: Exact sector + any vehicle type
  const sectorMatch = effectiveRules.find(
    (r) => r.sector === sector && r.vehicleType === null
  );
  if (sectorMatch) return sectorMatch;

  // Priority 3: Any sector + exact vehicle type
  const vehicleMatch = effectiveRules.find(
    (r) => r.sector === null && r.vehicleType === vehicleType
  );
  if (vehicleMatch) return vehicleMatch;

  // Priority 4: Catch-all (both null)
  const catchAll = effectiveRules.find(
    (r) => r.sector === null && r.vehicleType === null
  );
  if (catchAll) return catchAll;

  return null;
}

/**
 * Check if a rule is effective for a given transaction date.
 */
function isRuleEffective(rule: RuleVersionInput, txDate: string): boolean {
  const date = new Date(txDate);
  const from = new Date(rule.effectiveFrom);
  if (date < from) return false;
  if (rule.effectiveTo) {
    const to = new Date(rule.effectiveTo);
    if (date > to) return false;
  }
  return true;
}

/**
 * Build a resolver function that closes over a set of active rules.
 * Used by the calculation engine's calculateBatch().
 *
 * Usage:
 *   const activeRules = await db.query... // fetch all active rules for KA
 *   const resolver = buildRuleResolver(activeRules)
 *   const results = calculateBatch(transactions, resolver)
 */
export function buildRuleResolver(
  activeRules: RuleVersionInput[]
): (input: { stateCode: string; sector: string; vehicleType: string; transactionDate: string }) => RuleVersionInput | null {
  return (input) =>
    resolveApplicableRule(
      {
        stateCode: input.stateCode,
        sector: input.sector,
        vehicleType: input.vehicleType,
        transactionDate: input.transactionDate,
      },
      activeRules
    );
}

/**
 * Validate that there are no conflicting active rules.
 * A conflict = two active rules with same (sector, vehicleType) overlap.
 * This is also enforced by the DB unique index, but the engine can check
 * preemptively before a rule is activated.
 *
 * Returns list of conflict descriptions (empty = no conflicts).
 */
export function detectRuleConflicts(
  rules: Array<{
    versionCode: string;
    sector: string | null;
    vehicleType: string | null;
    effectiveFrom: string;
    effectiveTo: string | null;
  }>
): string[] {
  const conflicts: string[] = [];

  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const a = rules[i];
      const b = rules[j];

      // Same scope?
      if (a.sector !== b.sector || a.vehicleType !== b.vehicleType) continue;

      // Overlapping date ranges?
      const aFrom = new Date(a.effectiveFrom);
      const aTo = a.effectiveTo ? new Date(a.effectiveTo) : null;
      const bFrom = new Date(b.effectiveFrom);
      const bTo = b.effectiveTo ? new Date(b.effectiveTo) : null;

      const overlap =
        (aTo === null || bFrom <= aTo) && (bTo === null || aFrom <= bTo);

      if (overlap) {
        conflicts.push(
          `Rules ${a.versionCode} and ${b.versionCode} conflict: ` +
            `both apply to sector=${a.sector ?? "ALL"}, vehicle=${a.vehicleType ?? "ALL"} ` +
            `with overlapping effective dates`
        );
      }
    }
  }

  return conflicts;
}
