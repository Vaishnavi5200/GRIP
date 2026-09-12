/**
 * GigShield In-Memory & Persistent Demo Store
 *
 * Provides a 100% self-contained, deterministic data store.
 * Works seamlessly whether PostgreSQL is running locally or not!
 *
 * Core Moat:
 * Closed Loop Compliance Workflow:
 * REGULATION → RULE VERSION → DATA → CALCULATION → RECONCILIATION → RISK → ACTION → AUDIT → REGULATION CHANGE
 */

import {
  calculateWelfareFee,
  calculateBatch,
  CalculationResult,
  RuleVersionInput,
  formatINR,
} from "../engines/calculation-engine";
import { resolveApplicableRule } from "../engines/rule-engine";
import { reconcile, ReconciliationSummary, ReconciliationItem } from "../engines/reconciliation-engine";
import { computeComplianceHealthScore, ComplianceHealthScore } from "../engines/risk-engine";
import { AUDIT_ACTIONS } from "../engines/audit-types";
import {
  LegalOperationalState,
  EvidenceCitation,
  ProposedRuleExtraction,
  BatchImpactSummary,
  TransactionImpactResult,
  RegulatoryEvent,
  ComplianceConsequenceRule,
  ProvenanceAuditLog,
  AIConfidence,
  AIConfidenceRationale,
  SyntheticScenarioLabel,
} from "../engines/regulatory-types";
// Backward compat alias
type LegalStatus = LegalOperationalState;
import { simulateBatchImpact } from "../engines/impact-engine";

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

export interface PlanDefinition {
  id: "free" | "growth" | "enterprise";
  name: string;
  badge: string;
  priceINR: string;
  period: string;
  tagline: string;
  monthlyTransactionLimit: number;
  allowedStates: string[];
  maxSeats: number;
  features: string[];
}

export const SAAS_PLANS: Record<"free" | "growth" | "enterprise", PlanDefinition> = {
  free: {
    id: "free",
    name: "Freemium Starter",
    badge: "Free Forever",
    priceINR: "₹0",
    period: "/month",
    tagline: "Essential compliance calculation for early-stage platforms & pilot operations.",
    monthlyTransactionLimit: 1000,
    allowedStates: ["KA"],
    maxSeats: 1,
    features: [
      "Karnataka (KA) Act, 2025 rule engine",
      "Up to 1,000 monthly transactions",
      "Standard CSV bulk upload & validation",
      "Statutory fee calculation breakdown",
      "1 Compliance Officer seat",
      "Quarterly CSV return export",
    ],
  },
  growth: {
    id: "growth",
    name: "Growth Compliance",
    badge: "Active Workspace Plan",
    priceINR: "₹24,999",
    period: "/month",
    tagline: "Full multi-state compliance, reconciliation & risk operations for scaling platforms.",
    monthlyTransactionLimit: 50000,
    allowedStates: ["KA", "RJ", "MH", "TG"],
    maxSeats: 5,
    features: [
      "All active & notified state regulations (KA, RJ, MH, TG)",
      "Up to 50,000 monthly transactions",
      "4-Column Automated Finance Reconciliation",
      "Full discrepancy resolution & sign-off workflow",
      "Dynamic Compliance Risk Score & Deadlines",
      "AI Regulatory Change Monitor with Human-in-the-Loop",
      "Multi-user RBAC & team invitations (5 seats)",
      "Immutable statutory audit trail",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise Custom",
    badge: "Enterprise",
    priceINR: "Custom",
    period: "/billed annually",
    tagline: "Dedicated compliance infrastructure with ERP connectors & legal SLA.",
    monthlyTransactionLimit: 1000000,
    allowedStates: ["*"],
    maxSeats: 999,
    features: [
      "Unlimited transactions & pan-India state coverage",
      "Direct ERP / SAP Finance automated sync connectors",
      "Custom legal opinion & gazette interpretation engine",
      "Dedicated compliance officer & 99.9% filing SLA",
      "Custom role hierarchy & Single Sign-On (SAML/Okta)",
      "Automated Treasury filing & payment gateway dispatch",
    ],
  },
};

export interface DemoOrg {
  id: string;
  name: string;
  slug: string;
  sector: string;
  registrationNo: string;
  pan: string;
  stateCode: string;
  plan: "free" | "growth" | "enterprise";
  // trialEndsAt removed — misleading SaaS framing
}

export interface DemoUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "compliance_manager" | "finance_manager" | "viewer";
  organizationId: string;
}

export interface DemoRegulation {
  id: string;
  stateCode: string;
  title: string;
  shortName: string;
  status: "operational" | "draft" | "policy_activity" | "not_started";
  effectiveDate: string;
  applicableSectors: string[];
  gazetteRef: string;
  sourceUrl: string;
  lastVerified: string;
  notes: string;
}

export interface DemoRuleVersion extends RuleVersionInput {
  regulationId: string;
  versionNumber: number;
  rateType: "percentage" | "flat";
  lifecycleStatus: "draft" | "approved" | "active" | "superseded";
  legalStatus: LegalOperationalState;
  // AI-proposed state (before human verification)
  aiProposedState?: LegalOperationalState;
  confidence: AIConfidence;
  // isEVOnly: Whether this rule applies only to EV vehicles (Karnataka Act Section 16(3))
  isEVOnly: boolean;
  supersedesRuleId?: string;
  sourceEvidence: EvidenceCitation[];
  sourceNotificationNo: string | null;
  sourceDocumentDate: string | null;
  sourceDocumentUrl: string | null;
  verifiedAt: string | null;
  verifiedByName: string | null;
  interpretationNotes: string | null;
  reportingFrequency: string;
  registrationWindowDays: number;
  workerUpdateWindowDays: number;
}

export interface DemoTransaction {
  id: string;
  organizationId: string;
  transactionId: string;
  workerId: string;
  stateCode: string;
  sector: string;
  vehicleType: string;
  payout: number;
  transactionDate: string;
  isValid: boolean;
  // isEV: Whether this transaction involves an Electric Vehicle
  // Required for EV concession rules (Karnataka Act Section 16(3))
  isEV: boolean;
}

export interface DemoLedgerEntry {
  id: string;
  organizationId: string;
  transactionId: string;
  recordedPayout: number;
  recordedFee: number;
  entryDate: string;
  isDuplicate?: boolean;
}

export interface DemoAction {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  actionType: "reconciliation" | "reporting" | "data_quality" | "regulatory";
  priority: "critical" | "high" | "medium" | "low" | "info";
  estimatedImpact: string;
  recommendedAction: string;
  dueDate: string;
  assignedToName: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  createdAt: string;
}

export interface DemoAlert {
  id: string;
  organizationId: string;
  severity: "critical" | "high" | "medium" | "info";
  title: string;
  description: string;
  alertType: string;
  actionUrl: string;
  isRead: boolean;
  createdAt: string;
}

// DemoAuditLog kept for backward compat with existing uses in audit page
export interface DemoAuditLog {
  id: string;
  organizationId: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
}

// DemoRegulatoryChange kept for backward compat with existing monitor/approveRegulatoryChange
export interface DemoRegulatoryChange {
  id: string;
  stateCode: string;
  title: string;
  sourceDocumentTitle: string;
  sourceType: "gazette" | "official_notification" | "press_release" | "sample_document";
  detectedAt: string;
  rawContent: string;
  aiSummary: string;
  aiAffectedSectors: string[];
  aiOldValue: string;
  aiNewValue: string;
  aiEffectiveDate: string;
  // aiConfidence as HIGH/MEDIUM/LOW only — no numeric scores
  aiConfidenceLevel: AIConfidence;
  aiConfidenceRationale: AIConfidenceRationale;
  reviewStatus: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

// Re-export RegulatoryEvent and ComplianceConsequenceRule for use in components
export type { RegulatoryEvent, ComplianceConsequenceRule, ProvenanceAuditLog };

// ─────────────────────────────────────────────────────────────────────────────
// Global Store Class (Singleton in Node process)
// ─────────────────────────────────────────────────────────────────────────────

class DemoStore {
  public org: DemoOrg;
  public users: DemoUser[];
  public regulations: DemoRegulation[];
  public ruleVersions: DemoRuleVersion[];
  public transactions: DemoTransaction[];
  public calculatedItems: CalculationResult[];
  public ledgerEntries: DemoLedgerEntry[];
  public reconSummary: ReconciliationSummary | null = null;
  public actions: DemoAction[];
  public alerts: DemoAlert[];
  public auditLogs: DemoAuditLog[];
  // Append-only provenance audit trail
  public provenanceLog: ProvenanceAuditLog[] = [];
  // Regulatory events (typed — replaces DemoRegulatoryChange)
  public regulatoryEvents: RegulatoryEvent[] = [];
  // Compliance consequence rules (for enforcement-modification events)
  public complianceConsequenceRules: ComplianceConsequenceRule[] = [];
  // Kept for backward compat with approveRegulatoryChange
  public regulatoryChanges: DemoRegulatoryChange[];
  public activeUser: DemoUser;

