# 🚀 SysTracker Dashboard Deployment System

> **📘 For production deployments**, see [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) for comprehensive server setup and remote deployment instructions.

## Quick Deployment from VS Code

You can now deploy the dashboard directly from your code editor using several methods:

### Method 1: Keyboard Shortcuts (Fastest)

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+Shift+D` | 🚀 Deploy Dashboard | Build and deploy in one command |
| `Ctrl+Shift+B` | 🔨 Build Only | Build without deploying |
| `Ctrl+Shift+Q` | 📦 Quick Deploy | Copy existing build (skip rebuild) |

### Method 2: Command Palette

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Tasks: Run Task"
3. Select from available tasks:
   - **🚀 Deploy Dashboard** - Full build and deploy
   - **🔨 Build Dashboard Only** - Build without deploying
   - **📦 Quick Deploy** - Copy existing build
   - **🔄 Clean & Rebuild** - Clean cache and rebuild
   - **👁️ Watch & Auto-Deploy** - Auto-deploy on changes
   - **🌐 Start Server** - Start the SysTracker server

### Method 3: Terminal Script

```bash
# From project root
./scripts/deploy-dashboard.sh
```

## Deployment Workflow

### Standard Deployment
```bash
# Make changes to dashboard files
# Press Ctrl+Shift+D to build and deploy
# Dashboard is now updated in server/dashboard-dist/
```

### Quick Iteration
```bash
# For CSS/minor changes that don't need full rebuild
# Press Ctrl+Shift+Q for instant deployment
```

### Auto-Deploy Mode
```bash
# Run "Watch & Auto-Deploy Dashboard" task
# Dashboard rebuilds and deploys automatically on file changes
# Requires 'watch' command (install: apt-get install watch)
```

## Deployment Process

When you deploy, the system:

1. ✅ **Validates** project structure
2. 🔨 **Builds** dashboard with Next.js (Turbopack)
3. 🗑️ **Clears** old deployment files
4. 📦 **Copies** new build to server directory
5. ✓ **Verifies** deployment success

## Directory Structure

```
SysTracker/
├── dashboard/              # Source code
│   ├── app/               # Next.js pages
│   ├── components/        # React components
│   └── out/               # Build output (generated)
│
├── server/
│   └── dashboard-dist/    # Deployment target (served by server)
│
└── scripts/
    └── deploy-dashboard.sh  # Deployment script
```

## Remote Deployment

For **production deployments**, use our automated deployment system:

### Quick Remote Deploy
```bash
# Deploy to production with automated script
./scripts/deploy-remote.sh production

# Deploy with options
./scripts/deploy-remote.sh production --restart
./scripts/deploy-remote.sh staging --dry-run
```

### Automated CI/CD
- **GitHub Actions** workflow included (`.github/workflows/deploy-dashboard.yml`)
- Automatic deployment on push to main branch
- Manual deployment via GitHub Actions UI
- Supports multiple environments (production, staging, demo)

### Manual Remote Deployment
```bash
# Build locally
cd dashboard && npm run build

# Deploy via rsync
rsync -avz --delete \
  -e "ssh -p 22" \
  dashboard/out/ \
  username@server:/var/www/systracker/server/dashboard-dist/

# Restart server
ssh username@server "pm2 restart systracker"
```

**📚 Complete Setup Guide:** See [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) for:
- Server configuration and prerequisites
- Nginx reverse proxy setup
- SSL certificate installation
- PM2 process management
- GitHub Actions CI/CD configuration
- Monitoring and maintenance procedures

## Troubleshooting

### Build Fails
```bash
# Clean cache and rebuild
cd dashboard
rm -rf .next out
npm run build
```

### Deployment Verification
```bash
# Check deployed files
ls -la server/dashboard-dist/
du -sh server/dashboard-dist/
```

### Server Restart Required
After deployment, restart the server if required:
```bash
cd server
pm2 restart server.js
# or
systemctl restart systracker
```

## Performance Tips

1. **Quick Deploy** for CSS-only changes (skips rebuild)
2. **Watch Mode** for active development
3. **Standard Deploy** for code changes
4. **Clean & Rebuild** if build cache is corrupted

## Modern UI Applied

The dashboard now features:
- ✨ **Glassmorphism** - Translucent cards with backdrop blur
- 🎨 **Gradient Accents** - Blue-to-purple color scheme
- 🌊 **Soft Shadows** - Depth with colored glows
- 💫 **Smooth Animations** - 200-300ms transitions
- 🎯 **Enhanced Contrast** - WCAG AA+ accessibility

## Files Updated with Modern UI

- ✅ Chat Interface
- ✅ Sidebar Navigation
- ✅ Top Bar
- ✅ Machine Cards
- ✅ Dashboard KPIs
- ✅ Alerts Page
- ✅ Login Page
- 🔄 Mail Page (in progress)
- 🔄 Profile Page (in progress)
- 🔄 Settings Page (in progress)
- 🔄 Users Page (in progress)

---

**Need Help?** Check the main README.md or contact the development team.
