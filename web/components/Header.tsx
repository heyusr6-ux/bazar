"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useSyncExternalStore } from "react";
import { readCart, subscribeCart } from "@/lib/cart";

// The seller dashboard is a separate site. Set NEXT_PUBLIC_SELLER_URL to override.
const SELLER_URL = process.env.NEXT_PUBLIC_SELLER_URL || "https://bazar-yxe6.vercel.app";

function cartCount(): number {
  return readCart().reduce((sum, i) => sum + i.qty, 0);
}

export default function Header() {
  const router = useRouter();
  const count = useSyncExternalStore(subscribeCart, cartCount, () => 0);

  function onSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim() ?? "";
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  }

  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="logo" aria-label="Bazaar BD home">
          Bazaar<span>BD</span>
        </Link>
        <form className="search" role="search" onSubmit={onSearch}>
          <label htmlFor="q" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
            Search products
          </label>
          <input id="q" name="q" type="search" placeholder="Search products, shops" />
          <button type="submit">Search</button>
        </form>
        <nav className="nav-links" aria-label="Main">
          <Link href="/products" className="nav-btn">Buy</Link>
          <a href={SELLER_URL} className="nav-btn nav-btn-sell">Sell</a>
          <Link href="/login">Login</Link>
          <Link href="/cart" aria-label={`Cart, ${count} items`}>Cart ({count})</Link>
        </nav>
      </div>
    </header>
  );
}
