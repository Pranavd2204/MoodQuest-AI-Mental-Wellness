import { Trophy } from "lucide-react";
import { Link } from "react-router-dom";

import type { Game } from "@/types";

import { DEFAULT_VISUAL, GAME_VISUALS } from "./gameVisuals";

export function GameTile({ game, index = 0 }: { game: Game; index?: number }) {
  const visual = GAME_VISUALS[game.slug] ?? DEFAULT_VISUAL;
  const Icon = visual.icon;
  return (
    <Link
      to={`/games/${game.id}`}
      className="group relative flex aspect-[1.1] reveal flex-col overflow-hidden rounded-[var(--radius-card)] border border-white/10 p-3.5 transition-all duration-300 hover:-translate-y-1 sm:aspect-[1.25] sm:p-4"
      style={{ background: visual.gradient, animationDelay: `${index * 40}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" aria-hidden />
      <div className="relative flex min-h-0 flex-1 items-center justify-center" aria-hidden>
        <div className="relative transition-transform duration-300 group-hover:scale-110">
          <div className="absolute inset-0 rounded-full blur-2xl" style={{ background: visual.glow, opacity: 0.6 }} />
          <Icon className="relative size-12 text-white drop-shadow-[0_6px_14px_rgb(0_0_0/0.35)] sm:size-16" strokeWidth={1.6} />
        </div>
      </div>
      {game.best_score !== null && (
        <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white">
          <Trophy className="size-3" aria-hidden /> {game.best_score}
        </span>
      )}
      <div className="relative">
        <p className="truncate font-semibold text-white drop-shadow">{game.name}</p>
        <p className="text-xs text-white/85">
          {game.label} · {game.duration_minutes} min
        </p>
      </div>
    </Link>
  );
}
