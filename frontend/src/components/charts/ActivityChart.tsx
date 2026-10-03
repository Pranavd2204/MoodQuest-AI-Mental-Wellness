import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { DailyActivity } from "@/types";
import { parseDay, shortDay, shortWeekday } from "@/utils/date";

import { ACTIVITY_SERIES, AXIS_TICK, CHART_SURFACE, GRID_STROKE } from "./chartTheme";
import { TooltipCard, TooltipRow } from "./ChartTooltip";

type Datum = DailyActivity & { label: string };

function ActivityTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Datum }> }) {
  const datum = payload?.[0]?.payload;
  if (!active || !datum) return null;
  return (
    <TooltipCard title={parseDay(datum.date).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}>
      {datum.total === 0 ? (
        <p>No activity</p>
      ) : (
        ACTIVITY_SERIES.filter((s) => datum[s.key] > 0).map((s) => (
          <TooltipRow key={s.key} color={s.color} label={s.label} value={datum[s.key]} />
        ))
      )}
    </TooltipCard>
  );
}

export function ActivityChart({ daily }: { daily: DailyActivity[] }) {
  const short = daily.length <= 7;
  const data: Datum[] = daily.map((d) => ({ ...d, label: short ? shortWeekday(d.date) : shortDay(d.date) }));

  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Legend">
        {ACTIVITY_SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5 text-xs text-slate-300">
            <span className="size-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
            {s.label}
          </li>
        ))}
      </ul>
      <div className="h-56 w-full" role="img" aria-label="Stacked bar chart of your daily activity">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barCategoryGap={short ? "30%" : "15%"}>
            <CartesianGrid vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} interval={short ? 0 : "preserveStartEnd"} minTickGap={16} />
            <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <Tooltip content={<ActivityTooltip />} cursor={{ fill: "rgb(255 255 255 / 0.04)" }} />
            {ACTIVITY_SERIES.map((s, index) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                stackId="activity"
                fill={s.color}
                stroke={CHART_SURFACE}
                strokeWidth={2}
                radius={index === ACTIVITY_SERIES.length - 1 ? [4, 4, 0, 0] : 0}
                animationDuration={600}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
