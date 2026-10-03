import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env.ts";
import { health } from "./controllers/system.controller.ts";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.ts";
import { apiRouter } from "./routes/index.ts";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", "loopback");

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: env.frontendOrigins,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Authorization", "Content-Type"],
    }),
  );
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", health);
  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
