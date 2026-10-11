"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

declare global {
  interface Window {
    google?: any;
  }
}

export default function SellerLoginPage() {
  const router = useRouter();
  const googleRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const existing = document.querySelector(`script[src="https://accounts.google.com/gsi/client"]`);
    const init = () => {
      if (!alive || !window.google || !googleRef.current || !GOOGLE_CLIENT_ID) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (resp: { credential: string }) => onGoogle(resp.credential),
      });
      window.google.accounts.id.renderButton(googleRef.current, { theme: "outline", size: "large", text: "signin_with", width: 280 });
      setReady(true);
    };
    if (!existing) {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.onload = init;
      document.head.appendChild(s);
    } else {
      init();
    }
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onGoogle(credential: string) {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/seller/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credential }),
      });
      if (res.ok) {
        router.push("/");
        return;
      }
      setError("এই Google account-এর সাথে seller হিসেবে কোনো অনুমতি পাওয়া যায়নি।");
    } catch {
      setError("সার্ভারের সাথে যোগাযোগ হয়নি। আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card stack" style={{ maxWidth: 440, margin: "24px auto" }}>
      <h1>Seller sign in</h1>
      <p className="muted" style={{ margin: 0, fontSize: 14 }}>
        Seller account-এর Gmail দিয়ে ঢুকুন।
      </p>
      <div ref={googleRef} style={{ minHeight: 44 }} />
      {!ready && <span className="muted" style={{ fontSize: 13 }}>লোড হচ্ছে…</span>}
      {busy && <span className="muted" style={{ fontSize: 13 }}>যাচাই হচ্ছে…</span>}
      {error && <span role="alert" className="error">{error}</span>}
    </div>
  );
}
