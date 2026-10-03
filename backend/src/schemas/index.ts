import { z } from "zod";

import { MOODS } from "../utils/moods.ts";
import { isValidTimeZone } from "../utils/time.ts";

const BCRYPT_MAX_BYTES = 72;

const collapseSpaces = (value: string) => value.split(/\s+/).filter(Boolean).join(" ");

const personName = z
  .string()
  .max(100)
  .transform(collapseSpaces)
  .refine((v) => v.length > 0, "Name cannot be empty");

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address").max(255));

const newPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72)
  .refine((v) => Buffer.byteLength(v, "utf8") <= BCRYPT_MAX_BYTES, "Password is too long (max 72 bytes)")
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Password must contain at least one letter and one number");

export const mood = z.enum(MOODS);
export const idParam = (name: string) => z.object({ [name]: z.coerce.number().int().positive() });
const limit = (max: number, fallback: number) => z.coerce.number().int().min(1).max(max).default(fallback);
const offset = z.coerce.number().int().min(0).default(0);
const days = z.object({ days: z.coerce.number().int().min(1).max(365).default(7) });

export const registerBody = z.object({
  name: personName,
  email,
  password: newPassword,
  timezone: z.string().max(64).nullish(),
});
export const loginBody = z.object({ email, password: z.string().min(1, "Password is required").max(128) });
export const changePasswordBody = z.object({
  current_password: z.string().min(1).max(128),
  new_password: newPassword,
});

export const notificationPreferences = z.object({
  daily_reminder: z.boolean().default(true),
  weekly_report: z.boolean().default(true),
  game_reminders: z.boolean().default(false),
});
export const profileUpdateBody = z.object({
  name: personName.optional(),
  avatar_url: z.url({ protocol: /^https?$/, error: "Enter a valid http(s) URL" }).max(500).nullish().transform((v) => v ?? undefined),
  remove_avatar: z.boolean().default(false),
  preferred_language: z.string().min(2).max(10).optional(),
  timezone: z.string().max(64).refine(isValidTimeZone, "Unknown timezone").optional(),
  notification_preferences: notificationPreferences.optional(),
});
export const contactBody = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{3,30}$/, "Enter a valid phone number"),
  relationship: z.string().trim().max(50).nullish(),
  is_primary: z.boolean().default(false),
});

export const moodBody = z.object({ mood, note: z.string().max(1000).nullish() });
export const moodListQuery = z.object({ limit: limit(500, 50), offset });
export const daysQuery = days;

export const conversationBody = z.object({ title: z.string().max(120).nullish() });
export const messageBody = z.object({
  content: z
    .string()
    .max(2000)
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, "Message cannot be empty"),
});

const searchQuery = z.string().max(100).optional();
export const recommendationListQuery = z.object({ type: z.enum(["music", "movie"]).optional() });
export const musicQuery = z.object({
  category: z.enum(["for_you", "calm", "focus", "happy", "sad"]).default("for_you"),
  q: searchQuery,
});
export const movieQuery = z.object({
  category: z.enum(["for_you", "comfort", "inspirational", "comedy"]).default("for_you"),
  q: searchQuery,
});

export const gameListQuery = z.object({ category: z.string().max(30).optional() });
export const gameHistoryQuery = z.object({ limit: limit(200, 20), game_id: z.coerce.number().int().positive().optional() });
export const gameSessionBody = z.object({
  score: z.number().int().min(0).max(1_000_000),
  duration: z.number().int().min(1).max(4 * 60 * 60),
});

export const activityListQuery = z.object({ category: z.enum(["breathing", "yoga", "mindfulness"]).optional() });
export const completionsQuery = z.object({ limit: limit(200, 20) });

const nonBlank = (max: number) =>
  z
    .string()
    .max(max)
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, "Cannot be empty");
export const journalCreateBody = z.object({ title: nonBlank(150), content: nonBlank(20_000), mood: mood.nullish() });
export const journalUpdateBody = z.object({
  title: nonBlank(150).optional(),
  content: nonBlank(20_000).optional(),
  mood: mood.nullish(),
  clear_mood: z.boolean().default(false),
});
export const journalListQuery = z.object({ limit: limit(200, 50), offset });
