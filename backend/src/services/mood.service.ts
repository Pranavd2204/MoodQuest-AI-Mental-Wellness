import type { MoodLog } from "../generated/prisma/client.ts";
import { prisma } from "../lib/prisma.ts";
import type { AuthUser } from "../middleware/auth.ts";
import { MOOD_SCORES, MOODS, type Mood } from "../utils/moods.ts";
import { serializeMood } from "../utils/serializers.ts";
import { addDays, localDateKey, lowerBoundFor, todayKey } from "../utils/time.ts";
import { getStreak, userTimeZone } from "./progress.service.ts";

const MIN_DAYS_FOR_TREND = 2;
const MIN_CHECKINS_FOR_INSIGHT = 3;
const INSIGHT_THRESHOLD_PERCENT = 5;

const round = (value: number, digits: number) => Number(value.toFixed(digits));

export async function createMood(userId: number, mood: Mood, note: string | null, source = "manual") {
  const log = await prisma.moodLog.create({ data: { userId, mood, score: MOOD_SCORES[mood], source, note } });
  return serializeMood(log);
}

export async function listMoods(userId: number, limit: number, offset: number) {
  const logs = await prisma.moodLog.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    skip: offset,
  });
  return logs.map(serializeMood);
}

export function latestMood(userId: number) {
  return prisma.moodLog.findFirst({ where: { userId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
}

const periodLabel = (days: number) => ({ 7: "week", 30: "month" })[days] ?? `${days} days`;
const average = (logs: MoodLog[]) => (logs.length ? logs.reduce((s, l) => s + l.score, 0) / logs.length : null);

function dominant(logs: MoodLog[]): string | null {
  if (!logs.length) return null;
  const counts = new Map<string, number>();
  for (const log of logs) counts.set(log.mood, (counts.get(log.mood) ?? 0) + 1);
  const top = Math.max(...counts.values());
  for (let i = logs.length - 1; i >= 0; i--) if (counts.get(logs[i].mood) === top) return logs[i].mood;
  return null;
}

function insight(current: MoodLog[], previous: MoodLog[], days: number) {
  const period = periodLabel(days);
  const currentAvg = average(current);
  const previousAvg = average(previous);

  if (currentAvg !== null && previousAvg !== null) {
    const change = round(((currentAvg - previousAvg) / previousAvg) * 100, 1);
    if (change >= INSIGHT_THRESHOLD_PERCENT) {
      return {
        kind: "improved",
        change_percent: change,
        message: `Your mood has improved by ${change}% compared to the previous ${period}. Great progress!`,
      };
    }
    if (change <= -INSIGHT_THRESHOLD_PERCENT) {
      return {
        kind: "declined",
        change_percent: change,
        message: `Your mood dipped ${Math.abs(change)}% compared to the previous ${period}. Be gentle with yourself — a short breathing exercise might help.`,
      };
    }
    return { kind: "steady", change_percent: change, message: `Your mood has been steady compared to the previous ${period}.` };
  }

  if (current.length >= MIN_CHECKINS_FOR_INSIGHT) {
    const mood = dominant(current)!;
    return {
      kind: "dominant",
      change_percent: null,
      message: `${mood[0].toUpperCase()}${mood.slice(1)} has been your most frequent mood this ${period}.`,
    };
  }
  return null;
}

export async function getMoodStats(user: AuthUser, days: number) {
  const timeZone = userTimeZone(user);
  const today = todayKey(timeZone);
  const start = addDays(today, -(days - 1));
  const previousStart = addDays(start, -days);

  const logs = await prisma.moodLog.findMany({
    where: { userId: user.id, createdAt: { gte: lowerBoundFor(previousStart) } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  const current: MoodLog[] = [];
  const previous: MoodLog[] = [];
  const byDay = new Map<string, MoodLog[]>();
  for (const log of logs) {
    const day = localDateKey(log.createdAt, timeZone);
    if (day > today || day < previousStart) continue;
    if (day >= start) {
      current.push(log);
      byDay.set(day, [...(byDay.get(day) ?? []), log]);
    } else {
      previous.push(log);
    }
  }

  const trend = Array.from({ length: days }, (_, offset) => {
    const date = addDays(start, offset);
    const dayLogs = byDay.get(date) ?? [];
    const avg = average(dayLogs);
    return { date, average_score: avg === null ? null : round(avg, 2), count: dayLogs.length, dominant_mood: dominant(dayLogs) };
  });

  const total = current.length;
  const distribution = MOODS.map((mood) => {
    const count = current.filter((l) => l.mood === mood).length;
    return { mood, count, percentage: total ? round((count / total) * 100, 1) : 0 };
  });

  const latest = await latestMood(user.id);
  return {
    range_days: days,
    latest: latest ? serializeMood(latest) : null,
    today_logged: !!latest && localDateKey(latest.createdAt, timeZone) === today,
    streak: await getStreak(user),
    total_checkins: total,
    days_with_data: byDay.size,
    has_enough_data: byDay.size >= MIN_DAYS_FOR_TREND,
    trend,
    distribution,
    insight: insight(current, previous, days),
  };
}
