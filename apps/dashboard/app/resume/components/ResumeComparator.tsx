"use client";

import { useState } from "react";
import type { ResumeVersion } from "../types";

interface ResumeComparatorProps {
  version: ResumeVersion;
  originalText: string;
}

export function ResumeComparator({ version, originalText }: ResumeComparatorProps) {
  const [activeTab, setActiveTab] = useState<"tailored" | "compare" | "keywords">("tailored");
  const optimization = version.optimizations?.[0];
  const keywords = version.keywords || [];

  return (
    <div className="rounded-xl border border-slate-150 bg-white shadow-sm overflow-hidden">
      {/* Header Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 py-2 items-center justify-between">
        <div className="flex gap-2">
          {(["tailored", "compare", "keywords"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                activeTab === tab
                  ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab === "tailored" && "Tailored Resume"}
              {tab === "compare" && "Compare View"}
              {tab === "keywords" && "Keywords Coverage"}
            </button>
          ))}
        </div>

        {/* Download PDF action button */}
        <a
          href={`http://localhost:4000/resume/version/${version.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
        >
          Download PDF
        </a>
      </div>

      {/* Content panel */}
      <div className="p-6">
        {activeTab === "tailored" && (
          <div className="prose prose-slate max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800 leading-relaxed max-h-[60vh] overflow-y-auto bg-slate-50/50 p-6 rounded-xl border border-slate-100">
              {version.markdownContent}
            </pre>
          </div>
        )}

        {activeTab === "compare" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Original Profile Description
              </h4>
              <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-4 text-xs font-mono text-slate-500 max-h-[50vh] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {originalText || "No original resume text available."}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Optimized ATS Content
              </h4>
              <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-4 text-xs font-mono text-slate-700 max-h-[50vh] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {version.markdownContent}
              </div>
            </div>
          </div>
        )}

        {activeTab === "keywords" && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-1">
                ATS Target Keyword Coverage
              </h4>
              <p className="text-xs text-slate-500">
                A comparison of candidate skills and descriptions versus key technologies extracted
                from the job description.
              </p>
            </div>

            {keywords.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No keyword analysis details are available.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Matched Keywords */}
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/20 p-4">
                  <h5 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3">
                    Matched ({keywords.filter((k) => k.status === "MATCHED").length})
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {keywords
                      .filter((k) => k.status === "MATCHED")
                      .map((k) => (
                        <span
                          key={k.keyword}
                          className="rounded bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-2xs font-medium text-emerald-800"
                        >
                          {k.keyword}
                        </span>
                      ))}
                  </div>
                </div>

                {/* High Impact matched Keywords */}
                <div className="rounded-xl border border-blue-100 bg-blue-50/20 p-4">
                  <h5 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3">
                    High Impact ({keywords.filter((k) => k.status === "HIGH_IMPACT").length})
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {keywords
                      .filter((k) => k.status === "HIGH_IMPACT")
                      .map((k) => (
                        <span
                          key={k.keyword}
                          className="rounded bg-blue-100 border border-blue-200 px-2 py-0.5 text-2xs font-semibold text-blue-800"
                        >
                          {k.keyword} ★
                        </span>
                      ))}
                  </div>
                </div>

                {/* Missing Keywords */}
                <div className="rounded-xl border border-rose-100 bg-rose-50/20 p-4">
                  <h5 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-3">
                    Missing ({keywords.filter((k) => k.status === "MISSING").length})
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {keywords
                      .filter((k) => k.status === "MISSING")
                      .map((k) => (
                        <span
                          key={k.keyword}
                          className="rounded bg-rose-100 border border-rose-200 px-2 py-0.5 text-2xs font-medium text-rose-800"
                        >
                          {k.keyword}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Change statistics */}
            {optimization && optimization.improvements.length > 0 && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 mt-4">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Adjustments Performed
                </h5>
                <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1.5">
                  {optimization.improvements.map((imp, idx) => (
                    <li key={idx}>{imp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
