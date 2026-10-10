"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";

export default function AddToCartButton({ slug, disabled }: { slug: string; disabled?: boolean }) {
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      className="btn"
      disabled={disabled}
      onClick={() => {
        addToCart(slug, 1);
        setAdded(true);
      }}
    >
      {disabled ? "Out of stock" : added ? "Added to cart" : "Add to cart"}
    </button>
  );
}
