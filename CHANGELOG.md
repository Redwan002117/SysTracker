# SysTracker Changelog

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
