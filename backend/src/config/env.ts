import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().default("http://localhost:5173"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long"),
  JWT_EXPIRES_IN_MINUTES: z.coerce.number().int().positive().default(60),

  EMERGENCY_NUMBER: z.string().default("112"),
  HELPLINE_NAME: z.string().default("Tele-MANAS National Mental Health Helpline"),
  HELPLINE_NUMBER: z.string().default("14416"),
  HELPLINE_AVAILABILITY: z.string().default("Available 24/7"),

  ASSISTANT_PROVIDER: z.enum(["rule_based", "groq"]).default("rule_based"),
  GROQ_API_KEY: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().trim().optional()),
  EMOTION_SERVICE_URL: z.string().url().default("http://127.0.0.1:8001"),
  GROQ_MODEL: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().trim().default("openai/gpt-oss-120b")),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const problems = parsed.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n");
  console.error(`Invalid environment configuration (see backend/.env.example):\n${problems}`);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  frontendOrigins: parsed.data.FRONTEND_URL.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  isTest: parsed.data.NODE_ENV === "test",
};
