# AIT-CORE Soriano - GitHub Actions Workflows

Complete CI/CD pipeline implementation with 7 comprehensive workflows for automated testing, building, security scanning, and deployment.

## 📋 Workflows Overview

### 1. **backend.yml** - Backend CI/CD Pipeline
**Triggers:** Push/PR to `main`, `develop`, `staging` (on backend changes)

**Jobs:**
- ✅ **Code Quality & Security**
  - ESLint linting
  - Prettier formatting check
  - TypeScript type checking
  - Security audit (npm audit)
  - Snyk vulnerability scanning
  - CodeQL analysis

- 🧪 **Unit & Integration Tests**
  - Multi-version testing (Node 20.x, 21.x)
  - PostgreSQL & Redis services
  - Prisma migrations
  - Code coverage with Codecov
  - E2E tests

- 📦 **Build & Package**
  - NestJS API build
  - All modules compilation
  - Artifact archiving

- 🚀 **Deploy to Staging**
  - Auto-deploy on `develop` branch
  - SSH deployment to staging server
  - PM2 process management
  - Health checks

- ⚡ **Performance Tests**
  - Artillery load testing
  - Performance report generation

**Secrets Required:**
- `STAGING_HOST`, `STAGING_USER`, `STAGING_SSH_KEY`
- `SNYK_TOKEN`, `CODECOV_TOKEN`
- `SLACK_WEBHOOK`

---

### 2. **frontend.yml** - Frontend CI/CD Pipeline
**Triggers:** Push/PR to `main`, `develop`, `staging` (on frontend changes)

**Jobs:**
- ✅ **Code Quality & Security**
  - ESLint (Next.js, React)
  - Prettier formatting
  - TypeScript type checking
  - Dependency checks
  - OWASP security scanning

- 🧪 **Unit Tests**
  - Separate testing for Web & Admin apps
  - Jest with coverage
  - Codecov integration

- 📦 **Build Applications**
  - Next.js production builds
  - Bundle size analysis
  - Environment-specific configs

- 🎭 **E2E Tests**
  - Playwright browser testing
  - Multiple test suites
  - Visual regression testing

- ♿ **Accessibility Tests**
  - Pa11y accessibility scanning
  - Axe WCAG compliance checks

- 💡 **Lighthouse Performance**
  - Performance audits
  - SEO & Best practices
  - PWA compliance

- 🚀 **Deploy to Vercel**
  - Auto-deploy to staging
  - Web & Admin apps
  - Custom domain aliases

