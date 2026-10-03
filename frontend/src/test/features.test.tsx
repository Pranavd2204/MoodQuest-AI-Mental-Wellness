import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppRoutes } from "@/App";
import { getErrorMessage, NETWORK_ERROR_MESSAGE, tokenStorage } from "@/lib/api";
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

const conversation = {
  id: 7,
  title: "New conversation",
  created_at: "2026-10-01T08:00:00Z",
  updated_at: "2026-10-01T08:00:00Z",
  messages: [
    { id: 1, conversation_id: 7, sender: "assistant" as const, content: "Hey Riya 👋\nHow are you feeling today?", created_at: "2026-10-01T08:00:00Z" },
  ],
  suggestions: ["I want to relax", "Motivate me", "Talk about my day"],
};

describe("signed-in features", () => {
  beforeEach(() => {
    tokenStorage.set("token");
    vi.mocked(authService.me).mockResolvedValue(testUser);
    vi.mocked(moodService.getMoodStats).mockResolvedValue(emptyStats());
  });

  it("persists a mood check-in through the API and refreshes the dashboard", async () => {
    const user = userEvent.setup();
    vi.mocked(moodService.logMood).mockResolvedValue({
      id: 1, mood: "calm", score: 4, source: "manual", note: null, created_at: new Date().toISOString(),
    });
    renderWithProviders(<AppRoutes />, { route: "/" });

    expect(await screen.findByText("Add your first mood check-in above.")).toBeInTheDocument();
    vi.mocked(moodService.getMoodStats).mockResolvedValue(
      emptyStats({
        today_logged: true,
        total_checkins: 1,
        latest: { id: 1, mood: "calm", score: 4, source: "manual", note: null, created_at: new Date().toISOString() },
        streak: { current: 1, longest: 1, active_today: true },
      }),
    );
    await user.click(screen.getByRole("radio", { name: /Calm/ }));

    await waitFor(() => expect(moodService.logMood).toHaveBeenCalledWith("calm"));
    expect(await screen.findByText("You seem relaxed today!")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Calm/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("highlights the active bottom-navigation item", async () => {
    renderWithProviders(<AppRoutes />, { route: "/" });
    await screen.findByText("Quick Access");
    const nav = screen.getAllByRole("navigation", { name: "Primary" });
    const homeLinks = nav.flatMap((n) => Array.from(n.querySelectorAll('a[href="/"]')));
    expect(homeLinks.some((link) => link.getAttribute("aria-current") === "page")).toBe(true);
  });

  it("shows an honest empty state on Progress when there is no data", async () => {
    renderWithProviders(<AppRoutes />, { route: "/progress" });
    expect(await screen.findByText("Keep checking in to unlock your mood insights.", {}, { timeout: 25000 })).toBeInTheDocument();
    expect(screen.getByText(/Not enough data for insights yet/)).toBeInTheDocument();
  });

  it("rejects an empty chat message and sends real messages to the backend", async () => {
    const user = userEvent.setup();
    vi.mocked(chatService.listConversations).mockResolvedValue([
      { id: 7, title: "New conversation", created_at: conversation.created_at, updated_at: conversation.updated_at, message_count: 1, last_message: "Hey" },
    ]);
    vi.mocked(chatService.getConversation).mockResolvedValue(conversation);
    vi.mocked(chatService.sendMessage).mockResolvedValue({
      user_message: { id: 2, conversation_id: 7, sender: "user", content: "I'm stressed about exams", created_at: "2026-10-01T08:01:00Z" },
      assistant_message: { id: 3, conversation_id: 7, sender: "assistant", content: "That sounds like a lot to carry.", created_at: "2026-10-01T08:01:01Z" },
      suggestions: ["Talk about it"],
    });

    renderWithProviders(<AppRoutes />, { route: "/chat" });
    expect(await screen.findByText(/How are you feeling today\?/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(screen.getByText("Type a message first.")).toBeInTheDocument();
    expect(chatService.sendMessage).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Message"), "I'm stressed about exams{Enter}");
    await waitFor(() => expect(chatService.sendMessage).toHaveBeenCalledWith(7, "I'm stressed about exams"));
    expect(await screen.findByText("That sounds like a lot to carry.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Talk about it" })).toBeInTheDocument();
  });

  it("shows the chat empty state for a brand-new user", async () => {
    vi.mocked(chatService.listConversations).mockResolvedValue([]);
    renderWithProviders(<AppRoutes />, { route: "/chat" });
    expect(await screen.findByRole("button", { name: "Start chatting" }, { timeout: 10000 })).toBeInTheDocument();
    expect(screen.getAllByText("Start a conversation with your AI companion.").length).toBeGreaterThan(0);
  });
});

describe("error messages", () => {
  it("never exposes raw errors and explains network failures", () => {
    expect(getErrorMessage({ isAxiosError: true, request: {}, response: undefined })).toBe(NETWORK_ERROR_MESSAGE);
    expect(
      getErrorMessage({ isAxiosError: true, response: { status: 500, data: { detail: "Traceback (most recent call last)" } } }),
    ).toBe("Something went wrong on our side. Please try again.");
    expect(getErrorMessage(new Error("boom"))).toBe("Something went wrong. Please try again.");
  });
});
