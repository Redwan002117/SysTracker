# 🤖 SysTracker GitHub Automation Rules

**Version:** 3.1.0  
**Last Updated:** February 21, 2026

---

## 📋 Overview

This document describes all GitHub Actions workflows that automate SysTracker's build, test, release, and documentation processes.

### Workflow Files Location
All workflow files are located in `.github/workflows/`

---

## 📁 Workflow Files

### 1. **publish.yml** - Application Build & Publish
**Status:** ✅ Core Workflow  
**Triggers:** Push to main, tags (v*.*.*), manual dispatch

#### What It Does:
- Builds Windows executables (agent & server)
- Builds dashboard Next.js application
- Creates GitHub releases with artifacts
- Publishes Docker images (optional)

#### Jobs:
1. **build-agent** - Windows EXE compilation
2. **build-dashboard** - Next.js build
3. **build-server-release** - Server EXE + GitHub release
4. **docker-publish** - Docker image builds (optional)

#### Artifacts Created:
- `systracker-agent-win.exe` (44 MB)
- `systracker-server-win.exe` (49 MB)
- Dashboard build assets
- Docker images (ghcr.io)

---

### 2. **publish-wiki.yml** - Documentation Automation
**Status:** ✅ New Workflow  
**Triggers:** Push to docs/*, README, CHANGELOG; PRs to main

#### What It Does:
- Validates documentation syntax
- Generates API documentation
- Updates GitHub Wiki automatically
- Manages CHANGELOG entries
- Creates documentation packages

#### Jobs:
1. **validate-docs** - Markdown & JSON validation
2. **generate-docs** - API documentation generation
3. **update-wiki** - Syncs docs to GitHub Wiki
4. **update-changelog** - Maintains CHANGELOG
5. **publish-artifacts** - Creates doc packages
6. **notify-updates** - Posts summaries

#### Generated Documentation:
- `SERVER-API.md` - REST API endpoints
- `AGENT-API.md` - Agent configuration
- Wiki pages for guides
- Sidebar navigation

---

### 3. **test-and-validate.yml** - Quality Assurance
**Status:** ✅ New Workflow  
**Triggers:** Push to main/develop, PRs, manual dispatch

#### What It Does:
- Lints JavaScript/TypeScript code
- Tests server functionality
- Tests agent functionality
- Builds & validates dashboard
- Runs security audits
- Builds Windows executables

#### Jobs:
1. **lint** - Code quality checks
2. **test-server** - Backend validation
3. **test-agent** - Agent validation
4. **test-dashboard** - Frontend build test
5. **security-audit** - Dependency & secret scan
6. **build-windows** - EXE generation (main only)
7. **final-validation** - Results aggregation
8. **notify** - PR comments

#### Output:
- Build artifacts (7-day retention)
- Test reports
- Security audit results
- PR comments with status

---

### 4. **release-automation.yml** - Version & Release Management
**Status:** ✅ New Workflow  
**Triggers:** package.json version changes, manual dispatch

#### What It Does:
- Detects version bumps
- Creates release notes from CHANGELOG
- Generates Git tags
- Creates GitHub releases
- Updates documentation versions
- Sends release notifications

#### Jobs:
1. **detect-version** - Version change detection
2. **create-release-notes** - Generates release info
3. **create-tag** - Creates Git tag
4. **create-github-release** - GitHub release creation
5. **publish-packages** - Package registry publish
6. **update-docs-version** - Updates doc references
7. **notify-release** - Release announcements
8. **archive-release** - Creates archive

#### Outputs:
- GitHub Release page
- Release artifacts (90-day retention)
- Release announcements

---

## 🔄 Workflow Interactions

### Typical Release Flow

```
1. Developer updates version in package.json
        ↓
2. release-automation.yml triggers
        ↓
3. Git tag created (v3.1.2)
        ↓
4. publish.yml triggers on tag
        ↓
5. Applications built
        ↓
6. GitHub Release created with artifacts
        ↓
7. publish-wiki.yml updates documentation
        ↓
8. Release notification sent
```

### PR Review Flow

```
1. Developer creates PR with docs changes
        ↓
2. test-and-validate.yml runs
        ↓
3. Results posted as PR comment
        ↓
4. If changes to docs/ folder:
   publish-wiki.yml validates
        ↓
5. Approval → merge to main
        ↓
6. Wiki auto-updates on merge
```

---

## ⚙️ Configuration & Customization

### Environment Variables

**publish.yml:**
```yaml
env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}
```

**test-and-validate.yml:**
```yaml
env:
  NODE_VERSION: '18'
  DASHBOARD_NODE_VERSION: '20'
```

**publish-wiki.yml:**
```yaml
env:
  WIKI_REPO: ${{ github.repository }}.wiki
  DOCS_PATH: docs
```

### Customization Examples

#### Change Node Version
Edit workflow YAML:
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version: 20  # Change here
```

#### Modify Triggers
```yaml
on:
  push:
    branches: [ 'main', 'develop' ]  # Add branches
    tags: [ 'v*', 'release/*' ]       # Add tags
```

#### Add Custom Steps
```yaml
- name: Custom Validation
  run: |
    # Your custom commands here
    npm run custom-test
```

---

## 📊 Workflow Status & Monitoring

### View Workflow Runs
1. Go to **Actions** tab in GitHub
2. Select workflow from left sidebar
3. View run history and logs

### Workflow Badges
Add to README.md:
```markdown
![Publish](https://github.com/Redwan002117/SysTracker/actions/workflows/publish.yml/badge.svg)
![Tests](https://github.com/Redwan002117/SysTracker/actions/workflows/test-and-validate.yml/badge.svg)
![Wiki](https://github.com/Redwan002117/SysTracker/actions/workflows/publish-wiki.yml/badge.svg)
```

### Workflow Results
All workflows post summaries to:
- GitHub Actions tab
- Run logs (detailed)
- PR comments (for PRs)
- GitHub Step Summary

---

## 🛡️ Security & Permissions

### Required Tokens
- **GITHUB_TOKEN** (automatic) - All workflows
- **NPM_TOKEN** (optional) - Package publishing

### Repository Secrets Needed
```
- NPM_TOKEN (optional, for npm registry)
- DOCKER_REGISTRY_TOKEN (if using Docker)
```

### Permissions by Workflow
```
publish.yml:
  - contents: write (releases)
  - packages: write (Docker)

publish-wiki.yml:
  - contents: write (wiki sync)

test-and-validate.yml:
  - contents: read

release-automation.yml:
  - contents: write (releases)
  - packages: write (optional)
```

---

## 🐛 Troubleshooting

### Workflow Not Triggering

**Check triggers:**
```yaml
on:
  push:
    branches: [ 'main' ]  # Must match your branch
    paths: [ 'docs/**' ]  # Check path filters
```

**Solution:** Ensure branch name & path match

### Build Failure

**Common causes:**
- Node version mismatch
- Missing dependencies
- Port 3000 in use
- Database lock

**Debug:**
1. Check workflow logs: **Actions** → select workflow → see full logs
2. Run locally: `npm install && npm run build:win`
3. Check error messages carefully

### Wiki Not Updating

**Probable cause:** Wiki repository not initialized

**Solution:**
1. Create wiki by visiting Wiki tab
2. Create one page manually (e.g., "Home")
3. Workflow will update on next push

---

## 🚀 Manual Workflow Triggers

### Run Specific Workflow Manually

1. Go to **Actions** tab
2. Select workflow name
3. Click **Run workflow** button
4. Select branch
5. Click **Run workflow**

### Available Manual Triggers:

**publish.yml:**
- manual dispatch (with default branch)

**test-and-validate.yml:**
- manual dispatch

**release-automation.yml:**
- manual dispatch with inputs:
  - Version number
  - Release type (major/minor/patch)

---

## 📈 Workflow Performance

### Typical Execution Times

| Workflow | Time | Notes |
|----------|------|-------|
| publish.yml | 15-20 min | Full build with Docker |
| test-and-validate.yml | 10-15 min | All tests includedPublish-wiki.yml | 5-10 min | Parallel jobs |
| release-automation.yml | 20-30 min | Includes full build |

### Optimization Tips

1. **Parallel Jobs:** Use `needs:` wisely
2. **Cache Dependencies:** Use `actions/setup-*` caching
3. **Conditional Execution:** Use `if:` statements
4. **Upload Retention:** Set `retention-days` appropriately

---

## 📚 Additional Resources

### GitHub Actions Documentation
- [Workflow Syntax](https://docs.github.com/en/actions/learn-github-actions/workflow-syntax-for-github-actions)
- [Events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows)
- [Context & Expressions](https://docs.github.com/en/actions/learn-github-actions/contexts)

### SysTracker Docs
- [Installation Guide](WINDOWS-APP-INSTALLATION-GUIDE.md)
- [Deployment Guide](DEPLOYMENT-GUIDE.md)
- [API Documentation](../generated/SERVER-API.md)

---

## 🤝 Contributing to Workflows

### To Add a New Workflow

1. Create file in `.github/workflows/` (e.g., `new-workflow.yml`)
2. Follow existing structure
3. Include descriptive comments
4. Test with `workflow_dispatch` first
5. Document in this file
6. Commit and push

### Best Practices

- ✅ Use descriptive job names
- ✅ Add step comments
- ✅ Include error handling
- ✅ Document triggers
- ✅ Set appropriate permissions
- ✅ Use consistent indentation

---

## 📞 Support

For workflow issues:

1. Check [GitHub Actions Status](https://www.githubstatus.com/)
2. Review workflow logs
3. Check runner environment
4. Consult GitHub Actions docs
5. Create an issue with workflow logs

---

**Last Updated:** February 21, 2026  
**SysTracker Version:** 3.1.0  
**Maintained By:** Development Team
