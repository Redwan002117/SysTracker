# Changelog

All notable changes to SysTracker are documented here.
This project follows [Semantic Versioning](https://semver.org/).

---

## [v3.1.6] - 2026-02-21

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
