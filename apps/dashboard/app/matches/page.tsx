"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const API_BASE = "http://localhost:4000";

type MatchReason = {
  id: string;
  reason: string;
  isPositive: boolean;
};

type JobMatch = {
  id: string;
  matchScore: number;
  rankingScore: number;
  classification: string;
  skillsMatchScore: number;
  experienceMatchScore: number;
  projectMatchScore: number;
  job: {
    id: string;
    title: string;
    company: string;
    location: string | null;
    remoteStatus: string;
    salaryMin: number | null;
    salaryMax: number | null;
    source: string;
  };
  reasons: MatchReason[];
  recommendation: {
    whyApply: string[];
    whyNotApply: string[];
    riskFactors: string[];
    missingSkills: string[];
    presentSkills: string[];
    interviewReadinessScore: number;
  } | null;
};

interface ApiResponseSuccess<T> {
  success: true;
  data: T;
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

interface ApiResponseError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

type ApiResult<T> = ApiResponseSuccess<T> | ApiResponseError;

export default function MatchesPage() {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScoring, setIsScoring] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [classification, setClassification] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "10",
        showAll: showAll.toString(),
        classification,
      });

      const res = await fetch(`${API_BASE}/matches?${params}`);
      const data = (await res.json()) as ApiResult<JobMatch[]>;
      if (data.success) {
        setMatches(data.data);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (err) {
      console.error("Failed to fetch matches", err);
    } finally {
      setLoading(false);
    }
  }, [page, showAll, classification]);

  useEffect(() => {
    void fetchMatches();
  }, [fetchMatches]);

  const handleRunScoring = async () => {
    setIsScoring(true);
    try {
      const res = await fetch(`${API_BASE}/matches/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize: 100 }),
      });
      const data = (await res.json()) as ApiResult<{ message: string; status: string }>;
      if (data.success) {
        setTimeout(() => {
          void fetchMatches();
          setIsScoring(false);
        }, 3000);
      } else {
        setIsScoring(false);
      }
    } catch (err) {
      console.error("Failed to run matching", err);
      setIsScoring(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (score >= 75) return "text-indigo-600 bg-indigo-50 border-indigo-100";
    if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-rose-600 bg-rose-50 border-rose-100";
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            AI Matches & Recommendations
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Discover which software engineering jobs best align with your skills, projects, and
            target roles.
          </p>
        </div>
        <button
          type="button"
          disabled={isScoring}
          onClick={() => {
            void handleRunScoring();
          }}
          className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition ${
            isScoring
              ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {isScoring ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></span>
              Evaluating Matches...
            </span>
          ) : (
            "Run Matching Engine"
          )}
        </button>
      </div>

      <div className="mt-8 space-y-6">
        {/* Filters control bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => {
                  setShowAll(e.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500/20"
              />
              Show Poor & Average Matches
            </label>

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">Classification:</span>
              <select
                value={classification}
                onChange={(e) => {
                  setClassification(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-indigo-500"
              >
                <option value="">All Recommendations</option>
                <option value="EXCELLENT">Excellent Only</option>
                <option value="GOOD">Good Only</option>
                {showAll && (
                  <>
                    <option value="AVERAGE">Average Only</option>
                    <option value="POOR">Poor Only</option>
                  </>
                )}
              </select>
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Sorted by Highest Priority Rank First
          </div>
        </div>

        {/* Opportunity Card List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 rounded-xl border border-slate-100 bg-white/60 p-6 shadow-sm animate-pulse"
              ></div>
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-sm">
            <h3 className="text-base font-bold text-slate-900">No matching evaluations found</h3>
            <p className="mt-1 text-sm text-slate-500">
              Run the Matching Engine or adjust filters to view recommendations.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <div
                key={match.id}
                className="relative overflow-hidden rounded-xl border border-slate-150 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                {/* Score indicators */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start justify-between">
                  <div className="flex gap-4">
                    <div
                      className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border font-bold ${getScoreColor(match.matchScore)}`}
                    >
                      <span className="text-xl tracking-tight leading-none">
                        {Math.round(match.matchScore)}
                      </span>
                      <span className="mt-0.5 text-xxs font-semibold uppercase tracking-wider">
                        Score
                      </span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{match.job.title}</h2>
                      <p className="text-sm font-semibold text-slate-500">
                        {match.job.company} &bull;{" "}
                        <span className="font-medium">{match.job.location || "Remote"}</span>
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xxs font-bold uppercase tracking-wider text-slate-400">
                        <span>Rank Priority: {match.rankingScore}</span>
                        <span>&bull;</span>
                        <span>via {match.job.source}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <span
                      className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-wide shadow-sm ${getScoreColor(match.matchScore)}`}
                    >
                      {match.classification}
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 border-t border-slate-100 pt-5 md:grid-cols-3">
                  <div className="md:col-span-2 space-y-4">
                    {/* Strengths / Match reasons */}
                    {match.reasons.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Match Insights
                        </h4>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {match.reasons.map((r) => (
                            <span
                              key={r.id}
                              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium ${
                                r.isPositive
                                  ? "bg-emerald-50/70 border-emerald-100 text-emerald-700"
                                  : "bg-rose-50/70 border-rose-100 text-rose-700"
                              }`}
                            >
                              {r.isPositive ? "✓" : "✗"} {r.reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Gap analysis */}
                    {match.recommendation && match.recommendation.missingSkills.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Technology Gap Analysis
                        </h4>
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-500 mr-1">
                            Missing Stack:
                          </span>
                          {match.recommendation.missingSkills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-md border border-rose-150 bg-rose-50 px-2 py-0.5 text-xxs font-bold uppercase text-rose-700"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recommendation block */}
                  {match.recommendation && (
                    <div className="rounded-xl bg-slate-50/50 p-4 border border-slate-100 space-y-3.5">
                      <div>
                        <span className="block text-xxs font-bold uppercase tracking-wider text-slate-400">
                          Apply Guidance
                        </span>
                        <p className="mt-1 text-xs leading-5 text-slate-600 font-medium">
                          {match.recommendation.whyApply[0] ||
                            "Highly relevant opportunities based on skill catalog matches."}
                        </p>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-xs font-semibold text-slate-500">
                          Interview Readiness:
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {match.recommendation.interviewReadinessScore}%
                        </span>
                      </div>
                      <Link
                        href={`/jobs/${match.job.id}`}
                        className="flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-350"
                      >
                        Explore Description &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-slate-500">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
