"use client";

// Client-side catalogue for cart and checkout. Returns null while loading.
import { useEffect, useState } from "react";
import type { Product } from "./data";
import { ApiProduct, fromApi } from "./catalog";

const API = process.env.NEXT_PUBLIC_API_URL || "https://bazar-api-sigma.vercel.app";

export function useCatalog(): Product[] | null {
  const [list, setList] = useState<Product[] | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`${API}/api/products`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ApiProduct[]) => {
        if (alive) setList(data.map(fromApi));
      })
      .catch(() => {
        if (alive) setList([]);
      });
    return () => {
      alive = false;
    };
  }, []);
  return list;
}
