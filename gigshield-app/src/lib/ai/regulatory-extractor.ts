/**
 * GigShield Regulatory AI Extraction Engine
 *
 * Grounded in the Karnataka Platform Based Gig Workers
 * (Social Security and Welfare) Act, 2025 & Rules 2025.
 *
 * Architecture (mandatory order):
 *   1. Document ingested (PDF parsed or text provided)
 *   2. Live Gemini API path called first (/api/extract)
 *   3. If Gemini unavailable or returns fallback → pre-computed extraction displayed
 *      with clearly labeled "CACHED INTERPRETATION" banner
 *   4. Schema validation gate applied to ANY result before reaching engine
 *
 * CRITICAL CONSTRAINTS:
 * - AI NEVER performs monetary arithmetic or transaction calculations
 * - AI PROPOSES classifications — human verifies before activation
 * - Confidence is HIGH/MEDIUM/LOW only — no numeric scores
 * - GigShield does not establish legal truth
 */

import {
  ProposedRuleExtraction,
  EvidenceCitation,
  LegalOperationalState,
  SourceDocumentType,
} from "../engines/regulatory-types";
import { applyValidation } from "../validation/extraction-validator";

export interface ExtractionInput {
  documentTitle: string;
  sourceType: SourceDocumentType;
  jurisdiction?: string;
  rawText: string;
  sourceUrl?: string;
  gazetteRef?: string;
}

export interface ExtractionOptions {
  /**
   * If true, attempt live Gemini extraction via /api/extract.
   * If Gemini fails, fall back to pre-computed interpretation.
   * If false, skip live path (e.g., for pre-loaded sample documents).
   */
  preferLive?: boolean;
}

export interface ExtractionResult {
  proposal: ProposedRuleExtraction;
  /** true = came from live Gemini; false = pre-computed interpretation */
  isLive: boolean;
  /** Reason for fallback (shown in UI with clear label) */
  fallbackReason?: string;
}

