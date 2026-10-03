import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { MoodFace } from "@/components/mood/MoodFace";
import { PageHeader } from "@/components/navigation/PageHeader";
import { Button } from "@/components/ui/Button";
import { TextArea, TextField } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, ErrorState, InlineError, Skeleton } from "@/components/ui/States";
import { useToast } from "@/contexts/ToastContext";
import { useAsync } from "@/hooks/useAsync";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { journalService } from "@/services/journalService";
import type { JournalEntry, Mood } from "@/types";
import { formatDateTime } from "@/utils/date";
import { MOODS } from "@/utils/moods";

interface EditorState {
  entry: JournalEntry | null;
}

function JournalEditor({ initial, onSaved, onCancel }: { initial: JournalEntry | null; onSaved: () => void; onCancel: () => void }) {
  const toast = useToast();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [mood, setMood] = useState<Mood | null>(initial?.mood ?? null);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const next = {
      title: title.trim() ? undefined : "Give your entry a title",
      content: content.trim() ? undefined : "Write a few words first",
    };
    setErrors(next);
    if (next.title || next.content) return;

    setSaving(true);
    setFormError(null);
    try {
      const payload = { title: title.trim(), content: content.trim(), mood };
      if (initial) await journalService.update(initial.id, payload);
      else await journalService.create(payload);
      toast.success(initial ? "Entry updated" : "Entry saved");
      onSaved();
    } catch (error) {
      setFormError(getErrorMessage(error, "Couldn't save your entry."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} maxLength={150} placeholder="What's on your mind?" />
      <fieldset>
        <legend className="mb-1.5 text-xs font-medium text-slate-300">Mood (optional)</legend>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMood(mood === m.key ? null : m.key)}
              aria-pressed={mood === m.key}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition",
                mood === m.key ? "border-white/40 bg-white/10 text-white" : "border-white/10 text-slate-400 hover:text-white",
              )}
            >
              <MoodFace mood={m.key} className="size-4" /> {m.label}
            </button>
          ))}
        </div>
      </fieldset>
      <TextArea label="Entry" value={content} onChange={(e) => setContent(e.target.value)} error={errors.content} maxLength={20000} placeholder="Write freely. Only you can see this." />
      <InlineError message={formError} />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {initial ? "Save changes" : "Save entry"}
        </Button>
      </div>
    </form>
  );
}

export function JournalPage() {
  const toast = useToast();
  const entries = useAsync(() => journalService.list(100), []);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  async function remove(entry: JournalEntry) {
    if (!window.confirm(`Delete "${entry.title}"? This cannot be undone.`)) return;
    setDeleting(entry.id);
    try {
      await journalService.remove(entry.id);
      entries.setData((all) => all?.filter((e) => e.id !== entry.id) ?? null);
      toast.success("Entry deleted");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Journal"
        subtitle="Private notes, only visible to you"
        actions={
          <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setEditor({ entry: null })}>
            New entry
          </Button>
        }
      />

      {entries.loading && !entries.data ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : entries.error ? (
        <ErrorState message={entries.error} onRetry={entries.reload} />
      ) : !entries.data?.length ? (
        <div className="glass">
          <EmptyState
            icon={BookOpen}
            title="Your journal is empty."
            message="Writing down your thoughts helps you notice what lifts you up and what weighs you down."
            action={<Button onClick={() => setEditor({ entry: null })}>Write your first entry</Button>}
          />
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {entries.data.map((entry) => (
            <li key={entry.id} className="glass flex reveal flex-col gap-2 p-4">
              <div className="flex items-start gap-3">
                {entry.mood ? (
                  <MoodFace mood={entry.mood} className="size-9 shrink-0" />
                ) : (
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">
                    <BookOpen className="size-4" aria-hidden />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold text-white">{entry.title}</h2>
                  <p className="text-xs text-slate-500">
                    {formatDateTime(entry.created_at)}
                    {entry.updated_at !== entry.created_at && new Date(entry.updated_at).getTime() - new Date(entry.created_at).getTime() > 1000 && " · edited"}
                  </p>
                </div>
                <button onClick={() => setEditor({ entry })} aria-label={`Edit "${entry.title}"`} className="rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white">
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => void remove(entry)}
                  disabled={deleting === entry.id}
                  aria-label={`Delete "${entry.title}"`}
                  className="rounded-full p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <p className="line-clamp-4 text-sm whitespace-pre-wrap text-slate-300">{entry.content}</p>
            </li>
          ))}
        </ul>
      )}

      <Modal open={editor !== null} onClose={() => setEditor(null)} title={editor?.entry ? "Edit entry" : "New journal entry"}>
        {editor && (
          <JournalEditor
            initial={editor.entry}
            onCancel={() => setEditor(null)}
            onSaved={() => {
              setEditor(null);
              void entries.reload();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
