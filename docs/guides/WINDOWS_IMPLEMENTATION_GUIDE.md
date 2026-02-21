# 🪟 Windows Server Implementation Guide

**Complete Reference for Running SysTracker on Windows PCs**

---

## 📚 Documentation Overview

This guide covers implementing SysTracker Server as a **standalone Windows EXE application** that runs as a Windows Service.

### 📄 Documents in This Guide

| Document | Purpose | Time | Audience |
|----------|---------|------|----------|
| **[Quick Start](WINDOWS_SERVER_QUICK_START.md)** | One-page cheat sheet | 5 min | Everyone |
| **[Full Deployment Guide](WINDOWS_SERVER_DEPLOYMENT.md)** | Complete setup & admin guide | 30 min | Administrators |
| **[Setup Checklist](WINDOWS_SETUP_CHECKLIST.md)** | Step-by-step verification | 20 min | Technical staff |
| **[Deployment Comparison](DEPLOYMENT_COMPARISON.md)** | Windows vs Ubuntu analysis | 15 min | Decision makers |
| **[This Document]** | Overview & index | 5 min | All |

---

## 🎯 What You'll Get

After completing this guide, you'll have:

✅ **Production-Ready Server** running on your Windows PC  
✅ **Auto-Starting Service** that survives reboots  
✅ **Secure Dashboard** accessible at `http://localhost:7777`  
✅ **Agent Management** to download and deploy agents  
✅ **Real-Time Metrics** from Windows machines  
✅ **Email Alerts** for critical events (optional)  
✅ **User Management** with admin/viewer roles  
✅ **Complete Backup** strategy  

---

## 🚀 Quick Start (5 Minutes)

### Fastest Path to Deployment

1. **Get NSSM** (required for Windows Service)
   ```
   Download: https://nssm.cc/download
   Extract to: C:\nssm
   ```

2. **Get SysTracker Server EXE**
   ```
   Option A: Download from GitHub
   https://github.com/Redwan002117/SysTracker/releases
   
   Option B: Build yourself
   cd server && npm run build:win
   ```

3. **Run Installation** (PowerShell as Admin)
   ```powershell
   powershell -ExecutionPolicy Bypass -File install_windows_service.ps1
   ```

4. **Open Dashboard**
   ```
   http://localhost:7777
   → Setup → Create admin account
   ```

5. **Download & Deploy Agent**
   ```
   Dashboard → Settings → Agent Management → Download
   Run on machines you want to monitor
   ```

**That's it!** Service auto-starts on reboot.

---

## 📁 File Reference