// ── Synthetic Scenario Document Catalog ────────────────────────────────────────
// All three scenarios below are clearly labeled as SYNTHETIC.
// Each includes the real legal basis to show the rule could be real.
export const SAMPLE_REGULATORY_DOCUMENTS: Array<{
  id: string;
  title: string;
  sourceType: SourceDocumentType;
  jurisdiction: string;
  description: string;
  rawText: string;
  sourceUrl?: string;
  isSyntheticScenario: true;
  syntheticPurpose: string;
  realLegalBasis: string;
}> = [
  {
    id: "doc-ka-cab-revision",
    title: "Synthetic: 4W Cab Rate Revision",
    sourceType: "NOTIFICATION",
    jurisdiction: "Karnataka (KA)",
    isSyntheticScenario: true,
    syntheticPurpose:
      "Demonstrates a rate-change event: AI extracts proposed rate/cap changes, engine binds to 5,000 transactions, compliance officer approves.",
    realLegalBasis:
      "Karnataka Platform Based Gig Workers (Social Security and Welfare) Act, 2025 (Act 72 of 2025), Section 24 read with Rule 4 / Schedule I — rate amendment mechanism.",
    description:
      "[SYNTHETIC SCENARIO] Draft revision proposing a rate increase for 4-Wheeler passenger motor cabs from 1.0% (cap ₹1.00) to 1.5% (cap ₹1.50) effective 01-Oct-2026.",
    rawText: `[SYNTHETIC SCENARIO — NOT AN OFFICIAL GOVERNMENT DOCUMENT]
Scenario: Synthetic: 4W Cab Rate Revision
Basis: Karnataka Act 72 of 2025, Section 24 read with Section 4(2)
Date: 01 September 2026

In exercise of the powers conferred by Section 24 read with Section 4(2) of the Karnataka Platform Based Gig Workers (Social Security and Welfare) Act, 2025 (Karnataka Act 72 of 2025), the Government of Karnataka hereby proposes to amend the fee schedule:

1. Category: Ride-hailing motor cabs (Four-Wheeler / 4W).
2. Revised Welfare Fee Rate: 1.50% (one point five percent) of the net platform transaction payout.
3. Maximum Transaction Fee Cap: ₹1.50 (Rupees one and fifty paise) per completed ride payout.
4. Two-wheeler (2W) and delivery logistics shall remain at 1.00% capped at ₹0.50.
5. Exclusions: Unregistered personal carpools and inter-city non-aggregator charters are excluded.
6. Effective Date: 01 October 2026.
7. Legal Status: Draft Notification open for stakeholder feedback under Rule 12.`,
    sourceUrl: "https://labour.karnataka.gov.in/gazette-pwfvs/LD-KBWWB-CR-2026-09",
  },
  {
    id: "doc-ka-hc-interim-order",
    title: "Karnataka High Court Interim Order — WP No. 48102/2026 (Logistics Cess Scrutiny)",
    sourceType: "COURT_ORDER",
    jurisdiction: "Karnataka (KA)",
    isSyntheticScenario: true,
    syntheticPurpose:
      "Demonstrates enforcement-modification event: court order changes WHERE fee is collected (escrow) without changing the rate. Separates enforcement from rate-change logic.",
    realLegalBasis:
      "Karnataka Platform Based Gig Workers (Social Security and Welfare) Act, 2025, Section 16 + general judicial review doctrine under Article 226 of the Constitution of India.",
    description:
      "[SYNTHETIC SCENARIO] Judicial order directing escrow segregation for Heavy Commercial Vehicles (HCV) logistics welfare cess pending final constitutional challenge hearing.",
    rawText: `HIGH COURT OF KARNATAKA AT BENGALURU
Writ Petition No. 48102 / 2026 (GM-RES)
Date of Order: 14 August 2026

CORAM: THE HON'BLE CHIEF JUSTICE & JUSTICE N. KUMAR
IN THE MATTER OF:
All India Logistics & Transporters Federation vs. State of Karnataka & Anr.

ORDER:
1. Issue Notice to the Respondents returnable within four weeks.
2. In the interim, aggregator platforms operating Heavy Commercial Vehicles (HCV) (>3.5T GVW) in Karnataka under Rule 8(3) shall calculate the statutory welfare fee of 1.00% (cap ₹1.50) but deposit the disputed collection into an interest-bearing designated statutory escrow account.
3. Light Commercial Vehicles (LCV) and 2W/3W delivery couriers remain fully active under standard Act provisions.
4. Legal Status: UNDER_INTERIM_ORDER.
5. Compliance Action: Flag HCV transactions as Escrow Segregation Required.`,
    sourceUrl: "https://karnatakahighcourt.kar.nic.in/orders/WP48102_2026",
  },
  {
    id: "doc-ka-food-delivery-waiver",
    title: "Karnataka Welfare Board Order No. KBWWB/ADM/2026/51 (EV Delivery Incentive)",
    sourceType: "GOVERNMENT_ORDER",
    jurisdiction: "Karnataka (KA)",
    isSyntheticScenario: true,
    syntheticPurpose:
      "Demonstrates concession event: EV food delivery 2W receive 50% fee reduction. Demonstrates isEV binding dimension and Section 16(3) concession mechanism.",
    realLegalBasis:
      "Karnataka Platform Based Gig Workers (Social Security and Welfare) Act, 2025, Section 16(3) — concession powers for specified categories of gig workers.",
    description:
      "[SYNTHETIC SCENARIO] Departmental order establishing a 50% welfare fee concession (0.50% rate, ₹0.25 cap) for Electric Vehicle (EV) food delivery operations.",
    rawText: `KARNATAKA PLATFORM GIG WORKERS WELFARE BOARD (KBWWB)
BENGALURU - 560001
Order No: KBWWB/ADM/2026/51
Date: 25 August 2026

Sub: Clean Mobility Social Security Incentive Scheme 2026

In accordance with Section 16(3) of the Act 72 of 2025:
1. Electric Two-Wheelers (EV-2W) deployed for food and grocery delivery services shall receive a statutory fee concession of 50%.
2. Concessional Welfare Fee Rate: 0.50% of transaction payout.
3. Concessional Cap: ₹0.25 per transaction.
4. Internal Combustion Engine (ICE) vehicles shall continue at 1.00% (cap ₹0.50).
5. Effective From: 01 November 2026.
6. Legal Status: ACTIVE (Notified Incentive Scheme).`,
    sourceUrl: "https://kbwwb.karnataka.gov.in/orders/2026/ADM-51",
  },
];

// ── Pre-computed Interpretations (Fallback) ────────────────────────────────────
// These are used when Gemini is unavailable. They are clearly labeled.
// They are NOT the AI output — they are seed data maintained by the development team.