  constructor() {
    this.org = this.initOrg();
    this.users = this.initUsers();
    this.activeUser = this.users[0]; // Vaishnavi Dwivedi
    this.regulations = this.initRegulations();
    this.ruleVersions = this.initRuleVersions();
    this.transactions = this.generateDeterministicTransactions(5000);
    this.calculatedItems = this.runCalculations();
    this.ledgerEntries = this.generateDeterministicLedger(this.calculatedItems);
    this.reconSummary = this.runReconciliation();
    this.actions = this.initActions();
    this.alerts = this.initAlerts();
    this.auditLogs = this.initAuditLogs();
    this.regulatoryChanges = this.initRegulatoryChanges();
    this.regulatoryEvents = this.initRegulatoryEvents();
    this.complianceConsequenceRules = this.initComplianceConsequenceRules();
    // Seed initial provenance entries for the pre-loaded data
    this.provenanceLog = this.initProvenanceLog();
  }

  public reset() {
    this.org = this.initOrg();
    this.users = this.initUsers();
    this.activeUser = this.users[0];
    this.regulations = this.initRegulations();
    this.ruleVersions = this.initRuleVersions();
    this.transactions = this.generateDeterministicTransactions(5000);
    this.calculatedItems = this.runCalculations();
    this.ledgerEntries = this.generateDeterministicLedger(this.calculatedItems);
    this.reconSummary = this.runReconciliation();
    this.actions = this.initActions();
    this.alerts = this.initAlerts();
    this.auditLogs = this.initAuditLogs();
    this.regulatoryChanges = this.initRegulatoryChanges();
    this.regulatoryEvents = this.initRegulatoryEvents();
    this.complianceConsequenceRules = this.initComplianceConsequenceRules();
    this.provenanceLog = this.initProvenanceLog();

    this.logAudit(
      AUDIT_ACTIONS.DEMO_RESET,
      "system",
      "demo_state",
      "Reset entire database to fresh 5,000-transaction deterministic baseline state."
    );
  }

  public getCurrentPlan(): PlanDefinition {
    return SAAS_PLANS[this.org.plan] || SAAS_PLANS.growth;
  }

  public switchPlan(newPlan: "free" | "growth" | "enterprise") {
    const prev = this.org.plan;
    this.org.plan = newPlan;
    this.logAudit(
      "plan.updated",
      "subscription",
      `sub-${newPlan}`,
      `Subscription tier changed from [${prev.toUpperCase()}] to [${newPlan.toUpperCase()}]: ${SAAS_PLANS[newPlan].name}.`
    );
  }

  // ── Initializers ──────────────────────────────────────────────────────────

  private initOrg(): DemoOrg {
    return {
      id: "org-quickride-001",
      name: "QuickRide Technologies Pvt Ltd",
      slug: "quickride",
      sector: "ride-hailing",
      registrationNo: "KA-PWFVS-2026-REG-1042",
      pan: "AABCQ7892K",
      stateCode: "KA",
      plan: "growth",
    };
  }

  private initUsers(): DemoUser[] {
    // Only the authenticated user is stored here.
    // Additional collaborators can be invited via the Team page.
    return [
      {
        id: "usr-vaishnavi-01",
        email: "vaishnavi@quickride.in",
        name: "Vaishnavi Dwivedi",
        role: "compliance_manager",
        organizationId: "org-quickride-001",
      },
    ];
  }

  private initRegulations(): DemoRegulation[] {
    return [
      {
        id: "reg-ka-01",
        stateCode: "KA",
        title: "Karnataka Platform Based Gig Workers (Social Security and Welfare) Act, 2025",
        shortName: "Karnataka Gig Workers Act",
        status: "operational",
        effectiveDate: "2026-02-16",
        applicableSectors: ["ride-hailing", "food-delivery", "logistics", "ecommerce", "professional"],
        gazetteRef: "KAR-ACT-2025-GIG-SEC4",
        sourceUrl: "https://labour.karnataka.gov.in/gazette-pwfvs",
        lastVerified: "2026-08-15",
        notes: "Operational rules. Welfare fee collected on platform transaction payouts.",
      },
      {
        id: "reg-rj-02",
        stateCode: "RJ",
        title: "Rajasthan Platform Based Gig Workers (Registration and Welfare) Act, 2023",
        shortName: "Rajasthan Gig Workers Act",
        status: "operational",
        effectiveDate: "2024-06-01",
        applicableSectors: ["ride-hailing", "food-delivery", "logistics", "e-marketplace"],
        gazetteRef: "RAJ-ACT-2023-GIG-01",
        sourceUrl: "https://labour.rajasthan.gov.in",
        lastVerified: "2026-07-20",
        notes: "Operational rules active. Registration and primary cess mechanism.",
      },
      {
        id: "reg-tg-03",
        stateCode: "TG",
        title: "Telangana Gig and Platform Workers (Social Security and Welfare) Bill, 2025",
        shortName: "Telangana Draft Bill",
        status: "draft",
        effectiveDate: "2026-11-01",
        applicableSectors: ["ride-hailing", "food-delivery", "logistics"],
        gazetteRef: "TG-DRAFT-2025-04",
        sourceUrl: "https://telangana.gov.in/draft-bills",
        lastVerified: "2026-08-28",
        notes: "Research Mode only — Tripartite consultation ongoing.",
      },
      {
        id: "reg-jh-04",
        stateCode: "JH",
        title: "Jharkhand Platform Workers Social Security Policy Framework",
        shortName: "Jharkhand Draft Policy",
        status: "policy_activity",
        effectiveDate: "2027-04-01",
        applicableSectors: ["logistics", "ride-hailing"],
        gazetteRef: "JH-LAB-NOTIF-98",
        sourceUrl: "https://jharkhand.gov.in",
        lastVerified: "2026-05-30",
        notes: "Research Mode only — Policy under committee review.",
      },
    ];
  }