| File | Location | Purpose |
|------|----------|---------|
| `systracker-server-win.exe` | Your Downloads | Main application |
| `install_windows_service.ps1` | `/server` folder | Installation script |
| `manage_service.ps1` | `/server` folder | Service management tool |
| `build_windows.bat` | `/server` folder | Build script (optional) |
| `.env` | `C:\Program Files\SysTracker Server\` | Configuration (edit after install) |
| `systracker.db` | `C:\Program Files\SysTracker Server\data\` | SQLite database |
| `service.log` | `C:\Program Files\SysTracker Server\logs\` | Application output |

---

## 🔧 Scripts Provided

### 1️⃣ Installation Script
**File:** `server/install_windows_service.ps1`

Automates everything:
- Finds the EXE
- Creates directories
- Configures NSSM service
- Sets auto-start
- Creates `.env` file
- Starts service

**Usage:**
```powershell
powershell -ExecutionPolicy Bypass -File install_windows_service.ps1 -InstallDir "D:\SysTracker" -Port 8080
```

### 2️⃣ Management Script  
**File:** `server/manage_service.ps1`

Service operations:
- `manage_service.ps1 -Action status` → service info
- `manage_service.ps1 -Action start` → start service
- `manage_service.ps1 -Action stop` → stop service
- `manage_service.ps1 -Action restart` → restart
- `manage_service.ps1 -Action logs -Lines 50` → view logs
- `manage_service.ps1 -Action uninstall` → remove

**Usage:**
```powershell
.\manage_service.ps1 -Action restart
```

### 3️⃣ Build Script
**File:** `server/build_windows.bat`

Creates Windows EXE from source:
- Builds dashboard
- Compiles with pkg
- Creates `systracker-server-win.exe`

**Usage:**
```batch
cd server
build_windows.bat
```

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────┐
│           Your Windows PC (Windows 11)           │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  Windows Service: SysTracker              │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  SysTracker_Server.exe              │  │  │
│  │  ├─────────────────────────────────────┤  │  │
│  │  │  Port: 7777                         │  │  │
│  │  │  Status: Auto-start (Running)       │  │  │
│  │  │  Memory: ~100-200 MB                │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  │                                            │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  Dashboard (http://localhost:7777)  │  │  │
│  │  │  ├─ Real-time metrics              │  │  │
│  │  │  ├─ User management                │  │  │
│  │  │  ├─ Alert policies                 │  │  │
│  │  │  └─ Settings & config              │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  │                                            │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  Data Storage                       │  │  │
│  │  │  ├─ systracker.db (SQLite)          │  │  │
│  │  │  ├─ jwt.secret (encryption)         │  │  │
│  │  │  └─ agent_releases/                 │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
│                    ▲                             │
│                    │ HTTP/REST API              │
│                    │ WebSocket/Socket.IO        │
│                    │                             │
└────────────────────┼─────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
    ┌───▼───┐    ┌───▼───┐    ┌──▼───┐
    │Agent 1│    │Agent 2│    │Agent N│
    │ PC-A  │    │ PC-B  │    │ PC-C │
    │ Win11 │    │Win10  │    │Server│
    └───────┘    └───────┘    └──────┘
    (Reports every 3 seconds via REST API)
```

---

## 📋 Requirements Checklist

Before you start, ensure you have:

