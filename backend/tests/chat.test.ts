import { describe, expect, it } from "vitest";

import { api, register, useFreshDatabase, type Account } from "./helpers.ts";

useFreshDatabase();

async function newConversation(account: Account) {
  const res = await api().post("/api/chat/conversations").set(account.headers).send({});
  expect(res.status).toBe(201);
  return res.body;
}

describe("chat", () => {
  it("creates a conversation with a personal greeting", async () => {
    const account = await register({ name: "Meera Shah" });
    const conversation = await newConversation(account);
    expect(conversation.title).toBe("New conversation");
    expect(conversation.messages).toHaveLength(1);
    expect(conversation.messages[0].sender).toBe("assistant");
    expect(conversation.messages[0].content).toContain("Meera");
    expect(conversation.suggestions.length).toBeGreaterThan(0);
  });

  it("persists both sides of the conversation", async () => {
    const account = await register();
    const conversation = await newConversation(account);
    const res = await api()
      .post(`/api/chat/conversations/${conversation.id}/messages`)
      .set(account.headers)
      .send({ content: "I'm feeling a bit stressed about my college and future." });
    expect(res.status).toBe(201);
    expect(res.body.user_message.sender).toBe("user");
    expect(res.body.assistant_message.sender).toBe("assistant");
    expect(res.body.assistant_message.content).toBeTruthy();
    expect(res.body.suggestions.length).toBeGreaterThan(0);

    const detail = (await api().get(`/api/chat/conversations/${conversation.id}`).set(account.headers)).body;
    expect(detail.messages.map((m: { sender: string }) => m.sender)).toEqual(["assistant", "user", "assistant"]);
    expect(detail.title.startsWith("I'm feeling a bit stressed")).toBe(true);

    const summaries = (await api().get("/api/chat/conversations").set(account.headers)).body;
    expect(summaries[0]).toMatchObject({
      id: conversation.id,
      message_count: 3,
      last_message: res.body.assistant_message.content,
    });
  });

  it("rejects empty and over-long messages", async () => {
    const account = await register();
    const conversation = await newConversation(account);
    const url = `/api/chat/conversations/${conversation.id}/messages`;
    expect((await api().post(url).set(account.headers).send({ content: "   " })).status).toBe(422);
    expect((await api().post(url).set(account.headers).send({ content: "x".repeat(2001) })).status).toBe(422);
  });

  it("points to the helpline for explicit self-harm messages", async () => {
    const account = await register();
    const conversation = await newConversation(account);
    const res = await api()
      .post(`/api/chat/conversations/${conversation.id}/messages`)
      .set(account.headers)
      .send({ content: "I want to end my life" });
    expect(res.body.assistant_message.content).toContain("14416");
    expect(res.body.suggestions).toContain("Open emergency help");
  });

  it("keeps conversations private", async () => {
    const alice = await register();
    const bob = await register();
    const conversation = await newConversation(alice);
    const url = `/api/chat/conversations/${conversation.id}`;
    expect((await api().get(url).set(bob.headers)).status).toBe(404);
    expect((await api().post(`${url}/messages`).set(bob.headers).send({ content: "hi" })).status).toBe(404);
    expect((await api().delete(url).set(bob.headers)).status).toBe(404);
    expect((await api().get("/api/chat/conversations").set(bob.headers)).body).toEqual([]);
  });

  it("deletes a conversation", async () => {
    const account = await register();
    const conversation = await newConversation(account);
    const url = `/api/chat/conversations/${conversation.id}`;
    expect((await api().delete(url).set(account.headers)).status).toBe(204);
    expect((await api().get(url).set(account.headers)).status).toBe(404);
  });
});
