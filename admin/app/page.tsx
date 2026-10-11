"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Live numbers from the API. Nothing here is mock data.
const API = "";

type Seller = {
  id: string;
  name: string;
  area: string;
  kyc: "pending" | "approved" | "sent_back" | "rejected";
  status: "active" | "suspended";
  productCount: number;
};

type Rule = { key: string; value: number; label: string };

export default function AdminOverview() {
  const [sellers, setSellers] = useState<Seller[] | null>(null);
  const [rules, setRules] = useState<Rule[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [sRes, rRes] = await Promise.all([
          fetch(`${API}/api/admin/sellers`, { credentials: "include" }),
          fetch(`${API}/api/admin/rules`, { credentials: "include" }),
        ]);
        if (!sRes.ok || !rRes.ok) throw new Error("load failed");
        const [s, r] = await Promise.all([sRes.json() as Promise<Seller[]>, rRes.json() as Promise<Rule[]>]);
        if (!alive) return;
        setSellers(s);
        setRules(r);
      } catch {
        if (alive) setError("ডেটা আনা যায়নি। পাতা refresh করুন।");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const kycPending = sellers?.filter((s) => s.kyc === "pending") ?? [];
  const suspended = sellers?.filter((s) => s.status === "suspended") ?? [];
  const commission = rules?.find((r) => r.key === "commission_percent")?.value;

  return (
    <div className="stack" style={{ gap: 16 }}>
      <header className="page-head"><h1>Admin overview</h1></header>

      {error && <span className="error" role="alert">{error}</span>}
      {!sellers && !error && <span className="muted">লোড হচ্ছে…</span>}

      {sellers && (
        <>
          <section className="grid-kpi" aria-label="Queues">
            <div className="card"><span className="muted">Seller KYC waiting</span><b className="kpi warn">{kycPending.length}</b></div>
            <div className="card"><span className="muted">Suspended sellers</span><b className="kpi">{suspended.length}</b></div>
            <div className="card"><span className="muted">Total sellers</span><b className="kpi">{sellers.length}</b></div>
            <div className="card"><span className="muted">Commission rate</span><b className="kpi">{commission !== undefined ? `${commission}%` : "—"}</b></div>
          </section>

          <section className="card stack">
            <div className="row"><h2>Needs action</h2></div>
            {kycPending.length === 0 && suspended.length === 0 && (
              <span className="muted">এখন কিছু করার নেই।</span>
            )}
            {kycPending.map((s) => (
              <div className="row" key={s.id}>
                <span>{s.name} ({s.area || "এলাকা নেই"}) — KYC পর্যালোচনা বাকি</span>
                <Link href="/sellers" className="link-strong">Open</Link>
              </div>
            ))}
            {suspended.map((s) => (
              <div className="row" key={s.id}>
                <span>{s.name} স্থগিত আছে</span>
                <Link href="/sellers" className="link-strong">Open</Link>
              </div>
            ))}
          </section>

          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            Payout এখনো চালু হয়নি, তাই এখানে টাকা তোলার হিসাব নেই।
          </p>
        </>
      )}
    </div>
  );
}
