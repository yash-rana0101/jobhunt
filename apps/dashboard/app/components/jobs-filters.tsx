import { useState } from "react";

type FiltersState = {
  search: string;
  remote: string;
  source: string;
  experience: string;
};

type JobsFiltersProps = {
  filters: FiltersState;
  onChange: (filters: FiltersState) => void;
  onDiscover: () => Promise<void>;
  isDiscovering: boolean;
};

export function JobsFilters({ filters, onChange, onDiscover, isDiscovering }: JobsFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange({ ...filters, search: localSearch });
  };

  const handleSelectChange = (key: keyof FiltersState, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Search opportunities
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Title, company, keywords..."
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
            />
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Search
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:w-auto">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Remote
            </label>
            <select
              value={filters.remote}
              onChange={(e) => handleSelectChange("remote", e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500"
            >
              <option value="">All</option>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ONSITE">Onsite</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Experience
            </label>
            <select
              value={filters.experience}
              onChange={(e) => handleSelectChange("experience", e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500"
            >
              <option value="">All</option>
              <option value="Internship">Internship</option>
              <option value="Entry Level">Entry Level</option>
              <option value="1-2 Years">1-2 Years</option>
              <option value="3-5 Years">3-5 Years</option>
              <option value="Senior">Senior</option>
              <option value="Lead">Lead</option>
              <option value="Principal">Principal</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Source
            </label>
            <select
              value={filters.source}
              onChange={(e) => handleSelectChange("source", e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500"
            >
              <option value="">All</option>
              <option value="YC Jobs">YC Jobs</option>
              <option value="Wellfound">Wellfound</option>
              <option value="Greenhouse">Greenhouse</option>
              <option value="Lever">Lever</option>
              <option value="Ashby">Ashby</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          disabled={isDiscovering}
          onClick={() => {
            void onDiscover();
          }}
          className={`flex h-9.5 items-center justify-center rounded-lg px-4 text-sm font-semibold shadow-sm transition ${
            isDiscovering
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          {isDiscovering ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></span>
              Discovering...
            </span>
          ) : (
            "Trigger Discovery"
          )}
        </button>
      </form>
    </div>
  );
}
