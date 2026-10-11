"use client";

import { useEffect, useState } from "react";
import { formatTaka } from "@/lib/data";

const API = "";

type Line = { name: string; qty: number; unitPrice: number };
type Order = {
  id: string;
  status: "placed" | "processing" | "shipped" | "delivered" | "cancelled";
  address: string;
  placedAt: string;
  amount: number;
  lines: Line[];
};

const LABEL: Record<Order["status"], string> = {
  placed: "New",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`${API}/api/seller/orders`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("load failed");
        return r.json();
      })
      .then((data: Order[]) => {
        if (alive) setOrders(data);
      })
      .catch(() => {
        if (alive) setError("অর্ডারের তালিকা আনা যায়নি। পাতা refresh করুন।");
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="stack" style={{ gap: 16 }}>
      <header className="page-head">
        <h1>Orders</h1>
        <span className="muted" style={{ fontSize: 13 }}>শুধু আপনার পণ্যের অংশ দেখানো হচ্ছে</span>
      </header>

      <div className="notice" role="note">
        অর্ডারের স্ট্যাটাস বদলানো ও ক্রেতাকে জানানোর ব্যবস্থা এখনো চালু হয়নি।
      </div>

      {error && <span className="error" role="alert">{error}</span>}
      {!orders && !error && <span className="muted">লোড হচ্ছে…</span>}

      {orders && orders.length === 0 && (
        <div className="card"><span className="muted">এখনো কোনো অর্ডার নেই।</span></div>
      )}

      {orders && orders.length > 0 && (
        <div className="table-box">
          <table>
            <caption className="sr-only">Your orders</caption>
            <thead>
              <tr><th>Order</th><th>Items</th><th>Amount</th><th>Delivery address</th><th>Status</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <b>{o.id}</b>
                    <div className="muted" style={{ fontSize: 12 }}>{new Date(o.placedAt).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}</div>
                  </td>
                  <td>
                    {o.lines.map((l, i) => (
                      <div key={i} style={{ fontSize: 14 }}>{l.name} × {l.qty}</div>
                    ))}
                  </td>
                  <td>{formatTaka(o.amount)}</td>
                  <td style={{ maxWidth: 260 }}>{o.address}</td>
                  <td><span className="pill pill-info">{LABEL[o.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
