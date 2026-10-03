import { Brain, Flower2, Palette, Puzzle, Sparkles, Sprout, type LucideIcon } from "lucide-react";

export interface GameVisual {
  icon: LucideIcon;
  gradient: string;
  glow: string;
}

export const GAME_VISUALS: Record<string, GameVisual> = {
  "breathing-flow": { icon: Flower2, gradient: "linear-gradient(145deg, #0f766e, #14b8a6 55%, #5eead4)", glow: "#2dd4bf" },
  "color-match": { icon: Palette, gradient: "linear-gradient(145deg, #c2410c, #f97316 55%, #fdba74)", glow: "#fb923c" },
  "memory-challenge": { icon: Brain, gradient: "linear-gradient(145deg, #6d28d9, #8b5cf6 55%, #c4b5fd)", glow: "#a78bfa" },
  "zen-garden": { icon: Sprout, gradient: "linear-gradient(145deg, #92400e, #d97706 55%, #fcd34d)", glow: "#fbbf24" },
  "stress-burst": { icon: Sparkles, gradient: "linear-gradient(145deg, #1d4ed8, #3b82f6 55%, #93c5fd)", glow: "#60a5fa" },
  "puzzle-mind": { icon: Puzzle, gradient: "linear-gradient(145deg, #be123c, #f43f5e 55%, #fda4af)", glow: "#fb7185" },
};

export const DEFAULT_VISUAL: GameVisual = {
  icon: Sparkles,
  gradient: "linear-gradient(145deg, #4338ca, #6366f1 55%, #a5b4fc)",
  glow: "#818cf8",
};
