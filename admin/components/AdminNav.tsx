"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

const items = [
  { href: "/", label: "Overview" },
  { href: "/sellers", label: "Sellers and KYC" },
  { href: "/products", label: "Products" },
  { href: "/payouts", label: "Payouts" },
  { href: "/rules", label: "Business rules" },
  { href: "/audit", label: "Audit log" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === "/login") return null;

  async function signOut() {
    try {
      await fetch(`${API}/api/admin/auth/logout`, { method: "POST", credentials: "include" });
    } finally {
      router.replace("/login");
    }
  }

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
      <button type="button" className="side-logout" onClick={signOut}>Sign out</button>
    </nav>
  );
}
