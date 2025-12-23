// backend/drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import { config as load } from "dotenv";
import { resolve } from "node:path";

// =============================================================================
// ENV RESOLUTION (Safe Order)
// =============================================================================
// Priority: 1) Explicit shell export  2) .env.local  3) .env
// NEVER use override:true which can silently replace shell-exported values.
// =============================================================================

// Check if DATABASE_URL was already set (e.g., via shell export)
const shellUrl = process.env.DATABASE_URL;

// Load .env first (base config), then .env.local (local overrides)
// Both use override:false so they won't clobber shell-exported vars
load({ path: resolve(__dirname, ".env"), override: false });
load({ path: resolve(__dirname, ".env.local"), override: false });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL not set for drizzle.\n" +
    "Fix: export DATABASE_URL=\"postgresql://postgres:postgres@localhost:5433/akis_v2\"\n" +
    "Or: Ensure backend/.env or backend/.env.local has DATABASE_URL set."
  );
}

// =============================================================================
// PORT MISMATCH GUARD (Dev Safety)
// =============================================================================
// scripts/db-up.sh starts Postgres on port 5433.
// If DATABASE_URL points to 5432, migrations will silently go to wrong DB.
// =============================================================================
const urlLower = url.toLowerCase();
if (urlLower.includes("localhost:5432") || urlLower.includes("127.0.0.1:5432")) {
  console.error("\n" + "=".repeat(72));
  console.error("⚠️  WARNING: DATABASE_URL uses port 5432, but db-up.sh uses 5433!");
  console.error("=".repeat(72));
  console.error("This may cause migrations to run against the WRONG database.\n");
  console.error("Current DATABASE_URL:", url.replace(/:[^@]+@/, "://***:***@"));
  console.error("\nFix options:");
  console.error("  1) export DATABASE_URL=\"postgresql://postgres:postgres@localhost:5433/akis_v2\"");
  console.error("  2) Update backend/.env.local to use port 5433");
  console.error("  3) Run: sed -i '' 's/5432/5433/g' backend/.env.local");
  console.error("=".repeat(72) + "\n");
  
  // In strict mode, fail fast. For now, just warn loudly.
  // Uncomment next line to enforce:
  // throw new Error("DATABASE_URL port mismatch. See warning above.");
}

// Log resolved URL (masked)
const source = shellUrl ? "(from shell export)" : "(from .env file)";
console.log(`[drizzle] DATABASE_URL ${source} =`, url.replace(/:[^@]+@/, "://***:***@"));

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: { url },
});
