// Admin sign-in helpers: Google ID-token check, Turnstile captcha, brute-force limit, DB sessions.
// Everything fails closed: a missing env var means the login is refused.
import { createHash, randomBytes } from "node:crypto";
import { pool } from "./db.js";

export const ADMIN_COOKIE = "bzr_admin";
export const SESSION_HOURS = 8;

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;

export function allowedAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

// Asks Google to check the ID token. Returns the verified email, or null.
export async function verifyGoogleIdToken(credential: string): Promise<{ email: string } | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return null;
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
  );
  if (!res.ok) return null;
  const j = (await res.json()) as {
    aud?: string;
    iss?: string;
    email?: string;
    email_verified?: string;
    exp?: string;
  };
  if (j.aud !== clientId) return null;
  if (j.iss !== "https://accounts.google.com" && j.iss !== "accounts.google.com") return null;
  if (j.email_verified !== "true" || !j.email) return null;
  if (Number(j.exp) * 1000 < Date.now()) return null;
  return { email: j.email.toLowerCase() };
}

// Cloudflare Turnstile: confirms a real person solved the captcha.
export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret || !token) return false;
  const body = new URLSearchParams({ secret, response: token, remoteip: ip });
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  const j = (await res.json()) as { success?: boolean };
  return j.success === true;
}

// Note: this counter lives in memory, so it resets when a serverless instance restarts.
const failures = new Map<string, { count: number; resetAt: number }>();

export function isBlocked(ip: string): boolean {
  const f = failures.get(ip);
  if (!f) return false;
  if (Date.now() > f.resetAt) {
    failures.delete(ip);
    return false;
  }
  return f.count >= MAX_FAILS;
}

export function recordFailure(ip: string) {
  const now = Date.now();
  const f = failures.get(ip);
  if (!f || now > f.resetAt) {
    failures.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    f.count++;
  }
}

export function clearFailures(ip: string) {
  failures.delete(ip);
}

const hash = (t: string) => createHash("sha256").update(t).digest("hex");

export async function createSession(email: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await pool.query(
    `INSERT INTO admin_sessions (token_hash, email, expires_at)
     VALUES ($1, $2, now() + make_interval(hours => $3::int))`,
    [hash(token), email, SESSION_HOURS],
  );
  return token;
}

export async function sessionEmail(token: string): Promise<string | null> {
  const { rows } = await pool.query<{ email: string }>(
    `SELECT email FROM admin_sessions WHERE token_hash = $1 AND expires_at > now()`,
    [hash(token)],
  );
  return rows[0]?.email ?? null;
}

export async function deleteSession(token: string) {
  await pool.query(`DELETE FROM admin_sessions WHERE token_hash = $1`, [hash(token)]);
}

export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}
