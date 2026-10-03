
export type Mood = "happy" | "calm" | "stressed" | "sad" | "angry" | "anxious";

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
  expires_at: string;
  user: User;
}

export interface NotificationPreferences {
  daily_reminder: boolean;
  weekly_report: boolean;
  game_reminders: boolean;
}

export interface Profile {
  user: User;
  preferred_language: string;
  timezone: string;
  notification_preferences: NotificationPreferences;
}

export interface ProfileUpdate {
  name?: string;
  avatar_url?: string;
  remove_avatar?: boolean;
  preferred_language?: string;
  timezone?: string;
  notification_preferences?: NotificationPreferences;
}

export interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  relationship: string | null;
  is_primary: boolean;
}

export type EmergencyContactInput = Omit<EmergencyContact, "id">;

export interface MoodLog {
  id: number;
  mood: Mood;
  score: number;
  source: string;
  note: string | null;
  created_at: string;
}

export interface Streak {
  current: number;
  longest: number;
  active_today: boolean;
}

export interface TrendPoint {
  date: string;
  average_score: number | null;
  count: number;
  dominant_mood: Mood | null;
}

export interface DistributionItem {
  mood: Mood;
  count: number;
  percentage: number;
}

export interface Insight {
  kind: "improved" | "declined" | "steady" | "dominant";
  message: string;
  change_percent: number | null;
}

export interface MoodStats {
  range_days: number;
  latest: MoodLog | null;
  today_logged: boolean;
  streak: Streak;
  total_checkins: number;
  days_with_data: number;
  has_enough_data: boolean;
  trend: TrendPoint[];
  distribution: DistributionItem[];
  insight: Insight | null;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ConversationSummary {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message: string | null;
}

export interface ConversationDetail {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
  suggestions: string[];
}

export interface ChatReply {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
  suggestions: string[];
}

export type RecommendationType = "music" | "movie";

export interface Recommendation {
  id: number;
  type: RecommendationType;
  category: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  external_url: string | null;
  moods: Mood[];
  is_featured: boolean;
  provider: string;
  extra: Record<string, unknown> | null;
  created_at: string;
}

export interface RecommendationFeed {
  type: RecommendationType;
  category: string;
  mood_context: Mood | null;
  featured: Recommendation | null;
  items: Recommendation[];
}

export interface Game {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  label: string;
  difficulty: string;
  duration_minutes: number;
  is_playable: boolean;
  times_played: number;
  best_score: number | null;
}

export interface GameSession {
  id: number;
  game_id: number;
  game_name: string;
  game_slug: string;
  score: number;
  duration: number;
  completed_at: string;
}

export interface ActivityStep {
  text: string;
  seconds: number;
}

export interface Activity {
  id: number;
  title: string;
  description: string;
  category: "breathing" | "yoga" | "mindfulness";
  duration: number;
  benefit: string | null;
  moods: Mood[];
  media_url: string | null;
  is_featured: boolean;
  steps: ActivityStep[];
  completed_count: number;
  last_completed_at: string | null;
}

export interface ActivityCompletion {
  id: number;
  activity_id: number;
  activity_title: string;
  category: string;
  completed_at: string;
}

export interface ExerciseFeed {
  mood_context: Mood | null;
  items: Activity[];
}

export interface JournalEntry {
  id: number;
  title: string;
  content: string;
  mood: Mood | null;
  created_at: string;
  updated_at: string;
}

export interface JournalInput {
  title: string;
  content: string;
  mood: Mood | null;
}

export interface DailyActivity {
  date: string;
  mood_checkins: number;
  games: number;
  activities: number;
  journal_entries: number;
  chat_messages: number;
  total: number;
}

export interface ProgressSummary {
  range_days: number;
  streak: Streak;
  active_days: string[];
  daily: DailyActivity[];
  totals: {
    mood_checkins: number;
    games_played: number;
    activities_completed: number;
    journal_entries: number;
    chat_messages: number;
    mindful_minutes: number;
  };
}

export interface EmotionAnalysis {
  timestamp: number;
  dominant_emotion: string | null;
  confidence: number;
  emotions: { emotion: string; probability: number }[];
  face_detected: boolean;
  bbox: number[];
  num_faces: number;
  provider: string;
  saved_mood?: Mood | null;
}

export interface EmotionStatus {
  available: boolean;
  provider: string | null;
  message: string;
}

export interface EmergencyResources {
  emergency_number: string;
  helplines: { name: string; number: string; availability: string }[];
  disclaimer: string;
}
