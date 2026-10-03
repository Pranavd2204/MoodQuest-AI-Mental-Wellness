import { Router } from "express";

import * as mood from "../controllers/mood.controller.ts";
import { validate } from "../middleware/validate.ts";
import { daysQuery, moodBody, moodListQuery } from "../schemas/index.ts";

export const moodRoutes = Router();

moodRoutes.get("/", validate({ query: moodListQuery }), mood.listMoods);
moodRoutes.post("/", validate({ body: moodBody }), mood.createMood);
moodRoutes.get("/stats", validate({ query: daysQuery }), mood.moodStats);

export const progressRoutes = Router();

progressRoutes.get("/summary", validate({ query: daysQuery }), mood.progressSummary);
