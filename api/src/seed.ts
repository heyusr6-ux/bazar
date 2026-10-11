// Inserts test sellers and products. Existing rows are left alone (ON CONFLICT DO NOTHING).
// Run it on purpose, not automatically: npm run db:seed
import { pool, withTx } from "./db.js";

const sellers = [
  { id: "s1", name: "Mirpur Mobile Hub", kyc: "pending", status: "active" },
  { id: "s2", name: "Sylhet Organics", kyc: "pending", status: "active" },
  { id: "s3", name: "Nakshi Store", kyc: "approved", status: "active" },
  { id: "s4", name: "Cheap Gadget BD", kyc: "approved", status: "suspended" },
];

const products = [
  { slug: "handloom-cotton-saree-indigo", name: "Handloom cotton saree, Indigo", price: 2450, stock: 14, sellerId: "s3", status: "live" },
  { slug: "jamdani-scarf", name: "Jamdani scarf", price: 1150, stock: 8, sellerId: "s3", status: "live" },
  { slug: "block-print-kurti", name: "Block print cotton kurti", price: 1680, stock: 0, sellerId: "s1", status: "hidden" },
];

await withTx(async (c) => {
  for (const s of sellers) {
    await c.query(
      `INSERT INTO sellers (id, name, kyc_status, account_status) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [s.id, s.name, s.kyc, s.status],
    );
  }
  for (const p of products) {
    await c.query(
      `INSERT INTO products (slug, seller_id, name, price_taka, stock, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (slug) DO NOTHING`,
      [p.slug, p.sellerId, p.name, p.price, p.stock, p.status],
    );
  }
});
console.log(`Seed done: ${sellers.length} sellers, ${products.length} products (existing rows kept)`);
await pool.end();
