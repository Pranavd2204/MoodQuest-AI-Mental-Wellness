import { MoodFace } from "@/components/mood/MoodFace";
import type { Mood } from "@/types";
import { MOOD_BY_KEY } from "@/utils/moods";

export function MoodContextChip({ mood }: { mood: Mood | null }) {
  if (!mood) {
    return <p className="text-xs text-slate-400">Check in your mood on Home to get personalised picks.</p>;
  }
  return (
    <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pr-3 pl-1 text-xs text-slate-300">
      <MoodFace mood={mood} className="size-5" />
      Picked for your latest mood: <span className="font-semibold text-white">{MOOD_BY_KEY[mood].label}</span>
    </p>
  );
}
