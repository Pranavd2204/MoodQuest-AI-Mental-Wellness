import { Check, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/cn";

import { secondsSince, type GameProps } from "./types";

const COLORS = [
  { name: "RED", hex: "#f87171" },
  { name: "BLUE", hex: "#60a5fa" },
  { name: "GREEN", hex: "#4ade80" },
  { name: "YELLOW", hex: "#facc15" },
  { name: "PURPLE", hex: "#c084fc" },
  { name: "ORANGE", hex: "#fb923c" },
];
const ROUND_SECONDS = 45;

function nextRound() {
  const word = COLORS[Math.floor(Math.random() * COLORS.length)];
  const match = Math.random() < 0.5;
  const others = COLORS.filter((c) => c !== word);
  const ink = match ? word : others[Math.floor(Math.random() * others.length)];
  return { word, ink, match };
}

export function ColorMatchGame({ onFinish }: GameProps) {
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [round, setRound] = useState(nextRound);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const [feedback, setFeedback] = useState<"right" | "wrong" | null>(null);
  const startRef = useRef(0);
  const scoreRef = useRef(0);

  const finish = useCallback(() => {
    setRunning(false);
    onFinish({ score: scoreRef.current, duration: secondsSince(startRef.current) });
  }, [onFinish]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      const left = ROUND_SECONDS - (Date.now() - startRef.current) / 1000;
      setTimeLeft(Math.max(0, left));
      if (left <= 0) finish();
    }, 100);
    return () => window.clearInterval(timer);
  }, [running, finish]);

  const answer = useCallback(
    (saysMatch: boolean) => {
      if (!running) return;
      const correct = saysMatch === round.match;
      const nextStreak = correct ? streak + 1 : 0;
      const delta = correct ? 10 + Math.min(10, streak * 2) : -5;
      scoreRef.current = Math.max(0, scoreRef.current + delta);
      setScore(scoreRef.current);
      setStreak(nextStreak);
      setStats((s) => (correct ? { ...s, correct: s.correct + 1 } : { ...s, wrong: s.wrong + 1 }));
      setFeedback(correct ? "right" : "wrong");
      window.setTimeout(() => setFeedback(null), 220);
      setRound(nextRound());
    },
    [round, running, streak],
  );

  useEffect(() => {
    if (!running) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") answer(true);
      if (e.key === "ArrowRight") answer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, answer]);

  function start() {
    scoreRef.current = 0;
    setScore(0);
    setStreak(0);
    setStats({ correct: 0, wrong: 0 });
    setRound(nextRound());
    startRef.current = Date.now();
    setTimeLeft(ROUND_SECONDS);
    setRunning(true);
  }

  if (!running) {
    return (
      <div className="flex flex-col items-center gap-5 py-6 text-center">
        <p className="text-4xl font-black tracking-wide" style={{ color: "#60a5fa" }}>
          GREEN
        </p>
        <p className="max-w-sm text-sm text-slate-300">
          Look at the <strong>ink colour</strong>, not just the word. Tap <strong>Match</strong> if the word names its own
          colour, <strong>No match</strong> if it doesn't. You have {ROUND_SECONDS} seconds. Keyboard: ← match, → no match.
        </p>
        <Button size="lg" onClick={start}>
          Start
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-4">
      <div className="w-full space-y-2">
        <div className="flex justify-between text-sm text-slate-300">
          <span>
            Score <strong className="text-white tabular-nums">{score}</strong>
          </span>
          <span>
            Streak <strong className="text-white tabular-nums">{streak}</strong>
          </span>
          <span className="tabular-nums">{Math.ceil(timeLeft)}s</span>
        </div>
        <ProgressBar value={timeLeft} max={ROUND_SECONDS} label="Time left" />
      </div>
      <div
        className={cn(
          "glass flex h-40 w-full items-center justify-center transition-colors",
          feedback === "right" && "border-emerald-400/60",
          feedback === "wrong" && "border-rose-400/60",
        )}
      >
        <p className="text-5xl font-black tracking-wider" style={{ color: round.ink.hex }} aria-live="polite">
          {round.word.name}
        </p>
      </div>
      <div className="grid w-full grid-cols-2 gap-3">
        <Button size="lg" variant="secondary" icon={<Check className="size-5 text-emerald-300" />} onClick={() => answer(true)}>
          Match
        </Button>
        <Button size="lg" variant="secondary" icon={<X className="size-5 text-rose-300" />} onClick={() => answer(false)}>
          No match
        </Button>
      </div>
      <p className="text-xs text-slate-500">
        {stats.correct} correct · {stats.wrong} wrong
      </p>
    </div>
  );
}
