import { Eraser, Mountain, Waves } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/utils/date";

import { secondsSince, type GameProps } from "./types";

const WIDTH = 800;
const HEIGHT = 600;
const TINES = [-12, -4, 4, 12];

function paintSand(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, "#e8d5b0");
  gradient.addColorStop(1, "#d6bf94");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  for (let i = 0; i < 2500; i++) {
    ctx.fillStyle = `rgba(120, 90, 50, ${Math.random() * 0.08})`;
    ctx.fillRect(Math.random() * WIDTH, Math.random() * HEIGHT, 1.5, 1.5);
  }
}

export function ZenGardenGame({ onFinish }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const startRef = useRef(Date.now());
  const [tool, setTool] = useState<"rake" | "stone">("rake");
  const [strokes, setStrokes] = useState(0);
  const [stones, setStones] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) paintSand(ctx);
    startRef.current = Date.now();
    const timer = window.setInterval(() => setSeconds(secondsSince(startRef.current)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
    };
  }

  function placeStone(x: number, y: number) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "rgba(110, 80, 40, 0.35)";
    ctx.lineWidth = 2;
    for (let r = 40; r <= 100; r += 14) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    const gradient = ctx.createRadialGradient(x - 8, y - 10, 4, x, y, 34);
    gradient.addColorStop(0, "#9ca3af");
    gradient.addColorStop(1, "#374151");
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(x + 5, y + 8, 32, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(x, y, 30, 22, -0.3, 0, Math.PI * 2);
    ctx.fill();
    setStones((n) => n + 1);
  }

  function rake(from: { x: number; y: number }, to: { x: number; y: number }) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    ctx.lineCap = "round";
    for (const offset of TINES) {
      ctx.strokeStyle = "rgba(120, 88, 45, 0.45)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(from.x + nx * offset, from.y + ny * offset);
      ctx.lineTo(to.x + nx * offset, to.y + ny * offset);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 250, 235, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(from.x + nx * (offset + 2), from.y + ny * (offset + 2));
      ctx.lineTo(to.x + nx * (offset + 2), to.y + ny * (offset + 2));
      ctx.stroke();
    }
  }

  function onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
    const p = point(event);
    if (tool === "stone") {
      placeStone(p.x, p.y);
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    lastPoint.current = p;
    setStrokes((n) => n + 1);
  }

  function onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (tool !== "rake" || !lastPoint.current) return;
    const p = point(event);
    if (Math.hypot(p.x - lastPoint.current.x, p.y - lastPoint.current.y) < 4) return;
    rake(lastPoint.current, p);
    lastPoint.current = p;
  }

  function clear() {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) paintSand(ctx);
  }

  const calmPoints = strokes * 2 + stones * 5;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 py-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2" role="radiogroup" aria-label="Tool">
          {[
            { key: "rake" as const, label: "Rake", icon: Waves },
            { key: "stone" as const, label: "Stone", icon: Mountain },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              role="radio"
              aria-checked={tool === key}
              onClick={() => setTool(key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                tool === key ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white" : "border border-white/10 text-slate-300 hover:text-white",
              )}
            >
              <Icon className="size-4" aria-hidden /> {label}
            </button>
          ))}
          <button
            onClick={clear}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-1.5 text-sm text-slate-300 hover:text-white"
          >
            <Eraser className="size-4" aria-hidden /> Smooth
          </button>
        </div>
        <p className="text-sm text-slate-300">
          Calm points <strong className="text-white tabular-nums">{calmPoints}</strong> · <span className="tabular-nums">{formatDuration(seconds)}</span>
        </p>
      </div>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => (lastPoint.current = null)}
        onPointerCancel={() => (lastPoint.current = null)}
        className="aspect-[4/3] w-full cursor-crosshair touch-none rounded-[var(--radius-card)] border border-amber-200/20 shadow-2xl"
        aria-label="Sand garden canvas. Drag to rake patterns, or choose Stone and tap to place stones."
      />
      <div className="flex justify-center">
        <Button
          onClick={() => onFinish({ score: calmPoints, duration: secondsSince(startRef.current) })}
          disabled={strokes + stones === 0}
        >
          Finish session
        </Button>
      </div>
    </div>
  );
}
