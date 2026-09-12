/**
 * GigShield Extraction Schema Validation Gate
 *
 * Mandatory gate between Gemini AI output and the deterministic impact engine.
 * AI extraction output MUST pass this validation before reaching the engine.
 *
 * What this validates:
 * - All required fields are present and correctly typed
 * - proposedRate is a number between 0 and 1 (0–100%)
 * - proposedCap is null or a positive number
 * - effectiveDate is a valid ISO date in YYYY-MM-DD format
 *   NOTE: Past dates are NOT rejected — regulatory documents can describe rules
 *   that already became effective or are being analysed retrospectively.
 *   The legal-operational state (EXPIRED, SUPERSEDED, ACTIVE) handles temporal status.
 * - jurisdiction is a known state code
 * - sector is a known sector value
 * - evidence array is non-empty
 * - aiConfidence is HIGH, MEDIUM or LOW — numeric scores are rejected
 * - schemaValid flag is set by this gate, never by AI
 */

import type { ProposedRuleExtraction, AIConfidence } from "../engines/regulatory-types";

const KNOWN_JURISDICTIONS = ["KA", "Karnataka (KA)", "MH", "DL", "TN", "TS", "UP"];
const KNOWN_SECTORS = ["ride-hailing", "food-delivery", "logistics", "e-marketplace", "professional-services"];
const VALID_CONFIDENCE_LEVELS: AIConfidence[] = ["HIGH", "MEDIUM", "LOW"];

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateExtraction(
  raw: Partial<ProposedRuleExtraction>
): ValidationResult {
  const errors: string[] = [];

  // Required string fields
  if (!raw.id || typeof raw.id !== "string" || raw.id.trim() === "") {
    errors.push("Field 'id' is required and must be a non-empty string.");
  }
  if (!raw.documentTitle || typeof raw.documentTitle !== "string") {
    errors.push("Field 'documentTitle' is required.");
  }
  if (!raw.sourceType) {
    errors.push("Field 'sourceType' is required.");
  }
  if (!raw.jurisdiction || typeof raw.jurisdiction !== "string") {
    errors.push("Field 'jurisdiction' is required.");
  } else {
    const knownJurisdiction = KNOWN_JURISDICTIONS.some(
      (j) => raw.jurisdiction!.toUpperCase().includes(j.toUpperCase()) || j.toUpperCase().includes(raw.jurisdiction!.toUpperCase())
    );
    if (!knownJurisdiction) {
      errors.push(
        `Jurisdiction '${raw.jurisdiction}' is not in the known jurisdiction list: ${KNOWN_JURISDICTIONS.join(", ")}.`
      );
    }
  }
  if (!raw.sector || typeof raw.sector !== "string") {
    errors.push("Field 'sector' is required.");
  } else if (!KNOWN_SECTORS.includes(raw.sector)) {
    errors.push(
      `Sector '${raw.sector}' is not a known sector. Expected one of: ${KNOWN_SECTORS.join(", ")}.`
    );
  }

  // proposedRate: must be a number between 0 and 1
  if (typeof raw.proposedRate !== "number") {
    errors.push("Field 'proposedRate' must be a number.");
  } else if (raw.proposedRate < 0 || raw.proposedRate > 1) {
    errors.push(
      `Field 'proposedRate' must be between 0 and 1 (representing 0–100%). Got: ${raw.proposedRate}.`
    );
  }

  // proposedCap: null or positive number
  if (raw.proposedCap !== null && raw.proposedCap !== undefined) {
    if (typeof raw.proposedCap !== "number" || raw.proposedCap <= 0) {
      errors.push("Field 'proposedCap' must be null or a positive number.");
    }
  }

  // effectiveDate: valid ISO date format YYYY-MM-DD
  // IMPORTANT: past dates are NOT rejected — regulatory analysis is retrospective.
  if (!raw.effectiveDate || typeof raw.effectiveDate !== "string") {
    errors.push("Field 'effectiveDate' is required.");
  } else if (!ISO_DATE_REGEX.test(raw.effectiveDate)) {
    errors.push(
      `Field 'effectiveDate' must be a valid ISO date string in YYYY-MM-DD format. Got: '${raw.effectiveDate}'.`
    );
  } else {
    // Validate that it parses to a real calendar date
    const date = new Date(raw.effectiveDate);
    if (isNaN(date.getTime())) {
      errors.push(`Field 'effectiveDate' does not parse to a valid date: '${raw.effectiveDate}'.`);
    }
  }

  // evidence: must be non-empty array
  if (!Array.isArray(raw.evidence) || raw.evidence.length === 0) {
    errors.push(
      "Field 'evidence' must be a non-empty array. At least one evidence citation is required."
    );
  }

  // confidence: must be HIGH, MEDIUM, or LOW — numeric scores are explicitly rejected
  if (!raw.confidence) {
    errors.push("Field 'confidence' is required.");
  } else if (typeof raw.confidence === "number") {
    errors.push(
      `Field 'confidence' must not be a numeric score. Use 'HIGH', 'MEDIUM', or 'LOW'. Got numeric value: ${raw.confidence}.`
    );
  } else if (!VALID_CONFIDENCE_LEVELS.includes(raw.confidence as AIConfidence)) {
    errors.push(
      `Field 'confidence' must be one of: ${VALID_CONFIDENCE_LEVELS.join(", ")}. Got: '${raw.confidence}'.`
    );
  }

  // Required arrays
  if (!Array.isArray(raw.changeHighlights)) {
    errors.push("Field 'changeHighlights' must be an array.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Apply validation result to extraction object.
 * Returns a new object with schemaValid and schemaValidationErrors populated.
 */
export function applyValidation(
  extraction: Partial<ProposedRuleExtraction>
): ProposedRuleExtraction {
  const result = validateExtraction(extraction);
  return {
    ...extraction,
    schemaValid: result.valid,
    schemaValidationErrors: result.errors,
  } as ProposedRuleExtraction;
}
