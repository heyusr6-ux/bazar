"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Overview" },
  { href: "/products", label: "Products" },
  { href: "/orders", label: "Orders" },
  { href: "/finance", label: "Finance" },
  { href: "/login", label: "Sign in" },
];

export default function SellerNav() {
  const pathname = usePathname();
  return (
    <nav className="side" aria-label="Seller navigation">
      <Link href="/" className="side-logo">
        Bazaar<span>BD</span> <small>Seller</small>
      </Link>
      {items.map((i) => {
        const active = i.href === "/" ? pathname === "/" : pathname.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} className={active ? "on" : ""} aria-current={active ? "page" : undefined}>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
