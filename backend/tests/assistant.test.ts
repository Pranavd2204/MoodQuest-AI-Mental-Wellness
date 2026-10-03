import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Message } from "../src/generated/prisma/client.ts";
import { GroqAssistant, getAssistantProvider } from "../src/services/assistant.service.ts";

const KEY = "gsk_test_key_not_real";
const history = [
  { id: 1, conversationId: 1, sender: "assistant", content: "Hey Riya", createdAt: new Date() },
  { id: 2, conversationId: 1, sender: "user", content: "Hi", createdAt: new Date() },
] as Message[];

const groqOk = (content: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });

describe("GroqAssistant", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends the conversation to Groq and returns the model's reply", async () => {
    fetchMock.mockResolvedValue(groqOk("  That sounds heavy. What part weighs on you most?  "));
    const assistant = new GroqAssistant(KEY, "test-model");

    const reply = await assistant.reply({ userName: "Riya Kapoor", history, message: "I am so stressed about exams" });

    expect(reply.content).toBe("That sounds heavy. What part weighs on you most?");
    expect(reply.suggestions).toContain("Try a breathing exercise");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(init.headers.Authorization).toBe(`Bearer ${KEY}`);
    const body = JSON.parse(init.body);
    expect(body.model).toBe("test-model");
    expect(body.messages[0]).toMatchObject({ role: "system" });
    expect(body.messages[0].content).toContain("Riya");
    expect(body.messages.slice(1)).toEqual([
      { role: "assistant", content: "Hey Riya" },
      { role: "user", content: "Hi" },
      { role: "user", content: "I am so stressed about exams" },
    ]);
  });

  it("never sends explicit self-harm messages to the model", async () => {
    const reply = await new GroqAssistant(KEY, "m").reply({ userName: "A", history, message: "I want to end my life" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(reply.content).toContain("14416");
    expect(reply.suggestions).toContain("Open emergency help");
  });

  it("falls back to the built-in replies when Groq errors, without leaking the key", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: { message: "Invalid API Key" } }), { status: 401 }));
    const reply = await new GroqAssistant(KEY, "m").reply({ userName: "A", history, message: "I feel anxious" });
    expect(reply.content).toBeTruthy();
    expect(reply.content).toMatch(/Anxiety|anxious/i);
    const logged = JSON.stringify(vi.mocked(console.warn).mock.calls);
    expect(logged).toContain("401");
    expect(logged).not.toContain(KEY);
  });

  it("falls back on network failure and on empty replies", async () => {
    const assistant = new GroqAssistant(KEY, "m");
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    expect((await assistant.reply({ userName: "A", history, message: "hello" })).content).toBeTruthy();

    fetchMock.mockResolvedValueOnce(groqOk("   "));
    expect((await assistant.reply({ userName: "A", history, message: "hello" })).content).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("uses the built-in replies by default (no key configured)", () => {
    expect(getAssistantProvider().name).toBe("rule_based");
  });
});
