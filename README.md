# 💰 Smart Household Budget Tracker

A modern, mobile-first web app for tracking household finances — expenses, accounts, budgets, reports, and AI-powered financial advice.

![React](https://img.shields.io/badge/React-18-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## Features

- **Dashboard** — balance overview, spending charts, recent transactions
- **Expense Tracking** — add / edit / delete with categories, dates, recurring support
- **Account Management** — checking, savings, credit cards, loans
- **Budget Planner** — set monthly limits per category with progress bars & alerts
- **Reports** — 6-month trend chart, category breakdown, CSV export
- **AI Financial Advisor** — ChatGPT-powered chat with personalized insights
- **Mobile-First** — bottom tab bar on phones, sidebar on desktop
- **Secure** — Row-Level Security on every table; data isolated per user

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 · Vite 5 · Tailwind CSS 3 · Recharts |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| AI | OpenAI GPT-3.5-turbo (optional) |
| Deploy | Railway · GitHub Actions CI |

---

## Quick Start (15 minutes)

### 1. Clone

```bash
git clone https://github.com/YOUR_USER/smart-budget-tracker.git
cd smart-budget-tracker/frontend
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Open **SQL Editor** → paste the entire `supabase/migrations/001_initial_schema.sql` → **Run**
3. Copy your **Project URL** and **anon key** from **Settings → API**

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env and paste your Supabase URL + anon key
```

### 4. Install & run

```bash
npm install
npm run dev
```

Open **http://localhost:5173** → create an account → start tracking!

---

## Deploy to Railway

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub**
3. Select this repo — Railway auto-detects the config
4. Add environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, (optionally `VITE_OPENAI_API_KEY`)
5. Deploy — you'll get a public URL in ~2 minutes

See [docs/DEPLOY_RAILWAY.md](docs/DEPLOY_RAILWAY.md) for the full guide.

---

## AI Advisor Setup (Optional)

1. Get an API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Add `VITE_OPENAI_API_KEY=sk-...` to your `.env`
3. Restart the dev server — the Advisor tab will connect automatically

See [docs/SETUP_AI.md](docs/SETUP_AI.md) for details.

---

## Project Structure

```
smart-budget-tracker/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/Login.jsx, SignUp.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Expenses.jsx
│   │   │   ├── AccountManager.jsx
│   │   │   ├── BudgetPlanner.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── AIAdvisor.jsx
│   │   │   └── Navigation.jsx
│   │   ├── context/AuthContext.jsx, BudgetContext.jsx
│   │   ├── lib/supabase.js
│   │   ├── utils/helpers.js
│   │   ├── styles/index.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── supabase/migrations/001_initial_schema.sql
├── docs/
├── railway.json
├── nixpacks.toml
└── README.md
```

---

## Database Schema

10 tables with full RLS:

| Table | Purpose |
|-------|---------|
| `households` | Optional family grouping |
| `household_members` | Links users to households |
| `categories` | Expense categories (seeded automatically) |
| `accounts` | Checking / savings / credit / loan |
| `transactions` | Checkbook register |
| `expenses` | Individual expense records |
| `budgets` | Monthly category budgets |
| `ai_conversations` | Chat history with AI |
| `reminders` | Bill alerts |
| `user_settings` | Preferences |

---

## Security

- Row-Level Security (RLS) on every table
- Passwords hashed by Supabase Auth (bcrypt)
- API keys in environment variables only
- No secrets in client bundle
- HTTPS enforced on Railway

---

## License

MIT — use freely for personal or commercial projects.
