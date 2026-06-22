"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

const API_BASE = "http://localhost:4000";

type JobDetail = {
  id: string;
  title: string;
  company: string;
  description: string;
  applicationUrl: string | null;
  companyUrl: string | null;
  location: string | null;
  employmentType: string | null;
  experienceRequired: string | null;
  experienceClassification: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  remoteStatus: string;
  postedDate: string | null;
  source: string;
  freshnessScore: number;
  technologies: { id: string; name: string }[];
};

interface ApiResponseSuccess<T> {
  success: true;
  data: T;
}

interface ApiResponseError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

type ApiResult<T> = ApiResponseSuccess<T> | ApiResponseError;

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/${id}`);
        const data = (await res.json()) as ApiResult<JobDetail>;
        if (data.success) {
          setJob(data.data);
        }
      } catch (err) {
        console.error("Failed to load job details", err);
      } finally {
        setLoading(false);
      }
    };
    void fetchJob();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12 animate-pulse space-y-6">
        <div className="h-4 w-20 bg-slate-200 rounded"></div>
        <div className="h-8 w-2/3 bg-slate-200 rounded"></div>
        <div className="h-6 w-1/3 bg-slate-200 rounded"></div>
        <div className="h-64 bg-slate-100 rounded-xl"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900">Job not found</h2>
        <p className="mt-2 text-sm text-slate-500">
          The opportunity you are looking for does not exist or has been removed.
        </p>
        <Link
          href="/jobs"
          className="mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Back to Jobs List
        </Link>
      </div>
    );
  }

  const formatSalary = (min: number | null, max: number | null) => {
    if (min === null && max === null) return "Salary not specified";
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
    if (min !== null && max !== null)
      return `${formatter.format(min)} - ${formatter.format(max)} / year`;
    if (min !== null) return `From ${formatter.format(min)} / year`;
    return `Up to ${formatter.format(max!)} / year`;
  };

  const getRemoteColor = (status: string) => {
    if (status === "REMOTE") return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (status === "HYBRID") return "bg-indigo-50 text-indigo-700 border-indigo-100";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        &larr; Back to Opportunities
      </Link>

      <div className="mt-6 rounded-xl border border-slate-150 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{job.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{job.company}</span>
              <span>&bull;</span>
              <span>{job.location || "Remote"}</span>
              <span>&bull;</span>
              <span>via {job.source}</span>
            </div>
          </div>
          {job.applicationUrl && (
            <a
              href={job.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Apply on Source Website &rarr;
            </a>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5 border-y border-slate-100 py-4">
          <span
            className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${getRemoteColor(job.remoteStatus)}`}
          >
            {job.remoteStatus}
          </span>
          {job.experienceClassification && (
            <span className="rounded-md border border-slate-150 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {job.experienceClassification}
            </span>
          )}
          {job.employmentType && (
            <span className="rounded-md border border-slate-150 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {job.employmentType}
            </span>
          )}
          <span className="rounded-md border border-slate-150 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
            Freshness: {job.freshnessScore}/100
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Opportunity Description
              </h2>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700 bg-slate-50/50 rounded-xl p-5 border border-slate-100">
                {job.description}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl bg-slate-50/50 p-4.5 border border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Compensation
              </h3>
              <p className="mt-2 text-sm font-semibold text-slate-800">
                {formatSalary(job.salaryMin, job.salaryMax)}
              </p>
            </div>

            {job.technologies.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Extracted Technologies
                </h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.technologies.map((tech) => (
                    <span
                      key={tech.id}
                      className="rounded-lg bg-indigo-50/70 border border-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700"
                    >
                      {tech.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl bg-slate-50/50 p-4.5 border border-slate-100 space-y-3.5">
              <div>
                <span className="block text-xxs font-bold uppercase tracking-wider text-slate-400">
                  Experience Required
                </span>
                <span className="mt-0.5 block text-xs font-medium text-slate-700">
                  {job.experienceRequired || "Not specified"}
                </span>
              </div>
              {job.companyUrl && (
                <div>
                  <span className="block text-xxs font-bold uppercase tracking-wider text-slate-400">
                    Company Website
                  </span>
                  <a
                    href={job.companyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 block text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    {job.companyUrl}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
