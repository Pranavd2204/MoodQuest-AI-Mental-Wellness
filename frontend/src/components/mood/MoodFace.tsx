import type { Mood } from "@/types";
import { MOOD_BY_KEY } from "@/utils/moods";

interface MoodFaceProps {
  mood: Mood;
  className?: string;
  filled?: boolean;
}

export function MoodFace({ mood, className, filled }: MoodFaceProps) {
  const color = MOOD_BY_KEY[mood].color;
  const stroke = filled ? "#0b1129" : color;
  const common = { stroke, strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };

  return (
    <svg viewBox="0 0 40 40" className={className} role="img" aria-label={MOOD_BY_KEY[mood].label}>
      <circle cx="20" cy="20" r="17" stroke={color} strokeWidth="2.2" fill={filled ? color : "none"} />
      {mood === "happy" && (
        <>
          <circle cx="14" cy="16" r="1.8" fill={stroke} />
          <circle cx="26" cy="16" r="1.8" fill={stroke} />
          <path d="M12.5 23c2 4 5 5.5 7.5 5.5s5.5-1.5 7.5-5.5" {...common} />
        </>
      )}
      {mood === "calm" && (
        <>
          <path d="M11.5 17c1.5-1.8 3.5-1.8 5 0" {...common} />
          <path d="M23.5 17c1.5-1.8 3.5-1.8 5 0" {...common} />
          <path d="M14 24.5c2 2.2 4 3 6 3s4-.8 6-3" {...common} />
        </>
      )}
      {mood === "stressed" && (
        <>
          <path d="M12 15l4 2-4 2" {...common} />
          <path d="M28 15l-4 2 4 2" {...common} />
          <path d="M13 27l2.3-2 2.3 2 2.4-2 2.4 2 2.3-2 2.3 2" {...common} />
        </>
      )}
      {mood === "sad" && (
        <>
          <circle cx="14" cy="17" r="1.8" fill={stroke} />
          <circle cx="26" cy="17" r="1.8" fill={stroke} />
          <path d="M13.5 28c2-3 4.3-4 6.5-4s4.5 1 6.5 4" {...common} />
        </>
      )}
      {mood === "angry" && (
        <>
          <path d="M11 13.5l6 2.5" {...common} />
          <path d="M29 13.5l-6 2.5" {...common} />
          <circle cx="15" cy="19" r="1.6" fill={stroke} />
          <circle cx="25" cy="19" r="1.6" fill={stroke} />
          <path d="M14 28c1.8-2 3.8-3 6-3s4.2 1 6 3" {...common} />
        </>
      )}
      {mood === "anxious" && (
        <>
          <circle cx="14" cy="16.5" r="2.6" {...common} strokeWidth={1.8} />
          <circle cx="26" cy="16.5" r="2.6" {...common} strokeWidth={1.8} />
          <ellipse cx="20" cy="26.5" rx="3" ry="2.2" {...common} />
        </>
      )}
    </svg>
  );
}
