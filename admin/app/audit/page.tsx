"use client";

import { useEffect, useState } from "react";

// Read-only log from the API. Entries cannot be edited or deleted.
const API = process.env.NEXT_PUBLIC_API_URL ?? "";

type Entry = {
  at: string;
  actor: string;
  action: string;
  target: string;
  reason: string;
  before: string | null;
  after: string | null;
};

export default function AuditPage() {
  const [items, setItems] = useState<Entry[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API}/api/admin/audit`, { credentials: "include" });
        if (!res.ok) throw new Error("load failed");
        const data: Entry[] = await res.json();
        if (alive) setItems(data);
      } catch {
        if (alive) setError("ডেটা আনা যায়নি। পাতা refresh করুন।");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="stack" style={{ gap: 16 }}>
      <header className="page-head">
        <h1>Audit log</h1>
        <span className="muted" style={{ fontSize: 13 }}>Read only</span>
      </header>
      {loading && <span className="muted">লোড হচ্ছে…</span>}
      {error && <span className="error" role="alert">{error}</span>}
      {!loading && !error && items.length === 0 && <span className="muted">এখনো কোনো কাজ লেখা হয়নি।</span>}
      {items.length > 0 && (
        <div className="table-box">
          <table>
            <caption className="sr-only">Admin actions</caption>
            <thead>
              <tr>
                <th>Time</th>
                <th>Who</th>
                <th>Action</th>
                <th>Target</th>
                <th>Change</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a, i) => (
                <tr key={`${a.at}-${i}`}>
                  <td>{new Date(a.at).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}</td>
                  <td>{a.actor}</td>
                  <td>{a.action}</td>
                  <td>{a.target}</td>
                  <td className="muted">{a.before ?? "—"} → {a.after ?? "—"}</td>
                  <td className="muted">{a.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted" style={{ fontSize: 13, margin: 0 }}>কোনো entry কেউ বদলাতে বা মুছতে পারবে না, super admin-ও না।</p>
    </div>
  );
}
