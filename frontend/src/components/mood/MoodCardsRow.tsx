import type { MoodStats } from "@/types";

import { CurrentMoodCard, StreakCard } from "./MoodCards";

export function MoodCards({ stats, loading }: { stats: MoodStats | null; loading: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <CurrentMoodCard latest={stats?.latest ?? null} loading={loading} />
      <StreakCard streak={stats?.streak ?? null} loading={loading} />
    </div>
  );
}
