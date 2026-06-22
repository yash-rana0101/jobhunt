"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const API_BASE = "http://localhost:4000";

interface Job {
  id: string;
  title: string;
  company: string;
}

interface Application {
  id: string;
  job: Job;
}

interface Contact {
  id: string;
  name: string;
  email: string;
}

interface Message {
  id: string;
  subject: string;
  body: string;
  direction: "INBOUND" | "OUTBOUND";
  createdAt: string;
}

interface Thread {
  id: string;
  applicationId: string;
  contactId: string | null;
  createdAt: string;
  updatedAt: string;
  application: Application;
  contact: Contact | null;
  messages: Message[];
}

export default function ThreadsPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/threads`);
      const resJson = (await res.json()) as { success: boolean; data: Thread[] };
      if (resJson.success) {
        setThreads(resJson.data);
      }
    } catch (err) {
      console.error("Failed to fetch threads", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchThreads();
  }, [fetchThreads]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Conversation Threads</h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor interactive outreach dialogues, candidate-recruiter message flows, and follow-up
          activities.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
        </div>
      ) : threads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-500">No active threads</p>
          <p className="mt-1 text-xs text-slate-400">
            Communication threads will appear once messages are sent or received.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {threads.map((thread) => {
            const latestMsg = thread.messages?.[0];
            return (
              <div
                key={thread.id}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md md:flex-row md:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-500/10">
                      {thread.application?.job?.company || "Unknown Company"}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {thread.application?.job?.title || "Unknown Job"}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-slate-900">
                    <Link
                      href={`/threads/${thread.id}`}
                      className="hover:underline focus:outline-none"
                    >
                      {latestMsg?.subject || "Outreach Thread"}
                    </Link>
                  </h3>

                  {latestMsg ? (
                    <div className="mt-2 flex items-start gap-2 text-sm text-slate-600">
                      <span
                        className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-3xs font-bold uppercase ring-1 ring-inset ${
                          latestMsg.direction === "INBOUND"
                            ? "bg-purple-50 text-purple-700 ring-purple-600/10"
                            : "bg-indigo-50 text-indigo-700 ring-indigo-600/10"
                        }`}
                      >
                        {latestMsg.direction === "INBOUND" ? "REPLY" : "SENT"}
                      </span>
                      <p className="line-clamp-1 italic text-slate-500">"{latestMsg.body}"</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-400 italic">No messages sent yet</p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-start md:items-end gap-1.5 text-xs text-slate-500">
                  {thread.contact && (
                    <div className="font-semibold text-slate-700">
                      {thread.contact.name} ({thread.contact.email})
                    </div>
                  )}
                  <div>Last Active: {new Date(thread.updatedAt).toLocaleString()}</div>
                  <Link
                    href={`/threads/${thread.id}`}
                    className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-500 mt-1"
                  >
                    View Timeline
                    <span
                      aria-hidden="true"
                      className="transition group-hover:translate-x-1 inline-block"
                    >
                      &rarr;
                    </span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
