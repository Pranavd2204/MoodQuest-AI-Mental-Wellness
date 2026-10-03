import { execSync } from "node:child_process";

import { useTestDatabase } from "./testEnv.ts";

export default function setup() {
  useTestDatabase();
  execSync("npx prisma migrate deploy", { stdio: "pipe", env: process.env });
}
