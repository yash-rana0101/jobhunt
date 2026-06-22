"use client";

import { useEffect, useState, useCallback } from "react";

const API_BASE = "http://localhost:4000";

interface EmailTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  subjectTemplate: string;
  bodyTemplate: string;
  variables: string[];
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("RECRUITER_OUTREACH");
  const [subjectTemplate, setSubjectTemplate] = useState("");
  const [bodyTemplate, setBodyTemplate] = useState("");
  const [variablesText, setVariablesText] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/templates`);
      const resJson = (await res.json()) as { success: boolean; data: EmailTemplate[] };
      if (resJson.success) {
        setTemplates(resJson.data);
      }
    } catch (err) {
      console.error("Failed to fetch templates", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const vars = variablesText
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0);

      const res = await fetch(`${API_BASE}/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          category,
          subjectTemplate,
          bodyTemplate,
          variables: vars,
        }),
      });

      const data = (await res.json()) as { success: boolean; error?: { message: string } };
      if (data.success) {
        setName("");
        setDescription("");
        setSubjectTemplate("");
        setBodyTemplate("");
        setVariablesText("");
        void fetchTemplates();
      } else {
        alert(data.error?.message || "Failed to create template");
      }
    } catch (err) {
      console.error("Error creating template", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Email Template Library</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create, edit, and manage reusable template designs with dynamic variables.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
            </div>
          ) : templates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-sm">
              <p className="text-sm font-medium text-slate-500">No email templates created yet</p>
              <p className="mt-1 text-xs text-slate-400">
                Use the form on the right to start drafting your first template.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{tpl.name}</h3>
                      <p className="text-xs text-slate-500">{tpl.description}</p>
                    </div>
                    <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10 uppercase">
                      {tpl.category.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <strong className="text-slate-700">Subject:</strong>{" "}
                      <span className="text-slate-800 font-mono">{tpl.subjectTemplate}</span>
                    </div>
                    <div>
                      <strong className="text-slate-700">Body Template:</strong>
                      <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-50 p-3 font-mono text-3xs text-slate-700 leading-relaxed border border-slate-100 whitespace-pre-wrap">
                        {tpl.bodyTemplate}
                      </pre>
                    </div>
                    {tpl.variables.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-2">
                        <strong className="text-slate-700 text-3xs uppercase mr-1">
                          Variables:
                        </strong>
                        {tpl.variables.map((v) => (
                          <span
                            key={v}
                            className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-3xs font-semibold text-slate-600 border border-slate-200"
                          >
                            {"{"}
                            {v}
                            {"}"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
          >
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              New Template
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-3xs font-semibold text-slate-600 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Outreach Recruiter V1"
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-3xs font-semibold text-slate-600 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief context details..."
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-3xs font-semibold text-slate-600 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value="REFERRAL_REQUEST">Referral Request</option>
                  <option value="HIRING_MANAGER_OUTREACH">Hiring Manager Outreach</option>
                  <option value="RECRUITER_OUTREACH">Recruiter Outreach</option>
                  <option value="FOUNDER_OUTREACH">Founder Outreach</option>
                  <option value="CTO_OUTREACH">CTO Outreach</option>
                  <option value="FOLLOW_UP">Follow-Up</option>
                  <option value="THANK_YOU">Thank You</option>
                  <option value="GENERAL">General</option>
                </select>
              </div>

              <div>
                <label className="block text-3xs font-semibold text-slate-600 mb-1">
                  Subject Template
                </label>
                <input
                  type="text"
                  required
                  value={subjectTemplate}
                  onChange={(e) => setSubjectTemplate(e.target.value)}
                  placeholder="e.g. Job Interest - {candidateName}"
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-3xs font-semibold text-slate-600 mb-1">
                  Body Content (Use placeholders)
                </label>
                <textarea
                  required
                  rows={6}
                  value={bodyTemplate}
                  onChange={(e) => setBodyTemplate(e.target.value)}
                  placeholder="Hello {contactName},&#10;&#10;I saw the {jobTitle} role at {companyName}..."
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-3xs font-semibold text-slate-600 mb-1">
                  Variables (Comma-separated list)
                </label>
                <input
                  type="text"
                  value={variablesText}
                  onChange={(e) => setVariablesText(e.target.value)}
                  placeholder="e.g. contactName, jobTitle, companyName, candidateName"
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition"
              >
                {saving ? "Creating..." : "Save Template"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
