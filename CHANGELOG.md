# Changelog

All notable changes to SysTracker are documented here.
This project follows [Semantic Versioning](https://semver.org/).

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
