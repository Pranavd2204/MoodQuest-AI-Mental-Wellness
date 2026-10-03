import type { Request, Response } from "express";

import { env } from "../config/env.ts";
import { prisma } from "../lib/prisma.ts";
import { currentUser } from "../middleware/auth.ts";
import * as emotionService from "../services/emotion.service.ts";
import { createMood } from "../services/mood.service.ts";
import type { Mood } from "../utils/moods.ts";
import { HttpError } from "../utils/httpError.ts";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const expressionToMood: Record<string, Mood> = {
  happy: "happy", natural: "calm", sleepy: "calm", sad: "sad", angry: "angry",
  fear: "anxious", surprised: "anxious", disgust: "stressed", contempt: "stressed",
};

export async function emotionStatus(_req: Request, res: Response) {
  res.json(await emotionService.getStatus());
}

export async function analyzeEmotion(req: Request, res: Response) {
  const image = req.file;
  if (!image) throw new HttpError(422, "Image: an image file is required");
  if (!ALLOWED_IMAGE_TYPES.has(image.mimetype)) throw new HttpError(415, "Image must be JPEG, PNG or WebP");
  if (!image.size) throw new HttpError(400, "Image is empty");

  const analyzer = await emotionService.getEmotionAnalyzer();
  if (!analyzer) throw new HttpError(503, emotionService.ANALYSIS_UNAVAILABLE_MESSAGE);
  let result;
  try {
    result = await analyzer.analyze(image.buffer, image.mimetype);
  } catch {
    throw new HttpError(503, "The YOLO11n service could not analyze this frame. Check that the Python service is running.");
  }

  // Persist only periodic camera observations; never write one row per video frame.
  let savedMood: Mood | null = null;
  const userId = currentUser(req).id;
  const expression = result.dominant_emotion?.toLowerCase();
  const mappedMood = expression ? expressionToMood[expression] : undefined;
  if (result.face_detected && mappedMood && result.confidence >= 0.5) {
    const cutoff = new Date(Date.now() - 30_000);
    const recentCameraLog = await prisma.moodLog.findFirst({
      where: { userId, source: "camera", createdAt: { gte: cutoff } },
      orderBy: { createdAt: "desc" },
    });
    if (!recentCameraLog) {
      const confidence = Math.round(result.confidence * 100);
      await createMood(userId, mappedMood,
        `Observed facial expression: ${expression} (${confidence}% model confidence). This is not a clinical assessment.`, "camera");
      savedMood = mappedMood;
    }
  }
  res.json({ ...result, saved_mood: savedMood });
}

export function emergencyResources(_req: Request, res: Response) {
  res.json({
    emergency_number: env.EMERGENCY_NUMBER,
    helplines: [{ name: env.HELPLINE_NAME, number: env.HELPLINE_NUMBER, availability: env.HELPLINE_AVAILABILITY }],
    disclaimer: "MoodQuest is a wellness companion, not a medical or crisis service. If you or someone else is in danger, call your local emergency number now.",
  });
}

export async function health(_req: Request, res: Response) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "ok" });
  } catch {
    res.status(503).json({ status: "degraded", database: "unavailable" });
  }
}
