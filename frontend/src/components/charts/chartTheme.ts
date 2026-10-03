import type { Mood } from "@/types";

export const CHART_SURFACE = "#101736";

export const MOOD_CHART_COLORS: Record<Mood, string> = {
  happy: "#199e70",
  calm: "#3987e5",
  stressed: "#9085e9",
  sad: "#d55181",
  angry: "#e66767",
  anxious: "#d95926",
};

export const DONUT_ORDER: Mood[] = ["happy", "anxious", "calm", "sad", "stressed", "angry"];

export const ACTIVITY_SERIES = [
  { key: "mood_checkins", label: "Check-ins", color: "#3987e5" },
  { key: "games", label: "Games", color: "#d95926" },
  { key: "activities", label: "Exercises", color: "#199e70" },
  { key: "journal_entries", label: "Journal", color: "#c98500" },
  { key: "chat_messages", label: "Chat", color: "#d55181" },
] as const;

export const AXIS_TICK = { fill: "#94a3b8", fontSize: 11 };
export const GRID_STROKE = "rgb(255 255 255 / 0.06)";
export const TREND_LINE = "#a78bfa";
