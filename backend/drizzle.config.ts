// backend/drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import { config as load } from "dotenv";
import { resolve } from "node:path";

// 1) Base .env > 2) .env.local overrides
load({ path: resolve(__dirname, ".env"), override: false });
load({ path: resolve(__dirname, ".env.local"), override: true });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set for drizzle");
console.log("[drizzle] DATABASE_URL =", url.replace(/:[^@]+@/, "://***:***@"));

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: { url },
});