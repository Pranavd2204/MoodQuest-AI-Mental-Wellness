import request from "supertest";
import { afterAll, beforeEach } from "vitest";

import { createApp } from "../src/app.ts";
import { prisma } from "../src/lib/prisma.ts";
import { seedCatalog } from "../src/services/catalog.service.ts";
import { MOOD_SCORES, type Mood } from "../src/utils/moods.ts";

export const app = createApp();
export const api = () => request(app);
export { prisma };

const TABLES = [
  "messages",
  "conversations",
  "mood_logs",
  "game_sessions",
  "activity_completions",
  "journal_entries",
  "emergency_contacts",
  "recommendations",
  "user_profiles",
  "revoked_tokens",
  "users",
  "games",
  "activities",
];

export function useFreshDatabase() {
  beforeEach(async () => {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${TABLES.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`);
    await seedCatalog(prisma);
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });
}

let counter = 0;

export interface Account {
  user: { id: number; name: string; email: string };
  token: string;
  headers: { Authorization: string };
  email: string;
  password: string;
}

export async function register(
  options: { name?: string; email?: string; password?: string } = {},
): Promise<Account> {
  counter += 1;
  const email = options.email ?? `user${counter}@example.com`;
  const password = options.password ?? "Secret123";
  const response = await api()
    .post("/api/auth/register")
    .send({ name: options.name ?? "Test User", email, password, timezone: "Asia/Kolkata" });
  if (response.status !== 201) throw new Error(`register failed: ${response.status} ${JSON.stringify(response.body)}`);
  const token = response.body.access_token as string;
  return { user: response.body.user, token, headers: { Authorization: `Bearer ${token}` }, email, password };
}

export async function addMood(userId: number, mood: Mood, daysAgo: number) {
  await prisma.moodLog.create({
    data: {
      userId,
      mood,
      score: MOOD_SCORES[mood],
      source: "manual",
      createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
    },
  });
}

export async function gameId(account: Account, slug: string): Promise<number> {
  const games = (await api().get("/api/games").set(account.headers)).body as { id: number; slug: string }[];
  return games.find((g) => g.slug === slug)!.id;
}
