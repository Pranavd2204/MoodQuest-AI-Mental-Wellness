import { randomUUID } from "node:crypto";

import jwt from "jsonwebtoken";

import { env } from "../config/env.ts";

export interface AccessTokenPayload {
  sub: string;
  jti: string;
  type: "access";
  iat: number;
  exp: number;
}

export function createAccessToken(userId: number): { token: string; expiresAt: Date } {
  const token = jwt.sign({ type: "access" }, env.JWT_SECRET, {
    algorithm: "HS256",
    subject: String(userId),
    jwtid: randomUUID().replace(/-/g, ""),
    expiresIn: env.JWT_EXPIRES_IN_MINUTES * 60,
  });
  const { exp } = jwt.decode(token) as AccessTokenPayload;
  return { token, expiresAt: new Date(exp * 1000) };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
  if (typeof payload === "string" || payload.type !== "access" || !payload.sub || !payload.jti || !payload.exp) {
    throw new jwt.JsonWebTokenError("Wrong token type");
  }
  return payload as AccessTokenPayload;
}
