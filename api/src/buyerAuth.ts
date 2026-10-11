// Buyer sign-in: Google only for now. Google has already verified the email.
import { createHash, randomBytes } from "node:crypto";
import { pool } from "./db.js";

export const BUYER_COOKIE = "bzr_buyer";
export const BUYER_SESSION_DAYS = 30;

const hash = (t: string) => createHash("sha256").update(t).digest("hex");

// Creates the buyer if new, then starts a session. Returns the session token.
export async function signInBuyer(email: string, name: string): Promise<{ token: string; id: string }> {
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO buyers (id, email, name) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [randomBytes(12).toString("hex"), email, name],
  );
  const id = rows[0].id;
  const token = randomBytes(32).toString("base64url");
  await pool.query(
    `INSERT INTO buyer_sessions (token_hash, buyer_id, expires_at)
     VALUES ($1, $2, now() + make_interval(days => $3::int))`,
    [hash(token), id, BUYER_SESSION_DAYS],
  );
  return { token, id };
}

export async function buyerFromSession(token: string): Promise<{ email: string; name: string } | null> {
  const { rows } = await pool.query<{ email: string; name: string }>(
    `SELECT b.email, b.name FROM buyer_sessions s JOIN buyers b ON b.id = s.buyer_id
      WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [hash(token)],
  );
  return rows[0] ?? null;
}

export async function deleteBuyerSession(token: string) {
  await pool.query(`DELETE FROM buyer_sessions WHERE token_hash = $1`, [hash(token)]);
}
