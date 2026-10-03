import {
  BookOpen,
  ChartColumn,
  Flame,
  Gamepad2,
  Leaf,
  MessageCircle,
  Settings,
  Sparkles,
  Timer,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ActivityChart } from "@/components/charts/ActivityChart";
import { MoodDistributionChart } from "@/components/charts/MoodDistributionChart";
import { MoodTrendChart } from "@/components/charts/MoodTrendChart";
import { MoodFace } from "@/components/mood/MoodFace";
import { PageHeader } from "@/components/navigation/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, SectionHeader } from "@/components/ui/Card";
import { SelectField } from "@/components/ui/Field";
import { IconButton } from "@/components/ui/IconButton";
import { PillTabs } from "@/components/ui/PillTabs";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { useAsync } from "@/hooks/useAsync";
import { cn } from "@/lib/cn";
import { activityService } from "@/services/activityService";
import { gameService } from "@/services/gameService";
import { journalService } from "@/services/journalService";
import { moodService } from "@/services/moodService";
import type { MoodStats, ProgressSummary } from "@/types";
import { formatDuration, parseDay, timeAgo } from "@/utils/date";

type Tab = "mood" | "activity" | "journal" | "streaks";

const TABS = [
  { value: "mood" as const, label: "Mood" },
  { value: "activity" as const, label: "Activity" },
  { value: "journal" as const, label: "Journal" },
  { value: "streaks" as const, label: "Streaks" },
];

const RANGES = [
  { days: 7, label: "Last 7 Days" },
  { days: 30, label: "Last 30 Days" },
  { days: 90, label: "Last 90 Days" },
];

