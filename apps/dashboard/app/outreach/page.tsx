"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const API_BASE = "http://localhost:4000";

type OutreachDraft = {
  id: string;
  type: string;
  status: string;
  qualityScore: number;
  selectedSubject: string | null;
  createdAt: string;
  job: {
    id: string;
    title: string;
    company: string;
  };
  contact: {
    fullName: string;
    jobTitle: string;
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

export default function OutreachPage() {
  const [drafts, setDrafts] = useState<OutreachDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "10",
        status,
        type,
      });
      const res = await fetch(`${API_BASE}/outreach?${params}`);
      const json = (await res.json()) as ApiResponseSuccess<OutreachDraft[]>;
      if (json.success) {
        setDrafts(json.data);
        if (json.pagination) {
          setTotalPages(json.pagination.totalPages);
        }
      }
    } catch (err) {
      console.error("Failed to fetch drafts", err);
    } finally {
      setLoading(false);
    }
  }, [page, status, type]);

  useEffect(() => {
    void fetchDrafts();
  }, [fetchDrafts]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-700 bg-emerald-50 border-emerald-100";
    if (score >= 70) return "text-indigo-700 bg-indigo-50 border-indigo-100";
    return "text-rose-700 bg-rose-50 border-rose-100";
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Personalized Outreach
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Review, edit, and copy highly targeted outreach drafts for recruiters, founders, and
            hiring managers.
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {/* Filters control bar */}
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Status:
            </span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="READY">Ready</option>
              <option value="REVIEW_REQUIRED">Review Required</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Outreach Type:
            </span>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-indigo-500"
            >
              <option value="">All Types</option>
              <option value="REFERRAL_REQUEST">Referral Request</option>
              <option value="HIRING_MANAGER_EMAIL">Hiring Manager Email</option>
              <option value="RECRUITER_EMAIL">Recruiter Email</option>
              <option value="FOUNDER_EMAIL">Founder Email</option>
              <option value="CTO_EMAIL">CTO Email</option>
              <option value="ENGINEERING_MANAGER_EMAIL">EM Email</option>
              <option value="LINKEDIN_DM">LinkedIn DM</option>
            </select>
          </div>
        </div>

        {/* Table view */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-xl border border-slate-100 bg-white/60 p-6 shadow-sm animate-pulse"
              ></div>
            ))}
          </div>
        ) : drafts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-sm">
            <h3 className="text-base font-bold text-slate-900">No outreach drafts found</h3>
            <p className="mt-1 text-sm text-slate-500">
              Discover contacts and trigger matches run to auto-generate communication drafts.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-150 bg-white shadow-sm">
            <table className="w-full border-collapse text-left text-sm text-slate-500">
              <thead className="bg-slate-50 text-xxs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Outreach Type</th>
                  <th className="px-6 py-4 text-center">Quality Score</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drafts.map((draft) => (
                  <tr key={draft.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">{draft.job.company}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{draft.job.title}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {draft.contact ? (
                        <div>
                          <span className="block font-semibold text-slate-800">
                            {draft.contact.fullName}
                          </span>
                          <span className="text-xxs text-slate-400 font-medium">
                            {draft.contact.jobTitle}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs italic text-slate-400">Recruiting / General</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xxs font-bold uppercase tracking-wide text-indigo-600 bg-indigo-50/30 rounded-md py-1 px-2 border border-indigo-100/50 w-fit">
                      {draft.type.replace("_", " ")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-bold leading-5 shadow-sm ${getScoreColor(draft.qualityScore)}`}
                      >
                        {draft.qualityScore}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          draft.status === "READY"
                            ? "bg-emerald-100 text-emerald-800"
                            : draft.status === "REVIEW_REQUIRED"
                              ? "bg-amber-100 text-amber-800"
                              : draft.status === "APPROVED"
                                ? "bg-indigo-100 text-indigo-800"
                                : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {draft.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/outreach/${draft.id}`}
                        className="inline-flex rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-750 shadow-sm transition hover:bg-slate-50 hover:border-slate-350"
                      >
                        Preview &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
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