  private initRuleVersions(): DemoRuleVersion[] {
    const karnatakaActEvidence: EvidenceCitation = {
      sourceDocumentId: "KAR-ACT-2025-72",
      sourceTitle: "Karnataka Platform Based Gig Workers (Social Security and Welfare) Act, 2025 (Act 72 of 2025)",
      sourceType: "ACT",
      section: "Section 4",
      clause: "Sub-section (2) Welfare Fee Assessment",
      quotedExcerpt:
        "Every aggregator platform shall contribute a statutory welfare fee per transaction payout as notified by the Government.",
      sourceUrl: "https://www.indiacode.nic.in/bitstream/123456789/22201/1/72_of_2025_%28e%29.pdf",
    };

    const karnatakaRulesEvidence: EvidenceCitation = {
      sourceDocumentId: "KAG-2025-RULES",
      sourceTitle: "Karnataka Platform Based Gig Workers Welfare Rules, 2025",
      sourceType: "RULE",
      section: "Rule 4 & Schedule I",
      clause: "Rate & Transaction Cap Matrix",
      quotedExcerpt:
        "Welfare fee shall be calculated at 1.00% of driver payout subject to category-specific caps per ride/delivery transaction.",
      sourceUrl: "https://upload.indiacode.nic.in/showfile?actid=AC_KA_71_593_00008_00008_1771495569804&filename=karnataka_platform_based_gig_workers_%28social_security_and_welfare%29_rules%2C_2025.pdf&type=rule",
    };

    return [
      // 1. Ride-hailing 2W
      {
        id: "rv-ka-rh-2w",
        regulationId: "reg-ka-01",
        versionCode: "KA-2025-02-RH-2W",
        versionNumber: 1,
        sector: "ride-hailing",
        vehicleType: "2W",
        rateType: "percentage",
        rate: "0.0100",
        cap: "0.50",
        minimumFee: null,
        baseType: "payout",
        effectiveFrom: "2026-02-16",
        effectiveTo: null,
        lifecycleStatus: "active",
        legalStatus: "ACTIVE",
        confidence: "HIGH",
        sourceEvidence: [karnatakaActEvidence, karnatakaRulesEvidence],
        verificationStatus: "verified",
        sourceDocumentTitle:
          "Karnataka Platform Based Gig Workers Welfare Rules, 2025 (Notified Schedule)",
        sourceGazetteRef: "KAG-2025-NOTIF-02",
        sourceNotificationNo: "LD/KBWWB/2025/CR-14",
        sourceDocumentDate: "2026-02-10",
        sourceDocumentUrl: "https://upload.indiacode.nic.in/showfile?actid=AC_KA_71_593_00008_00008_1771495569804&filename=karnataka_platform_based_gig_workers_%28social_security_and_welfare%29_rules%2C_2025.pdf&type=rule",
        verifiedAt: "2026-02-14T10:00:00Z",
        verifiedByName: "Vaishnavi Dwivedi (Compliance Manager)",
        interpretationNotes:
          "1.0% fee rate with ₹0.50 cap per two-wheeler passenger ride payout.",
        reportingFrequency: "quarterly",
        registrationWindowDays: 45,
        workerUpdateWindowDays: 7,
        isEVOnly: false,
      },
      // 2. Ride-hailing 3W (Auto)
      {
        id: "rv-ka-rh-3w",
        regulationId: "reg-ka-01",
        versionCode: "KA-2025-02-RH-3W",
        versionNumber: 1,
        sector: "ride-hailing",
        vehicleType: "3W",
        rateType: "percentage",
        rate: "0.0100",
        cap: "0.75",
        minimumFee: null,
        baseType: "payout",
        effectiveFrom: "2026-02-16",
        effectiveTo: null,
        lifecycleStatus: "active",
        legalStatus: "ACTIVE",
        confidence: "HIGH",
        sourceEvidence: [karnatakaActEvidence, karnatakaRulesEvidence],
        verificationStatus: "verified",
        sourceDocumentTitle:
          "Karnataka Platform Based Gig Workers Welfare Rules, 2025 (Notified Schedule)",
        sourceGazetteRef: "KAG-2025-NOTIF-02",
        sourceNotificationNo: "LD/KBWWB/2025/CR-14",
        sourceDocumentDate: "2026-02-10",
        sourceDocumentUrl: "https://upload.indiacode.nic.in/showfile?actid=AC_KA_71_593_00008_00008_1771495569804&filename=karnataka_platform_based_gig_workers_%28social_security_and_welfare%29_rules%2C_2025.pdf&type=rule",
        verifiedAt: "2026-02-14T10:00:00Z",
        verifiedByName: "Vaishnavi Dwivedi (Compliance Manager)",
        interpretationNotes:
          "1.0% fee rate with ₹0.75 cap per three-wheeler (auto) passenger ride payout.",
        reportingFrequency: "quarterly",
        registrationWindowDays: 45,
        workerUpdateWindowDays: 7,
        isEVOnly: false,
      },
      // 3. Ride-hailing 4W (Cab)
      {
        id: "rv-ka-rh-4w",
        regulationId: "reg-ka-01",
        versionCode: "KA-2025-02-RH-4W",
        versionNumber: 1,
        sector: "ride-hailing",
        vehicleType: "4W",
        rateType: "percentage",
        rate: "0.0100",
        cap: "1.00",
        minimumFee: null,
        baseType: "payout",
        effectiveFrom: "2026-02-16",
        effectiveTo: null,
        lifecycleStatus: "active",
        legalStatus: "ACTIVE",
        confidence: "HIGH",
        sourceEvidence: [karnatakaActEvidence, karnatakaRulesEvidence],
        verificationStatus: "verified",
        sourceDocumentTitle:
          "Karnataka Platform Based Gig Workers Welfare Rules, 2025 (Notified Schedule)",
        sourceGazetteRef: "KAG-2025-NOTIF-02",
        sourceNotificationNo: "LD/KBWWB/2025/CR-14",
        sourceDocumentDate: "2026-02-10",
        sourceDocumentUrl: "https://upload.indiacode.nic.in/showfile?actid=AC_KA_71_593_00008_00008_1771495569804&filename=karnataka_platform_based_gig_workers_%28social_security_and_welfare%29_rules%2C_2025.pdf&type=rule",
        verifiedAt: "2026-02-14T10:00:00Z",
        verifiedByName: "Vaishnavi Dwivedi (Compliance Manager)",
        interpretationNotes:
          "1.0% fee rate with ₹1.00 cap per four-wheeler cab passenger ride payout.",
        reportingFrequency: "quarterly",
        registrationWindowDays: 45,
        workerUpdateWindowDays: 7,
        isEVOnly: false,
      },
      // 4. Food / Grocery 2W
      {
        id: "rv-ka-fd-2w",
        regulationId: "reg-ka-01",
        versionCode: "KA-2025-02-FD-2W",
        versionNumber: 1,
        sector: "food-delivery",
        vehicleType: "2W",
        rateType: "percentage",
        rate: "0.0100",
        cap: "0.50",
        minimumFee: null,
        baseType: "payout",
        effectiveFrom: "2026-02-16",
        effectiveTo: null,
        lifecycleStatus: "active",
        legalStatus: "ACTIVE",
        confidence: "HIGH",
        sourceEvidence: [karnatakaActEvidence, karnatakaRulesEvidence],
        verificationStatus: "verified",
        sourceDocumentTitle:
          "Karnataka Platform Based Gig Workers Welfare Rules, 2025 (Notified Schedule)",
        sourceGazetteRef: "KAG-2025-NOTIF-02",
        sourceNotificationNo: "LD/KBWWB/2025/CR-14",
        sourceDocumentDate: "2026-02-10",
        sourceDocumentUrl: "https://upload.indiacode.nic.in/showfile?actid=AC_KA_71_593_00008_00008_1771495569804&filename=karnataka_platform_based_gig_workers_%28social_security_and_welfare%29_rules%2C_2025.pdf&type=rule",
        verifiedAt: "2026-02-14T10:00:00Z",
        verifiedByName: "Vaishnavi Dwivedi (Compliance Manager)",
        interpretationNotes:
          "1.0% fee rate with ₹0.50 cap for food and grocery delivery trips on two-wheelers.",
        reportingFrequency: "quarterly",
        registrationWindowDays: 45,
        workerUpdateWindowDays: 7,
        isEVOnly: false,
      },
      // 5. Logistics 2W
      {
        id: "rv-ka-lg-2w",
        regulationId: "reg-ka-01",
        versionCode: "KA-2025-02-LG-2W",
        versionNumber: 1,
        sector: "logistics",
        vehicleType: "2W",
        rateType: "percentage",
        rate: "0.0100",
        cap: "0.50",
        minimumFee: null,
        baseType: "payout",
        effectiveFrom: "2026-02-16",
        effectiveTo: null,
        lifecycleStatus: "active",
        legalStatus: "ACTIVE",
        confidence: "HIGH",
        sourceEvidence: [karnatakaActEvidence, karnatakaRulesEvidence],
        verificationStatus: "verified",
        sourceDocumentTitle:
          "Karnataka Platform Based Gig Workers Welfare Rules, 2025 (Notified Schedule)",
        sourceGazetteRef: "KAG-2025-NOTIF-02",
        sourceNotificationNo: "LD/KBWWB/2025/CR-14",
        sourceDocumentDate: "2026-02-10",
        sourceDocumentUrl: "https://upload.indiacode.nic.in/showfile?actid=AC_KA_71_593_00008_00008_1771495569804&filename=karnataka_platform_based_gig_workers_%28social_security_and_welfare%29_rules%2C_2025.pdf&type=rule",
        verifiedAt: "2026-02-14T10:00:00Z",
        verifiedByName: "Vaishnavi Dwivedi (Compliance Manager)",
        interpretationNotes:
          "1.0% fee rate with ₹0.50 cap for courier/logistics packages on 2W.",
        reportingFrequency: "quarterly",
        registrationWindowDays: 45,
        workerUpdateWindowDays: 7,
        isEVOnly: false,
      },
      // 6. Logistics 3W
      {
        id: "rv-ka-lg-3w",
        regulationId: "reg-ka-01",
        versionCode: "KA-2025-02-LG-3W",
        versionNumber: 1,
        sector: "logistics",
        vehicleType: "3W",
        rateType: "percentage",
        rate: "0.0100",
        cap: "0.75",
        minimumFee: null,
        baseType: "payout",
        effectiveFrom: "2026-02-16",
        effectiveTo: null,
        lifecycleStatus: "active",
        legalStatus: "ACTIVE",
        confidence: "HIGH",
        sourceEvidence: [karnatakaActEvidence, karnatakaRulesEvidence],
        verificationStatus: "verified",
        sourceDocumentTitle:
          "Karnataka Platform Based Gig Workers Welfare Rules, 2025 (Notified Schedule)",
        sourceGazetteRef: "KAG-2025-NOTIF-02",
        sourceNotificationNo: "LD/KBWWB/2025/CR-14",
        sourceDocumentDate: "2026-02-10",
        sourceDocumentUrl: "https://upload.indiacode.nic.in/showfile?actid=AC_KA_71_593_00008_00008_1771495569804&filename=karnataka_platform_based_gig_workers_%28social_security_and_welfare%29_rules%2C_2025.pdf&type=rule",
        verifiedAt: "2026-02-14T10:00:00Z",
        verifiedByName: "Vaishnavi Dwivedi (Compliance Manager)",
        interpretationNotes:
          "1.0% fee rate with ₹0.75 cap for 3W goods transport.",
        reportingFrequency: "quarterly",
        registrationWindowDays: 45,
        workerUpdateWindowDays: 7,
        isEVOnly: false,
      },
      // 7. Logistics LCV
      {
        id: "rv-ka-lg-lcv",
        regulationId: "reg-ka-01",
        versionCode: "KA-2025-02-LG-LCV",
        versionNumber: 1,
        sector: "logistics",
        vehicleType: "LCV",
        rateType: "percentage",
        rate: "0.0100",
        cap: "1.00",
        minimumFee: null,
        baseType: "payout",
        effectiveFrom: "2026-02-16",
        effectiveTo: null,
        lifecycleStatus: "active",
        legalStatus: "ACTIVE",
        confidence: "HIGH",
        sourceEvidence: [karnatakaActEvidence, karnatakaRulesEvidence],
        verificationStatus: "verified",
        sourceDocumentTitle:
          "Karnataka Platform Based Gig Workers Welfare Rules, 2025 (Notified Schedule)",
        sourceGazetteRef: "KAG-2025-NOTIF-02",
        sourceNotificationNo: "LD/KBWWB/2025/CR-14",
        sourceDocumentDate: "2026-02-10",
        sourceDocumentUrl: "https://upload.indiacode.nic.in/showfile?actid=AC_KA_71_593_00008_00008_1771495569804&filename=karnataka_platform_based_gig_workers_%28social_security_and_welfare%29_rules%2C_2025.pdf&type=rule",
        verifiedAt: "2026-02-14T10:00:00Z",
        verifiedByName: "Vaishnavi Dwivedi (Compliance Manager)",
        interpretationNotes:
          "1.0% fee rate with ₹1.00 cap per commercial LCV goods delivery trip payout.",
        reportingFrequency: "quarterly",
        registrationWindowDays: 45,
        workerUpdateWindowDays: 7,
        isEVOnly: false,
      },
      // 8. Logistics HCV
      {
        id: "rv-ka-lg-hcv",
        regulationId: "reg-ka-01",
        versionCode: "KA-2025-02-LG-HCV",
        versionNumber: 1,
        sector: "logistics",
        vehicleType: "HCV",
        rateType: "percentage",
        rate: "0.0100",
        cap: "1.50",
        minimumFee: null,
        baseType: "payout",
        effectiveFrom: "2026-02-16",
        effectiveTo: null,
        lifecycleStatus: "active",
        legalStatus: "ACTIVE",
        confidence: "HIGH",
        sourceEvidence: [karnatakaActEvidence, karnatakaRulesEvidence],
        verificationStatus: "verified",
        sourceDocumentTitle:
          "Karnataka Platform Based Gig Workers Welfare Rules, 2025 (Notified Schedule)",
        sourceGazetteRef: "KAG-2025-NOTIF-02",
        sourceNotificationNo: "LD/KBWWB/2025/CR-14",
        sourceDocumentDate: "2026-02-10",
        sourceDocumentUrl: "https://upload.indiacode.nic.in/showfile?actid=AC_KA_71_593_00008_00008_1771495569804&filename=karnataka_platform_based_gig_workers_%28social_security_and_welfare%29_rules%2C_2025.pdf&type=rule",
        verifiedAt: "2026-02-14T10:00:00Z",
        verifiedByName: "Vaishnavi Dwivedi (Compliance Manager)",
        interpretationNotes:
          "1.0% fee rate with ₹1.50 cap for heavy commercial goods vehicles.",
        reportingFrequency: "quarterly",
        registrationWindowDays: 45,
        workerUpdateWindowDays: 7,
        isEVOnly: false,
      },
      // 9. E-marketplace 2W
      {
        id: "rv-ka-em-2w",
        regulationId: "reg-ka-01",
        versionCode: "KA-2025-02-EM-2W",
        versionNumber: 1,
        sector: "e-marketplace",
        vehicleType: "2W",
        rateType: "percentage",
        rate: "0.0100",
        cap: "0.50",
        minimumFee: null,
        baseType: "payout",
        effectiveFrom: "2026-02-16",
        effectiveTo: null,
        lifecycleStatus: "active",
        legalStatus: "ACTIVE",
        confidence: "HIGH",
        sourceEvidence: [karnatakaActEvidence, karnatakaRulesEvidence],
        verificationStatus: "verified",
        sourceDocumentTitle:
          "Karnataka Platform Based Gig Workers Welfare Rules, 2025 (Notified Schedule)",
        sourceGazetteRef: "KAG-2025-NOTIF-02",
        sourceNotificationNo: "LD/KBWWB/2025/CR-14",
        sourceDocumentDate: "2026-02-10",
        sourceDocumentUrl: "https://upload.indiacode.nic.in/showfile?actid=AC_KA_71_593_00008_00008_1771495569804&filename=karnataka_platform_based_gig_workers_%28social_security_and_welfare%29_rules%2C_2025.pdf&type=rule",
        verifiedAt: "2026-02-14T10:00:00Z",
        verifiedByName: "Vaishnavi Dwivedi (Compliance Manager)",
        interpretationNotes:
          "1.0% fee rate with ₹0.50 cap for e-marketplace deliveries on 2W.",
        reportingFrequency: "quarterly",
        registrationWindowDays: 45,
        workerUpdateWindowDays: 7,
        isEVOnly: false,
      },
      // 10. E-marketplace LCV
      {
        id: "rv-ka-em-lcv",
        regulationId: "reg-ka-01",
        versionCode: "KA-2025-02-EM-LCV",
        versionNumber: 1,
        sector: "e-marketplace",
        vehicleType: "LCV",
        rateType: "percentage",
        rate: "0.0100",
        cap: "1.00",
        minimumFee: null,
        baseType: "payout",
        effectiveFrom: "2026-02-16",
        effectiveTo: null,
        lifecycleStatus: "active",
        legalStatus: "ACTIVE",
        confidence: "HIGH",
        sourceEvidence: [karnatakaActEvidence, karnatakaRulesEvidence],
        verificationStatus: "verified",
        sourceDocumentTitle:
          "Karnataka Platform Based Gig Workers Welfare Rules, 2025 (Notified Schedule)",
        sourceGazetteRef: "KAG-2025-NOTIF-02",
        sourceNotificationNo: "LD/KBWWB/2025/CR-14",
        sourceDocumentDate: "2026-02-10",
        sourceDocumentUrl: "https://upload.indiacode.nic.in/showfile?actid=AC_KA_71_593_00008_00008_1771495569804&filename=karnataka_platform_based_gig_workers_%28social_security_and_welfare%29_rules%2C_2025.pdf&type=rule",
        verifiedAt: "2026-02-14T10:00:00Z",
        verifiedByName: "Vaishnavi Dwivedi (Compliance Manager)",
        interpretationNotes:
          "1.0% fee rate with ₹1.00 cap for e-marketplace deliveries on LCV.",
        reportingFrequency: "quarterly",
        registrationWindowDays: 45,
        workerUpdateWindowDays: 7,
        isEVOnly: false,
      },
      // 11. Professional Activity Providers
      {
        id: "rv-ka-prof",
        regulationId: "reg-ka-01",
        versionCode: "KA-2025-02-PROF",
        versionNumber: 1,
        sector: "professional",
        vehicleType: null,
        rateType: "percentage",
        rate: "0.0100",
        cap: "1.50",
        minimumFee: null,
        baseType: "payout",
        effectiveFrom: "2026-02-16",
        effectiveTo: null,
        lifecycleStatus: "active",
        legalStatus: "ACTIVE",
        confidence: "HIGH",
        sourceEvidence: [karnatakaActEvidence, karnatakaRulesEvidence],
        verificationStatus: "verified",
        sourceDocumentTitle:
          "Karnataka Platform Based Gig Workers Welfare Rules, 2025 (Notified Schedule)",
        sourceGazetteRef: "KAG-2025-NOTIF-02",
        sourceNotificationNo: "LD/KBWWB/2025/CR-14",
        sourceDocumentDate: "2026-02-10",
        sourceDocumentUrl: "https://upload.indiacode.nic.in/showfile?actid=AC_KA_71_593_00008_00008_1771495569804&filename=karnataka_platform_based_gig_workers_%28social_security_and_welfare%29_rules%2C_2025.pdf&type=rule",
        verifiedAt: "2026-02-14T10:00:00Z",
        verifiedByName: "Vaishnavi Dwivedi (Compliance Manager)",
        interpretationNotes:
          "1.0% fee rate with ₹1.50 cap for professional activity services.",
        reportingFrequency: "quarterly",
        registrationWindowDays: 45,
        workerUpdateWindowDays: 7,
        isEVOnly: false,
      },
      // 12. State Catch-All Default (matches 4W standard cap of ₹1.00)
      {
        id: "rv-ka-default",
        regulationId: "reg-ka-01",
        versionCode: "KA-2025-02-DEFAULT",
        versionNumber: 1,
        sector: null,
        vehicleType: null,
        rateType: "percentage",
        rate: "0.0100",
        cap: "1.00",
        minimumFee: null,
        baseType: "payout",
        effectiveFrom: "2026-02-16",
        effectiveTo: null,
        lifecycleStatus: "active",
        legalStatus: "ACTIVE",
        confidence: "HIGH",
        sourceEvidence: [karnatakaActEvidence, karnatakaRulesEvidence],
        verificationStatus: "verified",
        sourceDocumentTitle:
          "Karnataka Platform Based Gig Workers Welfare Rules, 2025 (Fallback Category)",
        sourceGazetteRef: "KAG-2025-NOTIF-02",
        sourceNotificationNo: "LD/KBWWB/2025/CR-14",
        sourceDocumentDate: "2026-02-10",
        sourceDocumentUrl: "https://upload.indiacode.nic.in/showfile?actid=AC_KA_71_593_00008_00008_1771495569804&filename=karnataka_platform_based_gig_workers_%28social_security_and_welfare%29_rules%2C_2025.pdf&type=rule",
        verifiedAt: "2026-02-14T10:00:00Z",
        verifiedByName: "Vaishnavi Dwivedi (Compliance Manager)",
        interpretationNotes:
          "Catch-all fallback rule (1.0% fee, ₹1.00 cap) for non-specified vehicle classifications.",
        reportingFrequency: "quarterly",
        registrationWindowDays: 45,
        workerUpdateWindowDays: 7,
        isEVOnly: false,
      },
    ];
  }

