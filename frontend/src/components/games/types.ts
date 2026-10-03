export interface GameResult {
  score: number;
  duration: number;
}

export interface GameProps {
  onFinish: (result: GameResult) => void;
}

export function secondsSince(start: number): number {
  return Math.max(1, Math.round((Date.now() - start) / 1000));
}
