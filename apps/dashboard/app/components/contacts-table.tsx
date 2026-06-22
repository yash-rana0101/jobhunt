import Link from "next/link";

export interface ContactListItem {
  id: string;
  fullName: string;
  jobTitle: string;
  companyName: string;
  category: string;
  contactPriority: number;
  confidenceScore: number;
  linkedinUrl: string | null;
  status: string;
}

interface ContactsTableProps {
  contacts: ContactListItem[];
  loading: boolean;
}

export function ContactsTable({ contacts, loading }: ContactsTableProps) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="min-w-full divide-y divide-slate-150">
          <div className="bg-slate-50/50 h-12"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex h-16 items-center px-6 gap-4 animate-pulse">
              <div className="h-4 w-1/4 rounded bg-slate-200"></div>
              <div className="h-4 w-1/6 rounded bg-slate-200"></div>
              <div className="h-4 w-1/12 rounded bg-slate-200"></div>
              <div className="h-4 w-1/12 rounded bg-slate-200"></div>
              <div className="h-4 w-1/12 rounded bg-slate-200 ml-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center shadow-sm">
        <p className="text-sm font-semibold text-slate-900">No contacts discovered</p>
        <p className="mt-1 text-sm text-slate-500">
          Try running contact discovery on a matched job to populate results.
        </p>
      </div>
    );
  }

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "HIRING_MANAGER":
        return "bg-rose-50 text-rose-755 border-rose-100";
      case "ENGINEERING_MANAGER":
        return "bg-indigo-50 text-indigo-755 border-indigo-100";
      case "TEAM_LEAD":
        return "bg-sky-50 text-sky-755 border-sky-100";
      case "RECRUITER":
        return "bg-emerald-50 text-emerald-755 border-emerald-100";
      case "FOUNDER":
        return "bg-amber-50 text-amber-755 border-amber-100";
      case "CTO":
        return "bg-violet-50 text-violet-755 border-violet-100";
      case "ENGINEER":
        return "bg-slate-50 text-slate-700 border-slate-200";
      default:
        return "bg-slate-50 text-slate-550 border-slate-150";
    }
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return "text-emerald-700 font-bold";
    if (score >= 60) return "text-amber-700 font-semibold";
    return "text-slate-500";
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-100 text-left">
        <thead className="bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-6 py-4">Name & Title</th>
            <th className="px-6 py-4">Company</th>
            <th className="px-6 py-4">Category</th>
            <th className="px-6 py-4 text-center">Priority</th>
            <th className="px-6 py-4 text-center">Confidence</th>
            <th className="px-6 py-4">LinkedIn</th>
            <th className="px-6 py-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-700">
          {contacts.map((contact) => (
            <tr key={contact.id} className="group transition hover:bg-slate-50/50">
              <td className="px-6 py-4">
                <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition duration-150">
                  {contact.fullName}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">{contact.jobTitle}</div>
              </td>
              <td className="px-6 py-4 text-slate-600 font-medium">{contact.companyName}</td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${getCategoryBadgeClass(contact.category)}`}
                >
                  {contact.category.replace("_", " ")}
                </span>
              </td>
              <td
                className={`px-6 py-4 text-center ${getScoreColorClass(contact.contactPriority)}`}
              >
                {Math.round(contact.contactPriority)}
              </td>
              <td
                className={`px-6 py-4 text-center ${getScoreColorClass(contact.confidenceScore)}`}
              >
                {Math.round(contact.confidenceScore)}%
              </td>
              <td className="px-6 py-4">
                {contact.linkedinUrl ? (
                  <a
                    href={contact.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-900 transition hover:underline"
                  >
                    LinkedIn Profile
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">N/A</span>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                <Link
                  href={`/contacts/${contact.id}`}
                  className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 group-hover:border-indigo-200"
                >
                  View details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