  // ── Deterministic 5,000 Transactions ─────────────────────────────────────

  private generateDeterministicTransactions(count: number): DemoTransaction[] {
    const list: DemoTransaction[] = [];
    const sectors = ["ride-hailing", "ride-hailing", "food-delivery", "logistics"];
    const vehicles: Record<string, string[]> = {
      "ride-hailing": ["2W", "2W", "4W"],
      "food-delivery": ["2W"],
      logistics: ["LCV", "2W"],
    };

    // Simple deterministic pseudo-random generator
    let seed = 42;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 1; i <= count; i++) {
      const sector = sectors[Math.floor(random() * sectors.length)];
      const vehiclePool = vehicles[sector];
      const vehicle = vehiclePool[Math.floor(random() * vehiclePool.length)];

      // Realistic payouts: 2W rides (₹80-₹220), 4W rides (₹240-₹650), LCV trips (₹400-₹1200)
      let payout = 100;
      if (vehicle === "2W") {
        payout = Math.round(75 + random() * 160);
      } else if (vehicle === "4W") {
        payout = Math.round(220 + random() * 450);
      } else if (vehicle === "LCV") {
        payout = Math.round(420 + random() * 680);
      }

      // Generate dates across Aug/Sep 2026
      const day = 1 + Math.floor(random() * 28);
      const month = random() > 0.4 ? "08" : "09";
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const transactionDate = `2026-${month}-${dayStr}`;

      const workerNum = 1000 + Math.floor(random() * 850);
      const workerId = `W-KA-${workerNum}`;

      // isEV: ~8% of food-delivery 2W are EV (deterministic, not random)
      // Based on Karnataka Act Section 16(3) concession eligibility
      const isEV = sector === "food-delivery" && vehicle === "2W" && (i % 12 === 0);

      list.push({
        id: `txn-row-${i}`,
        organizationId: "org-quickride-001",
        transactionId: `TXN-2026-${String(i).padStart(6, "0")}`,
        workerId,
        stateCode: "KA",
        sector,
        vehicleType: vehicle,
        payout,
        transactionDate,
        isValid: true,
        isEV,
      });
    }

