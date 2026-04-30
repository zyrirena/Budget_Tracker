# 💰 Smart Household Budget Tracker v2

Track expenses, manage accounts, set budgets, get AI debt advice — all household members together.

## Features

- **Multi-user households** — invite members, track who spent what
- **Full checkbook register** — debit/credit, running balances, filters by account/user/category
- **Category management** — create/edit/delete with reassignment, expense & income types
- **Account management** — checking, savings, credit cards, loans with interest rates
- **Monthly budgets** — per-category limits, progress bars, green/yellow/red alerts
- **Dashboard** — spending by category, by member, by account
- **Reports** — 6-month trends, breakdowns, CSV export
- **AI Debt Advisor** — ChatGPT-powered: snowball/avalanche payoff plans, actionable budget cuts
- **Recurring transactions** — rent, subscriptions, auto-tagged
- **Mobile-first** — bottom nav on phones, sidebar on desktop
- **Secure** — Row-Level Security, household-scoped data

## Quick Start

1. **Supabase**: Create project → SQL Editor → paste `supabase/migrations/001_schema.sql` → Run
2. **Clone**: `cd frontend && cp .env.example .env` → fill in Supabase keys
3. **Run**: `npm install && npm run dev` → open http://localhost:5173
4. **Deploy**: Push to GitHub → connect Railway → add env vars → deploy

## Tech Stack

React 18 · Vite · Tailwind CSS · Recharts · Supabase (PostgreSQL + Auth + RLS) · OpenAI API

## License

MIT
