"use client";

import Link from "next/link";
import { FormEvent, useState, useSyncExternalStore } from "react";
import { formatTaka, getProduct } from "@/lib/data";
import { readCart, subscribeCart, CartItem } from "@/lib/cart";

const COD_LIMIT = 25000;

function getSnapshot(): string {
  return JSON.stringify(readCart());
}

export default function CheckoutPage() {
  const raw = useSyncExternalStore(subscribeCart, getSnapshot, () => "[]");
  const items: CartItem[] = JSON.parse(raw);
  const lines = items.map((i) => ({ ...i, product: getProduct(i.slug) })).filter((l) => l.product);
  const subtotal = lines.reduce((sum, l) => sum + l.product!.price * l.qty, 0);
  const deliveryFee = subtotal >= 2000 ? 0 : 60;
  const total = subtotal + deliveryFee;

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placed, setPlaced] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const next: Record<string, string> = {};
    const name = String(f.get("name") ?? "").trim();
    const phone = String(f.get("phone") ?? "").replace(/\s/g, "");
    const address = String(f.get("address") ?? "").trim();
    if (!name) next.name = "Enter your full name.";
    if (!/^01[3-9]\d{8}$/.test(phone)) next.phone = "Enter a valid Bangladeshi mobile number (01XXXXXXXXX).";
    if (address.length < 10) next.address = "Enter a full address with area and district.";
    if (total > COD_LIMIT) next.payment = `Cash on delivery is limited to ${formatTaka(COD_LIMIT)}.`;
    setErrors(next);
    if (Object.keys(next).length === 0) {
      setPlaced("BZ-" + Date.now().toString().slice(-8));
    }
  }

  if (placed) {
    return (
      <div className="card stack" style={{ justifyItems: "start", maxWidth: 640 }}>
        <span className="pill pill-ok">Order placed (test)</span>
        <h1 style={{ margin: 0, fontSize: 22 }}>Thank you. Your order number is {placed}</h1>
        <p className="muted" style={{ margin: 0 }}>
          This is a test build. No order is saved and no seller is notified yet.
        </p>
        <Link href="/products" className="btn">Continue shopping</Link>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="card stack" style={{ justifyItems: "start" }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Nothing to check out</h1>
        <Link href="/products" className="btn">Shop products</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="layout-two">
      <section className="stack" aria-label="Delivery and payment">
        <h1 style={{ margin: 0, fontSize: 22 }}>Checkout</h1>

        <fieldset className="card stack" style={{ border: "1px solid #e3e7e4" }}>
          <legend style={{ fontWeight: 700, padding: "0 4px" }}>Delivery address</legend>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-e" : undefined} />
            {errors.name && <span id="name-e" className="error">{errors.name}</span>}
          </div>
          <div className="field">
            <label htmlFor="phone">Mobile number</label>
            <input id="phone" name="phone" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-e" : undefined} />
            {errors.phone && <span id="phone-e" className="error">{errors.phone}</span>}
          </div>
          <div className="field">
            <label htmlFor="address">Address</label>
            <textarea id="address" name="address" autoComplete="street-address" placeholder="House, road, area, district" aria-invalid={!!errors.address} aria-describedby={errors.address ? "address-e" : undefined} />
            {errors.address && <span id="address-e" className="error">{errors.address}</span>}
          </div>
        </fieldset>

        <fieldset className="card stack" style={{ border: "1px solid #e3e7e4" }}>
          <legend style={{ fontWeight: 700, padding: "0 4px" }}>Payment</legend>
          <label className="row" style={{ justifyContent: "flex-start", gap: 10, minHeight: 44 }}>
            <input type="radio" name="pay" defaultChecked /> Cash on delivery
          </label>
          <label className="row" style={{ justifyContent: "flex-start", gap: 10, minHeight: 44 }}>
            <input type="radio" name="pay" disabled /> bKash / Nagad <span className="pill pill-warn">Not connected</span>
          </label>
          <label className="row" style={{ justifyContent: "flex-start", gap: 10, minHeight: 44 }}>
            <input type="radio" name="pay" disabled /> Card <span className="pill pill-warn">Not connected</span>
          </label>
          {errors.payment && <span className="error" role="alert">{errors.payment}</span>}
        </fieldset>
      </section>

      <aside className="card stack summary" aria-label="Order summary">
        <b style={{ fontSize: 16 }}>Order summary ({lines.length} items)</b>
        {lines.map((l) => (
          <div key={l.slug} className="row muted" style={{ fontSize: 14 }}>
            <span>{l.product!.name} × {l.qty}</span>
            <span>{formatTaka(l.product!.price * l.qty)}</span>
          </div>
        ))}
        <div className="row muted"><span>Subtotal</span><span>{formatTaka(subtotal)}</span></div>
        <div className="row muted"><span>Delivery</span><span>{deliveryFee === 0 ? "Free" : formatTaka(deliveryFee)}</span></div>
        <div className="row" style={{ fontWeight: 800, fontSize: 17, borderTop: "1px solid #eef1f0", paddingTop: 10 }}>
          <span>Total</span><span>{formatTaka(total)}</span>
        </div>
        <button type="submit" className="btn btn-cta" style={{ minHeight: 50 }}>Place order (COD)</button>
        <span className="muted" style={{ fontSize: 12, textAlign: "center" }}>Test build: the order is not saved.</span>
      </aside>
    </form>
  );
}
