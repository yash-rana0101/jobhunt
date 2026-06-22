export type DashboardAnalytics = {
  totalJobs: number;
  bySource: Record<string, number>;
  byLocation: Record<string, number>;
  byExperience: Record<string, number>;
  byTechnology: Record<string, number>;
  byRemoteStatus: Record<string, number>;
};

type JobsStatsProps = {
  analytics: DashboardAnalytics | null;
  loading: boolean;
};

export function JobsStats({ analytics, loading }: JobsStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-slate-100 bg-white/60 p-6 shadow-sm backdrop-blur-md"
          >
            <div className="h-4 w-24 rounded bg-slate-200"></div>
            <div className="mt-4 h-8 w-16 rounded bg-slate-200"></div>
          </div>
        ))}
      </div>
    );
  }

  const total = analytics?.totalJobs ?? 0;
  const remote = analytics?.byRemoteStatus?.REMOTE ?? 0;
  const ycJobs = analytics?.bySource?.["YC Jobs"] ?? 0;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      <div className="group relative overflow-hidden rounded-xl border border-slate-100 bg-white/80 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md backdrop-blur-md">
        <div className="absolute top-0 right-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-indigo-500/10 blur-xl"></div>
        <p className="text-sm font-medium text-slate-500">Total Opportunities</p>
        <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{total}</p>
      </div>

      <div className="group relative overflow-hidden rounded-xl border border-slate-100 bg-white/80 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md backdrop-blur-md">
        <div className="absolute top-0 right-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-emerald-500/10 blur-xl"></div>
        <p className="text-sm font-medium text-slate-500">Remote Opportunities</p>
        <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{remote}</p>
      </div>

      <div className="group relative overflow-hidden rounded-xl border border-slate-100 bg-white/80 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md backdrop-blur-md">
        <div className="absolute top-0 right-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-amber-500/10 blur-xl"></div>
        <p className="text-sm font-medium text-slate-500">YC / Startup Roles</p>
        <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{ycJobs}</p>
      </div>
    </div>
  );
}
