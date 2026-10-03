import { describe, expect, it } from "vitest";

import { api, register, useFreshDatabase } from "./helpers.ts";

useFreshDatabase();

type Item = { title: string; type: string; moods: string[]; external_url: string };

describe("recommendations", () => {
  it("returns a For You music feed without a mood", async () => {
    const { headers } = await register();
    const feed = (await api().get("/api/recommendations/music").set(headers)).body;
    expect(feed.category).toBe("for_you");
    expect(feed.mood_context).toBeNull();
    expect(feed.featured.title).toBe("Lo-Fi Chill");
    expect(feed.items.length).toBeGreaterThanOrEqual(4);
    expect(feed.items.every((i: Item) => i.type === "music")).toBe(true);
  });

  it("personalises For You by the latest mood", async () => {
    const { headers } = await register();
    await api().post("/api/mood").set(headers).send({ mood: "sad" });
    const feed = (await api().get("/api/recommendations/music?category=for_you").set(headers)).body;
    expect(feed.mood_context).toBe("sad");
    expect([feed.featured, ...feed.items].every((i: Item) => i.moods.includes("sad"))).toBe(true);
  });

  it("filters music and movie categories", async () => {
    const { headers } = await register();
    const focus = (await api().get("/api/recommendations/music?category=focus").set(headers)).body;
    expect([focus.featured, ...focus.items].map((i: Item) => i.title)).toContain("Lo-Fi Beats");
    const comedy = (await api().get("/api/recommendations/movies?category=comedy").set(headers)).body;
    const titles = [comedy.featured, ...comedy.items].map((i: Item) => i.title);
    expect(titles).toEqual(expect.arrayContaining(["3 Idiots", "School of Rock"]));
    expect((await api().get("/api/recommendations/movies?category=horror").set(headers)).status).toBe(422);
  });

  it("supports search and plain listing", async () => {
    const { headers } = await register();
    const result = (await api().get("/api/recommendations/movies?q=soul").set(headers)).body;
    expect(result.featured.title).toBe("Soul");
    const everything = (await api().get("/api/recommendations").set(headers)).body;
    expect(new Set(everything.map((i: Item) => i.type))).toEqual(new Set(["music", "movie"]));
    const movies = (await api().get("/api/recommendations?type=movie").set(headers)).body;
    expect(movies.every((i: Item) => i.type === "movie" && i.external_url.startsWith("https://"))).toBe(true);
  });

  it("ranks every exercise, mood matches first", async () => {
    const { headers } = await register();
    await api().post("/api/mood").set(headers).send({ mood: "anxious" });
    const feed = (await api().get("/api/recommendations/exercises").set(headers)).body;
    expect(feed.mood_context).toBe("anxious");
    const matches = feed.items.map((i: Item) => i.moods.includes("anxious"));
    expect(feed.items).toHaveLength((await api().get("/api/activities").set(headers)).body.length);
    expect(matches[0]).toBe(true);
    expect(matches).toEqual([...matches].sort((a, b) => Number(b) - Number(a)));
  });
});

describe("emotion, emergency, health, CORS", () => {
  it("reports that YOLO11n is unavailable when the Python service is stopped", async () => {
    const { headers } = await register();
    const status = (await api().get("/api/emotion/status").set(headers)).body;
    expect(status).toMatchObject({ available: false });

    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x01]);
    const res = await api().post("/api/emotion/analyze").set(headers).attach("image", jpeg, { filename: "frame.jpg", contentType: "image/jpeg" });
    expect(res.status).toBe(503);
    expect(res.body.detail).toContain("YOLO11n service could not analyze this frame");

    const text = await api().post("/api/emotion/analyze").set(headers).attach("image", Buffer.from("hello"), { filename: "notes.txt", contentType: "text/plain" });
    expect(text.status).toBe(415);
    expect((await api().post("/api/emotion/analyze").attach("image", jpeg, { filename: "frame.jpg", contentType: "image/jpeg" })).status).toBe(401);
  });

  it("serves emergency resources publicly", async () => {
    const res = await api().get("/api/emergency/resources");
    expect(res.status).toBe(200);
    expect(res.body.emergency_number).toBeTruthy();
    expect(res.body.helplines[0].number).toBeTruthy();
  });

  it("reports health", async () => {
    const res = await api().get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", database: "ok" });
  });

  it("allows only the configured frontend origin", async () => {
    const ok = await api().options("/api/auth/login").set("Origin", "http://localhost:5173").set("Access-Control-Request-Method", "POST");
    expect(ok.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    const blocked = await api().options("/api/auth/login").set("Origin", "http://evil.example").set("Access-Control-Request-Method", "POST");
    expect(blocked.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("returns JSON errors, never stack traces", async () => {
    expect((await api().get("/api/does-not-exist")).body).toEqual({ detail: "Not found" });
    const malformed = await api().post("/api/auth/login").set("Content-Type", "application/json").send("{bad json");
    expect(malformed.status).toBe(400);
    expect(malformed.body).toEqual({ detail: "Request body is not valid JSON" });
  });
});
