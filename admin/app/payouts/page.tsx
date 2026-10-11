// Payouts are not connected yet. This page shows no data and has no working buttons,
// so nothing here can look like a real payment.
export default function PayoutsPage() {
  return (
    <div className="stack" style={{ gap: 16 }}>
      <header className="page-head"><h1>Payouts</h1></header>
      <div className="notice" role="note">
        Seller payout ব্যবস্থা এখনো চালু হয়নি। পেমেন্ট প্রদানকারী (payout provider) যুক্ত হলে এখানে টাকা তোলার অনুরোধ ও অনুমোদন দেখা যাবে।
      </div>
      <section className="card stack">
        <span className="muted" style={{ fontSize: 14 }}>
          এখন কোনো টাকা পাঠানো বা অনুমোদন করা যায় না। এখনকার পর্যায়ে শুধু Cash on delivery চালু আছে।
        </span>
      </section>
    </div>
  );
}