    return list;
  }

  // ── Calculation Runs ──────────────────────────────────────────────────────

  public runCalculations(): CalculationResult[] {
    const activeRules = this.ruleVersions.filter((r) => r.lifecycleStatus === "active");

    const batchInput = this.transactions.map((t) => ({
      transactionId: t.transactionId,
      workerId: t.workerId,
      stateCode: t.stateCode,
      sector: t.sector,
      vehicleType: t.vehicleType,
      payout: t.payout,
      transactionDate: t.transactionDate,
    }));

    const results = calculateBatch(batchInput, (query) =>
      resolveApplicableRule(
        {
          stateCode: query.stateCode,
          sector: query.sector,
          vehicleType: query.vehicleType,
          transactionDate: query.transactionDate,
        },
        activeRules
      )
    );

    // Cast out exempts to CalculationResult
    return results.results.filter((r): r is CalculationResult => !r.isExempt);
  }

  // ── Deterministic Finance Ledger with Genuine Mismatches ───────────────────

  private generateDeterministicLedger(calcs: CalculationResult[]): DemoLedgerEntry[] {
    const ledger: DemoLedgerEntry[] = [];

    // Let's create intentional, structured mismatches matching the spec:
    // Mismatch indices (deterministic):
    // 25 payout mismatches
    // 28 fee mismatches
    // 8 full mismatches
    // 12 missing from ledger (skip these from ledger)
    // 5 unexpected in ledger (added extra)
    // 2 duplicate in ledger

    const skipSet = new Set<number>();
    for (let i = 1; i <= 12; i++) {
      skipSet.add(i * 120); // 12 missing platform records
    }

    const payoutMismatchIndices = new Set<number>();
    for (let i = 1; i <= 25; i++) {
      payoutMismatchIndices.add(i * 90 + 3);
    }

    const feeMismatchIndices = new Set<number>();
    for (let i = 1; i <= 28; i++) {
      feeMismatchIndices.add(i * 75 + 11);
    }

    const fullMismatchIndices = new Set<number>();
    for (let i = 1; i <= 8; i++) {
      fullMismatchIndices.add(i * 240 + 17);
    }

    calcs.forEach((c, idx) => {
      if (skipSet.has(idx)) {
        return; // Missing from finance ledger!
      }

      let recordedPayout = c.payout;
      let recordedFee = c.welfareFee;

      if (payoutMismatchIndices.has(idx)) {
        // Platform payout was after commission, ledger recorded gross fare
        recordedPayout = Math.round(c.payout * 1.18);
      }

      if (feeMismatchIndices.has(idx)) {
        // Finance ledger applied legacy 1.5% uncapped rate by mistake
        recordedFee = Math.round(c.payout * 0.015 * 100) / 100;
      }

      if (fullMismatchIndices.has(idx)) {
        recordedPayout = c.payout + 120;
        recordedFee = 0; // zero fee entered due to manual ledger glitch
      }

      ledger.push({
        id: `led-${idx}`,
        organizationId: "org-quickride-001",
        transactionId: c.transactionId,
        recordedPayout,
        recordedFee,
        entryDate: "2026-08-31",
      });

      // Inject duplicates for index 45 and 95
      if (idx === 45 || idx === 95) {
        ledger.push({
          id: `led-${idx}-dup`,
          organizationId: "org-quickride-001",
          transactionId: c.transactionId,
          recordedPayout,
          recordedFee,
          entryDate: "2026-09-01",
          isDuplicate: true,
        });
      }
    });

    // 5 unexpected entries (exist in ledger but not in platform batch)
    for (let u = 1; u <= 5; u++) {
      ledger.push({
        id: `led-unexp-${u}`,
        organizationId: "org-quickride-001",
        transactionId: `TXN-MANUAL-ADJ-00${u}`,
        recordedPayout: 350,
        recordedFee: 3.5,
        entryDate: "2026-08-25",
      });
    }

    return ledger;
  }

