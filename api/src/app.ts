import express from "express";
import cors from "cors";
import { randomBytes } from "node:crypto";
import type pg from "pg";
import { pool, withTx } from "./db.js";
import {
  SELLER_COOKIE, SELLER_SESSION_HOURS, sellerForEmail, startSellerSession, sellerFromSession, endSellerSession,
} from "./sellerAuth.js";
import {
  BUYER_COOKIE, BUYER_SESSION_DAYS, signInBuyer, buyerFromSession, deleteBuyerSession,
} from "./buyerAuth.js";
import {
  ADMIN_COOKIE, SESSION_HOURS, allowedAdminEmails, verifyGoogleIdToken, verifyTurnstile,
  isBlocked, recordFailure, clearFailures, createSession, sessionEmail, deleteSession, readCookie,
} from "./adminAuth.js";

const COD_LIMIT = 25000;
const PHONE_RE = /^01[3-9]\d{8}$/;
const KYC_VALUES = ["pending", "approved", "sent_back", "rejected"];
const ACCOUNT_VALUES = ["active", "suspended"];

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type ProductRow = {
  slug: string;
  name: string;
  price_taka: number;
  stock: number;
  seller_id: string;
  status: string;
  category?: string;
  description?: string;
  old_price_taka?: number | null;
  tone?: string;
  seller_name?: string;
  image_count?: number;
};

type SellerRow = {
  id: string;
  name: string;
  kyc_status: string;
  account_status: string;
  area?: string;
  product_count?: number;
};

const toProduct = (r: ProductRow) => ({
  slug: r.slug,
  name: r.name,
  price: r.price_taka,
  oldPrice: r.old_price_taka ?? undefined,
  stock: r.stock,
  sellerId: r.seller_id,
  seller: r.seller_name ?? "",
  category: r.category ?? "General",
  description: r.description ?? "",
  tone: r.tone ?? "#E9EEEC",
  imageCount: r.image_count ?? 0,
  status: r.status,
});

const toSeller = (r: SellerRow) => ({
  id: r.id,
  name: r.name,
  kyc: r.kyc_status,
  status: r.account_status,
  area: r.area ?? "",
  productCount: r.product_count ?? 0,
});

function newOrderId() {
  return "BZ-" + Date.now().toString(36).toUpperCase() + randomBytes(2).toString("hex").toUpperCase();
}

