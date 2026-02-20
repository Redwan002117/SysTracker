# Release Template for SysTracker

Use this template when creating new releases to ensure comprehensive release notes.

## Version: [vX.Y.Z] - YYYY-MM-DD

### 🎯 Release Type
- [ ] Major Release (X.0.0) - Breaking changes
- [ ] Minor Release (0.Y.0) - New features
- [ ] Patch Release (0.0.Z) - Bug fixes

---

## 🎉 What's New

### ✨ New Features
<!-- List new features added in this release -->
- **Feature Name**: Description of the feature and its benefits
- **Feature Name**: Description of the feature and its benefits

### 🎨 UI & UX Improvements
<!-- List improvements to the user interface and experience -->
- **Component/Screen**: What was improved and why
- **Component/Screen**: What was improved and why

### 🔧 Technical Improvements
<!-- List backend, performance, or infrastructure improvements -->
- **Area**: What was improved
- **Area**: What was improved

### 📚 Documentation
<!-- List documentation updates -->
- **Document**: What was added/updated
- **Document**: What was added/updated

### 🐛 Bug Fixes
<!-- List bugs fixed in this release -->
- Fixed [issue description]
- Fixed [issue description]

### 🔒 Security
<!-- List security improvements (if any) -->
- **Security Issue**: What was fixed
- **Security Issue**: What was fixed

### ⚠️ Breaking Changes
<!-- List any breaking changes (for major/minor releases) -->
- **Change**: What changed and migration steps
- **Change**: What changed and migration steps

---

## 📦 Installation

### Quick Start - Download Binaries
Download the pre-compiled binaries from the [Assets section below](#assets):

**Agent:**
- `SysTracker_Agent.exe` - Windows Service (Run as Administrator)

**Server:**
- Windows: `SysTracker_Server.exe`
- Linux: `SysTracker_Server`

### Docker Deployment
```bash
docker run -d \
  --name systracker \
  -p 7777:7777 \
  -v /DATA/systracker:/app/data \
  ghcr.io/redwan002117/systracker:vX.Y.Z
```

### From Source
```bash
git clone https://github.com/Redwan002117/SysTracker.git
cd SysTracker
git checkout vX.Y.Z

# Build dashboard
cd dashboard && npm install && npm run build

# Build server
cd ../server && npm install

# Build agent
cd ../agent
pip install -r requirements.txt
pyinstaller SysTracker_Agent.spec
```

---

## 🔍 System Requirements

### Server
- **OS**: Windows, Linux, macOS
- **Runtime**: Node.js 18+
- **Database**: SQLite (bundled) or PostgreSQL (optional)
- **Memory**: 512 MB minimum, 1 GB recommended

### Agent
- **OS**: Windows 7/Server 2008 or later
- **Runtime**: Python 3.8+ (pre-bundled in executable)
- **Permissions**: Administrator rights required for service installation

### Dashboard
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Resolution**: 1280x720 or higher recommended

---

## 📊 What's Tracked

✅ **Real-time Metrics** (updated every 3 seconds):
- CPU Usage (per-core breakdown)
- RAM Usage (total, used, available)
- Disk Space (all partitions)
- Network Interfaces (speed, status)

✅ **System Information**:
- Hardware specs (CPU model, RAM capacity, storage devices)
- OS details (version, build, serial number)
- Network configuration (IP addresses, MAC addresses)
- Running processes (top 10 by CPU/RAM)

✅ **Remote Management**:
- Execute PowerShell/CMD commands
- Schedule restarts and shutdowns
- View command execution history

✅ **Alerting**:
- Configurable thresholds (CPU, RAM, Disk)
- Email notifications via SMTP
- Real-time alert dashboard

---

## 🔒 Security Features

- 🔐 JWT-based authentication
- 🔑 API key protection for agent communication
- 👥 Role-based access control (Admin/Viewer)
- 🔒 Password hashing with bcrypt
- 🛡️ SQL injection prevention (parameterized queries)
- ✅ File upload validation
- 🔄 Secure agent update mechanism with SHA256 verification

---

## 📈 Performance

- **Telemetry Interval**: 3 seconds (configurable)
- **Dashboard Latency**: ~100-300ms end-to-end
- **Agent Resource Usage**: ~30 MB RAM, <1% CPU
- **Server Scaling**: Tested with 100+ concurrent agents

---

## 🐛 Known Issues

<!-- List any known issues or limitations -->
- Issue description and workaround (if any)
- Issue description and planned fix version

---

## 🔄 Upgrade Notes

<!-- Instructions for upgrading from previous versions -->

### From v2.8.x
1. Stop the server: `systemctl stop systracker` (Linux) or close the executable (Windows)
2. Backup your database: `cp server/data/systracker.db server/data/systracker.db.backup`
3. Replace the server executable with the new version
4. Start the server
5. Update agents through the dashboard (Settings > Deployment)

### From v2.7.x or earlier
[Special upgrade instructions if needed]

---

## 🙏 Contributors

<!-- Acknowledge contributors -->
This release includes contributions from:
- @username - Feature/fix description
- @username - Feature/fix description

Thank you to everyone who contributed! 🎉

---

## 📝 Changelog

Full changelog: https://github.com/Redwan002117/SysTracker/compare/vX.Y.Z-1...vX.Y.Z

**Release Date**: YYYY-MM-DD  
**Build Status**: ✅ Production Ready / ⚠️ Beta / 🚧 Alpha  
**License**: MIT

---

## 📞 Support

- **Documentation**: https://github.com/Redwan002117/SysTracker/wiki
- **Issues**: https://github.com/Redwan002117/SysTracker/issues
- **Discussions**: https://github.com/Redwan002117/SysTracker/discussions
