import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppRoutes } from "@/App";
import { tokenStorage } from "@/lib/api";
import { authService } from "@/services/authService";
import { moodService } from "@/services/moodService";

import { emptyStats, renderWithProviders, testUser } from "./utils";

vi.mock("@/services/authService", () => ({
  authService: { login: vi.fn(), register: vi.fn(), logout: vi.fn(), me: vi.fn() },
}));
vi.mock("@/services/chatService", () => ({
  chatService: { listConversations: vi.fn().mockResolvedValue([]), createConversation: vi.fn(), getConversation: vi.fn(), sendMessage: vi.fn(), deleteConversation: vi.fn() },
}));
vi.mock("@/services/moodService", () => ({
  moodService: { getMoodStats: vi.fn(), logMood: vi.fn(), getProgressSummary: vi.fn(), getMoods: vi.fn() },
}));

describe("authentication flows", () => {
  beforeEach(() => {
    vi.mocked(moodService.getMoodStats).mockResolvedValue(emptyStats());
  });

  it("redirects anonymous visitors from the dashboard to the welcome screen", async () => {
    renderWithProviders(<AppRoutes />, { route: "/" });
    expect(await screen.findByText(/Your AI Companion/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign up with Email" })).toBeInTheDocument();
  });

  it("validates the login form before calling the API", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: "/login" });
    await user.click(await screen.findByRole("button", { name: "Log in" }));
    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it("shows the server's message for invalid credentials", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.login).mockRejectedValue(
      Object.assign(new Error("401"), {
        isAxiosError: true,
        response: { status: 401, data: { detail: "Incorrect email or password" } },
      }),
    );
    renderWithProviders(<AppRoutes />, { route: "/login" });
    await user.type(await screen.findByLabelText("Email"), "riya@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-pass1");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByText("Incorrect email or password")).toBeInTheDocument();
  });

  it("logs in, stores the token and shows the user's name on the dashboard", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.login).mockResolvedValue({
      access_token: "token-123",
      token_type: "bearer",
      expires_at: "2026-10-01T12:00:00Z",
      user: testUser,
    });
    renderWithProviders(<AppRoutes />, { route: "/login" });
    await user.type(await screen.findByLabelText("Email"), "riya@example.com");
    await user.type(screen.getByLabelText("Password"), "Secret123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("heading", { name: /Riya/ })).toBeInTheDocument();
    expect(tokenStorage.get()).toBe("token-123");
    expect(authService.login).toHaveBeenCalledWith("riya@example.com", "Secret123");
  });

  it("returns to the originally requested page after logging in", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.login).mockResolvedValue({
      access_token: "token-123",
      token_type: "bearer",
      expires_at: "2026-10-01T12:00:00Z",
      user: testUser,
    });
    renderWithProviders(<AppRoutes />, { route: "/progress" });
    await user.type(await screen.findByLabelText("Email"), "riya@example.com");
    await user.type(screen.getByLabelText("Password"), "Secret123");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByRole("heading", { name: "Your Progress" }, { timeout: 25000 })).toBeInTheDocument();
  });

  it("restores the session from a stored token after a refresh", async () => {
    tokenStorage.set("stored-token");
    vi.mocked(authService.me).mockResolvedValue(testUser);
    renderWithProviders(<AppRoutes />, { route: "/" });
    expect(await screen.findByRole("heading", { name: /Riya/ })).toBeInTheDocument();
  });

  it("clears an expired token and returns to the login screen", async () => {
    tokenStorage.set("expired-token");
    vi.mocked(authService.me).mockRejectedValue(
      Object.assign(new Error("401"), { isAxiosError: true, response: { status: 401, data: {} } }),
    );
    renderWithProviders(<AppRoutes />, { route: "/progress" });
    expect(await screen.findByText(/session has expired/i)).toBeInTheDocument();
    await waitFor(() => expect(tokenStorage.get()).toBeNull());
  });

  it("validates registration input", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: "/register" });
    await user.type(await screen.findByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: "Sign up" }));
    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText("Use at least 8 characters")).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });
});
