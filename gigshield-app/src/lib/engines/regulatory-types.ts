/**
 * GigShield Regulatory Intelligence & Provenance Types
 *
 * Grounded in the Karnataka Platform Based Gig Workers
 * (Social Security and Welfare) Act, 2025 (Act 72 of 2025)
 * and Karnataka Rules, 2025.
 *
 * IMPORTANT TERMINOLOGY:
 * - LegalOperationalState: GigShield's normalized prototype classification of how a rule
 *   is treated for compliance calculation purposes. AI PROPOSES; human VERIFIES.
 *   GigShield does NOT establish legal truth.
 * - LifecycleStatus: Internal product state (draft→approved→active→superseded).
 *   Controlled exclusively by human approval actions within GigShield.
 */

// ── Legal-Operational State ────────────────────────────────────────────────────
// Normalized prototype classification — NOT a legal determination.
// AI proposes; compliance officer verifies before it governs any calculation.
export type LegalOperationalState =
  | "ACTIVE"               // Interpreted as operative; calculation proceeds normally
  | "UNDER_CHALLENGE"      // Legal challenge noted; calculation continues; flagged for monitoring
  | "UNDER_INTERIM_ORDER"  // Judicial direction modifies enforcement mechanism; flagged
  | "STAYED"               // Enforcement interpreted as paused; calculation flagged, not committed
  | "SUPERSEDED"           // Replaced by a newer active rule version
  | "EXPIRED"              // No longer in effect; no successor identified yet
  | "REQUIRES_REVIEW";     // AI or system flagged — needs human review before any action

// Keep LegalStatus as an alias for backward compatibility with existing code
export type LegalStatus = LegalOperationalState;

export type LifecycleStatus = "draft" | "approved" | "active" | "superseded";

export type SourceDocumentType =
  | "ACT"
  | "RULE"
  | "NOTIFICATION"
  | "GOVERNMENT_ORDER"
  | "COURT_ORDER";

export type AIConfidence = "HIGH" | "MEDIUM" | "LOW";

// ── Evidence Citation ──────────────────────────────────────────────────────────
export interface EvidenceCitation {
  sourceDocumentId: string;
  sourceTitle: string;
  sourceType: SourceDocumentType;
  pageNumber?: number;
  section?: string;
  clause?: string;
  quotedExcerpt?: string;
  sourceUrl?: string;
}

// ── AI Confidence Rationale ────────────────────────────────────────────────────
// Interpretability signal — NOT a statistical probability.
// HIGH = all fields extracted + direct citation + no unresolved ambiguities
// MEDIUM = all fields extracted, but indirect citation OR ambiguity flagged
// LOW = one or more required fields missing OR instrument type unclear
export interface AIConfidenceRationale {
  level: AIConfidence;
  allRequiredFieldsExtracted: boolean;
  directEvidenceCitationFound: boolean;
  unresolvedAmbiguityCount: number;
  notes?: string;
}

// ── Regulatory Event ──────────────────────────────────────────────────────────
// The raw occurrence: gazette published, court order issued, etc.
// A court order may not create a new fee rule — it may only modify enforcement.
export type RegulatoryEffectType =
  | "rate_change"              // Changes welfare fee rate / cap
  | "enforcement_modification" // Changes HOW fee is collected (e.g. escrow)
  | "payment_route_change"     // Changes WHERE fee is remitted
  | "scope_change"             // Changes WHICH transactions are covered
  | "concession"               // Reduces fee obligation for qualifying transactions
  | "procedural";              // Filing / reporting requirement changes only

export interface SyntheticScenarioLabel {
  purpose: string;       // What this scenario demonstrates
  realLegalBasis: string; // The actual Act/Rule/Section it is based on
}

