import type { Request, Response } from "express";
import type { z } from "zod";

import { currentUser } from "../middleware/auth.ts";
import { body, params, query } from "../middleware/validate.ts";
import type { journalCreateBody, journalListQuery, journalUpdateBody } from "../schemas/index.ts";
import * as journalService from "../services/journal.service.ts";

type EntryId = { entryId: number };

export async function listEntries(req: Request, res: Response) {
  const { limit, offset } = query<z.infer<typeof journalListQuery>>(req);
  res.json(await journalService.listEntries(currentUser(req).id, limit, offset));
}

export async function createEntry(req: Request, res: Response) {
  res.status(201).json(await journalService.createEntry(currentUser(req).id, body<z.infer<typeof journalCreateBody>>(req)));
}

export async function getEntry(req: Request, res: Response) {
  res.json(await journalService.getEntry(currentUser(req).id, params<EntryId>(req).entryId));
}

export async function updateEntry(req: Request, res: Response) {
  const input = body<z.infer<typeof journalUpdateBody>>(req);
  res.json(await journalService.updateEntry(currentUser(req).id, params<EntryId>(req).entryId, input));
}

export async function deleteEntry(req: Request, res: Response) {
  await journalService.deleteEntry(currentUser(req).id, params<EntryId>(req).entryId);
  res.status(204).end();
}
