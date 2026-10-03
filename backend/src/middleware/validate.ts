import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";

import { HttpError } from "../utils/httpError.ts";

interface Schemas {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
}

declare global {
  namespace Express {
    interface Request {
      valid: { body?: unknown; query?: unknown; params?: unknown };
    }
  }
}

function friendlyField(path: PropertyKey[]): string {
  const field = path.filter((part) => typeof part === "string").join(".");
  return field ? field.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : "";
}

export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.valid = {};
    for (const part of ["params", "query", "body"] as const) {
      const schema = schemas[part];
      if (!schema) continue;
      const result = schema.safeParse(req[part] ?? {});
      if (!result.success) {
        const errors = result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        const first = result.error.issues[0];
        const field = friendlyField(first.path);
        throw new HttpError(422, field ? `${field}: ${first.message}` : first.message, { extra: { errors } });
      }
      req.valid[part] = result.data;
    }
    next();
  };
}

export const body = <T>(req: Request) => req.valid.body as T;
export const query = <T>(req: Request) => req.valid.query as T;
export const params = <T>(req: Request) => req.valid.params as T;
