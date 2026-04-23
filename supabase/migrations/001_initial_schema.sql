-- ============================================================================
-- Smart Household Budget Tracker - Complete Database Schema
-- ============================================================================
-- Execute this entire SQL file in Supabase SQL Editor to set up the database
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. HOUSEHOLDS TABLE (Optional - for family grouping)
-- ============================================================================
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_households_created_by ON households(created_by);

-- ============================================================================
-- 2. HOUSEHOLD MEMBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- 'admin' or 'member'
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(household_id, user_id)
);

CREATE INDEX idx_household_members_household_id ON household_members(household_id);
CREATE INDEX idx_household_members_user_id ON household_members(user_id);

-- ============================================================================
-- 3. CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#A8D5FF',
  icon VARCHAR(50),
  is_system BOOLEAN DEFAULT FALSE, -- System categories can't be deleted
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_household_id ON categories(household_id);
CREATE UNIQUE INDEX idx_categories_unique_name ON categories(user_id, name) WHERE household_id IS NULL;

-- ============================================================================
-- 4. ACCOUNTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  account_type VARCHAR(50) NOT NULL, -- 'checking', 'savings', 'credit_card', 'loan', 'investment'
  balance DECIMAL(15, 2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'USD',
  color VARCHAR(7) DEFAULT '#B8E6D5',
  note TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_household_id ON accounts(household_id);

-- ============================================================================
-- 5. TRANSACTIONS TABLE (Checkbook Register)
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'deposit', 'withdrawal', 'transfer'
  amount DECIMAL(15, 2) NOT NULL,
  balance_after DECIMAL(15, 2), -- Balance after this transaction
  description VARCHAR(255),
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);

-- ============================================================================
-- 6. EXPENSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  description VARCHAR(255),
  paid_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Who spent it
  expense_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency VARCHAR(50), -- 'daily', 'weekly', 'bi-weekly', 'monthly', 'yearly'
  recurring_end_date DATE,
  receipt_url VARCHAR(500), -- URL to receipt image
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_household_id ON expenses(household_id);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_recurring ON expenses(is_recurring) WHERE is_recurring = TRUE;

-- ============================================================================
-- 7. BUDGETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- First day of the month
  limit_amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  alert_threshold INT DEFAULT 80, -- Alert when 80% spent
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, category_id, month)
);

CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_household_id ON budgets(household_id);
CREATE INDEX idx_budgets_month ON budgets(month);

-- ============================================================================
-- 8. AI CONVERSATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT,
  tokens_used INT,
  conversation_type VARCHAR(50) DEFAULT 'general', -- 'spending_analysis', 'budget_advice', 'general'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_created_at ON ai_conversations(created_at);

-- ============================================================================
-- 9. NOTIFICATIONS/REMINDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  reminder_type VARCHAR(50), -- 'bill', 'budget_alert', 'goal', 'custom'
  reminder_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  frequency VARCHAR(50), -- 'weekly', 'monthly', 'yearly'
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_date ON reminders(reminder_date);

-- ============================================================================
-- 10. USER SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_currency VARCHAR(3) DEFAULT 'USD',
  dark_mode BOOLEAN DEFAULT FALSE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  weekly_digest BOOLEAN DEFAULT TRUE,
  budget_alerts BOOLEAN DEFAULT TRUE,
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- ============================================================================
-- 11. INSERT DEFAULT CATEGORIES
-- ============================================================================
-- Create default system categories (these will be available to all users)
INSERT INTO categories (user_id, name, color, icon, is_system) 
SELECT 
  auth.users.id,
  cat.name,
  cat.color,
  cat.icon,
  TRUE
FROM auth.users
CROSS JOIN (
  VALUES
    ('Groceries', '#B8E6D5', '🛒'),
    ('Utilities', '#FFB8C6', '💡'),
    ('Transportation', '#A8D5FF', '🚗'),
    ('Entertainment', '#FFE8B8', '🎬'),
    ('Dining Out', '#D5B8FF', '🍽️'),
    ('Shopping', '#B8FFD5', '🛍️'),
    ('Healthcare', '#FFD5B8', '🏥'),
    ('Education', '#B8D5FF', '📚'),
    ('Subscriptions', '#FFB8E8', '📱'),
    ('Fitness', '#D5FFB8', '💪'),
    ('Insurance', '#C6B8FF', '🛡️'),
    ('Other', '#E0E0E0', '📌')
) AS cat(name, color, icon)
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE is_system = TRUE
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HOUSEHOLDS RLS
-- ============================================================================
CREATE POLICY "Users can view households they created"
  ON households FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create households"
  ON households FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Only household creator can update"
  ON households FOR UPDATE
  USING (auth.uid() = created_by);

