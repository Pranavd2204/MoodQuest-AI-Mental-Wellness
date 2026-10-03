import type {
  Activity,
  ActivityCompletion,
  EmergencyContact,
  Game,
  GameSession,
  JournalEntry,
  Message,
  MoodLog,
  Profile,
  Recommendation,
  User,
} from "../generated/prisma/client.ts";

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  daily_reminder: true,
  weekly_report: true,
  game_reminders: false,
};

export type NotificationPreferences = typeof DEFAULT_NOTIFICATION_PREFERENCES;

export const serializeUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatar_url: user.avatarUrl,
  created_at: user.createdAt,
});

export const serializeProfile = (user: User, profile: Profile) => ({
  user: serializeUser(user),
  preferred_language: profile.preferredLanguage,
  timezone: profile.timezone,
  notification_preferences: {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...((profile.notificationPreferences as Partial<NotificationPreferences> | null) ?? {}),
  },
});

export const serializeContact = (contact: EmergencyContact) => ({
  id: contact.id,
  name: contact.name,
  phone: contact.phone,
  relationship: contact.relationship,
  is_primary: contact.isPrimary,
});

export const serializeMood = (log: MoodLog) => ({
  id: log.id,
  mood: log.mood,
  score: log.score,
  source: log.source,
  note: log.note,
  created_at: log.createdAt,
});

export const serializeMessage = (message: Message) => ({
  id: message.id,
  conversation_id: message.conversationId,
  sender: message.sender,
  content: message.content,
  created_at: message.createdAt,
});

export const serializeRecommendation = (item: Recommendation) => ({
  id: item.id,
  type: item.type,
  category: item.category,
  title: item.title,
  subtitle: item.subtitle,
  description: item.description,
  image_url: item.imageUrl,
  external_url: item.externalUrl,
  moods: item.moods,
  is_featured: item.isFeatured,
  provider: item.provider,
  extra: item.extra,
  created_at: item.createdAt,
});

export const serializeGame = (game: Game, stats: { timesPlayed: number; bestScore: number | null }) => ({
  id: game.id,
  slug: game.slug,
  name: game.name,
  description: game.description,
  category: game.category,
  tags: game.tags,
  label: game.label,
  difficulty: game.difficulty,
  duration_minutes: game.durationMinutes,
  is_playable: game.isPlayable,
  times_played: stats.timesPlayed,
  best_score: stats.bestScore,
});

export const serializeGameSession = (session: GameSession & { game: Game }) => ({
  id: session.id,
  game_id: session.gameId,
  game_name: session.game.name,
  game_slug: session.game.slug,
  score: session.score,
  duration: session.duration,
  completed_at: session.completedAt,
});

export const serializeActivity = (
  activity: Activity,
  progress: { completedCount: number; lastCompletedAt: Date | null } = { completedCount: 0, lastCompletedAt: null },
) => ({
  id: activity.id,
  title: activity.title,
  description: activity.description,
  category: activity.category,
  duration: activity.duration,
  benefit: activity.benefit,
  moods: activity.moods,
  media_url: activity.mediaUrl,
  is_featured: activity.isFeatured,
  steps: activity.steps as { text: string; seconds: number }[],
  completed_count: progress.completedCount,
  last_completed_at: progress.lastCompletedAt,
});

export type ActivityDto = ReturnType<typeof serializeActivity>;

export const serializeCompletion = (completion: ActivityCompletion & { activity: Activity }) => ({
  id: completion.id,
  activity_id: completion.activityId,
  activity_title: completion.activity.title,
  category: completion.activity.category,
  completed_at: completion.completedAt,
});

export const serializeJournal = (entry: JournalEntry) => ({
  id: entry.id,
  title: entry.title,
  content: entry.content,
  mood: entry.mood,
  created_at: entry.createdAt,
  updated_at: entry.updatedAt,
});
