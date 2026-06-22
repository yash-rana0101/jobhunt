import Link from "next/link";
import type { DragEvent } from "react";

export type ApplicationCardItem = {
  id: string;
  status: string;
  priority: number;
  job: {
    title: string;
    company: string;
    match?: {
      matchScore: number;
    } | null;
  };
};

type ApplicationCardProps = {
  application: ApplicationCardItem;
  onDragStart: (e: DragEvent, id: string) => void;
};

export function ApplicationCard({ application, onDragStart }: ApplicationCardProps) {
  const getPriorityBadgeClass = (priority: number) => {
    if (priority >= 80) return "bg-rose-50 text-rose-700 border-rose-100";
    if (priority >= 50) return "bg-amber-50 text-amber-700 border-amber-100";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  const getMatchBadgeClass = (score: number) => {
    if (score >= 85) return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (score >= 70) return "bg-sky-50 text-sky-700 border-sky-100";
    return "bg-slate-50 text-slate-555 border-slate-150";
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, application.id)}
      className="group cursor-grab rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition duration-150 hover:border-indigo-200 hover:shadow-md active:cursor-grabbing"
    >
      <div className="flex flex-col gap-2">
        <div>
          <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition duration-150 text-sm line-clamp-1">
            {application.job.title}
          </div>
          <div className="text-xs text-slate-500 line-clamp-1">{application.job.company}</div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-2xs font-semibold ${getPriorityBadgeClass(application.priority)}`}
          >
            Pri: {application.priority}
          </span>
          {application.job.match && (
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-2xs font-semibold ${getMatchBadgeClass(application.job.match.matchScore)}`}
            >
              Match: {Math.round(application.job.match.matchScore)}%
            </span>
          )}
        </div>

        <div className="flex justify-between items-center mt-2 border-t border-slate-50 pt-2.5">
          <span className="text-2xs text-slate-400 capitalize">
            {application.status.toLowerCase().replace(/_/g, " ")}
          </span>
          <Link
            href={`/applications/${application.id}`}
            className="text-2xs font-bold text-indigo-600 hover:text-indigo-800 transition duration-150"
          >
            Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