async function audit(
  c: pg.PoolClient,
  e: { actor: string; action: string; target: string; reason: string; before?: string; after?: string },
) {
  await c.query(
    `INSERT INTO audit_log (actor, action, target, reason, before_value, after_value)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [e.actor, e.action, e.target, e.reason, e.before ?? null, e.after ?? null],
  );
}

const app = express();

// Only the buyer and seller front ends may call this API.
const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((s) => s.trim());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "4mb" }));

// Admin routes need a valid session cookie AND an email still on the ADMIN_EMAILS list.
async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const token = readCookie(req.headers.cookie, ADMIN_COOKIE);
    const email = token ? await sessionEmail(token) : null;
    if (!email || !allowedAdminEmails().includes(email)) {
      return res.status(401).json({ error: "Unauthorised" });
    }
    next();
  } catch (err) {
    next(err);
  }
}

// Express 4 does not catch promise rejections, so route handlers go through this.
const wrap =
  (fn: (req: express.Request, res: express.Response) => Promise<void>): express.RequestHandler =>
  (req, res, next) => {
    fn(req, res).catch(next);
  };

app.get("/health", wrap(async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ ok: true, time: new Date().toISOString() });
}));

// ---- public catalogue ----
app.get("/api/products", wrap(async (_req, res) => {
  const { rows } = await pool.query<ProductRow>(
    `SELECT p.slug, p.name, p.price_taka, p.stock, p.seller_id, p.status,
            p.category, p.description, p.old_price_taka, p.tone, s.name AS seller_name,
            (SELECT count(*)::int FROM product_images i WHERE i.product_slug = p.slug) AS image_count
       FROM products p JOIN sellers s ON s.id = p.seller_id
      WHERE p.status = 'live' ORDER BY p.name`,
  );
  res.json(rows.map(toProduct));
}));

app.get("/api/products/:slug", wrap(async (req, res) => {
  const { rows } = await pool.query<ProductRow>(
    `SELECT p.slug, p.name, p.price_taka, p.stock, p.seller_id, p.status,
            p.category, p.description, p.old_price_taka, p.tone, s.name AS seller_name,
            (SELECT count(*)::int FROM product_images i WHERE i.product_slug = p.slug) AS image_count
       FROM products p JOIN sellers s ON s.id = p.seller_id
      WHERE p.slug = $1 AND p.status = 'live'`,
    [req.params.slug],
  );
  if (!rows[0]) throw new HttpError(404, "Product not found");
  res.json(toProduct(rows[0]));
}));

// ---- product photos (stored in the database, served with long cache) ----
app.get("/api/products/:slug/images/:pos", wrap(async (req, res) => {
  const { rows } = await pool.query<{ mime: string; data: Buffer }>(
    `SELECT i.mime, i.data FROM product_images i JOIN products p ON p.slug = i.product_slug
      WHERE i.product_slug = $1 AND i.position = $2 AND p.status = 'live'`,
    [req.params.slug, Number(req.params.pos)],
  );
  const img = rows[0];
  if (!img) throw new HttpError(404, "Image not found");
  res.setHeader("Content-Type", img.mime);
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(img.data);
}));

// ---- orders (COD only for now) ----
app.post("/api/orders", wrap(async (req, res) => {
  const { phone, address, items } = req.body ?? {};
  if (typeof phone !== "string" || !PHONE_RE.test(phone)) throw new HttpError(400, "Invalid phone");
  if (typeof address !== "string" || address.trim().length < 10) throw new HttpError(400, "Address too short");
  if (!Array.isArray(items) || items.length === 0) throw new HttpError(400, "Cart is empty");

  const wanted = new Map<string, number>();
  for (const it of items) {
    const slug = typeof it?.slug === "string" ? it.slug : "";
    const qty = Number(it?.qty);
    if (!slug) throw new HttpError(400, "Invalid item");
    if (!Number.isInteger(qty) || qty < 1) throw new HttpError(400, "Invalid quantity");
    if (wanted.has(slug)) throw new HttpError(400, "Duplicate item in cart");
    wanted.set(slug, qty);
  }

  const order = await withTx(async (c) => {
    // Lock the product rows so two buyers cannot oversell the same stock.
    const { rows } = await c.query<ProductRow>(
      `SELECT slug, name, price_taka, stock, seller_id, status
         FROM products WHERE slug = ANY($1::text[]) FOR UPDATE`,
      [[...wanted.keys()]],
    );
    const bySlug = new Map(rows.map((r) => [r.slug, r]));

    let total = 0;
    const lines: { slug: string; qty: number; unitPrice: number }[] = [];
    for (const [slug, qty] of wanted) {
      const p = bySlug.get(slug);
      if (!p || p.status !== "live") throw new HttpError(400, `Product not available: ${slug}`);
      if (qty > p.stock) throw new HttpError(409, `Only ${p.stock} left for ${p.name}`);
      total += qty * p.price_taka;
      lines.push({ slug, qty, unitPrice: p.price_taka });
    }
    const lim = await c.query<{ value: number }>(`SELECT value FROM business_rules WHERE key = 'cod_limit_taka'`);
    const codLimit = lim.rows[0]?.value ?? COD_LIMIT;
    if (total > codLimit) {
      throw new HttpError(400, `Cash on delivery is limited to ৳ ${codLimit.toLocaleString("en-US")}`);
    }

    const id = newOrderId();
    await c.query(
      `INSERT INTO orders (id, buyer_phone, address, total_taka) VALUES ($1, $2, $3, $4)`,
      [id, phone, address.trim(), total],
    );
    for (const l of lines) {
      await c.query(
        `INSERT INTO order_items (order_id, product_slug, qty, unit_price_taka) VALUES ($1, $2, $3, $4)`,
        [id, l.slug, l.qty, l.unitPrice],
      );
      await c.query(
        `UPDATE products SET stock = stock - $1, updated_at = now() WHERE slug = $2`,
        [l.qty, l.slug],
      );
    }
    return { id, total };
  });

  res.status(201).json({ id: order.id, total: order.total, status: "placed" });
}));

// ---- admin sign-in (Google + Turnstile) ----
// Every failure returns the same message, so nobody can tell which email is allowed.
app.post("/api/admin/auth/login", wrap(async (req, res) => {
  const ip = req.ip ?? "unknown";
  if (isBlocked(ip)) throw new HttpError(429, "Too many attempts. Try again later.");

  const { credential, turnstileToken } = req.body ?? {};
  const captchaOk = typeof turnstileToken === "string" && (await verifyTurnstile(turnstileToken, ip));
  const g = typeof credential === "string" ? await verifyGoogleIdToken(credential) : null;
  const allowed = !!g && allowedAdminEmails().includes(g.email);
  const ok = captchaOk && !!g && allowed;

  await withTx((c) =>
    audit(c, {
      actor: g?.email ?? "unknown",
      action: "admin_login",
      target: "admin panel",
      reason: "Admin sign-in attempt via Google",
      after: ok ? "success" : "failed",
    }),
  );

  if (!captchaOk || !g || !allowed) {
    recordFailure(ip);
    throw new HttpError(401, "Login failed");
  }
  clearFailures(ip);

  const token = await createSession(g.email);
  res.setHeader(
    "Set-Cookie",
    `${ADMIN_COOKIE}=${token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${SESSION_HOURS * 3600}`,
  );
  res.json({ ok: true });
}));

app.get("/api/admin/auth/me", requireAdmin, wrap(async (req, res) => {
  const token = readCookie(req.headers.cookie, ADMIN_COOKIE)!;
  res.json({ email: await sessionEmail(token) });
}));

app.post("/api/admin/auth/logout", wrap(async (req, res) => {
  const token = readCookie(req.headers.cookie, ADMIN_COOKIE);
  if (token) await deleteSession(token);
  res.setHeader("Set-Cookie", `${ADMIN_COOKIE}=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0`);
  res.json({ ok: true });
}));

// ---- admin ----
app.get("/api/admin/sellers", requireAdmin, wrap(async (_req, res) => {
  const { rows } = await pool.query<SellerRow>(
    `SELECT s.id, s.name, s.kyc_status, s.account_status, s.area,
            (SELECT count(*)::int FROM products p WHERE p.seller_id = s.id AND p.status <> 'removed') AS product_count
       FROM sellers s ORDER BY s.id`,
  );
  res.json(rows.map(toSeller));
}));

app.patch("/api/admin/sellers/:id", requireAdmin, wrap(async (req, res) => {
  const { status, kyc, reason } = req.body ?? {};
  if (typeof reason !== "string" || reason.trim().length < 10) {
    throw new HttpError(400, "Reason is required (10+ characters)");
  }
  if (status !== undefined && !ACCOUNT_VALUES.includes(status)) throw new HttpError(400, "Invalid status");
  if (kyc !== undefined && !KYC_VALUES.includes(kyc)) throw new HttpError(400, "Invalid KYC value");

  const seller = await withTx(async (c) => {
    const { rows } = await c.query<SellerRow>(
      `SELECT id, name, kyc_status, account_status FROM sellers WHERE id = $1 FOR UPDATE`,
      [req.params.id],
    );
    const cur = rows[0];
    if (!cur) throw new HttpError(404, "Seller not found");

    const nextKyc = kyc ?? cur.kyc_status;
    const nextStatus = status ?? cur.account_status;
    await c.query(
      `UPDATE sellers SET kyc_status = $2, account_status = $3 WHERE id = $1`,
      [cur.id, nextKyc, nextStatus],
    );
    // Same transaction as the change, so an action can never happen without its audit row.
    await audit(c, {
      actor: "admin",
      action: "update_seller",
      target: cur.name,
      reason: reason.trim(),
      before: `${cur.kyc_status}/${cur.account_status}`,
      after: `${nextKyc}/${nextStatus}`,
    });
    return toSeller({ ...cur, kyc_status: nextKyc, account_status: nextStatus });
  });

  res.json(seller);
}));

// Admin product list (all statuses). Used to hide or remove listings.
app.get("/api/admin/products", requireAdmin, wrap(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT p.slug, p.name, p.price_taka, p.stock, p.status, p.seller_id, s.name AS seller_name
       FROM products p JOIN sellers s ON s.id = p.seller_id ORDER BY p.name`,
  );
  res.json(
    rows.map((r) => ({
      slug: r.slug,
      name: r.name,
      price: r.price_taka,
      stock: r.stock,
      status: r.status,
      sellerId: r.seller_id,
      sellerName: r.seller_name,
    })),
  );
}));

