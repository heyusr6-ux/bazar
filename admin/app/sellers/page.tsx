"use client";

import { useEffect, useState } from "react";

// Live data from the API. Every change needs a reason, and the API writes it to the audit log.
const API = "";

type Seller = {
  id: string;
  name: string;
  kyc: "pending" | "approved" | "sent_back" | "rejected";
  status: "active" | "suspended";
  area: string;
  productCount: number;
};

const KYC_LABEL: Record<Seller["kyc"], string> = {
  pending: "Pending",
  approved: "Approved",
  sent_back: "Sent back",
  rejected: "Rejected",
};

export default function SellersPage() {
  const [items, setItems] = useState<Seller[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API}/api/admin/sellers`, { credentials: "include" });
        if (!res.ok) throw new Error("load failed");
        const data: Seller[] = await res.json();
        if (!alive) return;
        setItems(data);
        setSelectedId(data[0]?.id ?? null);
      } catch {
        if (alive) setError("ডেটা আনা যায়নি। পাতা refresh করুন।");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const selected = items.find((s) => s.id === selectedId) ?? null;

  async function act(label: string, change: { kyc?: string; status?: string }) {
    if (!selected) return;
    if (reason.trim().length < 10) {
      setError("কারণ লিখুন (কমপক্ষে ১০ অক্ষর)। এটা audit log-এ যাবে।");
      return;
    }
    setBusy(true);
    setError("");
    setNote("");
    try {
      const res = await fetch(`${API}/api/admin/sellers/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...change, reason: reason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "কাজটি হয়নি। আবার চেষ্টা করুন।");
        return;
      }
      setItems((list) => list.map((s) => (s.id === selected.id ? { ...s, ...data } : s)));
      setNote(`${label} সম্পন্ন হয়েছে। Audit log-এ লেখা হয়েছে।`);
      setReason("");
    } catch {
      setError("সার্ভারের সাথে যোগাযোগ হয়নি।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack" style={{ gap: 16 }}>
      <header className="page-head">
        <h1>Sellers and KYC</h1>
      </header>

      {loading && <span className="muted">লোড হচ্ছে…</span>}
      {!loading && items.length === 0 && !error && <span className="muted">কোনো seller নেই।</span>}

      {items.length > 0 && (
        <div className="table-box">
          <table>
            <caption className="sr-only">Sellers</caption>
            <thead>
              <tr>
                <th>Seller</th>
                <th>Area</th>
                <th>Products</th>
                <th>KYC</th>
                <th>Status</th>
                <th>Open</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id}>
                  <td>
                    <b>{s.name}</b>
                  </td>
                  <td>{s.area || "—"}</td>
                  <td>{s.productCount}</td>
                  <td>
                    <span className={s.kyc === "approved" ? "pill pill-ok" : "pill pill-warn"}>
                      {KYC_LABEL[s.kyc]}
                    </span>
                  </td>
                  <td>
                    <span className={s.status === "active" ? "pill pill-ok" : "pill pill-danger"}>
                      {s.status === "active" ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-line btn-sm"
                      onClick={() => {
                        setSelectedId(s.id);
                        setNote("");
                        setError("");
                      }}
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <section className="card stack" aria-labelledby="sel-h">
          <h2 id="sel-h">Control: {selected.name}</h2>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            প্রতিটা কাজের জন্য কারণ লাগবে, আর সেটা আপনার নাম ও সময়সহ audit log-এ যাবে।
          </p>
          <div className="field">
            <label htmlFor="reason">কারণ (কমপক্ষে ১০ অক্ষর)</label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="যেমন: KYC নথি যাচাই চলছে"
              aria-invalid={!!error}
              aria-describedby={error ? "reason-e" : undefined}
            />
            {error && (
              <span id="reason-e" className="error" role="alert">
                {error}
              </span>
            )}
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-line" disabled={busy} onClick={() => act("Sent back for fix", { kyc: "sent_back" })}>
              Send back for fix
            </button>
            <button type="button" className="btn btn-danger" disabled={busy} onClick={() => act("KYC rejected", { kyc: "rejected" })}>
              Reject KYC
            </button>
            <button type="button" className="btn btn-danger" disabled={busy} onClick={() => act("Seller suspended", { status: "suspended" })}>
              Suspend seller
            </button>
            <button type="button" className="btn" disabled={busy} onClick={() => act("Seller approved and activated", { kyc: "approved", status: "active" })}>
              Approve and activate
            </button>
          </div>
          {note && (
            <div role="status" className="notice">
              {note}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
