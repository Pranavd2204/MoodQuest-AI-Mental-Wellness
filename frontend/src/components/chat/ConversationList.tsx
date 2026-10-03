import { MessageCircle, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { cn } from "@/lib/cn";
import type { ConversationSummary } from "@/types";
import { timeAgo } from "@/utils/date";

interface ConversationListProps {
  conversations: ConversationSummary[] | null;
  loading: boolean;
  error: string | null;
  activeId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
  onDelete: (id: number) => void;
  onRetry: () => void;
  creating: boolean;
}

export function ConversationList({
  conversations,
  loading,
  error,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRetry,
  creating,
}: ConversationListProps) {
  return (
    <div className="space-y-3">
      <Button fullWidth icon={<Plus className="size-4" />} onClick={onNew} loading={creating}>
        New conversation
      </Button>
      {loading && !conversations ? (
        <LoadingState label="Loading conversations…" />
      ) : error && !conversations ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : !conversations?.length ? (
        <EmptyState compact icon={MessageCircle} title="No conversations yet" message="Start a conversation with your AI companion." />
      ) : (
        <ul className="space-y-1.5">
          {conversations.map((c) => (
            <li key={c.id} className="group relative">
              <button
                onClick={() => onSelect(c.id)}
                className={cn(
                  "w-full rounded-2xl border px-3.5 py-3 pr-11 text-left transition-colors",
                  c.id === activeId
                    ? "border-primary-400/40 bg-primary-500/15"
                    : "border-transparent hover:border-white/10 hover:bg-white/5",
                )}
              >
                <p className="truncate text-sm font-semibold text-white">{c.title}</p>
                <p className="truncate text-xs text-slate-400">{c.last_message ?? "No messages yet"}</p>
                <p className="mt-0.5 text-[10px] text-slate-500">{timeAgo(c.updated_at)}</p>
              </button>
              <button
                onClick={() => onDelete(c.id)}
                aria-label={`Delete conversation "${c.title}"`}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-2 text-slate-500 opacity-100 transition hover:bg-rose-500/10 hover:text-rose-300 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
