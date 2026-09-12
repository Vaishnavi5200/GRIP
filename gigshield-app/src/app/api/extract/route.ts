/**
 * GRIP AI Regulatory Extraction API Route
 *
 * POST /api/extract
 *
 * Accepts: { rawText, documentTitle, sourceType }
 * Returns: ProposedRuleExtraction JSON
 *
 * Architecture:
 *   1. Calls Gemini 1.5 Flash with structured output prompt
 *   2. Receives JSON response
 *   3. Schema validation gate applied
 *   4. Returns validated ProposedRuleExtraction
 *
 * On Gemini error → returns { fallback: true }
 * Client must detect this and display: "AI extraction unavailable — cached interpretation displayed."
 *
 * AI CRITICAL CONSTRAINT:
 * - AI interprets the regulation and proposes structured output
 * - AI NEVER performs monetary arithmetic
 * - AI NEVER establishes legal truth — it proposes; human verifies
 * - All numeric confidence scores are rejected — only HIGH/MEDIUM/LOW
 */

import { NextRequest, NextResponse } from "next/server";
import { applyValidation } from "@/lib/validation/extraction-validator";
import type { SourceDocumentType } from "@/lib/engines/regulatory-types";

interface ExtractRequestBody {
  rawText: string;
  documentTitle: string;
  sourceType?: SourceDocumentType;
  jurisdiction?: string;
  sourceUrl?: string;
}

const GEMINI_PROMPT = (input: ExtractRequestBody) => `
You are a regulatory intelligence specialist for the Karnataka Platform Based Gig Workers (Social Security and Welfare) Act, 2025 (Act 72 of 2025) and Karnataka Rules, 2025.

Your task is to read the following regulatory document text and extract a structured interpretation.

CRITICAL CONSTRAINTS:
1. You NEVER perform monetary arithmetic or transaction calculations. You only extract parameters.
2. You PROPOSE a legal-operational classification — you do NOT establish legal truth.
3. All confidence levels must be exactly "HIGH", "MEDIUM", or "LOW" — no numeric scores.
4. HIGH = all required fields extracted + at least one direct evidence citation + no unresolved ambiguities
5. MEDIUM = required fields extracted, but indirect citation OR at least one ambiguity flagged
6. LOW = one or more required fields missing, or instrument type unclear, or conflicting values
7. Every claim must be supported by a direct quotation from the document.

DOCUMENT TITLE: ${input.documentTitle}
SOURCE TYPE: ${input.sourceType || "NOTIFICATION"}
JURISDICTION: ${input.jurisdiction || "Karnataka (KA)"}

DOCUMENT TEXT:
${input.rawText}

Return ONLY valid JSON in this exact schema (no markdown, no explanation, just JSON):
{
  "id": "prop-<timestamp>",
  "documentTitle": "<document title>",
  "sourceType": "<ACT|RULE|NOTIFICATION|GOVERNMENT_ORDER|COURT_ORDER>",
  "jurisdiction": "<jurisdiction string, e.g. Karnataka (KA)>",
  "sector": "<ride-hailing|food-delivery|logistics|e-marketplace|professional-services>",
  "vehicleType": "<4W|3W|2W|HCV|LCV|null>",
  "proposedRate": <decimal between 0 and 1, e.g. 0.015 for 1.5%>,
  "proposedCap": <positive number in rupees or null>,
  "effectiveDate": "<YYYY-MM-DD>",
  "aiProposedState": "<ACTIVE|UNDER_CHALLENGE|UNDER_INTERIM_ORDER|STAYED|SUPERSEDED|EXPIRED|REQUIRES_REVIEW>",
  "legalStatus": "<same as aiProposedState>",
  "confidence": "<HIGH|MEDIUM|LOW>",
  "confidenceRationale": {
    "level": "<HIGH|MEDIUM|LOW>",
    "allRequiredFieldsExtracted": <true|false>,
    "directEvidenceCitationFound": <true|false>,
    "unresolvedAmbiguityCount": <integer>,
    "notes": "<one sentence explanation>"
  },
  "interpretationNarrative": "<2-3 sentence plain English interpretation of what this document changes and why it matters>",
  "potentialInconsistencies": [
    {
      "description": "<description of potential inconsistency>",
      "severity": "<HIGH|MEDIUM|LOW>",
      "requiresHumanReview": true
    }
  ],
  "applicabilityConditions": ["<condition 1>", "<condition 2>"],
  "recommendedAction": {
    "title": "<one-line action title>",
    "steps": ["<step 1>", "<step 2>", "<step 3>"],
    "urgency": "<IMMEDIATE|BEFORE_EFFECTIVE_DATE|MONITORING>",
    "confidence": "<HIGH|MEDIUM|LOW>",
    "basis": "<one sentence: why this action is recommended>"
  },
  "summary": "<one paragraph summary>",
  "evidence": [
    {
      "sourceDocumentId": "<doc-id>",
      "sourceTitle": "<full document title>",
      "sourceType": "<ACT|RULE|NOTIFICATION|GOVERNMENT_ORDER|COURT_ORDER>",
      "section": "<section number/name>",
      "clause": "<clause reference>",
      "quotedExcerpt": "<exact quote from the document supporting this extraction>",
      "sourceUrl": "<URL if available or null>"
    }
  ],
  "ambiguities": ["<ambiguity 1 if any>"],
  "exclusions": ["<exclusion 1 if any>"],
  "previousRuleCode": "KA-2025-02-RH-4W",
  "previousRate": 0.01,
  "previousCap": 1.0,
  "changeHighlights": [
    {
      "field": "<field name>",
      "oldValue": "<previous value>",
      "newValue": "<new value>",
      "impact": "<increase|decrease|neutral|scope_expansion>"
    }
  ],
  "isSyntheticScenario": false,
  "schemaValid": true,
  "schemaValidationErrors": []
}
`;

