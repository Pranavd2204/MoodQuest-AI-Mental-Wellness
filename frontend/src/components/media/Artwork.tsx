import { useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

type Scene = "city" | "mountains" | "aurora" | "ocean" | "forest" | "nebula";

const SCENES_BY_KIND: Record<"music" | "movie" | "activity", Scene[]> = {
  music: ["city", "aurora", "ocean", "mountains", "nebula"],
  movie: ["nebula", "mountains", "ocean", "forest", "city", "aurora"],
  activity: ["mountains", "ocean", "forest", "aurora"],
};

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909);
    return ((s ^= s >>> 16) >>> 0) / 4294967296;
  };
}

function Stars({ seed, count = 26, maxY = 140 }: { seed: number; count?: number; maxY?: number }) {
  const rand = rng(seed);
  return (
    <g fill="#fff">
      {Array.from({ length: count }, (_, i) => (
        <circle key={i} cx={rand() * 400} cy={rand() * maxY} r={rand() * 1.3 + 0.3} opacity={rand() * 0.7 + 0.3} />
      ))}
    </g>
  );
}

function SceneSvg({ scene, seed }: { scene: Scene; seed: number }) {
  const id = useId().replace(/:/g, "");
  const rand = rng(seed);
  const g = (name: string) => `url(#${id}${name})`;

  switch (scene) {
    case "city": {
      const buildings = Array.from({ length: 16 }, (_, i) => ({ x: i * 26 - 6, w: 20 + rand() * 14, h: 50 + rand() * 110 }));
      return (
        <>
          <defs>
            <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1e1b4b" />
              <stop offset="0.55" stopColor="#7c3aed" />
              <stop offset="1" stopColor="#f472b6" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill={g("sky")} />
          <Stars seed={seed} />
          <circle cx={300 - rand() * 80} cy="70" r="22" fill="#fde68a" opacity="0.9" />
          <g fill="#1e1036" opacity="0.95">
            {buildings.map((b, i) => (
              <rect key={i} x={b.x} y={300 - b.h} width={b.w} height={b.h} rx="1.5" />
            ))}
          </g>
          <g fill="#fbbf24" opacity="0.55">
            {buildings.flatMap((b, i) =>
              Array.from({ length: 4 }, (_, j) => (
                <rect key={`${i}-${j}`} x={b.x + 4 + (j % 2) * 8} y={300 - b.h + 10 + j * 14} width="3" height="4" />
              )),
            )}
          </g>
        </>
      );
    }
    case "mountains":
      return (
        <>
          <defs>
            <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#312e81" />
              <stop offset="0.5" stopColor="#c026d3" />
              <stop offset="0.85" stopColor="#fb923c" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill={g("sky")} />
          <Stars seed={seed} count={14} maxY={90} />
          <circle cx={120 + rand() * 160} cy="170" r="38" fill="#fde047" opacity="0.85" />
          <path d="M0 210 L70 140 L130 190 L210 110 L290 185 L340 150 L400 200 V300 H0Z" fill="#581c87" />
          <path d="M0 240 L90 185 L160 230 L250 170 L330 230 L400 205 V300 H0Z" fill="#3b0764" />
          <path d="M0 270 L110 235 L220 268 L320 240 L400 262 V300 H0Z" fill="#1e0b36" />
        </>
      );
    case "aurora":
      return (
        <>
          <defs>
            <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#020617" />
              <stop offset="1" stopColor="#134e4a" />
            </linearGradient>
            <linearGradient id={`${id}band`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#22d3ee" stopOpacity="0" />
              <stop offset="0.5" stopColor="#34d399" stopOpacity="0.8" />
              <stop offset="1" stopColor="#a78bfa" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill={g("sky")} />
          <Stars seed={seed} count={34} maxY={200} />
          <path d={`M0 ${120 + rand() * 30} C120 60 220 170 400 ${80 + rand() * 40}`} stroke={g("band")} strokeWidth="38" fill="none" opacity="0.7" />
          <path d="M0 160 C140 110 260 200 400 130" stroke={g("band")} strokeWidth="18" fill="none" opacity="0.5" />
          <path d="M0 250 L80 200 L150 240 L230 190 L310 245 L400 215 V300 H0Z" fill="#042f2e" />
          <path d="M0 275 L120 250 L260 280 L400 255 V300 H0Z" fill="#021716" />
        </>
      );
    case "ocean":
      return (
        <>
          <defs>
            <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1e3a8a" />
              <stop offset="0.6" stopColor="#7c3aed" />
              <stop offset="1" stopColor="#f9a8d4" />
            </linearGradient>
            <linearGradient id={`${id}sea`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4c1d95" />
              <stop offset="1" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill={g("sky")} />
          <Stars seed={seed} count={16} maxY={100} />
          <circle cx={200 + (rand() - 0.5) * 120} cy="175" r="34" fill="#fef3c7" opacity="0.9" />
          <rect y="185" width="400" height="115" fill={g("sea")} />
          {Array.from({ length: 7 }, (_, i) => (
            <rect key={i} x={170 + (rand() - 0.5) * 60} y={195 + i * 13} width={60 - i * 6} height="2.5" rx="1" fill="#fde68a" opacity={0.6 - i * 0.07} />
          ))}
        </>
      );
    case "forest":
      return (
        <>
          <defs>
            <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0f172a" />
              <stop offset="0.6" stopColor="#0e7490" />
              <stop offset="1" stopColor="#a7f3d0" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill={g("sky")} />
          <circle cx={80 + rand() * 240} cy="90" r="26" fill="#ecfeff" opacity="0.8" />
          {[0, 1].map((layer) => (
            <g key={layer} fill={layer ? "#022c22" : "#065f46"}>
              {Array.from({ length: 12 }, (_, i) => {
                const x = i * 36 + (layer ? 18 : 0) + rand() * 10;
                const h = 70 + rand() * 60 + layer * 30;
                const base = 300 - layer * 10 + 10;
                return <path key={i} d={`M${x} ${base - h} L${x + 24} ${base} L${x - 24} ${base}Z`} />;
              })}
            </g>
          ))}
        </>
      );
    case "nebula":
    default:
      return (
        <>
          <defs>
            <radialGradient id={`${id}glow`} cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#f472b6" stopOpacity="0.9" />
              <stop offset="1" stopColor="#f472b6" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${id}glow2`} cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#22d3ee" stopOpacity="0.8" />
              <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="400" height="300" fill="#1e1b4b" />
          <circle cx={100 + rand() * 80} cy={100 + rand() * 60} r="140" fill={g("glow")} />
          <circle cx={260 + rand() * 80} cy={160 + rand() * 60} r="130" fill={g("glow2")} />
          <Stars seed={seed} count={40} maxY={300} />
          {Array.from({ length: 6 }, (_, i) => (
            <circle key={i} cx={rand() * 400} cy={rand() * 300} r={8 + rand() * 18} fill="#fff" opacity={0.06 + rand() * 0.08} />
          ))}
        </>
      );
  }
}

interface ArtworkProps {
  seed: string;
  kind: "music" | "movie" | "activity";
  imageUrl?: string | null;
  className?: string;
  children?: ReactNode;
}

export function Artwork({ seed, kind, imageUrl, className, children }: ArtworkProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const value = hash(seed);
  const scenes = SCENES_BY_KIND[kind];
  const scene = scenes[value % scenes.length];

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {imageUrl && !imageFailed ? (
        <img src={imageUrl} alt="" className="absolute inset-0 size-full object-cover" onError={() => setImageFailed(true)} />
      ) : (
        <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden>
          <SceneSvg scene={scene} seed={value} />
        </svg>
      )}
      {children}
    </div>
  );
}
