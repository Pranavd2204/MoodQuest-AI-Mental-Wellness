import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppRoutes } from "@/App";
import { tokenStorage } from "@/lib/api";
import { authService } from "@/services/authService";
import { chatService } from "@/services/chatService";
import { moodService } from "@/services/moodService";

import { emptyStats, renderWithProviders, testUser } from "./utils";

vi.mock("@/services/authService", () => ({
  authService: { login: vi.fn(), register: vi.fn(), logout: vi.fn(), me: vi.fn() },
}));
vi.mock("@/services/moodService", () => ({
  moodService: { getMoodStats: vi.fn(), logMood: vi.fn(), getProgressSummary: vi.fn(), getMoods: vi.fn() },
}));
vi.mock("@/services/chatService", () => ({
  chatService: {
    listConversations: vi.fn(),
    createConversation: vi.fn(),
    getConversation: vi.fn(),
    sendMessage: vi.fn(),
    deleteConversation: vi.fn(),
  },
}));

const greeting = {
  id: 9,
  title: "New conversation",
  created_at: "2026-10-02T08:00:00Z",
  updated_at: "2026-10-02T08:00:00Z",
  messages: [{ id: 1, conversation_id: 9, sender: "assistant" as const, content: "Hey Riya 👋\nHow are you feeling today?", created_at: "2026-10-02T08:00:00Z" }],
  suggestions: [],
};

function replyTo(content: string) {
  return {
    user_message: { id: 2, conversation_id: 9, sender: "user" as const, content, created_at: "2026-10-02T08:01:00Z" },
    assistant_message: { id: 3, conversation_id: 9, sender: "assistant" as const, content: "Thanks for telling me.", created_at: "2026-10-02T08:01:01Z" },
    suggestions: ["Talk about it"],
  };
}