export interface RegulatoryEvent {
  id: string;
  eventType:
    | "gazette_notification"
    | "court_order"
    | "government_order"
    | "bill_tabled"
    | "committee_report";
  title: string;
  jurisdiction: string;
  isSyntheticScenario: boolean;
  syntheticScenarioLabel?: SyntheticScenarioLabel;
  sourceDocumentId: string;
  sourceUrl?: string;
  dateOfEffect: string;
  effectType: RegulatoryEffectType;
  // AI proposes; human verifies
  aiProposedState: LegalOperationalState;
  verifiedState?: LegalOperationalState;
  verifiedBy?: string;
  verifiedAt?: string;
  aiInterpretationNarrative: string;
  aiConfidenceRationale: AIConfidenceRationale;
  aiPotentialInconsistencies: Array<{
    description: string;
    severity: AIConfidence;
    requiresHumanReview: true;
  }>;
  schemaValidated: boolean;
  linkedRuleVersionId?: string;
  extractedAt: string;
}

// ── Compliance Consequence Rule ────────────────────────────────────────────────
// Mediates between legal-operational state and calculation behaviour.
// humanVerified MUST be true before the engine consults this.
export interface ComplianceConsequenceRule {
  id: string;
  triggeredByEventId: string;
  effectType: RegulatoryEffectType;
  calculationBehaviour:
    | "calculate_and_remit"  // Normal
    | "calculate_escrow"     // Calculate, hold in escrow
    | "calculate_hold"       // Calculate, do not remit pending resolution
    | "do_not_calculate"     // Obligation interpreted as suspended
    | "flag_for_review";     // Human must decide per transaction
  collectionDestination?:
    | "state_welfare_fund"
    | "court_escrow"
    | "internal_hold";
  sourceEventId: string;
  humanVerified: boolean;
  humanNote?: string;
}

// ── Rule Version Model ─────────────────────────────────────────────────────────
export interface RuleVersionModel {
  id: string;
  versionCode: string;
  versionNumber: number;
  sourceDocumentId: string;
  sourceType: SourceDocumentType;
  sourceTitle: string;
  sourceUrl?: string;
  sourceNotificationNo?: string | null;
  publishedDate: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  jurisdiction: string;
  sector: string | null;
  vehicleType: string | null;
  isEVOnly: boolean;
  applicableCategories: string[];
  rateType: "percentage" | "flat";
  rate: string;
  cap: string | null;
  minimumFee: string | null;
  baseType: string;
  calculationMethod?: string;
  exclusions: string[];
  // Legal-operational state: AI proposes, human verifies
  aiProposedState?: LegalOperationalState;
  legalStatus: LegalOperationalState;         // verified state (kept as legalStatus for compat)
  lifecycleStatus: LifecycleStatus;
  paymentDestination?: string;
  confidence: AIConfidence;                   // No numeric score
  sourceEvidence: EvidenceCitation[];
  supersedesRuleId?: string;
  proposedByAI: boolean;
  reviewedBy?: string;
  approvedAt?: string;
  interpretationNotes?: string | null;
  createdAt: string;
}

// ── Proposed Rule Extraction (AI output — must pass schema validation) ─────────
export interface ProposedRuleExtraction {
  id: string;
  documentTitle: string;
  sourceType: SourceDocumentType;
  jurisdiction: string;
  sector: string;
  vehicleType: string | null;
  proposedRate: number;
  proposedCap: number | null;
  effectiveDate: string;

  // AI-proposed classification — NOT verified legal truth
  aiProposedState: LegalOperationalState;
  // Keep legalStatus for backward compatibility
  legalStatus: LegalOperationalState;

  // Confidence: interpretability signal, not statistical probability
  confidence: AIConfidence;
  confidenceRationale: AIConfidenceRationale;

  // Interpretation narrative (plain English)
  interpretationNarrative: string;

  // Potential inconsistencies — never "confirmed conflicts"
  potentialInconsistencies: Array<{
    relatedRuleCode?: string;
    description: string;
    severity: AIConfidence;
    requiresHumanReview: true;
  }>;

  // Applicability conditions
  applicabilityConditions: string[];

