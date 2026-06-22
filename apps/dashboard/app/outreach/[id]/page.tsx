"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";

const API_BASE = "http://localhost:4000";

type Feedback = {
  id: string;
  rating: number;
  comments: string | null;
};

type OutreachDraft = {
  id: string;
  type: string;
  status: string;
  qualityScore: number;
  personalizationScore: number;
  relevanceScore: number;
  spamRiskScore: number;
  professionalismScore: number;
  clarityScore: number;
  subjectLines: string[];
  selectedSubject: string | null;
  body: string;
  day3FollowUp: string | null;
  day7FollowUp: string | null;
  day14FollowUp: string | null;
  expectedResponseProbability: number;
  bestContactMessage: string | null;
  bestOutreachType: string | null;
  outreachRecommendationReason: string | null;
  createdAt: string;
  job: {
    id: string;
    title: string;
    company: string;
  };
  contact: {
    fullName: string;
    jobTitle: string;
    linkedinUrl: string | null;
    source: string;
  } | null;
  feedback: Feedback[];
};

interface ApiResponseSuccess<T> {
  success: true;
  data: T;
}

export default function OutreachDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [draft, setDraft] = useState<OutreachDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchDraftDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/outreach/${id}`);
      const json = (await res.json()) as ApiResponseSuccess<OutreachDraft>;
      if (json.success) {
        setDraft(json.data);
        setSelectedSubject(json.data.selectedSubject || json.data.subjectLines[0] || "");
      }
    } catch (err) {
      console.error("Failed to fetch draft details", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchDraftDetails();
  }, [fetchDraftDetails]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch(`${API_BASE}/outreach/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId: id }),
      });
      const json = (await res.json()) as ApiResponseSuccess<OutreachDraft>;
      if (json.success) {
        setDraft(json.data);
        setSelectedSubject(json.data.selectedSubject || json.data.subjectLines[0] || "");
      }
    } catch (err) {
      console.error("Regeneration failed", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopy = () => {
    if (!draft) return;
    const textToCopy = `Subject: ${selectedSubject}\n\n${draft.body}`;
    void navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-16 text-center animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto"></div>
        <div className="mt-8 h-64 bg-slate-100 rounded"></div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-16 text-center">
        <h3 className="text-xl font-bold text-slate-800">Draft not found</h3>
        <Link
          href="/outreach"
          className="mt-4 inline-block text-indigo-600 font-semibold hover:underline"
        >
          &larr; Back to drafts
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <Link href="/outreach" className="hover:text-slate-600">
          Outreach
        </Link>
        <span>/</span>
        <span>Draft Preview</span>
      </div>

      <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Outreach for {draft.job.company} &bull; {draft.job.title}
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Channel:{" "}
            <span className="font-semibold text-indigo-600">{draft.type.replace("_", " ")}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isRegenerating}
            onClick={() => {
              void handleRegenerate();
            }}
            className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            {isRegenerating ? "Regenerating..." : "Regenerate Draft"}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            {copied ? "Copied!" : "Copy Full Message"}
          </button>
        </div>
      </div>

      {/* Grid of contents */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Draft text column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subject option block */}
          {draft.subjectLines.length > 0 && (
            <div className="rounded-xl border border-slate-150 bg-white p-5 shadow-sm space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Subject Line Options
              </label>
              <div className="space-y-2">
                {draft.subjectLines.map((subject, idx) => (
                  <label
                    key={idx}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50 cursor-pointer transition"
                  >
                    <input
                      type="radio"
                      name="subject"
                      value={subject}
                      checked={selectedSubject === subject}
                      onChange={() => setSelectedSubject(subject)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500/20"
                    />
                    <span className="text-sm font-medium text-slate-700">{subject}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Email/DM Body */}
          <div className="rounded-xl border border-slate-150 bg-white p-6 shadow-sm">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Message Body
            </span>
            <div className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-700 border border-slate-100 leading-relaxed font-normal">
              {draft.body}
            </div>
          </div>

          {/* Follow-up Messages */}
          {(draft.day3FollowUp || draft.day7FollowUp || draft.day14FollowUp) && (
            <div className="rounded-xl border border-slate-150 bg-white p-6 shadow-sm space-y-4">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                Day-by-Day Follow Ups
              </span>
              {draft.day3FollowUp && (
                <div>
                  <span className="text-xs font-bold text-slate-500 block mb-1">
                    Day 3 Follow Up
                  </span>
                  <p className="rounded-lg bg-slate-50/70 p-3 text-xs border border-slate-100 text-slate-600">
                    {draft.day3FollowUp}
                  </p>
                </div>
              )}
              {draft.day7FollowUp && (
                <div>
                  <span className="text-xs font-bold text-slate-500 block mb-1">
                    Day 7 Follow Up
                  </span>
                  <p className="rounded-lg bg-slate-50/70 p-3 text-xs border border-slate-100 text-slate-600">
                    {draft.day7FollowUp}
                  </p>
                </div>
              )}
              {draft.day14FollowUp && (
                <div>
                  <span className="text-xs font-bold text-slate-500 block mb-1">
                    Day 14 Follow Up
                  </span>
                  <p className="rounded-lg bg-slate-50/70 p-3 text-xs border border-slate-100 text-slate-600">
                    {draft.day14FollowUp}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI review / Contact sidebar */}
        <div className="space-y-6">
          {/* Quality radar */}
          <div className="rounded-xl border border-slate-150 bg-white p-5 shadow-sm space-y-4">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              AI Quality Self-Review
            </span>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 text-center">
                <span className="block text-xxs font-bold text-slate-400 uppercase">Quality</span>
                <span className="text-lg font-extrabold text-slate-900">{draft.qualityScore}</span>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 text-center">
                <span className="block text-xxs font-bold text-slate-400 uppercase">
                  Personalization
                </span>
                <span className="text-lg font-extrabold text-slate-900">
                  {draft.personalizationScore}
                </span>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 text-center">
                <span className="block text-xxs font-bold text-slate-400 uppercase">Relevance</span>
                <span className="text-lg font-extrabold text-slate-900">
                  {draft.relevanceScore}
                </span>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 text-center">
                <span className="block text-xxs font-bold text-slate-400 uppercase">Spam Risk</span>
                <span className="text-lg font-extrabold text-slate-900">{draft.spamRiskScore}</span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">
              <span>Expected Response Probability:</span>
              <span className="font-bold text-slate-900">
                {Math.round(draft.expectedResponseProbability * 100)}%
              </span>
            </div>
          </div>

          {/* Target contact */}
          <div className="rounded-xl border border-slate-150 bg-white p-5 shadow-sm space-y-3">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Target Contact
            </span>
            {draft.contact ? (
              <div className="space-y-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{draft.contact.fullName}</h4>
                  <p className="text-xs font-semibold text-slate-500">{draft.contact.jobTitle}</p>
                </div>
                {draft.contact.linkedinUrl && (
                  <a
                    href={draft.contact.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    LinkedIn Profile &rarr;
                  </a>
                )}
              </div>
            ) : (
              <span className="text-xs italic text-slate-400">
                Recruiting / General email outreach. No specific contact selected.
              </span>
            )}
          </div>

          {/* Recommendation guidance */}
          {draft.bestContactMessage && (
            <div className="rounded-xl bg-slate-50/50 p-5 border border-slate-150 space-y-2.5">
              <span className="block text-xxs font-bold uppercase tracking-wider text-slate-400">
                Outreach Recommendation
              </span>
              <p className="text-xs leading-5 text-slate-600 font-medium">
                {draft.bestContactMessage}
              </p>
              {draft.outreachRecommendationReason && (
                <p className="text-xxs text-slate-400 font-normal leading-4 border-t border-slate-200/50 pt-2">
                  {draft.outreachRecommendationReason}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