  public runReconciliation(): ReconciliationSummary {
    const platformInput = this.calculatedItems.map((c) => ({
      transactionId: c.transactionId,
      platformPayout: c.payout,
      expectedFee: c.welfareFee,
      ruleVersionCode: c.ruleVersionCode,
    }));

    const ledgerInput = this.ledgerEntries.map((l) => ({
      transactionId: l.transactionId,
      recordedPayout: l.recordedPayout,
      recordedFee: l.recordedFee,
      isDuplicate: l.isDuplicate,
    }));

    this.reconSummary = reconcile(platformInput, ledgerInput);
    return this.reconSummary;
  }

  // ── Health Score ──────────────────────────────────────────────────────────

  public getComplianceHealthScore(): ComplianceHealthScore {
    const recon = this.reconSummary || this.runReconciliation();

    const unresolvedCritical = recon.items.filter(
      (i) => i.status === "full_mismatch" && !this.isItemResolved(i.transactionId)
    ).length;

    const unresolvedHigh = recon.items.filter(
      (i) =>
        (i.status === "payout_mismatch" || i.status === "missing_from_ledger") &&
        !this.isItemResolved(i.transactionId)
    ).length;

    const resolvedCount = this.resolvedItemMap.size;

    return computeComplianceHealthScore({
      totalTransactions: this.transactions.length,
      validTransactions: this.transactions.length,
      invalidTransactions: 0,
      transactionsWithCalculation: this.calculatedItems.length,
      lastCalculationRunAt: new Date("2026-09-02T14:30:00Z"),
      daysSinceLastCalculation: 1,
      hasLedgerData: this.ledgerEntries.length > 0,
      totalReconItems: recon.totalRecords,
      resolvedReconItems: resolvedCount,
      unresolvedCriticalItems: unresolvedCritical,
      unresolvedHighItems: unresolvedHigh,
      matchRate: recon.matchRate,
      totalDeadlines: 3,
      overdueDeadlines: 0,
      upcomingUrgentDeadlines: 1,
      totalActions: this.actions.length,
      resolvedActions: this.actions.filter((a) => a.status === "completed").length,
      overdueActions: this.actions.filter((a) => a.status === "overdue").length,
      isRegistered: true,
      hasSubmittedReport: true,
      lastReportSubmittedAt: new Date("2026-06-30T10:00:00Z"),
    });
  }

  // ── Issue Resolution Workflow ─────────────────────────────────────────────

  public resolvedItemMap = new Map<
    string,
    { resolution: string; note: string; resolvedBy: string; resolvedAt: string }
  >();

  public isItemResolved(transactionId: string): boolean {
    return this.resolvedItemMap.has(transactionId);
  }

  public resolveReconIssue(
    transactionId: string,
    resolution: "platform_correct" | "ledger_correct" | "escalated" | "waived",
    note: string
  ): void {
    this.resolvedItemMap.set(transactionId, {
      resolution,
      note,
      resolvedBy: this.activeUser.name,
      resolvedAt: new Date().toISOString(),
    });

    this.logAudit(
      AUDIT_ACTIONS.RECON_ISSUE_RESOLVED,
      "reconciliation_item",
      transactionId,
      `Resolved mismatch as [${resolution}]: "${note}". Assigned audit sign-off by ${this.activeUser.name}.`
    );

    // Also mark related action as completed if fee gap shrinks
    const matchAction = this.actions.find((a) => a.title.includes("discrepancies"));
    if (matchAction && this.resolvedItemMap.size >= 1) {
      matchAction.estimatedImpact = `Fee gap reduced by ₹${(this.resolvedItemMap.size * 25).toFixed(2)}`;
    }
  }

  // ── Actions & Remediation ─────────────────────────────────────────────────

  private initActions(): DemoAction[] {
    return [
      {
        id: "act-01",
        organizationId: "org-quickride-001",
        title: "Review Finance Ledger Batch #LG-2026-09 Fee Discrepancies",
        description:
          "28 fee mismatches detected where finance recorded 1.5% uncapped rate instead of the Karnataka sector-specific cap.",
        actionType: "reconciliation",
        priority: "critical",
        estimatedImpact: "₹1,240 fee gap exposure",
        recommendedAction:
          "Review flagged transactions with the Finance team and confirm platform capped calculation is the statutory authority.",
        dueDate: "2026-09-12",
        assignedToName: "Finance Team",
        status: "pending",
        createdAt: "2026-09-02T08:00:00Z",
      },
      {
        id: "act-02",
        organizationId: "org-quickride-001",
        title: "Karnataka Q2 Welfare Cess Portal Filing",
        description:
          "Quarterly welfare remittance and line-item CSV filing due with the Karnataka Labour Welfare Board under the 2025 Act.",
        actionType: "reporting",
        priority: "high",
        estimatedImpact: "Statutory filing compliance deadline",
        recommendedAction:
          "Review and lock quarterly compliance report snapshot and initiate treasury transfer.",
        dueDate: "2026-09-15",
        assignedToName: "Vaishnavi Dwivedi",
        status: "pending",
        createdAt: "2026-09-01T10:00:00Z",
      },
      {
        id: "act-03",
        organizationId: "org-quickride-001",
        title: "Audit Commercial 4-Wheeler Vehicle Registration Numbers",
        description:
          "Verify that 82 new drivers onboarded in August have active commercial transport badges registered under Karnataka transport rules.",
        actionType: "data_quality",
        priority: "medium",
        estimatedImpact: "Worker classification compliance",
        recommendedAction:
          "Run automated worker KYC sync against Karnataka Vahan database.",
        dueDate: "2026-09-25",
        assignedToName: "Compliance Manager",
        status: "in_progress",
        createdAt: "2026-08-28T11:00:00Z",
      },
    ];
  }

  private initAlerts(): DemoAlert[] {
    return [
      {
        id: "alt-01",
        organizationId: "org-quickride-001",
        severity: "critical",
        title: "Reconciliation Fee Variance Detected",
        description:
          "Finance Ledger Batch #LG-2026-09 shows 61 financial discrepancies (fee and payout mismatches) requiring audit sign-off.",
        alertType: "reconciliation_gap",
        actionUrl: "/reconciliation",
        isRead: false,
        createdAt: "2026-09-02T09:15:00Z",
      },
      {
        id: "alt-02",
        organizationId: "org-quickride-001",
        severity: "high",
        title: "Statutory Deadline: Q2 Welfare Remittance Due in 12 Days",
        description:
          "Karnataka Platform Workers Welfare Fund quarterly return window closes on 15-Sep-2026.",
        alertType: "deadline_approaching",
        actionUrl: "/risk",
        isRead: false,
        createdAt: "2026-09-02T06:00:00Z",
      },
      {
        id: "alt-03",
        organizationId: "org-quickride-001",
        severity: "info",
        title: "AI Regulatory Monitor: Draft Notification Detected",
        description:
          "Karnataka Labour Department released draft gazette proposal concerning four-wheeler cab cess rate adjustments.",
        alertType: "regulatory_change",
        actionUrl: "/monitor",
        isRead: false,
        createdAt: "2026-09-01T14:20:00Z",
      },
    ];
  }

  // ── Regulatory Change & AI Analysis ────────────────────────────────────────

  private initRegulatoryChanges(): DemoRegulatoryChange[] {
    return [
      {
        id: "chg-ka-2026-09",
        stateCode: "KA",
        title:
          "Karnataka Labour Department Draft Notification — 4-Wheeler Welfare Cess Adjustment",
        sourceDocumentTitle:
          "Draft Notification No. LD-KBWWB-CR-2026/09 — Proposed Amendment to Karnataka Platform Workers Welfare Rules",
        sourceType: "sample_document",
        detectedAt: "2026-09-01T14:20:00Z",
        rawContent: `GOVERNMENT OF KARNATAKA
LABOUR DEPARTMENT, VIKASA SOUDHA, BENGALURU
Notification No. LD-KBWWB-CR-2026/09

In exercise of the powers conferred by Section 24 of the Karnataka Platform Based Gig Workers (Social Security and Welfare) Act, 2025, the Government hereby invites objections/suggestions on proposed amendments:
1. For motor cabs (Four-Wheeler / 4W) engaged in passenger ride-hailing services, the welfare cess rate shall be revised from 1.0% to 1.5% of net driver payout.
2. The maximum cap per ride transaction shall be revised from ₹1.00 to ₹1.50.
3. Two-wheeler (2W) and delivery operations shall remain capped at ₹0.50 at 1.0%.
4. Effective date of operational gazetting: 01 October 2026.`,
        aiSummary:
          "Proposed regulatory amendment increases the welfare cess for Four-Wheeler (4W) ride-hailing trips in Karnataka from 1.0% (cap ₹1.00) to 1.5% (cap ₹1.50), effective 01-Oct-2026. Two-wheeler and logistics caps remain unchanged.",
        aiAffectedSectors: ["ride-hailing (4W)"],
        aiOldValue: "Rate: 1.00% | Cap: ₹1.00",
        aiNewValue: "Rate: 1.50% | Cap: ₹1.50",
        aiEffectiveDate: "2026-10-01",
        // Confidence as interpretability signal — no numeric score
        aiConfidenceLevel: "HIGH" as AIConfidence,
        aiConfidenceRationale: {
          level: "HIGH" as AIConfidence,
          allRequiredFieldsExtracted: true,
          directEvidenceCitationFound: true,
          unresolvedAmbiguityCount: 1,
          notes: "All rate/cap/sector/vehicle/date fields extracted; one ambiguity: Rule 12 consultation period.",
        },
        reviewStatus: "pending",
      },
    ];
  }

