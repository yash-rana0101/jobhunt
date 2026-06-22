"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import type { ApiResponse } from "@job-hunter/shared";

interface ReferralDetail {
  id: string;
  ranking: number;
  type: string;
  reason: string;
  candidate: {
    id: string;
    fullName: string;
  };
  job: {
    id: string;
    title: string;
    company: string;
  };
}

interface ContactDetail {
  id: string;
  fullName: string;
  jobTitle: string;
  companyName: string;
  category: string;
  seniority: string | null;
  linkedinUrl: string | null;
  confidenceScore: number;
  contactPriority: number;
  status: string;
  company: {
    website: string | null;
    linkedinUrl: string | null;
    careersUrl: string | null;
    industry: string | null;
    companySize: string | null;
    headquarters: string | null;
    fundingStage: string | null;
    description: string | null;
  };
  department: {
    name: string;
  } | null;
  referrals: ReferralDetail[];
}

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContact() {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:4000/contacts/${id}`);
        const result = (await res.json()) as ApiResponse<ContactDetail>;
        if (result.success && result.data) {
          setContact(result.data);
        } else if (!result.success) {
          setError(result.error?.message || "Failed to load contact details");
        }
      } catch (err) {
        console.error("Error fetching contact details", err);
        setError("Error connecting to server API");
      } finally {
        setLoading(false);
      }
    }
    void fetchContact();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-16 flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-6 text-center text-rose-700">
          <p className="font-semibold">{error || "Profile could not be found"}</p>
          <Link
            href="/contacts"
            className="mt-4 inline-flex items-center rounded-lg bg-white px-4 py-2 text-xs font-semibold text-rose-700 shadow-sm border border-rose-200 hover:bg-rose-50 transition"
          >
            Back to directory
          </Link>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-700 bg-emerald-50 border-emerald-100";
    if (score >= 60) return "text-amber-700 bg-amber-50 border-amber-100";
    return "text-slate-600 bg-slate-50 border-slate-100";
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          Profile Map
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-1">
          {contact.fullName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {contact.jobTitle} at {contact.companyName}
        </p>
      </div>

      <div className="space-y-6 pb-16">
        <div className="flex items-center gap-3">
          <Link
            href="/contacts"
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            ← Back to Directory
          </Link>
          {contact.linkedinUrl && (
            <a
              href={contact.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              Open LinkedIn Profile
            </a>
          )}
        </div>

        {/* Profile Card Summary */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2 rounded-xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-slate-900 border-b border-slate-50 pb-2">
              Profile Overview
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="block text-slate-400 font-medium">Full Name</span>
                <span className="block font-semibold text-slate-800 text-sm mt-0.5">
                  {contact.fullName}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-medium">Job Title</span>
                <span className="block font-semibold text-slate-800 text-sm mt-0.5">
                  {contact.jobTitle}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-medium">Department</span>
                <span className="block font-semibold text-slate-800 text-sm mt-0.5">
                  {contact.department?.name || contact.jobTitle.split(" ")[0] || "Engineering"}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-medium">Seniority</span>
                <span className="block font-semibold text-slate-800 text-sm mt-0.5">
                  {contact.seniority || "MID"}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-medium">Discovered Via</span>
                <span className="block font-semibold text-slate-800 text-sm mt-0.5">
                  {contact.status}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 font-medium">Outreach Category</span>
                <span className="block font-semibold text-slate-800 text-sm mt-0.5">
                  {contact.category.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 border-b border-slate-50 pb-2">
                Discovery Scores
              </h3>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Priority Score</span>
                <span
                  className={`rounded-md border px-2.5 py-1 text-sm font-bold ${getScoreColor(contact.contactPriority)}`}
                >
                  {Math.round(contact.contactPriority)}/100
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Confidence Score</span>
                <span
                  className={`rounded-md border px-2.5 py-1 text-sm font-bold ${getScoreColor(contact.confidenceScore)}`}
                >
                  {Math.round(contact.confidenceScore)}%
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-4">
              Scored dynamically using authority profiles, role matching, and verification of
              reference connections.
            </p>
          </div>
        </div>

        {/* Company Intel */}
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-slate-900 border-b border-slate-50 pb-2">
            Company Intelligence
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs md:grid-cols-4">
            <div>
              <span className="block text-slate-400 font-medium">Website</span>
              {contact.company.website ? (
                <a
                  href={contact.company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  {contact.company.website}
                </a>
              ) : (
                <span className="text-slate-500">N/A</span>
              )}
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Headquarters</span>
              <span className="font-semibold text-slate-800">
                {contact.company.headquarters || "USA"}
              </span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Company Size</span>
              <span className="font-semibold text-slate-800">
                {contact.company.companySize || "10-50 employees"}
              </span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Funding Stage</span>
              <span className="font-semibold text-slate-800">
                {contact.company.fundingStage || "Venture-backed"}
              </span>
            </div>
          </div>
          {contact.company.description && (
            <div className="text-xs border-t border-slate-50 pt-3">
              <span className="block text-slate-400 font-medium mb-1">Company Description</span>
              <p className="text-slate-600 leading-relaxed">{contact.company.description}</p>
            </div>
          )}
        </div>

        {/* Referral Targets mapping */}
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-slate-900 border-b border-slate-50 pb-2">
            Warm Referral Mapping
          </h3>
          {contact.referrals.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">
              No direct candidate/job referrals found for this profile yet.
            </p>
          ) : (
            <div className="space-y-4">
              {contact.referrals.map((ref) => (
                <div
                  key={ref.id}
                  className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-semibold text-indigo-700">
                      Rank #{ref.ranking} Referral Opportunity
                    </span>
                    <span className="rounded bg-indigo-50 text-indigo-700 px-1.5 py-0.5 font-bold uppercase tracking-wider text-[10px]">
                      {ref.type}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400 block">Candidate Reference</span>
                      <span className="font-semibold text-slate-800">{ref.candidate.fullName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Target Job Link</span>
                      <span className="font-semibold text-slate-800">
                        {ref.job.title} ({ref.job.company})
                      </span>
                    </div>
                  </div>
                  {ref.reason && (
                    <div className="pt-1.5 border-t border-slate-100">
                      <span className="text-slate-400 block">Referral Alignment Reason</span>
                      <p className="text-slate-700 mt-0.5">{ref.reason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
