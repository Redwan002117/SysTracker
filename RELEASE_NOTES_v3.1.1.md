# SysTracker v3.1.1 Release Notes

**Release Date**: February 20, 2026  
**Status**: ✅ Production Ready (Patch Release)  
**Type**: Maintenance & Troubleshooting Improvement  
**Tag**: v3.1.1

---

## 🎯 Overview

v3.1.1 is a critical maintenance patch that addresses agent installation path inconsistencies and provides comprehensive troubleshooting tools. This patch resolves issues where users could not locate their SysTracker Agent installations and provides automated diagnostic capabilities.

---

## 🐛 Critical Bug Fixed

### Agent Installation Path Inconsistency
**Issue**: The SysTracker Agent installation scripts used conflicting paths, causing confusion about where the application was actually installed.

**Root Cause**: 
- `install_agent.ps1` installed to: `C:\Program Files\SysTrackerAgent` (no space)
- `legacy/install.ps1` installed to: `C:\Program Files\SysTracker Agent` (with space)
- MSIX packages installed to: `C:\Program Files\WindowsApps\Redwan002117.SysTrackerAgent_*`

This inconsistency meant users couldn't reliably find their installations after setup.

**Solution**: 
- ✅ Standardized all installers to use: `C:\Program Files\SysTracker Agent\`
- ✅ Added consistency checks across all installation methods
- ✅ Updated both current and legacy installer scripts

**User Impact**: 
- Users can now reliably find their agent installation in `C:\Program Files\SysTracker Agent\`
- Eliminates "app not found" support tickets
- All new installations follow the same location standard

---

## ✨ New Diagnostic Tools

### 1. FIND_APP_INSTALLATION.ps1 - Installation Locator

**Purpose**: Comprehensive diagnostic script that automatically finds all SysTracker installations on a computer.

**Features**:
- ✓ Searches standard installation directory
- ✓ Searches legacy installation directories
- ✓ Searches for MSIX package installations
- ✓ Checks Windows Scheduled Tasks for SysTrackerAgent
- ✓ Checks Windows Services for SysTrackerAgent
- ✓ Checks running processes for SysTracker_Agent.exe
- ✓ Performs global disk search if app not found elsewhere
- ✓ Color-coded output for easy interpretation
- ✓ Provides specific file paths and status information

**Usage**:
```powershell
# Run as Administrator
.\agent\FIND_APP_INSTALLATION.ps1
```

**Output Example**:
```
[1] Checking Standard Installation Directory...
✓ FOUND: C:\Program Files\SysTracker Agent

[5] Checking Scheduled Tasks...
✓ FOUND Scheduled Task: 'SysTrackerAgent'
  Task Path: C:\Program Files\SysTracker Agent\SysTracker_Agent.exe

[7] Checking Running Processes...
✓ FOUND Running Process: 'SysTracker_Agent'
  Process ID: 4532
  Memory: 45.23 MB

SUMMARY: Found 1 installation(s):
[1] Standard Installation
     Path: C:\Program Files\SysTracker Agent
```

### 2. AGENT_INSTALLATION_TROUBLESHOOTING.md - Complete Guide

**Purpose**: Comprehensive troubleshooting and installation documentation for end users.

**Contents**:
- All possible installation locations (standard, legacy, MSIX)
- How to locate installations manually
- Step-by-step verification procedures
- Manual installation instructions for advanced users
- Common issues and their solutions
- Prevention guidance for future installations

**Sections**:
1. Root cause explanation
2. Updated installation locations
3. How to locate your installation (automated and manual)
4. What to check (verification commands)
5. How to fix (reinstall procedures)
6. Common issues & solutions table
7. Prevention and best practices

---

## 🔧 Technical Changes

### Modified Files

**[agent/install_agent.ps1](agent/install_agent.ps1)**
- Line 8: Changed `$InstallDir = "C:\Program Files\SysTrackerAgent"` 
- To: `$InstallDir = "C:\Program Files\SysTracker Agent"` (standardized with space)
- Added comment: "Standardized installation directory"

**[agent/legacy/install.ps1](agent/legacy/install.ps1)**
- Line 11: Ensured `$InstallDir = "C:\Program Files\SysTracker Agent"` matches current standard
- Added comment: "STANDARDIZED: All versions now install to the same location"

### New Files

**[agent/FIND_APP_INSTALLATION.ps1](agent/FIND_APP_INSTALLATION.ps1)**
- ~210 lines of diagnostic PowerShell code
- Comprehensive error handling and fallback logic
- Color-coded output for different status types
- Detailed file listings and process information

**[AGENT_INSTALLATION_TROUBLESHOOTING.md](AGENT_INSTALLATION_TROUBLESHOOTING.md)**
- ~230 lines of comprehensive documentation
- Step-by-step troubleshooting procedures
- Code examples for manual verification
- Common issues and solutions table
- Reinstallation procedures for all methods

**[CHANGELOG.md](CHANGELOG.md)**
- Added v3.1.1 section at top with all changes documented

---

## 📋 Installation Path Reference

### Standard Location (All New Installations)
```
C:\Program Files\SysTracker Agent\
├── SysTracker_Agent.exe        (Main executable)
├── config.json                 (Configuration file)
└── [other runtime files]
```

### Accessing from File Explorer
```
1. Open File Explorer
2. Navigate to: C:\Program Files\SysTracker Agent\
3. All agent files are located here
```

### Checking via PowerShell
```powershell
# Verify installation
$path = "C:\Program Files\SysTracker Agent"
Get-ChildItem $path

