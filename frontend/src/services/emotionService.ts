import { api } from "@/lib/api";
import type { EmotionAnalysis, EmotionStatus } from "@/types";

export const emotionService = {
  async getStatus(): Promise<EmotionStatus> {
    const { data } = await api.get<EmotionStatus>("/api/emotion/status");
    return data;
  },
  async analyzeFrame(frame: Blob): Promise<EmotionAnalysis> {
    const form = new FormData();
    form.append("image", frame, "frame.jpg");
    const { data } = await api.post<EmotionAnalysis>("/api/emotion/analyze", form, { timeout: 20000 });
    return data;
  },
};
