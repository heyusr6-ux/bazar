"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import AdminNav from "./AdminNav";
import AuthGate from "./AuthGate";

// Login gets a plain centred page. Every other page gets the admin menu and needs a session.
export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") {
    return (
      <AuthGate>
        <main className="login-main">{children}</main>
      </AuthGate>
    );
  }
  return (
    <AuthGate>
      <div className="shell">
        <AdminNav />
        <main className="shell-main">{children}</main>
      </div>
    </AuthGate>
  );
}