- [ ] Windows 10, 11, or Server 2019+
- [ ] Administrator access
- [ ] 2 GB RAM free (4 GB recommended)
- [ ] 500 MB disk space free
- [ ] NSSM downloaded (https://nssm.cc/download)
- [ ] SysTracker_Server.exe (downloaded or built)
- [ ] PowerShell 5.0+ available
- [ ] Port 7777 available (or configure different)

---

## 🎯 Deployment Scenarios

### Scenario 1: Small Office (3-5 PCs)
```
Your Desktop (Windows 11)
    └─ SysTracker Server
       └─ Monitors: Workstations, File Server, Laptop

Setup: 5 minutes
Maintenance: Minimal (set and forget)
```

### Scenario 2: Hybrid Monitoring
```
Windows PC (Your Desktop)          Linux Server (Data Center)
    └─ SysTracker Server 1             └─ SysTracker Server 2
       └─ Windows Agents (10)             └─ Linux Agents (20)

Setup: Each take 10 minutes total
Maintenance: Independent
```

### Scenario 3: Development & Testing
```
Your Dev PC (Windows 11)
    ├─ SysTracker Server (5 test agents)
    └─ Used for development, testing, demos

Setup: 5 minutes
Purpose: Development, staging
```

---

## 🔄 Complete Setup Process

### Step 1: Install NSSM (1 minute)
```powershell
# Download: https://nssm.cc/download
# Extract to C:\nssm
# Verify: nssm --version
```

### Step 2: Download/Build Server EXE (variable)
```powershell
# Option A: Download pre-built
# https://github.com/Redwan002117/SysTracker/releases

# Option B: Build yourself
# cd server && npm run build:win
```

### Step 3: Run Installation Script (1-2 minutes)
```powershell
# As Administrator
powershell -ExecutionPolicy Bypass -File install_windows_service.ps1
```

### Step 4: Configure Server (2 minutes)
```powershell
# Edit C:\Program Files\SysTracker Server\.env
# Change API_KEY to secure value
# (Optional) Configure SMTP for email alerts
# Restart service
```

### Step 5: Open Dashboard (1 minute)
```
Browser: http://localhost:7777
Create admin account
Configure settings
```

### Step 6: Deploy Agents (5 minutes)
```
Download from Settings > Agent Management
Run on machines you want to monitor
```

**Total Time: 15-20 minutes** ⏱️

---

## 🔐 Security Best Practices

### ✅ Implemented Automatically
- JWT authentication with expiring tokens
- Password hashing (bcrypt)
- SQL injection prevention
- Role-based access control (Admin/Viewer)
- API key for agent authentication

### ✅ You Should Configure
- [ ] Change `API_KEY` in `.env` to something secure
- [ ] Set strong admin password (8+ characters)
- [ ] Configure SMTP for email alerts
- [ ] Enable Windows Firewall rule for port 7777
- [ ] Regular database backups

### ✅ Optional Advanced Security
- Use Cloudflare Tunnel for external access (instead of port forwarding)
- Configure TLS/SSL certificate for HTTPS
- Use VPN for remote access
- Implement IP whitelisting at firewall

---

## 📊 Monitoring Your Server

### Service Status
```powershell
# Check if running
Get-Service SysTracker

# Restart if needed
Restart-Service SysTracker

# View detailed info
Get-Service SysTracker | Select-Object *
```

### Resource Usage
```powershell
# CPU & Memory
Get-Process | Where-Object {$_.Name -like "*SysTracker*"}

# Database size
(Get-Item "C:\Program Files\SysTracker Server\data\systracker.db").Length / 1MB
```

### Logs
```powershell
# View recent logs (real-time)
Get-Content "C:\Program Files\SysTracker Server\logs\service.log" -Tail 50 -Wait

# View errors only
Get-Content "C:\Program Files\SysTracker Server\logs\service-error.log"
```

---

## 🆘 Common Issues

| Issue | Solution | Guide |
|-------|----------|-------|
| Service won't start | Check error log + port in use | [Troubleshooting](WINDOWS_SERVER_DEPLOYMENT.md#🆘-troubleshooting) |
| Can't access dashboard | Verify service running + port listening | [Quick Start](WINDOWS_SERVER_QUICK_START.md) |
| Agents not connecting | Check API key + firewall | [Full Guide](WINDOWS_SERVER_DEPLOYMENT.md#🔧-troubleshooting) |
| Database growing too large | Archive old metrics | [Maintenance](WINDOWS_SERVER_DEPLOYMENT.md#performance-tuning) |
| Port 7777 already in use | Use different port in .env | [Configuration](WINDOWS_SERVER_DEPLOYMENT.md#configuration) |

---

## 📈 Scaling Considerations

### Single Windows PC Capacity
- **Recommended:** 5-20 agents
- **Maximum:** 50+ agents (with 8GB+ RAM)
- **Database grows:** ~50MB per month (50 machines)

### If You Need More
- **50+ machines:** Consider Ubuntu server with better resource management
- **Multiple deployments:** Run separate Windows servers independently
- **Redundancy:** Use Ubuntu with PostgreSQL + multiple instances

---

## 🔄 Upgrade & Updates

### Regular Updates
```powershell
# 1. Stop service
Stop-Service SysTracker

# 2. Backup current EXE
Copy-Item "C:\Program Files\SysTracker Server\SysTracker_Server.exe" `
          "C:\Program Files\SysTracker Server\SysTracker_Server.backup.exe"

# 3. Download new EXE from GitHub
# https://github.com/Redwan002117/SysTracker/releases

# 4. Replace EXE
Copy-Item "C:\downloads\SysTracker_Server.exe" `
          "C:\Program Files\SysTracker Server\"

# 5. Restart
Start-Service SysTracker
```

### Agent Updates (Automatic)
Agents check for updates automatically. Upload new agent version in:
> Settings > Agent Management > Upload new version

---

## 📚 Next Steps

### ✅ Immediate Actions
1. Read [Quick Start](WINDOWS_SERVER_QUICK_START.md) (5 minutes)
2. Complete [Setup Checklist](WINDOWS_SETUP_CHECKLIST.md) during setup
3. Verify everything working with test agent

### 📖 Later Reference
1. Keep [Full Guide](WINDOWS_SERVER_DEPLOYMENT.md) handy
2. Review [Deployment Comparison](DEPLOYMENT_COMPARISON.md) if considering Ubuntu
3. Bookmark troubleshooting sections

### 🚀 Advanced (Optional)
1. Set up automated backups (Task Scheduler)
2. Configure SMTP for email alerts
3. Create additional admin users with restricted roles
4. Set up monitoring for the monitoring system (meta!)

---

## 📞 Support & Resources

### Documentation
- **Quick Start:** 5-minute setup guide
- **Full Guide:** Comprehensive reference
- **Checklist:** Step-by-step verification
- **Comparison:** Windows vs Ubuntu analysis

### External Resources
- [NSSM Documentation](https://nssm.cc/usage)
- [SysTracker GitHub](https://github.com/Redwan002117/SysTracker)
- [Releases](https://github.com/Redwan002117/SysTracker/releases)
- [Issues & Support](https://github.com/Redwan002117/SysTracker/issues)

### Troubleshooting Help
1. Check logs: `C:\Program Files\SysTracker Server\logs\service-error.log`
2. See [Troubleshooting Section](WINDOWS_SERVER_DEPLOYMENT.md#🆘-troubleshooting)
3. Open GitHub issue with error details

---

## 🎓 Learning Path

### For Quick Implementation
1. **First 5 min:** [Quick Start](WINDOWS_SERVER_QUICK_START.md)
2. **During setup:** [Setup Checklist](WINDOWS_SETUP_CHECKLIST.md)
3. **If issues:** Check troubleshooting section

### For Complete Understanding
1. **Overview:** This document
2. **Full setup:** [Windows Server Deployment](WINDOWS_SERVER_DEPLOYMENT.md)
3. **Decision making:** [Deployment Comparison](DEPLOYMENT_COMPARISON.md)
4. **Troubleshooting:** Relevant section in Full Guide

### For Operations Team
1. **Daily use:** [Quick Start](WINDOWS_SERVER_QUICK_START.md)
2. **Management:** `manage_service.ps1` script
3. **Issues:** Troubleshooting guide

---

## ✨ Key Features

**Real-Time Dashboard**
- Live CPU, RAM, Disk, Network metrics
- Automatic updates every 3 seconds
- Beautiful, responsive interface

**Management**
- Remote command execution
- User roles (Admin/Viewer)
- Alert policies with email

**Reliability**
- Auto-start on boot
- Auto-restart on failure
- Local SQLite database
- Comprehensive logging

**Scalability**
- Supports 5-50 agents on single PC
- Can run alongside Ubuntu deployment
- Independent databases per server

---

## 📝 Comparison: Windows vs Ubuntu

| Aspect | Windows | Ubuntu |
|--------|---------|--------|
| **Setup Time** | 5 minutes | 10 minutes |
| **Ease** | Simpler (GUI) | More complex (CLI) |
| **Persistence** | Built-in service | systemd or Docker |
| **Scaling** | Limited (1 machine) | Scalable (multi) |
| **Enterprise** | Good (100 machines) | Better (1000+ machines) |
| **Cost** | Free | Free |
| **Support** | This guide | Docker / Linux guides |

**Recommendation:** Windows for testing/small offices, Ubuntu for enterprise.

---

## 📋 Final Checklist

Before going live in production:

- [ ] Service running and tested
- [ ] Dashboard accessible from other machines
- [ ] At least one agent deployed and reporting
- [ ] Admin account created with strong password
- [ ] API key changed from default
- [ ] Database backed up
- [ ] SMTP configured (if using alerts)
- [ ] Firewall rules configured
- [ ] Error logs reviewed and clean
- [ ] Documented access credentials

---

## 🎉 You're Ready!

Your Windows SysTracker server is now:
- ✅ **Running** as a Windows Service
- ✅ **Auto-starting** on reboot
- ✅ **Accessible** via dashboard
- ✅ **Ready** for agents to connect

**Next:** Deploy agents on machines you want to monitor!

---

**Status:** ✅ Production Ready  
**Last Updated:** February 21, 2026  
**Version:** 3.1.1+

**Questions?** Check the documentation links above or open a GitHub issue.
