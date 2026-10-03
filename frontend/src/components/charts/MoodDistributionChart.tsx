import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { DistributionItem } from "@/types";
import { MOOD_BY_KEY } from "@/utils/moods";

import { CHART_SURFACE, DONUT_ORDER, MOOD_CHART_COLORS } from "./chartTheme";
import { TooltipCard, TooltipRow } from "./ChartTooltip";

function SliceTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: DistributionItem }> }) {
  const item = payload?.[0]?.payload;
  if (!active || !item) return null;
  return (
    <TooltipCard title={MOOD_BY_KEY[item.mood].label}>
      <TooltipRow color={MOOD_CHART_COLORS[item.mood]} label="Share" value={`${item.percentage}%`} />
      <TooltipRow label="Check-ins" value={item.count} />
    </TooltipCard>
  );
}

export function MoodDistributionChart({ distribution }: { distribution: DistributionItem[] }) {
  const byMood = Object.fromEntries(distribution.map((d) => [d.mood, d]));
  const ordered = DONUT_ORDER.map((mood) => byMood[mood]).filter(Boolean) as DistributionItem[];
  const slices = ordered.filter((d) => d.count > 0);
  const total = slices.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative size-44 shrink-0" role="img" aria-label="Donut chart of how often you felt each mood">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="count"
              nameKey="mood"
              innerRadius="62%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              paddingAngle={slices.length > 1 ? 2 : 0}
              cornerRadius={slices.length > 1 ? 4 : 0}
              stroke={CHART_SURFACE}
              strokeWidth={slices.length > 1 ? 2 : 0}
              animationDuration={700}
            >
              {slices.map((slice) => (
                <Cell key={slice.mood} fill={MOOD_CHART_COLORS[slice.mood]} />
              ))}
            </Pie>
            <Tooltip content={<SliceTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white tabular-nums">{total}</span>
          <span className="text-[11px] text-slate-400">check-ins</span>
        </div>
      </div>
      <ul className="grid w-full grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-1">
        {ordered.map((item) => (
          <li key={item.mood} className="flex items-center gap-2.5 text-sm">
            <span className="size-3 shrink-0 rounded-full" style={{ background: MOOD_CHART_COLORS[item.mood] }} aria-hidden />
            <span className="flex-1 text-slate-200">{MOOD_BY_KEY[item.mood].label}</span>
            <span className="font-semibold text-white tabular-nums">{Math.round(item.percentage)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
