"use client";

import Link from "next/link";
import { FormEvent, useState, useSyncExternalStore } from "react";
import { formatTaka } from "@/lib/data";
import { useCatalog } from "@/lib/useCatalog";
import { readCart, subscribeCart, CartItem } from "@/lib/cart";

const COD_LIMIT = 25000;

function getSnapshot(): string {
  return JSON.stringify(readCart());
}

export default function CheckoutPage() {
  const raw = useSyncExternalStore(subscribeCart, getSnapshot, () => "[]");
  const items: CartItem[] = JSON.parse(raw);
  const catalog = useCatalog();
  const bySlug = new Map((catalog ?? []).map((p) => [p.slug, p]));
  const lines = items.map((i) => ({ ...i, product: bySlug.get(i.slug) })).filter((l) => l.product);
  const subtotal = lines.reduce((sum, l) => sum + l.product!.price * l.qty, 0);
  const deliveryFee = subtotal >= 2000 ? 0 : 60;
  const total = subtotal + deliveryFee;

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placed, setPlaced] = useState<string | null>(null);

  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const API = process.env.NEXT_PUBLIC_API_URL;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (catalog === null) {
      setSubmitError("Products are still loading. Please try again in a moment.");
      return;
    }
    const f = new FormData(e.currentTarget);
    const next: Record<string, string> = {};
    const name = String(f.get("name") ?? "").trim();
    const phone = String(f.get("phone") ?? "").replace(/\s/g, "");
    const address = String(f.get("address") ?? "").trim();
    if (!name) next.name = "আপনার পুরো নাম লিখুন।";
    if (!/^01[3-9]\d{8}$/.test(phone)) next.phone = "সঠিক মোবাইল নম্বর লিখুন (১১ সংখ্যা, যেমন 01712345678)।";
    if (address.length < 10) next.address = "পূর্ণ ঠিকানা লিখুন: বাড়ি নম্বর, রাস্তা, এলাকা ও জেলা।";
    if (total > COD_LIMIT) next.payment = `ক্যাশ অন ডেলিভারি সর্বোচ্চ ${formatTaka(COD_LIMIT)} পর্যন্ত।`;
    setErrors(next);
    setSubmitError("");
    if (Object.keys(next).length > 0) return;

    // With the API configured, the order is saved on the server.
    if (API) {
      setSubmitting(true);
      try {
        const res = await fetch(`${API}/api/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone,
            address,
            items: lines.map((l) => ({ slug: l.slug, qty: l.qty })),
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setSubmitError(body.error ?? "Order could not be placed. Please try again.");
          return;
        }
        setPlaced(body.id);
      } catch {
        setSubmitError("Cannot reach the server right now. Your order was not placed.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // No API configured: test-only local confirmation.
    setPlaced("BZ-" + Date.now().toString().slice(-8));
  }

  if (placed) {
    return (
      <div className="card stack" style={{ justifyItems: "start", maxWidth: 640 }}>
        <span className="pill pill-ok">Order placed (test)</span>
        <h1 style={{ margin: 0, fontSize: 22 }}>Thank you. Your order number is {placed}</h1>
        <p className="muted" style={{ margin: 0 }}>
          {API
            ? "Your order is saved on the server. Pay the delivery person in cash."
            : "This is a test build. No order is saved and no seller is notified yet."}
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
          <legend style={{ fontWeight: 700, padding: "0 4px" }}>ডেলিভারির ঠিকানা</legend>
          <div className="field">
            <label htmlFor="name">পুরো নাম</label>
            <input id="name" name="name" autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-e" : undefined} />
            {errors.name && <span id="name-e" className="error">{errors.name}</span>}
          </div>
          <div className="field">
            <label htmlFor="phone">মোবাইল নম্বর</label>
            <input id="phone" name="phone" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" aria-describedby={errors.phone ? "phone-e" : "phone-h"} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-e" : undefined} />
            <span id="phone-h" className="muted" style={{ fontSize: 12 }}>Courier এই নম্বরে ফোন করবে, তাই সঠিক নম্বর দিন।</span>
            {errors.phone && <span id="phone-e" className="error">{errors.phone}</span>}
          </div>
          <div className="field">
            <label htmlFor="address">পূর্ণ ঠিকানা</label>
            <textarea id="address" name="address" autoComplete="street-address" placeholder="যেমন: বাড়ি ১২, রোড ৫, মিরপুর-১০, ঢাকা" aria-invalid={!!errors.address} aria-describedby={errors.address ? "address-e" : undefined} />
            {errors.address && <span id="address-e" className="error">{errors.address}</span>}
          </div>
        </fieldset>

        <fieldset className="card stack" style={{ border: "1px solid #e3e7e4" }}>
          <legend style={{ fontWeight: 700, padding: "0 4px" }}>Payment</legend>
          <span className="muted" style={{ fontSize: 13 }}>এখন শুধু ক্যাশ অন ডেলিভারি। পণ্য হাতে পেয়ে টাকা দিন।</span>
          <label className="row" style={{ justifyContent: "flex-start", gap: 10, minHeight: 44 }}>
            <input type="radio" name="pay" defaultChecked /> Cash on delivery
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
        {submitError && <span className="error" role="alert">{submitError}</span>}
        <button type="submit" className="btn btn-cta" style={{ minHeight: 50 }} disabled={submitting}>
          {submitting ? "Placing order…" : "Place order (COD)"}
        </button>
        <span className="muted" style={{ fontSize: 12, textAlign: "center" }}>Test build: the order is not saved.</span>
      </aside>
    </form>
  );
}
