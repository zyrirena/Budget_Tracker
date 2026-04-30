-- ============================================================================
-- Smart Household Budget Tracker — Complete Database Schema v2
-- ============================================================================
-- 1. Open Supabase → SQL Editor → New Query
-- 2. Paste this ENTIRE file
-- 3. Click Run (⚡)
-- 4. You should see "Success. No rows returned."
-- Safe to run multiple times.
-- ============================================================================

-- ── HOUSEHOLDS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS households (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL DEFAULT 'My Household',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── HOUSEHOLD MEMBERS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS household_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  VARCHAR(100),
  role          VARCHAR(20) DEFAULT 'member',  -- owner | member
  joined_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(household_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_hm_user ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_hm_hh   ON household_members(household_id);

-- ── CATEGORIES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  type          VARCHAR(10) DEFAULT 'expense',  -- expense | income
  color         VARCHAR(7)  DEFAULT '#3a9fff',
  icon          VARCHAR(10) DEFAULT '📌',
  parent_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cat_hh ON categories(household_id);

-- ── ACCOUNTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  account_type  VARCHAR(20) NOT NULL,  -- checking, savings, credit_card, loan
  balance       NUMERIC(15,2) DEFAULT 0,
  interest_rate NUMERIC(5,2) DEFAULT 0,   -- for debt advisor
  currency      VARCHAR(3)   DEFAULT 'USD',
  note          TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_acc_hh ON accounts(household_id);

-- ── TRANSACTIONS (checkbook register) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            VARCHAR(10) NOT NULL,  -- debit | credit
  amount          NUMERIC(15,2) NOT NULL,
  balance_after   NUMERIC(15,2),
  description     VARCHAR(255),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring    BOOLEAN DEFAULT FALSE,
  recur_frequency VARCHAR(20),  -- weekly, biweekly, monthly, yearly
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_txn_hh      ON transactions(household_id);
CREATE INDEX IF NOT EXISTS idx_txn_acct    ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_txn_user    ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_txn_date    ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_txn_cat     ON transactions(category_id);

-- ── BUDGETS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  category_id   UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month         DATE NOT NULL,
  limit_amount  NUMERIC(15,2) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(household_id, category_id, month)
);
CREATE INDEX IF NOT EXISTS idx_bud_hh ON budgets(household_id);

-- ── AI CONVERSATIONS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message       TEXT NOT NULL,
  response      TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- ROW-LEVEL SECURITY  (users see only their household's data)
-- ============================================================================
ALTER TABLE households       ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Helper: "does the current user belong to this household?"
CREATE OR REPLACE FUNCTION user_household_ids()
RETURNS SETOF UUID AS $$
  SELECT household_id FROM household_members WHERE user_id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ── Households ───────────────────────────────────────────────────────────────
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='hh_sel') THEN
  CREATE POLICY hh_sel ON households FOR SELECT USING (id IN (SELECT user_household_ids()));
END IF;
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='hh_ins') THEN
  CREATE POLICY hh_ins ON households FOR INSERT WITH CHECK (true);
END IF;
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='hh_upd') THEN
  CREATE POLICY hh_upd ON households FOR UPDATE USING (id IN (SELECT user_household_ids()));
END IF;
END $$;

-- ── Household Members ────────────────────────────────────────────────────────
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='hm_sel') THEN
  CREATE POLICY hm_sel ON household_members FOR SELECT USING (household_id IN (SELECT user_household_ids()));
END IF;
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='hm_ins') THEN
  CREATE POLICY hm_ins ON household_members FOR INSERT WITH CHECK (user_id = auth.uid() OR household_id IN (SELECT user_household_ids()));
END IF;
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='hm_del') THEN
  CREATE POLICY hm_del ON household_members FOR DELETE USING (household_id IN (SELECT user_household_ids()));
END IF;
END $$;

-- ── Categories ───────────────────────────────────────────────────────────────
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='cat_sel') THEN
  CREATE POLICY cat_sel ON categories FOR SELECT USING (household_id IN (SELECT user_household_ids()));
END IF;
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='cat_ins') THEN
  CREATE POLICY cat_ins ON categories FOR INSERT WITH CHECK (household_id IN (SELECT user_household_ids()));
END IF;
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='cat_upd') THEN
  CREATE POLICY cat_upd ON categories FOR UPDATE USING (household_id IN (SELECT user_household_ids()));
END IF;
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='cat_del') THEN
  CREATE POLICY cat_del ON categories FOR DELETE USING (household_id IN (SELECT user_household_ids()));
END IF;
END $$;

-- ── Accounts ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='acc_sel') THEN
  CREATE POLICY acc_sel ON accounts FOR SELECT USING (household_id IN (SELECT user_household_ids()));
END IF;
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='acc_ins') THEN
  CREATE POLICY acc_ins ON accounts FOR INSERT WITH CHECK (household_id IN (SELECT user_household_ids()));
END IF;
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='acc_upd') THEN
  CREATE POLICY acc_upd ON accounts FOR UPDATE USING (household_id IN (SELECT user_household_ids()));
END IF;
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='acc_del') THEN
  CREATE POLICY acc_del ON accounts FOR DELETE USING (household_id IN (SELECT user_household_ids()));
END IF;
END $$;

-- ── Transactions ─────────────────────────────────────────────────────────────
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='txn_sel') THEN
  CREATE POLICY txn_sel ON transactions FOR SELECT USING (household_id IN (SELECT user_household_ids()));
END IF;
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='txn_ins') THEN
  CREATE POLICY txn_ins ON transactions FOR INSERT WITH CHECK (household_id IN (SELECT user_household_ids()));
END IF;
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='txn_upd') THEN
  CREATE POLICY txn_upd ON transactions FOR UPDATE USING (household_id IN (SELECT user_household_ids()));
END IF;
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='txn_del') THEN
  CREATE POLICY txn_del ON transactions FOR DELETE USING (household_id IN (SELECT user_household_ids()));
END IF;
END $$;

-- ── Budgets ──────────────────────────────────────────────────────────────────
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='bud_sel') THEN
  CREATE POLICY bud_sel ON budgets FOR SELECT USING (household_id IN (SELECT user_household_ids()));
END IF;
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='bud_ins') THEN
  CREATE POLICY bud_ins ON budgets FOR INSERT WITH CHECK (household_id IN (SELECT user_household_ids()));
END IF;
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='bud_upd') THEN
  CREATE POLICY bud_upd ON budgets FOR UPDATE USING (household_id IN (SELECT user_household_ids()));
END IF;
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='bud_del') THEN
  CREATE POLICY bud_del ON budgets FOR DELETE USING (household_id IN (SELECT user_household_ids()));
END IF;
END $$;

-- ── AI Conversations ─────────────────────────────────────────────────────────
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='ai_sel') THEN
  CREATE POLICY ai_sel ON ai_conversations FOR SELECT USING (household_id IN (SELECT user_household_ids()));
END IF;
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='ai_ins') THEN
  CREATE POLICY ai_ins ON ai_conversations FOR INSERT WITH CHECK (household_id IN (SELECT user_household_ids()));
END IF;
END $$;

-- ============================================================================
-- Auto-update trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_acc_upd') THEN
    CREATE TRIGGER trg_acc_upd BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_bud_upd') THEN
    CREATE TRIGGER trg_bud_upd BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- ============================================================================
-- DONE  —  verify with:
--   SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1;
-- Expected: accounts, ai_conversations, budgets, categories, household_members,
--           households, transactions
-- ============================================================================