  // ── Typed Regulatory Events (new — replaces untyped DemoRegulatoryChange) ──

  private initRegulatoryEvents(): RegulatoryEvent[] {
    return [
      {
        id: "revt-ka-cab-revision",
        eventType: "gazette_notification",
        title: "[SYNTHETIC] 4W Cab Rate Revision — Karnataka Labour Department Draft",
        jurisdiction: "Karnataka (KA)",
        isSyntheticScenario: true,
        syntheticScenarioLabel: {
          purpose: "Demonstrates a rate-change regulatory event: AI extracts proposed rate/cap changes, engine binds to transactions, compliance officer approves.",
          realLegalBasis: "Karnataka Platform Based Gig Workers (Social Security and Welfare) Act, 2025 (Act 72/2025), Section 24 read with Rule 4 / Schedule I — rate amendment mechanism.",
        },
        sourceDocumentId: "doc-ka-cab-revision",
        sourceUrl: "https://labour.karnataka.gov.in/gazette-pwfvs/LD-KBWWB-CR-2026-09",
        dateOfEffect: "2026-10-01",
        effectType: "rate_change",
        aiProposedState: "REQUIRES_REVIEW",
        schemaValidated: true,
        aiInterpretationNarrative: "This draft notification proposes to increase the welfare fee for Four-Wheeler (4W) ride-hailing cabs from 1.00% (cap ₹1.00) to 1.50% (cap ₹1.50) effective 01-Oct-2026. Two-wheeler and logistics operations are not affected. The change requires compliance officer verification before becoming an active rule in GigShield.",
        aiConfidenceRationale: {
          level: "HIGH",
          allRequiredFieldsExtracted: true,
          directEvidenceCitationFound: true,
          unresolvedAmbiguityCount: 1,
          notes: "All fields extracted with direct citations. One ambiguity: Rule 12 consultation period closes 25-Sep-2026 before final gazetting.",
        },
        aiPotentialInconsistencies: [
          {
            description: "Rule 12 stakeholder consultation period closes 25-Sep-2026 — if objections are received, the effective date of 01-Oct-2026 may be postponed. The notification is technically a draft until the consultation window closes.",
            severity: "MEDIUM",
            requiresHumanReview: true,
          },
        ],
        extractedAt: "2026-09-01T14:20:00Z",
      },
      {
        id: "revt-ka-hc-interim-order",
        eventType: "court_order",
        title: "[SYNTHETIC] Karnataka HC Interim Order — HCV Logistics Cess Escrow",
        jurisdiction: "Karnataka (KA)",
        isSyntheticScenario: true,
        syntheticScenarioLabel: {
          purpose: "Demonstrates enforcement-modification event: court order changes WHERE fee is collected (escrow) without changing the rate. Separates enforcement from rate-change logic.",
          realLegalBasis: "Karnataka Platform Based Gig Workers (Social Security and Welfare) Act, 2025, Section 16 + general judicial review doctrine under Article 226 of the Constitution of India.",
        },
        sourceDocumentId: "doc-ka-hc-interim-order",
        sourceUrl: "https://karnatakahighcourt.kar.nic.in/orders/WP48102_2026",
        dateOfEffect: "2026-08-14",
        effectType: "enforcement_modification",
        aiProposedState: "UNDER_INTERIM_ORDER",
        schemaValidated: true,
        aiInterpretationNarrative: "This interim order requires aggregator platforms operating Heavy Commercial Vehicles (HCV, >3.5T GVW) in Karnataka to continue calculating the welfare fee at 1.00% (cap ₹1.50) but deposit the collection into a designated statutory escrow account pending the outcome of the constitutional challenge.",
        aiConfidenceRationale: {
          level: "HIGH",
          allRequiredFieldsExtracted: true,
          directEvidenceCitationFound: true,
          unresolvedAmbiguityCount: 0,
          notes: "Court order text is clear on scope (HCV only), calculation requirement, and escrow mechanism.",
        },
        aiPotentialInconsistencies: [],
        extractedAt: "2026-08-14T10:00:00Z",
      },
      {
        id: "revt-ka-ev-concession",
        eventType: "government_order",
        title: "[SYNTHETIC] EV Food Delivery Welfare Fee Concession",
        jurisdiction: "Karnataka (KA)",
        isSyntheticScenario: true,
        syntheticScenarioLabel: {
          purpose: "Demonstrates concession event: EV food delivery 2W receive 50% fee reduction under the Clean Mobility scheme. Demonstrates isEV binding dimension.",
          realLegalBasis: "Karnataka Platform Based Gig Workers (Social Security and Welfare) Act, 2025, Section 16(3) — concession powers for specified categories of gig workers.",
        },
        sourceDocumentId: "doc-ka-food-delivery-waiver",
        sourceUrl: "https://kbwwb.karnataka.gov.in/orders/2026/ADM-51",
        dateOfEffect: "2026-11-01",
        effectType: "concession",
        aiProposedState: "ACTIVE",
        schemaValidated: true,
        aiInterpretationNarrative: "This government order establishes a 50% welfare fee concession for Electric Two-Wheelers (EV-2W) deployed for food and grocery delivery. The concessional rate is 0.50% (cap ₹0.25) effective 01-Nov-2026. ICE vehicles continue at 1.00% (cap ₹0.50). EV status requires Vahan green registration plate verification.",
        aiConfidenceRationale: {
          level: "MEDIUM",
          allRequiredFieldsExtracted: true,
          directEvidenceCitationFound: true,
          unresolvedAmbiguityCount: 1,
          notes: "EV badge verification relies on Vahan database sync — not addressed in the order text.",
        },
        aiPotentialInconsistencies: [
          {
            description: "Order does not specify the Vahan registry verification mechanism for EV badge validation. Platforms would need to implement their own Vahan API sync or self-declaration process.",
            severity: "MEDIUM",
            requiresHumanReview: true,
          },
        ],
        extractedAt: "2026-08-25T10:00:00Z",
      },
    ];
  }

  // ── Compliance Consequence Rules ────────────────────────────────────────────

  private initComplianceConsequenceRules(): ComplianceConsequenceRule[] {
    return [
      {
        id: "ccr-hcv-escrow",
        triggeredByEventId: "revt-ka-hc-interim-order",
        effectType: "enforcement_modification",
        calculationBehaviour: "calculate_escrow",
        collectionDestination: "court_escrow",
        sourceEventId: "revt-ka-hc-interim-order",
        humanVerified: true,
        humanNote: "Court order paragraph 2 is clear: calculate fee, deposit to escrow. Verified by Vaishnavi Dwivedi.",
      },
    ];
  }

  // ── Provenance Audit Log (append-only) ────────────────────────────────────

  private initProvenanceLog(): ProvenanceAuditLog[] {
    return [
      {
        id: "prov-001",
        eventType: "regulatory_event_ingested",
        regulatoryEventId: "revt-ka-cab-revision",
        actor: "SYSTEM",
        timestamp: "2026-09-01T14:20:00Z",
        note: "Synthetic scenario doc-ka-cab-revision seeded. isSyntheticScenario: true.",
      },
      {
        id: "prov-002",
        eventType: "regulatory_event_ingested",
        regulatoryEventId: "revt-ka-hc-interim-order",
        actor: "SYSTEM",
        timestamp: "2026-08-14T10:00:00Z",
        note: "Synthetic scenario doc-ka-hc-interim-order seeded. isSyntheticScenario: true.",
      },
      {
        id: "prov-003",
        eventType: "compliance_consequence_set",
        regulatoryEventId: "revt-ka-hc-interim-order",
        actor: "Vaishnavi Dwivedi",
        timestamp: "2026-08-14T11:00:00Z",
        note: "ComplianceConsequenceRule ccr-hcv-escrow verified and activated for HCV logistics transactions.",
      },
    ];
  }

