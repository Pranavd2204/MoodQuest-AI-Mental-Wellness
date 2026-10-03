import rateLimit from "express-rate-limit";

import { env } from "../config/env.ts";

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: () => env.isTest,
  message: { detail: "Too many attempts. Please wait a few minutes and try again." },
});
