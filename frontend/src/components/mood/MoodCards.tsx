import { Flame, Leaf } from "lucide-react";

import { Skeleton } from "@/components/ui/States";
import type { MoodLog, Streak } from "@/types";
import { timeAgo } from "@/utils/date";
import { moodMeta } from "@/utils/moods";

import { MoodFace } from "./MoodFace";

const STREAK_GOALS = [7, 30, 100, 365];

export function CurrentMoodCard({ latest, loading }: { latest: MoodLog | null; loading: boolean }) {
  if (loading) return <Skeleton className="h-40 rounded-[1.5rem]" />;
  const meta = moodMeta(latest?.mood);

  return (
    <div className="glass reveal relative h-full overflow-hidden p-5">
      {meta && latest ? (
        <>
          <div
            className="pointer-events-none absolute -right-10 -bottom-12 size-40 rounded-full blur-3xl"
            style={{ background: `${meta.color}40` }}
            aria-hidden
          />
          <p className="label-caps" style={{ color: meta.color }}>
            Current mood
          </p>
          <div className="mt-3 flex items-center gap-2">
            <p className="font-display text-[28px] leading-none font-semibold tracking-[-0.02em] text-white">{meta.label}</p>
            <MoodFace mood={latest.mood} className="size-6" />
          </div>
          <p className="mt-3 text-sm text-slate-300">{meta.message}</p>
          <p className="mt-0.5 text-xs text-slate-500">Checked in {timeAgo(latest.created_at)}</p>
        </>
      ) : (
        <>
          <p className="label-caps text-accent-400">Current mood</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-accent-400/30 bg-accent-400/10 text-accent-400">
              <Leaf className="size-5" aria-hidden />
            </span>
            <div>
              <p className="font-display font-semibold text-white">How are you feeling today?</p>
              <p className="text-sm text-slate-400">Add your first mood check-in above.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function StreakCard({ streak, loading }: { streak: Streak | null; loading: boolean }) {
  if (loading) return <Skeleton className="h-40 rounded-[1.5rem]" />;
  const days = streak?.current ?? 0;
  const goal = STREAK_GOALS.find((g) => g > days) ?? days;
  const percent = goal ? Math.min(100, Math.round((days / goal) * 100)) : 100;

  return (
    <div className="glass reveal relative flex h-full flex-col overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <p className="label-caps text-astral-gold">Daily streak</p>
        <Flame
          className={days > 0 ? "size-6 text-astral-gold drop-shadow-[0_0_10px_rgb(253_224_71/0.6)]" : "size-6 text-slate-600"}
          aria-hidden
        />
      </div>
      <p className="mt-3 font-display text-[28px] leading-none font-semibold tracking-[-0.02em] text-white">
        <span>{days}</span> <span className="text-xl">{days === 1 ? "day" : "days"}</span>
      </p>
      <p className="mt-2 text-sm text-primary-300">
        {days === 0 ? "Check in to start one" : streak?.active_today ? "Keep going!" : "Check in to keep it alive"}
      </p>
      <div className="mt-auto pt-4">
        <div
          className="h-1.5 overflow-hidden rounded-full bg-primary-300/10"
          role="progressbar"
          aria-label="Streak goal progress"
          aria-valuemin={0}
          aria-valuemax={goal}
          aria-valuenow={days}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-astral-gold to-[#fb7185] transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between font-label text-[11px] tracking-[0.04em] text-slate-400">
          <span>Goal: {goal} days</span>
          <span>{percent}%</span>
        </div>
      </div>
    </div>
  );
}