**Secrets Required:**
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID_WEB`, `VERCEL_PROJECT_ID_ADMIN`
- `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`
- `CODECOV_TOKEN`, `SLACK_WEBHOOK`

---

### 3. **agents.yml** - AI Agents CI/CD Pipeline
**Triggers:** Push/PR to `main`, `develop`, `staging` (on agents changes)

**Jobs:**
- ✅ **Quality Checks**
  - Agent-specific linting
  - Interface validation
  - Configuration validation
  - Security scanning

- 🧪 **Test Specialists** (Matrix)
  - Insurance, Finance, Legal, Marketing
  - Data, Security, Customer, Operations
  - Individual agent testing
  - Coverage reporting

- 🔗 **Integration Tests**
  - Agent communication tests
  - Orchestration testing
  - Database & Redis services

- 🤖 **AI Model Tests**
  - OpenAI integration testing
  - Anthropic Claude testing
  - Local LLM fallback

- ⚡ **Performance Tests**
  - Response time benchmarks
  - Memory profiling
  - Concurrent execution tests

- 📦 **Build Agents**
  - All specialist builds
  - Export validation

- 🚀 **Deploy to Registry**
  - Agent registry update
  - Production sync
  - PM2 reload

**Secrets Required:**
- `OPENAI_API_KEY_TEST`, `ANTHROPIC_API_KEY_TEST`
- `AGENT_REGISTRY_TOKEN`
- `PROD_HOST`, `PROD_USER`, `PROD_SSH_KEY`
- `CODECOV_TOKEN`, `SLACK_WEBHOOK`

---

### 4. **engines.yml** - Python Engines CI/CD Pipeline
**Triggers:** Push/PR to `main`, `develop`, `staging` (on Python changes)

**Jobs:**
- ✅ **Python Quality & Security**
  - Black formatter check
  - isort import sorting
  - Flake8 linting
  - Pylint analysis
  - MyPy type checking
  - Bandit security scan
  - Safety vulnerability check

- 🧪 **Unit Tests** (Matrix)
  - Python 3.10, 3.11, 3.12
  - Ubuntu & Windows
  - Pytest with coverage
  - Codecov integration

- 📊 **Statistical Engine Tests**
  - NumPy, SciPy, Pandas
  - Statistical model validation
  - PostgreSQL integration

- 💰 **Economic Engine Tests**
  - API integration tests
  - Data source validation

- 💵 **Financial Engine Tests**
  - Calculation validation
  - Excel integration tests

- 🔗 **Integration Tests**
  - Cross-engine communication
  - Orchestration testing

- ⚡ **Performance & Benchmarks**
  - pytest-benchmark
  - Memory profiling

- 📦 **Build Packages**
  - Python package builds
  - Wheel distributions

- 🚀 **Deploy**
  - SSH deployment
  - Virtual environment setup
  - Supervisor process restart

**Secrets Required:**
- `ECONOMIC_API_KEY_TEST`
- `PROD_HOST`, `PROD_USER`, `PROD_SSH_KEY`
- `SNYK_TOKEN`, `CODECOV_TOKEN`
- `SLACK_WEBHOOK`

---

### 5. **docker.yml** - Docker Build & Push Pipeline
**Triggers:** Push/PR to `main`, `develop`, `staging` (on Docker changes)

**Jobs:**
- 🔍 **Dockerfile Linting**
  - Hadolint validation
  - Trivy config scanning
  - Layer security analysis

- 🐳 **Build Images**
  - API Image (ghcr.io)
  - Web Image (ghcr.io)
  - Admin Image (ghcr.io)
  - Module Images (matrix)
  - Multi-architecture support
  - Layer caching

- 🔒 **Security Scanning**
  - Trivy vulnerability scan
  - Grype scanning
  - Snyk Container scan
  - SARIF upload to GitHub

- 🧪 **Docker Compose Test**
  - Validate compose file
  - Start all services
  - Health checks
  - Integration testing

- 📊 **Image Analysis**
  - Size analysis
  - Dive layer analysis
  - Optimization reports

- 🚀 **Deploy**
  - Push to GitHub Container Registry
  - Tag management
  - Deployment notifications

**Secrets Required:**
- `GITHUB_TOKEN` (automatic)
- `SNYK_TOKEN`
- `SLACK_WEBHOOK`

---

### 6. **deploy-staging.yml** - Auto-Deploy to Staging
**Triggers:**
- Push to `develop` branch
- Manual workflow_dispatch

**Jobs:**
- ✅ **Pre-deployment Validation**
  - Configuration checks
  - Prerequisite validation
  - Slack notification

- 🧪 **Quick Tests**
  - Critical test suite only
  - Fast execution (15 min)
  - Optional skip via input

- 📦 **Build All Components**
  - Backend, Web, Admin
  - Production builds
  - Artifact storage

- 🚀 **Deploy Backend**
  - SSH deployment
  - Backup previous version
  - PM2 reload
  - Health checks

- 🌐 **Deploy Frontend**
  - Vercel deployment
  - Web & Admin apps
  - Custom domains

- 🤖 **Deploy Agents**
  - Agent deployment
  - Registry update

- 🐍 **Deploy Engines**
  - Python engine deployment
  - Supervisor restart

- 💾 **Database Setup**
  - Migrations
  - Staging data seeding

- 🧪 **Smoke Tests**
  - API health checks
  - Frontend availability
  - Postman collections

- ⚡ **Performance Check**
  - Quick load test
  - Response time validation

- 📢 **Notifications**
  - Slack updates
  - Deployment summary

**Secrets Required:**
- `STAGING_HOST`, `STAGING_USER`, `STAGING_SSH_KEY`, `STAGING_PORT`
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID_WEB`, `VERCEL_PROJECT_ID_ADMIN`
- `SLACK_WEBHOOK`

