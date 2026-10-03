import type { Game } from "../generated/prisma/client.ts";
import { prisma } from "../lib/prisma.ts";
import { notFound } from "../utils/httpError.ts";
import { serializeGame, serializeGameSession } from "../utils/serializers.ts";

async function withUserStats(userId: number, games: Game[]) {
  const rows = await prisma.gameSession.groupBy({
    by: ["gameId"],
    where: { userId, gameId: { in: games.map((g) => g.id) } },
    _count: { _all: true },
    _max: { score: true },
  });
  const stats = new Map(rows.map((r) => [r.gameId, { timesPlayed: r._count._all, bestScore: r._max.score }]));
  return games.map((g) => serializeGame(g, stats.get(g.id) ?? { timesPlayed: 0, bestScore: null }));
}

export async function listGames(userId: number, category?: string) {
  let games = await prisma.game.findMany({ orderBy: { id: "asc" } });
  if (category && category !== "all") games = games.filter((g) => g.category === category || g.tags.includes(category));
  return withUserStats(userId, games);
}

async function findGame(id: number) {
  const game = await prisma.game.findUnique({ where: { id } });
  if (!game) throw notFound("Game not found");
  return game;
}

export async function getGame(userId: number, id: number) {
  return (await withUserStats(userId, [await findGame(id)]))[0];
}

export async function createSession(userId: number, gameId: number, score: number, duration: number) {
  await findGame(gameId);
  const session = await prisma.gameSession.create({ data: { userId, gameId, score, duration }, include: { game: true } });
  return serializeGameSession(session);
}

export async function history(userId: number, limit: number, gameId?: number) {
  const sessions = await prisma.gameSession.findMany({
    where: { userId, ...(gameId !== undefined && { gameId }) },
    orderBy: [{ completedAt: "desc" }, { id: "desc" }],
    take: limit,
    include: { game: true },
  });
  return sessions.map(serializeGameSession);
}
