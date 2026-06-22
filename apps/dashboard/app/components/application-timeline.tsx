export type ActivityItem = {
  id: string;
  activityType: string;
  title: string;
  description: string | null;
  createdAt: Date | string;
};

export type StatusHistoryItem = {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  reason: string | null;
  createdAt: Date | string;
};

type TimelineProps = {
  activities: ActivityItem[];
  statusHistory: StatusHistoryItem[];
};

export function ApplicationTimeline({ activities, statusHistory }: TimelineProps) {
  const formatTime = (dateStr: Date | string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900 text-sm pb-4">Activity Log</h3>
        <div className="flow-root">
          <ul className="-mb-8">
            {activities.map((act, actIdx) => (
              <li key={act.id}>
                <div className="relative pb-8">
                  {actIdx !== activities.length - 1 ? (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 ring-8 ring-white">
                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{act.title}</p>
                        {act.description && (
                          <p className="mt-1 text-2xs text-slate-500">{act.description}</p>
                        )}
                      </div>
                      <div className="whitespace-nowrap text-right text-3xs text-slate-400">
                        {formatTime(act.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
            {activities.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">No activity logged yet.</p>
            )}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900 text-sm pb-4">Status Change History</h3>
        <div className="space-y-4">
          {statusHistory.map((hist) => (
            <div
              key={hist.id}
              className="flex gap-4 border-b border-slate-50 pb-3 last:border-b-0 last:pb-0"
            >
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {hist.oldStatus ? (
                    <>
                      <span className="font-medium text-slate-400 line-through">
                        {hist.oldStatus.replace(/_/g, " ")}
                      </span>
                      <span className="text-slate-300">→</span>
                    </>
                  ) : null}
                  <span className="font-semibold text-slate-800 bg-indigo-50/50 px-1.5 py-0.5 rounded">
                    {hist.newStatus.replace(/_/g, " ")}
                  </span>
                </div>
                {hist.reason && (
                  <p className="text-2xs text-slate-500 italic mt-0.5">"{hist.reason}"</p>
                )}
              </div>
              <div className="text-right whitespace-nowrap text-3xs text-slate-400 self-center">
                {formatTime(hist.createdAt)}
              </div>
            </div>
          ))}
          {statusHistory.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">
              No historical transitions recorded.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
