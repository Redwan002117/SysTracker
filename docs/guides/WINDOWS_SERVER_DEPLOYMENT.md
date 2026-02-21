# SysTracker Windows Server Deployment Guide

**Status:** Production-Ready Setup Guide for Windows Standalone Server  
**Date:** February 21, 2026  
**Version:** 3.1.1+

---

## 📋 Overview

This guide covers deploying SysTracker Server as a **standalone Windows EXE application** that can:
- ✅ Run on Windows 10/11/Server 2019+
- ✅ Start as a Windows Service (auto-start, background)
- ✅ Store data locally in the AppData directory
- ✅ Run alongside Ubuntu server (multiple instances)
- ✅ Update automatically
- ✅ Access dashboard via `http://localhost:7777`

---

## 🎯 Prerequisites

### System Requirements
- **OS:** Windows 10/11 or Windows Server 2019+
- **RAM:** 2 GB minimum (4 GB recommended)
- **Disk:** 500 MB free space
- **Network:** TCP port 7777 (for dashboard/API)
- **Access:** Administrator rights to install as service

### Build Machine Requirements (to create the EXE)
If you're building the Windows EXE yourself:
- Node.js 18+ (https://nodejs.org)
- npm 9+
- Git (optional, for pulling latest code)
- `pkg` package (installed via npm)

---

## 📦 Part 1: Building the Windows Server EXE

### 1.1 Build from Source (Linux/macOS/Windows Dev Machine)

Building on **any platform** (even Linux) creates a Windows-compatible EXE:

```bash
# From workspace root
cd server

# Install dependencies
npm install

# Build the dashboard first (required asset)
cd ../dashboard
npm install
npm run build
cp -r out ../server/dashboard-dist
cd ../server

# Build the standalone Windows EXE
npm run build:win

# Output: systracker-server-win.exe (app ~40-50 MB)
```

### 1.2 Pre-built EXE Option

If you don't want to build, check the GitHub releases:
- Go to: https://github.com/Redwan002117/SysTracker/releases
- Download: `SysTracker_Server.exe` (if available for your version)

---

## 💾 Part 2: Windows Service Installation

Once you have the `systracker-server-win.exe`, install it as a Windows Service:

### 2.1 Manual Registration (Command Prompt / PowerShell)

**Option A: Using NSSM (Node Simple Service Manager)** - Recommended

```powershell
# 1. Download NSSM (lightweight service wrapper)
# From: https://nssm.cc/download
# Extract to: C:\nssm (or any PATH location)

# 2. Install service
nssm install SysTracker "C:\Path\To\systracker-server-win.exe" ""

# 3. Configure service
nssm set SysTracker AppDirectory "C:\Program Files\SysTracker Server"
nssm set SysTracker AppStdout "C:\Program Files\SysTracker Server\logs\stdout.log"
nssm set SysTracker AppStderr "C:\Program Files\SysTracker Server\logs\stderr.log"

# 4. Start service
nssm start SysTracker

# 5. Verify
nssm status SysTracker
```

**Option B: Using PowerShell Script** (Provided Below)

See the `install_windows_service.ps1` script in Part 3.

### 2.2 Verify Installation

```powershell
# Check if service is running
Get-Service SysTracker

# View service details
Get-Service SysTracker | Select-Object *

# Check port is listening
netstat -ano | findstr :7777

# View logs
Get-Content "C:\Program Files\SysTracker Server\logs\app.log" -Tail 50
```

---

## 🔧 Part 3: Automated Installation Scripts

### 3.1 PowerShell Installation Script

Create `install_windows_server.ps1`:

```powershell
# Run as Administrator
# powershell -ExecutionPolicy Bypass -File install_windows_server.ps1

param(
    [string]$InstallDir = "C:\Program Files\SysTracker Server",
    [string]$ExePath = $PSScriptRoot,
    [switch]$StartService = $true,
    [switch]$AsService = $true
)

$ErrorActionPreference = "Stop"

Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  SysTracker Server - Windows Installation  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check for admin privileges
$isAdmin = [Security.Principal.WindowsIdentity]::GetCurrent().Groups -contains 'S-1-5-32-544'
if (!$isAdmin) {
    Write-Host "ERROR: This script must run as Administrator!" -ForegroundColor Red
    Exit 1
}

# Find the EXE
$ExeFile = Get-ChildItem -Path $ExePath -Filter "systracker-server*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
if (!$ExeFile) {
    Write-Host "ERROR: systracker-server-win.exe not found in $ExePath" -ForegroundColor Red
    Write-Host "Place the .exe file in the same directory as this script." -ForegroundColor Yellow
    Exit 1
}

Write-Host "✓ Found EXE: $($ExeFile.FullName)" -ForegroundColor Green
Write-Host "✓ Install directory: $InstallDir" -ForegroundColor Green
Write-Host ""

# Create installation directory
Write-Host "Creating directories..." -ForegroundColor Yellow
if (!(Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

# Create subdirectories
@('data', 'logs', 'uploads') | ForEach-Object {
    $dir = "$InstallDir\$_"
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

# Copy executable
Write-Host "Copying application files..." -ForegroundColor Yellow
Copy-Item -Path $ExeFile.FullName -Destination "$InstallDir\SysTracker_Server.exe" -Force

# Create .env file if it doesn't exist
$envFile = "$InstallDir\.env"
if (!(Test-Path $envFile)) {
    Write-Host "Creating .env configuration file..." -ForegroundColor Yellow
    $envContent = @"
# SysTracker Server Configuration
# For Windows Standalone

# Server port
PORT=7777

# JWT Secret (auto-generated if not provided)
# JWT_SECRET=your_secret_here_64_chars_min

# JWT Expiration
JWT_EXPIRES_IN=24h

# API Key for agents (change this!)
API_KEY=systracker_default_key_change_me

# SMTP Configuration (optional, for email alerts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_SECURE=false
SMTP_FROM="SysTracker Alerts" <alerts@yourdomain.com>

# Database (auto-created)
# DATABASE_PATH is automatically set to data/systracker.db in this directory
"@
    Set-Content -Path $envFile -Value $envContent -Encoding UTF8
    Write-Host "✓ Created .env at $envFile" -ForegroundColor Green
    Write-Host "  ⚠ Edit this file to configure SMTP and API Key" -ForegroundColor Yellow
}

# Create startup batch script
Write-Host "Creating startup scripts..." -ForegroundColor Yellow
$batFile = "$InstallDir\start-server.bat"
$batContent = @"
@echo off
REM Start SysTracker Server
setlocal
cd /d "%~dp0"
SysTracker_Server.exe
pause
"@
Set-Content -Path $batFile -Value $batContent

# Create Windows Service (if -AsService flag)
if ($AsService) {
    Write-Host "Setting up as Windows Service..." -ForegroundColor Yellow
    
    # Check if NSSM is available
    $nssm = Get-Command nssm -ErrorAction SilentlyContinue
    if (!$nssm) {
        Write-Host "ERROR: NSSM (Node Simple Service Manager) is required for service installation" -ForegroundColor Red
        Write-Host "Download from: https://nssm.cc/download" -ForegroundColor Yellow
        Write-Host "Extract to PATH (e.g., C:\Windows\System32)" -ForegroundColor Yellow
        Write-Host "Then run: nssm install SysTracker `"$InstallDir\SysTracker_Server.exe`"" -ForegroundColor Cyan
        Exit 1
    }

    # Stop existing service if running
    nssm status SysTracker 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Stopping existing SysTracker service..." -ForegroundColor Yellow
        nssm stop SysTracker
    }

    # Remove existing service if it exists
    nssm remove SysTracker confirm 2>$null

    # Install service
    Write-Host "Installing SysTracker as Windows Service..." -ForegroundColor Yellow
    nssm install SysTracker "$InstallDir\SysTracker_Server.exe" ""
    nssm set SysTracker AppDirectory "$InstallDir"
    nssm set SysTracker AppStdout "$InstallDir\logs\service.log"
    nssm set SysTracker AppStderr "$InstallDir\logs\service-error.log"
    nssm set SysTracker AppExit Default Restart
    nssm set SysTracker AppRestartDelay 5000
    
    # Set service to auto-start
    nssm set SysTracker Start SERVICE_AUTO_START
    
    Write-Host "✓ Service installed successfully" -ForegroundColor Green

    # Start service
    if ($StartService) {
        Write-Host "Starting SysTracker service..." -ForegroundColor Yellow
        nssm start SysTracker
        Start-Sleep -Seconds 2
        
        $status = nssm status SysTracker
        if ($status -match "SERVICE_RUNNING") {
            Write-Host "✓ Service started successfully" -ForegroundColor Green
        } else {
            Write-Host "⚠ Service may not have started. Check logs." -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "Service installation skipped. Run manually: $batFile" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  Installation Complete!                    ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Edit configuration: $envFile" -ForegroundColor Gray
Write-Host "   - Set API_KEY to something secure"
Write-Host "   - Configure SMTP if you want email alerts"
Write-Host ""
Write-Host "2. Open dashboard: http://localhost:7777" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Create admin account at: /setup" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Download agent from dashboard Settings > Agent Management" -ForegroundColor Gray
Write-Host ""
Write-Host "Logs:" -ForegroundColor Cyan
if ($AsService) {
    Write-Host "  Service logs: $InstallDir\logs\service.log" -ForegroundColor Gray
}
Write-Host "  Application logs: $InstallDir\logs\app.log" -ForegroundColor Gray
Write-Host ""
Write-Host "Uninstall:" -ForegroundColor Cyan
if ($AsService) {
    Write-Host "  nssm remove SysTracker confirm" -ForegroundColor Gray
    Write-Host "  rmdir /s `"$InstallDir`"" -ForegroundColor Gray
} else {
    Write-Host "  rmdir /s `"$InstallDir`"" -ForegroundColor Gray
}
```

### 3.2 Configuration File Location

After installation, find the configuration at:
```
C:\Program Files\SysTracker Server\.env
```

Edit to customize:
```env
PORT=7777
API_KEY=your_secure_key_here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## 🚀 Part 4: Running the Server

### 4.1 As Windows Service (Recommended)

After running the installation script:

```powershell
# Start service
Start-Service SysTracker

# Stop service
Stop-Service SysTracker

# Restart service
Restart-Service SysTracker

# View status
Get-Service SysTracker

# View real-time logs (PowerShell v7+)
Get-Content "C:\Program Files\SysTracker Server\logs\service.log" -Wait
```

### 4.2 Manual/Console Mode

For testing or debugging:

```powershell
# Run directly (not as service)
& "C:\Program Files\SysTracker Server\SysTracker_Server.exe"

# Check output for any errors
# Press Ctrl+C to stop
```

### 4.3 Access the Dashboard

Open your browser and navigate to:
```
http://localhost:7777
```

You should see the SysTracker login/setup screen.

---

## 🔐 Part 5: Security Configuration

### 5.1 Change API Key

1. Edit `.env`:
   ```env
   API_KEY=your_super_secure_key_at_least_32_chars
   ```

2. Download the agent from dashboard > Settings > Agent Management
3. The agent will automatically use the new API key

### 5.2 Enable SMTP (Email Alerts)

Edit `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password  # For Gmail, use App Password, not regular password
SMTP_SECURE=false
SMTP_FROM="SysTracker" <noreply@yourdomain.com>
```

### 5.3 Firewall Rules

**To access from other machines on the network:**

```powershell
# Allow port 7777 through Windows Firewall
New-NetFirewallRule -DisplayName "SysTracker" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 7777

# Or use GUI:
# Settings > Firewall & network protection > Allow an app through firewall
# Add: SysTracker_Server.exe (Private networks)
```

**For external access (optional):**
- Use Cloudflare Tunnel (recommended, free)
- Or configure port forwarding + domain/SSL

---

## 📊 Part 6: Usage & Administration

### 6.1 First-Time Setup

1. **Open dashboard:** http://localhost:7777
2. **Create admin account:** Click "Setup" link
   - Enter username, email, password
   - Password must be 8+ characters
3. **Login:** Use the credentials you created
4. **Configure SMTP** (optional): Settings > SMTP
5. **Upload API Key**: Settings > General > Update API Key
6. **Download Agent**: Settings > Agent Management
7. **Install agents** on Windows machines you want to monitor

### 6.2 Data Directory Structure

```
C:\Program Files\SysTracker Server\
├── SysTracker_Server.exe          (Application)
├── .env                           (Configuration)
├── data/
│   ├── systracker.db             (SQLite database)
│   ├── jwt.secret                 (JWT encryption key - auto-generated)
│   └── agent_releases/            (Uploaded agent versions)
├── logs/
│   ├── service.log               (Service output)
│   ├── service-error.log         (Service errors)
│   └── app.log                   (Application errors)
└── uploads/
    └── (User profile pictures, etc.)
```

### 6.3 Database Backup

```powershell
# Manual backup
Copy-Item "C:\Program Files\SysTracker Server\data\systracker.db" `
          "C:\Backups\systracker_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').db"

# Scheduled backup (Task Scheduler)
# Create task to run daily backup script
```

---

## 🔄 Part 7: Updates & Maintenance

### 7.1 Update to New Version

```powershell
# 1. Stop service
Stop-Service SysTracker

# 2. Download new EXE from GitHub releases
# 3. Backup current EXE
Copy-Item "C:\Program Files\SysTracker Server\SysTracker_Server.exe" `
          "C:\Program Files\SysTracker Server\SysTracker_Server.backup.exe"

# 4. Replace EXE
Copy-Item "C:\Path\To\New\SysTracker_Server.exe" `
          "C:\Program Files\SysTracker Server\"

# 5. Restart service
Start-Service SysTracker

# 6. Verify
Get-Service SysTracker
Invoke-WebRequest http://localhost:7777/api/auth/status
```

### 7.2 Automatic Agent Updates

Agents check for updates automatically every 1 hour. New versions are downloaded if available:

1. **Upload new agent** in dashboard: Settings > Agent Management
2. **Set version** (semantic: X.Y.Z)
3. **Agents automatically download** within 1 hour

### 7.3 Logs

```powershell
# View recent errors
Get-Content "C:\Program Files\SysTracker Server\logs\service-error.log" -Tail 20

# Monitor in real-time (PowerShell 7+)
Get-Content "C:\Program Files\SysTracker Server\logs\service.log" -Tail 50 -Wait

# Rotate logs (optional, delete old ones)
Get-ChildItem "C:\Program Files\SysTracker Server\logs\*.log" | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | 
    Remove-Item
```

---

## 🆘 Troubleshooting

### Problem: Service won't start

```powershell
# Check service status and error
nssm status SysTracker

# View detailed error log
Get-Content "C:\Program Files\SysTracker Server\logs\service-error.log" -Tail 50

# Try running executable directly to see errors
& "C:\Program Files\SysTracker Server\SysTracker_Server.exe"
```

**Common causes:**
- Port 7777 already in use: `netstat -ano | findstr :7777`
- Permission denied: Run CMD as Administrator
- Database locked: Ensure no other instance is running

### Problem: Can't access dashboard from other machines

```powershell
# Check if port is listening
netstat -ano | findstr :7777

# Verify firewall rule
Get-NetFirewallRule -DisplayName "SysTracker"

# Test connectivity from another machine
Test-NetConnection <ServerIP> -Port 7777

# Access via: http://<ServerIP>:7777
```

### Problem: Agents not connecting

1. **Check API Key** in .env matches what agents are using
2. **Check port 7777** is open and accessible from agent machine
3. **View agent logs** on the agent machine
4. **Try direct URL**: `http://<ServerIP>:7777/api/auth/status`

### Problem: Out of disk space

```powershell
# Check data directory size
(Get-ChildItem "C:\Program Files\SysTracker Server\data" -Recurse | 
    Measure-Object -Property Length -Sum).Sum / 1GB

# Archive old logs (keep last 30 days)
Get-ChildItem "C:\Program Files\SysTracker Server\logs\*.log" | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | 
    Remove-Item
```

---

## 📈 Performance Tuning

### Database Optimization

```powershell
# Periodically vacuum database (stops service first)
Stop-Service SysTracker

# Use SQLite CLI (manually)
# Or add to scheduled task
```

### Memory Usage

Server typically uses:
- **Idle:** 50-100 MB
- **With 100 agents:** 200-400 MB
- **With 500 agents:** 500-800 MB

If using > 1 GB, consider:
- Archiving old metrics
- Increasing metrics DB throttle (hardcode in server.js)
- Using 64-bit OS

---

## 🔗 Integration with Ubuntu Server

Both Windows and Ubuntu servers can run **simultaneously** on different machines:

### Ubuntu Server
```bash
docker-compose up -d
# Runs on http://<UbuntuIP>:7777
```

### Windows Server
```powershell
# Runs on http://<WindowsIP>:7777
```

### Agents Configuration

Agents point to **different server URLs**:

**Agent 1** (reports to Windows): `http://<WindowsServerIP>:7777`  
**Agent 2** (reports to Ubuntu): `http://<UbuntuServerIP>:7777`

Each server maintains its own database and machine list.

---

## 📚 Additional Resources

- **GitHub:** https://github.com/Redwan002117/SysTracker
- **Releases:** https://github.com/Redwan002117/SysTracker/releases
- **NSSM Guide:** https://nssm.cc/usage
- **Node.js Windows:** https://nodejs.org/en/download/

---

## 🤝 Support

For issues or questions:
1. Check logs: `C:\Program Files\SysTracker Server\logs\`
2. See troubleshooting section above
3. Open GitHub issue: https://github.com/Redwan002117/SysTracker/issues

---

**Last Updated:** February 21, 2026  
**Status:** ✅ Production Ready
