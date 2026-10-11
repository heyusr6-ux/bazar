"use client";

import { useState } from "react";
import { payouts, Payout, formatTaka, rules } from "@/lib/data";

export default function PayoutsPage() {
  const [items, setItems] = useState<Payout[]>(payouts);
  const [selectedId, setSelectedId] = useState("PO-1");
  const [note, setNote] = useState("");
  const selected = items.find((p) => p.id === selectedId)!;
  const needsSecond = selected.amount > rules.secondApprovalAbove;

  function setState(state: Payout["state"], message: string) {
    setItems((list) => list.map((p) => (p.id === selectedId ? { ...p, state } : p)));
    setNote(message);
  }

  return (
    <div className="stack" style={{ gap: 16 }}>
      <header className="page-head"><h1>Payout approval</h1></header>
      <div className="notice" role="note">Payout ব্যবস্থা এখনো চালু হয়নি। এই পাতার কোনো বাটন টাকা পাঠায় না বা database-এ কিছু সংরক্ষণ করে না।</div>

      <div className="table-box">
        <table>
          <caption className="sr-only">Withdrawal requests</caption>
          <thead><tr><th>Seller</th><th>Amount</th><th>Method</th><th>Checks</th><th>State</th><th>Open</th></tr></thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td><b>{p.seller}</b></td>
                <td>{formatTaka(p.amount)}</td>
                <td>{p.method}</td>
                <td>{p.check}</td>
                <td>
                  <span className={p.state === "Waiting" ? "pill pill-warn" : p.state === "Held" ? "pill pill-danger" : "pill pill-info"}>
                    {p.state}
                  </span>
                </td>
                <td><button type="button" className="btn btn-line btn-sm" onClick={() => { setSelectedId(p.id); setNote(""); }}>Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="card stack" aria-labelledby="pa-h">
        <h2 id="pa-h">Approve: {selected.seller} · {formatTaka(selected.amount)}</h2>
        <div className="notice">
          Check: {selected.check}. {needsSecond ? `Above ${formatTaka(rules.secondApprovalAbove)}, so a second admin must approve.` : "Single admin approval is enough."}
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-danger" disabled onClick={() => setState("Held", "Payout held. Reason goes to the audit log.")}>Hold</button>
          <button type="button" className="btn" disabled onClick={() => setState("Waiting", "Approved (test build). Payment is not sent: payout provider is not connected.")}>
            {needsSecond ? "Request second approval" : "Approve payout"}
          </button>
        </div>
        {selected.state === "Blocked" && <span className="muted" style={{ fontSize: 13 }}>Blocked until bank verification is complete.</span>}
        {note && <div role="status" className="notice">{note}</div>}
      </section>
    </div>
  );
}