  /**
   * Append a provenance log entry (append-only — never modifies existing entries).
   */
  public appendProvenanceLog(entry: Omit<ProvenanceAuditLog, "id" | "timestamp">): ProvenanceAuditLog {
    const newEntry: ProvenanceAuditLog = {
      ...entry,
      id: `prov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.provenanceLog.push(newEntry);
    return newEntry;
  }

  public approveRegulatoryChange(changeId: string, note: string): DemoRuleVersion {
    let change = this.regulatoryChanges.find((c) => c.id === changeId);
    if (!change) {
      change = this.regulatoryChanges[0];
    }

    if (change) {
      change.reviewStatus = "approved";
      change.reviewedBy = this.activeUser.name;
      change.reviewedAt = new Date().toISOString();
      change.reviewNote = note;
    }

    // Mark previous baseline rule as superseded
    const prevRule = this.ruleVersions.find((r) => r.versionCode === "KA-2025-02-RH-4W");
    if (prevRule) {
      prevRule.lifecycleStatus = "superseded";
    }

    // Create new rule version with ACTIVE status
    const newVersionCode = "KA-2026-10-RH-4W";
    const newRule: DemoRuleVersion = {
      id: `rv-ka-rh-4w-${Date.now()}`,
      regulationId: "reg-ka-01",
      versionCode: newVersionCode,
      versionNumber: 2,
      sector: "ride-hailing",
      vehicleType: "4W",
      rateType: "percentage",
      rate: "0.0150",
      cap: "1.50",
      minimumFee: null,
      baseType: "payout",
      effectiveFrom: "2026-10-01",
      effectiveTo: null,
      lifecycleStatus: "active",
      legalStatus: "ACTIVE",
      confidence: "HIGH",
      sourceEvidence: [
        {
          sourceDocumentId: "SYNTH-KA-4W-CAB-2026",
          sourceTitle: "Synthetic: 4W Cab Rate Revision",
          sourceType: "NOTIFICATION",
          section: "Section 24 read with Section 4(2)",
          clause: "Clauses 1, 2 & 6",
          quotedExcerpt:
            "For motor cabs (Four-Wheeler / 4W) engaged in passenger ride-hailing services, the welfare cess rate shall be revised from 1.0% to 1.5% of net driver payout, with maximum cap revised from ₹1.00 to ₹1.50.",
          sourceUrl: "https://labour.karnataka.gov.in/gazette-pwfvs/LD-KBWWB-CR-2026-09",
        },
      ],
      verificationStatus: "proposed",
      sourceDocumentTitle: change.sourceDocumentTitle,
      sourceGazetteRef: "KAG-2026-DRAFT-09",
      sourceNotificationNo: "LD-KBWWB-CR-2026/09",
      sourceDocumentDate: "2026-09-01",
      sourceDocumentUrl: "https://labour.karnataka.gov.in/gazette-pwfvs/LD-KBWWB-CR-2026-09",
      verifiedAt: new Date().toISOString(),
      verifiedByName: this.activeUser.name,
      interpretationNotes:
        "Approved from AI Change Monitor. 1.5% fee with ₹1.50 cap for 4W passenger ride-hailing, scheduled for 01-Oct-2026.",
      reportingFrequency: "quarterly",
      registrationWindowDays: 30,
      workerUpdateWindowDays: 15,
      isEVOnly: false,
    };

    this.ruleVersions.push(newRule);

    this.logAudit(
      AUDIT_ACTIONS.REG_CHANGE_APPROVED,
      "regulatory_change",
      changeId,
      `Approved regulatory change [${change.title}]. Generated Rule Version ${newVersionCode} with lifecycle_status='approved'.`
    );

    return newRule;
  }

  /**
   * Deterministic Batch Impact Simulation over 5,000 Transactions
   */
  public simulateRegulatoryImpact(proposedRule: ProposedRuleExtraction) {
    return simulateBatchImpact(this.transactions, proposedRule);
  }

  /**
   * Traceable Provenance & Rule Binding Inspector for any single Transaction
   */
  public getTransactionProvenance(transactionId: string) {
    const txn = this.transactions.find((t) => t.transactionId === transactionId);
    if (!txn) return null;

    const calc = this.calculatedItems.find((c) => c.transactionId === transactionId);
    const rule = this.ruleVersions.find((r) => r.versionCode === calc?.ruleVersionCode) || this.ruleVersions[2];

    return {
      transaction: txn,
      calculation: calc,
      appliedRule: rule,
      evidence: rule.sourceEvidence,
      legalStatus: rule.legalStatus,
      confidence: rule.confidence,
    };
  }

  // ── Audit Logging ─────────────────────────────────────────────────────────

  private initAuditLogs(): DemoAuditLog[] {
    // Historical log entries for the sample dataset import.
    // Automated system events use "System" as the actor.
    return [
      {
        id: "aud-01",
        organizationId: "org-quickride-001",
        userName: "Vaishnavi Dwivedi",
        userRole: "compliance_manager",
        action: AUDIT_ACTIONS.BATCH_UPLOADED,
        entityType: "upload_batch",
        entityId: "batch-ka-2026-q2",
        details: "Sample Data Import: Karnataka Q2 platform transaction dataset (5,000 records) loaded into workspace.",
        createdAt: "2026-09-02T08:10:00Z",
      },
      {
        id: "aud-02",
        organizationId: "org-quickride-001",
        userName: "System",
        userRole: "system",
        action: AUDIT_ACTIONS.CALCULATION_RUN_COMPLETED,
        entityType: "calculation_run",
        entityId: "calc-run-001",
        details: "Automated fee calculations completed across 5,000 transactions using Karnataka rule versions KA-2026-02.",
        createdAt: "2026-09-02T08:15:00Z",
      },
      {
        id: "aud-03",
        organizationId: "org-quickride-001",
        userName: "System",
        userRole: "system",
        action: AUDIT_ACTIONS.LEDGER_BATCH_UPLOADED,
        entityType: "upload_batch",
        entityId: "batch-ledger-aug26",
        details: "Sample Data Import: Finance Ledger dataset (4,995 rows) loaded into workspace for reconciliation.",
        createdAt: "2026-09-02T09:00:00Z",
      },
      {
        id: "aud-04",
        organizationId: "org-quickride-001",
        userName: "System",
        userRole: "system",
        action: AUDIT_ACTIONS.RECON_RUN_COMPLETED,
        entityType: "reconciliation_run",
        entityId: "recon-run-001",
        details: "Four-column reconciliation completed: 4,925 exact matches (98.4% match rate), 61 financial discrepancies (28 fee, 25 payout, 8 full), 21 integrity exceptions (12 missing, 5 unexpected, 4 duplicate) across 5,007 total reconciliation entries.",
        createdAt: "2026-09-02T09:12:00Z",
      },
    ];
  }

  public logAudit(action: string, entityType: string, entityId: string, details: string) {
    this.auditLogs.unshift({
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      organizationId: this.org.id,
      userName: this.activeUser.name,
      userRole: this.activeUser.role,
      action,
      entityType,
      entityId,
      details,
      createdAt: new Date().toISOString(),
    });
    // Mirror to provenance log for regulatory events
    if (entityType === "regulatory_change" || entityType === "rule_version") {
      this.provenanceLog.push({
        id: `prov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        eventType: action.includes("approved") ? "human_approved" : action.includes("rejected") ? "human_rejected" : "rule_activated",
        proposedRuleId: entityId,
        actor: this.activeUser.name,
        timestamp: new Date().toISOString(),
        note: details,
      });
    }
  }
}

// Global Singleton (survives hot reload in development)
// STORE_VERSION: bump whenever the DemoStore constructor shape changes
// to force a fresh instance (avoids stale singleton with missing fields).
const STORE_VERSION = "v2.1-regulatoryEvents";
const globalForStore = globalThis as unknown as {
  demoStore?: DemoStore;
  demoStoreVersion?: string;
};

if (globalForStore.demoStoreVersion !== STORE_VERSION) {
  // Schema changed — discard stale singleton
  delete globalForStore.demoStore;
  globalForStore.demoStoreVersion = STORE_VERSION;
}

export const demoStore = globalForStore.demoStore ?? new DemoStore();
if (process.env.NODE_ENV !== "production") globalForStore.demoStore = demoStore;
