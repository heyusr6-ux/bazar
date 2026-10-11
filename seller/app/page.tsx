"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatTaka } from "@/lib/data";

const API = "";

type Product = { slug: string; name: string; stock: number; status: string };
type Order = { id: string; status: string; amount: number; lines: { name: string; qty: number }[] };

export default function SellerOverview() {
  const [name, setName] = useState("");
  const [products, setProducts] = useState<Product[] | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [me, p, o] = await Promise.all([
          fetch(`${API}/api/seller/auth/me`, { credentials: "include" }),
          fetch(`${API}/api/seller/products`, { credentials: "include" }),
          fetch(`${API}/api/seller/orders`, { credentials: "include" }),
        ]);
        if (!me.ok || !p.ok || !o.ok) throw new Error("load failed");
        const [m, pl, ol] = await Promise.all([
          me.json() as Promise<{ name: string }>,
          p.json() as Promise<Product[]>,
          o.json() as Promise<Order[]>,
        ]);
        if (!alive) return;
        setName(m.name);
        setProducts(pl);
        setOrders(ol);
      } catch {
        if (alive) setError("ডেটা আনা যায়নি। পাতা refresh করুন।");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const live = products?.filter((p) => p.status === "live").length ?? 0;
  const pending = products?.filter((p) => p.status === "pending").length ?? 0;
  const lowStock = products?.filter((p) => p.status !== "removed" && p.stock > 0 && p.stock <= 5) ?? [];
  const newOrders = orders?.filter((o) => o.status === "placed" || o.status === "processing") ?? [];

  return (
    <div className="stack" style={{ gap: 16 }}>
      <header className="page-head">
        <h1>Overview</h1>
        {name && <span className="muted">{name}</span>}
      </header>

      {error && <span className="error" role="alert">{error}</span>}
      {!products && !error && <span className="muted">লোড হচ্ছে…</span>}

      {products && orders && (
        <>
          <section className="grid-kpi" aria-label="Key numbers">
            <div className="card"><span className="muted">Live products</span><b className="kpi">{live}</b></div>
            <div className="card"><span className="muted">Waiting for review</span><b className="kpi warn">{pending}</b></div>
            <div className="card"><span className="muted">New orders</span><b className="kpi">{newOrders.length}</b></div>
            <div className="card"><span className="muted">Low stock</span><b className="kpi warn">{lowStock.length}</b></div>
          </section>

          <section className="card stack" aria-labelledby="low-h">
            <div className="row">
              <h2 id="low-h">Low stock</h2>
              <Link href="/products" className="link-strong">Manage products</Link>
            </div>
            {lowStock.length === 0 ? (
              <span className="muted">কম স্টকের পণ্য নেই।</span>
            ) : (
              lowStock.map((p) => (
                <div key={p.slug} className="row">
                  <span>{p.name}</span>
                  <span className="pill pill-warn">{p.stock} left</span>
                </div>
              ))
            )}
          </section>

          <section className="card stack" aria-labelledby="ord-h">
            <div className="row">
              <h2 id="ord-h">Recent orders</h2>
              <Link href="/orders" className="link-strong">All orders</Link>
            </div>
            {orders.length === 0 && <span className="muted">এখনো কোনো অর্ডার নেই।</span>}
            {orders.slice(0, 3).map((o) => (
              <div key={o.id} className="row" style={{ flexWrap: "wrap" }}>
                <span>
                  <b>{o.id}</b> <span className="muted">· {o.lines.map((l) => `${l.name} × ${l.qty}`).join(", ")} · {formatTaka(o.amount)}</span>
                </span>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
