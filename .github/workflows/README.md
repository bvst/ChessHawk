# GitHub Actions Workflows

This directory contains the GitHub Actions workflows for Chess Hawk's CI/CD pipeline.

## Workflows

### 1. `ci.yml` - Main CI/CD Pipeline
**Triggers:** Push to `main`/`develop`, Pull Requests to `main`

**Purpose:** Complete CI/CD pipeline with testing, linting, building, and security scanning.

**Jobs:**
- 🧪 **Test** - Run tests in Docker container
- 🔍 **Lint** - ESLint and TypeScript type checking
- 🏗️ **Build** - Build production container and push to registry
- 🛡️ **Security** - Vulnerability scanning with Trivy
- 🚀 **Deploy Staging** - Auto-deploy to staging on main branch
- ⚡ **Performance** - Lighthouse CI performance testing

### 2. `netlify-deploy.yml` - Netlify Deployment
**Triggers:** 
- Push to `main` branch
- Successful completion of CI pipeline
- Manual workflow dispatch

**Purpose:** Dedicated Netlify deployment with health checks and status updates.

**Features:**
- ✅ Pre-deployment testing
- 🚀 Production and preview deployments
- 🏥 Post-deployment health checks
- 💬 Automatic commit comments with deployment URLs
- 🔄 Cleanup on failure

**Manual Deployment:**
```bash
# Go to Actions tab → Netlify Deploy → Run workflow
# Choose environment: production or preview
# Optional: Add custom deployment message
```

### 3. `deploy.yml` - Release Deployment
**Triggers:** 
- Git tags starting with `v*`
- Manual workflow dispatch

**Purpose:** Full production deployment for releases with container registry and cloud deployment.

**Jobs:**
- 📦 **Build** - Build and push container images
- 🌐 **Deploy Netlify** - Deploy to Netlify
- 🐳 **Deploy Container** - Deploy container to cloud platform
- 🏥 **Health Check** - Verify deployment success
- 🔄 **Rollback** - Automatic rollback on failure

## Required Secrets

Add these secrets in your GitHub repository settings:

```
NETLIFY_AUTH_TOKEN    # Your Netlify personal access token
NETLIFY_PROJECT_ID    # Your Netlify project ID
```

### Getting Netlify Secrets

1. **NETLIFY_AUTH_TOKEN:**
   - Go to [Netlify User Settings](https://app.netlify.com/user/applications)
   - Applications → Personal access tokens
   - Generate new token

2. **NETLIFY_PROJECT_ID:**
   - Go to your site in Netlify dashboard
   - Site settings → General → Site information
   - Copy the Site ID (now called Project ID)

## Deployment Environments

### Automatic Deployments
- **Staging:** Every push to `main` (via CI pipeline)
- **Production:** Git tags starting with `v*`
- **Preview:** Pull requests (via Netlify's built-in previews)

### Manual Deployments
- Use "Deploy to Netlify" workflow for immediate deployments
- Choose between `production` and `preview` environments
- Add custom deployment messages for tracking

## Monitoring and Health Checks

All deployments include:
- ✅ Availability checks
- 🎨 CSS loading verification
- 📜 JavaScript loading verification
- 📊 Build size analysis
- 💬 Deployment status comments

## Troubleshooting

### Common Issues

1. **Deployment fails with "Unauthorized"**
   - Check `NETLIFY_AUTH_TOKEN` secret
   - Verify token has correct permissions

2. **Project ID not found**
   - Verify `NETLIFY_PROJECT_ID` secret
   - Check site exists in your Netlify account

3. **Build failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Review build logs for specific errors

4. **Health check failures**
   - Wait for Netlify propagation (may take 1-2 minutes)
   - Check Netlify deploy logs for build issues
   - Verify site URL is accessible

### Debug Commands

```bash
# Check workflow status
gh workflow list

# View specific run
gh run view <run-id>

# Re-run failed workflow
gh run rerun <run-id>

# View workflow logs
gh run view <run-id> --log
```

## Development Workflow

1. **Feature Development:**
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   git push origin feature/new-feature
   # Create PR → triggers CI
   ```

2. **Release Process:**
   ```bash
   git checkout main
   git tag v1.0.0
   git push origin v1.0.0
   # Triggers full deployment pipeline
   ```

3. **Hotfix Deployment:**
   ```bash
   # Use manual "Deploy to Netlify" workflow
   # Or push directly to main for auto-deployment
   ```