"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const API_BASE = "http://localhost:4000";

interface Delivery {
  id: string;
  status: string;
}

interface Reply {
  id: string;
  sentiment: string | null;
  responseCategory: string;
}

interface Communication {
  id: string;
  status: string;
  deliveries: Delivery[];
  replies: Reply[];
}

export default function CommunicationAnalyticsPage() {
  const [comms, setComms] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComms = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch up to 100 communications to compute real metrics
      const res = await fetch(`${API_BASE}/communications?pageSize=100`);
      const resJson = (await res.json()) as { success: boolean; data: Communication[] };
      if (resJson.success) {
        setComms(resJson.data);
      }
    } catch (err) {
      console.error("Failed to fetch communication history for analytics", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchComms();
  }, [fetchComms]);

  // Compute metrics dynamically from database records
  const totalOutreaches = comms.length;
  const sentComms = comms.filter((c) =>
    ["SENT", "DELIVERED", "OPENED", "CLICKED", "REPLIED"].includes(c.status),
  );
  const totalSent = sentComms.length;

  const deliveredComms = comms.filter((c) =>
    ["DELIVERED", "OPENED", "CLICKED", "REPLIED"].includes(c.status),
  );
  const totalDelivered = deliveredComms.length;

  const openedComms = comms.filter((c) => ["OPENED", "CLICKED", "REPLIED"].includes(c.status));
  const totalOpened = openedComms.length;

  const clickedComms = comms.filter((c) => ["CLICKED", "REPLIED"].includes(c.status));
  const totalClicked = clickedComms.length;

  const repliedComms = comms.filter((c) => c.status === "REPLIED");
  const totalReplied = repliedComms.length;

  const failedComms = comms.filter((c) => ["FAILED", "BOUNCED"].includes(c.status));
  const totalFailed = failedComms.length;

  // Rates calculations
  const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
  const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
  const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
  const replyRate = totalDelivered > 0 ? (totalReplied / totalDelivered) * 100 : 0;

  // Sentiment Breakdown
  const sentiments: Record<string, number> = { POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0, UNKNOWN: 0 };
  const categories: Record<string, number> = {};

  comms.forEach((c) => {
    c.replies.forEach((r) => {
      const s = (r.sentiment || "UNKNOWN").toUpperCase();
      sentiments[s] = (sentiments[s] || 0) + 1;

      const cat = r.responseCategory;
      categories[cat] = (categories[cat] || 0) + 1;
    });
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6 gap-4">
        <div>
          <Link
            href="/analytics"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            ← Back to General Analytics
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Communication Performance
          </h1>
          <p className="text-sm text-slate-500">
            Real-time outreach conversion metrics, open rates, response rates, and sentiment
            tracking.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-3xs font-semibold uppercase tracking-wider text-slate-500">
                Outreach Volume
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{totalOutreaches}</p>
              <p className="mt-1 text-3xs text-slate-400">
                Total logs: {totalSent} sent, {totalFailed} failed
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-3xs font-semibold uppercase tracking-wider text-slate-500">
                Email Open Rate
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{openRate.toFixed(1)}%</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${openRate}%` }} />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-3xs font-semibold uppercase tracking-wider text-slate-500">
                Link Click Rate
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{clickRate.toFixed(1)}%</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                <div
                  className="h-1.5 rounded-full bg-emerald-500"
                  style={{ width: `${clickRate}%` }}
                />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-3xs font-semibold uppercase tracking-wider text-slate-500">
                Recruiter Response Rate
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{replyRate.toFixed(1)}%</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                <div
                  className="h-1.5 rounded-full bg-purple-500"
                  style={{ width: `${replyRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Delivery Funnel Analysis */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-3">
                Deliverability Funnel Breakdown
              </h3>
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">1. Delivery Success</span>
                    <span className="text-slate-500">
                      {totalDelivered} / {totalSent} ({deliveryRate.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-indigo-600"
                      style={{ width: `${deliveryRate}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">2. Recruiter Opens</span>
                    <span className="text-slate-500">
                      {totalOpened} / {totalDelivered} ({openRate.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${openRate}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">
                      3. Dynamic Interactions (Clicks)
                    </span>
                    <span className="text-slate-500">
                      {totalClicked} / {totalOpened} ({clickRate.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${clickRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sentiment and Classification breakdown */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-3 mb-4">
                  Reply Sentiment Distribution
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="rounded-lg bg-emerald-50/50 border border-emerald-100 p-3">
                    <div className="text-3xs font-semibold text-emerald-700">POSITIVE</div>
                    <div className="text-xl font-bold text-emerald-900 mt-1">
                      {sentiments.POSITIVE || 0}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <div className="text-3xs font-semibold text-slate-600">NEUTRAL</div>
                    <div className="text-xl font-bold text-slate-800 mt-1">
                      {sentiments.NEUTRAL || 0}
                    </div>
                  </div>
                  <div className="rounded-lg bg-rose-50/50 border border-rose-100 p-3">
                    <div className="text-3xs font-semibold text-rose-700">NEGATIVE</div>
                    <div className="text-xl font-bold text-rose-900 mt-1">
                      {sentiments.NEGATIVE || 0}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-3 mb-3">
                  Response Category Classifications
                </h3>
                {Object.keys(categories).length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">
                    No category data recorded.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(categories).map(([cat, count]) => (
                      <div
                        key={cat}
                        className="flex justify-between items-center text-xs text-slate-700"
                      >
                        <span className="font-medium">{cat.replace(/_/g, " ")}</span>
                        <span className="rounded bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
