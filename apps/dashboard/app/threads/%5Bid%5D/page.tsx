"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const API_BASE = "http://localhost:4000";

interface Message {
  id: string;
  subject: string;
  body: string;
  direction: "INBOUND" | "OUTBOUND";
  createdAt: string;
}

interface Delivery {
  id: string;
  status: string;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  failedAt: string | null;
  errorMessage: string | null;
}

interface Reply {
  id: string;
  content: string;
  sentiment: string | null;
  responseCategory: string;
  confidence: number;
  receivedAt: string;
}

interface Communication {
  id: string;
  subject: string;
  status: string;
  type: string;
  createdAt: string;
  deliveries: Delivery[];
  replies: Reply[];
}

interface FollowUp {
  id: string;
  sequence: number;
  scheduledAt: string;
  status: string;
}

interface ThreadDetails {
  id: string;
  subject: string;
  application: {
    id: string;
    job: {
      title: string;
      company: string;
    };
  } | null;
  contact: {
    id: string;
    name: string;
    email: string;
  } | null;
  messages: Message[];
  communications: Communication[];
  followUps: FollowUp[];
}

export default function ThreadDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [thread, setThread] = useState<ThreadDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulation form state
  const [simSubject, setSimSubject] = useState("");
  const [simBody, setSimBody] = useState("");
  const [simulating, setSimulating] = useState(false);

  const fetchThread = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/threads/${id}`);
      const resJson = (await res.json()) as { success: boolean; data: ThreadDetails };
      if (resJson.success) {
        setThread(resJson.data);
        if (resJson.data.subject) {
          setSimSubject(`Re: ${resJson.data.subject}`);
        }
      }
    } catch (err) {
      console.error("Failed to fetch thread details", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchThread();
  }, [id, fetchThread]);

  const handleCancelSequence = async () => {
    if (!thread) return;
    try {
      const res = await fetch(`${API_BASE}/communications/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: thread.id }),
      });
      const data = (await res.json()) as { success: boolean; error?: { message: string } };
      if (data.success) {
        void fetchThread();
      } else {
        alert(data.error?.message || "Failed to cancel sequence");
      }
    } catch (err) {
      console.error("Error cancelling follow-ups", err);
    }
  };

  const handleSimulateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thread || !simBody) return;
    setSimulating(true);
    try {
      const res = await fetch(`${API_BASE}/communications/simulate-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: thread.id,
          subject: simSubject,
          body: simBody,
        }),
      });
      const data = (await res.json()) as { success: boolean; error?: { message: string } };
      if (data.success) {
        setSimBody("");
        void fetchThread();
      } else {
        alert(data.error?.message || "Simulation failed");
      }
    } catch (err) {
      console.error("Error simulating reply", err);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50/30">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="text-lg font-semibold text-slate-900">Thread not found</p>
        <Link href="/threads" className="mt-4 inline-block text-sm font-bold text-indigo-600">
          ← Back to Threads
        </Link>
      </div>
    );
  }

  const activeFollowUps = thread.followUps.filter(
    (f) => f.status === "PENDING" || f.status === "SCHEDULED",
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 space-y-8 bg-slate-50/10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <Link href="/threads" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
            ← Back to Threads
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {thread.subject}
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Job Hunt Conversation for {thread.application?.job.company || "Unknown Company"} &bull;{" "}
            {thread.application?.job.title}
          </p>
        </div>
        {thread.contact && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs shadow-sm">
            <p className="font-semibold text-slate-900">Contact: {thread.contact.name}</p>
            <p className="text-slate-500">{thread.contact.email}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              Messages Timeline
            </h2>
            <div className="space-y-4">
              {thread.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col rounded-lg p-4 border max-w-[85%] ${
                    msg.direction === "OUTBOUND"
                      ? "ml-auto bg-indigo-50/50 border-indigo-100 text-slate-800"
                      : "mr-auto bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <div className="flex justify-between items-center gap-4 pb-2 border-b border-slate-200/50 mb-2">
                    <span className="text-xs font-bold text-slate-900">
                      {msg.direction === "OUTBOUND" ? "Outbound Outreach" : "Inbound Recruiter"}
                    </span>
                    <span className="text-3xs text-slate-400">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-500 mb-1">
                    Subject: {msg.subject}
                  </div>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                </div>
              ))}
              {thread.messages.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">No communication records.</p>
              )}
            </div>
          </div>

          <form
            onSubmit={(e) => void handleSimulateReply(e)}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
          >
            <h3 className="font-semibold text-slate-900 text-sm">
              Simulate Recruiter Email Response
            </h3>
            <p className="text-3xs text-slate-500">
              Send an email reply simulation to test the background sentiment analysis, classifier
              categorization, and automated schedule halting.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-3xs font-semibold text-slate-600 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={simSubject}
                  onChange={(e) => setSimSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-3xs font-semibold text-slate-600 mb-1">
                  Body Content
                </label>
                <textarea
                  required
                  rows={3}
                  value={simBody}
                  onChange={(e) => setSimBody(e.target.value)}
                  placeholder="e.g. Thanks for reaching out, Yash. Let's schedule a call this Thursday at 2 PM."
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={simulating}
                className="w-full rounded-lg bg-purple-600 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-500 disabled:opacity-50 transition"
              >
                {simulating ? "Simulating..." : "Receive Simulated Inbound Reply"}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-slate-900 text-sm">Follow-up Sequence</h3>
              {activeFollowUps.length > 0 && (
                <button
                  onClick={() => void handleCancelSequence()}
                  className="text-3xs font-bold text-rose-600 hover:text-rose-500 hover:underline"
                >
                  Cancel All
                </button>
              )}
            </div>
            <div className="space-y-3">
              {thread.followUps.map((fu) => (
                <div
                  key={fu.id}
                  className="flex justify-between items-center gap-2 text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-semibold text-slate-800">Sequence #{fu.sequence}</p>
                    <p className="text-3xs text-slate-400">
                      Target: {new Date(fu.scheduledAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-3xs font-bold ${
                      fu.status === "PENDING" || fu.status === "SCHEDULED"
                        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-600/15"
                        : fu.status === "SENT"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {fu.status}
                  </span>
                </div>
              ))}
              {thread.followUps.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">No follow-ups scheduled.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-3">
              Sentiment & Classification Logs
            </h3>
            <div className="space-y-3">
              {thread.communications.map((comm) =>
                comm.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="rounded-lg bg-slate-50 p-3 border border-slate-100 space-y-2"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="inline-flex items-center rounded bg-purple-50 px-1.5 py-0.5 text-3xs font-bold text-purple-700 border border-purple-100">
                        {reply.responseCategory}
                      </span>
                      <span className="text-3xs text-slate-400 font-semibold">
                        Conf: {(reply.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-3xs text-slate-600 italic leading-relaxed">
                      "{reply.content}"
                    </p>
                    <div className="flex justify-between items-center text-3xs text-slate-400 border-t border-slate-200/50 pt-1">
                      <span>
                        Sentiment:{" "}
                        <span className="font-bold text-slate-600">
                          {reply.sentiment || "UNKNOWN"}
                        </span>
                      </span>
                      <span>{new Date(reply.receivedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                )),
              )}
              {thread.communications.every((c) => c.replies.length === 0) && (
                <p className="text-xs text-slate-400 text-center py-2">
                  No reply analytics recorded.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
