import { Router } from "express";

import * as chat from "../controllers/chat.controller.ts";
import { validate } from "../middleware/validate.ts";
import { conversationBody, idParam, messageBody } from "../schemas/index.ts";

export const chatRoutes = Router();
const conversationId = idParam("conversationId");

chatRoutes.get("/conversations", chat.listConversations);
chatRoutes.post("/conversations", validate({ body: conversationBody }), chat.createConversation);
chatRoutes.get("/conversations/:conversationId", validate({ params: conversationId }), chat.getConversation);
chatRoutes.delete("/conversations/:conversationId", validate({ params: conversationId }), chat.deleteConversation);
chatRoutes.post(
  "/conversations/:conversationId/messages",
  validate({ params: conversationId, body: messageBody }),
  chat.sendMessage,
);
