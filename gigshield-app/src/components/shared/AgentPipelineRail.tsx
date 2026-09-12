"use client";

import React from "react";
import {
  FileText,
  ListFilter,
  Brain,
  Database,
  Search,
  ShieldCheck,
  FileCheck,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export interface AgentPipelineRailProps {
  currentStepIndex: number; // 0 to 7. 0 = idle, 1..7 = active/complete
  isLiveGemini?: boolean;
  isFallback?: boolean;
  fallbackReason?: string;
  schemaValid?: boolean;
  schemaErrors?: string[];
}

const STEPS = [
  {
    num: 1,
    name: "Ingest",
    sub: "Parse document",
    icon: FileText,
    isAi: true,
  },
  {
    num: 2,
    name: "Extract",
    sub: "Key details",
    icon: ListFilter,
    isAi: true,
  },
  {
    num: 3,
    name: "Interpret",
    sub: "Legal meaning (Gemini)",
    icon: Brain,
    isAi: true,
  },
  {
    num: 4,
    name: "Compare",
    sub: "Check active rules",
    icon: Database,
    isAi: true,
  },
  {
    num: 5,
    name: "Detect",
    sub: "Changes & conflicts",
    icon: Search,
    isAi: true,
  },
  {
    num: 6,
    name: "Validate Schema",
    sub: "Schema check (NON-AI GATE)",
    icon: ShieldCheck,
    isAi: false, // Deterministic gate!
  },
  {
    num: 7,
    name: "Propose",
    sub: "Structured output",
    icon: FileCheck,
    isAi: true,
  },
];

export function AgentPipelineRail({
  currentStepIndex,
  isLiveGemini = false,
  isFallback = false,
  fallbackReason,
  schemaValid = true,
  schemaErrors = [],
}: AgentPipelineRailProps) {
  const isRunning = currentStepIndex > 0 && currentStepIndex < 7;
  const isComplete = currentStepIndex >= 7;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            {/* Gear / Settings Icon */}
            <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Analysis Pipeline</h3>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <span
                className={`w-2 h-2 rounded-full ${
                  isRunning
                    ? "bg-indigo-600 animate-ping"
                    : isComplete
                    ? "bg-emerald-500"
                    : "bg-emerald-500"
                }`}
              />
              <span>
                {isRunning
                  ? "Running analysis..."
                  : isComplete
                  ? "Analysis complete"
                  : "Ready to run"}
              </span>
            </span>
          </div>
        </div>

        {isFallback && (
          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
            Cached Interpretation
          </span>
        )}
      </div>

      {/* 7 Horizontal Steps */}
      <div className="flex items-center justify-between overflow-x-auto py-2">
        {STEPS.map((step, idx) => {
          const stepNum = step.num;
          const isDone = currentStepIndex >= stepNum;
          const isCurrent = currentStepIndex === stepNum - 1 && isRunning;
          const isFailed = !step.isAi && currentStepIndex >= 6 && !schemaValid;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.name}>
              <div className="flex flex-col items-center text-center min-w-[105px] px-1">
                {/* Numbered Circle & Icon */}
                <div className="flex items-center gap-1.5 mb-2">
                  <span
                    className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                      isDone
                        ? "bg-indigo-600 text-white"
                        : isCurrent
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-blue-100/80 text-blue-600"
                    }`}
                  >
                    {stepNum}
                  </span>

                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      isFailed
                        ? "bg-rose-100 text-rose-700 border border-rose-300"
                        : isDone
                        ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                        : isCurrent
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-blue-50/60 text-blue-600 border border-blue-100"
                    }`}
                  >
                    {isCurrent ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Icon className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                </div>

                {/* Dominant Step Name */}
                <div
                  className={`text-[13px] font-extrabold tracking-tight ${
                    isDone
                      ? "text-slate-900"
                      : isCurrent
                      ? "text-indigo-600"
                      : "text-slate-700"
                  }`}
                >
                  {step.name}
                </div>

                {/* Small Description */}
                <div className="text-[10px] text-slate-400 mt-0.5 leading-tight max-w-[105px]">
                  {step.sub}
                </div>
              </div>

              {idx < STEPS.length - 1 && (
                <div className="text-slate-300 px-1 -mt-4 shrink-0 font-bold text-xs">
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Schema Validation failure banner if any */}
      {!schemaValid && schemaErrors.length > 0 && (
        <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong>Deterministic Schema Gate Failed:</strong>
            <ul className="list-disc list-inside mt-1 text-[11px]">
              {schemaErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
