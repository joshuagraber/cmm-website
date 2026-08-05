import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";

let cachedDb: ReturnType<typeof drizzle<typeof schema>> | null = null;
let cachedClient: ReturnType<typeof postgres> | null = null;

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for database-backed operations.");
  }

  if (!cachedDb) {
    cachedClient = postgres(databaseUrl, {
      max: 3,
      prepare: false,
    });
    cachedDb = drizzle(cachedClient, { schema });
  }

  return cachedDb;
}