// Admin changes a listing: live, hidden or removed. Products are never deleted,
// because past orders point to them. Every change needs a reason and an audit row.
app.patch("/api/admin/products/:slug", requireAdmin, wrap(async (req, res) => {
  const { status, reason } = req.body ?? {};
  if (typeof reason !== "string" || reason.trim().length < 10) {
    throw new HttpError(400, "Reason is required (10+ characters)");
  }
  if (!["live", "hidden", "removed"].includes(status)) throw new HttpError(400, "Invalid status");

  const product = await withTx(async (c) => {
    const { rows } = await c.query<ProductRow>(
      `SELECT slug, name, price_taka, stock, seller_id, status FROM products WHERE slug = $1 FOR UPDATE`,
      [req.params.slug],
    );
    const cur = rows[0];
    if (!cur) throw new HttpError(404, "Product not found");
    await c.query(`UPDATE products SET status = $2, updated_at = now() WHERE slug = $1`, [cur.slug, status]);
    await audit(c, {
      actor: "admin",
      action: "update_product",
      target: cur.name,
      reason: reason.trim(),
      before: cur.status,
      after: status,
    });
    return toProduct({ ...cur, status });
  });

  res.json(product);
}));

// ---- business rules (values stored in the database, every change audited) ----
// Allowed ranges per rule. Anything outside is refused.
const RULE_LIMITS: Record<string, [number, number]> = {
  commission_percent: [0, 30],
  max_seller_coupon_percent: [0, 50],
  return_window_days: [0, 30],
  cod_limit_taka: [1000, 100000],
  second_approval_above_taka: [1000, 1000000],
  kyc_sla_working_days: [1, 10],
};

