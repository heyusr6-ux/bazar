"use client";

import { useState } from "react";
import { sellers, Seller, formatTaka } from "@/lib/data";

export default function SellersPage() {
  const [selectedId, setSelectedId] = useState("s1");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [items, setItems] = useState<Seller[]>(sellers);
  const selected = items.find((s) => s.id === selectedId)!;

  function act(label: string, change: (s: Seller) => Seller, needsReason: boolean) {
    if (needsReason && reason.trim().length < 10) {
      setError("Reason is required (at least 10 characters). It is written to the audit log.");
      return;
    }
    setError("");
    setItems((list) => list.map((s) => (s.id === selectedId ? change(s) : s)));
    setNote(`${label} saved (test build). Audit log entry created in the real backend.`);
    setReason("");
  }

  return (
    <div className="stack" style={{ gap: 16 }}>
      <header className="page-head"><h1>Sellers and KYC</h1></header>

      <div className="table-box">
        <table>
          <caption className="sr-only">Sellers</caption>
          <thead><tr><th>Seller</th><th>Area</th><th>KYC</th><th>Flag</th><th>Status</th><th>Open</th></tr></thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id}>
                <td><b>{s.name}</b><div className="muted" style={{ fontSize: 12 }}>{s.products} products</div></td>
                <td>{s.area}</td>
                <td><span className={s.kyc === "Approved" ? "pill pill-ok" : "pill pill-warn"}>{s.kyc}</span></td>
                <td>{s.flag ?? <span className="muted">None</span>}</td>
                <td><span className={s.status === "Active" ? "pill pill-ok" : "pill pill-danger"}>{s.status}</span></td>
                <td><button type="button" className="btn btn-line btn-sm" onClick={() => { setSelectedId(s.id); setNote(""); setError(""); }}>Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="card stack" aria-labelledby="sel-h">
        <h2 id="sel-h">Control: {selected.name}</h2>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          Held payout: {formatTaka(selected.heldPayout)}. Every action below needs a reason and is logged with your name and time.
        </p>
        <div className="field">
          <label htmlFor="reason">Reason (required for suspend, hold, reject)</label>
          <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Buyer complaints under review" aria-invalid={!!error} aria-describedby={error ? "reason-e" : undefined} />
          {error && <span id="reason-e" className="error" role="alert">{error}</span>}
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-line" onClick={() => act("KYC sent back", (s) => ({ ...s, kyc: "Sent back" }), true)}>Send back for fix</button>
          <button type="button" className="btn btn-danger" onClick={() => act("KYC rejected", (s) => ({ ...s, kyc: "Rejected" }), true)}>Reject KYC</button>
          <button type="button" className="btn btn-danger" onClick={() => act("Seller suspended", (s) => ({ ...s, status: "Suspended" }), true)}>Suspend seller</button>
          <button type="button" className="btn" onClick={() => act("Seller approved and reactivated", (s) => ({ ...s, kyc: "Approved", status: "Active" }), false)}>Approve and activate</button>
        </div>
        {note && <div role="status" className="notice">{note}</div>}
      </section>
    </div>
  );
}