export async function POST(request: NextRequest) {
  try {
    const body: ExtractRequestBody = await request.json();

    if (!body.rawText || body.rawText.trim().length < 50) {
      return NextResponse.json(
        { error: "rawText is required and must be at least 50 characters." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("[GRIP] No Gemini API key configured. Returning fallback signal.");
      return NextResponse.json({ fallback: true, reason: "NO_API_KEY" });
    }

    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: GEMINI_PROMPT(body) }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      }),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("[GRIP] Gemini API error:", geminiResponse.status, errText);
      return NextResponse.json({ fallback: true, reason: "GEMINI_API_ERROR" });
    }

    const geminiData = await geminiResponse.json();
    const rawContent = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawContent) {
      console.error("[GRIP] Gemini returned empty content.");
      return NextResponse.json({ fallback: true, reason: "EMPTY_RESPONSE" });
    }

    // Parse JSON from Gemini response
    let parsedExtraction: Record<string, unknown>;
    try {
      parsedExtraction = JSON.parse(rawContent);
    } catch {
      // Try to extract JSON from markdown code block if present
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          parsedExtraction = JSON.parse(jsonMatch[1]);
        } catch {
          console.error("[GRIP] Failed to parse Gemini JSON output.");
          return NextResponse.json({ fallback: true, reason: "JSON_PARSE_ERROR" });
        }
      } else {
        console.error("[GRIP] Failed to parse Gemini JSON output.");
        return NextResponse.json({ fallback: true, reason: "JSON_PARSE_ERROR" });
      }
    }

    // Ensure id is set
    if (!parsedExtraction.id) {
      parsedExtraction.id = `prop-${Date.now()}`;
    }

    // Apply schema validation gate — this is the critical safeguard
    const validated = applyValidation(parsedExtraction);

    if (!validated.schemaValid) {
      console.warn("[GRIP] Schema validation failed:", validated.schemaValidationErrors);
      // Return the extraction with errors — UI will show validation failure state
      return NextResponse.json({
        ...validated,
        schemaValid: false,
        schemaValidationErrors: validated.schemaValidationErrors,
      });
    }

    return NextResponse.json(validated);
  } catch (err) {
    console.error("[GRIP] /api/extract error:", err);
    return NextResponse.json({ fallback: true, reason: "SERVER_ERROR" });
  }
}
