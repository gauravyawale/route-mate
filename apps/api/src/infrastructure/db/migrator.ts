import { Umzug } from "umzug";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import pool, { connectDB } from "./client.js";

// ─── Create migrations tracking table ─────────────────────
async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      name       VARCHAR(255) PRIMARY KEY,
      run_on     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

// ─── Get all applied migrations ────────────────────────────
async function getApplied(): Promise<string[]> {
  const result = await pool.query<{ name: string }>(
    "SELECT name FROM migrations ORDER BY name ASC",
  );
  return result.rows.map((r) => r.name);
}

// ─── Run a single migration file ──────────────────────────
async function runMigration(
  filepath: string,
  direction: "up" | "down",
): Promise<void> {
  const content = readFileSync(filepath, "utf-8");

  // Extract the correct section (up or down)
  const upMatch = content.match(/-- migrate:up([\s\S]*?)(?:-- migrate:down|$)/);
  const downMatch = content.match(/-- migrate:down([\s\S]*)$/);

  const sql =
    direction === "up" ? upMatch?.[1]?.trim() : downMatch?.[1]?.trim();

  if (!sql) throw new Error(`No ${direction} migration found in ${filepath}`);

  await pool.query(sql);
}

// ─── Main migrator ─────────────────────────────────────────
async function migrate(direction: "up" | "down" = "up"): Promise<void> {
  await connectDB();
  await ensureMigrationsTable();

  const migrationsDir = resolve("./src/infrastructure/db/migrations");

  // Get all .sql files sorted by name (001, 002, 003...)
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const applied = await getApplied();

  if (direction === "up") {
    // Run migrations not yet applied
    const pending = files.filter((f) => !applied.includes(f));

    if (pending.length === 0) {
      console.log("✅ No pending migrations");
      return;
    }

    for (const file of pending) {
      const filepath = resolve(migrationsDir, file);
      console.log(`⬆️  Running migration: ${file}`);
      await runMigration(filepath, "up");
      await pool.query("INSERT INTO migrations (name) VALUES ($1)", [file]);
      console.log(`✅ Applied: ${file}`);
    }
  }

  if (direction === "down") {
    // Roll back the last applied migration
    const last = applied[applied.length - 1];
    if (!last) {
      console.log("✅ No migrations to roll back");
      return;
    }

    const filepath = resolve(migrationsDir, last);
    console.log(`⬇️  Rolling back: ${last}`);
    await runMigration(filepath, "down");
    await pool.query("DELETE FROM migrations WHERE name = $1", [last]);
    console.log(`✅ Rolled back: ${last}`);
  }

  await pool.end();
}

// ─── Entry point ───────────────────────────────────────────
const direction = (process.argv[2] as "up" | "down") ?? "up";
migrate(direction).catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
