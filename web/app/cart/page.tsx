"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { formatTaka, getProduct } from "@/lib/data";
import { readCart, removeFromCart, setQty, subscribeCart, CartItem } from "@/lib/cart";


function getSnapshot(): string {
  return JSON.stringify(readCart());
}

export default function CartPage() {
  const raw = useSyncExternalStore(subscribeCart, getSnapshot, () => "[]");
  const items: CartItem[] = JSON.parse(raw);
  const lines = items
    .map((i) => ({ ...i, product: getProduct(i.slug) }))
    .filter((l) => l.product);

  const subtotal = lines.reduce((sum, l) => sum + (l.product!.price * l.qty), 0);
  const sellers = new Set(lines.map((l) => l.product!.seller)).size;

  if (lines.length === 0) {
    return (
      <div className="card stack" style={{ justifyItems: "start" }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Your cart is empty</h1>
        <span className="muted">Add products from the shop to see them here.</span>
        <Link href="/products" className="btn">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="layout-two">
      <section className="stack" aria-label="Cart items">
        <h1 style={{ margin: 0, fontSize: 22 }}>Cart ({lines.length} items)</h1>
        {sellers > 1 && (
          <div className="notice">Items come from {sellers} sellers, so you get {sellers} shipments.</div>
        )}
        {lines.map((l) => (
          <div key={l.slug} className="card" style={{ display: "grid", gridTemplateColumns: "72px minmax(0,1fr) auto", gap: 12, alignItems: "center" }}>
            <div className="product-thumb" style={{ background: l.product!.tone, height: 72, aspectRatio: "auto" }} aria-hidden="true" />
            <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
              <Link href={`/products/${l.slug}`} style={{ fontWeight: 700 }}>{l.product!.name}</Link>
              <span className="muted" style={{ fontSize: 13 }}>{l.product!.seller} · {formatTaka(l.product!.price)}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span className="muted" style={{ fontSize: 13 }}>Qty</span>
                  <select
                    value={l.qty}
                    onChange={(e) => setQty(l.slug, Number(e.target.value))}
                    style={{ minHeight: 40, borderRadius: 8, padding: "0 8px" }}
                  >
                    {Array.from({ length: Math.min(l.product!.stock, 10) }, (_, n) => n + 1).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <button type="button" className="btn btn-danger" style={{ minHeight: 40 }} onClick={() => removeFromCart(l.slug)}>
                  Remove
                </button>
              </div>
            </div>
            <b>{formatTaka(l.product!.price * l.qty)}</b>
          </div>
        ))}
      </section>

      <aside className="card stack" aria-label="Order summary" style={{ position: "sticky", top: 84 }}>
        <b style={{ fontSize: 16 }}>Order summary</b>
        <div className="row muted"><span>Subtotal</span><span>{formatTaka(subtotal)}</span></div>
        <div className="row muted"><span>Delivery</span><span>Calculated at checkout</span></div>
        <div className="row" style={{ fontWeight: 800, fontSize: 17, borderTop: "1px solid #eef1f0", paddingTop: 10 }}>
          <span>Total (before delivery)</span><span>{formatTaka(subtotal)}</span>
        </div>
        <Link href="/checkout" className="btn btn-cta" style={{ minHeight: 50 }}>Proceed to checkout</Link>
      </aside>
    </div>
  );
}
