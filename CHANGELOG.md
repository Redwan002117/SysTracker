# SysTracker Changelog

## [v3.0.0] - 2026-02-20
### 🎯 Major Release - Dashboard Stability & Data Integrity

### 🐛 Critical Bug Fixes
- **Device Metrics Display**: Fixed metrics not rendering properly with null coalescing and default values
- **Hardware Specs Missing**: Added fallback UI states for missing hardware information with indicators for data waiting
- **Storage Information**: Enhanced physical drive detection and brand/model display
- **Profile Card Resizing**: Fixed CSS overflow issues when editing profile - card now maintains consistent size (minHeight: 520px)
- **Hot Processes Table**: 
  - Fixed incorrect process data by implementing proper validation
  - Corrected CPU/RAM percentage calculations (now clamped to 0-100%)
  - Improved sorting algorithm for better accuracy
  - Limited display to top 50 processes to prevent UI bloat
- **Terminal Freezing**: 
  - Implemented 30-second command execution timeout with AbortController
  - Added command state management to prevent concurrent execution
  - Fixed Socket.IO connection lifecycle
  - Added error boundaries for large output

### 🔧 Technical Improvements
- **Data Validation**: Created `dataValidation.js` module with comprehensive data sanitization
  - `validateProcessData()` - Ensures CPU%, RAM%, and process names are correct
  - `validateHardwareInfo()` - Validates hardware structure and truncates long strings
  - `validateDiskDetails()` - Clamps disk percentages to 0-100%
  
- **Error Logging**: Implemented `errorLogger.js` with PID-based structured logging
  - Logs all errors with timestamp, PID, and detailed stack traces
  - Writes to both console and daily log files
  - Global error handlers for uncaught exceptions and unhandled rejections
  - Tracks process uptime and memory usage

- **Component Robustness**:
  - Enhanced null checks in `MachineDetails.tsx`
  - Added fallback values for missing hardware fields
  - Fixed `TerminalTab.tsx` timeout handling
  - Improved `ProfileCard.tsx` size stability

### 📚 Documentation  
- Added `BUG_FIXES_v3.0.0.md` with comprehensive issue tracking
- Added `errorLogger.js` for production error diagnostics
- Added `dataValidation.js` for data integrity

### ✨ UX Enhancements
- Loading states for hardware data with explanatory text
- Better error messages in terminal execution
- Improved visual feedback for data constraints

### 🔒 Security & Performance
- Input validation prevents malformed data from breaking UI
- Process list limited to 50 items for performance
- Hardware storage limited to 16 drives/interfaces/GPUs
- String length limits prevent database overflow issues

### 🎯 Testing Improvements
- All components now handle missing/null data gracefully
- Process data is now validated before display
- Terminal commands have execution safeguards
- Error logging provides debugging information with PID context

### 🚀 Deployment
- All fixes tested across 5+ concurrent agent connections
- Dashboard performance optimized for large process lists
- Server error handling improved with structured logging
- Ready for production deployment with enterprise monitoring

---

## [v2.8.7] - 2026-02-20
### 🐛 Critical Bug Fixes
- **Agent Executable**: Fixed `ModuleNotFoundError: No module named 'socketio'` by correcting the dependency from deprecated `socketio-client` to `python-socketio` in the build pipeline
- **PyInstaller Spec**: Enhanced hidden imports to include allSocketIO, EngineIO, and WebSocket sub-modules to ensure proper bundling
- **Build Dependencies**: Added comprehensive `requirements.txt` for the agent with pinned versions for reliability

### 🔧 Technical Improvements
- **Build Process**: Updated GitHub Actions to use `requirements.txt` for consistent dependency installation
- **Module Bundling**: Added 25+ hidden imports to PyInstaller spec file to prevent runtime import errors

## [v2.8.6] - 2026-02-20
### 🎨 UI & UX Improvements
- **Dashboard Components**: Enhanced MachineCard, TopBar, and Settings page layouts for better usability
- **Visual Polish**: Improved spacing, typography, and component density across the dashboard
- **User Management**: Refined user management interface with better role indicators

### 🔧 Technical Improvements
- **Agent Telemetry**: Improved data collection and submission reliability with better error handling
- **Authentication**: Enhanced API request handling and token management for smoother user experience
- **Dependencies**: Updated packages for improved security and stability
- **Build Process**: Streamlined build artifacts and deployment configurations

### 📚 Documentation
- **BUILD_COMPLETE.md**: Added comprehensive build status documentation
- **BUILD_REPORT.md**: Added detailed component-by-component analysis
- **DETAILED_CODE_REVIEW.md**: Added architecture insights and code quality metrics
- **COMPREHENSIVE_ANALYSIS.md**: Added recommendations and system analysis
- **BUILD_INSTRUCTIONS.md**: Updated build instructions for all components

### 🐛 Bug Fixes
- Fixed various edge cases in dashboard component rendering
- Improved error handling in agent-server communication
- Enhanced API request validation and error responses
- Resolved authentication token refresh issues

## [v2.8.5] - 2026-02-20
### 🐛 Bug Fixes
- **Dashboard Timezones**: Enforced strict `UTC` formatting for all timestamps (`last_seen`, `uptime`, `TerminalTab`, `SystemLoadChart`, `PerformanceHistory`) to ensure universal consistency across global client devices.

### 🚀 Build & Release
- **GitHub Actions**: Added the `main` branch to the publish workflow trigger to automatically build releases on main pushes.

## [v2.8.4] - 2026-02-20
### ✨ Features
- **Physical Disk Telemetry**: The Windows Agent now uses `wmic diskdrive` (with a robust PowerShell `Get-PhysicalDisk` fallback) to collect physical drive specifications including Brand/Model, Serial Number, and physical Capacity.

### 🎨 UI & UX Improvements
- **Storage UI**: Overhauled the Storage section in the Machine Details drawer to explicitly list bare-metal Physical Drives alongside the existing Logical Volumes.

## [v2.8.3] - 2026-02-20
### 🐛 Bug Fixes
- **Live Streaming**: Fixed a critical `mappedMetrics` mapping error in `server.js` where realtime `cpu` and `ram` Socket.IO events were broadcasting undefined values, preventing the React Dashboard UI from updating live.

## [v2.8.2] - 2026-02-20
### 🐛 Bug Fixes
- **Agent Executable Bundle**: Solved `ModuleNotFoundError: No module named 'socketio'` by forcing PyInstaller to bundle hidden Socket.IO, Engine.IO, and win32 dependencies via a custom `.spec` file.
- **Installer File Locks**: Fixed `WinError 32` (File in use) during agent installation by implementing a forced `taskkill` loop to terminate old instances before overwriting.

### 🎨 UI & UX Improvements
- **Dashboard Density**: Significantly compacted the main Dashboard layout, `MachineCard` components, fonts, margins, and padding to fit much more telemetry on screen simultaneously.

## [v2.8.1] - 2026-02-20
### 🎨 UI & UX Improvements
- **UI Polish**: Minor visual polishing applied to TopBar, Padding, and ProfileCard structures for a cleaner modern aesthetic.

## [v2.8.0] - 2026-02-20
### 🚀 Major Release
- **Platform Foundation**: Released the SysTracker v2.8.x architecture baseline with enhanced process tracking and monitoring hooks.
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
