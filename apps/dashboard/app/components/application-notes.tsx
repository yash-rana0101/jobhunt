import { useState } from "react";
export type NoteItem = {
  id: string;
  noteType: string;
  content: string;
  createdAt: Date | string;
};

type NotesProps = {
  notes: NoteItem[];
  onAddNote: (noteType: string, content: string) => Promise<void>;
};

const NOTE_TYPES = ["PRIVATE", "INTERVIEW", "PREPARATION", "RECRUITER", "COMPANY"] as const;

export function ApplicationNotes({ notes, onAddNote }: NotesProps) {
  const [activeType, setActiveType] = useState<string>("PRIVATE");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      await onAddNote(activeType, content);
      setContent("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    void handleSubmit(e);
  };

  const formatDate = (dateStr: Date | string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-50 pb-4">
        <h3 className="font-semibold text-slate-900 text-sm">Notes & Preparation</h3>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {NOTE_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setActiveType(type)}
              className={`rounded-lg px-3 py-1 text-2xs font-semibold border transition ${
                activeType === type
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {type.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Write some markdown notes here... (${activeType.toLowerCase()})`}
            rows={3}
            className="w-full rounded-lg border border-slate-200 p-3 text-xs focus:border-indigo-500 focus:outline-none"
            required
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-2xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Adding..." : "Add Note"}
        </button>
      </form>

      <div className="space-y-4 pt-2">
        {notes.map((note) => (
          <div
            key={note.id}
            className="rounded-lg bg-slate-50/50 p-4 border border-slate-100 space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-3xs font-semibold text-indigo-700">
                {note.noteType}
              </span>
              <span className="text-3xs text-slate-400">{formatDate(note.createdAt)}</span>
            </div>
            <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
              {note.content}
            </p>
          </div>
        ))}
        {notes.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-6">No notes added yet.</p>
        )}
      </div>
    </div>
  );
}
