import { rules } from "@/lib/data";

export default function RulesPage() {
  const items = [
    { label: "Platform commission", value: `${rules.commission}%`, note: "Per category can be set, change needs 2nd admin" },
    { label: "Max seller coupon discount", value: `${rules.maxSellerCouponPercent}%`, note: "Sellers cannot go higher" },
    { label: "Return window", value: `${rules.returnWindowDays} days`, note: "Unused items with tags only" },
    { label: "Cash on delivery limit", value: `৳ ${rules.codLimit.toLocaleString("en-US")}`, note: "Orders above this must pay online" },
    { label: "Second approval above", value: `৳ ${rules.secondApprovalAbove.toLocaleString("en-US")}`, note: "Payouts above this need two admins" },
    { label: "KYC review SLA", value: `${rules.kycSlaWorkingDays} working days`, note: "Shown as Over SLA after this" },
  ];

  return (
    <div className="stack" style={{ gap: 16 }}>
      <header className="page-head"><h1>Business rules</h1></header>
      <div className="notice">
        These values are read by the platform. Changing one needs a reason and a second admin, and the change is logged with old and new value.
      </div>
      <div className="table-box">
        <table>
          <caption className="sr-only">Current rules</caption>
          <thead><tr><th>Rule</th><th>Current value</th><th>Note</th></tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.label}>
                <td><b>{i.label}</b></td>
                <td>{i.value}</td>
                <td className="muted">{i.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ fontSize: 13, margin: 0 }}>Values shown here are mock. The rules are not stored yet.</p>
    </div>
  );
}
