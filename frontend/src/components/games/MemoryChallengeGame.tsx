import { Cloud, Flower2, Heart, Leaf, Moon, Music, Star, Sun, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/utils/date";

import { secondsSince, type GameProps } from "./types";

const SYMBOLS: { icon: LucideIcon; color: string }[] = [
  { icon: Heart, color: "#fb7185" },
  { icon: Star, color: "#facc15" },
  { icon: Moon, color: "#a5b4fc" },
  { icon: Sun, color: "#fb923c" },
  { icon: Leaf, color: "#4ade80" },
  { icon: Music, color: "#f0abfc" },
  { icon: Cloud, color: "#7dd3fc" },
  { icon: Flower2, color: "#c4b5fd" },
];

interface CardState {
  id: number;
  symbol: number;
  matched: boolean;
}

function shuffledDeck(): CardState[] {
  const deck = SYMBOLS.flatMap((_, symbol) => [symbol, symbol]);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.map((symbol, id) => ({ id, symbol, matched: false }));
}

export function MemoryChallengeGame({ onFinish }: GameProps) {
  const [started, setStarted] = useState(false);
  const [cards, setCards] = useState<CardState[]>(shuffledDeck);
  const [open, setOpen] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const startRef = useRef(0);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!started) return;
    const timer = window.setInterval(() => setSeconds(secondsSince(startRef.current)), 500);
    return () => window.clearInterval(timer);
  }, [started]);

  useEffect(() => {
    if (!started || finishedRef.current || !cards.every((c) => c.matched)) return;
    finishedRef.current = true;
    const duration = secondsSince(startRef.current);
    const score = Math.max(50, 1000 - (moves - SYMBOLS.length) * 25 - duration * 3);
    window.setTimeout(() => onFinish({ score, duration }), 450);
  }, [cards, moves, started, onFinish]);

  function flip(index: number) {
    if (!started || open.length === 2 || open.includes(index) || cards[index].matched) return;
    const nextOpen = [...open, index];
    setOpen(nextOpen);
    if (nextOpen.length < 2) return;

    setMoves((m) => m + 1);
    const [a, b] = nextOpen;
    if (cards[a].symbol === cards[b].symbol) {
      setCards((all) => all.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)));
      setOpen([]);
    } else {
      window.setTimeout(() => setOpen([]), 750);
    }
  }

  function start() {
    setCards(shuffledDeck());
    setOpen([]);
    setMoves(0);
    setSeconds(0);
    finishedRef.current = false;
    startRef.current = Date.now();
    setStarted(true);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-2">
      {started ? (
        <div className="flex w-full justify-between text-sm text-slate-300">
          <span>
            Moves <strong className="text-white tabular-nums">{moves}</strong>
          </span>
          <span>
            Pairs <strong className="text-white tabular-nums">{cards.filter((c) => c.matched).length / 2}</strong>/{SYMBOLS.length}
          </span>
          <span className="tabular-nums">{formatDuration(seconds)}</span>
        </div>
      ) : (
        <p className="text-center text-sm text-slate-300">Flip two cards at a time and find all {SYMBOLS.length} matching pairs.</p>
      )}
      <div className="grid w-full grid-cols-4 gap-2.5 sm:gap-3">
        {cards.map((card, index) => {
          const visible = card.matched || open.includes(index);
          const { icon: Icon, color } = SYMBOLS[card.symbol];
          return (
            <button
              key={card.id}
              onClick={() => flip(index)}
              disabled={!started}
              aria-label={visible ? `Card ${index + 1}, revealed` : `Card ${index + 1}, hidden`}
              className={cn(
                "flex aspect-square items-center justify-center rounded-2xl border transition-all duration-300",
                visible
                  ? "border-white/15 bg-ink-700 [transform:rotateY(0deg)]"
                  : "border-primary-400/30 bg-gradient-to-br from-primary-600 to-primary-700 hover:brightness-110 [transform:rotateY(180deg)]",
                card.matched && "opacity-60",
              )}
            >
              {visible && <Icon className="size-8 animate-pop" style={{ color }} aria-hidden />}
            </button>
          );
        })}
      </div>
      {!started && (
        <Button size="lg" onClick={start}>
          Start
        </Button>
      )}
    </div>
  );
}
