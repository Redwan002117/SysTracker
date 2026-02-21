# SysTracker v3.1.2 - Complete Deployment Guide

**Version:** 3.1.2  
**Updated:** February 21, 2026  
**Status:** Production Ready

---

## 📋 Table of Contents

1. [Installation Overview](#installation-overview)
2. [Before You Start](#before-you-start)
3. [Method 1: Standalone Executable](#method-1-standalone-executable)
4. [Method 2: Windows Service](#method-2-windows-service)
5. [Method 3: Enterprise Deployment](#method-3-enterprise-deployment)
6. [Configuration & Setup](#configuration--setup)
7. [Agent Deployment](#agent-deployment)
8. [Troubleshooting](#troubleshooting)
9. [Uninstallation](#uninstallation)

---

## Installation Overview

SysTracker offers three deployment methods to suit different needs:

| Method | Use Case | Complexity | Privileges |
|--------|----------|-----------|-----------|
| **Standalone** | Individual users | Simple | User/Admin |
| **Windows Service** | Always-on monitoring | Medium | Admin |
| **Enterprise** | Org-wide deployment | Complex | Admin/IT |

---

## Before You Start

### Pre-Installation Checklist

- [ ] Windows 10 v1909+ or Windows 11 installed
- [ ] 500 MB free disk space available
- [ ] Administrator access available (for service installation)
- [ ] Internet connection (optional, for initial setup)
- [ ] Antivirus software allows EXE execution
- [ ] System is not running competing monitoring software
- [ ] Backup of important data created (recommended)

### System Verification

Run the following to verify compatibility:

```powershell
# Check Windows Version
(Get-WmiObject -Class Win32_OperatingSystem).Caption
(Get-WmiObject -Class Win32_OperatingSystem).BuildNumber

# Check Available Disk Space
Get-Volume C: | Select-Object SizeRemaining

# Check Available Memory
(Get-WmiObject -Class Win32_ComputerSystem).TotalPhysicalMemory / 1GB
```

---

## Method 1: Standalone Executable

### Quickest Setup (User-Friendly)

**Time Required:** 5 minutes  
**Admin Required:** Optional (for some features)  
**Complexity:** ★☆☆☆☆

### Step 1: Download

1. Download `systracker-server-win.exe` from GitHub
2. Save to desired location (e.g., `C:\SysTracker\`)
3. Verify file integrity (if SHA256 hash provided):
   ```powershell
   $file = "C:\SysTracker\systracker-server-win.exe"
   Get-FileHash $file -Algorithm SHA256
   ```

### Step 2: Launch

**Option A: Using Batch Script (Recommended)**

```bash
1. Place RUN-SYSTRACKER.bat in same directory as EXE
2. Double-click RUN-SYSTRACKER.bat
3. Command window appears briefly, then closes
4. Server runs in background
```

**Option B: Direct Execution**

```bash
1. Double-click systracker-server-win.exe directly
2. Console window remains open
3. Press Ctrl+C to stop (not recommended)
```

**Option C: Command Line**

```powershell
# Start server in background (PowerShell)
Start-Process -WindowStyle Hidden C:\SysTracker\systracker-server-win.exe

# Or with command line argument
cd C:\SysTracker
.\systracker-server-win.exe
```

### Step 3: Verify Installation

1. Open web browser
2. Navigate to `http://localhost:7777`
3. You should see SysTracker login page
4. Default credentials: `admin` / `admin` (change on first login)

### Step 4: First Login

1. Enter default credentials
2. Complete setup wizard
3. Configure monitoring preferences
4. Set up first local agent (optional)

### Starting on System Boot (Standalone)

To auto-start with Windows:

```powershell
# Create startup folder shortcut
$Shell = New-Object -ComObject WScript.Shell
$Shortcut = $Shell.CreateShortcut("$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\SysTracker.lnk")
$Shortcut.TargetPath = "C:\SysTracker\RUN-SYSTRACKER.bat"
$Shortcut.Save()
```

---

## Method 2: Windows Service

### Recommended for Continuous Operation

**Time Required:** 10 minutes  
**Admin Required:** Yes (required)  
**Complexity:** ★★☆☆☆

### Step 1: Prepare

1. Extract all files to permanent location
2. Example: `C:\Program Files\SysTracker\`
3. Verify all files are present (see checklist below)

```
C:\Program Files\SysTracker\
├── systracker-server-win.exe
├── install-service.bat
├── create-shortcut.bat
├── RUN-SYSTRACKER.bat
└── README.txt (optional)
```

### Step 2: Install Service

4. Open Command Prompt **as Administrator**
5. Navigate to installation folder:
   ```cmd
   cd "C:\Program Files\SysTracker\"
   ```

6. Run service installer:
   ```cmd
   install-service.bat
   ```

7. You should see:
   ```
   [INFO] Installing SysTracker as Windows Service...
   [SUCCESS] Service installed successfully!
   [SUCCESS] Service started automatically
   ```

### Step 3: Verify Service Installation

```powershell
# Check service status
Get-Service | Where-Object { $_.Name -like "*SysTracker*" }

# Should show:
# Status   Name             DisplayName
# ------   ----             -----------
# Running  SysTrackerSvc    SysTracker Server Service
```

### Step 4: Access Dashboard

1. Open browser
2. Visit `http://localhost:7777`
3. Login with credentials
4. Service will appear running

### Service Management

#### Start Service

```powershell
Start-Service SysTrackerSvc
```

#### Stop Service

```powershell
Stop-Service SysTrackerSvc
```

#### Restart Service

```powershell
Restart-Service SysTrackerSvc
```

#### View Service Logs

```powershell
# View recent service logs
Get-EventLog System -Source SysTrackerSvc | Select-Object -First 20
```

#### Service Configuration

```powershell
# Set to auto-start
Set-Service SysTrackerSvc -StartupType Automatic

# Set to manual start
Set-Service SysTrackerSvc -StartupType Manual

# Disable service
Set-Service SysTrackerSvc -StartupType Disabled
```

### Recovery Options

Service auto-restart on failure:

```powershell
# Set auto-restart on crash
sc.exe failure SysTrackerSvc actions= restart/5000/restart/10000//1 reset= 120
```

---

## Method 3: Enterprise Deployment

### Organization-Wide Deployment

**Time Required:** 30 minutes + deployment time  
**Admin Required:** Yes (IT/Admin team)  
**Complexity:** ★★★★☆

### Option A: Group Policy Deployment (Windows Domain)

#### Prerequisites

- Active Directory Domain
- Group Policy management rights
- Network reach to all target computers

#### Deployment Steps

1. **Create Group Policy Object (GPO)**

   ```powershell
   # Create GPO for SysTracker deployment
   New-GPO -Name "Deploy-SysTracker" -Comment "SysTracker v3.1.2 deployment"
   ```

2. **Configure GPO**

   - Computer Configuration → Policies → Administrative Templates
   - Scripts (Startup/Shutdown) → Startup
   - Add deployment script

3. **Create Deployment Script**

   ```powershell
   # deploy-systracker.ps1
   $InstallPath = "C:\Program Files\SysTracker"
   $EXEPath = "\\fileserver\share\systracker-server-win.exe"
   
   # Create directory
   New-Item -ItemType Directory -Path $InstallPath -Force
   
   # Copy files
   Copy-Item "$EXEPath" -Destination "$InstallPath\"
   Copy-Item "\\fileserver\share\*.bat" -Destination "$InstallPath\"
   
   # Install service
   cd $InstallPath
   .\install-service.bat
   ```

4. **Apply GPO to Organizational Units**

   - Link GPO to target OUs
   - Set deployment schedule
   - Track deployment status

### Option B: SCCM/Intune Deployment (Microsoft Endpoint Management)

#### For SCCM

1. Create application in SCCM:
   - Application name: SysTracker 3.1.2
   - Software version: 3.1.2
   - Installation file: systracker-server-win.exe

2. Configure deployment:
   ```
   Installation command: install-service.bat
   Uninstall command: uninstall-service.bat
   Repair: (none required)
   ```

3. Deploy to device collections
4. Monitor deployment status

#### For Intune

1. Add as line-of-business app
2. Configure requirements and dependencies
3. Deploy to group membership
4. Track enrollment and compliance

### Option C: PowerShell Distribution

```powershell
# enterprise-deploy.ps1
# Run on each target computer

$Servers = @(
    "COMPUTER1",
    "COMPUTER2", 
    "COMPUTER3"
)

foreach ($Computer in $Servers) {
    Invoke-Command -ComputerName $Computer -ScriptBlock {
        # Copy files from share
        Copy-Item "\\fileserver\SysTracker\*" -Destination "C:\Program Files\SysTracker\" -Recurse -Force
        
        # Install service
        cd "C:\Program Files\SysTracker\"
        .\install-service.bat
        
        # Start service
        Start-Service SysTrackerSvc
    } -AsJob | Wait-Job
}
```

### Phase Deployment

For large organizations, deploy in phases:

1. **Pilot Phase** (Week 1)
   - 10-20 representative systems
   - Monitor for issues
   - Gather feedback

2. **Wave 1** (Week 2-3)
   - 25% of target systems
   - Verify stability
   - Address issues

3. **Wave 2** (Week 4-5)
   - 50% of target systems
   - Monitor deployment progress
   - Support user questions

4. **Wave 3** (Week 6+)
   - Remaining systems
   - Final verification
   - Collect metrics

---

## Configuration & Setup

### Initial Setup Wizard

Upon first launch:

1. **Create Admin Account**
   - Username
   - Password
   - Email (optional)

2. **Configure Settings**
   - Monitoring frequency
   - Data retention days
   - Alert thresholds
   - Dashboard preferences

3. **Add Agents**
   - Local agent (optional)
   - Remote agents (later)
   - Agent names and groups

4. **Enable Features**
   - Dashboard access
   - Email alerts
   - Report generation
   - Data retention

### Configuration Files

#### Main Configuration

Location: `%AppData%\SysTracker\config.json`

```json
{
  "port": 7777,
  "hostname": "127.0.0.1",
  "database": {
    "type": "sqlite",
    "path": "./data/systracker.db"
  },
  "jwt_secret": "your-secret-key",
  "monitoring": {
    "frequency": 5000,
    "retention_days": 90
  }
}
```

#### Environment Variables

Create `.env` file in installation directory:

```
PORT=7777
DATABASE_PATH=./data/systracker.db
JWT_SECRET=your-secret-key
NODE_ENV=production
```

### Network Configuration

#### Local-Only (Default)

```json
{
  "server": {
    "host": "127.0.0.1",
    "port": 7777
  }
}
```

#### Local Network Access

```json
{
  "server": {
    "host": "0.0.0.0",
    "port": 7777
  }
}
```

#### Remote Access (Secure)

1. Configure firewall rules
2. Use VPN or proxy
3. Set up SSL/TLS (advanced)
4. Update host address

### Firewall Configuration

#### Windows Firewall - Allow Port

```powershell
# Add inbound rule for SysTracker
New-NetFirewallRule -DisplayName "SysTracker" `
  -Direction Inbound `
  -Action Allow `
  -Protocol TCP `
  -LocalPort 7777 `
  -Program "C:\Program Files\SysTracker\systracker-server-win.exe"
```

#### Third-Party Firewall

Configure to allow:

- **Application:** systracker-server-win.exe
- **Protocol:** TCP
- **Port:** 7777 (default)
- **Direction:** Inbound/Outbound
- **Action:** Allow

---

## Agent Deployment

### Local Agent (Built-in)

1. Accessed via Dashboard → Add Agent
2. Automatically monitors host system
3. No separate installation required

### Remote Agent - Windows

#### Method 1: MSI Package

```powershell
msiexec /i SysTracker_Agent.msi /qn SERVERHOST=192.168.1.100
```

#### Method 2: Batch Script

1. Copy `agent/client_agent.js` to remote system
2. Copy `agent/package.json` to same directory
3. Run installation script:
   ```cmd
   npm install
   node client_agent.js --server http://serverip:7777
   ```

#### Method 3: PowerShell Deployment

```powershell
$ServerIP = "192.168.1.100"
$AgentPath = "C:\SysTracker\Agent"

# Create agent directory
New-Item -ItemType Directory -Path $AgentPath -Force

# Copy agent files
Copy-Item "\\fileserver\agent\*" -Destination $AgentPath -Recurse

# Install dependencies
cd $AgentPath
npm install

# Run agent
.\run-agent.bat
```

### Remote Agent - Linux

```bash
# Copy agent
scp client_agent.py user@linuxhost:~/systracker/

# Install dependencies
ssh user@linuxhost "pip install -r ~/systracker/requirements.txt"

# Run agent
ssh user@linuxhost "python ~/systracker/client_agent.py --server http://serverip:7777"
```

### Agent Auto-Start

#### Windows Agent Service

```cmd
# Convert agent to Windows Service
sc create SysTrackerAgent binPath= "C:\SysTracker\Agent\run-agent.bat"
sc start SysTrackerAgent
```

#### Linux Agent Systemd

```bash
# Create systemd service
sudo nano /etc/systemd/system/systracker-agent.service
```

```ini
[Unit]
Description=SysTracker Agent
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 /opt/systracker/client_agent.py
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable systracker-agent
sudo systemctl start systracker-agent
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: Port Already in Use

**Symptom:** "Error: Listen EADDRINUSE: address already in use :::7777"

**Solution:**

```powershell
# Find process using port 7777
netstat -ano | findstr :7777

# Kill process (replace PID)
taskkill /PID 1234 /F

# Or change port in config
# Edit config.json and change port to 7778
```

#### Issue: Dashboard Won't Load

**Symptom:** "Connection refused" or blank page

**Solution:**

```powershell
# Check if service is running
Get-Service SysTrackerSvc

# Start service if not running
Start-Service SysTrackerSvc

# Check logs
Get-EventLog System -Source SysTrackerSvc -Newest 5

# Firewall check
Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*SysTracker*" }
```

#### Issue: Agent Won't Connect

**Symptom:** Agent shows "Disconnected" or "Failed to connect"

**Solution:**

```powershell
# Check agent logs
Get-Content "C:\SysTracker\Agent\logs\agent.log" -Tail 20

# Verify server is running
Get-Service SysTrackerSvc

# Test connectivity
Test-NetConnection -ComputerName 192.168.1.100 -Port 7777

# Check firewall on both ends
New-NetFirewallRule -DisplayName "SysTracker Client" `
  -Direction Outbound `
  -Action Allow `
  -Protocol TCP `
  -RemotePort 7777
```

#### Issue: High Memory Usage

**Symptom:** SysTracker using > 500 MB RAM

**Solution:**

1. Reduce monitoring frequency:
   ```json
   "monitoring": { "frequency": 10000 }  // 10 seconds instead of 5
   ```

2. Reduce data retention:
   ```json
   "monitoring": { "retention_days": 30 }  // Keep 30 days instead of 90
   ```

3. Limit concurrent connections:
   ```json
   "server": { "maxConnections": 50 }
   ```

4. Restart service:
   ```powershell
   Restart-Service SysTrackerSvc
   ```

#### Issue: Antivirus Blocking Execution

**Symptom:** Error launching EXE, "File blocked" warning

**Solution:**

1. Add exception in antivirus:
   - Usually in Antivirus Settings → Exclusions
   - Add: `C:\Program Files\SysTracker\`

2. Unblock file properties:
   ```powershell
   Unblock-File -Path "C:\SysTracker\systracker-server-win.exe"
   ```

3. Check antivirus quarantine:
   - File may be in quarantine
   - Restore from quarantine
   - Re-run installation

---

## Uninstallation

### Service Uninstallation

```powershell
# Stop service
Stop-Service SysTrackerSvc -Force

# Remove service
Remove-Service SysTrackerSvc

# Or use sc command
sc.exe delete SysTrackerSvc
```

### Complete Removal

```powershell
# Stop service
Stop-Service SysTrackerSvc -Force

# Remove service
sc.exe delete SysTrackerSvc

# Delete installation directory
Remove-Item "C:\Program Files\SysTracker\" -Recurse -Force

# Delete user data (optional)
Remove-Item "$env:APPDATA\SysTracker" -Recurse -Force

# Remove startup shortcuts
Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\SysTracker*"
```

### Cleanup Registry

```powershell
# Remove registry entries (advanced, use with caution)
Remove-Item "HKCU:\Software\SysTracker" -Force
Remove-Item "HKLM:\Software\SysTracker" -Force
```

---

## Verification Checklist

After deployment, verify:

- [ ] Service starts automatically
- [ ] Dashboard loads at http://localhost:7777
- [ ] Login works with configured credentials
- [ ] System dashboard shows metrics
- [ ] Agents can connect
- [ ] Alerts work correctly
- [ ] Reports generate
- [ ] Data persists across restarts
- [ ] Performance is acceptable
- [ ] No errors in logs

---

## Support and Documentation

### Additional Resources

- **GitHub:** https://github.com/Redwan002117/SysTracker
- **Issues:** Report problems via GitHub Issues
- **Discussions:** Community help available
- **Wiki:** Detailed guides and FAQ

### Getting Help

1. Check error logs in `%AppData%\SysTracker\logs\`
2. Search existing GitHub issues
3. Post new issue with:
   - Windows version
   - Installation method used
   - Exact error message
   - Steps to reproduce
   - System specifications

---

**SysTracker v3.1.2 - Complete Deployment Guide**  
**Updated: February 21, 2026**  
**Status:** ✅ Production Ready
