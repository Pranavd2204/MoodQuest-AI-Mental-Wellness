import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import type { MoodStats, User } from "@/types";

export const testUser: User = {
  id: 1,
  name: "Riya Kapoor",
  email: "riya@example.com",
  avatar_url: null,
  created_at: "2026-09-01T10:00:00Z",
};

export function emptyStats(overrides: Partial<MoodStats> = {}): MoodStats {
  return {
    range_days: 7,
    latest: null,
    today_logged: false,
    streak: { current: 0, longest: 0, active_today: false },
    total_checkins: 0,
    days_with_data: 0,
    has_enough_data: false,
    trend: Array.from({ length: 7 }, (_, i) => ({
      date: `2026-09-${String(24 + i).padStart(2, "0")}`,
      average_score: null,
      count: 0,
      dominant_mood: null,
    })),
    distribution: (["happy", "calm", "stressed", "sad", "angry", "anxious"] as const).map((mood) => ({
      mood,
      count: 0,
      percentage: 0,
    })),
    insight: null,
    ...overrides,
  };
}

export function renderWithProviders(ui: ReactElement, { route = "/" }: { route?: string } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ToastProvider>
        <AuthProvider>{ui}</AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}
