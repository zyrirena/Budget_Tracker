# Supabase Setup Guide

Complete guide to set up Supabase for Smart Budget Tracker.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Sign in with GitHub or email
4. Fill in project details:
   - **Project Name**: `smart-budget-tracker`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
5. Click **"Create new project"** (wait 2-3 minutes for setup)

## Step 2: Get Your API Keys

1. Go to **Project Settings** (bottom left gear icon)
2. Click **API** tab
3. Copy these values (you'll need them for `.env.local`):
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

## Step 3: Load the Database Schema

1. In Supabase, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the entire SQL from `001_initial_schema.sql`
4. Paste into the editor
5. Click **"RUN"** button (⚡)
6. Wait for confirmation (✓ Success)

### What Gets Created:
- 10 tables (users, accounts, expenses, budgets, etc.)
- Row-Level Security (RLS) policies
- Indexes for performance
- Useful views and functions
- Default categories

## Step 4: Enable Authentication

1. Go to **Authentication** (left menu)
2. Click **Providers**
3. Ensure **Email** is enabled (it should be by default)
4. Click **Email** to configure:
   - **Confirm email**: Optional (can uncheck for testing)
   - **Secure email change**: Optional
5. Click **Save**

### Setup Magic Link Email (Optional)
1. Go to **Providers** → **Email**
2. Under "Email Templates", you can customize confirmation emails

## Step 5: Configure RLS Policies (Already Done!)

The SQL schema includes all RLS policies. Verify they're active:

1. Go to **Authentication** → **Policies**
2. You should see policies for:
   - `households`
   - `expenses`
   - `accounts`
   - `budgets`
   - `categories`
   - etc.

If missing, re-run the SQL schema.

## Step 6: Create a Test User

There are two ways:

### Option A: Via Supabase Dashboard
1. Go to **Authentication** → **Users**
2. Click **"Add user"**
3. Email: `test@example.com`
4. Password: `Test123!@#`
5. Click **"Create user"**

### Option B: Via React App
1. Run your React app
2. Go to Sign Up page
3. Create test account with same credentials

## Step 7: Verify Everything Works

Run these tests in Supabase **SQL Editor**:

```sql
-- Test 1: Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Test 2: Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Test 3: Check default categories exist
SELECT COUNT(*) as category_count 
FROM categories 
WHERE is_system = TRUE;

-- Test 4: Check user can see their data
SELECT * FROM expenses 
WHERE user_id = 'YOUR-USER-ID'; 
-- Should return 0 rows (no expenses yet)
```

## Step 8: Understand Row-Level Security (RLS)

RLS ensures users only see their own data:

```sql
-- Example: Users can only view their own expenses
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);
```

**Key Points:**
- `auth.uid()` = currently logged-in user's ID
- Policies enforce at database level (very secure!)
- No user can bypass this, even if they modify client code

## Troubleshooting

### Issue: "Access Denied" or "New row violates RLS policy"

**Solution:**
1. Verify user is authenticated
2. Check user ID matches in database
3. Ensure RLS policies are enabled
4. Clear browser cache and re-login

```sql
-- Debug: Find user ID
SELECT id, email FROM auth.users LIMIT 5;

-- Debug: Check policies are active
SELECT * FROM pg_policies 
WHERE tablename = 'expenses';
```

### Issue: "Relation 'expenses' does not exist"

**Solution:**
- Re-run the complete SQL schema
- Check for error messages during execution
- Verify you're in the correct database

### Issue: "API Key Invalid"

**Solution:**
1. Get fresh keys from **Project Settings → API**
2. Make sure using **anon public key** (not secret!)
3. Update `.env.local` with new values
4. Restart React dev server

## Database Maintenance

### Backup Your Data

1. Go to **Backups** (left menu)
2. Click **"Create backup now"**
3. You can download backups anytime

### Monitor Usage

1. Go to **Project Settings** → **Database**
2. Check:
   - Storage used
   - Row counts
   - Connection count

### Scale as Needed

Free tier includes:
- 500 MB database
- Unlimited API requests
- Up to 100 concurrent connections

Upgrade anytime to:
- Larger database
- Priority support
- Advanced features

## Advanced: Row-Level Security Deep Dive

### Users Table
```sql
-- Note: Users table is handled by Supabase Auth
-- No need to manage directly!
-- User data available via: auth.users table
```

### Expenses RLS Example
```sql
-- This policy means:
-- "User can view this expense only if they're the owner"
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

-- SELECT: User can read
-- INSERT: Can create new expense (if passes WITH CHECK)
-- UPDATE/DELETE: Can modify/remove own expenses
```

### Household RLS Example
```sql
-- Multi-user access (optional feature)
CREATE POLICY "Users can view households they belong to"
  ON household_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  );
```

## Environment Variables

Once everything is set up, create `.env.local` in your React project:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Next Steps

1. ✅ Supabase project created
2. ✅ Database schema loaded
3. ✅ Authentication enabled
4. ✅ RLS policies in place
5. → [Configure React App](./SETUP_FRONTEND.md)
6. → [Deploy to Railway](./DEPLOY_RAILWAY.md)

## Support

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- GitHub Issues: Report problems

---

**You're ready to move to the React frontend setup!** 🚀
