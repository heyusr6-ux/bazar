"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Public values only. Secrets stay on the API.
const API = process.env.NEXT_PUBLIC_API_URL ?? "";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

declare global {
  interface Window {
    google?: any;
  }
}

// Reads the display name from the Google ID token. The API checks the token itself.
function nameFromCredential(credential: string): string {
  try {
    const part = credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(decodeURIComponent(escape(atob(part))));
    return typeof json.name === "string" ? json.name : "";
  } catch {
    return "";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const googleRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const existing = document.querySelector(`script[src="https://accounts.google.com/gsi/client"]`);
    const script = (existing as HTMLScriptElement) ?? document.createElement("script");
    const init = () => {
      if (!alive || !window.google || !googleRef.current || !GOOGLE_CLIENT_ID) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (resp: { credential: string }) => onGoogle(resp.credential),
      });
      window.google.accounts.id.renderButton(googleRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        width: 280,
      });
      setReady(true);
    };
    if (!existing) {
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = init;
      document.head.appendChild(script);
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
      const res = await fetch(`${API}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credential, name: nameFromCredential(credential) }),
      });
      if (res.ok) {
        router.push("/");
        return;
      }
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Sign-in failed");
    } catch {
      setError("সার্ভারের সাথে যোগাযোগ হয়নি। আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card stack" style={{ maxWidth: 440, margin: "24px auto" }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>Sign in or create account</h1>
      <p className="muted" style={{ margin: 0, fontSize: 14 }}>
        Google দিয়ে এক ক্লিকে ঢুকুন। নতুন হলে account নিজে থেকেই তৈরি হবে।
      </p>

      <div ref={googleRef} style={{ minHeight: 44 }} />
      {!ready && <span className="muted" style={{ fontSize: 13 }}>লোড হচ্ছে…</span>}
      {busy && <span className="muted" style={{ fontSize: 13 }}>যাচাই হচ্ছে…</span>}
      {error && <span className="error" role="alert">{error}</span>}

      <div className="notice" style={{ fontSize: 13 }}>
        Gmail ছাড়া email দিয়ে sign-up শীঘ্রই আসছে। এখন Google দিয়ে ঢুকতে হবে।
      </div>
    </div>
  );
}
