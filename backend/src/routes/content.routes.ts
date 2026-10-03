import { Router } from "express";

import * as content from "../controllers/content.controller.ts";
import { validate } from "../middleware/validate.ts";
import {
  activityListQuery,
  completionsQuery,
  gameHistoryQuery,
  gameListQuery,
  gameSessionBody,
  idParam,
  movieQuery,
  musicQuery,
  recommendationListQuery,
} from "../schemas/index.ts";

export const recommendationRoutes = Router();

recommendationRoutes.get("/", validate({ query: recommendationListQuery }), content.listRecommendations);
recommendationRoutes.get("/music", validate({ query: musicQuery }), content.musicFeed);
recommendationRoutes.get("/movies", validate({ query: movieQuery }), content.movieFeed);
recommendationRoutes.get("/exercises", content.exerciseFeed);

export const gameRoutes = Router();
const gameId = idParam("gameId");

gameRoutes.get("/", validate({ query: gameListQuery }), content.listGames);
gameRoutes.get("/history", validate({ query: gameHistoryQuery }), content.gameHistory);
gameRoutes.get("/:gameId", validate({ params: gameId }), content.getGame);
gameRoutes.post("/:gameId/sessions", validate({ params: gameId, body: gameSessionBody }), content.createGameSession);

export const activityRoutes = Router();
const activityId = idParam("activityId");

activityRoutes.get("/", validate({ query: activityListQuery }), content.listActivities);
activityRoutes.get("/completions", validate({ query: completionsQuery }), content.listCompletions);
activityRoutes.get("/:activityId", validate({ params: activityId }), content.getActivity);
activityRoutes.post("/:activityId/complete", validate({ params: activityId }), content.completeActivity);
