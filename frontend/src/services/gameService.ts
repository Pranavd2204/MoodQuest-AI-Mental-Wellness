import { api } from "@/lib/api";
import type { Game, GameSession } from "@/types";

export const gameService = {
  async getGames(category?: string): Promise<Game[]> {
    const { data } = await api.get<Game[]>("/api/games", {
      params: { category: category && category !== "all" ? category : undefined },
    });
    return data;
  },
  async getGame(id: number): Promise<Game> {
    const { data } = await api.get<Game>(`/api/games/${id}`);
    return data;
  },
  async saveSession(gameId: number, score: number, duration: number): Promise<GameSession> {
    const { data } = await api.post<GameSession>(`/api/games/${gameId}/sessions`, {
      score: Math.max(0, Math.round(score)),
      duration: Math.max(1, Math.round(duration)),
    });
    return data;
  },
  async getHistory(limit = 20, gameId?: number): Promise<GameSession[]> {
    const { data } = await api.get<GameSession[]>("/api/games/history", { params: { limit, game_id: gameId } });
    return data;
  },
};
