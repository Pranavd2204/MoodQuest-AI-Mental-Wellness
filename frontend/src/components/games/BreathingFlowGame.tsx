import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

import { secondsSince, type GameProps } from "./types";

const PHASES = [
  { name: "inhale", label: "Breathe in", hint: "Press and hold the orb", ms: 4000 },
  { name: "hold", label: "Hold", hint: "Keep holding", ms: 3000 },
  { name: "exhale", label: "Breathe out", hint: "Let go of the orb", ms: 5000 },
] as const;
const CYCLE_MS = PHASES.reduce((sum, p) => sum + p.ms, 0);
const TOTAL_CYCLES = 8;
const TICK_MS = 100;

function phaseAt(elapsed: number) {
  let t = elapsed % CYCLE_MS;
  for (const phase of PHASES) {
    if (t < phase.ms) return { phase, remaining: phase.ms - t };
    t -= phase.ms;
  }
  return { phase: PHASES[0], remaining: PHASES[0].ms };
}

export function BreathingFlowGame({ onFinish }: GameProps) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [holding, setHolding] = useState(false);
  const [accuracy, setAccuracy] = useState(100);
  const startRef = useRef(0);
  const holdingRef = useRef(false);
  const ticks = useRef({ total: 0, synced: 0 });

  const cycles = Math.floor(elapsed / CYCLE_MS);
  const { phase, remaining } = phaseAt(elapsed);

  const finish = useCallback(() => {
    setRunning(false);
    const { total, synced } = ticks.current;
    onFinish({ score: total ? Math.round((synced / total) * 100) : 0, duration: secondsSince(startRef.current) });
  }, [onFinish]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      const now = Date.now() - startRef.current;
      const current = phaseAt(now).phase;
      const shouldHold = current.name !== "exhale";
      ticks.current.total += 1;
      if (holdingRef.current === shouldHold) ticks.current.synced += 1;
      setAccuracy(Math.round((ticks.current.synced / ticks.current.total) * 100));
      setElapsed(now);
      if (now >= CYCLE_MS * TOTAL_CYCLES) finish();
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [running, finish]);

  const setHold = (value: boolean) => {
    holdingRef.current = value;
    setHolding(value);
  };

  useEffect(() => {
    if (!running) return;
    const down = (e: KeyboardEvent) => e.code === "Space" && (e.preventDefault(), setHold(true));
    const up = (e: KeyboardEvent) => e.code === "Space" && setHold(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [running]);

  function start() {
    ticks.current = { total: 0, synced: 0 };
    startRef.current = Date.now();
    setElapsed(0);
    setAccuracy(100);
    setRunning(true);
  }

  const expanded = running && phase.name !== "exhale";

  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      {running ? (
        <div className="flex w-full max-w-sm justify-between text-sm text-slate-300">
          <span>
            Cycle <strong className="text-white">{Math.min(cycles + 1, TOTAL_CYCLES)}</strong>/{TOTAL_CYCLES}
          </span>
          <span>
            In sync <strong className="text-white">{accuracy}%</strong>
          </span>
        </div>
      ) : (
        <p className="max-w-sm text-sm text-slate-300">
          Press and hold the orb (or the space bar) while you breathe in and hold. Release as you breathe out. Stay in
          sync for {TOTAL_CYCLES} calm breaths.
        </p>
      )}

      <button
        onPointerDown={() => running && setHold(true)}
        onPointerUp={() => setHold(false)}
        onPointerLeave={() => setHold(false)}
        onPointerCancel={() => setHold(false)}
        disabled={!running}
        aria-label={running ? `${phase.label}. ${phase.hint}` : "Breathing orb"}
        className="relative flex size-64 touch-none items-center justify-center select-none sm:size-72"
      >
        <span
          className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-300 via-cyan-400 to-primary-500 opacity-90 blur-[2px]"
          style={{
            transform: `scale(${expanded ? 1 : 0.55})`,
            transition: `transform ${running ? (phase.name === "inhale" ? 4 : phase.name === "exhale" ? 5 : 0.3) : 0.6}s ease-in-out`,
            boxShadow: holding ? "0 0 80px 10px rgb(45 212 191 / 0.6)" : "0 0 40px 0 rgb(139 92 246 / 0.5)",
          }}
        />
        <span className={cn("relative text-lg font-semibold text-white drop-shadow", !running && "text-slate-900")}>
          {running ? phase.label : ""}
        </span>
      </button>

      {running ? (
        <div className="space-y-3">
          <p className="text-slate-300">
            {phase.hint} · <span className="tabular-nums">{Math.ceil(remaining / 1000)}s</span>
          </p>
          <Button variant="outline" size="sm" onClick={finish} disabled={cycles < 1}>
            Finish early
          </Button>
        </div>
      ) : (
        <Button size="lg" onClick={start}>
          Start breathing
        </Button>
      )}
    </div>
  );
}
