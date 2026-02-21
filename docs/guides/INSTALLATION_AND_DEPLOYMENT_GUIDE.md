# SysTracker Installation & Deployment Documentation

## Table of Contents

This document serves as the master index for all SysTracker installation and deployment documentation, organized by platform and use case.

### Quick Navigation

- **[Getting Started](#getting-started)**
- **[Platform Selection](#platform-selection)**
- **[Installation Guides](#installation-guides)**
- **[Validation & Testing](#validation--testing)**
- **[Troubleshooting](#troubleshooting)**
- **[Advanced Deployment](#advanced-deployment)**
- **[Migration & Upgrades](#migration--upgrades)**

---

## Getting Started

**First time deploying SysTracker?**

1. **Determine Your Platform:**
   - Windows PC/Server → Windows Standalone EXE
   - Ubuntu/Debian Server → Linux Native or Docker
   - macOS Development → macOS Standalone
   - Multi-platform Deployment → Docker Container

2. **Read the Comparison:**
   → [DEPLOYMENT_COMPARISON.md](DEPLOYMENT_COMPARISON.md)

3. **Follow the Quick Start:**
   → See "Installation Guides" section below

4. **Validate Installation:**
   → [INSTALLATION_VALIDATION_GUIDE.md](INSTALLATION_VALIDATION_GUIDE.md)

---

## Platform Selection

### Windows Deployment

**Recommended for:**
- Windows 10/11 professional environments
- Windows Server 2019+ data centers
- Mixed environments with existing Windows infrastructure

**Deployment Options:**

| Option | Type | Complexity | Setup Time | Best For |
|--------|------|-----------|-----------|----------|
| **[Standalone EXE](#windows-standalone-exe)** | Native App | Low | 10 mins | Single PC or small team |
| **[Windows Service](#windows-service)** | Background Service | Medium | 15 mins | Always-on deployment |
| **[Docker Container](#windows-docker)** | Containerized | Medium | 20 mins | Container infrastructure |
| **[Hyper-V VM](#windows-hyperv)** | Virtual Machine | High | 30 mins | Enterprise datacenter |

**Getting Started:** [WINDOWS_SERVER_QUICK_START.md](WINDOWS_SERVER_QUICK_START.md)

---

### Linux Deployment

**Recommended for:**
- Ubuntu 20.04 LTS+, Debian 11+
- CentOS/RHEL 8+
- Cloud-native deployments (AWS EC2, Azure, GCP)

**Deployment Options:**

| Option | Type | Complexity | Setup Time | Best For |
|--------|------|-----------|-----------|----------|
| **[Docker Container](#docker-container)** | Containerized | Low | 5 mins | Cloud/microservices |
| **[Standalone Service](#linux-standalone)** | npm/systemd | Medium | 15 mins | Development testing |
| **[Kubernetes Pod](#kubernetes)** | Container Orchestration | High | 30 mins | Enterprise k8s clusters |
| **[Docker Compose](#docker-compose)** | Multi-container | Medium | 10 mins | Local development |

**Getting Started:** [WINDOWS_IMPLEMENTATION_GUIDE.md](WINDOWS_IMPLEMENTATION_GUIDE.md) (architecture section applies to all platforms)

---

### macOS Deployment

**Recommended for:**
- macOS 10.15+ development environments
- Testing and staging on Apple hardware
- Mixed developer teams with Macs

**Deployment Options:**

| Option | Type | Complexity | Setup Time | Best For |
|--------|------|-----------|-----------|----------|
| **[launchd Service](#macos-launchd)** | Background Daemon | Medium | 15 mins | Always-on development |
| **[Docker Container](#docker-container)** | Containerized | Low | 10 mins | Docker-first development |
| **[Manual Node.js](#manual-nodejs)** | Direct execution | Low | 10 mins | Quick testing |

---

## Installation Guides

### Windows Standalone EXE

**File:** `systracker-server-win.exe` (49 MB, standalone)

**Prerequisites:**
- Windows 10 (v1909+), Windows 11, or Windows Server 2019+
- .NET Framework 4.5+ (for some system components)
- 500 MB disk space minimum

**Installation (5 steps):**

1. **Download EXE**
   ```
   Download: systracker-server-win.exe
   Size: 49 MB
   ```

2. **Run Installer (No installation needed - just run)**
   ```powershell
   .\systracker-server-win.exe
   # Dashboard opens at http://localhost:7777
   ```

3. **Configure (Optional)**
   Create `.env` file next to EXE:
   ```
   PORT=7777
   NODE_ENV=production
   JWT_SECRET=your-secret-key
   ```

4. **Setup Admin Account**
   - Navigate to http://localhost:7777
   - Click "Setup Wizard"
   - Create admin account

5. **Install as Service (Optional)**
   ```powershell
   Run PowerShell as Administrator
   .\install_windows_service.ps1
   ```

**Full Details:** [WINDOWS_SERVER_QUICK_START.md](WINDOWS_SERVER_QUICK_START.md)

---

### Windows Service Installation

**File:** `install_windows_service.ps1`

**Features:**
- Auto-start on system reboot
- Automatic restart on failure
- Windows Event Log integration
- Service management via Services.msc

**Installation Steps:**

1. **Open PowerShell as Administrator**

2. **Run Installation Script**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
   .\install_windows_service.ps1
   ```

3. **Service auto-starts**

4. **Verify Installation**
   ```powershell
   Get-Service systracker
   ```

**Management:** [WINDOWS_SERVER_DEPLOYMENT.md#service-management](WINDOWS_SERVER_DEPLOYMENT.md#service-management)

---

### Windows Docker Deployment

**Advantages:**
- Consistent across environments (dev→staging→production)
- Easy scaling and multi-instance deployment
- Isolated from system configuration

**Prerequisites:**
- Docker Desktop for Windows (installed + running)
- WSL 2 backend (Windows 10 2004+)
- 4GB+ RAM allocation to Docker

**Installation (3 steps):**

1. **Windows Containers Mode**
   ```powershell
   # Docker Dashboard → Settings → Containers
   # Switch to Windows Containers
   ```

2. **Build or Pull Image**
   ```powershell
   docker-compose -f docker-compose.windows.yml up -d
   ```

3. **Access Dashboard**
   ```
   http://localhost:7777
   ```

**Full Details:** [WINDOWS_DOCKER_SETUP.md](WINDOWS_DOCKER_SETUP.md)

---

### Linux Docker Deployment

**Advantages:**
- Minimal system requirements (just Docker)
- Cloud-ready (AWS, Azure, GCP native support)
- Easy updates and rollbacks

**Prerequisites:**
- Docker 20.10+ installed
- Docker Compose 1.29+ (optional but recommended)
- 2GB+ RAM available

**Installation (2 commands):**

```bash
# Pull and run
docker run -d \
  --name systracker \
  -p 7777:7777 \
  -v systracker-data:/app/data \
  -v systracker-logs:/app/logs \
  ghcr.io/your-org/systracker:latest

# Or use Docker Compose
docker-compose up -d
```

**Full Details:** [WINDOWS_DOCKER_SETUP.md#linux-installation](WINDOWS_DOCKER_SETUP.md#linux-installation)

---

### Linux Native Installation

**Prerequisites:**
- Node.js 18.x (or nvm)
- npm 10+
- SQLite3
- ~500MB disk space

**Installation (5 steps):**

```bash
# 1. Clone repository
git clone https://github.com/your-org/SysTracker.git
cd SysTracker/server

# 2. Install dependencies
npm install

# 3. Create configuration
cp .env.example .env
# Edit .env with your settings

# 4. Initialize database
npm run migrate

# 5. Start service
npm start
# Or use PM2 for production:
# pm2 start server.js --name systracker
```

**systemd Integration (Auto-start):**

Create `/etc/systemd/system/systracker.service`:
```ini
[Unit]
Description=SysTracker Server
After=network.target

[Service]
Type=simple
User=systracker
WorkingDirectory=/opt/systracker
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable systracker
sudo systemctl start systracker
```

---

### macOS launchd Service

**Prerequisites:**
- Node.js 18.x (via nvm or Homebrew)
- npm 10+
- ~500MB disk space

**Installation (5 steps):**

1. **Install dependencies**
   ```bash
   brew install node  # or use nvm
   npm install -g pm2
   ```

2. **Clone and setup**
   ```bash
   git clone <repo>
   cd SysTracker/server
   npm install
   cp .env.example .env
   ```

3. **Create launchd plist**
   Create `~/Library/LaunchAgents/com.systracker.plist`:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
       <key>Label</key>
       <string>com.systracker</string>
       <key>ProgramArguments</key>
       <array>
           <string>node</string>
           <string>/path/to/server.js</string>
       </array>
       <key>RunAtLoad</key>
       <true/>
       <key>KeepAlive</key>
       <true/>
       <key>StandardOutPath</key>
       <string>/var/log/systracker.log</string>
       <key>StandardErrorPath</key>
       <string>/var/log/systracker.log</string>
   </dict>
   </plist>
   ```

4. **Load service**
   ```bash
   launchctl load ~/Library/LaunchAgents/com.systracker.plist
   ```

5. **Verify**
   ```bash
   launchctl list | grep systracker
   ```

---

## Validation & Testing

### Post-Installation Validation

**Run appropriate validation script:**

**Windows:**
```powershell
.\validate_windows_install.ps1
```

**Linux/macOS:**
```bash
./validate_linux_install.sh  # or validate_macos_install.sh
```

**Auto-detect platform:**
```bash
./validate_install.sh
```

**Full Guide:** [INSTALLATION_VALIDATION_GUIDE.md](INSTALLATION_VALIDATION_GUIDE.md)

---

### Health Check Tests

**Test Dashboard Access:**
```bash
curl -i http://localhost:7777
# Should return HTTP 200
```

**Test API Health:**
```bash
curl -i http://localhost:7777/api/auth/status
# Should return HTTP 200
```

**Test with Agent:**
```bash
# On agent machine:
./agent/install_agent.ps1 -ServerURL http://your-server:7777
# On server: Check agent appears in dashboard within 30s
```

---

## Troubleshooting

### Port Already in Use

**Windows:**
```powershell
# Find what's using port 7777
netstat -ano | findstr :7777

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Or use different port in .env
PORT=8080
```

**Linux/macOS:**
```bash
# Find process using port
lsof -i :7777

# Kill it
kill -9 <PID>
```

---

### Service Not Starting

**Windows:**
```powershell
# Check service status
Get-Service systracker

# View error logs
Get-EventLog -LogName System -Source "systracker" | Sort-Object TimeGenerated -Descending | Select-Object -First 10

# Restart service
Restart-Service systracker
```

**Linux:**
```bash
# Check status
systemctl status systracker

# View logs
journalctl -u systracker -n 50 -f

# Restart
systemctl restart systracker
```

**macOS:**
```bash
# Check logs
log show --predicate 'process contains "systracker"' --last 1h

# Unload and reload
launchctl unload ~/Library/LaunchAgents/com.systracker.plist
launchctl load ~/Library/LaunchAgents/com.systracker.plist
```

---

### Database Connection Issues

**Ensure data directory is writable:**

**Windows:**
```powershell
# Check permissions
icacls "C:\Program Files\SysTracker Server\data"

# Grant permissions if needed
icacls "C:\Program Files\SysTracker Server\data" /grant Users:F
```

**Linux/macOS:**
```bash
# Check permissions
ls -la /path/to/data

# Fix if needed
chmod 755 /path/to/data
```

---

### Memory or CPU High

**Monitor resource usage:**

**Windows:**
```powershell
# Real-time monitoring
Get-Process systracker-server-win | Select-Object -Property Name,CPU,Memory
```

**Linux:**
```bash
ps aux | grep server.js
top -p $(pgrep -f server.js)
```

**macOS:**
```bash
top -p $(pgrep -f server)
```

---

## Advanced Deployment

### Multiple Instances

**Windows (Services):**
```powershell
# Instance 1 (Port 7777)
.\install_windows_service.ps1 -ServiceName systracker-1 -Port 7777

# Instance 2 (Port 7778)
.\install_windows_service.ps1 -ServiceName systracker-2 -Port 7778
```

---

### Load Balancing

**Docker Swarm:**
```bash
# Initialize swarm
docker swarm init

# Deploy service
docker service create \
  --name systracker \
  --publish 7777:7777 \
  --replicas 3 \
  ghcr.io/your-org/systracker:latest
```

**Kubernetes:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: systracker
spec:
  replicas: 3
  selector:
    matchLabels:
      app: systracker
  template:
    metadata:
      labels:
        app: systracker
    spec:
      containers:
      - name: systracker
        image: ghcr.io/your-org/systracker:latest
        ports:
        - containerPort: 7777
```

---

### SSL/TLS Configuration

**Windows:**
```powershell
# Update .env
HTTPS_ENABLED=true
SSL_CERT_PATH=C:\Certs\cert.pem
SSL_KEY_PATH=C:\Certs\key.pem
```

**Linux/macOS:**
```bash
# Update .env
HTTPS_ENABLED=true
SSL_CERT_PATH=/etc/systracker/cert.pem
SSL_KEY_PATH=/etc/systracker/key.pem
```

---

## Migration & Upgrades

### Upgrading from v3.1.1 to v3.1.2

**Windows Standalone:**
1. Stop current version: `net stop systracker` or stop via Services.msc
2. Backup data: `Copy-Item -Path data -Destination data.backup -Recurse`
3. Download new EXE: `systracker-server-win.exe`
4. Run new version
5. Service auto-restarts or manually restart

**Linux/Docker:**
```bash
# Backup database
cp data/systracker.db data/systracker.db.backup

# Pull latest image
docker-compose pull

# Restart service
docker-compose restart

# Or for native:
git pull origin main
npm install
npm run migrate
systemctl restart systracker
```

**Full Upgrade Guide:** [UPGRADE_GUIDE_v3.1.2.md](UPGRADE_GUIDE_v3.1.2.md) (if available)

---

## Related Documentation

### Core Guides
- [WINDOWS_IMPLEMENTATION_GUIDE.md](WINDOWS_IMPLEMENTATION_GUIDE.md) - Architecture & technical overview
- [WINDOWS_SERVER_DEPLOYMENT.md](WINDOWS_SERVER_DEPLOYMENT.md) - Comprehensive Windows deployment reference (40KB)
- [WINDOWS_SERVER_QUICK_START.md](WINDOWS_SERVER_QUICK_START.md) - 5-minute quick start
- [WINDOWS_DOCKER_SETUP.md](WINDOWS_DOCKER_SETUP.md) - Docker containerization guide
- [DEPLOYMENT_COMPARISON.md](DEPLOYMENT_COMPARISON.md) - Platform comparison matrix

### Supporting Documents
- [INSTALLATION_VALIDATION_GUIDE.md](INSTALLATION_VALIDATION_GUIDE.md) - Post-installation testing
- [WINDOWS_SETUP_CHECKLIST.md](WINDOWS_SETUP_CHECKLIST.md) - Step-by-step verification
- [RELEASE_NOTES_v3.1.2.md](RELEASE_NOTES_v3.1.2.md) - Version changes and features

### Scripts & Tools
- `validate_windows_install.ps1` - Windows 14-point validation (PowerShell)
- `validate_linux_install.sh` - Linux 14-point validation (bash)
- `validate_macos_install.sh` - macOS 17-point validation (bash)
- `validate_install.sh` - Cross-platform auto-detector (bash)
- `install_windows_service.ps1` - Windows Service installation (PowerShell)
- `manage_service.ps1` - Windows Service management (PowerShell)
- `build_windows.bat` - Windows build automation (batch)

---

## Quick Reference

### Default Ports & Credentials

| Item | Default | Change In |
|------|---------|-----------|
| **Web Port** | 7777 | `.env` → `PORT` |
| **Admin Email** | Created at setup | Dashboard settings |
| **API Key** | Generated at setup | Dashboard settings |
| **Database** | `./data/systracker.db` | `.env` → `DB_PATH` |

### File Locations

| Platform | Location | Notes |
|----------|----------|-------|
| **Windows EXE** | `C:\Program Files\SysTracker Server\` | Default NSSM install path |
| **Windows Portable** | Any directory | No installation needed |
| **Linux** | `/opt/systracker/` | Recommended systemd path |
| **macOS** | `~/systracker/` or `/Applications/` | User or system location |
| **Docker** | `/app/` | Inside container |

### Support Matrix

| Platform | Official Support | Version | Status |
|----------|---|---|---|
| **Windows 10** | ✓ | v3.1.2 | Fully supported |
| **Windows 11** | ✓ | v3.1.2 | Fully supported |
| **Windows Server 2019** | ✓ | v3.1.2 | Fully supported |
| **Windows Server 2022** | ✓ | v3.1.2 | Fully supported |
| **Ubuntu 20.04 LTS** | ✓ | v3.1.2 | Fully supported |
| **Ubuntu 22.04 LTS** | ✓ | v3.1.2 | Fully supported |
| **Debian 11** | ✓ | v3.1.2 | Fully supported |
| **macOS 11+** | ✓ | v3.1.2 | Fully supported |
| **Docker** | ✓ | v3.1.2 | Fully supported |

---

## Getting Help

**Common Issues:**
1. Check [INSTALLATION_VALIDATION_GUIDE.md](INSTALLATION_VALIDATION_GUIDE.md#troubleshooting)
2. Run appropriate validation script
3. Check logs in dashboard or log files

**Still need help?**
- Check [WINDOWS_SERVER_DEPLOYMENT.md](WINDOWS_SERVER_DEPLOYMENT.md#troubleshooting)
- Review [RELEASE_NOTES_v3.1.2.md](RELEASE_NOTES_v3.1.2.md) for known issues
- Search existing documentation

---

**Last Updated:** 2025  
**Version:** 3.1.2  
**Documentation Status:** Complete