  // Recommended action
  recommendedAction: {
    title: string;
    steps: string[];
    urgency: "IMMEDIATE" | "BEFORE_EFFECTIVE_DATE" | "MONITORING";
    confidence: AIConfidence;
    basis: string;
  };

  // Summary (kept for backward compat)
  summary: string;
  evidence: EvidenceCitation[];
  ambiguities: string[];
  exclusions: string[];
  previousRuleCode: string;
  previousRate: number;
  previousCap: number | null;
  changeHighlights: Array<{
    field: string;
    oldValue: string;
    newValue: string;
    impact: "increase" | "decrease" | "neutral" | "scope_expansion";
  }>;

  // Whether this scenario is synthetic (must be labeled in UI)
  isSyntheticScenario?: boolean;
  syntheticScenarioLabel?: SyntheticScenarioLabel;

  // Schema validation result (set by validation gate, NOT by AI)
  schemaValid: boolean;
  schemaValidationErrors: string[];
}

// ── Transaction Impact Result ──────────────────────────────────────────────────
export interface TransactionImpactResult {
  transactionId: string;
  workerId: string;
  transactionDate: string;
  sector: string;
  vehicleType: string;
  payout: number;
  previousRuleCode: string;
  previousLiability: number;
  revisedRuleCode: string;
  revisedLiability: number;
  delta: number;
  isAffected: boolean;
  status: "unchanged" | "liability_increased" | "liability_decreased" | "newly_eligible" | "exception" | "requires_review" | "conflict_unresolved" | "unbound";
  legalStatus: LegalOperationalState;
  // Human-readable explanation of which binding step resolved this transaction
  bindingExplanation: string;
  // Which of the 5 precedence steps resolved the binding
  bindingResolutionStep: 1 | 2 | 3 | 4 | 5;
  // Collection behaviour from ComplianceConsequenceRule (if applicable)
  calculationBehaviour?: string;
  evidenceCitation: EvidenceCitation;
  calculationSteps: Array<{
    label: string;
    value: string;
  }>;
  reviewReason?: string;
}

// ── Batch Impact Summary ───────────────────────────────────────────────────────
export interface BatchImpactSummary {
  totalAnalyzed: number;
  totalAffected: number;
  totalUnaffected: number;
  previousExposure: number;
  revisedExposure: number;
  liabilityDelta: number;
  percentageChange: number;
  exceptionCount: number;
  humanReviewCount: number;
  conflictUnresolvedCount: number;
  sectorBreakdown: Array<{
    sector: string;
    vehicleType: string;
    totalTxns: number;
    affectedTxns: number;
    prevExposure: number;
    revisedExposure: number;
    delta: number;
  }>;
  recommendedAction: {
    title: string;
    description: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";
    recommendedSteps: string[];
    confidence: AIConfidence;
    supportingEvidenceCount: number;
  };
  provenanceGraph: {
    sourceDocument: string;
    ruleVersion: string;
    transactionsCount: number;
    calculationEngineVersion: string;
    humanDecisionState: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  };
}

// ── Provenance Audit Log (append-only) ────────────────────────────────────────
// Entries are NEVER modified or deleted after creation.
export interface ProvenanceAuditLog {
  id: string;
  eventType:
    | "regulatory_event_ingested"
    | "ai_interpretation_complete"
    | "schema_validation_passed"
    | "schema_validation_failed"
    | "potential_inconsistency_flagged"
    | "impact_simulation_run"
    | "legal_state_verified"
    | "human_approved"
    | "human_rejected"
    | "rule_activated"
    | "rule_superseded"
    | "compliance_consequence_set"
    | "reg_change.rejected"
    | "rule_approved";
  regulatoryEventId?: string;
  proposedRuleId?: string;
  ruleVersionCode?: string;
  affectedTransactionCount?: number;
  financialDelta?: number;
  actor: string;
  timestamp: string;
  note?: string;
}
