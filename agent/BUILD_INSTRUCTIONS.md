# SysTracker Agent Build Instructions

## Overview
The SysTracker agent is a Windows-native Python application that must be built on a Windows system. The import errors you see in the development environment are **expected** - they will resolve during the build process on Windows.

## Prerequisites

### Windows Build Environment
- Windows 10/11 or Windows Server 2016+
- Python 3.8+ (64-bit recommended)
- Administrator privileges

### Required Python Packages
```bash
pip install psutil requests python-socketio pywin32 pyinstaller
```

**Package Purposes:**
- `psutil` - System monitoring (CPU, memory, disk, network)
- `requests` - HTTP communication with server
- `python-socketio` - Real-time bidirectional communication
- `pywin32` - Windows-specific APIs (event logs, services)
- `pyinstaller` - Package Python app as standalone executable

## Build Process

### Step 1: Prepare Build Environment
```bash
# Clone the repository or copy agent folder to Windows machine
cd agent

# Install dependencies
pip install -r requirements.txt

# Verify installation
python -c "import psutil, requests, socketio, win32api; print('All imports OK')"
```

### Step 2: Test the Agent (Optional but Recommended)
```bash
# Set test mode to avoid admin elevation
set SYSTRACKER_TEST_MODE=1

# Run agent in console mode
python client_agent.py

# Verify:
# - No import errors
# - Successfully connects to server
# - Metrics collection working
# - Update check succeeds
```

### Step 3: Build Executable
```bash
# Option A: Use existing spec file
pyinstaller SysTracker_Agent.spec

# Option B: Create new spec file (if needed)
pyinstaller --onefile --name SysTracker_Agent --icon=icon.ico client_agent.py
```

**Build Output:**
- Executable: `dist/SysTracker_Agent.exe`
- Build logs: `build/` folder
- Spec file: `SysTracker_Agent.spec`

### Step 4: Verify Build
```bash
# Check file exists and size is reasonable (>10MB)
dir dist\SysTracker_Agent.exe

# Test run (as admin)
cd dist
SysTracker_Agent.exe

# Check logs
type C:\SysTracker\sys_tracker_agent.log
```

## Configuration

### agent_config.json
Create/verify this file in the same directory as the executable:
```json
{
  "api_url": "http://your-server:5000/api",
  "machine_id": "auto-generated-on-first-run",
  "version": "2.8.0",
  "update_channel": "stable"
}
```

## Installation & Deployment

### Manual Installation
1. Copy `SysTracker_Agent.exe` to `C:\SysTracker\`
2. Copy `agent_config.json` to `C:\SysTracker\`
3. Run as Administrator
4. Agent will auto-start and register with server

### Service Installation (Recommended)
```powershell
# Using NSSM (Non-Sucking Service Manager)
nssm install SysTrackerAgent "C:\SysTracker\SysTracker_Agent.exe"
nssm set SysTrackerAgent AppDirectory "C:\SysTracker"
nssm set SysTrackerAgent DisplayName "SysTracker Agent"
nssm set SysTrackerAgent Description "System monitoring agent for SysTracker"
nssm set SysTrackerAgent Start SERVICE_AUTO_START
nssm start SysTrackerAgent
```

## Safety Features Implemented

### 1. **SHA256 Hash Verification**
- Server calculates hash on upload
- Agent verifies downloaded file matches expected hash
- Prevents corrupted or tampered updates

### 2. **File Size Validation**
- Agent checks downloaded file size matches expected size
- Catches incomplete downloads before installation

### 3. **Automatic Backup**
- Current version saved as `SysTracker_Agent_Backup.exe`
- Can be manually restored if needed

### 4. **Smart Rollback**
- Updater batch script verifies new process started
- Automatically restores backup if update fails
- Logs all actions for troubleshooting

### 5. **Process Isolation**
- Update process runs detached from agent
- No file locks prevent updates
- Graceful shutdown before replacement

## Auto-Update Flow

```
1. Agent polls server every 60 minutes
   └─> GET /api/agent/check-update

2. If update available:
   ├─> Download new version to SysTracker_Agent_Update.exe
   ├─> Verify file size matches expected
   ├─> Calculate SHA256 hash
   ├─> Compare hash with server's hash
   └─> If verification passes:
       ├─> Backup current version
       ├─> Generate updater batch script
       ├─> Launch updater (detached)
       └─> Exit agent process

3. Updater batch script:
   ├─> Wait 3 seconds for agent to exit
   ├─> Replace old exe with new exe
   ├─> Start new agent process
   ├─> Wait 5 seconds for process to start
   ├─> Verify new process is running
   ├─> If successful: cleanup temp files
   └─> If failed: restore backup, restart old version

4. New agent starts:
   ├─> Reads config
   ├─> Connects to server
   └─> Resumes monitoring
