# SysTracker Installation Validation Guide

## Overview

This guide provides comprehensive post-installation validation procedures for SysTracker Server across Windows, Linux, and macOS platforms. Use these validation scripts to verify that your installation is complete and functioning correctly.

## Quick Start

### Windows
```powershell
# Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
.\validate_windows_install.ps1
```

### Linux/macOS (Auto-detect)
```bash
chmod +x validate_install.sh
./validate_install.sh
```

### Manual Platform Selection

**Linux:**
```bash
chmod +x validate_linux_install.sh
./validate_linux_install.sh [service-name] [port] [install-dir]
```

**macOS:**
```bash
chmod +x validate_macos_install.sh
./validate_macos_install.sh [service-name] [port] [install-dir]
```

## Validation Scripts

### 1. Windows: `validate_windows_install.ps1`

**Platform:** Windows 10/11, Server 2019+  
**Requires:** PowerShell 5.0+, Administrator privileges  
**Default Port:** 7777  
**Default Service Name:** systracker  

**Test Coverage (14 Categories):**

| Test | Purpose | Pass Criteria |
|------|---------|---------------|
| **Admin Privileges** | Ensures admin elevation | Running as Administrator |
| **NSSM Installation** | Verifies service manager | NSSM.exe found in PATH |
| **Service Registration** | Check Windows Service exists | Get-Service returns service |
| **Service Running** | Verify process active | Service status = "Running" |
| **Auto-Start Config** | Check startup on boot | StartType = "Automatic" |
| **Port Listening** | Verify network binding | netstat shows port listening |
| **Dashboard Access** | Test HTTP connectivity | HTTP 200 response at localhost:port |
| **API Health** | Validate API endpoint | /api/auth/status returns 200 |
| **Directory Structure** | Check all folders created | data/, logs/, uploads/, dashboard-dist/ exist |
| **Executable File** | Verify EXE presence | systracker-server-win.exe exists |
| **Configuration File** | Check .env setup | .env file readable with PORT set |
| **Database File** | Verify SQLite creation | systracker.db exists and has data |
| **Log Files** | Check logging working | app.log created with entries |
| **Memory Usage** | Monitor process memory | Memory consumption < 1GB |
| **Network Connectivity** | Test external connectivity | DNS resolution working |

**Output Example:**
```
[14:32:15] ✓ PASS  Admin Privileges Check
[14:32:15] ✓ PASS  NSSM Installation
[14:32:15] ✓ PASS  Service Registered (systracker)
[14:32:15] ✓ PASS  Service Running
[14:32:15] ✓ PASS  Auto-Start Enabled
[14:32:17] ✓ PASS  Port 7777 Listening
[14:32:19] ✓ PASS  Dashboard Accessible (HTTP 200)
[14:32:21] ✓ PASS  API Health Check Passed
[14:32:21] ✓ PASS  Directory: data/
[14:32:21] ✓ PASS  Directory: logs/
[14:32:22] ✓ PASS  Directory: uploads/
[14:32:22] ✓ PASS  Directory: dashboard-dist/
[14:32:22] ✓ PASS  Executable File Present
[14:32:22] ✓ PASS  Configuration File Exists
[14:32:22] ✓ PASS  Database File Found
[14:32:22] ✓ PASS  Log Files Created
[14:32:22] ✓ PASS  Memory Usage Normal (156 MB)
[14:32:22] ✓ PASS  Network Connectivity

═════════════════════════════════════════════════════════════════
Validation Result: PASSED (14/14 tests)
Success Rate: 100%
═════════════════════════════════════════════════════════════════
```

---

### 2. Linux: `validate_linux_install.sh`

**Platform:** Ubuntu 20+, Debian 11+, CentOS 8+, RHEL 8+  
**Requires:** bash, curl, pgrep, lsof  
**Default Port:** 7777  
**Service Support:** systemd  

**Test Coverage (14 Categories):**

| Test | Purpose | Pass Criteria |
|------|---------|---------------|
| **User Privileges** | Check if need elevation | Running as root or with sudo |
| **Node.js Installation** | Verify Node.js present | node command available |
| **npm Installation** | Verify npm present | npm command available |
| **Port Available** | Check port binding | Port 7777 listening |
| **Application Running** | Check process active | Node.js process found or Docker running |
| **Database** | Verify SQLite file | systracker.db exists with data |
| **Configuration** | Check .env setup | .env file readable |
| **Dashboard** | Test web accessibility | HTTP 200 response |
| **API Endpoint** | Validate API health | /api/auth/status responds |
| **Logs** | Check logging setup | app.log exists with entries |
| **Directory Structure** | Verify all folders | data/, logs/, uploads/ present |
| **Permissions** | Test write access | data/ directory writable |
| **systemd Service** | Check systemd integration | Service listed and active |
| **Docker Status** | Check container mode | Container running if dockerized |

**Usage:**
```bash
# Standard usage
./validate_linux_install.sh

# Custom service name and port
./validate_linux_install.sh my-systracker 8080 /opt/systracker
```

