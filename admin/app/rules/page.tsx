"use client";

import { useEffect, useState } from "react";

// Live business rules. Every change needs a reason and is written to the audit log by the API.
const API = "";

type Rule = { key: string; value: number; label: string; note: string };

const UNIT: Record<string, string> = {
  commission_percent: "%",
  max_seller_coupon_percent: "%",
  return_window_days: " দিন",
  cod_limit_taka: "",
  second_approval_above_taka: "",
  kyc_sla_working_days: " কার্যদিবস",
};

const TAKA_KEYS = new Set(["cod_limit_taka", "second_approval_above_taka"]);

function show(rule: Rule): string {
  if (TAKA_KEYS.has(rule.key)) return `৳ ${rule.value.toLocaleString("en-US")}`;
  return `${rule.value}${UNIT[rule.key] ?? ""}`;
}

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editKey, setEditKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API}/api/admin/rules`, { credentials: "include" });
        if (!res.ok) throw new Error("load failed");
        const data: Rule[] = await res.json();
        if (alive) setRules(data);
      } catch {
        if (alive) setLoadError("নিয়ম আনা যায়নি। পাতা refresh করুন।");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  function startEdit(r: Rule) {
    setEditKey(r.key);
    setDraft(String(r.value));
    setReason("");
    setError("");
    setNote("");
  }

  async function save(r: Rule) {
    if (reason.trim().length < 10) {
      setError("কারণ লিখুন (কমপক্ষে ১০ অক্ষর)। এটা audit log-এ যাবে।");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/admin/rules/${r.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ value: Number(draft), reason: reason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "পরিবর্তন হয়নি। আবার চেষ্টা করুন।");
        return;
      }
      setRules((list) => list.map((x) => (x.key === r.key ? { ...x, value: data.value } : x)));
      setNote(`${r.label} পরিবর্তন হয়েছে। Audit log-এ লেখা হয়েছে।`);
      setEditKey(null);
      setReason("");
    } catch {
      setError("সার্ভারের সাথে যোগাযোগ হয়নি।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack" style={{ gap: 16 }}>
      <header className="page-head"><h1>Business rules</h1></header>
      <div className="notice">
        নিয়ম বদলালে তা সাথে সাথে কার্যকর হয় এবং audit log-এ আগের ও পরের মান লেখা থাকে। কারণ ছাড়া পরিবর্তন হয় না।
      </div>

      {note && <div role="status" className="notice">{note}</div>}
      {loading && <span className="muted">লোড হচ্ছে…</span>}
      {loadError && <span className="error" role="alert">{loadError}</span>}

      {rules.length > 0 && (
        <div className="table-box">
          <table>
            <caption className="sr-only">Business rules</caption>
            <thead>
              <tr>
                <th>Rule</th>
                <th>Current value</th>
                <th>Note</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.key}>
                  <td><b>{r.label}</b></td>
                  <td>{show(r)}</td>
                  <td className="muted">{r.note}</td>
                  <td>
                    {editKey !== r.key && (
                      <button type="button" className="btn btn-line btn-sm" onClick={() => startEdit(r)}>
                        Change
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editKey && (() => {
        const r = rules.find((x) => x.key === editKey);
        if (!r) return null;
        return (
          <section className="card stack" aria-labelledby="rule-h">
            <h2 id="rule-h">Change: {r.label}</h2>
            <div className="field">
              <label htmlFor="rule-value">নতুন মান (পূর্ণ সংখ্যা)</label>
              <input
                id="rule-value"
                inputMode="numeric"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="rule-reason">কারণ (কমপক্ষে ১০ অক্ষর)</label>
              <textarea
                id="rule-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="যেমন: ক্যাম্পেইন অনুযায়ী কমিশন ৮% থেকে ৭%"
                aria-invalid={!!error}
                aria-describedby={error ? "rule-e" : undefined}
              />
              {error && <span id="rule-e" className="error" role="alert">{error}</span>}
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-line" disabled={busy} onClick={() => setEditKey(null)}>
                বাতিল
              </button>
              <button type="button" className="btn" disabled={busy} onClick={() => save(r)}>
                {busy ? "সংরক্ষণ হচ্ছে…" : "পরিবর্তন সংরক্ষণ"}
              </button>
            </div>
          </section>
        );
      })()}
    </div>
  );
}
