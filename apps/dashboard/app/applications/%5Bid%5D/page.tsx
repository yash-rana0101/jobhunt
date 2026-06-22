"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ApplicationTimeline } from "../../components/application-timeline";
import { ApplicationNotes } from "../../components/application-notes";

const API_BASE = "http://localhost:4000";

type AppDetail = {
  id: string;
  status: string;
  priority: number;
  source: string | null;
  appliedDate: string | null;
  job: {
    title: string;
    company: string;
    description: string;
    remoteStatus: string;
    match?: {
      matchScore: number;
    } | null;
  };
  company?: {
    website?: string | null;
    careersUrl?: string | null;
  } | null;
  activities: Array<{
    id: string;
    activityType: string;
    title: string;
    description: string | null;
    createdAt: Date;
  }>;
  interviews: Array<{
    id: string;
    roundName: string;
    interviewerName: string | null;
    scheduledAt: Date;
    status: string;
  }>;
  offers: Array<{
    id: string;
    baseSalary: number | null;
    bonus: number | null;
    equity: string | null;
    status: string;
  }>;
  notes: Array<{ id: string; noteType: string; content: string; createdAt: Date }>;
  reminders: Array<{ id: string; title: string; dueDate: Date; status: string }>;
  statusHistory: Array<{
    id: string;
    oldStatus: string | null;
    newStatus: string;
    reason: string | null;
    createdAt: Date;
  }>;
};

export default function ApplicationDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [app, setApp] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusReason, setStatusReason] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/applications/${id}`);
      const resJson = (await res.json()) as { success: boolean; data: AppDetail };
      if (resJson.success) {
        setApp(resJson.data);
        setNewStatus(resJson.data.status);
      }
    } catch (err) {
      console.error("Failed to fetch application details", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      void fetchDetail();
    }
  }, [id, fetchDetail]);

  const handleStatusChange = async () => {
    if (!newStatus || newStatus === app?.status) return;
    try {
      const res = await fetch(`${API_BASE}/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, reason: statusReason }),
      });
      const resJson = (await res.json()) as { success: boolean; data: AppDetail };
      if (resJson.success) {
        setStatusReason("");
        void fetchDetail();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const onStatusUpdate = () => {
    void handleStatusChange();
  };

  const handleAddNote = async (noteType: string, content: string) => {
    await fetch(`${API_BASE}/applications/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteType, content }),
    });
    void fetchDetail();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50/50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="text-lg font-semibold text-slate-900">Application not found</p>
        <Link href="/applications" className="mt-4 inline-block text-sm font-bold text-indigo-600">
          ← Back to Pipeline
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 space-y-8 bg-slate-50/30">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <Link
            href="/applications"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            ← Back to Pipeline
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{app.job.title}</h1>
          <p className="text-sm font-medium text-slate-500">{app.job.company}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
            Priority Score: {app.priority}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            Status: {app.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Job Details Section */}
          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-50 pb-3">
              Role & Context Description
            </h2>
            <p className="mt-4 text-xs leading-relaxed text-slate-600 whitespace-pre-line">
              {app.job.description}
            </p>
          </div>

          {/* Activities log and Timeline */}
          <ApplicationTimeline activities={app.activities} statusHistory={app.statusHistory} />

          {/* Notes component */}
          <ApplicationNotes notes={app.notes} onAddNote={handleAddNote} />
        </div>

        <div className="space-y-6">
          {/* Application State Transition Form */}
          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-950 text-sm">Update Status</h3>
            <div className="space-y-3">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs font-medium focus:border-indigo-500 focus:outline-none"
              >
                <option value="DISCOVERED">Discovered</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="READY_TO_APPLY">Ready to Apply</option>
                <option value="APPLIED">Applied</option>
                <option value="OUTREACH_SENT">Outreach Sent</option>
                <option value="REPLIED">Replied</option>
                <option value="PHONE_SCREEN">Phone Screen</option>
                <option value="TECHNICAL_ROUND">Technical Round</option>
                <option value="SYSTEM_DESIGN">System Design</option>
                <option value="TAKE_HOME">Take Home Round</option>
                <option value="MANAGER_ROUND">Manager Round</option>
                <option value="FINAL_ROUND">Final Round</option>
                <option value="OFFER_RECEIVED">Offer Received</option>
                <option value="OFFER_ACCEPTED">Offer Accepted</option>
                <option value="OFFER_DECLINED">Offer Declined</option>
                <option value="REJECTED">Rejected</option>
                <option value="WITHDRAWN">Withdrawn</option>
                <option value="ARCHIVED">Archived</option>
              </select>

              <input
                type="text"
                placeholder="Reason for change (optional)..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
              />

              <button
                onClick={onStatusUpdate}
                disabled={newStatus === app.status}
                className="w-full rounded-lg bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
              >
                Update Status
              </button>
            </div>
          </div>

          {/* Follow-up Reminders Checklist */}
          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-950 text-sm">Follow-up Reminders</h3>
            <div className="space-y-3">
              {app.reminders.map((rem) => (
                <div key={rem.id} className="flex items-start gap-2.5 text-xs">
                  <span
                    className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-3xs font-semibold ${
                      rem.status === "COMPLETED"
                        ? "bg-slate-100 text-slate-600"
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}
                  >
                    {rem.status}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">{rem.title}</p>
                    <p className="text-3xs text-slate-400">
                      Due: {new Date(rem.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {app.reminders.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">No active reminders.</p>
              )}
            </div>
          </div>

          {/* Offer Information Card */}
          {app.offers.length > 0 && (
            <div className="rounded-xl border border-rose-100 bg-rose-50/20 p-5 shadow-sm space-y-3">
              <h3 className="font-semibold text-rose-900 text-sm">Offer Details</h3>
              {app.offers.map((off) => (
                <div key={off.id} className="space-y-2 text-xs text-slate-700">
                  <p>
                    <strong>Base Salary:</strong> ${off.baseSalary?.toLocaleString() ?? "N/A"}
                  </p>
                  <p>
                    <strong>Bonus:</strong> ${off.bonus?.toLocaleString() ?? "N/A"}
                  </p>
                  <p>
                    <strong>Equity:</strong> {off.equity ?? "N/A"}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span className="font-bold text-rose-700">{off.status}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
