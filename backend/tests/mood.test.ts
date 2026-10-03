import { describe, expect, it } from "vitest";

import { MOOD_SCORES } from "../src/utils/moods.ts";
import { addMood, api, register, useFreshDatabase } from "./helpers.ts";

useFreshDatabase();

const stats = async (headers: Record<string, string>, days = 7) => (await api().get(`/api/mood/stats?days=${days}`).set(headers)).body;

describe("mood", () => {
  it("creates and lists moods (newest first)", async () => {
    const account = await register();
    const res = await api().post("/api/mood").set(account.headers).send({ mood: "calm" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ mood: "calm", score: MOOD_SCORES.calm, source: "manual" });

    await api().post("/api/mood").set(account.headers).send({ mood: "happy", note: "Good day" });
    const moods = (await api().get("/api/mood").set(account.headers)).body;
    expect(moods.map((m: { mood: string }) => m.mood)).toEqual(["happy", "calm"]);
    expect(moods[0].note).toBe("Good day");
  });

  it("rejects invalid moods", async () => {
    const account = await register();
    expect((await api().post("/api/mood").set(account.headers).send({ mood: "ecstatic" })).status).toBe(422);
    expect((await api().post("/api/mood").set(account.headers).send({})).status).toBe(422);
  });

  it("keeps moods private", async () => {
    const alice = await register();
    const bob = await register();
    await api().post("/api/mood").set(alice.headers).send({ mood: "sad" });
    expect((await api().get("/api/mood").set(bob.headers)).body).toEqual([]);
    expect((await stats(bob.headers)).latest).toBeNull();
  });

  it("returns an honest empty state", async () => {
    const account = await register();
    const s = await stats(account.headers);
    expect(s.latest).toBeNull();
    expect(s.today_logged).toBe(false);
    expect(s.total_checkins).toBe(0);
    expect(s.has_enough_data).toBe(false);
    expect(s.insight).toBeNull();
    expect(s.streak).toEqual({ current: 0, longest: 0, active_today: false });
    expect(s.trend).toHaveLength(7);
    expect(s.trend.every((p: { average_score: number | null }) => p.average_score === null)).toBe(true);
    expect(s.distribution.every((d: { count: number }) => d.count === 0)).toBe(true);
  });

  it("computes trend, distribution, streak and insight from real data", async () => {
    const account = await register();
    await addMood(account.user.id, "sad", 2);
    await addMood(account.user.id, "calm", 1);
    await api().post("/api/mood").set(account.headers).send({ mood: "happy" });
    await api().post("/api/mood").set(account.headers).send({ mood: "happy" });

    const s = await stats(account.headers);
    expect(s.latest.mood).toBe("happy");
    expect(s.today_logged).toBe(true);
    expect(s.total_checkins).toBe(4);
    expect(s.days_with_data).toBe(3);
    expect(s.has_enough_data).toBe(true);
    expect(s.trend.at(-1)).toMatchObject({ average_score: 5, dominant_mood: "happy" });
    const happy = s.distribution.find((d: { mood: string }) => d.mood === "happy");
    expect(happy).toMatchObject({ count: 2, percentage: 50 });
    expect(s.streak.current).toBe(3);
    expect(s.insight.kind).toBe("dominant");
  });

  it("reports improvement against the previous period", async () => {
    const account = await register();
    await addMood(account.user.id, "sad", 10);
    await addMood(account.user.id, "calm", 1);
    const s = await stats(account.headers);
    expect(s.insight.kind).toBe("improved");
    expect(s.insight.change_percent).toBe(300);
  });

  it("counts consecutive days for the streak", async () => {
    const account = await register();
    for (const daysAgo of [1, 2, 3, 6, 7]) await addMood(account.user.id, "calm", daysAgo);
    expect((await stats(account.headers)).streak).toEqual({ current: 3, longest: 3, active_today: false });

    await api().post("/api/mood").set(account.headers).send({ mood: "happy" });
    expect((await stats(account.headers)).streak).toEqual({ current: 4, longest: 4, active_today: true });
  });

  it("breaks the streak after a missed day", async () => {
    const account = await register();
    await addMood(account.user.id, "calm", 3);
    const s = await stats(account.headers);
    expect(s.streak.current).toBe(0);
    expect(s.streak.longest).toBe(1);
  });

  it("validates the days range", async () => {
    const account = await register();
    expect((await api().get("/api/mood/stats?days=0").set(account.headers)).status).toBe(422);
    expect((await stats(account.headers, 30)).trend).toHaveLength(30);
  });
});
