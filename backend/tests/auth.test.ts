import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";

import { createAccessToken } from "../src/services/token.service.ts";
import { api, prisma, register, useFreshDatabase } from "./helpers.ts";

useFreshDatabase();
const SECRET = "test-secret-test-secret-test-secret-123";

describe("auth", () => {
  it("registers and returns a token and the user", async () => {
    const res = await api()
      .post("/api/auth/register")
      .send({ name: "  Asha   Rao ", email: "Asha@Example.com", password: "Secret123" });
    expect(res.status).toBe(201);
    expect(res.body.token_type).toBe("bearer");
    expect(res.body.access_token).toBeTruthy();
    expect(res.body.user.name).toBe("Asha Rao");
    expect(res.body.user.email).toBe("asha@example.com");
    expect(JSON.stringify(res.body).toLowerCase()).not.toContain("password");
  });

  it("stores a bcrypt hash, never the password", async () => {
    await api().post("/api/auth/register").send({ name: "A", email: "a@example.com", password: "Secret123" });
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "a@example.com" } });
    expect(user.passwordHash).not.toBe("Secret123");
    expect(user.passwordHash.startsWith("$2")).toBe(true);
  });

  it("rejects a duplicate email with 409", async () => {
    await register({ email: "dup@example.com" });
    const res = await api().post("/api/auth/register").send({ name: "B", email: "DUP@example.com", password: "Secret123" });
    expect(res.status).toBe(409);
    expect(res.body.detail).toContain("already exists");
  });

  it("validates registration input", async () => {
    const post = (body: object) => api().post("/api/auth/register").send(body);
    expect((await post({ name: "A", email: "nope", password: "Secret123" })).status).toBe(422);
    expect((await post({ name: "A", email: "a@example.com", password: "abc1" })).status).toBe(422);
    const noDigit = await post({ name: "A", email: "a@example.com", password: "abcdefghij" });
    expect(noDigit.status).toBe(422);
    expect(noDigit.body.detail).toContain("letter and one number");
    expect((await post({ name: "   ", email: "a@example.com", password: "Secret123" })).status).toBe(422);
  });

  it("logs in with correct credentials only", async () => {
    const account = await register({ email: "login@example.com" });
    const ok = await api().post("/api/auth/login").send({ email: "LOGIN@example.com", password: account.password });
    expect(ok.status).toBe(200);
    expect(ok.body.user.email).toBe("login@example.com");

    const wrong = await api().post("/api/auth/login").send({ email: "login@example.com", password: "Wrong1234" });
    expect(wrong.status).toBe(401);
    expect(wrong.body.detail).toBe("Incorrect email or password");

    const unknown = await api().post("/api/auth/login").send({ email: "ghost@example.com", password: "Secret123" });
    expect(unknown.status).toBe(401);
  });

  it("requires a valid token for /me", async () => {
    const account = await register();
    expect((await api().get("/api/auth/me")).status).toBe(401);
    expect((await api().get("/api/auth/me").set("Authorization", "Bearer garbage")).status).toBe(401);
    const me = await api().get("/api/auth/me").set(account.headers);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe(account.email);
  });

  it("rejects expired tokens with a clear message", async () => {
    const account = await register();
    const token = jwt.sign({ type: "access", exp: Math.floor(Date.now() / 1000) - 60 }, SECRET, {
      subject: String(account.user.id),
      jwtid: "expired",
    });
    const res = await api().get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.detail.toLowerCase()).toContain("expired");
  });

  it("rejects tokens signed with another secret", async () => {
    const account = await register();
    const forged = jwt.sign({ type: "access" }, "some-other-secret-some-other-secret-1234", {
      subject: String(account.user.id),
      jwtid: "x",
      expiresIn: 300,
    });
    expect((await api().get("/api/auth/me").set("Authorization", `Bearer ${forged}`)).status).toBe(401);
  });

  it("revokes the token on logout", async () => {
    const account = await register();
    expect((await api().post("/api/auth/logout").set(account.headers)).status).toBe(200);
    const res = await api().get("/api/auth/me").set(account.headers);
    expect(res.status).toBe(401);
    expect(res.body.detail.toLowerCase()).toContain("logged out");
  });

  it("allows a new login after logout", async () => {
    const account = await register();
    await api().post("/api/auth/logout").set(account.headers);
    const login = await api().post("/api/auth/login").send({ email: account.email, password: account.password });
    expect((await api().get("/api/auth/me").set("Authorization", `Bearer ${login.body.access_token}`)).status).toBe(200);
  });

  it("rejects a token for a user that no longer exists", async () => {
    const { token } = createAccessToken(99999);
    expect((await api().get("/api/auth/me").set("Authorization", `Bearer ${token}`)).status).toBe(401);
  });

  it("protects every user-data route", async () => {
    const routes: [("get" | "post"), string][] = [
      ["get", "/api/users/profile"],
      ["get", "/api/mood"],
      ["post", "/api/mood"],
      ["get", "/api/mood/stats"],
      ["get", "/api/chat/conversations"],
      ["get", "/api/recommendations/music"],
      ["get", "/api/games"],
      ["get", "/api/games/history"],
      ["get", "/api/activities"],
      ["get", "/api/journal"],
      ["get", "/api/progress/summary"],
      ["get", "/api/emotion/status"],
    ];
    for (const [method, path] of routes) {
      expect((await api()[method](path)).status, path).toBe(401);
    }
  });
});
