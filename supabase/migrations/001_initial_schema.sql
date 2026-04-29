-- ============================================================================
-- Smart Household Budget Tracker — Database Schema
-- ============================================================================
-- HOW TO USE:
--   1. Open Supabase Dashboard → SQL Editor → New Query
--   2. Paste this ENTIRE file
--   3. Click "Run" (⚡)
--   4. You should see "Success. No rows returned."
--
-- Safe to run multiple times — all statements use IF NOT EXISTS guards.
-- ============================================================================


-- ── 1. CATEGORIES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  color         VARCHAR(7)  DEFAULT '#3a9fff',
  icon          VARCHAR(50) DEFAULT '📌',
  is_system     BOOLEAN     DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);


-- ── 2. ACCOUNTS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  account_type  VARCHAR(50) NOT NULL,   -- checking, savings, credit_card, loan
  balance       NUMERIC(15,2) DEFAULT 0,
  currency      VARCHAR(3)   DEFAULT 'USD',
  note          TEXT,
  is_active     BOOLEAN      DEFAULT TRUE,
  created_at    TIMESTAMPTZ  DEFAULT now(),
  updated_at    TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);


-- ── 3. EXPENSES ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id         UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  account_id          UUID REFERENCES accounts(id) ON DELETE SET NULL,
  amount              NUMERIC(15,2) NOT NULL,
  currency            VARCHAR(3) DEFAULT 'USD',
  description         VARCHAR(255),
  paid_by             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expense_date        DATE NOT NULL,
  is_recurring        BOOLEAN     DEFAULT FALSE,
  recurring_frequency VARCHAR(50),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_cat  ON expenses(category_id);


-- ── 4. BUDGETS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id   UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month         DATE NOT NULL,              -- always the 1st of the month
  limit_amount  NUMERIC(15,2) NOT NULL,
  currency      VARCHAR(3) DEFAULT 'USD',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, category_id, month)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user  ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);


-- ── 5. AI CONVERSATIONS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_conversations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message           TEXT NOT NULL,
  response          TEXT,
  tokens_used       INT,
  conversation_type VARCHAR(50) DEFAULT 'general',
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_conv_user ON ai_conversations(user_id);


-- ── 6. TRANSACTIONS (checkbook register) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type              VARCHAR(50)   NOT NULL,  -- deposit, withdrawal, transfer
  amount            NUMERIC(15,2) NOT NULL,
  balance_after     NUMERIC(15,2),
  description       VARCHAR(255),
  transaction_date  DATE NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_txn_user    ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_txn_account ON transactions(account_id);


-- ── 7. USER SETTINGS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_currency    VARCHAR(3)  DEFAULT 'USD',
  dark_mode             BOOLEAN     DEFAULT FALSE,
  notifications_enabled BOOLEAN     DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);


-- ============================================================================
-- ROW-LEVEL SECURITY
-- ============================================================================

ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings    ENABLE ROW LEVEL SECURITY;

-- ── Categories policies ──────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cat_select' AND tablename = 'categories') THEN
    CREATE POLICY cat_select ON categories FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cat_insert' AND tablename = 'categories') THEN
    CREATE POLICY cat_insert ON categories FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cat_update' AND tablename = 'categories') THEN
    CREATE POLICY cat_update ON categories FOR UPDATE USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cat_delete' AND tablename = 'categories') THEN
    CREATE POLICY cat_delete ON categories FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- ── Accounts policies ────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'acc_select' AND tablename = 'accounts') THEN
    CREATE POLICY acc_select ON accounts FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'acc_insert' AND tablename = 'accounts') THEN
    CREATE POLICY acc_insert ON accounts FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'acc_update' AND tablename = 'accounts') THEN
    CREATE POLICY acc_update ON accounts FOR UPDATE USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'acc_delete' AND tablename = 'accounts') THEN
    CREATE POLICY acc_delete ON accounts FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- ── Expenses policies ────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'exp_select' AND tablename = 'expenses') THEN
    CREATE POLICY exp_select ON expenses FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'exp_insert' AND tablename = 'expenses') THEN
    CREATE POLICY exp_insert ON expenses FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'exp_update' AND tablename = 'expenses') THEN
    CREATE POLICY exp_update ON expenses FOR UPDATE USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'exp_delete' AND tablename = 'expenses') THEN
    CREATE POLICY exp_delete ON expenses FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- ── Budgets policies ─────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bud_select' AND tablename = 'budgets') THEN
    CREATE POLICY bud_select ON budgets FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bud_insert' AND tablename = 'budgets') THEN
    CREATE POLICY bud_insert ON budgets FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bud_update' AND tablename = 'budgets') THEN
    CREATE POLICY bud_update ON budgets FOR UPDATE USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bud_delete' AND tablename = 'budgets') THEN
    CREATE POLICY bud_delete ON budgets FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- ── AI conversations policies ────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ai_select' AND tablename = 'ai_conversations') THEN
    CREATE POLICY ai_select ON ai_conversations FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ai_insert' AND tablename = 'ai_conversations') THEN
    CREATE POLICY ai_insert ON ai_conversations FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ── Transactions policies ────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'txn_select' AND tablename = 'transactions') THEN
    CREATE POLICY txn_select ON transactions FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'txn_insert' AND tablename = 'transactions') THEN
    CREATE POLICY txn_insert ON transactions FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'txn_update' AND tablename = 'transactions') THEN
    CREATE POLICY txn_update ON transactions FOR UPDATE USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'txn_delete' AND tablename = 'transactions') THEN
    CREATE POLICY txn_delete ON transactions FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- ── User settings policies ───────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'uset_select' AND tablename = 'user_settings') THEN
    CREATE POLICY uset_select ON user_settings FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'uset_insert' AND tablename = 'user_settings') THEN
    CREATE POLICY uset_insert ON user_settings FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'uset_update' AND tablename = 'user_settings') THEN
    CREATE POLICY uset_update ON user_settings FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;


-- ============================================================================
-- AUTO-UPDATE timestamps trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_categories_updated')    THEN CREATE TRIGGER trg_categories_updated    BEFORE UPDATE ON categories      FOR EACH ROW EXECUTE FUNCTION set_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_accounts_updated')      THEN CREATE TRIGGER trg_accounts_updated      BEFORE UPDATE ON accounts        FOR EACH ROW EXECUTE FUNCTION set_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_expenses_updated')      THEN CREATE TRIGGER trg_expenses_updated      BEFORE UPDATE ON expenses        FOR EACH ROW EXECUTE FUNCTION set_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_budgets_updated')       THEN CREATE TRIGGER trg_budgets_updated       BEFORE UPDATE ON budgets         FOR EACH ROW EXECUTE FUNCTION set_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_txn_updated')           THEN CREATE TRIGGER trg_txn_updated           BEFORE UPDATE ON transactions    FOR EACH ROW EXECUTE FUNCTION set_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_settings_updated') THEN CREATE TRIGGER trg_user_settings_updated BEFORE UPDATE ON user_settings   FOR EACH ROW EXECUTE FUNCTION set_updated_at(); END IF;
END $$;


-- ============================================================================
-- DONE — Verify by running:
--   SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- You should see: accounts, ai_conversations, budgets, categories, expenses,
--                  transactions, user_settings
-- ============================================================================
