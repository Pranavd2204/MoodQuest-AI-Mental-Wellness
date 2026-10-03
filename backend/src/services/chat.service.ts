import type { Conversation, Message } from "../generated/prisma/client.ts";
import { prisma } from "../lib/prisma.ts";
import type { AuthUser } from "../middleware/auth.ts";
import { notFound } from "../utils/httpError.ts";
import { serializeMessage } from "../utils/serializers.ts";
import { DEFAULT_SUGGESTIONS, getAssistantProvider } from "./assistant.service.ts";

const HISTORY_WINDOW = 20;
const TITLE_LENGTH = 40;
const DEFAULT_TITLE = "New conversation";

function titleFrom(text: string): string {
  const clean = text.split(/\s+/).filter(Boolean).join(" ");
  return clean.length <= TITLE_LENGTH ? clean : `${clean.slice(0, TITLE_LENGTH - 1).trimEnd()}…`;
}

function toDetail(conversation: Conversation & { messages: Message[] }) {
  return {
    id: conversation.id,
    title: conversation.title,
    created_at: conversation.createdAt,
    updated_at: conversation.updatedAt,
    messages: conversation.messages.map(serializeMessage),
    suggestions: [...DEFAULT_SUGGESTIONS],
  };
}

export async function listConversations(userId: number) {
  const conversations = await prisma.conversation.findMany({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    include: {
      _count: { select: { messages: true } },
      messages: { orderBy: { id: "desc" }, take: 1, select: { content: true } },
    },
  });
  return conversations.map((c) => ({
    id: c.id,
    title: c.title,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
    message_count: c._count.messages,
    last_message: c.messages[0]?.content ?? null,
  }));
}

export async function createConversation(user: AuthUser, title?: string | null) {
  const greeting = getAssistantProvider().greeting(user.name);
  const conversation = await prisma.conversation.create({
    data: {
      userId: user.id,
      title: title?.trim() || DEFAULT_TITLE,
      messages: { create: { sender: "assistant", content: greeting.content } },
    },
    include: { messages: { orderBy: { id: "asc" } } },
  });
  return toDetail(conversation);
}

async function ownedConversation(userId: number, id: number) {
  const conversation = await prisma.conversation.findFirst({
    where: { id, userId },
    include: { messages: { orderBy: { id: "asc" } } },
  });
  if (!conversation) throw notFound("Conversation not found");
  return conversation;
}

export async function getConversation(userId: number, id: number) {
  return toDetail(await ownedConversation(userId, id));
}

export async function deleteConversation(userId: number, id: number) {
  await ownedConversation(userId, id);
  await prisma.conversation.delete({ where: { id } });
}

export async function sendMessage(user: AuthUser, conversationId: number, content: string) {
  const conversation = await ownedConversation(user.id, conversationId);
  const history = conversation.messages.slice(-HISTORY_WINDOW);
  const isFirstUserMessage = !conversation.messages.some((m) => m.sender === "user");

  const reply = await getAssistantProvider().reply({ userName: user.name, history, message: content });

  const [userMessage, assistantMessage] = await prisma.$transaction(async (tx) => {
    const saved = await tx.message.create({ data: { conversationId, sender: "user", content } });
    const answer = await tx.message.create({ data: { conversationId, sender: "assistant", content: reply.content } });
    await tx.conversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date(), // sorts the conversation to the top
        ...(isFirstUserMessage && conversation.title === DEFAULT_TITLE && { title: titleFrom(content) }),
      },
    });
    return [saved, answer];
  });

  return {
    user_message: serializeMessage(userMessage),
    assistant_message: serializeMessage(assistantMessage),
    suggestions: reply.suggestions,
  };
}
