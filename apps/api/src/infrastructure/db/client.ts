import { Pool, PoolClient } from "pg";
import { config } from "../../config/index.js";

// ─── Connection Pool ───────────────────────────────────────
// A pool maintains multiple DB connections ready to use
// Instead of opening/closing a connection per request (slow)
// the pool reuses existing connections (fast)
const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 20, // maximum connections in pool
  idleTimeoutMillis: 30000, // close idle connections after 30s
  connectionTimeoutMillis: 2000, // fail if can't connect in 2s
});

// Log when pool has issues — you want to know immediately
pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err);
  process.exit(1);
});

// ─── Typed Query Helpers ───────────────────────────────────
// These wrap pool.query with TypeScript generics
// So every query result is typed, not just `any`

/**
 * Execute a query, return all rows
 * Use for: SELECT queries returning multiple rows
 */
export async function query<T = any>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

/**
 * Execute a query, return first row or null
 * Use for: SELECT by ID, find one record
 */
export async function queryOne<T = any>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const result = await pool.query(text, params);
  return (result.rows[0] ?? null) as T | null;
}

/**
 * Execute a query, return row count affected
 * Use for: UPDATE, DELETE where you need to know rows affected
 */
export async function execute(
  text: string,
  params?: unknown[],
): Promise<number> {
  const result = await pool.query(text, params);
  return result.rowCount ?? 0;
}

/**
 * Run multiple queries in a transaction
 * Use for: operations that must all succeed or all fail
 * Example: confirm booking + decrement seats (must be atomic)
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release(); // always return client to pool
  }
}

/**
 * Test the connection on startup
 * Called from app.ts to verify DB is reachable before accepting requests
 */
export async function connectDB(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    console.log("✅ PostgreSQL connected");
  } finally {
    client.release();
  }
}

export default pool;
