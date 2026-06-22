import Link from "next/link";

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

type JobsTableProps = {
  jobs: JobListItem[];
  loading: boolean;
};

export function JobsTable({ jobs, loading }: JobsTableProps) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="min-w-full divide-y divide-slate-150">
          <div className="bg-slate-50/50 h-12"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex h-16 items-center px-6 gap-4 animate-pulse">
              <div className="h-4 w-1/4 rounded bg-slate-200"></div>
              <div className="h-4 w-1/6 rounded bg-slate-200"></div>
              <div className="h-4 w-1/8 rounded bg-slate-200"></div>
              <div className="h-4 w-1/8 rounded bg-slate-200"></div>
              <div className="h-4 w-1/12 rounded bg-slate-200 ml-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center shadow-sm">
        <p className="text-sm font-semibold text-slate-900">No opportunities found</p>
        <p className="mt-1 text-sm text-slate-500">
          Try adjusting your filters or triggering a new job discovery run.
        </p>
      </div>
    );
  }

  const getRemoteBadgeClass = (status: string) => {
    switch (status) {
      case "REMOTE":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "HYBRID":
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "ONSITE":
        return "bg-slate-50 text-slate-700 border-slate-200";
      default:
        return "bg-slate-50 text-slate-550 border-slate-150";
    }
  };

  const getSourceBadgeClass = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes("yc")) return "bg-orange-50 text-orange-700 border-orange-100";
    if (s.includes("wellfound")) return "bg-slate-950 text-white border-slate-900";
    return "bg-sky-50 text-sky-700 border-sky-100";
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Just now";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-100 text-left">
        <thead className="bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-6 py-4">Opportunity</th>
            <th className="px-6 py-4">Location</th>
            <th className="px-6 py-4">Remote</th>
            <th className="px-6 py-4">Source</th>
            <th className="px-6 py-4">Posted Date</th>
            <th className="px-6 py-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-700">
          {jobs.map((job) => (
            <tr key={job.id} className="group transition hover:bg-slate-50/50">
              <td className="px-6 py-4.5">
                <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition duration-150">
                  {job.title}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">{job.company}</div>
              </td>
              <td className="px-6 py-4.5 text-slate-500">{job.location || "Remote"}</td>
              <td className="px-6 py-4.5">
                <span
                  className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${getRemoteBadgeClass(job.remoteStatus)}`}
                >
                  {job.remoteStatus}
                </span>
              </td>
              <td className="px-6 py-4.5">
                <span
                  className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${getSourceBadgeClass(job.source)}`}
                >
                  {job.source}
                </span>
              </td>
              <td className="px-6 py-4.5 text-slate-550">{formatDate(job.postedDate)}</td>
              <td className="px-6 py-4.5 text-right">
                <Link
                  href={`/jobs/${job.id}`}
                  className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 group-hover:border-indigo-200"
                >
                  View Details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
