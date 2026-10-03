import { Sparkles } from "lucide-react";

import { cn } from "@/lib/cn";
import type { ChatMessage } from "@/types";
import { formatTime } from "@/utils/date";

export function CompanionAvatar({ size = "md", online = false }: { size?: "sm" | "md"; online?: boolean }) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 via-primary-500 to-accent-500 p-[1.5px] shadow-[0_0_20px_rgb(139_141_248/0.35)]",
        size === "md" ? "size-12" : "size-9",
      )}
      aria-hidden
    >
      <span className="flex size-full items-center justify-center rounded-full bg-ink-900 text-primary-300">
        <Sparkles className={size === "md" ? "size-5" : "size-4"} />
      </span>
      {online && (
        <span className="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-2 border-ink-900 bg-accent-500 shadow-[0_0_8px_rgb(45_212_191)]" />
      )}
    </span>
  );
}

export interface DisplayMessage extends Pick<ChatMessage, "sender" | "content" | "created_at"> {
  key: string;
  pending?: boolean;
}

export function MessageBubble({ message }: { message: DisplayMessage }) {
  const mine = message.sender === "user";
  return (
    <div className={cn("flex animate-slide-up items-start gap-2.5", mine ? "justify-end" : "justify-start")}>
      {!mine && <CompanionAvatar size="sm" />}
      <div className={cn("flex max-w-[82%] flex-col sm:max-w-[68%]", mine && "items-end")}>
        <div
          className={cn(
            "px-4 py-3 text-[15px] leading-6 tracking-[-0.005em] whitespace-pre-wrap",
            mine
              ? "rounded-[1.5rem] rounded-br-md bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-[0_8px_24px_-8px_rgb(99_102_241/0.6)]"
              : "rounded-[1.5rem] rounded-tl-md border border-primary-300/12 bg-[rgb(34_43_69/0.5)] font-display text-[#dfe2ef]",
            message.pending && "opacity-70",
          )}
        >
          {message.content}
        </div>
        <p className="mt-1.5 px-2 font-label text-[11px] tracking-[0.04em] text-slate-500">
          {message.pending ? "Sending…" : formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}

export function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex justify-center py-1" role="separator" aria-label={label}>
      <span className="label-caps rounded-full border border-primary-300/15 bg-[rgb(22_28_45/0.55)] px-3.5 py-1.5 text-slate-300">
        {label}
      </span>
    </div>
  );
}

export function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const time = formatTime(iso);
  if (date.toDateString() === today.toDateString()) return `Today · ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday · ${time}`;
  return `${date.toLocaleDateString(undefined, { day: "numeric", month: "short" })} · ${time}`;
}

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5" role="status" aria-label="AI Companion is typing">
      <CompanionAvatar size="sm" />
      <div className="flex gap-1 rounded-[1.5rem] rounded-tl-md border border-primary-300/12 bg-[rgb(34_43_69/0.5)] px-4 py-3.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-bounce rounded-full bg-primary-300"
            style={{ animationDelay: `${i * 140}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
