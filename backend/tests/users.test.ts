import { describe, expect, it } from "vitest";

import { api, register, useFreshDatabase } from "./helpers.ts";

useFreshDatabase();

describe("users", () => {
  it("returns the default profile", async () => {
    const account = await register();
    const res = await api().get("/api/users/profile").set(account.headers);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(account.email);
    expect(res.body.timezone).toBe("Asia/Kolkata");
    expect(res.body.preferred_language).toBe("en");
    expect(res.body.notification_preferences.daily_reminder).toBe(true);
  });

  it("updates and persists the profile", async () => {
    const account = await register();
    const res = await api()
      .put("/api/users/profile")
      .set(account.headers)
      .send({
        name: "New Name",
        avatar_url: "https://example.com/me.png",
        timezone: "Europe/London",
        preferred_language: "hi",
        notification_preferences: { daily_reminder: false, weekly_report: true, game_reminders: true },
      });
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe("New Name");
    expect(res.body.user.avatar_url).toBe("https://example.com/me.png");
    expect(res.body.timezone).toBe("Europe/London");
    expect(res.body.notification_preferences).toEqual({ daily_reminder: false, weekly_report: true, game_reminders: true });

    const again = await api().get("/api/users/profile").set(account.headers);
    expect(again.body.preferred_language).toBe("hi");
    expect((await api().get("/api/auth/me").set(account.headers)).body.name).toBe("New Name");
  });

  it("rejects invalid profile input", async () => {
    const account = await register();
    const put = (body: object) => api().put("/api/users/profile").set(account.headers).send(body);
    expect((await put({ timezone: "Mars/Base" })).status).toBe(422);
    expect((await put({ avatar_url: "not a url" })).status).toBe(422);
    expect((await put({ name: "   " })).status).toBe(422);
  });

  it("changes the password", async () => {
    const account = await register();
    const wrong = await api()
      .put("/api/users/password")
      .set(account.headers)
      .send({ current_password: "Nope12345", new_password: "Another123" });
    expect(wrong.status).toBe(400);
    const ok = await api()
      .put("/api/users/password")
      .set(account.headers)
      .send({ current_password: account.password, new_password: "Another123" });
    expect(ok.status).toBe(200);
    expect((await api().post("/api/auth/login").send({ email: account.email, password: "Another123" })).status).toBe(200);
    expect((await api().post("/api/auth/login").send({ email: account.email, password: account.password })).status).toBe(401);
  });

  it("manages emergency contacts with a single primary", async () => {
    const account = await register();
    const url = "/api/users/emergency-contacts";
    const first = await api().post(url).set(account.headers).send({ name: "Mom", phone: "+91 98765 43210" });
    expect(first.status).toBe(201);
    expect(first.body.is_primary).toBe(true);

    const second = (
      await api()
        .post(url)
        .set(account.headers)
        .send({ name: "Dad", phone: "9876500000", relationship: "Father", is_primary: true })
    ).body;
    const contacts = (await api().get(url).set(account.headers)).body as { name: string; is_primary: boolean }[];
    expect(contacts.map((c) => c.name)).toEqual(["Dad", "Mom"]);
    expect(contacts.filter((c) => c.is_primary)).toHaveLength(1);

    expect((await api().post(url).set(account.headers).send({ name: "X", phone: "call me" })).status).toBe(422);

    const other = await register();
    expect((await api().delete(`${url}/${second.id}`).set(other.headers)).status).toBe(404);

    expect((await api().delete(`${url}/${second.id}`).set(account.headers)).status).toBe(204);
    const remaining = (await api().get(url).set(account.headers)).body;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].is_primary).toBe(true);
  });
});
