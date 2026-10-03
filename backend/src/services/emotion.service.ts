import { env } from "../config/env.ts";

export const ANALYSIS_UNAVAILABLE_MESSAGE =
  "YOLO11n emotion service is unavailable. Start the Python emotion service to enable camera analysis.";

export interface EmotionAnalysis {
  timestamp: number;
  dominant_emotion: string | null;
  confidence: number;
  emotions: { emotion: string; probability: number }[];
  face_detected: boolean;
  bbox: number[];
  num_faces: number;
  provider: string;
  saved_mood?: string | null;
}

export interface EmotionAnalyzer {
  name: string;
  analyze(image: Buffer, contentType: string): Promise<EmotionAnalysis>;
}

const serviceUrl = () => env.EMOTION_SERVICE_URL.replace(/\/$/, "");

export async function getEmotionAnalyzer(): Promise<EmotionAnalyzer> {
  return {
    name: "YOLO11n",
    async analyze(image, contentType) {
      const form = new FormData();
      form.append("image", new Blob([new Uint8Array(image)], { type: contentType }), "frame.jpg");
      const upstream = await fetch(`${serviceUrl()}/integration/analyze`, {
        method: "POST", body: form, signal: AbortSignal.timeout(15000),
      });
      if (!upstream.ok) {
        const detail = await upstream.text();
        throw new Error(`Emotion service returned ${upstream.status}: ${detail.slice(0, 300)}`);
      }
      return (await upstream.json()) as EmotionAnalysis;
    },
  };
}

export async function getStatus() {
  try {
    const response = await fetch(`${serviceUrl()}/health`, { signal: AbortSignal.timeout(2500) });
    if (!response.ok) throw new Error("Health check failed");
    const health = (await response.json()) as { model_loaded?: boolean };
    if (!health.model_loaded) throw new Error("YOLO11n model is not loaded");
    return { available: true, provider: "YOLO11n", message: "YOLO11n is connected. Camera frames are analyzed in real time." };
  } catch {
    return { available: false, provider: null, message: ANALYSIS_UNAVAILABLE_MESSAGE };
  }
}