-- ============================================================================
-- HOUSEHOLD MEMBERS RLS
-- ============================================================================
CREATE POLICY "Users can view household members they belong to"
  ON household_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- CATEGORIES RLS
-- ============================================================================
CREATE POLICY "Users can view their own categories"
  ON categories FOR SELECT
  USING (user_id = auth.uid() OR is_system = TRUE);

CREATE POLICY "Users can create categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id AND is_system = FALSE);

-- ============================================================================
-- ACCOUNTS RLS
-- ============================================================================
CREATE POLICY "Users can view their own accounts"
  ON accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create accounts"
  ON accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their accounts"
  ON accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their accounts"
  ON accounts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRANSACTIONS RLS
-- ============================================================================
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- EXPENSES RLS
-- ============================================================================
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- BUDGETS RLS
-- ============================================================================
CREATE POLICY "Users can view their own budgets"
  ON budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create budgets"
  ON budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their budgets"
  ON budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their budgets"
  ON budgets FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- AI CONVERSATIONS RLS
-- ============================================================================
CREATE POLICY "Users can view their own conversations"
  ON ai_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create conversations"
  ON ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- REMINDERS RLS
-- ============================================================================
CREATE POLICY "Users can view their own reminders"
  ON reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create reminders"
  ON reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their reminders"
  ON reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their reminders"
  ON reminders FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- USER SETTINGS RLS
-- ============================================================================
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- USEFUL VIEWS AND FUNCTIONS
-- ============================================================================

-- View: Current month's spending by category
CREATE OR REPLACE VIEW v_monthly_spending AS
SELECT 
  e.user_id,
  c.name as category,
  SUM(e.amount) as total_spent,
  COUNT(*) as transaction_count,
  CURRENT_DATE as view_date
FROM expenses e
JOIN categories c ON e.category_id = c.id
WHERE DATE_TRUNC('month', e.expense_date) = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY e.user_id, c.name;

-- View: Budget vs Actual for current month
CREATE OR REPLACE VIEW v_budget_vs_actual AS
SELECT 
  b.user_id,
  c.name as category,
  b.limit_amount as budget,
  COALESCE(SUM(e.amount), 0) as actual_spent,
  (b.limit_amount - COALESCE(SUM(e.amount), 0)) as remaining,
  ROUND(100.0 * COALESCE(SUM(e.amount), 0) / NULLIF(b.limit_amount, 0), 2) as percent_spent
FROM budgets b
JOIN categories c ON b.category_id = c.id
LEFT JOIN expenses e ON e.category_id = b.category_id 
  AND e.user_id = b.user_id
  AND DATE_TRUNC('month', e.expense_date) = DATE_TRUNC('month', CURRENT_DATE)
WHERE DATE_TRUNC('month', b.month) = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY b.id, b.user_id, c.name, b.limit_amount;

-- View: Account balances summary
CREATE OR REPLACE VIEW v_account_summary AS
SELECT 
  user_id,
  account_type,
  SUM(balance) as total_balance,
  COUNT(*) as account_count
FROM accounts
WHERE is_active = TRUE
GROUP BY user_id, account_type;

-- Function: Get total balance by account type
CREATE OR REPLACE FUNCTION get_account_balance(p_user_id UUID, p_account_type VARCHAR)
RETURNS DECIMAL AS $$
  SELECT COALESCE(SUM(balance), 0) as total_balance
  FROM accounts
  WHERE user_id = p_user_id AND account_type = p_account_type AND is_active = TRUE;
$$ LANGUAGE SQL STABLE;

-- Function: Calculate monthly spending for category
CREATE OR REPLACE FUNCTION get_monthly_category_spending(p_user_id UUID, p_category_id UUID)
RETURNS DECIMAL AS $$
  SELECT COALESCE(SUM(amount), 0) as total
  FROM expenses
  WHERE user_id = p_user_id 
    AND category_id = p_category_id
    AND DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE);
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER trigger_households_updated_at BEFORE UPDATE ON households
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_budgets_updated_at BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_reminders_updated_at BEFORE UPDATE ON reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================
-- Run this query to verify all tables are created:
-- SELECT * FROM information_schema.tables WHERE table_schema = 'public';

-- Run this to verify RLS is enabled:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT tablename LIKE 'pg_%';
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

COMMIT;