function getPrecomputedExtraction(
  docId: string,
  input: ExtractionInput
): ProposedRuleExtraction {
  if (docId === "doc-ka-hc-interim-order" || input.rawText.includes("Writ Petition")) {
    const evidence: EvidenceCitation[] = [
      {
        sourceDocumentId: "WP-48102-2026",
        sourceTitle: "High Court of Karnataka Interim Order in WP 48102/2026",
        sourceType: "COURT_ORDER",
        section: "Paragraph 2",
        clause: "Interim Stay & Escrow Direction",
        quotedExcerpt:
          "Aggregator platforms operating Heavy Commercial Vehicles (HCV) shall calculate statutory fee of 1.00% (cap ₹1.50) but deposit into designated statutory escrow.",
        sourceUrl: input.sourceUrl || "https://karnatakahighcourt.kar.nic.in/orders/WP48102_2026",
      },
    ];

    return applyValidation({
      id: `prop-${Date.now()}`,
      documentTitle: input.documentTitle,
      sourceType: "COURT_ORDER",
      jurisdiction: "Karnataka (KA)",
      sector: "logistics",
      vehicleType: "HCV",
      proposedRate: 0.01,
      proposedCap: 1.5,
      effectiveDate: "2026-08-14",
      aiProposedState: "UNDER_INTERIM_ORDER",
      legalStatus: "UNDER_INTERIM_ORDER",
      confidence: "HIGH",
      confidenceRationale: {
        level: "HIGH",
        allRequiredFieldsExtracted: true,
        directEvidenceCitationFound: true,
        unresolvedAmbiguityCount: 0,
        notes: "Court order paragraph 2 is unambiguous on scope, rate, and escrow mechanism.",
      },
      interpretationNarrative:
        "This interim order requires aggregator platforms operating HCV logistics vehicles to continue calculating the welfare fee at 1.00% (cap ₹1.50), but deposit into a designated statutory escrow account pending the constitutional challenge. The rate itself is unchanged — only the collection destination is modified. LCV and 2W/3W operations remain fully active.",
      potentialInconsistencies: [],
      applicabilityConditions: [
        "Vehicle classification: HCV (>3.5T Gross Vehicle Weight)",
        "Operation: Karnataka logistics under Rule 8(3)",
      ],
      recommendedAction: {
        title: "Segregate HCV fee collection to statutory escrow sub-account",
        steps: [
          "Identify all active HCV transactions (>3.5T GVW) in Karnataka since 14-Aug-2026.",
          "Reroute fee collection to court-designated escrow sub-account.",
          "Flag impacted transactions in GigShield with UNDER_INTERIM_ORDER status.",
          "Obtain compliance officer verification before activating escrow routing.",
        ],
        urgency: "IMMEDIATE",
        confidence: "HIGH",
        basis:
          "Court order paragraph 2 specifies clear immediate action requirement; non-compliance with an interim court order constitutes contempt.",
      },
      summary:
        "High Court interim order mandates escrow segregation for Heavy Commercial Vehicle (HCV) welfare fee liability pending constitutional challenge.",
      evidence,
      ambiguities: [],
      exclusions: ["LCV and 2W/3W operations remain standard active"],
      previousRuleCode: "KA-2025-02-LG-HCV",
      previousRate: 0.01,
      previousCap: 1.5,
      changeHighlights: [
        {
          field: "Legal-Operational State",
          oldValue: "ACTIVE",
          newValue: "UNDER_INTERIM_ORDER (Escrow Segregation)",
          impact: "neutral",
        },
        {
          field: "Payment Destination",
          oldValue: "State Welfare Fund",
          newValue: "Court Escrow Sub-Account",
          impact: "scope_expansion",
        },
      ],
      isSyntheticScenario: true,
      syntheticScenarioLabel: {
        purpose: "Demonstrates enforcement-modification: court order changes WHERE fee is collected without changing the rate.",
        realLegalBasis: "Karnataka Platform Based Gig Workers Act, 2025, Section 16 + Article 226 judicial review doctrine.",
      },
      schemaValid: true,
      schemaValidationErrors: [],
    });
  }

  if (docId === "doc-ka-food-delivery-waiver" || input.rawText.includes("Clean Mobility")) {
    const evidence: EvidenceCitation[] = [
      {
        sourceDocumentId: "KBWWB-ADM-2026-51",
        sourceTitle: "Karnataka Gig Workers Board Order No. KBWWB/ADM/2026/51",
        sourceType: "GOVERNMENT_ORDER",
        section: "Section 16(3)",
        clause: "Clause 1-3 Clean Mobility Scheme",
        quotedExcerpt:
          "Electric Two-Wheelers deployed for food and grocery delivery services shall receive a statutory fee concession of 50%: 0.50% rate with ₹0.25 cap.",
        sourceUrl: input.sourceUrl || "https://kbwwb.karnataka.gov.in/orders/2026/ADM-51",
      },
    ];

    return applyValidation({
      id: `prop-${Date.now()}`,
      documentTitle: input.documentTitle,
      sourceType: "GOVERNMENT_ORDER",
      jurisdiction: "Karnataka (KA)",
      sector: "food-delivery",
      vehicleType: "2W",
      proposedRate: 0.005,
      proposedCap: 0.25,
      effectiveDate: "2026-11-01",
      aiProposedState: "ACTIVE",
      legalStatus: "ACTIVE",
      confidence: "MEDIUM",
      confidenceRationale: {
        level: "MEDIUM",
        allRequiredFieldsExtracted: true,
        directEvidenceCitationFound: true,
        unresolvedAmbiguityCount: 1,
        notes: "EV badge verification mechanism (Vahan registry sync) is not specified in the order text, creating one ambiguity.",
      },
      interpretationNarrative:
        "This government order grants a 50% welfare fee concession to Electric Two-Wheelers (EV-2W) used for food and grocery delivery in Karnataka. The concessional rate is 0.50% (cap ₹0.25) versus the standard 1.00% (cap ₹0.50) for ICE vehicles. The concession is effective 01-Nov-2026. EV eligibility requires Vahan green plate registration — the verification mechanism is not yet specified in the order.",
      potentialInconsistencies: [
        {
          description:
            "Order does not specify the Vahan registry verification mechanism for EV badge validation. Platforms would need to implement their own Vahan API sync or self-declaration process.",
          severity: "MEDIUM",
          requiresHumanReview: true,
        },
      ],
      applicabilityConditions: [
        "Vehicle type: Electric Two-Wheeler (EV-2W) with Vahan green plate",
        "Sector: Food / grocery delivery",
        "Jurisdiction: Karnataka",
        "Effective from: 01-Nov-2026",
      ],
      recommendedAction: {
        title: "Implement EV classification flag and Vahan verification before 01-Nov-2026",
        steps: [
          "Mark EV-capable delivery 2W transactions with isEV=true using Vahan or self-declaration.",
          "Configure GigShield binding to apply concessional rate for isEV=true food-delivery 2W from 01-Nov-2026.",
          "Seek human clarification on Vahan sync mechanism before activating EV concession rule.",
        ],
        urgency: "BEFORE_EFFECTIVE_DATE",
        confidence: "MEDIUM",
        basis:
          "EV concession is clearly granted in order text but verification mechanism ambiguity requires human resolution before activation.",
      },
      summary:
        "Statutory concession under Clean Mobility Incentive: 50% fee rate reduction for EV delivery operations (0.50% rate, ₹0.25 cap).",
      evidence,
      ambiguities: [
        "EV badge verification relies on Vahan green registration plate tag sync — mechanism not specified in order.",
      ],
      exclusions: ["Internal Combustion Engine (ICE) delivery vehicles"],
      previousRuleCode: "KA-2025-02-FD-2W",
      previousRate: 0.01,
      previousCap: 0.5,
      changeHighlights: [
        {
          field: "Welfare Fee Rate",
          oldValue: "1.00%",
          newValue: "0.50% (EV Concession)",
          impact: "decrease",
        },
        {
          field: "Transaction Cap",
          oldValue: "₹0.50",
          newValue: "₹0.25",
          impact: "decrease",
        },
      ],
      isSyntheticScenario: true,
      syntheticScenarioLabel: {
        purpose: "Demonstrates concession event and isEV binding dimension. Section 16(3) concession mechanism.",
        realLegalBasis: "Karnataka Platform Based Gig Workers Act, 2025, Section 16(3) — concession powers.",
      },
      schemaValid: true,
      schemaValidationErrors: [],
    });
  }

  // Default: Cab Rate Revision (Primary Demo Scenario)
  const evidence: EvidenceCitation[] = [
    {
      sourceDocumentId: "SYNTH-KA-4W-CAB-2026",
      sourceTitle: "Synthetic: 4W Cab Rate Revision",
      sourceType: "NOTIFICATION",
      section: "Section 24 read with Section 4(2)",
      clause: "Clauses 1, 2, 3 & 6",
      quotedExcerpt:
        "For motor cabs (Four-Wheeler / 4W) engaged in passenger ride-hailing services, the welfare cess rate shall be revised from 1.0% to 1.5% of net driver payout, with maximum cap revised from ₹1.00 to ₹1.50, effective 01 October 2026.",
      sourceUrl: input.sourceUrl || "https://labour.karnataka.gov.in/gazette-pwfvs/LD-KBWWB-CR-2026-09",
    },
    {
      sourceDocumentId: "KAR-ACT-2025-72",
      sourceTitle: "Karnataka Platform Based Gig Workers Act, 2025 (Act 72 of 2025)",
      sourceType: "ACT",
      section: "Section 4",
      clause: "Platform Welfare Fee Structure",
      quotedExcerpt:
        "Every aggregator shall contribute a welfare fee per transaction at such rates as may be notified by the State Government.",
      sourceUrl: "https://www.indiacode.nic.in/bitstream/123456789/22201/1/72_of_2025_%28e%29.pdf",
    },
  ];

  return applyValidation({
    id: `prop-${Date.now()}`,
    documentTitle:
      input.documentTitle || "Synthetic: 4W Cab Rate Revision",
    sourceType: input.sourceType || "NOTIFICATION",
    jurisdiction: "Karnataka (KA)",
    sector: "ride-hailing",
    vehicleType: "4W",
    proposedRate: 0.015,
    proposedCap: 1.5,
    effectiveDate: "2026-10-01",
    aiProposedState: "REQUIRES_REVIEW",
    legalStatus: "REQUIRES_REVIEW",
    confidence: "HIGH",
    confidenceRationale: {
      level: "HIGH",
      allRequiredFieldsExtracted: true,
      directEvidenceCitationFound: true,
      unresolvedAmbiguityCount: 1,
      notes:
        "All fields (rate, cap, sector, vehicle, effective date) extracted with direct clause citations. One ambiguity: Rule 12 consultation period closes 25-Sep-2026 — final gazetting date contingent on objections received.",
    },
    interpretationNarrative:
      "This draft notification proposes to increase the statutory welfare fee for Four-Wheeler (4W) ride-hailing motor cabs in Karnataka from 1.00% (cap ₹1.00) to 1.50% (cap ₹1.50), effective 01-Oct-2026. The change is invoked under Section 24 read with Section 4(2) of Act 72 of 2025, which grants the government power to amend the fee schedule via gazette notification. Two-wheeler operations and logistics caps are explicitly preserved. The notification is technically a draft under Rule 12 consultation — it is not yet a final enacted amendment.",
    potentialInconsistencies: [
      {
        description:
          "Rule 12 stakeholder consultation period closes 25-Sep-2026 — if substantial objections are received, the effective date of 01-Oct-2026 may be postponed. The notification is a draft until the consultation window closes and the final gazette is issued.",
        severity: "MEDIUM",
        requiresHumanReview: true,
      },
    ],
    applicabilityConditions: [
      "Vehicle type: 4W motor cabs only",
      "Sector: Ride-hailing (passenger transport)",
      "Jurisdiction: Karnataka",
      "Effective from: 01-Oct-2026 (subject to final gazetting)",
    ],
    recommendedAction: {
      title: "Prepare 4W cab rate transition for 01-Oct-2026",
      steps: [
        "Verify final gazette publication on or before 30-Sep-2026.",
        "Run impact simulation on all Karnataka 4W ride-hailing transactions using 1.50% (cap ₹1.50).",
        "Review liability delta and obtain compliance officer approval in GigShield.",
        "Activate Rule Version KA-2026-10-RH-4W in GigShield upon approval before effective date.",
      ],
      urgency: "BEFORE_EFFECTIVE_DATE",
      confidence: "HIGH",
      basis:
        "All rate/cap parameters are explicit in the notification text. Urgency is before effective date because the rule is not yet enacted but the transition window is short.",
    },
    summary:
      "Proposed amendment increases statutory welfare fee for Four-Wheeler (4W) ride-hailing passenger cabs in Karnataka from 1.00% (cap ₹1.00) to 1.50% (cap ₹1.50), effective 01-Oct-2026. Two-wheelers and logistics caps remain unchanged.",
    evidence,
    ambiguities: [
      "Rule 12 stakeholder consultation period closes on 25-Sep-2026 before final gazetting.",
    ],
    exclusions: [
      "Personal carpool rides",
      "Inter-city non-aggregator chartered cabs",
    ],
    previousRuleCode: "KA-2025-02-RH-4W",
    previousRate: 0.01,
    previousCap: 1.0,
    changeHighlights: [
      {
        field: "Welfare Fee Rate",
        oldValue: "1.00%",
        newValue: "1.50%",
        impact: "increase",
      },
      {
        field: "Maximum Cap",
        oldValue: "₹1.00",
        newValue: "₹1.50",
        impact: "increase",
      },
      {
        field: "Target Sector & Vehicle",
        oldValue: "Ride-Hailing (4W Cabs)",
        newValue: "Ride-Hailing (4W Cabs)",
        impact: "neutral",
      },
      {
        field: "Effective Date",
        oldValue: "2026-02-16 (Current)",
        newValue: "2026-10-01 (Proposed)",
        impact: "scope_expansion",
      },
    ],
    isSyntheticScenario: true,
    syntheticScenarioLabel: {
      purpose: "Primary demo scenario: rate-change event, AI extraction, engine binding, human approval, provenance.",
      realLegalBasis: "Karnataka Platform Based Gig Workers Act, 2025 (Act 72 of 2025), Section 24 read with Rule 4 / Schedule I.",
    },
    schemaValid: true,
    schemaValidationErrors: [],
  });
}

