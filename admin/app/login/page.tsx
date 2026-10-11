"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Public values only. Secrets stay on the API.
const API = "";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

declare global {
  interface Window {
    google?: any;
    turnstile?: any;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("load failed"));
    document.head.appendChild(s);
  });
}

export default function AdminLoginPage() {
  const router = useRouter();
  const captchaRef = useRef<HTMLDivElement>(null);
  const googleRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const captchaToken = useRef<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([
          loadScript("https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"),
          loadScript("https://accounts.google.com/gsi/client"),
        ]);
      } catch {
        setError("Login সেবা লোড হয়নি। Page refresh করুন।");
        return;
      }
      if (cancelled) return;

      if (window.turnstile && captchaRef.current && TURNSTILE_SITE_KEY) {
        widgetId.current = window.turnstile.render(captchaRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => (captchaToken.current = token),
          "expired-callback": () => (captchaToken.current = null),
          "error-callback": () => (captchaToken.current = null),
        });
      }

      if (window.google && googleRef.current && GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (resp: { credential: string }) => onGoogle(resp.credential),
        });
        window.google.accounts.id.renderButton(googleRef.current, {
          theme: "outline",
          size: "large",
          text: "signin_with",
          width: 280,
        });
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onGoogle(credential: string) {
    setError("");
    if (!captchaToken.current) {
      setError("আগে নিচের নিরাপত্তা যাচাই (captcha) সম্পন্ন করুন, তারপর Google দিয়ে ঢুকুন।");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credential, turnstileToken: captchaToken.current }),
      });
      if (res.ok) {
        router.push("/");
        return;
      }
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Login failed");
    } catch {
      setError("সার্ভারের সাথে যোগাযোগ হয়নি। আবার চেষ্টা করুন।");
    } finally {
      // Captcha tokens work only once, so reset it after every attempt.
      captchaToken.current = null;
      if (window.turnstile && widgetId.current) window.turnstile.reset(widgetId.current);
      setBusy(false);
    }
  }

  return (
    <div className="card stack" style={{ maxWidth: 440, margin: "24px auto" }}>
      <h1>Admin sign in</h1>
      <p className="muted" style={{ margin: 0, fontSize: 14 }}>
        প্রথমে নিরাপত্তা যাচাই সম্পন্ন করুন, তারপর Google দিয়ে ঢুকুন।
      </p>

      <div ref={captchaRef} />

      <div ref={googleRef} style={{ minHeight: 44 }} />

      {!ready && <span className="muted" style={{ fontSize: 13 }}>লোড হচ্ছে…</span>}
      {busy && <span className="muted" style={{ fontSize: 13 }}>যাচাই হচ্ছে…</span>}
      {error && (
        <span role="alert" style={{ color: "#B3261E", fontSize: 14 }}>
          {error}
        </span>
      )}
    </div>
  );
}