class FakeRecognition {
  static last: FakeRecognition | null = null;
  lang = "";
  continuous = false;
  interimResults = false;
  onstart: (() => void) | null = null;
  onresult: ((event: { results: unknown }) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  constructor() {
    FakeRecognition.last = this;
  }
  start() {
    this.onstart?.();
  }
  stop() {
    this.onend?.();
  }
  abort() {
    this.onend?.();
  }
  say(...parts: string[]) {
    this.onresult?.({ results: parts.map((text, i) => ({ isFinal: i < parts.length - 1, 0: { transcript: text } })) });
  }
}

const speechWindow = window as unknown as {
  webkitSpeechRecognition?: unknown;
  speechSynthesis?: unknown;
  SpeechSynthesisUtterance?: unknown;
};

function installSpeechSynthesis() {
  const synth = { speak: vi.fn(), cancel: vi.fn() };
  class Utterance {
    text: string;
    lang = "";
    rate = 1;
    constructor(text: string) {
      this.text = text;
    }
  }
  speechWindow.speechSynthesis = synth;
  speechWindow.SpeechSynthesisUtterance = Utterance;
  return synth;
}

async function renderHome() {
  renderWithProviders(<AppRoutes />, { route: "/" });
  return screen.findByRole("heading", { name: "Need to talk or unwind?" });
}

describe("Home page: Chat with AI", () => {
  beforeEach(() => {
    tokenStorage.set("token");
    vi.mocked(authService.me).mockResolvedValue(testUser);
    vi.mocked(moodService.getMoodStats).mockResolvedValue(emptyStats());
    vi.mocked(chatService.listConversations).mockResolvedValue([]);
    vi.mocked(chatService.createConversation).mockResolvedValue(greeting);
    vi.mocked(chatService.sendMessage).mockImplementation(async (_id, content) => replyTo(content));
  });
  afterEach(() => {
    delete speechWindow.webkitSpeechRecognition;
    delete speechWindow.speechSynthesis;
    delete speechWindow.SpeechSynthesisUtterance;
    FakeRecognition.last = null;
  });

  it("starts a conversation and shows the backend's reply", async () => {
    const user = userEvent.setup();
    await renderHome();
    expect(await screen.findByText("Start a conversation with your AI companion.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(screen.getByText("Type or say a message first.")).toBeInTheDocument();
    expect(chatService.sendMessage).not.toHaveBeenCalled();

    await user.type(screen.getByRole("textbox", { name: "Message" }), "Exams are stressing me{Enter}");
    await waitFor(() => expect(chatService.sendMessage).toHaveBeenCalledWith(9, "Exams are stressing me"));
    expect(chatService.createConversation).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Thanks for telling me.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open chat/ })).toHaveAttribute("href", "/chat?c=9");
  });

  it("continues the most recent saved conversation", async () => {
    vi.mocked(chatService.listConversations).mockResolvedValue([
      { id: 9, title: "Exams", created_at: greeting.created_at, updated_at: greeting.updated_at, message_count: 1, last_message: "Hey" },
    ]);
    vi.mocked(chatService.getConversation).mockResolvedValue(greeting);
    await renderHome();
    const card = await screen.findByRole("region", { name: "Need to talk or unwind?" });
    expect(await within(card).findByText(/How are you feeling today\?/)).toBeInTheDocument();
    expect(chatService.getConversation).toHaveBeenCalledWith(9);
  });

  it("shows speech live in the input and sends it when the user stops", async () => {
    speechWindow.webkitSpeechRecognition = FakeRecognition;
    const user = userEvent.setup();
    await renderHome();
    await screen.findByText("Start a conversation with your AI companion.");
    const input = screen.getByRole("textbox", { name: "Message" });

    await user.click(screen.getByRole("button", { name: "Start voice input" }));
    expect(screen.getByText(/Listening…/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stop and send voice message" })).toHaveAttribute("aria-pressed", "true");

    act(() => FakeRecognition.last!.say("I feel ", "a bit anxious"));
    expect(input).toHaveValue("I feel a bit anxious");

    await user.click(screen.getByRole("button", { name: "Stop and send voice message" }));
    await waitFor(() => expect(chatService.sendMessage).toHaveBeenCalledWith(9, "I feel a bit anxious"));
    expect(chatService.sendMessage).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Thanks for telling me.")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("sends automatically after a pause in speech, keeping any typed text", async () => {
    speechWindow.webkitSpeechRecognition = FakeRecognition;
    const user = userEvent.setup();
    await renderHome();
    await screen.findByText("Start a conversation with your AI companion.");

    await user.type(screen.getByRole("textbox", { name: "Message" }), "Hi");
    await user.click(screen.getByRole("button", { name: "Start voice input" }));
    act(() => FakeRecognition.last!.say("I had a long day"));
    await waitFor(() => expect(chatService.sendMessage).toHaveBeenCalledWith(9, "Hi I had a long day"), { timeout: 4000 });
  });

  it("pressing Send while listening sends once", async () => {
    speechWindow.webkitSpeechRecognition = FakeRecognition;
    const user = userEvent.setup();
    await renderHome();
    await screen.findByText("Start a conversation with your AI companion.");
    await user.click(screen.getByRole("button", { name: "Start voice input" }));
    act(() => FakeRecognition.last!.say("hello"));
    await user.click(screen.getByRole("button", { name: "Send message" }));
    await waitFor(() => expect(chatService.sendMessage).toHaveBeenCalledWith(9, "hello"));
    expect(chatService.sendMessage).toHaveBeenCalledTimes(1);
  });

  it("explains when the browser has no speech recognition", async () => {
    const user = userEvent.setup();
    await renderHome();
    await user.click(screen.getByRole("button", { name: "Start voice input" }));
    expect(screen.getByText(/Voice input isn't supported in this browser/)).toBeInTheDocument();
  });

  it("explains a blocked microphone", async () => {
    speechWindow.webkitSpeechRecognition = FakeRecognition;
    const user = userEvent.setup();
    await renderHome();
    await user.click(screen.getByRole("button", { name: "Start voice input" }));
    act(() => {
      FakeRecognition.last!.onerror?.({ error: "not-allowed" });
      FakeRecognition.last!.onend?.();
    });
    expect(screen.getByText(/Microphone access was blocked/)).toBeInTheDocument();
    expect(chatService.sendMessage).not.toHaveBeenCalled();
  });

  it("speaks the assistant's reply and can be muted", async () => {
    const synth = installSpeechSynthesis();
    const user = userEvent.setup();
    await renderHome();
    await screen.findByText("Start a conversation with your AI companion.");
    const input = screen.getByRole("textbox", { name: "Message" });

    await user.type(input, "Hello{Enter}");
    await screen.findByText("Thanks for telling me.");
    expect(synth.speak).toHaveBeenCalledTimes(1);
    expect(synth.speak.mock.calls[0][0].text).toBe("Thanks for telling me.");

    await user.click(screen.getByRole("button", { name: "Turn off spoken replies" }));
    expect(localStorage.getItem("moodquest.voiceReplies")).toBe("off");
    await user.type(input, "Again{Enter}");
    await waitFor(() => expect(chatService.sendMessage).toHaveBeenCalledTimes(2));
    expect(synth.speak).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Turn on spoken replies" })).toBeInTheDocument();
  });

  it("stops a spoken reply when the user starts talking", async () => {
    const synth = installSpeechSynthesis();
    speechWindow.webkitSpeechRecognition = FakeRecognition;
    const user = userEvent.setup();
    await renderHome();
    await screen.findByText("Start a conversation with your AI companion.");
    synth.cancel.mockClear();
    await user.click(screen.getByRole("button", { name: "Start voice input" }));
    expect(synth.cancel).toHaveBeenCalled();
  });
});
