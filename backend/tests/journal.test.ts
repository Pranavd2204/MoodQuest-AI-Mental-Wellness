import { describe, expect, it } from "vitest";

import { api, register, useFreshDatabase } from "./helpers.ts";

useFreshDatabase();

describe("journal", () => {
  it("supports full CRUD", async () => {
    const { headers } = await register();
    expect((await api().get("/api/journal").set(headers)).body).toEqual([]);

    const created = await api()
      .post("/api/journal")
      .set(headers)
      .send({ title: "  First entry ", content: "Today was okay.", mood: "calm" });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ title: "First entry", mood: "calm" });
    const id = created.body.id;

    const fetched = await api().get(`/api/journal/${id}`).set(headers);
    expect(fetched.status).toBe(200);
    expect(fetched.body.content).toBe("Today was okay.");

    const updated = await api().put(`/api/journal/${id}`).set(headers).send({ content: "Actually, it was great!", mood: "happy" });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({ content: "Actually, it was great!", mood: "happy", title: "First entry" });

    const cleared = await api().put(`/api/journal/${id}`).set(headers).send({ clear_mood: true });
    expect(cleared.body.mood).toBeNull();

    expect((await api().get("/api/journal").set(headers)).body).toHaveLength(1);
    expect((await api().delete(`/api/journal/${id}`).set(headers)).status).toBe(204);
    expect((await api().get(`/api/journal/${id}`).set(headers)).status).toBe(404);
    expect((await api().get("/api/journal").set(headers)).body).toEqual([]);
  });

  it("validates input", async () => {
    const { headers } = await register();
    const post = (body: object) => api().post("/api/journal").set(headers).send(body);
    expect((await post({ title: "", content: "x" })).status).toBe(422);
    expect((await post({ title: "x", content: "   " })).status).toBe(422);
    expect((await post({ title: "x", content: "y", mood: "meh" })).status).toBe(422);
  });

  it("enforces ownership", async () => {
    const alice = await register();
    const bob = await register();
    const entry = (await api().post("/api/journal").set(alice.headers).send({ title: "Private", content: "Secret" })).body;
    const url = `/api/journal/${entry.id}`;
    expect((await api().get(url).set(bob.headers)).status).toBe(404);
    expect((await api().put(url).set(bob.headers).send({ title: "Hacked" })).status).toBe(404);
    expect((await api().delete(url).set(bob.headers)).status).toBe(404);
    expect((await api().get("/api/journal").set(bob.headers)).body).toEqual([]);
    expect((await api().get(url).set(alice.headers)).body.title).toBe("Private");
  });
});
