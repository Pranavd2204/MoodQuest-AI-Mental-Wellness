import { config } from "dotenv";

export function useTestDatabase(): void {
  if (process.env.MOODQUEST_TEST_DB === "1") return;
  config({ quiet: true });
  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl) throw new Error("TEST_DATABASE_URL is not set (see backend/.env.example)");
  if (testUrl === process.env.DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL must be a different database from DATABASE_URL — tests wipe it.");
  }
  process.env.DATABASE_URL = testUrl;
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-secret-test-secret-test-secret-123";
  process.env.FRONTEND_URL = "http://localhost:5173";
  process.env.ASSISTANT_PROVIDER = "rule_based";
  delete process.env.GROQ_API_KEY;
  process.env.MOODQUEST_TEST_DB = "1";
}
