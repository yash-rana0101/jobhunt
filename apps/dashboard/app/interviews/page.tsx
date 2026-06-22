"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const API_BASE = "http://localhost:4000";

type InterviewItem = {
  id: string;
  roundName: string;
  interviewerName: string | null;
  interviewerRole: string | null;
  scheduledAt: string;
  duration: number;
  meetingLink: string | null;
  notes: string | null;
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

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [apps, setApps] = useState<AppOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [applicationId, setApplicationId] = useState("");
  const [roundName, setRoundName] = useState("");
  const [interviewerName, setInterviewerName] = useState("");
  const [interviewerRole, setInterviewerRole] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState("45");
  const [meetingLink, setMeetingLink] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [intRes, appRes] = await Promise.all([
        fetch(`${API_BASE}/interviews`),
        fetch(`${API_BASE}/applications?pageSize=100`),
      ]);
      const intJson = (await intRes.json()) as { success: boolean; data: InterviewItem[] };
      const appJson = (await appRes.json()) as { success: boolean; data: AppOption[] };

      if (intJson.success) setInterviews(intJson.data);
      if (appJson.success) setApps(appJson.data);
    } catch (err) {
      console.error("Failed to load interview dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId || !roundName || !scheduledAt) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          roundName,
          interviewerName: interviewerName || undefined,
          interviewerRole: interviewerRole || undefined,
          scheduledAt,
          duration: parseInt(duration, 10),
          meetingLink: meetingLink || undefined,
          notes: notes || undefined,
          status: "SCHEDULED",
        }),
      });

      const resJson = (await res.json()) as { success: boolean; data: InterviewItem };
      if (resJson.success) {
        setRoundName("");
        setInterviewerName("");
        setInterviewerRole("");
        setScheduledAt("");
        setMeetingLink("");
        setNotes("");
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-sky-50 text-sky-700 border-sky-100";
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "CANCELLED":
        return "bg-rose-50 text-rose-700 border-rose-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 space-y-8 bg-slate-50/10">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Interviews & Conversations
        </h1>
        <p className="text-sm text-slate-500">
          Track upcoming conversations, technical evaluations, loop panels, and follow-ups.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-slate-800">Scheduled Interviews</h2>
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {interviews.map((int) => (
                <div
                  key={int.id}
                  className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm space-y-3 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <div>
                      <span className="font-semibold text-slate-800 text-sm">{int.roundName}</span>
                      <p className="text-3xs text-slate-400 mt-0.5">
                        {int.application.job.company} — {int.application.job.title}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-2xs font-semibold ${getStatusBadge(int.status)}`}
                    >
                      {int.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
                    <div>
                      <p>
                        📅 <strong>Date:</strong> {formatDate(int.scheduledAt)}
                      </p>
                      <p className="mt-1">
                        🕒 <strong>Time:</strong> {formatTime(int.scheduledAt)} ({int.duration}{" "}
                        mins)
                      </p>
                    </div>
                    <div>
                      <p>
                        👤 <strong>Interviewer:</strong> {int.interviewerName || "Not specified"}{" "}
                        {int.interviewerRole ? `(${int.interviewerRole})` : ""}
                      </p>
                      {int.meetingLink && (
                        <p className="mt-1">
                          🔗 <strong>Meeting:</strong>{" "}
                          <a
                            href={int.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 font-bold hover:underline"
                          >
                            Join Link
                          </a>
                        </p>
                      )}
                    </div>
                  </div>

                  {int.notes && (
                    <div className="bg-slate-50 p-2.5 rounded text-2xs text-slate-500 whitespace-pre-wrap">
                      <strong>Notes:</strong> {int.notes}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <Link
                      href={`/applications/${int.application.id}`}
                      className="text-2xs font-bold text-indigo-600 hover:text-indigo-850"
                    >
                      View Full Application Context →
                    </Link>
                  </div>
                </div>
              ))}
              {interviews.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center">
                  <p className="text-sm font-semibold text-slate-700">No interviews scheduled</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Ready when you arrange a phone screen or panel loop.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Schedule Interview Form Panel */}
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm space-y-4 self-start">
          <h2 className="text-sm font-semibold text-slate-800">Schedule Interview</h2>
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

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Round Name</label>
              <input
                type="text"
                placeholder="e.g. Technical Screen, System Design"
                value={roundName}
                onChange={(e) => setRoundName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Interviewer Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={interviewerName}
                  onChange={(e) => setInterviewerName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Interviewer Role</label>
                <input
                  type="text"
                  placeholder="VP of Engineering"
                  value={interviewerRole}
                  onChange={(e) => setInterviewerRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Duration (mins)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Meeting Link</label>
              <input
                type="url"
                placeholder="https://zoom.us/..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Prep / Agenda Notes</label>
              <textarea
                placeholder="Preparation notes, core topics..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-200 p-2 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Scheduling..." : "Schedule Interview"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
