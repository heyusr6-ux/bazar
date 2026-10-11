// Seller sign-in: Google only. The Google email must match a seller row, and that seller must be active.
import { createHash, randomBytes } from "node:crypto";
import { pool } from "./db.js";

export const SELLER_COOKIE = "bzr_seller";
export const SELLER_SESSION_HOURS = 12;

const hash = (t: string) => createHash("sha256").update(t).digest("hex");

export async function sellerForEmail(email: string): Promise<{ id: string; name: string } | null> {
  const { rows } = await pool.query<{ id: string; name: string }>(
    `SELECT id, name FROM sellers WHERE lower(email) = $1 AND account_status = 'active'`,
    [email.toLowerCase()],
  );
  return rows[0] ?? null;
}

export async function startSellerSession(sellerId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await pool.query(
    `INSERT INTO seller_sessions (token_hash, seller_id, expires_at)
     VALUES ($1, $2, now() + make_interval(hours => $3::int))`,
    [hash(token), sellerId, SELLER_SESSION_HOURS],
  );
  return token;
}

// Returns the seller for a valid session, or null. Re-checks that the account is still active.
export async function sellerFromSession(token: string): Promise<{ id: string; name: string; kyc: string } | null> {
  const { rows } = await pool.query<{ id: string; name: string; kyc: string }>(
    `SELECT s.id, s.name, s.kyc_status AS kyc
       FROM seller_sessions ss JOIN sellers s ON s.id = ss.seller_id
      WHERE ss.token_hash = $1 AND ss.expires_at > now() AND s.account_status = 'active'`,
    [hash(token)],
  );
  return rows[0] ?? null;
}

export async function endSellerSession(token: string) {
  await pool.query(`DELETE FROM seller_sessions WHERE token_hash = $1`, [hash(token)]);
}
