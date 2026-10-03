export const MOODS = ["happy", "calm", "stressed", "sad", "angry", "anxious"] as const;
export type Mood = (typeof MOODS)[number];

export const MOOD_SCORES: Record<Mood, number> = {
  happy: 5,
  calm: 4,
  stressed: 2,
  anxious: 2,
  sad: 1,
  angry: 1,
};
