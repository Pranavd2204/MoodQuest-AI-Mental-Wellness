import type { Request, Response } from "express";
import type { z } from "zod";

import { currentUser } from "../middleware/auth.ts";
import { body, params } from "../middleware/validate.ts";
import type { conversationBody, messageBody } from "../schemas/index.ts";
import * as chatService from "../services/chat.service.ts";

type ConversationId = { conversationId: number };

export async function listConversations(req: Request, res: Response) {
  res.json(await chatService.listConversations(currentUser(req).id));
}

export async function createConversation(req: Request, res: Response) {
  const { title } = body<z.infer<typeof conversationBody>>(req);
  res.status(201).json(await chatService.createConversation(currentUser(req), title));
}

export async function getConversation(req: Request, res: Response) {
  res.json(await chatService.getConversation(currentUser(req).id, params<ConversationId>(req).conversationId));
}

export async function sendMessage(req: Request, res: Response) {
  const { content } = body<z.infer<typeof messageBody>>(req);
  res.status(201).json(await chatService.sendMessage(currentUser(req), params<ConversationId>(req).conversationId, content));
}

export async function deleteConversation(req: Request, res: Response) {
  await chatService.deleteConversation(currentUser(req).id, params<ConversationId>(req).conversationId);
  res.status(204).end();
}
