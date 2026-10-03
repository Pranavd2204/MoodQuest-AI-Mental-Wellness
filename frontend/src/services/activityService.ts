import { api } from "@/lib/api";
import type { Activity, ActivityCompletion } from "@/types";

export const activityService = {
  async getActivities(category?: string): Promise<Activity[]> {
    const { data } = await api.get<Activity[]>("/api/activities", {
      params: { category: category && category !== "all" ? category : undefined },
    });
    return data;
  },
  async getActivity(id: number): Promise<Activity> {
    const { data } = await api.get<Activity>(`/api/activities/${id}`);
    return data;
  },
  async complete(id: number): Promise<ActivityCompletion> {
    const { data } = await api.post<ActivityCompletion>(`/api/activities/${id}/complete`);
    return data;
  },
  async getCompletions(limit = 20): Promise<ActivityCompletion[]> {
    const { data } = await api.get<ActivityCompletion[]>("/api/activities/completions", { params: { limit } });
    return data;
  },
};
