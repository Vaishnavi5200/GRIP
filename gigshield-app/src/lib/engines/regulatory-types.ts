/**
 * GigShield Regulatory Intelligence & Provenance Types
 *
 * Grounded in the Karnataka Platform Based Gig Workers
 * (Social Security and Welfare) Act, 2025 (Act 72 of 2025)
 * and Karnataka Rules, 2025.
 */

export type LegalStatus =
  | "ACTIVE"
  | "UNDER_CHALLENGE"
  | "UNDER_INTERIM_ORDER"
  | "STAYED"
  | "SUPERSEDED"
  | "EXPIRED"
  | "REQUIRES_REVIEW";

export type SourceDocumentType =
  | "ACT"
  | "RULE"
  | "NOTIFICATION"
  | "GOVERNMENT_ORDER"
  | "COURT_ORDER";

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
  applicableCategories: string[];
  rateType: "percentage" | "flat";
  rate: string;
  cap: string | null;
  minimumFee: string | null;
  baseType: string;
  calculationMethod?: string;
  exclusions: string[];
  legalStatus: LegalStatus;
  paymentDestination?: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  confidenceScore: number;
  sourceEvidence: EvidenceCitation[];
  supersedesRuleId?: string;
  proposedByAI: boolean;
  reviewedBy?: string;
  approvedAt?: string;
  interpretationNotes?: string | null;
  lifecycleStatus: "draft" | "approved" | "active" | "superseded";
  createdAt: string;
}

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
  legalStatus: LegalStatus;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  confidenceScore: number;
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
}

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
  status: "unchanged" | "liability_increased" | "liability_decreased" | "newly_eligible" | "exception" | "requires_review";
  legalStatus: LegalStatus;
  evidenceCitation: EvidenceCitation;
  calculationSteps: Array<{
    label: string;
    value: string;
  }>;
  reviewReason?: string;
}

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
    confidence: "HIGH" | "MEDIUM" | "LOW";
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
