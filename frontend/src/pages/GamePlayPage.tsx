import { Gamepad2, RotateCcw, Trophy } from "lucide-react";
import { useCallback, useRef, useState, type ComponentType } from "react";
import { Link, useParams } from "react-router-dom";

import { BreathingFlowGame } from "@/components/games/BreathingFlowGame";
import { ColorMatchGame } from "@/components/games/ColorMatchGame";
import { MemoryChallengeGame } from "@/components/games/MemoryChallengeGame";
import { PuzzleMindGame } from "@/components/games/PuzzleMindGame";
import { StressBurstGame } from "@/components/games/StressBurstGame";
import type { GameProps, GameResult } from "@/components/games/types";
import { ZenGardenGame } from "@/components/games/ZenGardenGame";
import { PageHeader } from "@/components/navigation/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, SectionHeader } from "@/components/ui/Card";
import { EmptyState, ErrorState, InlineError, LoadingState } from "@/components/ui/States";
import { useToast } from "@/contexts/ToastContext";
import { useAsync } from "@/hooks/useAsync";
import { getErrorMessage } from "@/lib/api";
import { gameService } from "@/services/gameService";
import type { GameSession } from "@/types";
import { formatDuration, timeAgo } from "@/utils/date";

const GAME_COMPONENTS: Record<string, ComponentType<GameProps>> = {
  "breathing-flow": BreathingFlowGame,
  "color-match": ColorMatchGame,
  "memory-challenge": MemoryChallengeGame,
  "zen-garden": ZenGardenGame,
  "stress-burst": StressBurstGame,
  "puzzle-mind": PuzzleMindGame,
};

export function GamePlayPage() {
  const gameId = Number(useParams().gameId);
  const toast = useToast();
  const game = useAsync(() => gameService.getGame(gameId), [gameId]);
  const history = useAsync(() => gameService.getHistory(5, gameId), [gameId]);
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const [saved, setSaved] = useState<GameSession | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const finishedRef = useRef(false);
  const bestBeforeRef = useRef<number | null>(null);
  const reloadGame = game.reload;
  const reloadHistory = history.reload;

  const save = useCallback(
    async (outcome: GameResult) => {
      setSaving(true);
      setSaveError(null);
      try {
        const session = await gameService.saveSession(gameId, outcome.score, outcome.duration);
        setSaved(session);
        toast.success("Game session saved");
        void reloadGame();
        void reloadHistory();
      } catch (error) {
        setSaveError(getErrorMessage(error, "Your score couldn't be saved."));
      } finally {
        setSaving(false);
      }
    },
    [gameId, toast, reloadGame, reloadHistory],
  );

  const handleFinish = useCallback(
    (outcome: GameResult) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      bestBeforeRef.current = game.data?.best_score ?? null;
      setResult(outcome);
      void save(outcome);
    },
    [save, game.data],
  );

  function playAgain() {
    finishedRef.current = false;
    setResult(null);
    setSaved(null);
    setSaveError(null);
    setRound((r) => r + 1);
  }

  if (game.loading && !game.data) return <LoadingState label="Loading game…" />;
  if (game.error || !game.data) {
    return (
      <div>
        <PageHeader title="Mini Games" backTo="/games" />
        <ErrorState message={game.error ?? "Game not found"} onRetry={game.reload} />
      </div>
    );
  }

  const GameComponent = GAME_COMPONENTS[game.data.slug];
  const previousBest = game.data.best_score;
  const isNewBest = !!saved && !!result && (bestBeforeRef.current === null || result.score > bestBeforeRef.current);

  return (
    <div className="space-y-6">
      <PageHeader
        title={game.data.name}
        subtitle={`${game.data.label} · ${game.data.duration_minutes} min${previousBest !== null ? ` · Best ${previousBest}` : ""}`}
        backTo="/games"
      />

      <Card>
        {!GameComponent ? (
          <EmptyState icon={Gamepad2} title="Coming soon" message="This game isn't playable yet." />
        ) : result ? (
          <div className="flex animate-pop flex-col items-center gap-4 py-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-amber-400/40 blur-2xl" aria-hidden />
              <Trophy className="relative size-14 text-amber-300" aria-hidden />
            </div>
            <div>
              <p className="text-sm text-slate-400">Your score</p>
              <p className="text-5xl font-extrabold text-white tabular-nums">{result.score}</p>
              <p className="mt-1 text-sm text-slate-400">Played for {formatDuration(result.duration)}</p>
              {isNewBest && <p className="mt-2 text-sm font-semibold text-amber-300">New personal best!</p>}
            </div>
            {saving && <p className="text-sm text-slate-400">Saving your session…</p>}
            {saveError && (
              <div className="w-full max-w-sm space-y-2">
                <InlineError message={saveError} />
                <Button size="sm" variant="outline" onClick={() => void save(result)} loading={saving}>
                  Retry saving
                </Button>
              </div>
            )}
            <div className="flex gap-3">
              <Button icon={<RotateCcw className="size-4" />} onClick={playAgain} disabled={saving}>
                Play again
              </Button>
              <Link to="/games">
                <Button variant="outline">All games</Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p className="mb-2 text-center text-sm text-slate-400">{game.data.description}</p>
            <GameComponent key={round} onFinish={handleFinish} />
          </>
        )}
      </Card>

      <Card>
        <SectionHeader title="Your recent scores" />
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
                <span className="text-slate-300">
                  {timeAgo(s.completed_at)} · {formatDuration(s.duration)}
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