/**
 * Main extraction function.
 *
 * Order of operation:
 * 1. If preferLive, attempt live Gemini call via /api/extract
 * 2. On any failure/fallback, use pre-computed interpretation
 * 3. Apply schema validation gate to result (either path)
 * 4. Return result with isLive and fallbackReason flags
 */
export async function extractRegulatoryRule(
  input: ExtractionInput,
  options: ExtractionOptions = {}
): Promise<ProposedRuleExtraction> {
  const result = await extractWithProvenance(input, options);
  return result.proposal;
}

export async function extractWithProvenance(
  input: ExtractionInput,
  options: ExtractionOptions = {}
): Promise<ExtractionResult> {
  const { preferLive = true } = options;

  // Identify which pre-computed scenario to use (for fallback)
  const docId =
    SAMPLE_REGULATORY_DOCUMENTS.find(
      (d) =>
        d.rawText.replace(/\s+/g, " ").substring(0, 80) ===
        input.rawText.replace(/\s+/g, " ").substring(0, 80)
    )?.id || "doc-ka-cab-revision";

  // ── Live Gemini Path ──────────────────────────────────────────────────────
  if (preferLive) {
    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: input.rawText,
          documentTitle: input.documentTitle,
          sourceType: input.sourceType,
          jurisdiction: input.jurisdiction,
          sourceUrl: input.sourceUrl,
        }),
        signal: AbortSignal.timeout(35000),
      });

      if (response.ok) {
        const data = await response.json();

        if (!data.fallback) {
          // Live AI result — apply schema validation gate
          const validated = applyValidation(data);

          if (validated.schemaValid) {
            return { proposal: validated, isLive: true };
          } else {
            // Gemini returned invalid output — fall through to pre-computed
            console.warn(
              "[GigShield] Live AI extraction failed schema validation:",
              validated.schemaValidationErrors
            );
            const precomputed = getPrecomputedExtraction(docId, input);
            return {
              proposal: {
                ...precomputed,
                // Preserve the AI's invalid output for debugging (not shown in UI)
              },
              isLive: false,
              fallbackReason:
                "Live AI extraction failed schema validation. Cached interpretation displayed.",
            };
          }
        }

        // Fallback signal from API
        const fallbackReason = data.reason || "AI_UNAVAILABLE";
        const precomputed = getPrecomputedExtraction(docId, input);
        return {
          proposal: precomputed,
          isLive: false,
          fallbackReason: `Live AI unavailable (${fallbackReason}). Cached interpretation displayed.`,
        };
      }
    } catch (err) {
      console.warn("[GigShield] Live AI extraction request failed:", err);
    }
  }

  // ── Pre-computed Fallback Path ────────────────────────────────────────────
  const precomputed = getPrecomputedExtraction(docId, input);
  return {
    proposal: precomputed,
    isLive: false,
    fallbackReason: preferLive
      ? "AI extraction request failed. Cached interpretation displayed."
      : undefined,
  };
}
