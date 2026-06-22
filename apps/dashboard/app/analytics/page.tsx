import Link from "next/link";

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16 space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Analytics</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-950">Analytics Dashboard</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Monitor your metrics, pipeline conversion rates, and outreaches deliverability tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        <Link
          href="/analytics/communications"
          className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition block"
        >
          <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition">
            Communication Performance &rarr;
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Track outbound email delivery success, open rates, recruiter reply signals, and reply
            sentiment analysis metrics.
          </p>
        </Link>
      </div>
    </div>
  );
}
