import { Bell, CheckCircle2, Flame, SmilePlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import type { MoodStats } from "@/types";

interface Reminder {
  id: string;
  icon: typeof Bell;
  text: string;
}

function remindersFrom(stats: MoodStats | null): Reminder[] {
  if (!stats) return [];
  const reminders: Reminder[] = [];
  if (!stats.today_logged) {
    reminders.push({ id: "checkin", icon: SmilePlus, text: "You haven't checked in today. How are you feeling?" });
  }
  if (stats.streak.current > 0 && !stats.streak.active_today) {
    reminders.push({
      id: "streak",
      icon: Flame,
      text: `Your ${stats.streak.current}-day streak ends at midnight. Do any activity to keep it going.`,
    });
  }
  return reminders;
}

export function NotificationBell({ stats }: { stats: MoodStats | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reminders = remindersFrom(stats);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${reminders.length ? ` (${reminders.length})` : ""}`}
        aria-expanded={open}
        className="relative flex size-10 items-center justify-center rounded-full border border-primary-300/15 bg-[rgb(22_28_45/0.65)] text-primary-200 transition hover:border-primary-300/35 hover:text-white"
      >
        <Bell className="size-[1.15rem]" />
        {reminders.length > 0 && (
          <span className="absolute top-2 right-2 size-2.5 rounded-full bg-[#fb7185] ring-2 ring-ink-900" aria-hidden />
        )}
      </button>
      {open && (
        <div className="glass-strong absolute right-0 z-50 mt-2 w-72 animate-pop p-2 shadow-2xl">
          <p className="px-2 py-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">Notifications</p>
          {reminders.length === 0 ? (
            <p className="flex items-center gap-2 px-2 py-3 text-sm text-slate-300">
              <CheckCircle2 className="size-4 text-emerald-400" aria-hidden /> You're all caught up.
            </p>
          ) : (
            <ul>
              {reminders.map(({ id, icon: Icon, text }) => (
                <li key={id} className={cn("flex gap-3 rounded-xl px-2 py-2.5 text-sm text-slate-200")}>
                  <Icon className="mt-0.5 size-4 shrink-0 text-primary-300" aria-hidden />
                  {text}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