**Output Example:**
```
╔═════════════════════════════════════════╗
║  SysTracker - Installation Validation   ║
╚═════════════════════════════════════════╝
Service: systracker
Port: 7777
Location: /opt/systracker

1. USER PRIVILEGES
  ⚠ WARNING  Not running as root
         Some tests may require sudo

2. NODE.JS INSTALLATION
  ✓ PASS  Node.js installed
         Version: v18.19.0

3. NPM INSTALLATION
  ✓ PASS  npm installed
         Version: 10.2.3
...
═════════════════════════════════════════
VALIDATION SUMMARY
═════════════════════════════════════════
Passed: 12 / 14 tests (86%)
⚠ MOST TESTS PASSED - Installation working with minor issues
```

---

### 3. macOS: `validate_macos_install.sh`

**Platform:** macOS 10.15+, macOS Monterey+, macOS Ventura+  
**Requires:** bash, curl, pgrep, lsof  
**Service Support:** launchd  

**Test Coverage (17 Categories):**

| Test | Purpose | Pass Criteria |
|------|---------|---------------|
| **User Privileges** | Check if need elevation | Can access launchd configs |
| **Node.js Installation** | Verify Node.js present | node command available |
| **npm Installation** | Verify npm present | npm command available |
| **Homebrew** | Check package manager | brew command available (optional) |
| **Port Available** | Check port binding | Port 7777 in use |
| **Application Running** | Check process active | Node.js process found |
| **launchd Service** | Check service registration | Plist file in ~/Library/LaunchAgents/ |
| **Database** | Verify SQLite file | systracker.db exists |
| **Configuration** | Check .env setup | .env file readable |
| **Dashboard** | Test web accessibility | HTTP 200 response |
| **API Endpoint** | Validate API health | /api/auth/status responds |
| **Logs** | Check logging setup | app.log exists |
| **Directory Structure** | Verify all folders | data/, logs/, uploads/ present |
| **Permissions** | Test write access | data/ directory writable |
| **Docker Support** | Check Docker if present | Docker and containers optional |
| **Xcode Tools** | Check dev environment | Command Line Tools present |
| **System Resources** | Monitor memory usage | Memory < 1GB, sufficient RAM available |

**Usage:**
```bash
# Standard usage
./validate_macos_install.sh

# Custom configuration
./validate_macos_install.sh systracker 7777 ~/systracker
```

**Service Management Examples:**
```bash
# Start service
launchctl start com.systracker

# Stop service
launchctl stop com.systracker

# View logs
log show --predicate 'process contains "systracker"' --level debug

# Check service status
launchctl list | grep systracker
```

---

### 4. Cross-Platform: `validate_install.sh`

**Auto-Detection Script** - Detects OS and runs appropriate validation  

**Supported Platforms:**
- Windows (via PowerShell)
- Linux (via bash)
- macOS (via bash)

**Usage:**
```bash
# Automatic platform detection
./validate_install.sh

# With custom parameters
./validate_install.sh systracker 7777 /path/to/install
```

**How It Works:**
1. Detects OS using `uname` command
2. Locates appropriate validation script
3. Executes platform-specific validation
4. Returns exit code (0=pass, 1=fail)

---

## Interpretation Guide

### Success Criteria

**✓ PASS (Green):** Test executed successfully
```
✓ PASS  API Health Check
         HTTP Response: 200
```

**✗ FAIL (Red):** Test did not pass - requires action
```
✗ FAIL  Port 7777 Listening
         Application may not be running
```

**⚠ INFO/WARNING (Yellow):** Non-critical information
```
⚠ INFO  Docker installed but container not running
```

### Score Interpretation

| Success Rate | Status | Action |
|---|---|---|
| **100%** | ✓ Ready | Deployment complete, no action needed |
| **80-99%** | ✓ Mostly OK | Check warnings, likely functional |
| **60-79%** | ⚠ Issues | Investigate failures before production |
| **<60%** | ✗ Problem | Installation incomplete or broken |

---

## Troubleshooting

### Windows Issues

**Admin Privilege Error**
```powershell
# Re-run with administrator rights
# Right-click PowerShell → Run as Administrator
```

**NSSM Not Found**
```powershell
# Install NSSM
# Download from: https://nssm.cc/download
# Add to PATH or copy to Windows\System32
```

**Port 7777 Not Listening**
```powershell
# Check service status
Get-Service systracker

# View service logs
Get-EventLog -LogName System -Source "systracker"

# Manually start application
.\systracker-server-win.exe --port 7777
```

### Linux Issues

**Permission Denied**
```bash
# Run with elevated privileges
sudo ./validate_linux_install.sh

# Or configure passwordless sudo for specific commands
```

**Node.js Not Found**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or use nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
nvm install 18
```

**Service Not Running**
```bash
# Check systemd status
systemctl status systracker

# Start service
sudo systemctl start systracker

