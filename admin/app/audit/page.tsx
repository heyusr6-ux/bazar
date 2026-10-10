import { auditLog } from "@/lib/data";

export default function AuditPage() {
  return (
    <div className="stack" style={{ gap: 16 }}>
      <header className="page-head"><h1>Audit log</h1><span className="muted" style={{ fontSize: 13 }}>Read only</span></header>
      <div className="table-box">
        <table>
          <caption className="sr-only">Admin actions</caption>
          <thead><tr><th>Time</th><th>Admin</th><th>Action</th><th>Target</th><th>Reason</th></tr></thead>
          <tbody>
            {auditLog.map((a) => (
              <tr key={a.time + a.action}>
                <td>{a.time}</td>
                <td>{a.who}</td>
                <td>{a.action}</td>
                <td>{a.target}</td>
                <td className="muted">{a.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ fontSize: 13, margin: 0 }}>Audit entries cannot be edited or deleted by anyone, including super admins.</p>
    </div>
  );
}
