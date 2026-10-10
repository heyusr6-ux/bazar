import Link from "next/link";
import { formatTaka, payouts, sellers } from "@/lib/data";

export default function AdminOverview() {
  const kycPending = sellers.filter((s) => s.kyc === "Pending").length;
  const waiting = payouts.filter((p) => p.state === "Waiting").length;
  const suspended = sellers.filter((s) => s.status === "Suspended").length;

  return (
    <div className="stack" style={{ gap: 16 }}>
      <header className="page-head"><h1>Admin overview</h1><span className="muted" style={{ fontSize: 13 }}>Test data</span></header>

      <section className="grid-kpi" aria-label="Queues">
        <div className="card"><span className="muted">Seller KYC waiting</span><b className="kpi warn">{kycPending}</b></div>
        <div className="card"><span className="muted">Payouts waiting approval</span><b className="kpi warn">{waiting}</b></div>
        <div className="card"><span className="muted">Suspended sellers</span><b className="kpi">{suspended}</b></div>
        <div className="card"><span className="muted">Commission rate</span><b className="kpi">8%</b></div>
      </section>

      <section className="card stack">
        <div className="row"><h2>Needs action today</h2></div>
        <div className="row"><span>Mirpur Mobile Hub KYC is over the 2-day SLA</span><Link href="/sellers" className="link-strong">Open</Link></div>
        <div className="row"><span>Nakshi Store payout {formatTaka(84300)} needs approval</span><Link href="/payouts" className="link-strong">Open</Link></div>
        <div className="row"><span>Cheap Gadget BD is suspended, 3 complaints open</span><Link href="/sellers" className="link-strong">Open</Link></div>
      </section>
    </div>
  );
}
