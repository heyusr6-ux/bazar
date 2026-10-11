import express from "express";
import cors from "cors";
import { audit, db, Order } from "./store.js";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

// Only the buyer and seller front ends may call this API.
const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:3000").split(",");
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "100kb" }));

// Admin routes must be behind real auth (OTP + 2FA) before launch. Placeholder check only.
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.header("x-admin-token");
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorised" });
  }
  next();
}

app.get("/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ---- public catalogue ----
app.get("/api/products", (_req, res) => {
  res.json(db.products.filter((p) => p.status === "live"));
});

app.get("/api/products/:slug", (req, res) => {
  const p = db.products.find((x) => x.slug === req.params.slug && x.status === "live");
  if (!p) return res.status(404).json({ error: "Product not found" });
  res.json(p);
});

// ---- orders (COD only for now) ----
app.post("/api/orders", (req, res) => {
  const { phone, address, items } = req.body ?? {};
  if (typeof phone !== "string" || !/^01[3-9]\d{8}$/.test(phone)) {
    return res.status(400).json({ error: "Invalid phone" });
  }
  if (typeof address !== "string" || address.trim().length < 10) {
    return res.status(400).json({ error: "Address too short" });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  const lines: Order["items"] = [];
  for (const it of items) {
    const p = db.products.find((x) => x.slug === it?.slug && x.status === "live");
    const qty = Number(it?.qty);
    if (!p) return res.status(400).json({ error: `Product not available: ${it?.slug}` });
    if (!Number.isInteger(qty) || qty < 1) return res.status(400).json({ error: "Invalid quantity" });
    if (qty > p.stock) return res.status(409).json({ error: `Only ${p.stock} left for ${p.name}` });
    lines.push({ slug: p.slug, qty, unitPrice: p.price });
  }

  const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  if (total > 25000) return res.status(400).json({ error: "Cash on delivery is limited to ৳ 25,000" });

  // Reduce stock only after every line passed.
  for (const l of lines) {
    const p = db.products.find((x) => x.slug === l.slug)!;
    p.stock -= l.qty;
  }

  const order: Order = {
    id: "BZ-" + Date.now().toString().slice(-8),
    buyerPhone: phone,
    address: address.trim(),
    items: lines,
    total,
    payment: "cod",
    status: "placed",
    createdAt: new Date().toISOString(),
  };
  db.orders.unshift(order);
  res.status(201).json({ id: order.id, total: order.total, status: order.status });
});

// ---- admin ----
app.get("/api/admin/sellers", requireAdmin, (_req, res) => res.json(db.sellers));

app.patch("/api/admin/sellers/:id", requireAdmin, (req, res) => {
  const seller = db.sellers.find((s) => s.id === req.params.id);
  if (!seller) return res.status(404).json({ error: "Seller not found" });
  const { status, kyc, reason } = req.body ?? {};
  if (typeof reason !== "string" || reason.trim().length < 10) {
    return res.status(400).json({ error: "Reason is required (10+ characters)" });
  }
  const before = `${seller.kyc}/${seller.status}`;
  if (status === "active" || status === "suspended") seller.status = status;
  if (kyc === "approved" || kyc === "sent_back" || kyc === "rejected" || kyc === "pending") seller.kyc = kyc;
  audit({
    actor: "admin",
    action: "update_seller",
    target: seller.name,
    reason: reason.trim(),
    before,
    after: `${seller.kyc}/${seller.status}`,
  });
  res.json(seller);
});

app.get("/api/admin/audit", requireAdmin, (_req, res) => res.json(db.audit));

app.listen(PORT, () => {
  console.log(`BazaarBD API listening on :${PORT}`);
});
