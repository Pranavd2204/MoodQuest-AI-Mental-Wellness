import type { Request, Response } from "express";
import type { z } from "zod";

import { currentUser } from "../middleware/auth.ts";
import { body, params, query } from "../middleware/validate.ts";
import type {
  activityListQuery,
  completionsQuery,
  gameHistoryQuery,
  gameListQuery,
  gameSessionBody,
  movieQuery,
  musicQuery,
  recommendationListQuery,
} from "../schemas/index.ts";
import * as activityService from "../services/activity.service.ts";
import * as gameService from "../services/game.service.ts";
import * as recommendationService from "../services/recommendation.service.ts";

export async function listRecommendations(req: Request, res: Response) {
  const { type } = query<z.infer<typeof recommendationListQuery>>(req);
  res.json(await recommendationService.getAll(currentUser(req).id, type));
}

export async function musicFeed(req: Request, res: Response) {
  const { category, q } = query<z.infer<typeof musicQuery>>(req);
  res.json(await recommendationService.getFeed(currentUser(req).id, { type: "music", category, query: q }));
}

export async function movieFeed(req: Request, res: Response) {
  const { category, q } = query<z.infer<typeof movieQuery>>(req);
  res.json(await recommendationService.getFeed(currentUser(req).id, { type: "movie", category, query: q }));
}

export async function exerciseFeed(req: Request, res: Response) {
  res.json(await recommendationService.getExerciseFeed(currentUser(req).id));
}

export async function listGames(req: Request, res: Response) {
  res.json(await gameService.listGames(currentUser(req).id, query<z.infer<typeof gameListQuery>>(req).category));
}

export async function gameHistory(req: Request, res: Response) {
  const { limit, game_id } = query<z.infer<typeof gameHistoryQuery>>(req);
  res.json(await gameService.history(currentUser(req).id, limit, game_id));
}

export async function getGame(req: Request, res: Response) {
  res.json(await gameService.getGame(currentUser(req).id, params<{ gameId: number }>(req).gameId));
}

export async function createGameSession(req: Request, res: Response) {
  const { score, duration } = body<z.infer<typeof gameSessionBody>>(req);
  const { gameId } = params<{ gameId: number }>(req);
  res.status(201).json(await gameService.createSession(currentUser(req).id, gameId, score, duration));
}

export async function listActivities(req: Request, res: Response) {
  const { category } = query<z.infer<typeof activityListQuery>>(req);
  res.json(await activityService.activitiesWithProgress(currentUser(req).id, category));
}

export async function listCompletions(req: Request, res: Response) {
  res.json(await activityService.listCompletions(currentUser(req).id, query<z.infer<typeof completionsQuery>>(req).limit));
}

export async function getActivity(req: Request, res: Response) {
  res.json(await activityService.getActivity(currentUser(req).id, params<{ activityId: number }>(req).activityId));
}

export async function completeActivity(req: Request, res: Response) {
  const { activityId } = params<{ activityId: number }>(req);
  res.status(201).json(await activityService.completeActivity(currentUser(req).id, activityId));
}
