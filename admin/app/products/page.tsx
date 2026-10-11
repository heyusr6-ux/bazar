"use client";

import { useEffect, useState } from "react";

// Products from the API. Admin can hide or remove a listing. Removed items are kept for order history.
const API = "";

type Product = {
  slug: string;
  name: string;
  price: number;
  stock: number;
  status: "live" | "hidden" | "pending" | "rejected" | "removed";
  sellerName: string;
};

const STATUS_LABEL: Record<Product["status"], string> = {
  live: "Live",
  hidden: "Hidden",
  pending: "Pending",
  rejected: "Rejected",
  removed: "Removed",
};

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [target, setTarget] = useState<Product | null>(null);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API}/api/admin/products`, { credentials: "include" });
        if (!res.ok) throw new Error("load failed");
        const data: Product[] = await res.json();
        if (alive) setItems(data);
      } catch {
        if (alive) setError("ডেটা আনা যায়নি। পাতা refresh করুন।");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function change(p: Product, status: "live" | "hidden" | "removed") {
    if (reason.trim().length < 10) {
      setError("কারণ লিখুন (কমপক্ষে ১০ অক্ষর)। এটা audit log-এ যাবে।");
      return;
    }
    setBusySlug(p.slug);
    setError("");
    setNote("");
    try {
      const res = await fetch(`${API}/api/admin/products/${p.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, reason: reason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "কাজটি হয়নি।");
        return;
      }
      setItems((list) => list.map((x) => (x.slug === p.slug ? { ...x, status: data.status } : x)));
      setNote(`"${p.name}" এখন ${STATUS_LABEL[status]}। Audit log-এ লেখা হয়েছে।`);
      setReason("");
      setTarget(null);
    } catch {
      setError("সার্ভারের সাথে যোগাযোগ হয়নি।");
    } finally {
      setBusySlug(null);
    }
  }

  return (
    <div className="stack" style={{ gap: 16 }}>
      <header className="page-head">
        <h1>Products</h1>
      </header>

      {loading && <span className="muted">লোড হচ্ছে…</span>}
      {error && !target && <span role="alert" className="error">{error}</span>}
      {note && <div role="status" className="notice">{note}</div>}

      {items.length > 0 && (
        <div className="table-box">
          <table>
            <caption className="sr-only">Products</caption>
            <thead>
              <tr>
                <th>Product</th>
                <th>Seller</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.slug}>
                  <td><b>{p.name}</b></td>
                  <td>{p.sellerName}</td>
                  <td>৳ {p.price.toLocaleString("en-US")}</td>
                  <td>{p.stock}</td>
                  <td>{STATUS_LABEL[p.status]}</td>
                  <td>
                    {p.status === "pending" && (
                      <button type="button" className="btn btn-sm" disabled={busySlug !== null} onClick={() => { setTarget({ ...p, status: "pending" }); setApproving(true); setError(""); setNote(""); }}>
                        Approve
                      </button>
                    )}
                    {p.status !== "removed" && (
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => { setTarget(p); setApproving(false); setError(""); setNote(""); }}>
                        Remove
                      </button>
                    )}
                    {p.status === "removed" && <span className="muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {target && (
        <section className="card stack" aria-labelledby="rm-h">
          <h2 id="rm-h">{approving ? "Approve" : "Remove"}: {target.name}</h2>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            {approving
              ? "Approve করলে এই product buyer-দের কাছে দেখাবে। কারণ লিখুন, যেমন: ছবি ও দাম ঠিক আছে।"
              : "Product মুছে ফেলা হবে না। এটা buyer-দের কাছে দেখাবে না, আর পুরোনো order-এর তথ্য থাকবে।"}
          </p>
          <div className="field">
            <label htmlFor="rm-reason">কারণ (কমপক্ষে ১০ অক্ষর)</label>
            <textarea id="rm-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="যেমন: নকল পণ্যের অভিযোগ" />
            {error && <span className="error" role="alert">{error}</span>}
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-line" disabled={busySlug !== null} onClick={() => { setTarget(null); setReason(""); }}>
              বাতিল
            </button>
            {approving ? (
              <button type="button" className="btn" disabled={busySlug !== null} onClick={() => change(target, "live")}>
                Approve and go live
              </button>
            ) : (
              <button type="button" className="btn btn-danger" disabled={busySlug !== null} onClick={() => change(target, "removed")}>
                Remove product
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