# Check if running
Get-Process -Name "SysTracker_Agent" -ErrorAction SilentlyContinue
```

---

## ✅ Verification Checklist

After installing v3.1.1:

- [ ] Run `FIND_APP_INSTALLATION.ps1` to verify installation location
- [ ] Check that app is found in `C:\Program Files\SysTracker Agent\`
- [ ] Verify `SysTracker_Agent.exe` is present in the directory
- [ ] Confirm `config.json` exists and contains correct server URL
- [ ] Check Task Scheduler for `SysTrackerAgent` task or Windows Services
- [ ] Verify agent process appears in Task Manager
- [ ] Check server receives telemetry from agent

---

## 🔄 Migration from Previous Versions

If upgrading from v3.1.0 or earlier:

1. **Old installation may still exist** in legacy location:
   - Run `FIND_APP_INSTALLATION.ps1` to check
   - If found in `C:\Program Files\SysTrackerAgent`, consider uninstalling the old version

2. **Recommended**: Fresh install v3.1.1 using updated installer
   ```powershell
   .\agent\install_agent.ps1 -ServerURL "http://YOUR_SERVER_IP:7777"
   ```

3. **Optional**: Keep old installation if it's working, v3.1.1 maintains backward compatibility

---

## 🔍 Troubleshooting

### Issue: App still not found after installation
**Solution**: 
1. Run `FIND_APP_INSTALLATION.ps1` to check all locations
2. Review the output for installation status
3. Check Windows Event Viewer for installation errors

### Issue: Multiple installations found
**Solution**:
1. Keep only one active installation
2. Uninstall old versions and reinstall v3.1.1
3. Update scheduled task or service to point to new location

### Issue: Installation script fails
**Solution**:
1. Ensure running PowerShell as Administrator
2. Run manual installation from troubleshooting guide
3. Check network connectivity to server if downloading files

---

## 📦 Release Contents

```
v3.1.1/
├── CHANGELOG.md                        (Updated)
├── RELEASE_NOTES_v3.1.1.md            (This file)
├── AGENT_INSTALLATION_TROUBLESHOOTING.md (New)
├── agent/
│   ├── install_agent.ps1              (Updated - standardized path)
│   ├── legacy/install.ps1             (Updated - standardized path)
│   └── FIND_APP_INSTALLATION.ps1      (New - diagnostic tool)
├── [all other v3.1.0 components]
└── [server, dashboard components]
```

---

## 📞 Support & Feedback

If you encounter issues with agent installation:

1. **Check Documentation**: See AGENT_INSTALLATION_TROUBLESHOOTING.md
2. **Run Diagnostic**: Execute FIND_APP_INSTALLATION.ps1
3. **Review Logs**: Check Windows Event Viewer and agent config
4. **Reinstall**: Use the standardized v3.1.1 installer

---

## 🎉 What's Next

- v3.2.0 (planned): Enhanced agent capabilities and dashboard features
- Agent auto-update mechanism for easier future upgrades
- Additional diagnostic tools for advanced troubleshooting

---

## Version History

| Version | Date | Type | Focus |
|---------|------|------|-------|
| v3.1.1 | 2026-02-20 | Patch | Installation fixes & diagnostics |
| v3.1.0 | 2026-02-20 | Major | System integration & robustness |
| v3.0.0 | 2026-02-15 | Major | Dashboard stability |
| v2.8.7 | 2026-02-10 | Patch | Agent build fixes |

---

**Thank you for using SysTracker!**

For more information, visit the [project repository](https://github.com/Redwan002117/SysTracker).
