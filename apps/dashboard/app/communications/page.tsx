"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const API_BASE = "http://localhost:4000";

interface Recipient {
  id: string;
  email: string;
  role: string;
}

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

interface Communication {
  id: string;
  threadId: string;
  subject: string;
  type: string;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  application: Application;
  contact: Contact | null;
  recipients: Recipient[];
}

export default function CommunicationsPage() {
  const [comms, setComms] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchComms = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "10",
        search,
        status,
      });
      const res = await fetch(`${API_BASE}/communications?${params.toString()}`);
      const resJson = (await res.json()) as {
        success: boolean;
        data: Communication[];
        pagination?: { totalPages: number };
      };
      if (resJson.success) {
        setComms(resJson.data);
        if (resJson.pagination) {
          setTotalPages(resJson.pagination.totalPages);
        }
      }
    } catch (err) {
      console.error("Failed to fetch communications", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    void fetchComms();
  }, [fetchComms]);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/communications/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = (await res.json()) as { success: boolean; error?: { message: string } };
      if (data.success) {
        void fetchComms();
      } else {
        alert(`Error: ${data.error?.message || "Failed to approve"}`);
      }
    } catch (err) {
      console.error("Failed to approve communication", err);
    }
  };

  const handleCancel = async (threadId: string) => {
    try {
      const res = await fetch(`${API_BASE}/communications/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId }),
      });
      const data = (await res.json()) as { success: boolean; error?: { message: string } };
      if (data.success) {
        void fetchComms();
      } else {
        alert(`Error: ${data.error?.message || "Failed to cancel sequence"}`);
      }
    } catch (err) {
      console.error("Failed to cancel communication thread", err);
    }
  };

  const getStatusBadgeClass = (statusStr: string) => {
    switch (statusStr) {
      case "DRAFT":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "SCHEDULED":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "APPROVED":
        return "bg-indigo-50 text-indigo-700 border border-indigo-200";
      case "SENT":
        return "bg-slate-50 text-slate-700 border border-slate-200";
      case "DELIVERED":
        return "bg-teal-50 text-teal-700 border border-teal-200";
      case "OPENED":
        return "bg-cyan-50 text-cyan-700 border border-cyan-200";
      case "CLICKED":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "REPLIED":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "BOUNCED":
      case "FAILED":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Communication Outbox</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track outbound email delivery, approvals, scheduling, and recipient engagement.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search subject or provider..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="APPROVED">Approved</option>
            <option value="SENT">Sent</option>
            <option value="DELIVERED">Delivered</option>
            <option value="OPENED">Opened</option>
            <option value="CLICKED">Clicked</option>
            <option value="REPLIED">Replied</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
        </div>
      ) : comms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-500">No communications found</p>
          <p className="mt-1 text-xs text-slate-400">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="px-6 py-4">Job & Contact</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Timestamps</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {comms.map((comm) => (
                  <tr key={comm.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {comm.application?.job?.company || "Unknown Company"}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {comm.application?.job?.title || "Unknown Job"}
                      </div>
                      {comm.contact && (
                        <div className="mt-1 text-xs text-indigo-600">
                          To: {comm.contact.name} ({comm.contact.email})
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/threads/${comm.threadId}`}
                        className="font-medium text-slate-800 hover:text-indigo-600 line-clamp-1 hover:underline"
                      >
                        {comm.subject}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 uppercase">
                      {comm.type}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(comm.status)}`}
                      >
                        {comm.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 space-y-1">
                      <div>Created: {new Date(comm.createdAt).toLocaleString()}</div>
                      {comm.scheduledAt && comm.status === "SCHEDULED" && (
                        <div className="text-blue-600 font-medium">
                          Scheduled: {new Date(comm.scheduledAt).toLocaleString()}
                        </div>
                      )}
                      {comm.sentAt && (
                        <div className="text-slate-600">
                          Sent: {new Date(comm.sentAt).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {comm.status === "DRAFT" && (
                        <button
                          onClick={() => void handleApprove(comm.id)}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition"
                        >
                          Approve
                        </button>
                      )}
                      {comm.status === "SCHEDULED" && (
                        <button
                          onClick={() => void handleCancel(comm.threadId)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
