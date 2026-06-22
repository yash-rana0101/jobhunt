"use client";

import { useEffect, useState } from "react";
import type { ApiResponse } from "@job-hunter/shared";
import { ResumeVersionsList } from "./components/ResumeVersionsList";
import { ResumeComparator } from "./components/ResumeComparator";
import { ResumeSuggestions } from "./components/ResumeSuggestions";
import type { ResumeVersion } from "./types";

interface CandidateData {
  id: string;
  fullName: string;
  resumeText: string;
}

interface JobListItem {
  id: string;
  title: string;
  company: string;
}

export default function ResumePage() {
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<ResumeVersion | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);

  // Forms state
  const [targetJobId, setTargetJobId] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<string>("GENERAL");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load original candidate profile
        const candidateRes = await fetch("http://localhost:4000/resume");
        const candidateData = (await candidateRes.json()) as ApiResponse<CandidateData>;
        if (candidateData.success && candidateData.data) {
          setCandidate(candidateData.data);
        }

        // Load versions
        const versionsRes = await fetch("http://localhost:4000/resume/versions?pageSize=50");
        const versionsData = (await versionsRes.json()) as ApiResponse<ResumeVersion[]>;
        if (versionsData.success && Array.isArray(versionsData.data)) {
          setVersions(versionsData.data);
          if (versionsData.data.length > 0 && versionsData.data[0]) {
            await selectVersionDetails(versionsData.data[0].id);
          }
        }

        // Load jobs for selection dropdown
        const jobsRes = await fetch("http://localhost:4000/jobs?pageSize=100");
        const jobsData = (await jobsRes.json()) as ApiResponse<
          { id: string; title: string; company: string }[]
        >;
        if (jobsData.success && Array.isArray(jobsData.data)) {
          setJobs(jobsData.data);
        }
      } catch (err) {
        console.error("Failed to load initial resume dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  async function selectVersionDetails(id: string) {
    try {
      const res = await fetch(`http://localhost:4000/resume/version/${id}`);
      const data = (await res.json()) as ApiResponse<ResumeVersion>;
      if (data.success && data.data) {
        setSelectedVersion(data.data);
      }
    } catch (err) {
      console.error("Failed to load version details", err);
    }
  }

  const handleSelectVersion = (id: string) => {
    void selectVersionDetails(id);
  };

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!candidate) return;

    try {
      setGenerating(true);
      const res = await fetch("http://localhost:4000/resume/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: targetJobId || undefined,
          candidateId: candidate.id,
          variant: selectedVariant,
        }),
      });

      const data = (await res.json()) as ApiResponse<ResumeVersion>;
      if (data.success && data.data) {
        setVersions((prev) => [data.data, ...prev]);
        setSelectedVersion(data.data);
        alert("Tailored Resume variant created successfully!");
      } else {
        const errorMsg = !data.success ? data.error.message : "Unknown error occurred";
        alert("Failed to tailor resume: " + errorMsg);
      }
    } catch (err) {
      console.error("Failed to generate resume variant", err);
      alert("Error generating resume variant");
    } finally {
      setGenerating(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    void handleGenerate(e);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Resume Tailoring & ATS Optimization
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Generate highly tailored, ATS-compliant resumes for specific target jobs.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Side: Create form & Versions list */}
        <div className="lg:col-span-1 space-y-8">
          {/* Optimization Form */}
          <div className="rounded-xl border border-slate-150 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Tailor New Resume</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Target Job
                </label>
                <select
                  value={targetJobId}
                  onChange={(e) => setTargetJobId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  <option value="">General Market (No Specific Job)</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.company} - {job.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Target Focus Profile
                </label>
                <select
                  value={selectedVariant}
                  onChange={(e) => setSelectedVariant(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  <option value="GENERAL">General Engineer</option>
                  <option value="STARTUP">Startup Focus</option>
                  <option value="BACKEND">Backend Developer</option>
                  <option value="FULL_STACK">Full Stack Engineer</option>
                  <option value="AI_ENGINEER">AI / LLM Specialist</option>
                  <option value="FOUNDING_ENGINEER">Founding Engineer</option>
                  <option value="DEVOPS">DevOps & Cloud</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={generating || !candidate}
                className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:bg-slate-300 transition"
              >
                {generating ? "Tailoring & Scoring..." : "Generate Tailored Resume"}
              </button>
            </form>
          </div>

          {/* Versions list */}
          <ResumeVersionsList
            versions={versions}
            selectedId={selectedVersion?.id || null}
            onSelect={handleSelectVersion}
            loading={loading}
          />
        </div>

        {/* Right Side: Active details comparator and suggestions */}
        <div className="lg:col-span-2 space-y-8">
          {selectedVersion ? (
            <>
              {/* ATS scores and suggestions */}
              {selectedVersion.scores?.[0] && (
                <ResumeSuggestions score={selectedVersion.scores[0]} />
              )}

              {/* Side-by-side comparator */}
              <ResumeComparator
                version={selectedVersion}
                originalText={candidate?.resumeText || ""}
              />
            </>
          ) : (
            <div className="flex h-96 items-center justify-center rounded-xl border border-dashed border-slate-200 p-12 text-center">
              <div className="space-y-2">
                <span className="text-2xl">📝</span>
                <h3 className="text-sm font-semibold text-slate-800">No Resume Selected</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Select a tailored version from the left panel or input a new target job to begin
                  optimization.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
