// Product data for the buyer site. Uses the API when NEXT_PUBLIC_API_URL is set.
import type { Product } from "./data";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

export type ApiProduct = {
  slug: string;
  name: string;
  price: number;
  oldPrice?: number;
  stock: number;
  seller: string;
  category: string;
  description: string;
  tone: string;
  imageCount?: number;
};

// The API has no ratings or reviews yet, so those show as zero.
export function fromApi(p: ApiProduct): Product {
  return {
    slug: p.slug,
    name: p.name,
    price: p.price,
    oldPrice: p.oldPrice,
    seller: p.seller,
    sellerVerified: false,
    rating: 0,
    reviews: 0,
    category: p.category,
    stock: p.stock,
    tone: p.tone,
    description: p.description,
    images: Array.from({ length: p.imageCount ?? 0 }, (_, i) => `${API}/api/products/${p.slug}/images/${i}`),
  };
}

export async function loadProducts(): Promise<Product[]> {
  if (!API) return (await import("./data")).products;
  try {
    const res = await fetch(`${API}/api/products`, { cache: "no-store" });
    if (!res.ok) return [];
    const data: ApiProduct[] = await res.json();
    return data.map(fromApi);
  } catch {
    return [];
  }
}

export async function loadProduct(slug: string): Promise<Product | null> {
  if (!API) return (await import("./data")).getProduct(slug) ?? null;
  try {
    const res = await fetch(`${API}/api/products/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (!res.ok) return null;
    return fromApi(await res.json());
  } catch {
    return null;
  }
}
