# SysTracker Changelog

## [v2.6.2] - 2026-02-19
### 🐛 Bug Fixes
- **CI/CD**: Fixed typo in GitHub Actions where the Linux build target was incorrectly specified as `node18-linux-64` instead of `node18-linux-x64`.

## [v2.6.1] - 2026-02-19
### 🐛 Bug Fixes
- **Docker**: Resolved critical `MODULE_NOT_FOUND` error for `./emailTemplates` by updating the Dockerfile to correctly copy required assets.
- **CI/CD**: Overhauled `publish.yml` to perfectly synchronize GitHub Release builds with validated local standalone build methods.

## [v2.6.0] - 2026-02-19
### 🚀 Speed & Performance
- **3s Telemetry**: Reduced telemetry interval from 60s to **3s** for near-instant dashboard feedback.
- **Socket Latency**: Optimized server event loop to emit dashboard updates *before* database writes.
- **Non-blocking Agent**: Replaced blocking `psutil.cpu_percent` with a background priming thread, ensuring the agent loop never stalls.
- **Payload Optimization**: Reduced network bandwidth usage by ~90% by batching `hardware_info` updates to once per 5 minutes.

### 📦 All-in-One Standalone Architecture
- **Unified Binary**: `SysTracker_Server.exe` now bundles the entire Web Dashboard and the Agent installer inside the binary.
- **Zero-Dependency Deploy**: No more managing external static asset folders; the server is a single, portable file.
- **Dual-Path Resolution**: Implemented `BASE_DIR` vs `ASSETS_DIR` logic to allow the server to run from read-only locations (like pkg snapshots) while safely persisting data to disk.

### ✨ UI/UX & Quality of Life
- **Deployment & Downloads**: Added a dedicated tab in Settings to download the pre-configured Agent EXE directly from the dashboard.
- **Auth Stability**: Fixed hard-to-track 401/403 errors during nickname updates and session refreshes.
- **Email Overhaul**: New professional Pro-Max HTML notification templates.
- **Scaling Fix**: Resolved "Giant UI" layout issues on smaller screens.

## [v2.5.5] - 2026-02-19

### 🔄 Agent-Server Interconnection
- **Agent Resilience**: Added robust retry logic with exponential backoff (up to 3 retries) for telemetry submission.
- **Offline Detection**: Implemented a server-side background job to automatically mark machines as `offline` if no telemetry is received for 5 minutes.
- **Improved Logging**: Agent now logs specific authentication errors (401/403) and connection failures more clearly.

### 📦 Build & Release
- **Versioning**: Bumped all components (Agent, Server, Dashboard) to v2.5.5.
- **Standalone Agent**: Confirmed `SysTracker_Agent.exe` is a standalone ~18MB binary requiring no external dependencies.

## [v2.5.4] - 2026-02-19

### 🐛 Bug Fixes
- **Server — Setup Wizard**: Fixed critical bug where `/api/setup` was nested inside the `/api/telemetry` callback and was therefore never reachable as an Express route. Fresh installs and containers with no admin users now correctly redirect to `/setup` and the account creation form actually works.
- **Server — Authentication**: Removed `ADMIN_USER` / `ADMIN_PASSWORD` environment variable bypass that silently created a hardcoded admin account on startup, bypassing the setup wizard entirely.

### ✨ New Features
- **Server — First-Run Wizard**: On a fresh install with no admin users, visiting the app now redirects to `/setup` where you choose your own username, email, and password. The `/setup` route is blocked (403) once any admin user exists.
- **Portfolio — Releases Hub (`/download`)**: Redesigned as a full Releases Hub:
  - Sidebar limited to the **latest 10 releases** with a "View all" link to GitHub for older versions.
  - **Source code downloads** (`.zip` and `.tar.gz`) always shown via GitHub's `zipball_url` / `tarball_url`.
  - **Commit-based changelog fallback** — when a release has no notes, commits between that tag and the previous one are fetched and parsed using conventional commit prefixes (`feat:`, `fix:`, `perf:`, `refactor:`, `chore:`, etc.) into colour-coded sections.
  - **Total downloads** stat now counts across all fetched releases (not just the displayed 10) and always shows the real number.
  - Pre-releases are now labelled **Beta** in the sidebar.

### 🔧 Improvements
- **docker-compose.yml**: Removed hardcoded `ADMIN_USER` and `ADMIN_PASSWORD` env vars — credentials are now set only through the first-run wizard.
- **Portfolio — Root Page**: Landing page moved to `/` (was previously a redirect to `/download`). The Releases Hub is now a standalone dedicated page.
- **Portfolio — Navbar**: Logo links to `/`; mobile hamburger menu added.

### 📝 Documentation
- Server console now prints `SETUP REQUIRED: Visit /setup in your browser` instead of exposing a raw token.

## [v1.1.16] - 2026-02-18
### Changed
- **Branding**: Updated README banner to `banner.svg`.
### Fixed
- **Server**: Fixed critical startup crash caused by duplicate variable declaration in `v1.1.15`.

## [v1.1.15] - 2026-02-18
### Fixed
- **Server**: add duplicate `dbPath` check (Hotfix).

## [v1.1.14] - 2026-02-18
### Added
- **Debug**: Added `/api/debug/config` endpoint.

## [v1.1.9] - 2026-02-18
### Fixed
- **Core Data Persistence**: Moved database to `/app/data/systracker.db` to fix volume mapping issues in CasaOS.
- **Documentation**: Updated Web UI and Cloudflare instructions.

## [v1.1.8] - 2026-02-18
### Added
- **Tunnel Compose**: Added `docker-compose-tunnel.yml` for integrated Cloudflare tunneling (Deprecated in v1.1.9).
- **Docs**: Refined Cloudflare IP instructions.

## [v1.1.7] - 2026-02-18
### Fixed
- **Docs**: Addressed Cloudflare "502 Bad Gateway" issue.

## [v1.1.6] - 2026-02-18
### Fixed
- **Docker Compose**: Switched from `build: .` to `image: ghcr.io...` for easier deployment.

## [v1.1.5] - 2026-02-18
### Docs
- **SmartScreen**: Added warning bypass instructions.
- **CasaOS**: Added explicit field guide.

## [v1.1.4] - 2026-02-18
### UI
- **Branding**: Added SVG Logo and Banner.
- **Favicon**: Added Dashboard favicon.

## [v1.1.3] - 2026-02-18
### UI
- **Logo**: Added initial PNG logo.
### Fixes
- **CI**: Fixed Docker metadata tag issue.

## [v1.1.0] - 2026-02-18
### Release
- **Universal**: Initial consolidated release structure.
