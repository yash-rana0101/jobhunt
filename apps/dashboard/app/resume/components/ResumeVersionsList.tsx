"use client";

import type { ResumeVersion } from "../types";

interface ResumeVersionsListProps {
  versions: ResumeVersion[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}

export function ResumeVersionsList({
  versions,
  selectedId,
  onSelect,
  loading,
}: ResumeVersionsListProps) {
  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-slate-100 bg-white shadow-sm">
        <span className="text-sm text-slate-500">Loading resume variants...</span>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-slate-100 bg-white p-6 text-center shadow-sm">
        <span className="text-sm font-semibold text-slate-800">No tailored resumes found</span>
        <p className="mt-1 text-xs text-slate-500">
          Match and approve jobs to automatically trigger variant generation, or generate one
          manually.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">Tailored Versions</h3>
      <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-3">
        {versions.map((version) => {
          const isSelected = selectedId === version.id;
          const score = version.atsScore || 0;

          // Compute score colors
          let scoreBg = "bg-rose-50 text-rose-700 border-rose-100";
          if (score >= 85) {
            scoreBg = "bg-emerald-50 text-emerald-700 border-emerald-100";
          } else if (score >= 70) {
            scoreBg = "bg-amber-50 text-amber-700 border-amber-100";
          }

          return (
            <button
              key={version.id}
              onClick={() => onSelect(version.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all shadow-sm flex flex-col justify-between gap-2 ${
                isSelected
                  ? "border-indigo-600 bg-indigo-50/30"
                  : "border-slate-100 bg-white hover:border-slate-200"
              }`}
            >
              <div className="flex w-full items-start justify-between">
                <div>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-2xs font-bold text-slate-600 uppercase tracking-wide">
                    {version.versionName.replace("_", " ")}
                  </span>
                  <h4 className="mt-1 text-sm font-semibold text-slate-900 leading-tight">
                    {version.roleName}
                  </h4>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">{version.companyName}</p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold ${scoreBg}`}
                >
                  {score} ATS
                </span>
              </div>
              <div className="flex items-center justify-between text-2xs text-slate-400 mt-1 w-full">
                <span>
                  {new Date(version.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {version.jobId && (
                  <span className="text-indigo-600 font-semibold hover:underline">
                    View Job &rarr;
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
