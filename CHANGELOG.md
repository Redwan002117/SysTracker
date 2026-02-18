# SysTracker Changelog

## [v1.1.10] - 2026-02-18
### Added
- **Smart Update Script**: Added `update_app.sh` for one-click updates with health checks and rollback safety.

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
