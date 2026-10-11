"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

// Blocks every admin page until the API confirms an admin session.
// If the check fails or the API is not configured, the user goes to /login.
export default function AuthGate({ children }: { children: ReactNode }) {
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
    fetch(`${API}/api/admin/auth/me`, { credentials: "include" })
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

  if (isLogin || state === "in") return <>{children}</>;

  return (
    <div className="card" style={{ margin: 24 }}>
      <span className="muted">যাচাই হচ্ছে…</span>
    </div>
  );
}
