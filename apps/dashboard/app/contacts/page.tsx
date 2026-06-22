"use client";

import { useEffect, useState } from "react";
import type { ApiResponse } from "@job-hunter/shared";
import { ContactsTable, type ContactListItem } from "../components/contacts-table";
import { ContactsStats } from "../components/contacts-stats";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactListItem[]>([]);
  const [referralsCount, setReferralsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [minPriority, setMinPriority] = useState<number>(0);
  const [minConfidence, setMinConfidence] = useState<number>(0);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load contacts (retrieve large limit to compute statistics dynamically)
        const contactsRes = await fetch("http://localhost:4000/contacts?pageSize=500");
        const contactsData = (await contactsRes.json()) as ApiResponse<ContactListItem[]>;

        // Load referrals count
        const referralsRes = await fetch("http://localhost:4000/contacts/referrals");
        const referralsData = (await referralsRes.json()) as ApiResponse<unknown[]>;

        if (contactsData.success && Array.isArray(contactsData.data)) {
          setContacts(contactsData.data);
        }
        if (referralsData.success && Array.isArray(referralsData.data)) {
          setReferralsCount(referralsData.data.length);
        }
      } catch (err) {
        console.error("Failed to load contacts data", err);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  // Filter contacts based on search query and controls
  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
      c.companyName.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "" || c.category === category;
    const matchesPriority = c.contactPriority >= minPriority;
    const matchesConfidence = c.confidenceScore >= minConfidence;

    return matchesSearch && matchesCategory && matchesPriority && matchesConfidence;
  });

  // Calculate dynamic analytics on total fetched contacts
  const totalContacts = contacts.length;
  const avgConfidence = totalContacts
    ? contacts.reduce((sum, c) => sum + c.confidenceScore, 0) / totalContacts
    : 0;
  const avgPriority = totalContacts
    ? contacts.reduce((sum, c) => sum + c.contactPriority, 0) / totalContacts
    : 0;

  // Contacts by Category count
  const categoryCounts = contacts.reduce(
    (acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Top companies with contacts
  const companyCounts = contacts.reduce(
    (acc, c) => {
      acc[c.companyName] = (acc[c.companyName] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const topCompanies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Hiring Manager Discovery Rate: % of unique companies that have at least 1 hiring manager
  const uniqueCompanies = new Set(contacts.map((c) => c.companyName));
  const companiesWithHM = new Set(
    contacts.filter((c) => c.category === "HIRING_MANAGER").map((c) => c.companyName),
  );
  const hiringManagerRate = uniqueCompanies.size
    ? Math.round((companiesWithHM.size / uniqueCompanies.size) * 100)
    : 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Decision Makers & Referral Maps
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Identify hiring managers, recruitment leads, engineering contacts, and warm referrers.
        </p>
      </div>

      <div className="mt-8 space-y-8 pb-12">
        {/* Stats Grid */}
        <ContactsStats
          stats={{
            totalContacts,
            averageConfidence: avgConfidence,
            averagePriority: avgPriority,
            referralCount: referralsCount,
          }}
        />

        {/* Analytics Block */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Hiring Manager Discovery Rate
            </h3>
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative flex items-center justify-center">
                <svg className="h-32 w-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="50"
                    className="stroke-slate-100 fill-none"
                    strokeWidth="8"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="50"
                    className="stroke-rose-500 fill-none transition-all duration-500"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 50}
                    strokeDashoffset={2 * Math.PI * 50 * (1 - hiringManagerRate / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-2xl font-bold text-slate-800">
                  {hiringManagerRate}%
                </span>
              </div>
              <p className="mt-4 text-xs text-center text-slate-500">
                {companiesWithHM.size} of {uniqueCompanies.size} target companies have identified
                Hiring Managers
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Contacts by Category</h3>
            <div className="space-y-2 mt-2">
              {Object.entries(categoryCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">{cat.replace("_", " ")}</span>
                    <div className="flex items-center gap-2 w-1/2">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${(count / totalContacts) * 100}%` }}
                        />
                      </div>
                      <span className="font-semibold text-slate-900 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Top Companies by Density</h3>
            <div className="space-y-3">
              {topCompanies.map(([name, count]) => (
                <div
                  key={name}
                  className="flex items-center justify-between text-xs border-b border-slate-50 pb-2"
                >
                  <span className="font-semibold text-slate-800">{name}</span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                    {count} contacts
                  </span>
                </div>
              ))}
              {topCompanies.length === 0 && (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No company distributions yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="rounded-xl border border-slate-150 bg-white p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Search Contacts
              </label>
              <input
                type="text"
                placeholder="Name, role, or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Contact Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="">All Categories</option>
                <option value="HIRING_MANAGER">Hiring Manager</option>
                <option value="ENGINEERING_MANAGER">Engineering Manager</option>
                <option value="TEAM_LEAD">Team Lead</option>
                <option value="RECRUITER">Technical Recruiter</option>
                <option value="FOUNDER">Founder / CEO</option>
                <option value="CTO">CTO</option>
                <option value="ENGINEER">Engineer</option>
                <option value="REFERRAL_SOURCE">Referral Source</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Min Priority ({minPriority})
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={minPriority}
                onChange={(e) => setMinPriority(parseInt(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Min Confidence ({minConfidence}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={minConfidence}
                onChange={(e) => setMinConfidence(parseInt(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Contacts Table */}
        <ContactsTable contacts={filteredContacts} loading={loading} />
      </div>
    </div>
  );
}
