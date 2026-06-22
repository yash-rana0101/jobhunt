"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const API_BASE = "http://localhost:4000";

type OfferItem = {
  id: string;
  baseSalary: number | null;
  bonus: number | null;
  equity: string | null;
  joiningBonus: number | null;
  benefits: string | null;
  location: string | null;
  employmentType: string | null;
  offerDate: string | null;
  deadline: string | null;
  status: string;
  application: {
    id: string;
    job: {
      title: string;
      company: string;
    };
  };
};

type AppOption = {
  id: string;
  job: {
    title: string;
    company: string;
  };
};

export default function OffersPage() {
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [apps, setApps] = useState<AppOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [applicationId, setApplicationId] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [bonus, setBonus] = useState("");
  const [equity, setEquity] = useState("");
  const [joiningBonus, setJoiningBonus] = useState("");
  const [benefits, setBenefits] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("FULL_TIME");
  const [offerDate, setOfferDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [offRes, appRes] = await Promise.all([
        fetch(`${API_BASE}/offers`),
        fetch(`${API_BASE}/applications?pageSize=100`),
      ]);
      const offJson = (await offRes.json()) as { success: boolean; data: OfferItem[] };
      const appJson = (await appRes.json()) as { success: boolean; data: AppOption[] };

      if (offJson.success) setOffers(offJson.data);
      if (appJson.success) setApps(appJson.data);
    } catch (err) {
      console.error("Failed to load offer dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId || !status) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          baseSalary: baseSalary ? parseFloat(baseSalary) : undefined,
          bonus: bonus ? parseFloat(bonus) : undefined,
          equity: equity || undefined,
          joiningBonus: joiningBonus ? parseFloat(joiningBonus) : undefined,
          benefits: benefits || undefined,
          location: location || undefined,
          employmentType,
          offerDate: offerDate || undefined,
          deadline: deadline || undefined,
          status,
        }),
      });

      const resJson = (await res.json()) as { success: boolean; data: OfferItem };
      if (resJson.success) {
        setBaseSalary("");
        setBonus("");
        setEquity("");
        setJoiningBonus("");
        setBenefits("");
        setLocation("");
        setOfferDate("");
        setDeadline("");
        void fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    void handleSubmit(e);
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "ACCEPTED":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "PENDING":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "NEGOTIATING":
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "DECLINED":
      case "EXPIRED":
        return "bg-rose-50 text-rose-700 border-rose-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 space-y-8 bg-slate-50/10">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Job Offers & Compensation
        </h1>
        <p className="text-sm text-slate-500">
          Track salary offers, equity allocations, joining bonuses, and response deadlines.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-slate-800">Logged Offers</h2>
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {offers.map((off) => (
                <div
                  key={off.id}
                  className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm space-y-3 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <div>
                      <span className="font-semibold text-slate-800 text-sm">
                        {off.application.job.company}
                      </span>
                      <p className="text-3xs text-slate-400 mt-0.5">{off.application.job.title}</p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-2xs font-semibold ${getStatusBadge(off.status)}`}
                    >
                      {off.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-xs text-slate-600">
                    <div>
                      <p className="text-3xs uppercase tracking-wide text-slate-400 font-bold">
                        Base Salary
                      </p>
                      <p className="mt-1 font-semibold text-slate-800 text-sm">
                        {off.baseSalary ? `$${off.baseSalary.toLocaleString()}` : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-3xs uppercase tracking-wide text-slate-400 font-bold">
                        Equity
                      </p>
                      <p className="mt-1 font-semibold text-slate-800 text-sm">
                        {off.equity || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-3xs uppercase tracking-wide text-slate-400 font-bold">
                        Signing Bonus
                      </p>
                      <p className="mt-1 font-semibold text-slate-800 text-sm">
                        {off.joiningBonus ? `$${off.joiningBonus.toLocaleString()}` : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1.5 text-xs text-slate-550 border-t border-slate-50">
                    <div>
                      <p>
                        📋 <strong>Type:</strong>{" "}
                        {off.employmentType?.replace(/_/g, " ") || "Full Time"}
                      </p>
                      <p className="mt-1">
                        📍 <strong>Location:</strong> {off.location || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p>
                        📅 <strong>Date Recv:</strong> {formatDate(off.offerDate)}
                      </p>
                      <p className="mt-1 text-rose-600 font-medium">
                        🚨 <strong>Deadline:</strong> {formatDate(off.deadline)}
                      </p>
                    </div>
                  </div>

                  {off.benefits && (
                    <div className="bg-slate-50 p-2.5 rounded text-2xs text-slate-500">
                      <strong>Benefits:</strong> {off.benefits}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <Link
                      href={`/applications/${off.application.id}`}
                      className="text-2xs font-bold text-indigo-600 hover:text-indigo-850"
                    >
                      View Application Pipeline →
                    </Link>
                  </div>
                </div>
              ))}
              {offers.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center">
                  <p className="text-sm font-semibold text-slate-700">No offers logged yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Offers will appear here once tracked or received.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Log New Offer Form Panel */}
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm space-y-4 self-start">
          <h2 className="text-sm font-semibold text-slate-800">Log New Offer</h2>
          <form onSubmit={onSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Select Job Application</label>
              <select
                value={applicationId}
                onChange={(e) => setApplicationId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 focus:border-indigo-500 focus:outline-none"
                required
              >
                <option value="">-- Choose Job --</option>
                {apps.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.job.company} - {a.job.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Base Salary ($)</label>
                <input
                  type="number"
                  placeholder="120000"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Annual Bonus ($)</label>
                <input
                  type="number"
                  placeholder="15000"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Equity Grant</label>
                <input
                  type="text"
                  placeholder="0.1% or 10k options"
                  value={equity}
                  onChange={(e) => setEquity(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Signing Bonus ($)</label>
                <input
                  type="number"
                  placeholder="10000"
                  value={joiningBonus}
                  onChange={(e) => setJoiningBonus(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Offer Location</label>
              <input
                type="text"
                placeholder="San Francisco, CA or Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Job Type</label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERN">Internship</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Offer Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="PENDING">Pending</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="DECLINED">Declined</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="NEGOTIATING">Negotiating</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Offer Date</label>
                <input
                  type="date"
                  value={offerDate}
                  onChange={(e) => setOfferDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Decision Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Benefits & Perks Summary</label>
              <textarea
                placeholder="401k match, health insurance, gym stipend..."
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-200 p-2 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Logging..." : "Log Offer Details"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
