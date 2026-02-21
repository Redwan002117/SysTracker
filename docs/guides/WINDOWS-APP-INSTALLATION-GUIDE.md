# 🪟 SysTracker Windows Application Setup Guide

**Version:** 3.1.0  
**Last Updated:** February 21, 2026

---

## 📋 Overview

SysTracker is now available as a professional Windows application package with proper installation mechanisms. Instead of running as console applications, the applications are now configured to run as proper Windows GUI applications.

---

## 🚀 Quick Start

### Option 1: Installer Script (Recommended)

The easiest way to install SysTracker on Windows:

#### **For Server (Dashboard)**
```powershell
# Run as Administrator
cd C:\path\to\extracted\server
powershell -ExecutionPolicy Bypass -File install-server.ps1
```

This will:
- ✅ Install application to `C:\Program Files\SysTracker`
- ✅ Create Desktop shortcut
- ✅ Add to Start Menu
- ✅ Register in Windows
- ✅ Configure port 3000
- ✅ Create data directories

#### **For Agent (Client)**
```powershell
# Run as Administrator
cd C:\path\to\extracted\agent
powershell -ExecutionPolicy Bypass -File install-agent.ps1 -ServerURL "http://your-server:3000"
```

This will:
- ✅ Install application to `C:\Program Files\SysTracker\Agent`
- ✅ Create Desktop shortcut
- ✅ Add to Start Menu
- ✅ Register in Windows
- ✅ Configure connection to server
- ✅ (Optional) Set up auto-start on boot

### Option 2: Manual Launcher

If you don't want to install, you can just run:

```batch
# Navigate to the directory with the EXE
cd server
launch-server.bat          # Launches server without console window
```

```batch
cd agent
launch-agent.bat           # Launches agent without console window
```

### Option 3: Direct EXE

You can directly run the application:
```batch
systracker-server-win.exe
systracker-agent-win.exe
```

However, this will open a console window. Use the launcher scripts instead for cleaner operation.

---

## 🎯 What Each Installer Does

### Server Installer (`install-server.ps1`)

**Features:**
- Installs to a protected system directory
- Creates GUI shortcuts that don't show console
- Registers application in Add/Remove Programs
- Sets up proper file permissions
- Creates data storage location
- Configures environment variables

**After Installation:**
- Click the shortcut to start → Browser opens to dashboard
- Dashboard runs at `http://localhost:3000`
- No console window visible
- Runs as a real Windows application

**Setup Parameters:**
```powershell
# Custom installation path
install-server.ps1 -InstallPath "C:\MyApps\SysTracker"

# Without desktop shortcut
install-server.ps1 -NoShortcuts
```

### Agent Installer (`install-agent.ps1`)

**Features:**
- Installs alongside server (if installed)
- Creates system tray-compatible launcher
- Connects to specified server
- Configurable machine identity
- Optional auto-startup on boot

**After Installation:**
- Click the shortcut to start the agent
- Agent runs hidden in background
- No console window
- Automatically sends data to server

**Setup Parameters:**
```powershell
# Connect to remote server
install-agent.ps1 -ServerURL "http://192.168.1.100:3000"

# Auto-start on Windows boot (prompted during install)
# Select 'y' when asked

# Without desktop shortcut
install-agent.ps1 -NoShortcuts
```

---

## 🎨 GUI Application Features

The applications are now configured as proper Windows GUI applications:

### Visual Enhancements
- ✅ Professional application icon in taskbar
- ✅ Appears in Start Menu with application details
- ✅ Windows shortcuts don't show console
- ✅ Proper window management

### No Console Window
By default, launcher scripts hide the console window:
- Server runs silently in background with browser open
- Agent runs as a background monitoring service
- No black terminal window cluttering desktop

### System Integration
- ✅ Registered in Windows Control Panel
- ✅ Removable via Add/Remove Programs
- ✅ Task Scheduler integration (optional)
- ✅ Startup folder support

---

## 🔧 Troubleshooting

### Issue: "Access Denied" when running installer
**Solution:** Right-click PowerShell and select "Run as Administrator"

### Issue: Execution Policy Error
**Solution:** Run the installer with policy bypass:
```powershell
powershell -ExecutionPolicy Bypass -File install-server.ps1
```

### Issue: Application won't start
**Causes & Solutions:**
1. Port 3000 in use: Change in `.env` file
2. Database locked: Delete old database in `data/` folder
3. Missing dependencies: Reinstall via script

### Issue: Agent can't connect to server
**Solution:** Check server URL in `agent_config.json`:
```json
{
  "serverURL": "http://your-actual-server:3000"
}
```

### Issue: Want to see the launcher console
**Solution:** Modify `launch-server.bat` or `launch-agent.bat`:
- Remove the VBS script wrapper
- Just run the EXE directly: `systracker-server-win.exe`

---

## 📦 Uninstall

### Via Control Panel (Recommended)
1. Open **Settings** → **Apps** → **Apps & Features**
2. Search for "SysTracker"
3. Click to select it
4. Click **Uninstall**

### Manual Uninstall
1. Stop the application if running
2. Delete the installation folder (default: `C:\Program Files\SysTracker`)
3. Delete shortcuts from Desktop and Start Menu
4. Remove `HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\SysTracker-*` registry entries

---

## 🚀 Advanced Usage

### Auto-Start on Boot

#### Server
1. Open **Shell:Startup** in Windows Run dialog
2. Paste the folder path from the installer: `C:\Program Files\SysTracker`
3. Create shortcut to `launch-server.bat`

#### Agent
The installer offers to set up a Windows Task Scheduler entry automatically.

### Network Configuration

Edit `.env` file in installation directory:

**Server** (`C:\Program Files\SysTracker\.env`):
```
NODE_ENV=production
PORT=3000
ALLOWED_IPS=localhost,127.0.0.1,192.168.1.*
DATABASE_PATH=./data/sys_tracker.db
```

**Agent** (`C:\Program Files\SysTracker\Agent\agent_config.json`):
```json
{
  "serverURL": "http://your.server.ip:3000",
  "machineId": "desktop-01",
  "enabled": true
}
```

### Monitor Logs

Logs are stored in:
- **Server:** `C:\Program Files\SysTracker\logs\`
- **Agent:** Check Event Viewer or create log file manually

---

## 📊 Features

### Server (Dashboard)
- **Real-time Dashboard:** View all connected machines
- **Performance Metrics:** CPU, Memory, Disk, Network
- **User Management:** Create and manage users
- **Alerts:** Set performance thresholds
- **History:** Track metrics over time

### Agent (Client)
- **System Monitoring:** Real-time system metrics
- **Auto-discovery:** Automatically detects server
- **Background Service:** Runs without user intervention
- **Low Resource:** Minimal CPU/Memory impact
- **Secure Communication:** Socket.io encrypted

---

## 🔒 Security Notes

1. **Firewall:** Port 3000 must be open for server/agent communication
2. **Local Network Only:** By default, only localhost connections
3. **HTTPS:** Configure for external access (requires certificate)
4. **Authentication:** All users must log in to dashboard
5. **Data:** Stored locally in SQLite database

---

## 📞 Support

For issues or questions:
1. Check logs in `logs/` directory
2. Review `agent_config.json` settings
3. Verify network connectivity
4. Ensure ports are not blocked by firewall

---

## 🎁 What's New in v3.1.0

- ✅ Proper Windows GUI application structure
- ✅ Professional installer scripts
- ✅ Icon and branding on application
- ✅ Start Menu integration
- ✅ System registry entries
- ✅ No console window by default
- ✅ Auto-startup support
- ✅ Uninstall support

---

**Enjoy using SysTracker! 🎉**
