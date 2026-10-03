import { createApp } from "./app.ts";
import { env } from "./config/env.ts";
import { prisma } from "./lib/prisma.ts";
import { seedCatalog } from "./services/catalog.service.ts";

try {
  await seedCatalog(prisma);
} catch (error) {
  console.warn("Catalog seeding skipped:", (error as Error).message.split("\n")[0]);
}

const server = createApp().listen(env.PORT, () => {
  console.log(`MoodQuest API listening on http://localhost:${env.PORT} (CORS: ${env.frontendOrigins.join(", ")})`);
});

async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down…`);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
