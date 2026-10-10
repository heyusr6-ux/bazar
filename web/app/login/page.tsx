"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  function sendOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const clean = phone.replace(/\s/g, "");
    if (!/^01[3-9]\d{8}$/.test(clean)) {
      setError("Enter a valid Bangladeshi mobile number (01XXXXXXXXX).");
      return;
    }
    setError("");
    setStep("otp");
  }

  function verify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("OTP sending is not connected in this test build. Sign-in is disabled.");
  }

  return (
    <div className="card stack" style={{ maxWidth: 440, margin: "24px auto" }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>Sign in or create account</h1>

      {step === "phone" ? (
        <form className="stack" onSubmit={sendOtp} noValidate>
          <div className="field">
            <label htmlFor="phone">Mobile number</label>
            <input id="phone" name="phone" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} aria-describedby="phone-note" />
            <span id="phone-note" className="muted" style={{ fontSize: 12 }}>We send a 6-digit code by SMS.</span>
          </div>
          {error && <span className="error" role="alert">{error}</span>}
          <button type="submit" className="btn">Send OTP</button>
        </form>
      ) : (
        <form className="stack" onSubmit={verify}>
          <span className="muted">Enter the 6-digit code sent to {phone}.</span>
          <div className="field">
            <label htmlFor="otp">OTP code</label>
            <input id="otp" name="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} />
          </div>
          {error && <span className="error" role="alert">{error}</span>}
          <button type="submit" className="btn">Verify and continue</button>
          <button type="button" className="btn btn-line" onClick={() => setStep("phone")}>Change number</button>
        </form>
      )}

      <div className="notice">Test build: SMS and OTP are not connected. Accounts are not created yet.</div>
    </div>
  );
}
