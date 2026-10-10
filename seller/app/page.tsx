import Link from "next/link";
import { formatTaka, salesLast7, sellerOrders, sellerProducts } from "@/lib/data";

export default function SellerOverview() {
  const max = Math.max(...salesLast7.map((d) => d.amount));
  const lowStock = sellerProducts.filter((p) => p.stock > 0 && p.stock <= 5);
  const newOrders = sellerOrders.filter((o) => o.status === "New" || o.status === "Processing");
  const weekTotal = salesLast7.reduce((s, d) => s + d.amount, 0);
  const gross = weekTotal;
  const commission = Math.round(gross * 0.08);

  return (
    <div className="stack" style={{ gap: 16 }}>
      <header className="page-head">
        <h1>Overview</h1>
        <span className="muted">Nakshi Store · test data</span>
      </header>

      <section className="grid-kpi" aria-label="Key numbers">
        <div className="card"><span className="muted">Sales this week</span><b className="kpi">{formatTaka(weekTotal)}</b></div>
        <div className="card"><span className="muted">New orders</span><b className="kpi">{newOrders.length}</b></div>
        <div className="card"><span className="muted">Low stock</span><b className="kpi warn">{lowStock.length}</b></div>
        <div className="card"><span className="muted">Available to withdraw</span><b className="kpi ok">{formatTaka(84300)}</b></div>
      </section>

      <section className="card stack" aria-labelledby="trend-h">
        <div className="row">
          <h2 id="trend-h">Sales, last 7 days</h2>
          <span className="muted" style={{ fontSize: 13 }}>Gross {formatTaka(gross)} · commission 8% {formatTaka(commission)}</span>
        </div>
        <div className="bars" role="img" aria-label="Bar chart of sales for the last 7 days">
          {salesLast7.map((d) => (
            <div key={d.day} className="bar-col">
              <span className="bar-val">{formatTaka(d.amount)}</span>
              <div className="bar" style={{ height: `${Math.round((d.amount / max) * 100)}%` }} />
              <span className="muted" style={{ fontSize: 12 }}>{d.day}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card stack" aria-labelledby="low-h">
        <div className="row">
          <h2 id="low-h">Low stock</h2>
          <Link href="/products" className="link-strong">Manage products</Link>
        </div>
        {lowStock.length === 0 ? (
          <span className="muted">No low stock items.</span>
        ) : (
          lowStock.map((p) => (
            <div key={p.id} className="row">
              <span>{p.name}</span>
              <span className="pill pill-warn">{p.stock} left</span>
            </div>
          ))
        )}
      </section>

      <section className="card stack" aria-labelledby="ord-h">
        <div className="row">
          <h2 id="ord-h">Recent orders</h2>
          <Link href="/orders" className="link-strong">All orders</Link>
        </div>
        {sellerOrders.slice(0, 3).map((o) => (
          <div key={o.id} className="row" style={{ flexWrap: "wrap" }}>
            <span><b>{o.id}</b> <span className="muted">· {o.items}</span></span>
            <span className="pill pill-info">{o.status}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
