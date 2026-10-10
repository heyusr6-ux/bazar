"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Overview" },
  { href: "/sellers", label: "Sellers and KYC" },
  { href: "/payouts", label: "Payouts" },
  { href: "/rules", label: "Business rules" },
  { href: "/audit", label: "Audit log" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="side" aria-label="Admin navigation">
      <Link href="/" className="side-logo">
        Bazaar<span>BD</span> <small>Admin</small>
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
