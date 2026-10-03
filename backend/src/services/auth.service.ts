import bcrypt from "bcryptjs";

import { env } from "../config/env.ts";
import { Prisma } from "../generated/prisma/client.ts";
import { prisma } from "../lib/prisma.ts";
import type { AccessTokenPayload } from "./token.service.ts";
import { createAccessToken } from "./token.service.ts";
import { badRequest, conflict, unauthorized } from "../utils/httpError.ts";
import { DEFAULT_NOTIFICATION_PREFERENCES, serializeUser } from "../utils/serializers.ts";
import { isValidTimeZone } from "../utils/time.ts";
import type { User } from "../generated/prisma/client.ts";

const BCRYPT_ROUNDS = env.isTest ? 4 : 12;
let dummyHash: string | null = null;

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_ROUNDS);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

function tokenResponse(user: User) {
  const { token, expiresAt } = createAccessToken(user.id);
  return { access_token: token, token_type: "bearer", expires_at: expiresAt, user: serializeUser(user) };
}

const DUPLICATE_EMAIL = "An account with this email already exists";

export async function register(input: { name: string; email: string; password: string; timezone?: string | null }) {
  if (await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } })) {
    throw conflict(DUPLICATE_EMAIL);
  }
  const timezone = input.timezone && isValidTimeZone(input.timezone) ? input.timezone : "UTC";
  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        profile: { create: { timezone, notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES } },
      },
    });
    return tokenResponse(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw conflict(DUPLICATE_EMAIL);
    throw error;
  }
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  dummyHash ??= await hashPassword("timing-equaliser-not-a-password");
  const valid = await verifyPassword(password, user?.passwordHash ?? dummyHash);
  if (!user || !valid) throw unauthorized("Incorrect email or password");
  return tokenResponse(user);
}

export async function logout(token: AccessTokenPayload) {
  await prisma.$transaction([
    prisma.revokedToken.upsert({
      where: { jti: token.jti },
      update: {},
      create: { jti: token.jti, expiresAt: new Date(token.exp * 1000) },
    }),
    prisma.revokedToken.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
  ]);
}

export async function changePassword(user: User, currentPassword: string, newPassword: string) {
  if (!(await verifyPassword(currentPassword, user.passwordHash))) throw badRequest("Current password is incorrect");
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } });
}
