"use client";

import { FormEvent, useState } from "react";
import { formatTaka } from "@/lib/data";

const AVAILABLE = 84300;
const MIN_WITHDRAW = 500;
const FEE = 10;

export default function FinancePage() {
  const [amount, setAmount] = useState(String(AVAILABLE));
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function request(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const n = Number(amount.replace(/,/g, ""));
    if (!n || n < MIN_WITHDRAW) return setError(`Minimum withdrawal is ${formatTaka(MIN_WITHDRAW)}.`);
    if (n > AVAILABLE) return setError(`You can withdraw up to ${formatTaka(AVAILABLE)}.`);
    setError("");
    setDone(true);
  }

  return (
    <div className="stack" style={{ gap: 16 }}>
      <header className="page-head"><h1>Finance and payouts</h1></header>

      <section className="grid-kpi" aria-label="Balances">
        <div className="card"><span className="muted">Available to withdraw</span><b className="kpi ok">{formatTaka(AVAILABLE)}</b></div>
        <div className="card"><span className="muted">Pending (7 days after delivery)</span><b className="kpi warn">{formatTaka(112400)}</b></div>
        <div className="card"><span className="muted">Held (disputed)</span><b className="kpi">{formatTaka(0)}</b></div>
        <div className="card"><span className="muted">Last payout, 2 Oct</span><b className="kpi">{formatTaka(42000)}</b></div>
      </section>

      <div className="split-two">
        <form className="card stack" onSubmit={request} noValidate>
          <h2>Request withdrawal</h2>
          <div className="field">
            <label htmlFor="amt">Amount (৳)</label>
            <input id="amt" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={!!error} aria-describedby="amt-h" />
            <span id="amt-h" className="muted" style={{ fontSize: 12 }}>Maximum available: {formatTaka(AVAILABLE)}</span>
            {error && <span className="error" role="alert">{error}</span>}
          </div>
          <div className="field">
            <label htmlFor="method">Method</label>
            <select id="method" defaultValue="bkash">
              <option value="bkash">bKash ••••4471</option>
              <option value="bank">Bank ••••2290</option>
            </select>
          </div>
          <div className="notice">Fee {formatTaka(FEE)} per withdrawal. Processing 2–3 working days. Payout is not connected in this test build.</div>
          <button type="submit" className="btn">Request withdrawal</button>
          {done && <div role="status" className="notice">Request recorded as pending approval (test build, not sent).</div>}
        </form>

        <section className="card stack">
          <h2>Earnings this month</h2>
          <div className="row muted"><span>Gross sales</span><span>{formatTaka(240000)}</span></div>
          <div className="row muted"><span>Platform commission (8%)</span><span>− {formatTaka(18000)}</span></div>
          <div className="row muted"><span>Refund deductions</span><span>− {formatTaka(4200)}</span></div>
          <div className="row muted"><span>Discounts you fund</span><span>− {formatTaka(6100)}</span></div>
          <div className="row" style={{ fontWeight: 800, borderTop: "1px solid #eef1f0", paddingTop: 8 }}>
            <span>Net earnings</span><span>{formatTaka(211700)}</span>
          </div>
        </section>
      </div>

      <div className="table-box">
        <table>
          <caption className="sr-only">Transaction history</caption>
          <thead><tr><th>Date</th><th>Type</th><th>Reference</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>10 Oct</td><td>Sale (NS-260410-1182A)</td><td>BZ-260410-1182</td><td>+ {formatTaka(2254)}</td><td><span className="pill pill-warn">Pending</span></td></tr>
            <tr><td>8 Oct</td><td>Refund deduction</td><td>BZ-260405-0612</td><td>− {formatTaka(1200)}</td><td><span className="pill pill-ok">Applied</span></td></tr>
            <tr><td>2 Oct</td><td>Payout</td><td>PO-88021</td><td>− {formatTaka(42000)}</td><td><span className="pill pill-ok">Paid</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
