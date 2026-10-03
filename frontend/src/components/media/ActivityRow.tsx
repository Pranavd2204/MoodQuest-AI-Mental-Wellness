import { CheckCircle2, Flower2, Play, Waves, Wind, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import type { Activity } from "@/types";

export const CATEGORY_STYLE: Record<Activity["category"], { icon: LucideIcon; color: string }> = {
  breathing: { icon: Wind, color: "#22d3ee" },
  yoga: { icon: Flower2, color: "#f59e0b" },
  mindfulness: { icon: Waves, color: "#a78bfa" },
};

export function ActivityRow({ activity }: { activity: Activity }) {
  const style = CATEGORY_STYLE[activity.category] ?? CATEGORY_STYLE.mindfulness;
  const Icon = style.icon;
  return (
    <Link
      to={`/meditation/${activity.id}`}
      className="glass group flex reveal items-center gap-3.5 p-3 transition hover:border-white/15 hover:bg-white/[0.03]"
    >
      <span
        className="flex size-12 shrink-0 items-center justify-center rounded-2xl"
        style={{ background: `linear-gradient(135deg, ${style.color}55, ${style.color}18)`, color: style.color }}
      >
        <Icon className="size-6" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-white">{activity.title}</span>
        <span className="block text-xs text-slate-400">
          {activity.duration} min{activity.benefit ? ` · ${activity.benefit}` : ""}
        </span>
        {activity.completed_count > 0 && (
          <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-emerald-300">
            <CheckCircle2 className="size-3" aria-hidden /> Completed {activity.completed_count}×
          </span>
        )}
      </span>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition group-hover:bg-gradient-to-br group-hover:from-primary-500 group-hover:to-primary-600">
        <Play className="ml-0.5 size-4 fill-current" aria-hidden />
      </span>
    </Link>
  );
}
