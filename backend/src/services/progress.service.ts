import { prisma } from "../lib/prisma.ts";
import type { AuthUser } from "../middleware/auth.ts";
import { addDays, localDateKey, lowerBoundFor, safeTimeZone, todayKey } from "../utils/time.ts";

const KINDS = ["mood_checkins", "games", "activities", "journal_entries", "chat_messages"] as const;
type Kind = (typeof KINDS)[number];

export interface Streak {
  current: number;
  longest: number;
  active_today: boolean;
}

export const userTimeZone = (user: AuthUser) => safeTimeZone(user.profile?.timezone);

async function timestamps(userId: number, since?: Date): Promise<Record<Kind, Date[]>> {
  const after = since ? { gte: since } : undefined;
  const [moods, games, activities, journal, messages] = await Promise.all([
    prisma.moodLog.findMany({ where: { userId, createdAt: after }, select: { createdAt: true } }),
    prisma.gameSession.findMany({ where: { userId, completedAt: after }, select: { completedAt: true } }),
    prisma.activityCompletion.findMany({ where: { userId, completedAt: after }, select: { completedAt: true } }),
    prisma.journalEntry.findMany({ where: { userId, createdAt: after }, select: { createdAt: true } }),
    prisma.message.findMany({
      where: { sender: "user", conversation: { userId }, createdAt: after },
      select: { createdAt: true },
    }),
  ]);
  return {
    mood_checkins: moods.map((r) => r.createdAt),
    games: games.map((r) => r.completedAt),
    activities: activities.map((r) => r.completedAt),
    journal_entries: journal.map((r) => r.createdAt),
    chat_messages: messages.map((r) => r.createdAt),
  };
}

export function computeStreak(activeDays: Set<string>, today: string): Streak {
  const activeToday = activeDays.has(today);
  let cursor = activeToday ? today : addDays(today, -1);
  let current = 0;
  while (activeDays.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  let longest = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of [...activeDays].sort()) {
    run = previous !== null && addDays(previous, 1) === day ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  }
  return { current, longest, active_today: activeToday };
}

function activeDaysOf(stamps: Record<Kind, Date[]>, timeZone: string): Set<string> {
  return new Set(Object.values(stamps).flatMap((list) => list.map((ts) => localDateKey(ts, timeZone))));
}

export async function getStreak(user: AuthUser): Promise<Streak> {
  const timeZone = userTimeZone(user);
  return computeStreak(activeDaysOf(await timestamps(user.id), timeZone), todayKey(timeZone));
}

export async function getProgressSummary(user: AuthUser, days: number) {
  const timeZone = userTimeZone(user);
  const today = todayKey(timeZone);
  const start = addDays(today, -(days - 1));

  const stamps = await timestamps(user.id);
  const allDays = activeDaysOf(stamps, timeZone);

  const counts = new Map<string, Record<Kind, number>>();
  for (const kind of KINDS) {
    for (const ts of stamps[kind]) {
      const day = localDateKey(ts, timeZone);
      if (day < start || day > today) continue;
      const row = counts.get(day) ?? (Object.fromEntries(KINDS.map((k) => [k, 0])) as Record<Kind, number>);
      row[kind] += 1;
      counts.set(day, row);
    }
  }

  const daily = Array.from({ length: days }, (_, offset) => {
    const date = addDays(start, offset);
    const row = counts.get(date) ?? (Object.fromEntries(KINDS.map((k) => [k, 0])) as Record<Kind, number>);
    return { date, ...row, total: KINDS.reduce((sum, k) => sum + row[k], 0) };
  });

  const completions = await prisma.activityCompletion.findMany({
    where: { userId: user.id, completedAt: { gte: lowerBoundFor(start) } },
    select: { completedAt: true, activity: { select: { duration: true } } },
  });
  const mindfulMinutes = completions
    .filter((c) => localDateKey(c.completedAt, timeZone) >= start)
    .reduce((sum, c) => sum + c.activity.duration, 0);

  const sum = (key: Kind) => daily.reduce((total, d) => total + d[key], 0);
  return {
    range_days: days,
    streak: computeStreak(allDays, today),
    active_days: [...allDays].filter((d) => d >= start && d <= today).sort(),
    daily,
    totals: {
      mood_checkins: sum("mood_checkins"),
      games_played: sum("games"),
      activities_completed: sum("activities"),
      journal_entries: sum("journal_entries"),
      chat_messages: sum("chat_messages"),
      mindful_minutes: mindfulMinutes,
    },
  };
}
