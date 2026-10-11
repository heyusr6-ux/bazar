-- BazaarBD core schema (PostgreSQL). Money is stored in paisa-free integer taka.
-- Every admin change is also written to audit_log in the same transaction.

CREATE TABLE IF NOT EXISTS sellers (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  kyc_status   TEXT NOT NULL DEFAULT 'pending'
               CHECK (kyc_status IN ('pending','approved','sent_back','rejected')),
  account_status TEXT NOT NULL DEFAULT 'active'
               CHECK (account_status IN ('active','suspended')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  slug         TEXT PRIMARY KEY,
  seller_id    TEXT NOT NULL REFERENCES sellers(id),
  name         TEXT NOT NULL,
  price_taka   INTEGER NOT NULL CHECK (price_taka > 0),
  stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('live','hidden','pending','rejected','removed')),
  category     TEXT NOT NULL DEFAULT 'General',
  description  TEXT NOT NULL DEFAULT '',
  old_price_taka INTEGER,
  tone         TEXT NOT NULL DEFAULT '#E9EEEC',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id           TEXT PRIMARY KEY,
  buyer_phone  TEXT NOT NULL,
  address      TEXT NOT NULL,
  total_taka   INTEGER NOT NULL CHECK (total_taka > 0),
  payment      TEXT NOT NULL DEFAULT 'cod' CHECK (payment IN ('cod')),
  status       TEXT NOT NULL DEFAULT 'placed'
               CHECK (status IN ('placed','processing','shipped','delivered','cancelled')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  order_id     TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_slug TEXT NOT NULL REFERENCES products(slug),
  qty          INTEGER NOT NULL CHECK (qty > 0),
  unit_price_taka INTEGER NOT NULL CHECK (unit_price_taka > 0),
  PRIMARY KEY (order_id, product_slug)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id           BIGSERIAL PRIMARY KEY,
  at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor        TEXT NOT NULL,
  action       TEXT NOT NULL,
  target       TEXT NOT NULL,
  reason       TEXT NOT NULL CHECK (char_length(reason) >= 10),
  before_value TEXT,
  after_value  TEXT
);

-- Audit rows must never be changed or removed.
CREATE OR REPLACE RULE audit_log_no_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE OR REPLACE RULE audit_log_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;

-- Admin login sessions. Only a hash of the token is stored.
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash  TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
