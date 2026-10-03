import { prisma } from "../lib/prisma.ts";
import { notFound } from "../utils/httpError.ts";
import { serializeJournal } from "../utils/serializers.ts";

export interface JournalCreate {
  title: string;
  content: string;
  mood?: string | null;
}

export interface JournalUpdate {
  title?: string;
  content?: string;
  mood?: string | null;
  clear_mood?: boolean;
}

async function ownedEntry(userId: number, id: number) {
  const entry = await prisma.journalEntry.findFirst({ where: { id, userId } });
  if (!entry) throw notFound("Journal entry not found");
  return entry;
}

export async function listEntries(userId: number, limit: number, offset: number) {
  const entries = await prisma.journalEntry.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    skip: offset,
  });
  return entries.map(serializeJournal);
}

export async function createEntry(userId: number, input: JournalCreate) {
  const entry = await prisma.journalEntry.create({
    data: { userId, title: input.title, content: input.content, mood: input.mood ?? null },
  });
  return serializeJournal(entry);
}

export async function getEntry(userId: number, id: number) {
  return serializeJournal(await ownedEntry(userId, id));
}

export async function updateEntry(userId: number, id: number, input: JournalUpdate) {
  await ownedEntry(userId, id);
  const mood = input.clear_mood ? null : (input.mood ?? undefined);
  const entry = await prisma.journalEntry.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.content !== undefined && { content: input.content }),
      ...(mood !== undefined && { mood }),
    },
  });
  return serializeJournal(entry);
}

export async function deleteEntry(userId: number, id: number) {
  await ownedEntry(userId, id);
  await prisma.journalEntry.delete({ where: { id } });
}