app.get("/api/admin/rules", requireAdmin, wrap(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT key, value, label, note FROM business_rules ORDER BY key`,
  );
  res.json(rows);
}));

app.patch("/api/admin/rules/:key", requireAdmin, wrap(async (req, res) => {
  const key = String(req.params.key);
  const limits = RULE_LIMITS[key];
  if (!limits) throw new HttpError(404, "Unknown rule");
  const { value, reason } = req.body ?? {};
  if (typeof reason !== "string" || reason.trim().length < 10) {
    throw new HttpError(400, "Reason is required (10+ characters)");
  }
  const v = Number(value);
  if (!Number.isInteger(v) || v < limits[0] || v > limits[1]) {
    throw new HttpError(400, `Value must be a whole number from ${limits[0]} to ${limits[1]}`);
  }
  const result = await withTx(async (c) => {
    const { rows } = await c.query<{ value: number; label: string }>(
      `SELECT value, label FROM business_rules WHERE key = $1 FOR UPDATE`,
      [key],
    );
    const cur = rows[0];
    if (!cur) throw new HttpError(404, "Unknown rule");
    await c.query(`UPDATE business_rules SET value = $2, updated_at = now() WHERE key = $1`, [key, v]);
    await audit(c, {
      actor: "admin",
      action: "update_rule",
      target: cur.label,
      reason: reason.trim(),
      before: String(cur.value),
      after: String(v),
    });
    return { key, value: v, label: cur.label };
  });
  res.json(result);
}));

app.get("/api/admin/audit", requireAdmin, wrap(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT at, actor, action, target, reason, before_value, after_value
       FROM audit_log ORDER BY id DESC LIMIT 200`,
  );
  res.json(
    rows.map((r) => ({
      at: r.at,
      actor: r.actor,
      action: r.action,
      target: r.target,
      reason: r.reason,
      before: r.before_value,
      after: r.after_value,
    })),
  );
}));

// ---- buyer sign-in (Google) ----
app.post("/api/auth/google", wrap(async (req, res) => {
  const { credential } = req.body ?? {};
  const g = typeof credential === "string" ? await verifyGoogleIdToken(credential) : null;
  if (!g) throw new HttpError(401, "Sign-in failed");
  const name = typeof req.body?.name === "string" ? req.body.name.slice(0, 80) : "";
  const { token } = await signInBuyer(g.email, name);
  res.setHeader(
    "Set-Cookie",
    `${BUYER_COOKIE}=${token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${BUYER_SESSION_DAYS * 86400}`,
  );
  res.json({ ok: true, email: g.email });
}));

app.get("/api/auth/me", wrap(async (req, res) => {
  const token = readCookie(req.headers.cookie, BUYER_COOKIE);
  const me = token ? await buyerFromSession(token) : null;
  if (!me) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  res.json({ email: me.email, name: me.name });
}));

app.post("/api/auth/logout", wrap(async (req, res) => {
  const token = readCookie(req.headers.cookie, BUYER_COOKIE);
  if (token) await deleteBuyerSession(token);
  res.setHeader("Set-Cookie", `${BUYER_COOKIE}=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0`);
  res.json({ ok: true });
}));

// ---- seller (Google sign-in, own products) ----
// A seller can sign in only if the Google email is on their seller row and the account is active.
async function requireSeller(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const token = readCookie(req.headers.cookie, SELLER_COOKIE);
    const seller = token ? await sellerFromSession(token) : null;
    if (!seller) return res.status(401).json({ error: "Unauthorised" });
    (req as express.Request & { seller?: unknown }).seller = seller;
    next();
  } catch (err) {
    next(err);
  }
}

const sellerOf = (req: express.Request) =>
  (req as express.Request & { seller: { id: string; name: string; kyc: string } }).seller;