export function ProgressPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("mood");
  const [days, setDays] = useState(7);

  return (
    <div>
      <PageHeader
        title="Your Progress"
        actions={
          <IconButton label="Settings" onClick={() => navigate("/profile")}>
            <Settings className="size-4.5" />
          </IconButton>
        }
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PillTabs options={TABS} value={tab} onChange={setTab} label="Progress sections" size="sm" />
        <SelectField
          label="Time range"
          hideLabel
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="sm:w-44"
        >
          {RANGES.map((r) => (
            <option key={r.days} value={r.days}>
              {r.label}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="mt-5">
        {tab === "mood" && <MoodTab days={days} />}
        {tab === "activity" && <ActivityTab days={days} />}
        {tab === "journal" && <JournalTab days={days} />}
        {tab === "streaks" && <StreaksTab days={days} />}
      </div>
    </div>
  );
}

function useStats(days: number) {
  return useAsync<MoodStats>(() => moodService.getMoodStats(days), [days]);
}

function useSummary(days: number) {
  return useAsync<ProgressSummary>(() => moodService.getProgressSummary(days), [days]);
}

function MoodTab({ days }: { days: number }) {
  const { data, loading, error, reload } = useStats(days);
  if (loading && !data) return <LoadingState label="Loading your mood insights…" />;
  if (error || !data) return <ErrorState message={error ?? "No data"} onRetry={reload} />;

  const insight = data.insight;
  const InsightIcon = insight?.kind === "declined" ? TrendingDown : insight?.kind === "improved" ? TrendingUp : Sparkles;

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <SectionHeader title="Mood Trend" action={<span className="text-xs text-slate-400">{data.total_checkins} check-ins</span>} />
        {data.has_enough_data ? (
          <MoodTrendChart trend={data.trend} />
        ) : (
          <EmptyState
            icon={ChartColumn}
            title="Keep checking in to unlock your mood insights."
            message={
              data.total_checkins === 0
                ? "No mood data yet in this period. Check in for a few days to see your trend."
                : "Check in on at least two different days to see your trend."
            }
            action={
              <Link to="/">
                <Button size="sm">Check in now</Button>
              </Link>
            }
          />
        )}
      </Card>

      <Card className="lg:col-span-2">
        <SectionHeader title="Mood Distribution" />
        {data.total_checkins > 0 ? (
          <MoodDistributionChart distribution={data.distribution} />
        ) : (
          <EmptyState compact icon={Leaf} title="No check-ins yet" message="Your mood mix will appear here." />
        )}
      </Card>

      <Card className="lg:col-span-5">
        <SectionHeader title="Insights" />
        {insight ? (
          <p className="flex items-start gap-3 text-sm text-slate-200">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full",
                insight.kind === "declined" ? "bg-amber-500/15 text-amber-300" : "bg-emerald-500/15 text-emerald-300",
              )}
            >
              <InsightIcon className="size-4.5" aria-hidden />
            </span>
            <span className="pt-1.5">{insight.message}</span>
          </p>
        ) : (
          <p className="text-sm text-slate-400">
            Not enough data for insights yet. A few more check-ins and we'll start spotting patterns for you.
          </p>
        )}
      </Card>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tint }: { icon: typeof Flame; label: string; value: string | number; tint: string }) {
  return (
    <div className="glass flex items-center gap-3 p-4">
      <span className="flex size-10 items-center justify-center rounded-xl" style={{ background: `${tint}22`, color: tint }}>
        <Icon className="size-5" aria-hidden />
      </span>
      <div>
        <p className="text-xl font-bold text-white tabular-nums">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function ActivityTab({ days }: { days: number }) {
  const summary = useSummary(days);
  const games = useAsync(() => gameService.getHistory(5), []);
  const completions = useAsync(() => activityService.getCompletions(5), []);

  if (summary.loading && !summary.data) return <LoadingState label="Loading activity…" />;
  if (summary.error || !summary.data) return <ErrorState message={summary.error ?? "No data"} onRetry={summary.reload} />;
  const { totals, daily } = summary.data;
  const anything = daily.some((d) => d.total > 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={Timer} label="Mindful minutes" value={totals.mindful_minutes} tint="#22d3ee" />
        <StatTile icon={Gamepad2} label="Games played" value={totals.games_played} tint="#fb923c" />
        <StatTile icon={Leaf} label="Exercises done" value={totals.activities_completed} tint="#34d399" />
        <StatTile icon={MessageCircle} label="Chat messages" value={totals.chat_messages} tint="#f472b6" />
      </div>
      <Card>
        <SectionHeader title="Daily Activity" />
        {anything ? (
          <ActivityChart daily={daily} />
        ) : (
          <EmptyState icon={ChartColumn} title="No activity in this period" message="Play a game, try an exercise or check in to see your activity here." />
        )}
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Recent Games" action={<Link to="/games" className="text-xs text-primary-300 hover:underline">All games</Link>} />
          {games.loading && !games.data ? (
            <LoadingState />
          ) : games.error ? (
            <ErrorState message={games.error} onRetry={games.reload} />
          ) : !games.data?.length ? (
            <EmptyState compact icon={Trophy} title="Play your first game to start tracking progress." />
          ) : (
            <ul className="divide-y divide-white/5">
              {games.data.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span>
                    <span className="font-medium text-white">{s.game_name}</span>
                    <span className="block text-xs text-slate-500">{timeAgo(s.completed_at)} · {formatDuration(s.duration)}</span>
                  </span>
                  <span className="font-semibold text-primary-200 tabular-nums">{s.score} pts</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <SectionHeader title="Recent Exercises" action={<Link to="/meditation" className="text-xs text-primary-300 hover:underline">Meditate</Link>} />
          {completions.loading && !completions.data ? (
            <LoadingState />
          ) : completions.error ? (
            <ErrorState message={completions.error} onRetry={completions.reload} />
          ) : !completions.data?.length ? (
            <EmptyState compact icon={Leaf} title="No exercises completed yet" message="Try the 5 minute breathing exercise." />
          ) : (
            <ul className="divide-y divide-white/5">
              {completions.data.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium text-white">{c.activity_title}</span>
                  <span className="text-xs text-slate-500">{timeAgo(c.completed_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function JournalTab({ days }: { days: number }) {
  const summary = useSummary(days);
  const entries = useAsync(() => journalService.list(5), []);

  if ((summary.loading && !summary.data) || (entries.loading && !entries.data)) return <LoadingState label="Loading journal…" />;
  const error = summary.error ?? entries.error;
  if (error) return <ErrorState message={error} onRetry={() => void Promise.all([summary.reload(), entries.reload()])} />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatTile icon={BookOpen} label={`Entries, last ${days} days`} value={summary.data?.totals.journal_entries ?? 0} tint="#f59e0b" />
        <StatTile
          icon={Sparkles}
          label="Last entry"
          value={entries.data?.[0] ? timeAgo(entries.data[0].created_at) : "—"}
          tint="#a78bfa"
        />
      </div>
      <Card>
        <SectionHeader title="Recent Entries" action={<Link to="/journal" className="text-xs text-primary-300 hover:underline">Open journal</Link>} />
        {!entries.data?.length ? (
          <EmptyState
            icon={BookOpen}
            title="Your journal is empty."
            message="Writing down your thoughts is a great way to notice patterns."
            action={
              <Link to="/journal">
                <Button size="sm">Write an entry</Button>
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2">
            {entries.data.map((entry) => (
              <li key={entry.id}>
                <Link to="/journal" className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-white/5">
                  {entry.mood ? (
                    <MoodFace mood={entry.mood} className="size-8 shrink-0" />
                  ) : (
                    <span className="flex size-8 items-center justify-center rounded-full bg-white/5 text-slate-500">
                      <BookOpen className="size-4" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-white">{entry.title}</span>
                    <span className="block truncate text-xs text-slate-400">{entry.content}</span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">{timeAgo(entry.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StreaksTab({ days }: { days: number }) {
  const summary = useSummary(days);
  if (summary.loading && !summary.data) return <LoadingState label="Loading streaks…" />;
  if (summary.error || !summary.data) return <ErrorState message={summary.error ?? "No data"} onRetry={summary.reload} />;
  const { streak, daily, active_days } = summary.data;
  const active = new Set(active_days);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="glass relative overflow-hidden p-5 sm:col-span-1">
          <div className="absolute -top-8 -right-8 size-32 rounded-full bg-orange-500/20 blur-2xl" aria-hidden />
          <Flame className={cn("size-10", streak.current ? "text-orange-400" : "text-slate-600")} aria-hidden />
          <p className="mt-2 text-4xl font-extrabold text-white tabular-nums">{streak.current}</p>
          <p className="text-sm text-slate-300">day current streak</p>
          <p className="mt-1 text-xs text-slate-500">
            {streak.active_today ? "You're active today — nice!" : streak.current ? "Do anything today to keep it going." : "Check in, play or meditate to start one."}
          </p>
        </div>
        <StatTile icon={Trophy} label="Longest streak (days)" value={streak.longest} tint="#facc15" />
        <StatTile icon={Sparkles} label={`Active days, last ${days}`} value={active_days.length} tint="#a78bfa" />
      </div>
      <Card>
        <SectionHeader title="Activity Calendar" />
        <p className="mb-3 text-xs text-slate-400">Any check-in, game, exercise, journal entry or chat counts towards your streak.</p>
        <ol className={cn("grid gap-1.5", days <= 7 ? "grid-cols-7" : "grid-cols-10 sm:grid-cols-15")}>
          {daily.map((d) => {
            const isActive = active.has(d.date);
            const date = parseDay(d.date);
            return (
              <li
                key={d.date}
                title={`${date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}: ${isActive ? `${d.total} activities` : "no activity"}`}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-lg text-[10px] font-medium",
                  isActive
                    ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-[0_0_12px_-2px_rgb(139_141_248/0.8)]"
                    : "bg-white/[0.04] text-slate-500",
                )}
              >
                {date.getDate()}
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}
