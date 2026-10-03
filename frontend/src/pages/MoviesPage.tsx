import { Clapperboard } from "lucide-react";
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
  { value: "comfort", label: "Comfort" },
  { value: "inspirational", label: "Inspirational" },
  { value: "comedy", label: "Comedy" },
];

const PREVIEW_COUNT = 6;

export function MoviesPage() {
  const [category, setCategory] = useState("for_you");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const debounced = useDebounce(query.trim());

  const feed = useAsync(() => recommendationService.getMovies(category, debounced), [category, debounced]);
  const items = feed.data?.items ?? [];
  const visible = showAll ? items : items.slice(0, PREVIEW_COUNT);

  return (
    <div>
      <PageHeader
        title="Movies & Entertainment"
        actions={
          <SearchToggle open={searchOpen} onOpenChange={setSearchOpen} value={query} onChange={setQuery} placeholder="Search movies" />
        }
      />
      <PillTabs options={CATEGORIES} value={category} onChange={(v) => (setCategory(v), setShowAll(false))} label="Movie categories" />

      <div className="mt-5 space-y-6">
        {feed.loading && !feed.data ? (
          <>
            <Skeleton className="aspect-[4/3] sm:aspect-[21/9]" />
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="aspect-[3/4]" />
              ))}
            </div>
          </>
        ) : feed.error ? (
          <ErrorState message={feed.error} onRetry={feed.reload} />
        ) : !feed.data?.featured ? (
          <EmptyState icon={Clapperboard} title="No movies found" message={debounced ? `Nothing matches "${debounced}".` : "No recommendations in this category yet."} />
        ) : (
          <>
            {category === "for_you" && !debounced && <MoodContextChip mood={feed.data.mood_context} />}
            <FeaturedCard item={feed.data.featured} ctaLabel="Play Trailer" tall />
            {items.length > 0 && (
              <section>
                <SectionHeader
                  title="More Recommendations"
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
                    <MediaCard key={item.id} item={item} portrait />
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
