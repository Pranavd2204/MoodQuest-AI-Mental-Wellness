import type { Request, Response } from "express";

import { currentUser } from "../middleware/auth.ts";
import { body } from "../middleware/validate.ts";
import type { loginBody, registerBody } from "../schemas/index.ts";
import * as authService from "../services/auth.service.ts";
import { serializeUser } from "../utils/serializers.ts";
import type { z } from "zod";

export async function register(req: Request, res: Response) {
  res.status(201).json(await authService.register(body<z.infer<typeof registerBody>>(req)));
}

export async function login(req: Request, res: Response) {
  const { email, password } = body<z.infer<typeof loginBody>>(req);
  res.json(await authService.login(email, password));
}

export async function logout(req: Request, res: Response) {
  await authService.logout(req.token!);
  res.json({ message: "Logged out" });
}

export function me(req: Request, res: Response) {
  res.json(serializeUser(currentUser(req)));
}
