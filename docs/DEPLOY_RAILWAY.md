# Railway Deployment Guide

Complete guide to deploy Smart Budget Tracker to Railway in 15 minutes.

## What is Railway?

Railway is a modern cloud platform that:
- Deploys from GitHub with one click
- Manages environment variables securely
- Provides free tier for testing
- Auto-deploys when you push code
- Includes custom domain support

**Pricing**: Free tier + $5/month usage-based pricing

---

## Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click **"Start Free"**
3. Sign up with:
   - GitHub account (easiest)
   - Google
   - Or email
4. Verify email if needed

## Step 2: Connect GitHub

1. In Railway dashboard, go to **"GitHub Sync"**
2. Click **"Connect GitHub"**
3. GitHub will ask for permission
4. Click **"Authorize railway"**
5. Select **"All repositories"** or just `smart-budget-tracker`
6. Click **"Install"**

## Step 3: Create New Project

1. In Railway dashboard, click **"New Project"**
2. Choose **"Deploy from GitHub"**
3. Select your repository: `smart-budget-tracker`
4. Select branch: `main`
5. Click **"Deploy"**

Railway will automatically:
- Detect it's a Node.js project
- Install dependencies
- Build the project
- Deploy it!

Wait 2-5 minutes for deployment to complete.

## Step 4: Configure Environment Variables

1. In Railway, go to your project
2. Click the **"smart-budget-tracker"** service
3. Go to **Variables** tab
4. Click **"Add Variable"** for each:

```
VITE_SUPABASE_URL
Value: https://xxxxx.supabase.co

VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

VITE_OPENAI_API_KEY
Value: sk-... (optional)
```

5. Click **"Deploy"** button

## Step 5: Get Your Public URL

1. In Railway dashboard, click your service
2. Go to **Settings**
3. Look for **Domains** section
4. Copy the Railway URL: `https://smart-budget-tracker.up.railway.app`
5. This is your live app! 🎉

## Step 6: Test Your Deployment

1. Visit your Railway URL
2. Try to:
   - Create account
   - Log in
   - Add an expense
   - View dashboard

If something breaks, check **Build Logs** and **Deploy Logs** in Railway.

## Step 7: Set Up Custom Domain (Optional)

1. In Railway, go to your project **Settings**
2. Scroll to **Domains**
3. Click **"Add Domain"**
4. Enter your domain: `budget.yoursite.com`
5. Railway gives you CNAME record to add:
   - Go to your domain registrar (GoDaddy, Namecheap, etc.)
   - Add DNS record as shown
   - Wait 5-30 minutes for propagation

Example DNS entry:
```
Type: CNAME
Name: budget
Value: cname.railway.app
```

## Step 8: Enable Auto-Deploy

1. In Railway project **Settings**
2. Find **Deployments**
3. Enable **"Auto Deploy"** for branch `main`
4. Now, every time you push to main, it auto-deploys!

## Step 9: Monitor Your App

### View Logs
```
Click "Logs" tab to see:
- Build logs (npm install, npm run build)
- Deploy logs (startup, errors)
- Runtime logs (app running)
```

### Check Status
- Green check = ✅ Running
- Orange clock = ⏳ Building
- Red X = ❌ Failed

### Performance
- Go to **Metrics** tab
- See:
  - CPU usage
  - Memory usage
  - Network requests
  - Response times

## Step 10: Troubleshooting Deployment

### Build Fails: "Module not found"

**Problem**: Missing dependency
**Solution**:
```bash
# Locally
npm install missing-package

# Commit and push
git add package.json
git commit -m "Add missing dependency"
git push origin main
```

### Build Fails: "Out of memory"

**Problem**: Project too large
**Solution**:
1. In Railway, click service
2. Go to **Settings** → **Plan**
3. Upgrade from Free to Pro
4. Redeploy

### App Crashes: "Cannot find Supabase keys"

**Problem**: Environment variables not set
**Solution**:
1. Verify variables added (Step 4)
2. Check variable names exactly match code
3. Click **"Redeploy"** button
4. Check logs for errors

### App Loads but Data Not Showing

