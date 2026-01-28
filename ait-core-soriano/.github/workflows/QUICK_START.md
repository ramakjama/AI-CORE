# GitHub Actions - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Configure Secrets (First Time Only)

Go to: **Settings > Secrets and variables > Actions > New repository secret**

**Minimum Required Secrets:**
```
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
CODECOV_TOKEN=your-codecov-token
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID_WEB=web-project-id
VERCEL_PROJECT_ID_ADMIN=admin-project-id
```

### Step 2: First Deployment to Staging

```bash
# 1. Create and switch to develop branch
git checkout -b develop

# 2. Make any change
echo "# Test" >> README.md

# 3. Commit and push
git add .
git commit -m "test: trigger staging deployment"
git push origin develop
```

**Result:** Automatic deployment to staging at https://staging.ait-core.soriano.com

### Step 3: Deploy to Production

```bash
# 1. Create a release tag
git checkout main
git merge develop
git tag -a v1.0.0 -m "First production release"
git push origin main --tags

# 2. Go to GitHub Actions
# Navigate to: Actions > Deploy to Production (Manual)

# 3. Click "Run workflow"
# - Version: v1.0.0
# - Skip backup: false
# - Rollback on failure: true

# 4. Click "Run workflow" button
# 5. Approve in "production-approval" environment
```

**Result:** Production deployment at https://ait-core.soriano.com

---

## 🎯 Common Workflows

### Run Tests Only
```bash
git checkout -b feature/my-feature
# Make changes
git push origin feature/my-feature
# Create PR to trigger tests
```

### Deploy Specific Component

**Backend Only:**
```bash
# Modify files in apps/api/
git add apps/api/
git commit -m "fix: backend issue"
git push
# Only backend.yml will run
```

**Frontend Only:**
```bash
# Modify files in apps/web/
git add apps/web/
git commit -m "feat: new UI component"
git push
# Only frontend.yml will run
```

### Trigger Staging Deployment Manually

1. Go to: **Actions > Deploy to Staging (Auto)**
2. Click **"Run workflow"**
3. Select branch: `develop`
4. Choose **"Skip tests"**: true/false
5. Click **"Run workflow"**

---

## 📊 Workflow Status

### Check Workflow Status

**Via GitHub:**
1. Go to **Actions** tab
2. See all workflow runs
3. Click any run to view details
4. Download artifacts if needed

**Via Slack:**
- Automatic notifications sent to configured channel
- ✅ Success messages
- ❌ Failure alerts

**Via Codecov:**
- Visit: https://codecov.io/gh/your-org/ait-core-soriano
- View coverage reports
- Track coverage trends

---

## 🐛 Troubleshooting

### Workflow Failed - What to Do?

1. **Check the Logs**
   - Go to Actions tab
   - Click on failed workflow
   - Expand failed job
   - Read error message

2. **Common Issues & Fixes**

   **Error: "Secret not found"**
   ```
   Solution: Add missing secret in Settings > Secrets
   ```

   **Error: "Tests failed"**
   ```
   Solution: Run tests locally first
   npm test  # or pnpm test
   Fix failing tests before pushing
   ```

   **Error: "Build failed"**
   ```
   Solution: Build locally first
   npm run build  # or pnpm build
   Fix build errors before pushing
   ```

   **Error: "SSH connection failed"**
   ```
   Solution: Verify SSH secrets
   - STAGING_HOST
   - STAGING_USER
   - STAGING_SSH_KEY
   ```

3. **Re-run Failed Workflow**
   - Go to failed workflow run
   - Click "Re-run failed jobs"
   - Or "Re-run all jobs"

---

## 🔄 Rollback Guide

### Automatic Rollback (Production)

If production deployment fails:
- Automatic rollback triggers if `rollback_on_failure: true`
- Blue-Green deployment switches back
- Previous version restored
- Notifications sent

### Manual Rollback

```bash
# 1. Find previous working tag
git tag -l

# 2. Deploy previous version
# Go to: Actions > Deploy to Production (Manual)
# Run workflow with previous version tag (e.g., v1.0.0)

# Or SSH to server:
ssh user@production-server
cd /var/www/ait-core
git checkout v1.0.0  # previous version
pm2 reload all
```

---

## 📈 Monitoring Deployments

### Real-time Monitoring

**GitHub Actions:**
- Live logs during workflow execution
- Job status updates
- Artifact downloads

**Slack Notifications:**
- Deployment start/end
- Success/failure status
- Performance metrics

**Application Health:**
- API: https://api.ait-core.soriano.com/health
- Web: https://ait-core.soriano.com
- Admin: https://admin.ait-core.soriano.com

---

## 🎨 Customization

### Modify Workflow Triggers

**Example: Add more branches**
```yaml
on:
  push:
    branches: [main, develop, staging, feature/*]
```

**Example: Change paths**
```yaml
on:
  push:
    paths:
      - 'apps/api/**'
      - 'custom-path/**'
```

### Disable Workflow

**Option 1: Via GitHub UI**
1. Go to Actions tab
2. Select workflow
3. Click "..." menu
4. Select "Disable workflow"

**Option 2: Edit YAML**
```yaml
on:
  # Comment out triggers
  # push:
  #   branches: [main]
  workflow_dispatch:  # Manual only
```

---

## 🔐 Security Best Practices

### Secrets Management

✅ **DO:**
- Use GitHub Secrets for all sensitive data
- Rotate secrets regularly
- Use different secrets for staging/production
- Limit secret access to necessary jobs

❌ **DON'T:**
- Commit secrets to repository
- Share secrets in logs
- Use production secrets in tests
- Hard-code API keys

### Code Scanning

**Enabled by Default:**
- CodeQL analysis
- Dependency scanning
- Container scanning
- OWASP checks

**View Results:**
- Security tab > Code scanning alerts
- Security tab > Dependabot alerts

---

## 📝 Workflow Cheat Sheet

| Workflow | Trigger | Purpose | Duration |
|----------|---------|---------|----------|
| **backend.yml** | PR/Push | Test & build backend | ~20 min |
| **frontend.yml** | PR/Push | Test & build frontend | ~25 min |
| **agents.yml** | PR/Push | Test & build AI agents | ~25 min |
| **engines.yml** | PR/Push | Test & build Python | ~30 min |
| **docker.yml** | PR/Push | Build Docker images | ~40 min |
| **deploy-staging.yml** | Push to develop | Auto-deploy staging | ~30 min |
| **deploy-production.yml** | Manual | Deploy production | ~45 min |

---

## 🆘 Quick Reference

### Environment URLs

| Environment | Web | Admin | API |
|-------------|-----|-------|-----|
| **Staging** | https://staging.ait-core.soriano.com | https://admin-staging.ait-core.soriano.com | https://api-staging.ait-core.soriano.com |
| **Production** | https://ait-core.soriano.com | https://admin.ait-core.soriano.com | https://api.ait-core.soriano.com |

### Artifact Retention

| Type | Retention |
|------|-----------|
| Build artifacts (staging) | 7 days |
| Build artifacts (production) | 30 days |
| Test results | 7 days |
| Security reports | 30 days |
| Performance reports | 7 days |

### Support Contacts

- **DevOps Issues:** Create GitHub issue with `devops` label
- **Deployment Questions:** Check Slack #deployments channel
- **Security Concerns:** Create issue with `security` label
- **Emergency:** Contact on-call engineer

---

## 📚 Learn More

- [Full Documentation](./README.md)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

---

**Last Updated:** 2026-01-28
**Version:** 1.0.0
