import { api } from "@/lib/api";
import type { ExerciseFeed, Recommendation, RecommendationFeed, RecommendationType } from "@/types";

export const recommendationService = {
  async getRecommendations(type?: RecommendationType): Promise<Recommendation[]> {
    const { data } = await api.get<Recommendation[]>("/api/recommendations", { params: { type } });
    return data;
  },
  async getMusic(category = "for_you", q?: string): Promise<RecommendationFeed> {
    const { data } = await api.get<RecommendationFeed>("/api/recommendations/music", {
      params: { category, q: q || undefined },
    });
    return data;
  },
  async getMovies(category = "for_you", q?: string): Promise<RecommendationFeed> {
    const { data } = await api.get<RecommendationFeed>("/api/recommendations/movies", {
      params: { category, q: q || undefined },
    });
    return data;
  },
  async getExercises(): Promise<ExerciseFeed> {
    const { data } = await api.get<ExerciseFeed>("/api/recommendations/exercises");
    return data;
  },
};
