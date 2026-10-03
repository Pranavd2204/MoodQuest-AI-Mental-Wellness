import { Router } from "express";

import * as auth from "../controllers/auth.controller.ts";
import { requireAuth } from "../middleware/auth.ts";
import { authRateLimit } from "../middleware/rateLimit.ts";
import { validate } from "../middleware/validate.ts";
import { loginBody, registerBody } from "../schemas/index.ts";

export const authRoutes = Router();

authRoutes.post("/register", authRateLimit, validate({ body: registerBody }), auth.register);
authRoutes.post("/login", authRateLimit, validate({ body: loginBody }), auth.login);
authRoutes.post("/logout", requireAuth, auth.logout);
authRoutes.get("/me", requireAuth, auth.me);
