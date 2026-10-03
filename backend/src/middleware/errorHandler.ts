import type { NextFunction, Request, Response } from "express";
import multer from "multer";

import { Prisma } from "../generated/prisma/client.ts";
import { HttpError } from "../utils/httpError.ts";

const DB_UNAVAILABLE_CODES = new Set(["P1000", "P1001", "P1002", "P1008", "P1017", "P2024"]);

function isDatabaseUnavailable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError && DB_UNAVAILABLE_CODES.has(error.code)) return true;
  const text = String((error as { message?: string })?.message ?? "") + String((error as { cause?: unknown })?.cause ?? "");
  return /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|Connection terminated|database system is starting up/i.test(text);
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ detail: "Not found" });
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof HttpError) {
    if (error.headers) res.set(error.headers);
    res.status(error.status).json({ detail: error.detail, ...error.extra });
    return;
  }
  if (error instanceof multer.MulterError) {
    const tooLarge = error.code === "LIMIT_FILE_SIZE";
    res.status(tooLarge ? 413 : 400).json({ detail: tooLarge ? "Image must be smaller than 5 MB" : "Invalid upload" });
    return;
  }
  const type = (error as { type?: string })?.type;
  if (type === "entity.parse.failed") {
    res.status(400).json({ detail: "Request body is not valid JSON" });
    return;
  }
  if (type === "entity.too.large") {
    res.status(413).json({ detail: "Request body is too large" });
    return;
  }
  if (isDatabaseUnavailable(error)) {
    console.error("Database unavailable:", (error as Error)?.message);
    res.status(503).json({ detail: "The database is temporarily unavailable. Please try again shortly." });
    return;
  }
  console.error("Unhandled error:", error);
  res.status(500).json({ detail: "Something went wrong on our side. Please try again." });
}