---

### 7. **deploy-production.yml** - Manual Production Deployment
**Triggers:** Manual workflow_dispatch ONLY

**Inputs:**
- `version` (required): Version tag to deploy (e.g., v1.2.3)
- `skip_backup` (optional): Skip database backup
- `rollback_on_failure` (optional): Auto-rollback on failure
- `notify_channels` (optional): Notification channels

**Jobs:**
- 👥 **Approval**
  - Manual approval gate
  - Version validation
  - Approval notification

- ✅ **Pre-deployment Checks**
  - Git tag verification
  - Prerequisites validation
  - Environment checks
  - Staging health check

- 💾 **Database Backup**
  - PostgreSQL dump
  - File backup
  - S3 upload
  - Retention management

- 📦 **Build Production**
  - All components
  - Production optimization
  - 30-day artifact retention

- 🔒 **Security Scan**
  - Final Snyk scan
  - OWASP dependency check
  - Critical severity only

- 🔄 **Deploy Backend (Blue-Green)**
  - Zero-downtime deployment
  - Traffic switching
  - Automatic rollback
  - Health verification

- 🌐 **Deploy Frontend**
  - Vercel production deploy
  - Custom domain setup
  - CDN invalidation

- 🤖 **Deploy Agents**
  - Production agent deployment
  - Version verification

- 🐍 **Deploy Engines**
  - Python engine deployment
  - Process restart

- 🧪 **Smoke Tests**
  - Critical E2E tests
  - Postman collections
  - Production validation

- ⚡ **Performance Verification**
  - Load testing
  - Lighthouse audits
  - Performance baselines

- 📊 **Enable Monitoring**
  - Prometheus alerts
  - Grafana dashboards
  - Sentry deployment marker

- ✅ **Notify Success**
  - Slack notification
  - GitHub release creation
  - Documentation update

- ⚠️ **Rollback** (on failure)
  - Automatic rollback
  - Blue-green switch
  - Emergency notifications

**Secrets Required:**
- `PROD_HOST`, `PROD_USER`, `PROD_SSH_KEY`
- `DATABASE_URL`, `REDIS_URL`
- `S3_BACKUP_BUCKET`
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID_WEB`, `VERCEL_PROJECT_ID_ADMIN`
- `GRAFANA_API_KEY`
- `SENTRY_ORG`, `SENTRY_AUTH_TOKEN`
- `GITHUB_TOKEN` (automatic)
- `SLACK_WEBHOOK`

---

## 🔐 Required Secrets Configuration

### GitHub Repository Secrets

Navigate to: `Settings > Secrets and variables > Actions`

#### General Secrets
```
CODECOV_TOKEN=<codecov-token>
SNYK_TOKEN=<snyk-api-token>
SLACK_WEBHOOK=<slack-webhook-url>
GITHUB_TOKEN=<automatically-provided>
```

#### Staging Secrets
```
STAGING_HOST=<staging-server-ip>
STAGING_USER=<ssh-username>
STAGING_SSH_KEY=<private-ssh-key>
STAGING_PORT=22
```

#### Production Secrets
```
PROD_HOST=<production-server-ip>
PROD_USER=<ssh-username>
PROD_SSH_KEY=<private-ssh-key>
DATABASE_URL=<production-postgres-url>
REDIS_URL=<production-redis-url>
S3_BACKUP_BUCKET=<s3-bucket-name>
```

#### Vercel Secrets
```
VERCEL_TOKEN=<vercel-api-token>
VERCEL_ORG_ID=<vercel-org-id>
VERCEL_PROJECT_ID_WEB=<web-project-id>
VERCEL_PROJECT_ID_ADMIN=<admin-project-id>
```

#### API Keys
```
OPENAI_API_KEY_TEST=<openai-test-key>
ANTHROPIC_API_KEY_TEST=<anthropic-test-key>
ECONOMIC_API_KEY_TEST=<economic-api-test-key>
AGENT_REGISTRY_TOKEN=<registry-token>
```

#### Monitoring Secrets
```
GRAFANA_API_KEY=<grafana-api-key>
SENTRY_ORG=<sentry-organization>
SENTRY_AUTH_TOKEN=<sentry-auth-token>
```

#### Environment Variables
```
NEXT_PUBLIC_API_URL=<api-url>
NEXT_PUBLIC_WS_URL=<websocket-url>
JWT_SECRET=<jwt-secret-key>
```

---

## 🚀 Usage Guide

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make Changes & Commit**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/my-feature
   ```

