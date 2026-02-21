# Changelog

All notable changes to SysTracker are documented here.
This project follows [Semantic Versioning](https://semver.org/).

## [3.3.1] - 2026-02-21

### 🐛 Bug Fixes

- **Navigation Issue** — Fixed sidebar navigation highlighting for nested routes (e.g., `/dashboard/alerts/123`)
  - Implemented hierarchical route matching with `startsWith()` logic
  - Dashboard root gets exact match, other routes support sub-paths
  - Improves UX when navigating to detail pages

- **Chat User Duplication** — Eliminated duplicate users in chat user list
  - Backend: Added `DISTINCT` clause and `ORDER BY username` to SQL query
  - Frontend: Implemented Map-based deduplication by username
  - Added TypeScript type assertions for type safety

- **Profile Photo Sync** — Avatar changes now update immediately across all components
  - Implemented custom event system (`profile-updated` event)
  - TopBar listens for profile updates and refreshes from API
  - Profile page dispatches events on avatar/profile changes
  - Includes localStorage cache invalidation

### ✨ New Features

- **Gravatar Integration** — Automatic avatar loading from Gravatar
  - Server-side utility with MD5 hashing (`/server/lib/gravatar.js`)
  - Client-side utility with SHA-256 for browser compatibility (`/dashboard/lib/gravatar.ts`)
  - Auto-fetch on profile load if no avatar exists
  - Manual "Fetch from Gravatar" button with loading states
  - Works for both regular users and OAuth users

- **User Management Enhancement** — Complete CRUD operations for user administration
  - Edit button added to user table with blue highlighting (Edit2 icon)
  - Complete edit modal with glassmorphism design
  - Form fields: username, email, role (admin/viewer)
  - Backend: Updated PUT `/api/users/:id` to support role updates
  - Security: Prevents admins from changing their own role
  - Password reset guidance included in modal
  - Loading states and success/error notifications

### 🎨 UI/UX Improvements

- **Dashboard Layout Redesign** — Modern, consistent styling across all metric panels
  - Enhanced main KPI cards with larger numbers (4xl font)
  - Better labels: "Online Agents", "Critical Alerts", "Avg CPU Load"
  - Contextual subtitles: "of X total", "high usage", "across fleet"
  - Infrastructure Metrics section redesigned with consistent glassmorphism
  - Improved OS Distribution panel with percentages and taller progress bars
  - Network I/O panel completely redesigned with gradient backgrounds and animated indicators
  - Top CPU Load panel enhanced with gradient progress bars
  - All panels now share consistent blur/shadow effects and smooth animations (500ms transitions)

### 🔧 Technical Improvements

- Better TypeScript type safety across chat and user management features
- Improved form validation and error handling
- Enhanced custom event propagation for cross-component communication
- Optimized SQL queries with DISTINCT and proper ordering

## [3.3.0] - 2026-02-21

### 🎨 UI/UX Improvements

- **Modern Dashboard Design** — Complete redesign with Soft UI Evolution and Glassmorphism patterns
  - Smooth animations (200-300ms) throughout all pages
  - Blue-to-purple gradient theme with enhanced shadows
  - WCAG AA+ accessibility compliance
  - Fully responsive design for all screen sizes

- **Glassmorphism Components** — Implemented across all dashboard pages with backdrop blur, translucent backgrounds, layered depth, and colored glows

- **Enhanced Pages** — 13 pages updated: dashboard, alerts, chat, mail, profile, settings, users, login, and authentication pages

### 🚀 Deployment & DevOps

- **Production Deployment Infrastructure** — Complete production-ready system
  - Remote SSH deployment via `deploy-remote.sh` script
  - GitHub Actions CI/CD workflow for automated deployments
  - Automatic backup and rollback capabilities
  - Multi-environment support (production/staging/demo)
  - Slack/Discord webhook notifications

- **Local Deployment Automation** — One-command deployment with VS Code integration (Ctrl+Shift+D)

- **Docker Improvements** — Fixed UID conflict, multi-stage build optimization, security improvements

### 📚 Documentation

- **PRODUCTION_DEPLOYMENT.md** — Comprehensive 600+ line server setup guide
- **PRODUCTION_CHECKLIST.md** — 350+ line deployment verification checklist
- **QUICK_REFERENCE.md** — Printable command reference
- **PRODUCTION_SETUP_COMPLETE.md** — Overview and quick start
- **deploy-config/** — Multi-environment deployment templates

### 🔧 Technical Improvements

- Deployment configuration system with .env.production.example (90+ options)
- Verified production builds (Dashboard, Server, Agent)
- Docker builds without errors

## [3.2.6] - 2026-02-21

### 🐛 Bug Fixes

- **Dashboard build**: fixed CI workflow to copy `dashboard/out` (static export) instead of `dashboard/.next` to `server/dashboard-dist` — ensures the latest built dashboard is included in releases
- **Code signing conditions**: fixed workflow conditional checks to properly evaluate secret existence — `secrets.CODESIGN_PFX_BASE64` instead of `env.CODESIGN_PFX_BASE64`

### 🔧 Technical Improvements

- Dashboard now properly included in server releases with latest compiled assets

## [3.2.7] - 2026-02-22

### ✨ New Features

- **Password setup flow**: admins can create users without setting a password and send a one-time setup email to let users choose their own password
- **Agent logging**: agent now writes rotating logs to `C:\\ProgramData\\SysTracker\\Agent\\logs` with a helper `view-agent-log.bat` to open the latest log

### 🐛 Bug Fixes

- **Mail inbox access**: added TopBar navigation with unread badge so users can find the mail inbox

### 🔧 Technical Improvements

- **Password setup endpoint**: added `/api/auth/setup-password` and a `passwordSetupEmail` template
- **User management**: new admin action to re-send password setup email to any user

## [3.2.5] - 2026-06-21

### ✨ New Features

- **Moderator role** — new middle-tier role (`admin > moderator > viewer`); moderators can view/delete machines, manage alerts, use terminal and performance history, and send internal mail — but cannot create/edit users or access Settings
- **Internal mail system** — full mailbox UI at `/dashboard/mail` with inbox & sent folders, compose drawer, message preview pane, reply shortcuts, and 5 pre-built templates (`maintenance`, `machine offline`, `welcome`, `critical alert`, `custom`); unread badge shown on TopBar; messages auto-purged after 60 days
- **Activity audit logs** — every login, user creation/deletion, role change, user update, and mail send is recorded in `audit_logs` table; accessible from Settings → Activity Logs tab with actor/action filter and CSV export; entries auto-purged after 45 days
- **Settings → Activity Logs tab** — searchable, filterable audit trail with colour-coded action badges; supports linking directly via `?tab=logs`
- **TopBar notification bell** — admin-only dropdown showing last 10 audit events with actor, action, target and time-ago formatting; red pulse dot for unseen events; "See all" link to Activity Logs tab; polls every 30 s
- **TopBar mail badge** — mail icon with live unread-count badge; polls every 30 s
- **Glassmorphism / iOS design system** — `globals.css` rewritten with glass utility classes (`.glass`, `.glass-card`, `.glass-panel`, `.matte-surface`, `.ios-button`), CSS custom properties for blur/border/shadow, and a soft gradient body background
- **User management overhaul** — avatar display with gradient fallback colour per role; inline edit modal for username, email, display name, role, and password; role guide panel with per-role permission list; search filter across username/email/role; moderator role in create/edit flows

### 📊 Dashboard Improvements

- **Online/Offline ring chart** — SVG donut showing online vs offline machine ratio with counts
- **OS distribution bars** — per-OS breakdown with colour-coded progress bars for Windows / Linux / macOS / Other
- **Network I/O totals** — aggregated upload and download across all online machines
- **Top CPU load widget** — horizontal bar chart of top 5 online machines by CPU%, colour-coded by severity

### 📧 Email Templates

- Added `roleChangedEmail(username, oldRole, newRole)` — notifies users of access level changes
- Added `machineOfflineEmail(hostname, ip, lastSeen)` — offline machine alert with action guidance
- Added `maintenanceEmail(startTime, endTime, details)` — scheduled maintenance notice

### 🔧 Technical Improvements

- **`server.js`**: new `audit_logs` and `mail_messages` SQLite tables created at DB init
- **`server.js`**: `requireAdminOrModerator` middleware for shared admin/moderator endpoints
- **`server.js`**: `logAudit()` helper — fire-and-forget audit logging with actor, action, target, detail, IP
- **`server.js`**: 24 h cron to purge `audit_logs` (>45 d), `mail_messages` (>60 d), and system `logs` (>45 d)
- **`auth.ts`**: added `isModerator()` and `isAdminOrModerator()` helpers
- **`server.js`**: 8 new API routes — `/api/audit-logs`, `/api/mail`, `/api/mail/unread-count`, `/api/mail/:id`, `/api/mail-users`

## [3.2.4] - 2026-02-21

### 🐛 Bug Fixes
- **NSIS installers**: added `SetRegView 64` to both agent and server install/uninstall sections — fixes "not installed" detection on 64-bit Windows (NSIS default 32-bit view wrote registry to `Wow6432Node`, invisible to 64-bit PowerShell)
- **Tray app**: server `stdout`/`stderr` now captured to `logs\server.log` — server crash output was previously swallowed; now persisted for diagnosis
- **Tray app**: added "View Server Log" context menu item; crash balloon now shows log file path hint; balloon duration extended 3 s → 5 s
- **`Install-SysTracker.ps1`**: set UTF-8 console encoding (`chcp 65001`) — fixes garbled box-drawing characters on non-UTF-8 terminals
- **`Install-SysTracker.ps1`**: single-keypress menu navigation — menu selection proceeds immediately without pressing Enter
- **`Install-SysTracker.ps1`**: checks both 64-bit and 32-bit (`Wow6432Node`) registry hives when detecting installed components — backward-compat fallback for old installs
- **`LICENSE`**: replaced Unicode box-drawing characters (`─`) with ASCII `-` — fixes garbled text on NSIS MUI license agreement page

## [3.2.3] - 2026-02-21

### ✨ New Features
- **Windows Server System Tray Launcher** (`SysTrackerServer.exe`) — the server now ships as a proper Windows GUI application with a system tray icon; double-click to open the dashboard, right-click for Restart / Stop & Exit; shows balloon notification when the server is ready; single-instance mutex prevents duplicate launches

### 🔧 Technical Improvements
- **CI: tray build added to `test-and-validate.yml`** — `build-windows` job now compiles `SysTrackerTray.csproj` in Release mode and verifies `SysTrackerServer.exe` is produced, so tray regressions are caught on every push to `main`
- **CI: `publish.yml` rcedit version** — updated hardcoded file version stamp from `3.2.0.0` → `3.2.3.0` to match the actual release

### 🐛 Bug Fixes
- **`launch-server.bat`** — was referencing `systracker-server-win.exe` (the raw Node.js core binary, which the installer renames) instead of `SysTrackerServer.exe` (the tray launcher); also removed hardcoded `start http://localhost:3000` — the tray app opens the browser automatically via its health-check
- **`install-server.ps1`** — port `3000` → `7777` throughout (`.env` template, summary output); version `3.1.0` → `3.2.3`; publisher `"SysTracker Project"` → `"RedwanCodes"`; shortcuts pointed to `launch-server.bat` + `logo.ico` → `SysTrackerServer.exe` + `systracker.ico`
- **`installer.nsi`** — version bumped through all `VIProductVersion` / `VIAddVersionKey` entries
- **`.gitignore`** — added `server/tray/bin/` and `server/tray/obj/` to suppress .NET build artifact noise

---

## [3.2.2] - 2026-02-21

### 🐛 Bug Fixes
- **CI: manifest.ts TypeScript build failure** — `purpose: 'any maskable'` is not a valid `MetadataRoute.Manifest` icon purpose; split into two separate icon entries (`purpose: 'maskable'` and `purpose: 'any'`) in both the dashboard and portfolio repos
- **CI: unexpected `any` types in SystemLoadChart** — added proper `TooltipProps` and `TooltipEntry` interfaces; replaced untyped `any` params
- **CI: unexpected `any` types in PerformanceHistory** — added `RangeOption`, `HistoryDataPoint`, `TooltipProps`, and `TooltipEntry` interfaces; removed all `any` from component state, tooltip, and data processing; moved `fetchHistory` before its `useEffect` call; suppressed `react-hooks/exhaustive-deps` where dependencies are intentionally managed
- **CI: unescaped apostrophe in setup/page.tsx** — replaced `Let's` with `Let&apos;s` in JSX
- **CI: `catch (err: any)` in reset-password and forgot-password pages** — changed to `catch (err: unknown)` with proper `instanceof Error` guard
- **CI: unused `Radio` import in MachineCard.tsx** — removed the dead import

---

## [3.2.1] - 2026-02-21

### 🐛 Bug Fixes
- **Dashboard: avatar always blank on TopBar** — `setProfile(data)` stored the raw API wrapper `{ authenticated, user }` instead of the user object; fixed to `setProfile(data.user)` so `profile.avatar` resolves correctly for all users
- **Dashboard: broken avatar image on Profile Settings page** — replaced Next.js `<Image fill>` (incompatible with static export in some environments) with a plain `<img>` tag; added `onError` handler to clear the broken URL and show the gradient fallback icon instead of an invisible broken image overlapping page text
- **Portfolio: policy pages still referenced MIT License / open-source** — all four policy pages (Terms of Use, Privacy Policy, Home hero, Contact FAQ) updated to use SysTracker Proprietary License language
- **Wiki: stale version references and broken sidebar links** — Home.md (`v3.1.7` → `v3.2.1`), START-HERE.md (`v3.1.2` → `v3.2.1`), and _Sidebar.md (removed dead links to non-existent pages)

### 📚 Documentation
- **README.md** — Full rewrite for v3.2.x: updated features list, architecture diagram, one-liner install command (`irm https://systracker.rico.bd/install | iex`), Docker Compose snippet, development build steps, proprietary license section

---

## [3.2.0] - 2026-02-21

### ✨ Improvements
- **Portfolio: shared SiteFooter with RedwanCodes hover logo** — all 7 portfolio pages now use a single `SiteFooter` component; the RedwanCodes brand logo (2.svg ↔ 1.svg cross-fade) appears on the right side of every footer
- **Portfolio: Proprietary License branding** — footer copyright text and the Source Code resource card updated from "MIT License"/"Open Source" to "Proprietary License" across the entire site
- **Verified GPG tag** — re-released as v3.2.0 so the tag carries the GitHub Verified badge (GPG key `A1473276C90DACC3` was registered on GitHub after v3.1.9 was pushed)
- **CI cleanup** — `release-automation.yml` push trigger removed; workflow now only runs on manual dispatch, eliminating spurious skipped-job runs on every commit to main

---

## [3.1.9] - 2026-02-21

### 🔒 Legal / Licensing
- **License changed from MIT to SysTracker Proprietary License** — personal / non-commercial use only; commercial use, redistribution, and SaaS hosting require written permission from the author (RedwanCodes)
- Copyright header updated to **SysTracker / RedwanCodes** across all files (NSIS installers, tray launcher, package metadata)

### 🐛 Bug Fixes
- **Server crash on first run after install** — NSIS installer now creates `data\`, `logs\`, and `uploads\` directories and grants `Users:(OI)(CI)F` full-control ACL while running as administrator, so the `pkg`-bundled server process can write files without elevation
- **Agent installer arrow encoding** — Fixed `â†'` corruption in "API Key (from SysTracker Dashboard → Settings)" label; replaced Unicode arrow (`→`) with plain ASCII `->` which NSIS encodes reliably across all code pages

### ✨ Improvements
- **Interactive installer menu (MAS-style)** — `Install-SysTracker.ps1` completely rewritten with a full TUI menu:
  - `[1]` Install Server, `[2]` Install Agent, `[3]` Install Both
  - `[4]` Uninstall Server, `[5]` Uninstall Agent
  - `[6]` Check for Updates (compares installed vs latest GitHub release)
  - `[7]` Open Dashboard (reads port from registry, launches browser)
  - `[8]` Help / Documentation
  - `[0]` Exit
  - Non-interactive / scripted mode preserved: `-Component`, `-Action`, `-Tag`, `-Unattended` parameters bypass the menu
  - `irm https://systracker.rico.bd/install | iex` still works and launches the interactive menu

---

## [3.1.8] - 2026-02-21

### Fixed
- **CI: `build-server-release`** — Dual Node.js strategy: Node 20 for dashboard/agent (Next.js 16 requires `>=20.9.0`), switches to Node 18 before server `npm install` so sqlite3 uses prebuilt NAPI binaries instead of falling back to `node-gyp` / Windows SDK compilation
- **CI: `notify-release`** — Added `permissions: issues: write` to fix 403 "Resource not accessible by integration" error when creating release notification issue via `actions/github-script`

---

## [v3.1.7] - 2026-02-21

### ✨ New Features
- **Device removal** — Admin users can now delete a machine from the dashboard via the trash icon in `MachineDetails`. Cascades across all related tables (`metrics`, `events`, `logs`, `alerts`, `commands`); broadcasts `machine_removed` via WebSocket so all connected dashboards update instantly
- **Two-tier PKI for code signing** — `scripts/create-codesign-cert.ps1` generates a self-signed Root CA (`CN=SysTracker Root CA`) and issues a code-signing cert (`CN=SysTracker`) chained to it, enabling UAC to show "SysTracker" as publisher instead of "Unknown Publisher"

### 🔒 Security / SmartScreen Fixes
- **RFC 3161 timestamping** — CI now uses `signtool /tr http://timestamp.digicert.com /td sha256` (RFC 3161) instead of the deprecated `/t` (SHA-1). Ensures signatures remain valid after the signing cert expires
- **Mark-of-the-Web (MOTW) strip in installers** — Both NSIS installers now run `Unblock-File` on all EXEs in `$INSTDIR` at the end of installation, removing the Zone.Identifier ADS that triggers SmartScreen on downloaded files
- **`signtool /n "SysTracker"`** — CI code-signing step now matches the leaf cert Subject CN exactly
- **Two-factor cert chain trust** — CI installs both the leaf PFX and Root CA (`CODESIGN_CA_BASE64` secret) so `signtool verify /pa` passes without requiring a commercial root

### 🌐 Branding / URLs
- **Official website** set to `https://systracker.rico.bd/` across README, CI release notes, and install scripts
- **Canonical install command** is now `irm https://systracker.rico.bd/install | iex` — the portfolio site proxies to the GitHub release asset, keeping the public URL stable
- `Install-SysTracker.ps1` `.EXAMPLE` updated to use the official website URL


### 🐛 Bug Fixes
- **Profile card save no longer silently fails** — `handleProfileUpdate` now returns `Promise<boolean>`; ProfileCard reverts on failure and shows an error message
- **Profile card no longer reverts after panel reopen** — added `useEffect` in `page.tsx` to keep `selectedMachine` synced with the live `machines` array from socket events
- **Profile card local state no longer stale** — added `useEffect` in `ProfileCard.tsx` to sync from `machine.profile` prop when not actively editing
- **Profile card edit mode over-expanded the UI** — reduced avatar size, padding, input height, and button size in edit mode; tags hidden while editing

### ⚙️ CI / Build Fixes
- Fixed `test-and-validate.yml` "Server EXE not found" — corrected path from `server\systracker-server-win.exe` to `server\dist\systracker-server-win.exe`
- Fixed tray C# compile error (`CS1056: Unexpected character '$'`) — replaced legacy `csc.exe` (C# 5) with `dotnet publish` via new `SysTrackerTray.csproj` targeting `net48` with `LangVersion=9.0`
- Fixed `CS0579: Duplicate AssemblyAttribute` errors — added `<GenerateAssemblyInfo>false</GenerateAssemblyInfo>` to csproj
- Fixed `CS0234: System.Net.Http not found` in net48 — added explicit `<Reference Include="System.Net.Http" />`
- Fixed NSIS agent installer `can't open file agent\app.ico` — all paths in `agent/installer.nsi` are now script-relative (removed erroneous `agent\` prefix)

---

## [v3.1.5] - 2026-02-21

### 🐛 Bug Fixes
- Fixed TypeScript type error when constructing new `Machine` entries from partial socket payloads
- Ensured required `Machine` fields (`hostname`, `ip`, `os`) always have safe fallback values on socket `machine_update` events

### 🔧 Technical Improvements
- Resolved all 10 ESLint errors across dashboard pages:
  - Replaced `any` types with `unknown` + typed helper `getErrorMessage()`
  - Removed unused imports (`User`, `isAdmin`, `getUsername`, `Plus`)
  - Replaced `<img>` with Next.js `<Image />` for LCP optimization
  - Escaped unescaped JSX apostrophes
  - Fixed `useEffect` missing `router` dependency
  - Typed socket payload as `MachineUpdatePayload`
  - Typed alert priority options against `AlertPolicy['priority']`
- Fixed GitHub Actions `build-server-release` job: upgraded Node.js 18 → 20 (Next.js 16 requires ≥ 20.9.0)
- Removed inter-job artifact upload/download to prevent CI timeout failures; each job now rebuilds independently
- Fixed `publish-wiki.yml` YAML syntax errors and set git identity on runner to prevent "Author identity unknown" error
- Wiki automation now syncs `.wiki/**` changes to GitHub Wiki on every push to `main`

### 📚 Documentation
- Added `RELEASE_PROCESS.md` and `RELEASE_TEMPLATE.md` to `.github/`
- Updated feature documentation and implementation status pages

---

## [v3.1.1] - 2026-02-10

### 🐛 Bug Fixes
- Various stability fixes and CI/CD pipeline improvements
- Restored working publish workflow from v3.0.0 baseline

### 🔧 Technical Improvements
- Improved dashboard build reliability in GitHub Actions
- Enhanced error handling and debugging in workflow steps

---

## [v3.1.0] - 2026-02-01

### ✨ New Features
- GitHub Wiki integration with automated sync from `.wiki/` folder
- Release automation workflow (`release-automation.yml`)

### 🔧 Technical Improvements
- Refactored CI/CD workflows for reliability
- Added Docker publishing to GHCR (`ghcr.io/redwan002117/systracker`)

---

## [v3.0.0] - 2026-01-15

### ✨ New Features
- Complete architecture rewrite with Next.js 16 dashboard
- Real-time WebSocket metrics (CPU, RAM, Disk, Network)
- JWT authentication with role-based access control (Admin/Viewer)
- Alert system with configurable thresholds and email notifications
- Remote command execution (PowerShell/CMD)
- Agent auto-update mechanism with SHA256 verification
- PostgreSQL support alongside SQLite

### 🔧 Technical Improvements
- Node.js server with Socket.IO for real-time telemetry
- Python agent compiled to standalone Windows executable via PyInstaller
- Docker support with GHCR image publishing

---

## [v2.8.7] - 2025-12-20

### 🐛 Bug Fixes
- Various bug fixes and minor improvements

---

## [v2.8.5] - 2025-12-01

### 🐛 Bug Fixes
- Dashboard stability improvements
- Agent connection reliability fixes
