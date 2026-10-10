export default function SellerLoginPage() {
  return (
    <div className="card stack" style={{ maxWidth: 440, margin: "24px auto" }}>
      <h1>Seller sign in</h1>
      <form className="stack" onSubmit={(e) => e.preventDefault()} noValidate>
        <div className="field">
          <label htmlFor="phone">Registered mobile number</label>
          <input id="phone" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" />
        </div>
        <div className="field">
          <label htmlFor="pw">Password</label>
          <input id="pw" type="password" autoComplete="current-password" />
        </div>
        <button type="submit" className="btn">Sign in</button>
      </form>
      <div className="notice">
        Test build: login is not connected, so every page is open. Real sign-in will need an OTP and a verified seller account.
      </div>
    </div>
  );
}
