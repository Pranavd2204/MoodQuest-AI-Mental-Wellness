import { Gamepad2, Trophy } from "lucide-react";
import { useState } from "react";

import { GameTile } from "@/components/games/GameTile";
import { PageHeader } from "@/components/navigation/PageHeader";
import { SearchToggle } from "@/components/SearchToggle";
import { Card, SectionHeader } from "@/components/ui/Card";
import { PillTabs } from "@/components/ui/PillTabs";
import { EmptyState, ErrorState, LoadingState, Skeleton } from "@/components/ui/States";
import { useAsync } from "@/hooks/useAsync";
import { gameService } from "@/services/gameService";
import { formatDuration, timeAgo } from "@/utils/date";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "relax", label: "Relax" },
  { value: "focus", label: "Focus" },
  { value: "fun", label: "Fun" },
  { value: "breathing", label: "Breathing" },
];

export function GamesPage() {
  const [category, setCategory] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const games = useAsync(() => gameService.getGames(category), [category]);
  const history = useAsync(() => gameService.getHistory(6), []);

  const filtered = (games.data ?? []).filter((g) => g.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <PageHeader
          title="Mini Games"
          actions={
            <SearchToggle open={searchOpen} onOpenChange={setSearchOpen} value={query} onChange={setQuery} placeholder="Search games" />
          }
        />
        <PillTabs options={CATEGORIES} value={category} onChange={setCategory} label="Game categories" />
      </div>

      {games.loading && !games.data ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="aspect-[1.25]" />
          ))}
        </div>
      ) : games.error ? (
        <ErrorState message={games.error} onRetry={games.reload} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Gamepad2} title="No games found" message="Try another category or search." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {filtered.map((game, index) => (
            <GameTile key={game.id} game={game} index={index} />
          ))}
        </div>
      )}

      <Card>
        <SectionHeader title="Recent Sessions" />
        {history.loading && !history.data ? (
          <LoadingState />
        ) : history.error ? (
          <ErrorState message={history.error} onRetry={history.reload} />
        ) : !history.data?.length ? (
          <EmptyState compact icon={Trophy} title="Play your first game to start tracking progress." />
        ) : (
          <ul className="divide-y divide-white/5">
            {history.data.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                <span>
                  <span className="font-medium text-white">{s.game_name}</span>
                  <span className="block text-xs text-slate-500">
                    {timeAgo(s.completed_at)} · {formatDuration(s.duration)}
                  </span>
                </span>
                <span className="font-semibold text-primary-200 tabular-nums">{s.score} pts</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
