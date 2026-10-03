import { Flower2, Play } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { ActivityRow } from "@/components/media/ActivityRow";
import { Artwork } from "@/components/media/Artwork";
import { MoodContextChip } from "@/components/media/MoodContextChip";
import { PageHeader } from "@/components/navigation/PageHeader";
import { PillTabs } from "@/components/ui/PillTabs";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { useAsync } from "@/hooks/useAsync";
import { activityService } from "@/services/activityService";
import { recommendationService } from "@/services/recommendationService";
import type { Activity, Mood } from "@/types";

type Category = "all" | "breathing" | "yoga" | "mindfulness";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "all", label: "All" },
  { value: "breathing", label: "Breathing" },
  { value: "yoga", label: "Yoga" },
  { value: "mindfulness", label: "Mindfulness" },
];

export function MeditationPage() {
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab") as Category | null;
  const category: Category = CATEGORIES.some((c) => c.value === tabParam) ? (tabParam as Category) : "all";

  const feed = useAsync<{ mood: Mood | null; items: Activity[] }>(async () => {
    if (category === "all") {
      const data = await recommendationService.getExercises();
      return { mood: data.mood_context, items: data.items };
    }
    return { mood: null, items: await activityService.getActivities(category) };
  }, [category]);

  const items = feed.data?.items ?? [];
  const featured = feed.data?.mood ? items[0] : (items.find((a) => a.is_featured) ?? items[0]);
  const rest = items.filter((a) => a !== featured);

  return (
    <div>
      <PageHeader title="Meditation & Exercises" />
      <PillTabs
        options={CATEGORIES}
        value={category}
        onChange={(value) => setParams(value === "all" ? {} : { tab: value }, { replace: true })}
        label="Exercise categories"
      />

      <div className="mt-5 space-y-5">
        {feed.loading && !feed.data ? (
          <>
            <Skeleton className="aspect-[16/9] sm:aspect-[21/8]" />
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-18" />
            ))}
          </>
        ) : feed.error ? (
          <ErrorState message={feed.error} onRetry={feed.reload} />
        ) : !featured ? (
          <EmptyState icon={Flower2} title="No exercises here yet" />
        ) : (
          <>
            {category === "all" && <MoodContextChip mood={feed.data?.mood ?? null} />}
            <Link to={`/meditation/${featured.id}`} className="group block">
              <Artwork
                seed={featured.title}
                kind="activity"
                imageUrl={null}
                className="glass aspect-[16/9] animate-pop rounded-[var(--radius-card)] sm:aspect-[21/8]"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/10 to-transparent" />
                <span className="absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white transition group-hover:scale-110">
                  <Play className="ml-1 size-7 fill-current" aria-hidden />
                </span>
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                  <h2 className="text-xl font-bold text-white sm:text-2xl">{featured.title}</h2>
                  <p className="text-sm text-slate-200">{featured.description}</p>
                </div>
              </Artwork>
            </Link>
            <div className="grid gap-3 lg:grid-cols-2">
              {rest.map((activity) => (
                <ActivityRow key={activity.id} activity={activity} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
