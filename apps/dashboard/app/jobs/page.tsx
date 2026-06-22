"use client";

import { useEffect, useState, useCallback } from "react";
import { JobsStats } from "../components/jobs-stats";
import { JobsFilters } from "../components/jobs-filters";
import { JobsTable } from "../components/jobs-table";
import type { DashboardAnalytics } from "../components/jobs-stats";

const API_BASE = "http://localhost:4000";

type FiltersState = {
  search: string;
  remote: string;
  source: string;
  experience: string;
};

type JobListItem = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  remoteStatus: string;
  source: string;
  postedDate: string | null;
  crawlTimestamp: string;
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

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isDiscovering, setIsDiscovering] = useState(false);

  const [filters, setFilters] = useState<FiltersState>({
    search: "",
    remote: "",
    source: "",
    experience: "",
  });

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "10",
        search: filters.search,
        remote: filters.remote,
        source: filters.source,
        experience: filters.experience,
      });

      const res = await fetch(`${API_BASE}/jobs?${params}`);
      const data = (await res.json()) as ApiResult<JobListItem[]>;
      if (data.success) {
        setJobs(data.data);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  const fetchAnalytics = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/jobs/analytics`);
      const data = (await res.json()) as ApiResult<DashboardAnalytics>;
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  const handleDiscover = async () => {
    setIsDiscovering(true);
    try {
      const res = await fetch(`${API_BASE}/jobs/discover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 5 }),
      });
      const data = (await res.json()) as ApiResult<{ message: string; status: string }>;
      if (data.success) {
        // Poll status or just refresh after a brief delay
        setTimeout(() => {
          void fetchJobs();
          void fetchAnalytics();
          setIsDiscovering(false);
        }, 3000);
      } else {
        setIsDiscovering(false);
      }
    } catch (err) {
      console.error("Job discovery fail", err);
      setIsDiscovering(false);
    }
  };

  const handleFiltersChange = (newFilters: FiltersState) => {
    setFilters(newFilters);
    setPage(1); // Reset page on filter change
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Job Opportunity Discovery
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Automatically discover, crawl, and normalize active listings relevant to your profile.
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        <JobsStats analytics={analytics} loading={statsLoading} />

        <JobsFilters
          filters={filters}
          onChange={handleFiltersChange}
          onDiscover={handleDiscover}
          isDiscovering={isDiscovering}
        />

        <JobsTable jobs={jobs} loading={loading} />

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
