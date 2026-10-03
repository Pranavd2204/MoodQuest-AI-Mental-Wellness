import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/utils/date";

import { secondsSince, type GameProps } from "./types";

const SIZE = 3;
const SOLVED = [1, 2, 3, 4, 5, 6, 7, 8, 0];

function neighbours(index: number): number[] {
  const row = Math.floor(index / SIZE);
  const col = index % SIZE;
  const result: number[] = [];
  if (row > 0) result.push(index - SIZE);
  if (row < SIZE - 1) result.push(index + SIZE);
  if (col > 0) result.push(index - 1);
  if (col < SIZE - 1) result.push(index + 1);
  return result;
}

function shuffled(): number[] {
  const tiles = [...SOLVED];
  let blank = tiles.indexOf(0);
  let previous = -1;
  for (let i = 0; i < 120; i++) {
    const options = neighbours(blank).filter((n) => n !== previous);
    const pick = options[Math.floor(Math.random() * options.length)];
    [tiles[blank], tiles[pick]] = [tiles[pick], tiles[blank]];
    previous = blank;
    blank = pick;
  }
  return tiles.join() === SOLVED.join() ? shuffled() : tiles;
}

export function PuzzleMindGame({ onFinish }: GameProps) {
  const [started, setStarted] = useState(false);
  const [tiles, setTiles] = useState<number[]>(SOLVED);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const startRef = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!started) return;
    const timer = window.setInterval(() => setSeconds(secondsSince(startRef.current)), 500);
    return () => window.clearInterval(timer);
  }, [started]);

  function move(index: number) {
    if (!started || doneRef.current) return;
    const blank = tiles.indexOf(0);
    if (!neighbours(blank).includes(index)) return;
    const next = [...tiles];
    [next[blank], next[index]] = [next[index], next[blank]];
    const nextMoves = moves + 1;
    setTiles(next);
    setMoves(nextMoves);
    if (next.join() === SOLVED.join()) {
      doneRef.current = true;
      const duration = secondsSince(startRef.current);
      window.setTimeout(() => onFinish({ score: Math.max(20, 600 - nextMoves * 3 - duration), duration }), 400);
    }
  }

  function start() {
    setTiles(shuffled());
    setMoves(0);
    setSeconds(0);
    doneRef.current = false;
    startRef.current = Date.now();
    setStarted(true);
  }

  const blank = tiles.indexOf(0);

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-5 py-2">
      {started ? (
        <div className="flex w-full justify-between text-sm text-slate-300">
          <span>
            Moves <strong className="text-white tabular-nums">{moves}</strong>
          </span>
          <span className="tabular-nums">{formatDuration(seconds)}</span>
        </div>
      ) : (
        <p className="text-center text-sm text-slate-300">Slide the tiles into order from 1 to 8. Tap a tile next to the gap to move it.</p>
      )}
      <div className="glass grid w-full grid-cols-3 gap-2 p-2">
        {tiles.map((tile, index) => {
          const movable = started && neighbours(blank).includes(index);
          return tile === 0 ? (
            <div key="blank" className="aspect-square rounded-xl bg-black/20" aria-hidden />
          ) : (
            <button
              key={tile}
              onClick={() => move(index)}
              disabled={!started}
              aria-label={`Tile ${tile}${movable ? ", movable" : ""}`}
              className={cn(
                "flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-fuchsia-600 text-3xl font-extrabold text-white shadow-lg transition-all duration-200",
                movable ? "ring-2 ring-white/40 hover:brightness-110" : "opacity-90",
                tile === index + 1 && started && "from-emerald-500 to-teal-600",
              )}
            >
              {tile}
            </button>
          );
        })}
      </div>
      {!started && (
        <Button size="lg" onClick={start}>
          Shuffle & start
        </Button>
      )}
    </div>
  );
}
