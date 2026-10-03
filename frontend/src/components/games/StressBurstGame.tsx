import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";

import { secondsSince, type GameProps } from "./types";

const ROUND_SECONDS = 30;
const BUBBLE_LIFETIME = 3200;
const MAX_BUBBLES = 12;
const HUES = ["#60a5fa", "#a78bfa", "#f472b6", "#22d3ee", "#34d399", "#facc15"];

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  born: number;
}

interface Burst {
  id: number;
  x: number;
  y: number;
  color: string;
}

export function StressBurstGame({ onFinish }: GameProps) {
  const [running, setRunning] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const startRef = useRef(0);
  const scoreRef = useRef(0);
  const nextId = useRef(1);

  const finish = useCallback(() => {
    setRunning(false);
    setBubbles([]);
    onFinish({ score: scoreRef.current, duration: secondsSince(startRef.current) });
  }, [onFinish]);

  useEffect(() => {
    if (!running) return;
    const clock = window.setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const left = ROUND_SECONDS - elapsed / 1000;
      setTimeLeft(Math.max(0, left));
      setBubbles((all) => all.filter((b) => Date.now() - b.born < BUBBLE_LIFETIME));
      if (left <= 0) finish();
    }, 100);

    let spawnTimer = 0;
    const spawn = () => {
      setBubbles((all) =>
        all.length >= MAX_BUBBLES
          ? all
          : [
              ...all,
              {
                id: nextId.current++,
                x: 8 + Math.random() * 84,
                y: 10 + Math.random() * 75,
                size: 44 + Math.random() * 40,
                color: HUES[Math.floor(Math.random() * HUES.length)],
                born: Date.now(),
              },
            ],
      );
      const progress = (Date.now() - startRef.current) / (ROUND_SECONDS * 1000);
      spawnTimer = window.setTimeout(spawn, 650 - progress * 350);
    };
    spawn();
    return () => {
      window.clearInterval(clock);
      window.clearTimeout(spawnTimer);
    };
  }, [running, finish]);

  function pop(bubble: Bubble) {
    setBubbles((all) => all.filter((b) => b.id !== bubble.id));
    scoreRef.current += 1;
    setScore(scoreRef.current);
    const burst = { id: bubble.id, x: bubble.x, y: bubble.y, color: bubble.color };
    setBursts((all) => [...all, burst]);
    window.setTimeout(() => setBursts((all) => all.filter((b) => b.id !== burst.id)), 400);
  }

  function start() {
    scoreRef.current = 0;
    setScore(0);
    setBubbles([]);
    startRef.current = Date.now();
    setTimeLeft(ROUND_SECONDS);
    setRunning(true);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 py-2">
      {running && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-slate-300">
            <span>
              Popped <strong className="text-white tabular-nums">{score}</strong>
            </span>
            <span className="tabular-nums">{Math.ceil(timeLeft)}s</span>
          </div>
          <ProgressBar value={timeLeft} max={ROUND_SECONDS} label="Time left" />
        </div>
      )}
      <div className="glass relative aspect-[4/3] w-full touch-none overflow-hidden select-none">
        {!running && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="max-w-xs text-sm text-slate-300">
              Tap the bubbles to pop them and let the tension go. You have {ROUND_SECONDS} seconds.
            </p>
            <Button size="lg" onClick={start}>
              Start popping
            </Button>
          </div>
        )}
        {bubbles.map((b) => (
          <button
            key={b.id}
            onPointerDown={() => pop(b)}
            aria-label="Pop bubble"
            className="absolute animate-pop rounded-full"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: b.size,
              height: b.size,
              transform: "translate(-50%, -50%)",
              background: `radial-gradient(circle at 30% 30%, #ffffffcc, ${b.color}99 35%, ${b.color}33 70%)`,
              boxShadow: `0 0 24px -4px ${b.color}, inset 0 0 12px ${b.color}`,
              border: `1px solid ${b.color}aa`,
            }}
          />
        ))}
        {bursts.map((b) => (
          <span
            key={`burst-${b.id}`}
            className="pointer-events-none absolute size-16 animate-ping rounded-full"
            style={{ left: `${b.x}%`, top: `${b.y}%`, transform: "translate(-50%, -50%)", border: `2px solid ${b.color}` }}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}
