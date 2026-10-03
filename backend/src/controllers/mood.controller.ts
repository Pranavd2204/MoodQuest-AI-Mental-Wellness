import type { Request, Response } from "express";
import type { z } from "zod";

import { currentUser } from "../middleware/auth.ts";
import { body, query } from "../middleware/validate.ts";
import type { daysQuery, moodBody, moodListQuery } from "../schemas/index.ts";
import * as moodService from "../services/mood.service.ts";
import { getProgressSummary } from "../services/progress.service.ts";

export async function listMoods(req: Request, res: Response) {
  const { limit, offset } = query<z.infer<typeof moodListQuery>>(req);
  res.json(await moodService.listMoods(currentUser(req).id, limit, offset));
}

export async function createMood(req: Request, res: Response) {
  const { mood, note } = body<z.infer<typeof moodBody>>(req);
  res.status(201).json(await moodService.createMood(currentUser(req).id, mood, note ?? null));
}

export async function moodStats(req: Request, res: Response) {
  res.json(await moodService.getMoodStats(currentUser(req), query<z.infer<typeof daysQuery>>(req).days));
}

export async function progressSummary(req: Request, res: Response) {
  res.json(await getProgressSummary(currentUser(req), query<z.infer<typeof daysQuery>>(req).days));
}
