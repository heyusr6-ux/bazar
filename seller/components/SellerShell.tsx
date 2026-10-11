"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import SellerNav from "@/components/SellerNav";

const API = "";

// Every seller page needs a seller session. The login page is the only open page.
export default function SellerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/login";
  const [state, setState] = useState<"checking" | "in" | "out">(isLogin ? "in" : "checking");

  useEffect(() => {
    if (isLogin) {
      setState("in");
      return;
    }
    let alive = true;
    setState("checking");
    fetch(`${API}/api/seller/auth/me`, { credentials: "include" })
      .then((r) => {
        if (!alive) return;
        if (r.ok) {
          setState("in");
        } else {
          setState("out");
          router.replace("/login");
        }
      })
      .catch(() => {
        if (!alive) return;
        setState("out");
        router.replace("/login");
      });
    return () => {
      alive = false;
    };
  }, [pathname, isLogin, router]);

  if (isLogin) {
    return <main className="login-main">{children}</main>;
  }

  if (state !== "in") {
    return (
      <div className="card" style={{ margin: 24 }}>
        <span className="muted">যাচাই হচ্ছে…</span>
      </div>
    );
  }

  return (
    <div className="shell">
      <SellerNav />
      <main className="shell-main">{children}</main>
    </div>
  );
}
