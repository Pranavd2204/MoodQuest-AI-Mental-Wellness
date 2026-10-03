import { Music } from "lucide-react";
import { useState } from "react";

import { FeaturedCard, MediaCard } from "@/components/media/MediaCards";
import { MoodContextChip } from "@/components/media/MoodContextChip";
import { PageHeader } from "@/components/navigation/PageHeader";
import { SearchToggle } from "@/components/SearchToggle";
import { SectionHeader } from "@/components/ui/Card";
import { PillTabs } from "@/components/ui/PillTabs";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { useAsync } from "@/hooks/useAsync";
import { useDebounce } from "@/hooks/useDebounce";
import { recommendationService } from "@/services/recommendationService";

const CATEGORIES = [
  { value: "for_you", label: "For You" },
  { value: "calm", label: "Calm" },
  { value: "focus", label: "Focus" },
  { value: "happy", label: "Happy" },
  { value: "sad", label: "Sad" },
];

const PREVIEW_COUNT = 6;

export function MusicPage() {
  const [category, setCategory] = useState("for_you");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const debounced = useDebounce(query.trim());

  const feed = useAsync(() => recommendationService.getMusic(category, debounced), [category, debounced]);
  const items = feed.data?.items ?? [];
  const visible = showAll ? items : items.slice(0, PREVIEW_COUNT);

  return (
    <div>
      <PageHeader
        title="Music for Your Mood"
        actions={
          <SearchToggle open={searchOpen} onOpenChange={setSearchOpen} value={query} onChange={setQuery} placeholder="Search music" />
        }
      />
      <PillTabs options={CATEGORIES} value={category} onChange={(v) => (setCategory(v), setShowAll(false))} label="Music categories" />

      <div className="mt-5 space-y-6">
        {feed.loading && !feed.data ? (
          <>
            <Skeleton className="aspect-[16/9] sm:aspect-[21/8]" />
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          </>
        ) : feed.error ? (
          <ErrorState message={feed.error} onRetry={feed.reload} />
        ) : !feed.data?.featured ? (
          <EmptyState icon={Music} title="No music found" message={debounced ? `Nothing matches "${debounced}".` : "No recommendations in this category yet."} />
        ) : (
          <>
            {category === "for_you" && !debounced && <MoodContextChip mood={feed.data.mood_context} />}
            <FeaturedCard item={feed.data.featured} />
            {items.length > 0 && (
              <section>
                <SectionHeader
                  title="Recommended Playlists"
                  action={
                    items.length > PREVIEW_COUNT && (
                      <button onClick={() => setShowAll((v) => !v)} className="text-sm font-medium text-primary-300 hover:text-primary-200">
                        {showAll ? "Show less" : "See All"}
                      </button>
                    )
                  }
                />
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6">
                  {visible.map((item) => (
                    <MediaCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
