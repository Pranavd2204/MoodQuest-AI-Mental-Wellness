import { Router } from "express";
import multer from "multer";

import * as system from "../controllers/system.controller.ts";
import { requireAuth } from "../middleware/auth.ts";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } });

export const emotionRoutes = Router();

emotionRoutes.use(requireAuth);
emotionRoutes.get("/status", system.emotionStatus);
emotionRoutes.post("/analyze", imageUpload.single("image"), system.analyzeEmotion);

export const emergencyRoutes = Router();

emergencyRoutes.get("/resources", system.emergencyResources);
