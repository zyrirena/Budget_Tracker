-- ============================================================================
-- RESET SCRIPT — Run this FIRST if you already ran the old schema
-- ============================================================================
-- This drops all existing tables, policies, and triggers so you can
-- cleanly run 001_initial_schema.sql afterward.
--
-- ⚠️  This DELETES ALL DATA. Only use on a fresh/test project.
-- ============================================================================

-- Drop tables in dependency order (children first)
DROP TABLE IF EXISTS ai_conversations CASCADE;
DROP TABLE IF EXISTS transactions     CASCADE;
DROP TABLE IF EXISTS budgets          CASCADE;
DROP TABLE IF EXISTS expenses         CASCADE;
DROP TABLE IF EXISTS accounts         CASCADE;
DROP TABLE IF EXISTS categories       CASCADE;
DROP TABLE IF EXISTS user_settings    CASCADE;
DROP TABLE IF EXISTS reminders        CASCADE;
DROP TABLE IF EXISTS household_members CASCADE;
DROP TABLE IF EXISTS households       CASCADE;

-- Drop old views that may exist from the previous schema
DROP VIEW IF EXISTS v_monthly_spending CASCADE;
DROP VIEW IF EXISTS v_budget_vs_actual CASCADE;
DROP VIEW IF EXISTS v_account_summary  CASCADE;

-- Drop old functions
DROP FUNCTION IF EXISTS get_account_balance          CASCADE;
DROP FUNCTION IF EXISTS get_monthly_category_spending CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column      CASCADE;
DROP FUNCTION IF EXISTS set_updated_at                CASCADE;

-- ============================================================================
-- DONE — Now run 001_initial_schema.sql
-- ============================================================================