# View logs
sudo journalctl -u systracker -n 50 -f
```

### macOS Issues

**launchd Service Not Loading**
```bash
# Check plist syntax
plutil -lint ~/Library/LaunchAgents/com.systracker.plist

# Reload service
launchctl load ~/Library/LaunchAgents/com.systracker.plist

# View recent logs
log show --predicate 'process contains "systracker"' --level debug --last 1h
```

**Port Already in Use**
```bash
# Check what's using the port
lsof -i :7777

# Kill the process if needed
kill -9 <PID>

# Or use different port in .env
PORT=7778
```

**Memory Issues**
```bash
# Monitor memory usage
ps aux | grep server

# If memory high, restart service
launchctl stop com.systracker
launchctl start com.systracker
```

---

## Performance Benchmarks

### Baseline Expectations

| Metric | Expected | Warning |
|--------|----------|---------|
| **Startup Time** | <5 seconds | >10 seconds |
| **Memory Usage** | 150-300 MB | >1 GB |
| **CPU Usage** (idle) | <5% | >20% |
| **Dashboard Load** | <1 second | >3 seconds |
| **API Response** | <100ms | >500ms |
| **CPU Usage** (query) | 10-30% | >80% |

### Monitoring Tools

**Windows:**
```powershell
# Real-time monitoring
Get-Process systracker-server-win | Select-Object -Property *,@{N="MemoryMB";E={$_.WorkingSet/1MB}} | Format-Table

# Performance counter
Get-Counter "\Process(systracker*)\% Processor Time"
```

**Linux:**
```bash
# Monitor process
watch -n 1 'ps aux | grep server.js'

# Top-like view
top -p $(pgrep -f server.js)

# Memory tracking
free -h && echo "---" && ps aux | grep server.js
```

**macOS:**
```bash
# Activity Monitor (GUI)
open -a "Activity Monitor"

# Command line
ps aux | grep server | grep -v grep

# Real-time monitoring
log stream --predicate 'process contains "systracker"'
```

---

## Automated Testing

### Continuous Integration

Add to your CI/CD pipeline:

```bash
# Before deployment
./validate_install.sh

# Check exit code
if [ $? -eq 0 ]; then
    echo "Installation valid, proceeding..."
else
    echo "Installation validation failed"
    exit 1
fi
```

### Scheduled Validation

**Linux (cron):**
```bash
# Run daily health check at 2 AM
0 2 * * * /opt/systracker/validate_linux_install.sh >> /var/log/systracker-validation.log 2>&1
```

**macOS (launchd):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.systracker.validate</string>
    <key>ProgramArguments</key>
    <array>
        <string>/path/to/validate_macos_install.sh</string>
    </array>
    <key>StartInterval</key>
    <integer>86400</integer>
    <key>StandardOutPath</key>
    <string>/var/log/systracker-validate.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/systracker-validate.log</string>
</dict>
</plist>
```

---

## Advanced Usage

### Custom Validation Output

**Export Results to JSON (Windows):**
```powershell
$results = @()
$results += @{test="admin"; result="pass"; timestamp=(Get-Date -Format "o")}
$results | ConvertTo-Json | Out-File validation-results.json
```

**Parse Results (Linux):**
```bash
# Extract pass/fail counts
./validate_linux_install.sh | grep "PASS\|FAIL" | sort | uniq -c

# Create CSV report
./validate_linux_install.sh | grep "✓\|✗" > report.csv
```

### Integration with Monitoring Systems

**Prometheus metrics:**
```bash
# Output validation metrics
echo "# HELP systracker_validation Tests passed"
echo "# TYPE systracker_validation gauge"
echo "systracker_validation{test=\"dashboard\"} 1"
echo "systracker_validation{test=\"api\"} 1"
```

---

## Next Steps

After successful validation:

1. **Access Dashboard:** Open `http://localhost:PORT` in browser
2. **Create Admin Account:** Complete setup wizard
3. **Configure API Key:** Generate in Settings
4. **Install Agents:** Download drivers for target machines
5. **Start Monitoring:** Add systems to dashboard
6. **Monitor Logs:** Check ongoing logs in dashboard

---

## Support Resources

- **Documentation:** [WINDOWS_DOCKER_SETUP.md](WINDOWS_DOCKER_SETUP.md), [DEPLOYMENT_COMPARISON.md](DEPLOYMENT_COMPARISON.md)
- **Installation Guides:** [WINDOWS_SERVER_DEPLOYMENT.md](WINDOWS_SERVER_DEPLOYMENT.md), [WINDOWS_IMPLEMENTATION_GUIDE.md](WINDOWS_IMPLEMENTATION_GUIDE.md)
- **Troubleshooting:** [WINDOWS_SERVER_DEPLOYMENT.md#troubleshooting](WINDOWS_SERVER_DEPLOYMENT.md#troubleshooting)

---

**Last Updated:** 2025  
**Version:** 3.1.2  
**Platforms Supported:** Windows 10+, Linux (Ubuntu/Debian/CentOS), macOS 10.15+
