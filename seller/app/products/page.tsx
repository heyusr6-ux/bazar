"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatTaka } from "@/lib/data";

const API = "";

type ApiProduct = {
  slug: string;
  name: string;
  price: number;
  stock: number;
  status: "live" | "hidden" | "pending" | "rejected";
};

const LABEL: Record<ApiProduct["status"], string> = {
  live: "Live",
  pending: "Pending review",
  hidden: "Hidden",
  rejected: "Rejected",
};

const CLASS: Record<ApiProduct["status"], string> = {
  live: "pill pill-ok",
  pending: "pill pill-warn",
  hidden: "pill pill-info",
  rejected: "pill pill-danger",
};

export default function ProductsPage() {
  const [items, setItems] = useState<ApiProduct[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`${API}/api/seller/products`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("load failed");
        return r.json();
      })
      .then((data: ApiProduct[]) => {
        if (alive) setItems(data);
      })
      .catch(() => {
        if (alive) setError("পণ্যের তালিকা আনা যায়নি। পাতা refresh করুন।");
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="stack" style={{ gap: 16 }}>
      <header className="page-head">
        <h1>Products</h1>
        <Link href="/products/new" className="btn">Add product</Link>
      </header>

      {error && <span className="error" role="alert">{error}</span>}
      {!items && !error && <span className="muted">লোড হচ্ছে…</span>}

      {items && items.length === 0 && (
        <div className="card stack">
          <span className="muted">এখনো কোনো পণ্য নেই। প্রথম পণ্য যোগ করুন।</span>
        </div>
      )}

      {items && items.length > 0 && (
        <div className="table-box">
          <table>
            <caption className="sr-only">Your products</caption>
            <thead>
              <tr><th>Product</th><th>Price</th><th>Stock</th><th>Status</th></tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.slug}>
                  <td><b>{p.name}</b></td>
                  <td>{formatTaka(p.price)}</td>
                  <td>{p.stock === 0 ? <span className="pill pill-danger">0 (hidden)</span> : p.stock}</td>
                  <td><span className={CLASS[p.status]}>{LABEL[p.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="muted" style={{ fontSize: 13, margin: 0 }}>
        স্টক ০ হলে পণ্য ক্রেতাদের কাছে দেখানো হয় না। Edit করার সুবিধা এখনো চালু হয়নি।
      </p>
    </div>
  );
}
