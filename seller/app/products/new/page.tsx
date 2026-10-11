"use client";

import { FormEvent, useState } from "react";

const API = "";

export default function NewProductPage() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<"" | "draft" | "review">("");
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const pressed = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const mode: "draft" | "review" = pressed?.dataset.kind === "draft" ? "draft" : "review";
    const f = new FormData(e.currentTarget);
    const title = String(f.get("title") ?? "").trim();
    const price = Number(f.get("price"));
    const stock = Number(f.get("stock") ?? 0);
    const next: Record<string, string> = {};
    if (title.length < 5) next.title = "Title must be at least 5 characters.";
    if (mode === "review" && (!price || price <= 0)) next.price = "Price must be greater than 0.";
    if (mode === "review" && stock === 0) next.stock = "Stock is 0, so the product will stay hidden.";
    setErrors(next);
    setServerError("");
    setResult("");
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    try {
      const res = await fetch(`${API}/api/seller/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: title,
          price,
          stock,
          category: String(f.get("category") ?? "Fashion"),
          description: String(f.get("description") ?? ""),
          mode,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setServerError(body.error ?? "Could not save. Try again.");
        return;
      }
      setResult(mode);
      e.currentTarget.reset();
    } catch {
      setServerError("Cannot reach the server right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack" style={{ gap: 16 }}>
      <header className="page-head">
        <div>
          <span className="muted" style={{ fontSize: 13 }}>Products / New</span>
          <h1>Add new product</h1>
        </div>
      </header>

      {result && (
        <div role="status" className="notice">
          {result === "draft"
            ? "Draft saved. Only you can see it."
            : "Submitted for review. The platform admin will check it before it goes live."}
        </div>
      )}
      {serverError && <div role="alert" className="error">{serverError}</div>}

      <form className="card stack form-grid" onSubmit={submit} noValidate>
        <div className="field full">
          <label htmlFor="title">Product title</label>
          <input id="title" name="title" maxLength={120} aria-invalid={!!errors.title} />
          {errors.title && <span className="error">{errors.title}</span>}
        </div>

        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" name="category" defaultValue="Fashion">
            <option>Fashion</option><option>Electronics</option><option>Home</option><option>Beauty</option><option>Grocery</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="price">Price (৳)</label>
          <input id="price" name="price" inputMode="numeric" aria-invalid={!!errors.price} />
          {errors.price && <span className="error">{errors.price}</span>}
        </div>

        <div className="field">
          <label htmlFor="stock">Stock</label>
          <input id="stock" name="stock" inputMode="numeric" aria-invalid={!!errors.stock} />
          {errors.stock && <span className="warn-text">{errors.stock}</span>}
        </div>

        <div className="field full">
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" maxLength={2000} />
        </div>

        <div className="form-actions full">
          <button type="submit" className="btn btn-line" data-kind="draft" formNoValidate disabled={busy}>Save draft</button>
          <button type="submit" className="btn" data-kind="review" disabled={busy}>Submit for review</button>
        </div>
      </form>
    </div>
  );
}
