"use client";

import { FormEvent, useState } from "react";

export default function NewProductPage() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<"" | "draft" | "review">("");

  function submit(kind: "draft" | "review") {
    return (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      const next: Record<string, string> = {};
      const title = String(f.get("title") ?? "").trim();
      const price = Number(f.get("price"));
      const stock = Number(f.get("stock"));
      if (title.length < 5) next.title = "Title must be at least 5 characters.";
      if (kind === "review" && (!price || price <= 0)) next.price = "Price must be greater than 0.";
      if (kind === "review" && stock === 0) next.stock = "Stock is 0, so the product will stay hidden.";
      setErrors(next);
      if (Object.keys(next).length === 0 || kind === "draft") setSaved(kind);
    };
  }

  return (
    <div className="stack" style={{ gap: 16 }}>
      <header className="page-head">
        <div>
          <span className="muted" style={{ fontSize: 13 }}>Products / New</span>
          <h1>Add new product</h1>
        </div>
      </header>

      {saved && (
        <div role="status" className="notice">
          {saved === "draft" ? "Draft saved (test build, not stored)." : "Submitted for review (test build, not stored)."}
        </div>
      )}

      <form className="card stack form-grid" onSubmit={submit("review")} noValidate>
        <div className="field full">
          <label htmlFor="title">Product title</label>
          <input id="title" name="title" maxLength={120} aria-invalid={!!errors.title} aria-describedby={errors.title ? "title-e" : undefined} />
          {errors.title && <span id="title-e" className="error">{errors.title}</span>}
        </div>

        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" name="category" defaultValue="Fashion">
            <option>Fashion</option><option>Electronics</option><option>Home</option><option>Beauty</option><option>Grocery</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="condition">Condition</label>
          <select id="condition" name="condition" defaultValue="New">
            <option>New</option><option>Used</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="price">Price (৳)</label>
          <input id="price" name="price" inputMode="numeric" aria-invalid={!!errors.price} aria-describedby={errors.price ? "price-e" : undefined} />
          {errors.price && <span id="price-e" className="error">{errors.price}</span>}
        </div>

        <div className="field">
          <label htmlFor="stock">Stock</label>
          <input id="stock" name="stock" inputMode="numeric" aria-invalid={!!errors.stock} aria-describedby={errors.stock ? "stock-e" : undefined} />
          {errors.stock && <span id="stock-e" className="warn-text">{errors.stock}</span>}
        </div>

        <div className="field full">
          <label htmlFor="desc">Description</label>
          <textarea id="desc" name="description" placeholder="Material, size, care, what is in the box" />
        </div>

        <div className="field full">
          <label htmlFor="photos">Photos (3 to 8, JPG/PNG/WEBP, max 5 MB each, min 800 px)</label>
          <input id="photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple />
        </div>

        <div className="form-actions full">
          <button type="submit" className="btn btn-line" onClick={() => setErrors({})} formNoValidate>Save draft</button>
          <button type="submit" className="btn">Submit for review</button>
        </div>
      </form>

      <p className="muted" style={{ fontSize: 13, margin: 0 }}>
        Submitted products are checked by the platform admin before they go live. Test build: nothing is saved.
      </p>
    </div>
  );
}
