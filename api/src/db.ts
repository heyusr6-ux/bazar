import pg from "pg";

// Neon connection string, e.g. postgresql://user:pass@ep-...neon.tech/neondb?sslmode=require
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set");
}

export const pool = new pg.Pool({
  connectionString: url,
  max: 5,
  ssl: { rejectUnauthorized: true },
});

// Runs fn inside one transaction. Throwing inside fn rolls everything back.
export async function withTx<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const out = await fn(c);
    await c.query("COMMIT");
    return out;
  } catch (err) {
    await c.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    c.release();
  }
}
