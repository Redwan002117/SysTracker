# SysTracker Agent Installation - Troubleshooting Guide

## Issue: "Can't find the app in C drive"

### Root Cause
The SysTracker Agent installation scripts had **inconsistent installation paths**, causing confusion about where the application was actually installed.

### Updated Installation Locations

#### ✓ STANDARD LOCATION (NOW UNIFIED)
All new installations will use:
```
C:\Program Files\SysTracker Agent\
```

**Key Files:**
- `SysTracker_Agent.exe` - Main executable
- `config.json` - Configuration file with server URL
- Additional runtime files

#### Legacy Locations (If using old installer)
- `C:\Program Files\SysTrackerAgent\` (without space) - **DEPRECATED**
- `C:\Program Files\SysTracker Agent\` (with space) - **CURRENT**

#### MSIX Package Installation (If installed via MSIX)
If you installed the `.msix` package, it will be in:
```
C:\Program Files\WindowsApps\Redwan002117.SysTrackerAgent_2.0.0.0_x64_<hash>\
```

NOTE: MSIX packages install to an isolated location and cannot be accessed directly through normal file explorer for security reasons.

---

## How to Locate Your Installation

### Quick Method: Use the App Locator Script
1. Open PowerShell as Administrator
2. Navigate to the SysTracker agent directory
3. Run the locator script:
   ```powershell
   .\FIND_APP_INSTALLATION.ps1
   ```

This will automatically search for the application and show you:
- ✓ Standard installation directory
- ✓ Legacy installation directories
- ✓ MSIX package installations
- ✓ Scheduled tasks status
- ✓ Windows services status
- ✓ Running processes

### Manual Search Method

#### 1. Check Standard Installation
Open File Explorer and navigate to:
```
C:\Program Files\SysTracker Agent\
```

#### 2. Check Task Scheduler
If the app is running as a scheduled task:
1. Press `Win + R`
2. Type: `taskschd.msc`
3. Search for: `SysTrackerAgent`

#### 3. Check Services
If the app is running as a Windows service:
1. Press `Win + R`
2. Type: `services.msc`
3. Look for: `SysTrackerAgent`

#### 4. Check Running Processes
Open Task Manager and look for:
- `SysTracker_Agent.exe`
- Note the working directory

#### 5. Check Logs and Configuration
If application was installed, config file should be at:
```
C:\Program Files\SysTracker Agent\config.json
```

---

## What to Check

### ✓ Verify Installation Success
```powershell
# PowerShell as Administrator
$installPath = "C:\Program Files\SysTracker Agent"
if (Test-Path $installPath) {
    Write-Host "Installation found at: $installPath"
    Get-ChildItem $installPath
} else {
    Write-Host "Installation not found!"
}
```

### ✓ Verify Exe Exists
```powershell
$exe = "C:\Program Files\SysTracker Agent\SysTracker_Agent.exe"
if (Test-Path $exe) {
    Write-Host "✓ Executable found"
} else {
    Write-Host "✗ Executable NOT found - reinstall required"
}
```

### ✓ Verify Configuration
```powershell
$config = "C:\Program Files\SysTracker Agent\config.json"
if (Test-Path $config) {
    Get-Content $config | ConvertFrom-Json
} else {
    Write-Host "Config file missing!"
}
```

### ✓ Check if Agent is Running
```powershell
Get-Process -Name "SysTracker_Agent" -ErrorAction SilentlyContinue
```

---

## How to Fix: Reinstall the Application

### Option 1: Using the Standard Installer (Recommended)
```powershell
# Run as Administrator
cd C:\path\to\agent
.\install_agent.ps1 -ServerURL "http://YOUR_SERVER_IP:7777"
```

### Option 2: Using the Legacy Installer
```powershell
# Run as Administrator
cd C:\path\to\agent\legacy
.\install.ps1
```

### Option 3: Manual Installation
If scripts fail, install manually:

1. **Create Directory:**
   ```powershell
   New-Item -ItemType Directory -Path "C:\Program Files\SysTracker Agent" -Force
   ```

2. **Copy Files:**
   ```powershell
   Copy-Item ".\SysTracker_Agent.exe" "C:\Program Files\SysTracker Agent\"
   Copy-Item ".\config.json" "C:\Program Files\SysTracker Agent\"
   ```

3. **Update Config:**
   Edit `C:\Program Files\SysTracker Agent\config.json` and set your server URL

4. **Register as Service/Task:**
   - **Option A - As Service:**
     ```powershell
     cd "C:\Program Files\SysTracker Agent"
     .\SysTracker_Agent.exe --startup auto install
     Start-Service -Name "SysTrackerAgent"
     ```
   
   - **Option B - As Scheduled Task:**
     ```powershell
     $Trigger = New-ScheduledTaskTrigger -AtStartup
     $Action = New-ScheduledTaskAction -Execute "C:\Program Files\SysTracker Agent\SysTracker_Agent.exe"
     Register-ScheduledTask -TaskName "SysTrackerAgent" -Trigger $Trigger -User "SYSTEM" -Action $Action -Force
     Start-ScheduledTask -TaskName "SysTrackerAgent"
     ```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Access Denied" during installation | Run PowerShell as Administrator |
| Files missing after installation | Reinstall using the installer script |
| Application crashes on startup | Check config.json is valid JSON, check server URL is correct |
| MSIX installation appears empty | MSIX packages are read-only; this is normal |
| App not starting at boot | Verify scheduled task or service is enabled in services.msc |
| Multiple installations found | Uninstall extra copies and use one primary location |

---

## Prevention: Standardized Installation Going Forward

✓ **All scripts now use the same installation path:**
```
C:\Program Files\SysTracker Agent\
```

✓ **No more inconsistency between versions**

✓ **Always check this location first**

---

## Additional Resources

- **Installation Scripts:** See `agent/install_agent.ps1` and `agent/legacy/install.ps1`
- **App Locator Tool:** Run `agent/FIND_APP_INSTALLATION.ps1` to search automatically
- **Configuration:** Edit `C:\Program Files\SysTracker Agent\config.json`
- **Logs:** Check Windows Event Viewer → Windows Logs → Application & Services Logs

---

## Questions?

If the application still cannot be found after checking all these locations:
1. Check Windows Event Viewer for installation errors
2. Review the installation script output
3. Try manual installation using the steps in "How to Fix: Reinstall the Application"
