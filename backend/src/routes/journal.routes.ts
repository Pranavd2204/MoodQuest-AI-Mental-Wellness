import { Router } from "express";

import * as journal from "../controllers/journal.controller.ts";
import { validate } from "../middleware/validate.ts";
import { idParam, journalCreateBody, journalListQuery, journalUpdateBody } from "../schemas/index.ts";

export const journalRoutes = Router();
const entryId = idParam("entryId");

journalRoutes.get("/", validate({ query: journalListQuery }), journal.listEntries);
journalRoutes.post("/", validate({ body: journalCreateBody }), journal.createEntry);
journalRoutes.get("/:entryId", validate({ params: entryId }), journal.getEntry);
journalRoutes.put("/:entryId", validate({ params: entryId, body: journalUpdateBody }), journal.updateEntry);
journalRoutes.delete("/:entryId", validate({ params: entryId }), journal.deleteEntry);
