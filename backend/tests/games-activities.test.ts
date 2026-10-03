import { describe, expect, it } from "vitest";

import { api, gameId, register, useFreshDatabase } from "./helpers.ts";

useFreshDatabase();

describe("games", () => {
  it("lists all games and filters by category", async () => {
    const account = await register();
    const games = (await api().get("/api/games").set(account.headers)).body;
    expect(new Set(games.map((g: { name: string }) => g.name))).toEqual(
      new Set(["Breathing Flow", "Color Match", "Memory Challenge", "Zen Garden", "Stress Burst", "Puzzle Mind"]),
    );
    expect(games.every((g: { times_played: number; best_score: null }) => g.times_played === 0 && g.best_score === null)).toBe(true);

    const breathing = (await api().get("/api/games?category=breathing").set(account.headers)).body;
    expect(breathing.map((g: { slug: string }) => g.slug)).toEqual(["breathing-flow"]);
    const focus = new Set((await api().get("/api/games?category=focus").set(account.headers)).body.map((g: { slug: string }) => g.slug));
    for (const slug of ["memory-challenge", "puzzle-mind", "color-match"]) expect(focus.has(slug)).toBe(true);
  });

  it("saves sessions and reports history and best score", async () => {
    const account = await register();
    expect((await api().get("/api/games/history").set(account.headers)).body).toEqual([]);
    const id = await gameId(account, "memory-challenge");

    const first = await api().post(`/api/games/${id}/sessions`).set(account.headers).send({ score: 80, duration: 95 });
    expect(first.status).toBe(201);
    expect(first.body.game_name).toBe("Memory Challenge");
    await api().post(`/api/games/${id}/sessions`).set(account.headers).send({ score: 120, duration: 70 });

    const history = (await api().get("/api/games/history").set(account.headers)).body;
    expect(history.map((s: { score: number }) => s.score)).toEqual([120, 80]);
    const game = (await api().get(`/api/games/${id}`).set(account.headers)).body;
    expect(game).toMatchObject({ times_played: 2, best_score: 120 });
  });

  it("validates sessions", async () => {
    const account = await register();
    const id = await gameId(account, "stress-burst");
    const post = (path: string, body: object) => api().post(path).set(account.headers).send(body);
    expect((await post(`/api/games/${id}/sessions`, { score: -1, duration: 10 })).status).toBe(422);
    expect((await post(`/api/games/${id}/sessions`, { score: 1, duration: 0 })).status).toBe(422);
    expect((await post("/api/games/9999/sessions", { score: 1, duration: 10 })).status).toBe(404);
  });

  it("keeps game history private", async () => {
    const alice = await register();
    const bob = await register();
    const id = await gameId(alice, "stress-burst");
    await api().post(`/api/games/${id}/sessions`).set(alice.headers).send({ score: 10, duration: 30 });
    expect((await api().get("/api/games/history").set(bob.headers)).body).toEqual([]);
    expect((await api().get(`/api/games/${id}`).set(bob.headers)).body.times_played).toBe(0);
  });
});

describe("activities and progress", () => {
  it("lists activities, completes one and persists it", async () => {
    const { headers } = await register();
    const activities = (await api().get("/api/activities").set(headers)).body;
    expect(activities[0].title).toBe("5 Min Breathing Exercise");
    const totalSeconds = activities[0].steps.reduce((sum: number, s: { seconds: number }) => sum + s.seconds, 0);
    expect(totalSeconds).toBeGreaterThan(200);

    const yoga = (await api().get("/api/activities?category=yoga").set(headers)).body;
    expect(yoga.length).toBeGreaterThan(0);
    expect(yoga.every((a: { category: string }) => a.category === "yoga")).toBe(true);

    const id = activities[0].id;
    const done = await api().post(`/api/activities/${id}/complete`).set(headers);
    expect(done.status).toBe(201);
    expect(done.body.activity_title).toBe("5 Min Breathing Exercise");

    const refreshed = (await api().get(`/api/activities/${id}`).set(headers)).body;
    expect(refreshed.completed_count).toBe(1);
    expect(refreshed.last_completed_at).not.toBeNull();
    expect((await api().get("/api/activities/completions").set(headers)).body).toHaveLength(1);
    expect((await api().post("/api/activities/9999/complete").set(headers)).status).toBe(404);
  });

  it("summarises every kind of activity", async () => {
    const account = await register();
    const { headers } = account;
    await api().post("/api/mood").set(headers).send({ mood: "calm" });
    const id = await gameId(account, "breathing-flow");
    await api().post(`/api/games/${id}/sessions`).set(headers).send({ score: 5, duration: 60 });
    const activity = (await api().get("/api/activities").set(headers)).body[0];
    await api().post(`/api/activities/${activity.id}/complete`).set(headers);
    await api().post("/api/journal").set(headers).send({ title: "t", content: "c" });
    const conversation = (await api().post("/api/chat/conversations").set(headers).send({})).body;
    await api().post(`/api/chat/conversations/${conversation.id}/messages`).set(headers).send({ content: "hello" });

    const summary = (await api().get("/api/progress/summary?days=7").set(headers)).body;
    expect(summary.totals).toEqual({
      mood_checkins: 1,
      games_played: 1,
      activities_completed: 1,
      journal_entries: 1,
      chat_messages: 1,
      mindful_minutes: activity.duration,
    });
    expect(summary.daily.at(-1).total).toBe(5);
    expect(summary.streak.current).toBe(1);
    expect(summary.active_days).toHaveLength(1);
  });
});
