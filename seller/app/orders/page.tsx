"use client";

import { useState } from "react";
import { formatTaka, sellerOrders, SellerOrder } from "@/lib/data";

const tabs: SellerOrder["status"][] = ["New", "Processing", "Ready to ship", "Shipped", "Delivered", "Cancellation requested"];

export default function OrdersPage() {
  const [tab, setTab] = useState<SellerOrder["status"]>("New");
  const [selected, setSelected] = useState<string>("NS-260410-1182A");
  const [message, setMessage] = useState("");
  const list = sellerOrders.filter((o) => o.status === tab);
  const order = sellerOrders.find((o) => o.id === selected);

  return (
    <div className="stack" style={{ gap: 16 }}>
      <header className="page-head">
        <h1>Orders</h1>
        <span className="muted" style={{ fontSize: 13 }}>You see only your own suborders</span>
      </header>

      <div className="tabs" role="tablist" aria-label="Order status">
        {tabs.map((t) => {
          const count = sellerOrders.filter((o) => o.status === t).length;
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={tab === t ? "chip on" : "chip"}
              onClick={() => setTab(t)}
            >
              {t} ({count})
            </button>
          );
        })}
      </div>

      <div className="table-box">
        <table>
          <caption className="sr-only">Orders in {tab}</caption>
          <thead><tr><th>Suborder</th><th>Items</th><th>Amount</th><th>Area</th><th>Payment</th><th>Open</th></tr></thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={6} className="muted">No orders in this status.</td></tr>
            )}
            {list.map((o) => (
              <tr key={o.id}>
                <td><b>{o.id}</b><div className="muted" style={{ fontSize: 12 }}>{o.placedAt}</div></td>
                <td>{o.items}</td>
                <td>{formatTaka(o.amount)}</td>
                <td>{o.area}</td>
                <td>{o.payment}</td>
                <td><button type="button" className="btn btn-line btn-sm" onClick={() => { setSelected(o.id); setMessage(""); }}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {order && (
        <section className="card stack" aria-labelledby="ship-h">
          <h2 id="ship-h">Update: {order.id}</h2>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="courier">Courier</label>
              <select id="courier" defaultValue="Pathao">
                <option>Pathao</option><option>Sundarban</option><option>Other</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="track">Tracking number</label>
              <input id="track" placeholder="e.g. DH-44187" />
            </div>
          </div>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            Status moves only in order: Processing → Ready to ship → Shipped → Delivered. The buyer is notified on each change.
          </p>
          <div className="form-actions">
            <button type="button" className="btn btn-line" onClick={() => setMessage("Cancelled. No change saved.")}>Cancel</button>
            <button type="button" className="btn" onClick={() => setMessage("Saved (test build). Buyer notification is not connected.")}>
              Save and notify buyer
            </button>
          </div>
          {message && <div role="status" className="notice">{message}</div>}
        </section>
      )}
    </div>
  );
}