**Problem**: Supabase connection issue
**Solution**:
1. Verify `VITE_SUPABASE_URL` is correct (https://, not http://)
2. Verify `VITE_SUPABASE_ANON_KEY` is exactly right (no extra spaces)
3. Check Supabase is running: go to supabase.com dashboard
4. Test locally first: `npm run dev`

### 404 Errors on Routes

**Problem**: SPA routing not configured
**Solution**:

Create `railway.json` in project root:
```json
{
  "buildCommand": "cd frontend && npm run build",
  "startCommand": "cd frontend && npm run preview"
}
```

Or update `vite.config.js`:
```js
export default {
  server: {
    middlewareMode: true,
  }
}
```

## Advanced: Database Connection

Railway can also host your PostgreSQL database!

### Add PostgreSQL to Railway

1. In Railway, go to **Plugins** (in your project)
2. Click **"+ Add"**
3. Find **PostgreSQL**
4. Click **"Install"**
5. Railway creates database automatically

### Use Railway Database

Instead of Supabase, you can use Railway's PostgreSQL:

```js
// In your backend
import pg from 'pg';

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL
});
```

But for this project, **we recommend Supabase** (easier to set up).

## Step 11: Cost Management

### Free Tier Limits
- 100 minutes of runtime/month
- Perfect for testing
- After 100 minutes, service pauses

### Upgrade to Pro
- $5+ per month
- Pay per usage (CPU, memory)
- Good for small apps

### Estimate Costs
- Small app: $5-10/month
- Medium app: $15-30/month
- Large app: $50+/month

Check **Usage** tab in Railway to see current charges.

## Step 12: Continuous Deployment Workflow

### Standard Flow
```
1. Edit code locally
2. Commit: git commit -m "message"
3. Push: git push origin main
4. GitHub updates
5. Railway detects change
6. Auto-builds and deploys
7. Check railway.app/logs to verify
```

### Example: Add New Feature
```bash
# Create feature branch
git checkout -b feature/dark-mode

# Make changes
# ... edit files ...

# Commit
git add .
git commit -m "Add dark mode toggle"

# Push to feature branch (won't deploy yet)
git push origin feature/dark-mode

# Create Pull Request on GitHub
# Get review...

# Merge to main
git merge main
git push origin main

# Railway auto-deploys! Check logs...
```

## Step 13: Set Up GitHub Actions (Optional)

Run tests before deploying:

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm ci
      - run: cd frontend && npm run build
      - run: cd frontend && npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: railwayapp/deploy-action@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
```

## Health Checks & Monitoring

### Add Health Check Endpoint

Create `frontend/src/pages/health.jsx`:

```jsx
export const HealthCheck = () => {
  return { status: 'ok', timestamp: new Date() };
};
```

In Railway:
1. Go to **Settings**
2. Add Health Check URL: `/health`
3. Railway monitors every 30 seconds

### Set Up Alerts (Pro Plan)

1. Go to **Settings** → **Alerts**
2. Click **"Add Alert"**
3. Choose trigger (CPU > 80%, service down, etc.)
4. Add notification (email, Slack, etc.)

## Rollback if Needed

### Revert to Previous Deployment

1. In Railway, go to **Deployments**
2. Find the working deployment
3. Click **"Redeploy"**
4. Railway rolls back to that version

### Rollback Code (Git)

```bash
# Find commit to revert to
git log --oneline

# Revert the commit
git revert <commit-hash>

# Push
git push origin main

# Railway auto-deploys the older version
```

## Performance Tips

1. **Optimize bundle size**
   ```bash
   npm install --save-dev webpack-bundle-analyzer
   ```

2. **Enable caching**
   ```js
   // In vite.config.js
   build: {
     rollupOptions: {
       output: {
         manualChunks: { vendor: ['react'] }
       }
     }
   }
   ```

3. **Use CDN for images**
   - Upload images to Supabase Storage
   - Link to CDN URLs

4. **Monitor performance**
   - Check Railway Metrics
   - Use Lighthouse audit
   - Test with WebPageTest

## Useful Railway Commands

### Deploy via CLI (Optional)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up

# View logs
railway logs
```

## Next Steps

1. ✅ App deployed to Railway
2. ✅ Environment variables configured
3. ✅ Auto-deployment enabled
4. → [Set up AI Advisor](./SETUP_AI.md)
5. → [Add more features](./DEVELOPMENT.md)

## Common Railway Links

- [Railway Docs](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app)

## Support

- Railway Dashboard → Help (chat support)
- [docs.railway.app](https://docs.railway.app)
- GitHub Issues

---

**Your app is live! 🚀 Share the URL with friends!**

## Share Your App

- Tweet: "Just deployed my budget tracker! Check it out: [URL]"
- LinkedIn: Add to portfolio
- GitHub: Add to README
- Friends: Share and get feedback!

---

**Deployment Complete!** 🎉
