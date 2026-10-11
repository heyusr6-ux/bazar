"use client";

import { FormEvent, useRef, useState } from "react";

// Shrinks a photo on the phone to a JPEG at most 1000 px wide, so the upload stays small.
async function toJpegDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}

const API = "";

export default function NewProductPage() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<"" | "draft" | "review">("");
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  const [photoNote, setPhotoNote] = useState("");
  const photoFiles = useRef<File[]>([]);

  // Checks file type and size on the phone before anything is sent.
  function checkPhotos(files: FileList | null): string {
    if (!files || files.length === 0) return "";
    if (files.length > 8) return "সর্বোচ্চ ৮টা ছবি দিতে পারবেন।";
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    for (const f of Array.from(files)) {
      if (!allowed.includes(f.type)) return "শুধু JPG, PNG বা WEBP ছবি দিন।";
      if (f.size > 5 * 1024 * 1024) return "প্রতিটা ছবি ৫ MB-এর কম হতে হবে।";
    }
    return "";
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget; // keep a reference: currentTarget is cleared after await
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
    if (mode === "review" && photoFiles.current.length < 3) next.photos = "Submit করতে ৩ থেকে ৮টা ছবি দিন।";
    setErrors(next);
    setServerError("");
    setResult("");
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    try {
      const photos = await Promise.all(photoFiles.current.map(toJpegDataUrl));
      const res = await fetch(`${API}/api/seller/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: title,
          photos,
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
      form.reset();
      photoFiles.current = [];
      setPhotoNote("");
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

        <div className="field full">
          <label htmlFor="photos">Photos (3 to 8, JPG/PNG/WEBP, max 5 MB each)</label>
          <input id="photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => { const files = e.currentTarget.files; setPhotoNote(checkPhotos(files)); photoFiles.current = files ? Array.from(files) : []; }} />
          {photoNote && <span className="error" role="alert">{photoNote}</span>}
          {errors.photos && <span className="error">{errors.photos}</span>}
        </div>

        <div className="form-actions full">
          <button type="submit" className="btn btn-line" data-kind="draft" formNoValidate disabled={busy}>Save draft</button>
          <button type="submit" className="btn" data-kind="review" disabled={busy}>Submit for review</button>
        </div>
      </form>
    </div>
  );
}
