import { api } from "@/lib/api";
import type { Mood, MoodLog, MoodStats, ProgressSummary } from "@/types";

export const moodService = {
  async logMood(mood: Mood, note?: string): Promise<MoodLog> {
    const { data } = await api.post<MoodLog>("/api/mood", { mood, note: note || null });
    return data;
  },
  async getMoods(limit = 50): Promise<MoodLog[]> {
    const { data } = await api.get<MoodLog[]>("/api/mood", { params: { limit } });
    return data;
  },
  async getMoodStats(days = 7): Promise<MoodStats> {
    const { data } = await api.get<MoodStats>("/api/mood/stats", { params: { days } });
    return data;
  },
  async getProgressSummary(days = 7): Promise<ProgressSummary> {
    const { data } = await api.get<ProgressSummary>("/api/progress/summary", { params: { days } });
    return data;
  },
};
