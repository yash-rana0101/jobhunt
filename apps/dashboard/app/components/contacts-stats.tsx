interface ContactsStatsProps {
  stats: {
    totalContacts: number;
    averageConfidence: number;
    averagePriority: number;
    referralCount: number;
  };
}

export function ContactsStats({ stats }: ContactsStatsProps) {
  const cards = [
    {
      name: "Discovered Contacts",
      value: stats.totalContacts.toLocaleString(),
      description: "Total candidates found for outreach",
      colorClass: "text-indigo-600 bg-indigo-50",
    },
    {
      name: "Average Priority Score",
      value: `${Math.round(stats.averagePriority)}/100`,
      description: "Based on role and hiring authority",
      colorClass: "text-emerald-600 bg-emerald-50",
    },
    {
      name: "Average Confidence",
      value: `${Math.round(stats.averageConfidence)}%`,
      description: "Information accuracy score",
      colorClass: "text-amber-600 bg-amber-50",
    },
    {
      name: "Referral Opportunities",
      value: stats.referralCount.toLocaleString(),
      description: "Warm intro candidates discovered",
      colorClass: "text-purple-600 bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.name}
          className="overflow-hidden rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">{card.name}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${card.colorClass}`}>
              Metric
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">{card.value}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{card.description}</p>
        </div>
      ))}
    </div>
  );
}
