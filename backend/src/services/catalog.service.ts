import type { Prisma, PrismaClient } from "../generated/prisma/client.ts";

const youtubeSearch = (query: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(query).replace(/%20/g, "+")}`;

export const GAMES = [
  {
    slug: "breathing-flow",
    name: "Breathing Flow",
    description: "Follow the glowing orb as it expands and contracts. Each full breath cycle earns points.",
    category: "relax",
    tags: ["relax", "breathing"],
    label: "Relax",
    difficulty: "easy",
    durationMinutes: 3,
  },
  {
    slug: "color-match",
    name: "Color Match",
    description: "Does the word match its ink colour? Answer fast to train your focus.",
    category: "focus",
    tags: ["focus", "fun"],
    label: "Focus",
    difficulty: "medium",
    durationMinutes: 5,
  },
  {
    slug: "memory-challenge",
    name: "Memory Challenge",
    description: "Flip the cards and find every matching pair in as few moves as possible.",
    category: "focus",
    tags: ["focus"],
    label: "Brain",
    difficulty: "medium",
    durationMinutes: 5,
  },
  {
    slug: "zen-garden",
    name: "Zen Garden",
    description: "Rake calming patterns into the sand and place stones. There is no wrong way to play.",
    category: "relax",
    tags: ["relax"],
    label: "Relax",
    difficulty: "easy",
    durationMinutes: 5,
  },
  {
    slug: "stress-burst",
    name: "Stress Burst",
    description: "Pop as many floating bubbles as you can and let the tension go.",
    category: "fun",
    tags: ["fun", "relax"],
    label: "Tap & Relax",
    difficulty: "easy",
    durationMinutes: 1,
  },
  {
    slug: "puzzle-mind",
    name: "Puzzle Mind",
    description: "Slide the tiles back into order. A gentle logic puzzle to quiet a busy mind.",
    category: "focus",
    tags: ["focus"],
    label: "Logic",
    difficulty: "hard",
    durationMinutes: 5,
  },
];

type Step = { text: string; seconds: number };
const steps = (...pairs: [string, number][]): Step[] => pairs.map(([text, seconds]) => ({ text, seconds }));
const repeat = <T>(items: T[], times: number): T[] => Array.from({ length: times }, () => items).flat();

const BREATH_CYCLE: [string, number][] = [
  ["Breathe in slowly through your nose", 4],
  ["Hold gently", 4],
  ["Breathe out through your mouth", 6],
];

export const ACTIVITIES = [
  {
    title: "5 Min Breathing Exercise",
    description: "Reduce stress and feel calm with slow, guided breathing.",
    category: "breathing",
    duration: 5,
    benefit: "Stress relief",
    moods: ["stressed", "anxious", "angry"],
    isFeatured: true,
    steps: steps(["Sit comfortably and relax your shoulders", 20], ...repeat(BREATH_CYCLE, 18), ["Notice how your body feels now", 30]),
  },
  {
    title: "Box Breathing",
    description: "A four-count breathing pattern used to steady a racing mind.",
    category: "breathing",
    duration: 4,
    benefit: "Anxiety",
    moods: ["anxious", "stressed"],
    steps: steps(
      ...repeat<[string, number]>(
        [["Inhale for four", 4], ["Hold for four", 4], ["Exhale for four", 4], ["Hold for four", 4]],
        15,
      ),
    ),
  },
  {
    title: "4-7-8 Breathing",
    description: "Slow your heart rate with a long, calming exhale.",
    category: "breathing",
    duration: 3,
    benefit: "Calm",
    moods: ["anxious", "angry", "stressed"],
    steps: steps(...repeat<[string, number]>([["Inhale quietly", 4], ["Hold", 7], ["Exhale with a whoosh", 8]], 9)),
  },
  {
    title: "Body Scan Meditation",
    description: "Move your attention slowly from head to toe, releasing tension as you go.",
    category: "mindfulness",
    duration: 10,
    benefit: "Relaxation",
    moods: ["stressed", "anxious", "calm"],
    steps: steps(
      ["Lie down or sit back and close your eyes", 45],
      ["Bring attention to your forehead and jaw. Let them soften", 75],
      ["Notice your neck and shoulders. Let them drop", 75],
      ["Feel your arms and hands grow heavy", 75],
      ["Notice your chest rising and falling", 75],
      ["Relax your stomach and lower back", 75],
      ["Let your legs and feet sink down", 75],
      ["Feel your whole body at once, calm and supported", 60],
      ["Slowly wiggle your fingers and open your eyes", 45],
    ),
  },
  {
    title: "Morning Yoga",
    description: "Gentle stretches to wake up your body and lift your energy.",
    category: "yoga",
    duration: 12,
    benefit: "Energy",
    moods: ["sad", "calm", "happy"],
    steps: steps(
      ["Mountain pose: stand tall and breathe", 60],
      ["Reach up and side-bend to the left", 45],
      ["Reach up and side-bend to the right", 45],
      ["Forward fold, knees soft", 60],
      ["Cat-cow on hands and knees", 90],
      ["Downward dog, pedal your feet", 75],
      ["Low lunge, right leg forward", 60],
      ["Low lunge, left leg forward", 60],
      ["Child's pose", 90],
      ["Seated twist, both sides", 90],
      ["Rest with eyes closed", 45],
    ),
  },
  {
    title: "Desk Yoga Reset",
    description: "Quick chair-friendly stretches between study or work sessions.",
    category: "yoga",
    duration: 5,
    benefit: "Focus",
    moods: ["stressed", "angry", "calm"],
    steps: steps(
      ["Roll your shoulders back slowly", 40],
      ["Tilt your head gently side to side", 40],
      ["Seated cat-cow", 50],
      ["Seated twist to the right", 40],
      ["Seated twist to the left", 40],
      ["Stretch your wrists and fingers", 40],
      ["Close your eyes and take three deep breaths", 50],
    ),
  },
  {
    title: "Sleep Meditation",
    description: "Wind down and drift towards restful sleep.",
    category: "mindfulness",
    duration: 8,
    benefit: "Better sleep",
    moods: ["anxious", "stressed", "sad"],
    steps: steps(
      ["Get comfortable in bed and dim the lights", 45],
      ["Take a slow breath in, and a longer breath out", 60],
      ["Imagine a calm place where you feel safe", 90],
      ["Notice the sounds and colours there", 90],
      ["Let each thought drift by like a cloud", 90],
      ["Feel your body getting heavier and warmer", 90],
      ["Rest here as long as you like", 15],
    ),
  },
  {
    title: "Gratitude Reflection",
    description: "Think of three good things, however small, to shift your perspective.",
    category: "mindfulness",
    duration: 5,
    benefit: "Positivity",
    moods: ["sad", "happy", "calm"],
    steps: steps(
      ["Settle in and take three slow breaths", 30],
      ["Think of one thing that went well today", 75],
      ["Think of one person you are grateful for", 75],
      ["Think of one small thing that made you smile", 75],
      ["Hold onto that warm feeling", 45],
    ),
  },
];

interface RecommendationSeed {
  type: "music" | "movie";
  title: string;
  subtitle: string;
  category: string;
  moods: string[];
  description: string;
  externalUrl: string;
  isFeatured: boolean;
  extra: Prisma.InputJsonObject;
}

const music = (
  title: string,
  subtitle: string,
  category: string,
  moods: string,
  query: string,
  description: string,
  { featured = false, categories = [] as string[] } = {},
): RecommendationSeed => ({
  type: "music",
  title,
  subtitle,
  category,
  moods: moods.split(","),
  description,
  externalUrl: youtubeSearch(query),
  isFeatured: featured,
  extra: { categories, platform: "YouTube" },
});

const movie = (
  title: string,
  year: number,
  category: string,
  moods: string,
  description: string,
  genre: string,
  { featured = false, categories = [] as string[] } = {},
): RecommendationSeed => ({
  type: "movie",
  title,
  subtitle: `${year} · ${genre}`,
  category,
  moods: moods.split(","),
  description,
  externalUrl: youtubeSearch(`${title} ${year} official trailer`),
  isFeatured: featured,
  extra: { categories, year, genre },
});

export const RECOMMENDATIONS: RecommendationSeed[] = [
  music("Lo-Fi Chill", "For a calmer mind", "calm", "calm,stressed,anxious", "lofi chill beats to relax", "Soft lo-fi beats to slow your thoughts down.", { featured: true, categories: ["focus"] }),
  music("Calm Piano", "Relax & Heal", "calm", "calm,stressed,anxious,sad", "calm piano music relaxing", "Gentle piano pieces for quiet moments."),
  music("Lo-Fi Beats", "Focus Mode", "focus", "calm,stressed", "lofi beats study focus", "Steady beats that help you settle into deep work."),
  music("Nature Sounds", "Feel the Nature", "calm", "anxious,stressed,angry", "relaxing nature sounds forest rain", "Birdsong, rain and rivers to ground you."),
  music("Deep Focus Ambient", "Study & Work", "focus", "calm,stressed", "deep focus ambient music", "Spacious ambient textures with no distractions."),
  music("Study Rain", "Rain for concentration", "focus", "anxious,calm", "rain sounds for studying", "Steady rainfall to mask noise and help you focus."),
  music("Morning Sunshine", "Start bright", "happy", "happy,calm", "happy morning acoustic playlist", "Upbeat acoustic songs for a bright start."),
  music("Feel-Good Hits", "Instant mood lift", "happy", "happy,sad", "feel good songs playlist", "Sing-along favourites to lift your spirits.", { categories: ["sad"] }),
  music("Happy Dance Mix", "Move your body", "happy", "happy,angry", "happy dance music mix", "High-energy tracks to shake off tension."),
  music("Rainy Day Acoustic", "It's okay to feel", "sad", "sad", "rainy day acoustic songs", "Soft acoustic songs that sit with you on hard days."),
  music("Healing Strings", "Comfort & hope", "sad", "sad,anxious", "healing strings emotional instrumental", "Warm string arrangements that slowly lift the mood."),
  music("Cool Down Instrumentals", "Let it go", "calm", "angry,stressed", "calming instrumental music anger", "Slow instrumentals to cool a racing heart.", { categories: ["sad"] }),

  movie("Inside Out", 2015, "comfort", "sad,anxious,calm,happy", "A beautiful story about understanding your emotions.", "Animation", { featured: true }),
  movie("The Pursuit of Happyness", 2006, "inspirational", "sad,stressed", "A father's determined journey through hardship towards a better life.", "Drama"),
  movie("Soul", 2020, "inspirational", "sad,anxious,calm", "A musician rediscovers what makes life worth living.", "Animation", { categories: ["comfort"] }),
  movie("Zindagi Na Milegi Dobara", 2011, "inspirational", "stressed,sad,happy", "Three friends on a road trip learn to let go of fear and live fully.", "Drama"),
  movie("Paddington 2", 2017, "comfort", "sad,anxious,happy", "A kind-hearted bear brings out the best in everyone he meets.", "Family", { categories: ["comedy"] }),
  movie("3 Idiots", 2009, "comedy", "stressed,sad,happy", "A funny, heartfelt look at college pressure and chasing what you love.", "Comedy", { categories: ["inspirational"] }),
  movie("My Neighbor Totoro", 1988, "comfort", "anxious,calm,sad", "Two sisters discover gentle forest spirits in the countryside.", "Animation"),
  movie("Up", 2009, "comfort", "sad,calm", "An unlikely friendship and an adventure that heals old grief.", "Animation", { categories: ["inspirational"] }),
  movie("The Secret Life of Walter Mitty", 2013, "inspirational", "stressed,sad", "A daydreamer finally steps into a real-life adventure.", "Adventure"),
  movie("Chhichhore", 2019, "inspirational", "stressed,sad", "Old friends share their college story to show that failure is not the end.", "Drama", { categories: ["comedy"] }),
  movie("School of Rock", 2003, "comedy", "happy,angry,sad", "An out-of-work rocker turns a class of students into a band.", "Comedy"),
  movie("The Intouchables", 2011, "comedy", "sad,happy", "An unexpected friendship full of humour and warmth.", "Comedy", { categories: ["inspirational"] }),
];

export async function seedCatalog(db: PrismaClient): Promise<void> {
  for (const { slug, ...game } of GAMES) {
    await db.game.upsert({ where: { slug }, update: game, create: { slug, ...game } });
  }
  for (const { title, ...activity } of ACTIVITIES) {
    const data = { isFeatured: false, mediaUrl: null, ...activity };
    await db.activity.upsert({ where: { title }, update: data, create: { title, ...data } });
  }
  for (const { type, title, ...rec } of RECOMMENDATIONS) {
    const existing = await db.recommendation.findFirst({ where: { type, title, userId: null }, select: { id: true } });
    if (existing) await db.recommendation.update({ where: { id: existing.id }, data: rec });
    else await db.recommendation.create({ data: { type, title, ...rec } });
  }
}
