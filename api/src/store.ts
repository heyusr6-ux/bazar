// In-memory store for the test backend. Swap for PostgreSQL before any real use.
// Every admin action must write an audit entry (already modelled here).

export type Role = "buyer" | "seller" | "admin";

export type Product = {
  slug: string;
  name: string;
  price: number;
  stock: number;
  sellerId: string;
  status: "live" | "hidden" | "pending" | "rejected";
};

export type Seller = {
  id: string;
  name: string;
  kyc: "pending" | "approved" | "sent_back" | "rejected";
  status: "active" | "suspended";
};

export type Order = {
  id: string;
  buyerPhone: string;
  address: string;
  items: { slug: string; qty: number; unitPrice: number }[];
  total: number;
  payment: "cod";
  status: "placed" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
};

export type AuditEntry = {
  at: string;
  actor: string;
  action: string;
  target: string;
  reason: string;
  before?: string;
  after?: string;
};

export const db = {
  products: [
    { slug: "handloom-cotton-saree-indigo", name: "Handloom cotton saree, Indigo", price: 2450, stock: 14, sellerId: "s3", status: "live" },
    { slug: "jamdani-scarf", name: "Jamdani scarf", price: 1150, stock: 8, sellerId: "s3", status: "live" },
    { slug: "block-print-kurti", name: "Block print cotton kurti", price: 1680, stock: 0, sellerId: "s1", status: "hidden" },
  ] as Product[],
  sellers: [
    { id: "s1", name: "Mirpur Mobile Hub", kyc: "pending", status: "active" },
    { id: "s2", name: "Sylhet Organics", kyc: "pending", status: "active" },
    { id: "s3", name: "Nakshi Store", kyc: "approved", status: "active" },
    { id: "s4", name: "Cheap Gadget BD", kyc: "approved", status: "suspended" },
  ] as Seller[],
  orders: [] as Order[],
  audit: [] as AuditEntry[],
};

export function audit(entry: Omit<AuditEntry, "at">) {
  db.audit.unshift({ ...entry, at: new Date().toISOString() });
}