app.post("/api/seller/auth/google", wrap(async (req, res) => {
  const { credential } = req.body ?? {};
  const g = typeof credential === "string" ? await verifyGoogleIdToken(credential) : null;
  const seller = g ? await sellerForEmail(g.email) : null;
  if (!seller) throw new HttpError(401, "Sign-in failed");
  const token = await startSellerSession(seller.id);
  res.setHeader(
    "Set-Cookie",
    `${SELLER_COOKIE}=${token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${SELLER_SESSION_HOURS * 3600}`,
  );
  res.json({ ok: true, name: seller.name });
}));

app.get("/api/seller/auth/me", requireSeller, (req, res) => {
  const s = sellerOf(req);
  res.json({ id: s.id, name: s.name, kyc: s.kyc });
});

app.post("/api/seller/auth/logout", wrap(async (req, res) => {
  const token = readCookie(req.headers.cookie, SELLER_COOKIE);
  if (token) await endSellerSession(token);
  res.setHeader("Set-Cookie", `${SELLER_COOKIE}=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0`);
  res.json({ ok: true });
}));

app.get("/api/seller/products", requireSeller, wrap(async (req, res) => {
  const s = sellerOf(req);
  const { rows } = await pool.query<ProductRow>(
    `SELECT slug, name, price_taka, stock, seller_id, status, category, description, old_price_taka, tone
       FROM products WHERE seller_id = $1 AND status <> removed ORDER BY updated_at DESC`,
    [s.id],
  );
  res.json(rows.map(toProduct));
}));

const CATEGORIES = ["Fashion", "Electronics", "Home", "Beauty", "Grocery"];

// Seller adds a product. "draft" stays hidden. "review" goes to the admin queue.
function parsePhoto(p: unknown): { mime: string; data: Buffer } {
  const m = typeof p === "string" ? /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(p) : null;
  if (!m) throw new HttpError(400, "Photos must be JPG, PNG or WEBP");
  const data = Buffer.from(m[2], "base64");
  if (data.length > 1024 * 1024) throw new HttpError(400, "Each photo must be under 1 MB");
  return { mime: m[1], data };
}

app.post("/api/seller/products", requireSeller, wrap(async (req, res) => {
  const s = sellerOf(req);
  if (s.kyc !== "approved") throw new HttpError(403, "KYC approval is needed before you can list products");
  const { name, price, stock, category, description, mode, photos } = req.body ?? {};
  const cleanName = typeof name === "string" ? name.trim() : "";
  if (cleanName.length < 5 || cleanName.length > 120) throw new HttpError(400, "Title must be 5 to 120 characters");
  const cleanPrice = Number(price);
  if (!Number.isInteger(cleanPrice) || cleanPrice <= 0 || cleanPrice > 1000000) {
    throw new HttpError(400, "Price must be a whole number above 0");
  }
  const cleanStock = Number(stock ?? 0);
  if (!Number.isInteger(cleanStock) || cleanStock < 0) throw new HttpError(400, "Stock must be 0 or more");
  const cleanCategory = CATEGORIES.includes(category) ? category : "Fashion";
  const cleanDesc = typeof description === "string" ? description.trim().slice(0, 2000) : "";
  if (mode !== "draft" && mode !== "review") throw new HttpError(400, "Invalid mode");
  if (mode === "review" && cleanStock === 0) throw new HttpError(400, "Stock is 0, so the product cannot be submitted");
  const list: unknown[] = Array.isArray(photos) ? photos : [];
  if (list.length > 8) throw new HttpError(400, "Up to 8 photos");
  if (mode === "review" && list.length < 3) throw new HttpError(400, "Add 3 to 8 photos to submit for review");
  const parsed = list.map(parsePhoto);

  const base = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "product";
  const slug = `${base}-${randomBytes(3).toString("hex")}`;
  const status = mode === "review" ? "pending" : "hidden";

  await withTx(async (c) => {
    await c.query(
      `INSERT INTO products (slug, seller_id, name, price_taka, stock, status, category, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [slug, s.id, cleanName, cleanPrice, cleanStock, status, cleanCategory, cleanDesc],
    );
    for (let i = 0; i < parsed.length; i++) {
      await c.query(
        `INSERT INTO product_images (product_slug, position, mime, data) VALUES ($1, $2, $3, $4)`,
        [slug, i, parsed[i].mime, parsed[i].data],
      );
    }
  });
  res.status(201).json({ slug, status });
}));

// ---- error handling ----
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if ((err as { type?: string })?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON" });
  }
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

export default app;