```

## Troubleshooting

### Import Errors in Dev Environment
**Status:** Expected - agent requires Windows-specific libraries not available in Linux dev container.
**Resolution:** Build on Windows with pywin32 installed.

### Agent Won't Build on Windows
- Verify Python 64-bit installed: `python -c "import struct; print(struct.calcsize('P')*8)"`
- Check all dependencies installed: `pip list | findstr "psutil requests socketio pywin32"`
- Try with admin privileges
- Clear build cache: `rmdir /s build dist` then rebuild

### Update Downloaded But Not Applied
- Check logs at `C:\SysTracker\sys_tracker_agent.log`
- Look for "Hash mismatch" or "Size mismatch" errors
- Verify agent has write permissions to `C:\SysTracker\`
- Check if antivirus blocked updater script

### Updater Failed and Backup Not Restored
**Manual Recovery:**
```batch
cd C:\SysTracker
taskkill /F /IM SysTracker_Agent.exe
copy SysTracker_Agent_Backup.exe SysTracker_Agent.exe
SysTracker_Agent.exe
```

### Agent Offline After Update
- Check Windows Event Viewer → Application logs
- Look for crash dumps
- Verify new version compatible with server
- Roll back to backup version

## Testing the Update Mechanism

### Controlled Test Environment
1. Set up test server with old agent version
2. Upload new agent version through dashboard Settings → Agent Management
3. Verify hash displayed in upload confirmation
4. Monitor agent logs during update window
5. Confirm agent reconnects with new version

### Pre-Production Checklist
- [ ] Test update on isolated machine first
- [ ] Verify backup created correctly
- [ ] Confirm rollback works if service stopped
- [ ] Check logs for errors
- [ ] Validate new version reports correct version number
- [ ] Test with antivirus/firewall enabled
- [ ] Document rollback procedure for team

## Version Management

### Semantic Versioning
Agent uses semantic versioning: `MAJOR.MINOR.PATCH`
- Example: `2.8.0` → `2.8.1` (auto-update)
- Example: `2.8.1` → `3.0.0` (major update, may require manual intervention)

### Version Comparison Logic
```python
def compareVersions(v1, v2):
    parts1 = v1.split('.')
    parts2 = v2.split('.')
    for i in range(max(len(parts1), len(parts2))):
        num1 = int(parts1[i]) if i < len(parts1) else 0
        num2 = int(parts2[i]) if i < len(parts2) else 0
        if num1 > num2: return 1
        if num1 < num2: return -1
    return 0
```

## Security Considerations

### File Integrity
- SHA256 hashing ensures file not tampered with
- Server stores hash in database, agent compares before installation
- Any mismatch = update aborted

### Execution Safety
- Agent requires admin privileges (needed for system monitoring)
- Updater runs as same user (inherits permissions)
- No external code execution (only self-updates)

### Network Security
- Updates downloaded over configured API URL
- Support for HTTPS recommended for production
- Server validates admin JWT token for upload endpoint

## Performance Impact

### Update Check
- Frequency: Every 60 minutes (configurable via `UPDATE_CHECK_INTERVAL`)
- Network usage: ~500 bytes (metadata only)
- CPU impact: Negligible (<0.1%)

### Update Download & Install
- Duration: ~10-30 seconds (depends on file size and network)
- Downtime: ~5-10 seconds (agent offline during replacement)
- Rollback if failed: +5-10 seconds

### Monitoring Impact
- CPU: 1-3% average
- Memory: 30-50MB
- Network: ~1-5KB every 30 seconds (metric uploads)
- Disk: Minimal (logs rotate at 10MB)

## Support & Maintenance

### Log Locations
- Agent logs: `C:\SysTracker\sys_tracker_agent.log`
- Updater logs: `C:\SysTracker\updater.log` (created by batch script)
- Windows Event Log: Application → Source: SysTracker

### Backup Management
- Only last version kept as backup
- Backup overwritten on each successful update
- Consider external backup strategy for critical deployments

### Monitoring Update Status
- Dashboard shows agent version per machine
- Last update timestamp in database
- Server logs upload events with version numbers

## Advanced Configuration

### Environment Variables
```bash
# Disable auto-updates (for testing)
set SYSTRACKER_DISABLE_UPDATES=1

# Use beta update channel
set SYSTRACKER_UPDATE_CHANNEL=beta

# Custom update check interval (seconds)
set SYSTRACKER_UPDATE_INTERVAL=1800
```

### Manual Version Override
Edit `agent_config.json`:
```json
{
  "version": "2.8.0",
  "disable_auto_update": false,
  "update_check_interval": 3600
}
```

## Known Limitations

1. **Windows Only**: Agent designed for Windows (uses win32 APIs)
2. **Single Backup**: Only most recent version kept as backup
3. **No Delta Updates**: Full executable downloaded each time
4. **Admin Required**: Needs elevated privileges for system monitoring
5. **Same-Major Updates**: Auto-updates within same major version only

## Future Enhancements

- [ ] Delta/patch updates to reduce download size
- [ ] Multiple backup versions (rollback to n-1, n-2, etc.)
- [ ] Staged rollouts (update subset of machines first)
- [ ] Update windows (only update during specified hours)
- [ ] Cross-platform support (Linux, macOS agents)

---

**Last Updated:** January 2025  
**Agent Version:** 2.8.0  
**Build Environment:** Windows 10+ with Python 3.8+
