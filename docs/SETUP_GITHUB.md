# GitHub Setup Guide

Step-by-step guide to get your Smart Budget Tracker on GitHub.

## Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click **"+"** in top right → **"New repository"**
3. Fill in details:
   - **Repository name**: `smart-budget-tracker`
   - **Description**: "A modern household budget tracking application"
   - **Visibility**: Choose **Public** (for portfolio) or **Private** (for personal use)
   - **Initialize with**: 
     - ✅ Add .gitignore (select **Node**)
     - ✅ Add a README.md
     - ✅ Choose a license (MIT is good)
4. Click **"Create repository"**

## Step 2: Clone Repository Locally

```bash
# Replace YOUR_USERNAME with your GitHub username
git clone https://github.com/YOUR_USERNAME/smart-budget-tracker.git
cd smart-budget-tracker

# Configure Git (one time)
git config user.name "Your Name"
git config user.email "your@email.com"
```

## Step 3: Set Up Project Structure

Create the following folder structure:

```bash
smart-budget-tracker/
├── frontend/                    # React app
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── SignUp.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ExpenseForm.jsx
│   │   │   ├── Navigation.jsx
│   │   │   ├── AccountManager.jsx
│   │   │   ├── BudgetPlanner.jsx
│   │   │   ├── Reports.jsx
│   │   │   └── AIAdvisor.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── BudgetContext.jsx
│   │   ├── lib/
│   │   │   └── supabase.js
│   │   ├── styles/
│   │   │   └── index.css
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.html
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env.local (DO NOT COMMIT)
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .env.example
├── .gitignore
├── README.md
└── LICENSE
```

## Step 4: Copy Project Files

Copy all the files from this guide into your repository:

```bash
# Create directories
mkdir -p frontend/src/{components/Auth,context,lib,styles}
mkdir -p supabase/migrations

# Copy all component files to frontend/src/components/
# Copy context files to frontend/src/context/
# Copy lib files to frontend/src/lib/
# Copy config files to frontend/
# Copy SQL schema to supabase/migrations/
```

## Step 5: Initialize Frontend

```bash
cd frontend

# Create package.json (or copy from this guide)
npm init -y

# Install dependencies
npm install

# Verify installation
npm list
```

## Step 6: Add Files to Git

```bash
cd ../  # Back to project root

# Check what will be committed
git status

# Add all files
git add .

# Check again
git status

# Create initial commit
git commit -m "Initial commit: Smart Budget Tracker

- React + Vite frontend
- Supabase PostgreSQL backend
- Complete authentication system
- Expense tracking and budgeting
- Dashboard with analytics"

# Push to GitHub
git push -u origin main
```

## Step 7: GitHub Branch Strategy

### Main Branch (Production Ready)
```bash
# Keep main stable
git checkout main
# Only merge tested code
```

### Development Branch
```bash
# For new features
git checkout -b develop
git push -u origin develop
```

### Feature Branches
```bash
# For each feature
git checkout -b feature/expense-import
# Do work...
git commit -m "Add expense CSV import"
git push origin feature/expense-import
# Create Pull Request on GitHub
```

## Step 8: Protect Main Branch (Optional)

1. Go to your GitHub repo
2. **Settings** → **Branches**
3. Click **"Add rule"** for branch `main`
4. Enable:
   - ✅ Require pull request reviews
   - ✅ Dismiss stale reviews
   - ✅ Require branches to be up to date
   - ✅ Require status checks to pass
5. Click **"Create"**

## Step 9: Add Collaborators (Optional)

1. Go to **Settings** → **Collaborators**
2. Click **"Add people"**
3. Search for GitHub username
4. Choose role:
   - **Pull access**: Read-only
   - **Push access**: Can commit
   - **Admin access**: Full control
5. Click **"Add"**

## Step 10: Set Up GitHub Actions (Optional CI/CD)

Create `.github/workflows/test.yml`:

```yaml
name: Test & Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
    
    - name: Install dependencies
      run: cd frontend && npm ci
    
    - name: Build
      run: cd frontend && npm run build
    
    - name: Run linter
      run: cd frontend && npm run lint --if-present
```

Then push:
```bash
git add .github/
git commit -m "Add CI/CD workflow"
git push
```

## Step 11: Add Repository Badges (Optional)

Edit `README.md`:

```markdown
# Smart Budget Tracker

![Build Status](https://github.com/YOUR_USERNAME/smart-budget-tracker/workflows/Test%20&%20Build/badge.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)
```

## Step 12: Secrets Management

### For GitHub Actions/Deployment

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Add each secret:

```
Name: VITE_SUPABASE_URL
Value: https://xxxxx.supabase.co

Name: VITE_SUPABASE_ANON_KEY
Value: eyJ...

Name: VITE_OPENAI_API_KEY
Value: sk-...
```

4. Click **"Add secret"** for each

### Use in Actions
```yaml
- name: Build with secrets
  env:
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
  run: cd frontend && npm run build
```

## Workflow: Daily Development

### Start Work
```bash
git pull origin develop
git checkout -b feature/your-feature
```

### Make Changes
```bash
# Edit files...
git add .
git commit -m "Description of changes"
git push origin feature/your-feature
```

### Create Pull Request
1. Go to GitHub
2. Click **"Compare & pull request"**
3. Add description
4. Request reviewers (if team)
5. Click **"Create pull request"**

### Merge After Review
```bash
# Local merge (or use GitHub UI)
git checkout develop
git pull origin develop
git merge feature/your-feature
git push origin develop
```

## Troubleshooting

### Issue: "Permission denied (publickey)"

**Solution**: Setup SSH keys
```bash
ssh-keygen -t ed25519 -C "your@email.com"
# Copy public key to GitHub Settings → SSH Keys
ssh-add ~/.ssh/id_ed25519
```

### Issue: ".gitignore not working"

**Solution**: Remove cached files
```bash
git rm -r --cached .
git add .
git commit -m "Update gitignore"
```

### Issue: Large files rejected

**Solution**: Use Git LFS for large files
```bash
git lfs install
git lfs track "*.psd"
git add .gitattributes
```

### Issue: Accidentally committed secrets

**Solution**: Remove from history
```bash
# Use BFG Repo-Cleaner or git-filter-branch
# Regenerate secrets in Supabase
git push --force-with-lease
```

## Keeping Fork Updated

If you forked the project:

```bash
# Add upstream
git remote add upstream https://github.com/original-owner/repo.git

# Fetch updates
git fetch upstream

# Merge into your main
git merge upstream/main
git push origin main
```

## Publishing Your Work

### Share on Portfolio
- Add link to GitHub repo in your portfolio
- Showcase the README and code quality
- Link to live demo (once deployed)

### NPM Package (Optional)
If you want others to use your code:

```bash
npm login
npm publish
```

Then others can do: `npm install smart-budget-tracker`

## Next Steps

1. ✅ GitHub repository created
2. ✅ Project structure set up
3. ✅ Files committed
4. → [Deploy to Railway](./DEPLOY_RAILWAY.md)
5. → [Set up CI/CD Pipeline](./CI_CD.md)

## Useful GitHub Links

- [GitHub Guides](https://guides.github.com)
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Best Practices](https://github.blog)

---

**Your code is now version controlled and ready for deployment!** 🎉
