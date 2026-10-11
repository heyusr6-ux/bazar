// Payouts are not connected yet. This page shows no balances and no working request form.
export default function FinancePage() {
  return (
    <div className="stack" style={{ gap: 16 }}>
      <header className="page-head"><h1>Finance and payouts</h1></header>

      <div className="notice" role="note">
        টাকা তোলা ও হিসাবের ব্যবস্থা এখনো চালু হয়নি। চালু হলে এখানে আপনার বিক্রি, কমিশন ও তোলার অনুরোধ দেখা যাবে।
      </div>

      <section className="card stack">
        <span className="muted" style={{ fontSize: 14 }}>
          এখন কোনো টাকা তোলা যায় না। এখনকার পর্যায়ে ক্রেতারা শুধু Cash on delivery-তে অর্ডার করছেন।
        </span>
      </section>
    </div>
  );
}
