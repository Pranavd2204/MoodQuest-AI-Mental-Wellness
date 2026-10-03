import { useMemo } from "react";

function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

export function TwilightScene() {
  const { stars, flowers } = useMemo(() => {
    const rand = seeded(11);
    return {
      stars: Array.from({ length: 110 }, () => ({ x: rand() * 1200, y: rand() * 620, r: rand() * 1.3 + 0.25, o: rand() * 0.6 + 0.25 })),
      flowers: Array.from({ length: 260 }, () => {
        const y = 690 + rand() * 210;
        const depth = (y - 690) / 210;
        return { x: rand() * 1200, y, r: 1.5 + depth * 4.5 + rand() * 1.5, o: 0.25 + depth * 0.55 };
      }),
    };
  }, []);

  return (
    <svg viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a0e1c" />
          <stop offset="0.45" stopColor="#131a33" />
          <stop offset="0.75" stopColor="#1d2347" />
          <stop offset="1" stopColor="#2a2550" />
        </linearGradient>
        <linearGradient id="aurora-teal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2dd4bf" stopOpacity="0" />
          <stop offset="0.5" stopColor="#2dd4bf" stopOpacity="0.55" />
          <stop offset="1" stopColor="#2dd4bf" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="aurora-violet" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8b8df8" stopOpacity="0" />
          <stop offset="0.5" stopColor="#a78bfa" stopOpacity="0.5" />
          <stop offset="1" stopColor="#8b8df8" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="bloom" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#8b8df8" stopOpacity="0.35" />
          <stop offset="1" stopColor="#8b8df8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="field" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2550" stopOpacity="0" />
          <stop offset="0.35" stopColor="#3a2f6b" stopOpacity="0.85" />
          <stop offset="1" stopColor="#1b1638" />
        </linearGradient>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.55" stopColor="#0d111a" stopOpacity="0" />
          <stop offset="1" stopColor="#0d111a" stopOpacity="0.55" />
        </linearGradient>
        <filter id="soft" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="28" />
        </filter>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      <rect width="1200" height="900" fill="url(#sky)" />
      <circle cx="620" cy="250" r="380" fill="url(#bloom)" />

      <g filter="url(#soft)">
        <path d="M-80 360 C 220 180 420 420 700 260 S 1120 120 1300 220" stroke="url(#aurora-teal)" strokeWidth="90" fill="none" />
        <path d="M-60 300 C 260 240 520 120 760 220 S 1080 360 1300 300" stroke="url(#aurora-violet)" strokeWidth="70" fill="none" />
        <path d="M200 480 C 420 380 640 520 900 400" stroke="url(#aurora-teal)" strokeWidth="50" fill="none" opacity="0.6" />
      </g>

      <g fill="#ffffff" filter="url(#glow)">
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} opacity={s.o} />
        ))}
      </g>

      <path d="M0 720 C 240 680 420 700 640 690 C 860 680 1020 700 1200 685 V900 H0Z" fill="url(#field)" />
      <g fill="#a99bf0">
        {flowers.map((f, i) => (
          <circle key={i} cx={f.x} cy={f.y} r={f.r} opacity={f.o} />
        ))}
      </g>

      <rect width="1200" height="900" fill="url(#fade)" />
    </svg>
  );
}
