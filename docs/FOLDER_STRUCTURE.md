# SysTracker Repository Structure

Last Updated: February 21, 2026

## 📁 Root Organization

```
SysTracker/
├── README.md                          # Main entry point & quick start
├── .gitignore                         # Git ignore rules
├── .github/                           # GitHub configuration (workflows, CI/CD)
├── .vscode/                           # VS Code settings
├── .wiki/                             # GitHub wiki files
├── Docker/                            # Docker configuration files
├── docs/                              # All documentation (see below)
├── scripts/                           # Production & utility scripts
├── legacy/                            # Legacy and old components
├── server/                            # Node.js Express backend
├── dashboard/                         # Next.js React frontend
├── agent/                             # System monitoring agents
└── tests/                             # Test suites
```

---

## 📚 Documentation Structure (`/docs`)

```
docs/
├── PRIVACY-POLICY.md                  # GDPR/CCPA compliance
├── EULA.txt                           # Legal terms
├── SYSTEM-REQUIREMENTS.md             # Hardware/software specs
├── APPLICATION-VERIFICATION-REPORT.md # Testing & verification
├── MICROSOFT-CERTIFICATION-PACKAGE.md # Certification checklist
├── CERTIFICATION-READY-FINAL-SUMMARY.md
├── CERTIFICATION-COMPLETE.md          # Final status
├── CHANGELOG.md                       # Version history
├── RELEASE_NOTES_v3.1.2.md            # Release documentation
└── guides/                            # Detailed guides
    ├── DEPLOYMENT-GUIDE.md            # Installation procedures
    ├── PARTNER-CENTER-SUBMISSION-GUIDE.md # Store submission steps
    ├── WINDOWS-STANDALONE-SETUP.md    # Windows setup guide
    ├── INSTALLATION_AND_DEPLOYMENT.md # Complete guide
    ├── INSTALLATION_VALIDATION_GUIDE.md
    ├── UPGRADE_GUIDE_v3.1.2.md        # Version upgrade path
    ├── WINDOWS_IMPLEMENTATION_GUIDE.md
    ├── WINDOWS_SERVER_DEPLOYMENT.md   # Server OS deployment
    ├── WINDOWS_SERVER_QUICK_START.md  # Quick reference
    ├── WINDOWS_SETUP_CHECKLIST.md     # Setup verification
    └── WINDOWS_DOCKER_SETUP.md        # Docker setup
```

---

## 🔧 Scripts Structure (`/scripts`)

```
scripts/
├── RUN-SYSTRACKER.bat                 # Quick start launcher
├── install-service.bat                # Windows Service installer
├── create-shortcut.bat                # Desktop shortcut creator
├── build_windows.bat                  # Build production EXE
├── install_windows_service.ps1        # PowerShell service install
├── manage_service.ps1                 # Service management
├── validate_windows_install.ps1       # Installation validation
├── install_agent.ps1                  # Agent installation
├── generate_assets.ps1                # Asset generator
└── FIND_APP_INSTALLATION.ps1          # Find installation path
```

---

## 🏢 Main Components

### `/server` - Node.js Backend
```
server/
├── server.js                          # Main Express application
├── package.json                       # Dependencies
├── schema.sql                         # Database schema
├── errorLogger.js                     # Error logging
├── dataValidation.js                  # Input validation
├── emailTemplates.js                  # Email templates
├── systracker-server-win.exe          # Standalone Windows executable (49 MB)
├── dashboard-dist/                    # Built frontend files
├── data/                              # Runtime data directory
├── logs/                              # Application logs
├── bin/                               # Binary/executable files
└── tests/                             # Server tests
```

### `/dashboard` - React Frontend
```
dashboard/
├── package.json                       # Dependencies
├── tsconfig.json                      # TypeScript config
├── next.config.ts                     # Next.js configuration
├── app/
│   ├── layout.tsx                     # Root layout
│   ├── page.tsx                       # Home page
│   ├── globals.css                    # Global styles
│   ├── api/                           # API routes
│   ├── dashboard/                     # Dashboard pages
│   ├── login/                         # Authentication
│   └── setup/                         # Setup wizard
├── components/                        # React components
├── lib/                               # Utility functions
├── public/                            # Static assets
└── build-dist/                        # Production build
```

### `/agent` - System Monitoring Agent
```
agent/
├── client_agent.js                    # Main agent (Node.js)
├── client_agent.py                    # Python version
├── package.json                       # Dependencies
├── requirements.txt                   # Python requirements
├── agent_config.json                  # Configuration
└── legacy/                            # Old agent versions
```

### `/Docker` - Containerization
```
Docker/
├── Dockerfile                         # Linux container
├── docker-compose.yml                 # Compose setup
├── docker-compose.local.yml           # Local development
├── docker-compose.windows.yml         # Windows container
└── README_DOCKER.txt                  # Docker documentation
```

### `/legacy` - Archived Components
```
legacy/
├── Agent_Legacy_x86/                  # Old agent versions
└── [deprecated components]
```

### `/tests` - Test Suites
```
tests/
├── [test files]
└── [test utilities]
```

---

## 📄 Root Level Files

| File | Purpose |
|------|---------|
| `README.md` | Main entry point, quick start guide |
| `.gitignore` | Git ignore configuration |
| `.github/` | GitHub workflows & automation |
| `.vscode/` | VS Code workspace settings |
| `.wiki/` | GitHub wiki content |

---

## 🎯 What Gets Deleted

- ❌ Unnecessary test files
- ❌ Old temporary documentation
- ❌ Duplicate guides
- ❌ Cache and build artifacts (except production builds)

---

## ✅ Production Files Retained

- ✅ `systracker-server-win.exe` (49 MB, standalone)
- ✅ All source code (server, dashboard, agent)
- ✅ Production scripts (installation, management)
- ✅ Professional documentation (guides, policies, terms)
- ✅ Certification documentation

---

## 🚀 Usage Guide

### For End Users
1. Download `systracker-server-win.exe` from `/server`
2. Read `/docs/guides/WINDOWS-STANDALONE-SETUP.md`
3. Run script from `/scripts` (e.g., `RUN-SYSTRACKER.bat`)

### For Developers
1. Clone repository
2. Install dependencies: `npm install` in server/, dashboard/, agent/
3. See component-specific README files
4. Build scripts in `/scripts`

### For IT/Enterprise
1. Read `/docs/guides/DEPLOYMENT-GUIDE.md`
2. Use scripts in `/scripts` for deployment
3. Check `/docs/SYSTEM-REQUIREMENTS.md`

### For Support
1. Check `/docs/guides/` for installation issues
2. Review `/docs/guides/troubleshooting` sections
3. Visit GitHub Issues for community support

---

## 📊 File Count Summary

- **Documentation:** 20+ professional guides
- **Scripts:** 10 production/utility scripts
- **Core Components:** 3 (server, dashboard, agent)
- **Tests:** Comprehensive suite
- **Legacy:** Archived for reference

---

## 🔄 Organization Benefits

✅ **Clean Root Directory** - Only essential files  
✅ **Organized Documentation** - Easy to find what you need  
✅ **Centralized Scripts** - All deployment scripts in one place  
✅ **Production Ready** - No clutter, no unnecessary files  
✅ **Enterprise Grade** - Professional structure  
✅ **Easy Navigation** - Clear folder hierarchy  

---

**Status:** ✅ Production Organized  
**Last Updated:** February 21, 2026
