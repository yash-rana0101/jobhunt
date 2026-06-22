"use client";

import type { ResumeScore } from "../types";

interface ResumeSuggestionsProps {
  score: ResumeScore;
}

export function ResumeSuggestions({ score }: ResumeSuggestionsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Score details break up card */}
      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">ATS Scoring Criteria</h3>
        <div className="space-y-4">
          {[
            { label: "Keyword Match", val: score.keywordMatchScore, color: "bg-emerald-600" },
            { label: "Role Alignment", val: score.roleAlignmentScore, color: "bg-blue-600" },
            { label: "Skills Match", val: score.skillsMatchScore, color: "bg-indigo-600" },
            { label: "Project Match", val: score.projectMatchScore, color: "bg-violet-600" },
            { label: "Format Analysis", val: score.formattingScore, color: "bg-teal-600" },
            { label: "Readability Density", val: score.readabilityScore, color: "bg-sky-600" },
          ].map((item) => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600">{item.label}</span>
                <span className="text-slate-900">{item.val}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-1.5 rounded-full ${item.color}`}
                  style={{ width: `${item.val}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations card */}
      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
        {/* Improvement opportunities */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Improvement Opportunities</h3>
          {score.improvementOpportunities.length === 0 ? (
            <p className="text-xs text-emerald-600 bg-emerald-50/50 rounded-lg p-3 border border-emerald-100">
              ✓ Excellent! This resume matches all structural formatting requirements.
            </p>
          ) : (
            <ul className="space-y-2">
              {score.improvementOpportunities.map((op, idx) => (
                <li key={idx} className="flex gap-2 items-start text-xs text-slate-600">
                  <span className="text-indigo-600 font-semibold mt-0.5">•</span>
                  <span>{op}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Weaknesses warning section */}
        {score.weakSections.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Parser Warning Triggers
            </h4>
            <div className="space-y-2">
              {score.weakSections.map((ws, idx) => (
                <div
                  key={idx}
                  className="rounded-lg bg-amber-50 border border-amber-100 p-2.5 text-xs text-amber-800 flex gap-2"
                >
                  <span className="font-semibold">⚠️</span>
                  <span>{ws}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
