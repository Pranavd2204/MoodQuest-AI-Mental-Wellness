import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { Mood, TrendPoint } from "@/types";
import { parseDay, shortDay, shortWeekday } from "@/utils/date";
import { MOOD_BY_KEY, SCORE_LABELS } from "@/utils/moods";

import { AXIS_TICK, CHART_SURFACE, GRID_STROKE, MOOD_CHART_COLORS, TREND_LINE } from "./chartTheme";
import { TooltipCard, TooltipRow } from "./ChartTooltip";

interface Datum {
  date: string;
  label: string;
  score: number | null;
  mood: Mood | null;
  count: number;
}

function TrendTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Datum }> }) {
  const datum = payload?.[0]?.payload;
  if (!active || !datum) return null;
  const title = parseDay(datum.date).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
  if (datum.score === null) {
    return (
      <TooltipCard title={title}>
        <p>No check-in</p>
      </TooltipCard>
    );
  }
  return (
    <TooltipCard title={title}>
      {datum.mood && <TooltipRow color={MOOD_CHART_COLORS[datum.mood]} label="Mostly" value={MOOD_BY_KEY[datum.mood].label} />}
      <TooltipRow label="Mood score" value={`${datum.score.toFixed(1)} / 5`} />
      <TooltipRow label="Check-ins" value={datum.count} />
    </TooltipCard>
  );
}

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: Datum;
}

function MoodDot({ cx, cy, payload }: DotProps) {
  if (cx === undefined || cy === undefined || !payload?.mood) return null;
  return <circle cx={cx} cy={cy} r={5} fill={MOOD_CHART_COLORS[payload.mood]} stroke={CHART_SURFACE} strokeWidth={2} />;
}

export function MoodTrendChart({ trend }: { trend: TrendPoint[] }) {
  const daily = trend.length <= 7;
  const data: Datum[] = trend.map((point) => ({
    date: point.date,
    label: daily ? shortWeekday(point.date) : shortDay(point.date),
    score: point.average_score,
    mood: point.dominant_mood,
    count: point.count,
  }));

  return (
    <div className="h-56 w-full sm:h-64" role="img" aria-label="Line chart of your daily mood score">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TREND_LINE} stopOpacity={0.35} />
              <stop offset="100%" stopColor={TREND_LINE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            interval={daily ? 0 : "preserveStartEnd"}
            minTickGap={16}
          />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={AXIS_TICK}
            tickFormatter={(value: number) => SCORE_LABELS[value] ?? ""}
            axisLine={false}
            tickLine={false}
            width={58}
          />
          <Tooltip content={<TrendTooltip />} cursor={{ stroke: "rgb(255 255 255 / 0.25)", strokeDasharray: "3 3" }} />
          <Area
            type="monotone"
            dataKey="score"
            stroke={TREND_LINE}
            strokeWidth={2}
            fill="url(#trend-fill)"
            connectNulls
            dot={<MoodDot />}
            activeDot={{ r: 6, stroke: CHART_SURFACE, strokeWidth: 2, fill: TREND_LINE }}
            isAnimationActive
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
