import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { prisma } from "../lib/prisma.ts";
import { verifyAccessToken, type AccessTokenPayload } from "../services/token.service.ts";
import { unauthorized } from "../utils/httpError.ts";
import type { Profile, User } from "../generated/prisma/client.ts";

export type AuthUser = User & { profile: Profile | null };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      token?: AccessTokenPayload;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) throw unauthorized("Not authenticated");

  let payload: AccessTokenPayload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) throw unauthorized("Session expired. Please log in again.");
    throw unauthorized("Invalid authentication token");
  }

  const revoked = await prisma.revokedToken.findUnique({ where: { jti: payload.jti }, select: { id: true } });
  if (revoked) throw unauthorized("Session has been logged out. Please log in again.");

  const userId = Number(payload.sub);
  if (!Number.isInteger(userId)) throw unauthorized("Invalid authentication token");

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
  if (!user) throw unauthorized("User no longer exists");

  req.user = user;
  req.token = payload;
  next();
}

export function currentUser(req: Request): AuthUser {
  if (!req.user) throw unauthorized("Not authenticated");
  return req.user;
}
