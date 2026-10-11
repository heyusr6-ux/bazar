import express from "express";
import cors from "cors";
import { randomBytes } from "node:crypto";
import type pg from "pg";
import { pool, withTx } from "./db.js";

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
};

type SellerRow = {
  id: string;
  name: string;
  kyc_status: string;
  account_status: string;
};

const toProduct = (r: ProductRow) => ({
  slug: r.slug,
  name: r.name,
  price: r.price_taka,
  stock: r.stock,
  sellerId: r.seller_id,
  status: r.status,
});

const toSeller = (r: SellerRow) => ({
  id: r.id,
  name: r.name,
  kyc: r.kyc_status,
  status: r.account_status,
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
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "100kb" }));

// Placeholder admin check. Replace with real OTP + 2FA login before launch.
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.header("x-admin-token");
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorised" });
  }
  next();
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
    `SELECT slug, name, price_taka, stock, seller_id, status
       FROM products WHERE status = 'live' ORDER BY name`,
  );
  res.json(rows.map(toProduct));
}));

app.get("/api/products/:slug", wrap(async (req, res) => {
  const { rows } = await pool.query<ProductRow>(
    `SELECT slug, name, price_taka, stock, seller_id, status
       FROM products WHERE slug = $1 AND status = 'live'`,
    [req.params.slug],
  );
  if (!rows[0]) throw new HttpError(404, "Product not found");
  res.json(toProduct(rows[0]));
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
    if (total > COD_LIMIT) {
      throw new HttpError(400, `Cash on delivery is limited to ৳ ${COD_LIMIT.toLocaleString("en-US")}`);
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

// ---- admin ----
app.get("/api/admin/sellers", requireAdmin, wrap(async (_req, res) => {
  const { rows } = await pool.query<SellerRow>(
    `SELECT id, name, kyc_status, account_status FROM sellers ORDER BY id`,
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
