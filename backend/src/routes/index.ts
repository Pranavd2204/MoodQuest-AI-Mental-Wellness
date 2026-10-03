import { Router } from "express";

import { requireAuth } from "../middleware/auth.ts";
import { authRoutes } from "./auth.routes.ts";
import { chatRoutes } from "./chat.routes.ts";
import { activityRoutes, gameRoutes, recommendationRoutes } from "./content.routes.ts";
import { journalRoutes } from "./journal.routes.ts";
import { moodRoutes, progressRoutes } from "./mood.routes.ts";
import { emergencyRoutes, emotionRoutes } from "./system.routes.ts";
import { userRoutes } from "./user.routes.ts";

export const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/emergency", emergencyRoutes);
apiRouter.use("/emotion", emotionRoutes);

apiRouter.use("/users", requireAuth, userRoutes);
apiRouter.use("/mood", requireAuth, moodRoutes);
apiRouter.use("/progress", requireAuth, progressRoutes);
apiRouter.use("/chat", requireAuth, chatRoutes);
apiRouter.use("/recommendations", requireAuth, recommendationRoutes);
apiRouter.use("/games", requireAuth, gameRoutes);
apiRouter.use("/activities", requireAuth, activityRoutes);
apiRouter.use("/journal", requireAuth, journalRoutes);