3. **Create Pull Request**
   - Triggers: `backend.yml`, `frontend.yml`, `agents.yml`, `engines.yml`, `docker.yml`
   - All tests and quality checks run automatically
   - Review required before merge

4. **Merge to Develop**
   - Auto-triggers: `deploy-staging.yml`
   - Automatic deployment to staging environment
   - Smoke tests run automatically

5. **Test on Staging**
   - Access: https://staging.ait-core.soriano.com
   - Verify functionality
   - Run manual tests if needed

6. **Create Release Tag**
   ```bash
   git checkout main
   git merge develop
   git tag -a v1.2.3 -m "Release version 1.2.3"
   git push origin main --tags
   ```

7. **Deploy to Production** (Manual)
   - Go to: `Actions > Deploy to Production (Manual)`
   - Click "Run workflow"
   - Enter version: `v1.2.3`
   - Configure options
   - Click "Run workflow"
   - Approve in environment

---

## 📊 Monitoring & Notifications

### Slack Notifications

All workflows send notifications to Slack:
- ✅ Successful deployments
- ❌ Failed builds/deployments
- ⚠️ Security vulnerabilities
- 📊 Performance reports

### GitHub Actions Dashboard

View workflow runs:
- `Actions` tab in repository
- Filter by workflow name
- View logs and artifacts
- Download reports

### Codecov Reports

Code coverage reports:
- https://codecov.io/gh/your-org/ait-core-soriano
- Coverage trends
- PR comments with coverage diff

### Security Scanning

Security reports available in:
- `Security > Code scanning alerts`
- `Security > Dependabot alerts`
- Snyk dashboard

---

## 🛠️ Maintenance

### Updating Workflows

1. Edit workflow files in `.github/workflows/`
2. Test changes in feature branch
3. Merge to main after verification

### Rotating Secrets

1. Update secrets in GitHub Settings
2. Re-run failed workflows if needed
3. Update production servers

### Debugging Failed Workflows

1. Check workflow logs in Actions tab
2. Review error messages
3. Check secrets configuration
4. Verify environment health
5. Re-run failed jobs if needed

---

## 📝 Best Practices

### Commit Messages
Use conventional commits:
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `style:` formatting
- `refactor:` code restructuring
- `test:` adding tests
- `chore:` maintenance

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature branches
- `hotfix/*` - Emergency fixes

### Versioning
Follow Semantic Versioning (semver):
- `v1.0.0` - Major release
- `v1.1.0` - Minor release (new features)
- `v1.1.1` - Patch release (bug fixes)

### Testing
- Write tests for all new features
- Maintain >80% code coverage
- Run tests locally before pushing
- Fix broken tests immediately

---

## 📖 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [NestJS Testing Guide](https://docs.nestjs.com/fundamentals/testing)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## 🆘 Support

For issues or questions:
1. Check workflow logs
2. Review this documentation
3. Contact DevOps team
4. Create GitHub issue

---

**Last Updated:** 2026-01-28
**Maintained by:** AIN TECH - DevOps Team
