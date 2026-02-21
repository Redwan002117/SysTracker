# SysTracker v3.1.2 Upgrade Guide

**Version:** 3.1.2  
**Previous:** v3.1.1  
**Release Date:** 2025  
**Upgrade Time:** 5-10 minutes (all platforms)

---

## Overview

This guide provides step-by-step instructions for upgrading SysTracker Server from v3.1.1 to v3.1.2 across all deployment platforms.

### What's New in v3.1.2

✨ **New Features:**
- Windows EXE standalone deployment (49 MB, all-in-one executable)
- Docker Windows Server Core containerization
- Comprehensive cross-platform installation validation
- macOS launchd service integration
- Linux native systemd configuration
- Enhanced documentation and troubleshooting guides

🐛 **Bug Fixes:**
- Improved error handling in agent communication
- Fixed dashboard pagination on large datasets
- Resolved memory leak in WebSocket connections
- Fixed timezone handling in system logs

📊 **Improvements:**
- Better resource monitoring and memory optimization
- Faster dashboard rendering with improved caching
- Enhanced security in JWT token handling
- Improved database query performance

### Compatibility

✅ **Fully Compatible - No Data Loss:**
- Database schema: **No changes** (backward compatible)
- API endpoints: **100% compatible** (no breaking changes)
- Configuration: **Backward compatible** (.env format unchanged)
- Agents: **All versions compatible** (any agent works with any server)

---

## Pre-Upgrade Checklist

### Before You Start

- [ ] Read [RELEASE_NOTES_v3.1.2.md](RELEASE_NOTES_v3.1.2.md) for full changes
- [ ] Back up your data directory
- [ ] Back up your .env configuration
- [ ] Ensure adequate disk space (500 MB minimum)
- [ ] Check system resources (2GB+ RAM available)
- [ ] Schedule upgrade during low-usage time
- [ ] Notify users of brief service interruption (5-10 min)

### Backup Procedure

**Windows:**
```powershell
# Create backup
Copy-Item -Path "C:\Program Files\SysTracker Server\data" `
    -Destination "C:\Program Files\SysTracker Server\data.backup.$(Get-Date -Format 'yyyyMMdd')" `
    -Recurse

# Verify backup
Get-Item "C:\Program Files\SysTracker Server\data.backup.*"
```

**Linux:**
```bash
# Create backup
cp -r /opt/systracker/data /opt/systracker/data.backup.$(date +%Y%m%d)

# List backups
ls -la /opt/systracker/data.backup.*
```

**macOS:**
```bash
# Create backup
cp -r ~/systracker/data ~/systracker/data.backup.$(date +%Y%m%d)

# List backups
ls -la ~/systracker/data.backup.*
```

---

## Upgrade Procedures

### Option 1: Windows Standalone EXE (Recommended for Windows)

**Upgrade into:** Standalone executable (portable, no installation)

#### Method A: In-Place Upgrade

**Time:** ~5 minutes  
**Downtime:** ~2 minutes

```powershell
# 1. Stop current service (or close EXE)
Stop-Service systracker

# 2. Backup data
Copy-Item -Path "C:\Program Files\SysTracker Server\data" `
    -Destination "C:\Program Files\SysTracker Server\data.v3.1.1" -Recurse

# 3. Replace executable
Remove-Item "C:\Program Files\SysTracker Server\systracker-server-win.exe" -Force
Copy-Item -Path ".\systracker-server-win.exe" `
    -Destination "C:\Program Files\SysTracker Server\systracker-server-win.exe"

# 4. Start service
Start-Service systracker

# 5. Verify
Get-Service systracker | Select-Object -Property Name, Status

# 6. Access dashboard
Start-Process "http://localhost:7777"
```

**Verification:**
```powershell
# Check dashboard loads
$response = Invoke-WebRequest -Uri "http://localhost:7777" -UseBasicParsing
$response.StatusCode  # Should be 200 or 302
```

#### Method B: Clean Installation

**Time:** ~7 minutes  
**Downtime:** ~3 minutes  
**Use when:** You want a complete fresh start

```powershell
# 1. Backup current installation
Copy-Item -Path "C:\Program Files\SysTracker Server" `
    -Destination "C:\Program Files\SysTracker Server.v3.1.1" -Recurse

# 2. Uninstall current service
Stop-Service systracker
$service = Get-WmiObject Win32_Service -Filter "Name = 'systracker'"
$service.Delete()

# 3. Move old data to safe location
Move-Item -Path "C:\Program Files\SysTracker Server\data" `
    -Destination "C:\SysTracker-Data-Backup" -Force

# 4. Install new version
.\install_windows_service.ps1 -ServiceName systracker -Port 7777

# 5. Restore data
Copy-Item -Path "C:\SysTracker-Data-Backup\*" `
    -Destination "C:\Program Files\SysTracker Server\data" -Recurse

# 6. Start service
Start-Service systracker
```

---

### Option 2: Windows Docker Container (Recommended for Enterprise)

**Upgrade into:** Docker container (Windows Server Core based)

**Prerequisites:**
- Docker Desktop installed
- Sufficient disk space (image ~2.5GB)
- Service currently running

#### Docker Compose Upgrade

**Time:** ~10 minutes  
**Downtime:** ~2 minutes

```powershell
# 1. Navigate to project directory
cd "C:\SysTracker"

# 2. Backup database
Copy-Item -Path ".\data\systracker.db" -Destination ".\data\systracker.db.v3.1.1"

# 3. Pull new image
docker-compose -f docker-compose.windows.yml pull

# 4. Stop old container
docker-compose -f docker-compose.windows.yml down

# 5. Start new container
docker-compose -f docker-compose.windows.yml up -d

# 6. Verify logs
docker-compose logs --tail=20
```

#### Manual Docker Upgrade

```powershell
# 1. Stop and remove old container
docker stop systracker
docker rm systracker

# 2. Backup database
Copy-Item -Path "systracker-data:/systracker.db" `
    -Destination ".\systracker.db.backup"

# 3. Pull new image
docker pull mcr.microsoft.com/windows/servercore:ltsc2022

# 4. Run new container
docker run -d `
  --name systracker `
  -p 7777:7777 `
  -v systracker-data:C:\app\data `
  ghcr.io/your-org/systracker:3.1.2

# 5. Verify
docker logs systracker -n 20
curl -i http://localhost:7777
```

**Verification:**
```powershell
# Check container running
docker ps | grep systracker

# Check logs
docker logs systracker --tail=10

# Test endpoint
curl -Uri "http://localhost:7777" -UseBasicParsing
```

---

### Option 3: Linux Native Upgrade

**Deployment:** Node.js + systemd service

**Time:** ~8 minutes  
**Downtime:** ~1 minute

#### Git-Based Upgrade (Recommended)

```bash
# 1. Stop service
sudo systemctl stop systracker

# 2. Backup database
sudo cp /opt/systracker/data/systracker.db \
    /opt/systracker/data/systracker.db.v3.1.1

# 3. Pull latest code
cd /opt/systracker
sudo git pull origin main

# 4. Install dependencies (if changed)
sudo npm install

# 5. Run migrations (if any)
sudo npm run migrate

# 6. Start service
sudo systemctl start systracker

# 7. Verify
sudo systemctl status systracker

# 8. Check logs
sudo journalctl -u systracker -n 20 -f
```

#### Docker-Based Upgrade (Linux)

```bash
# 1. Backup database
docker exec systracker cp /app/data/systracker.db \
    /app/data/systracker.db.v3.1.1

# 2. Pull new image
docker pull ghcr.io/your-org/systracker:3.1.2

# 3. Stop and remove container
docker-compose down

# 4. Start new container
docker-compose up -d

# 5. Verify
docker logs systracker -n 20

# 6. Test API
curl -i http://localhost:7777/api/auth/status
```

**Verification:**
```bash
# Check service status
systemctl status systracker

# Check dashboard
curl -i http://localhost:7777

# Check database
sqlite3 /opt/systracker/data/systracker.db "SELECT COUNT(*) FROM machines;"

# View logs
tail -f /opt/systracker/logs/app.log
```

---

### Option 4: macOS Upgrade

**Deployment:** Node.js + launchd service

**Time:** ~10 minutes  
**Downtime:** ~2 minutes

#### launchd Service Upgrade

```bash
# 1. Stop service
launchctl stop com.systracker

# 2. Backup data
cp -r ~/systracker/data ~/systracker/data.v3.1.1

# 3. Update code
cd ~/systracker
git pull origin main

# 4. Install dependencies
npm install

# 5. Run migrations
npm run migrate

# 6. Start service
launchctl start com.systracker

# 7. Verify
launchctl list | grep systracker

# 8. Check logs
log show --predicate 'process contains "systracker"' --last 1h
```

#### Docker-Based Upgrade (macOS)

```bash
# 1. Backup database
docker exec systracker cp /app/data/systracker.db \
    /app/data/systracker.db.v3.1.1

# 2. Pull new image
docker pull ghcr.io/your-org/systracker:3.1.2

# 3. Stop and remove container
docker-compose down

# 4. Start new container
docker-compose up -d

# 5. Verify
docker logs systracker -n 20

# 6. Test
curl -i http://localhost:7777
```

**Verification:**
```bash
# Check service running
launchctl list | grep systracker

# Test dashboard
open http://localhost:7777

# Check logs
log stream --predicate 'process contains "systracker"' --level debug

# Test database
sqlite3 ~/systracker/data/systracker.db ".tables"
```

---

## Post-Upgrade Steps

### 1. Validate Installation

**Windows:**
```powershell
.\validate_windows_install.ps1
```

**Linux/macOS:**
```bash
./validate_linux_install.sh
# or
./validate_macos_install.sh
```

**Expected Results:**
- ✓ All tests passing (green checkmarks)
- ✓ Service running and listening on port 7777
- ✓ Dashboard accessible at http://localhost:7777
- ✓ Database file intact

### 2. Health Checks

```bash
# Test dashboard access
curl -i http://localhost:7777

# Test API health
curl -i http://localhost:7777/api/auth/status

# Test agent connectivity (if agents installed)
# Navigate to dashboard → Machines
# Verify agents report data (may take 30-60 seconds)
```

### 3. Verify Data Integrity

**Windows:**
```powershell
# Check database
$db = "C:\Program Files\SysTracker Server\data\systracker.db"
$size = (Get-Item $db).Length
Write-Host "Database size: $size bytes (should be > 100KB)"

# Check data directory
Get-ChildItem "C:\Program Files\SysTracker Server\data" -Recurse | Measure-Object
```

**Linux/macOS:**
```bash
# Check database
ls -lh /path/to/data/systracker.db

# Verify database integrity
sqlite3 /path/to/data/systracker.db "PRAGMA integrity_check;"

# Count records
sqlite3 /path/to/data/systracker.db "SELECT COUNT(*) as machines FROM machines;"
```

### 4. Monitor Performance

**First hour after upgrade:**
- ✓ Dashboard loads quickly (<1 second)
- ✓ API endpoints respond (<100ms)
- ✓ Memory usage normal (<500MB)
- ✓ CPU usage idle (<5%)
- ✓ Log files growing normally

**View logs:**

**Windows:**
```powershell
Get-Content "C:\Program Files\SysTracker Server\logs\app.log" -Tail 20
```

**Linux:**
```bash
tail -f /opt/systracker/logs/app.log
```

**macOS:**
```bash
log stream --predicate 'process contains "systracker"' --level info
```

---

## Rollback Procedure

**If upgrade fails or you need to revert:**

### Windows Rollback

```powershell
# 1. Stop new version
Stop-Service systracker

# 2. Restore old executable
Copy-Item -Path "C:\Program Files\SysTracker Server.v3.1.1\systracker-server-win.exe" `
    -Destination "C:\Program Files\SysTracker Server\systracker-server-win.exe" -Force

# 3. Restore data if needed
Remove-Item "C:\Program Files\SysTracker Server\data" -Recurse -Force
Copy-Item -Path "C:\Program Files\SysTracker Server.v3.1.1\data" `
    -Destination "C:\Program Files\SysTracker Server\data" -Recurse

# 4. Restart service
Start-Service systracker

# 5. Verify
Get-Service systracker | Select-Object Status
```

### Linux Rollback

```bash
# 1. Stop service
sudo systemctl stop systracker

# 2. Revert code
cd /opt/systracker
sudo git checkout v3.1.1

# 3. Restore data if needed
sudo rm /opt/systracker/data/systracker.db
sudo cp /opt/systracker/data/systracker.db.v3.1.1 \
    /opt/systracker/data/systracker.db

# 4. Restart service
sudo systemctl start systracker

# 5. Verify
sudo systemctl status systracker
curl -i http://localhost:7777
```

### macOS Rollback

```bash
# 1. Stop service
launchctl stop com.systracker

# 2. Revert code
cd ~/systracker
git checkout v3.1.1

# 3. Restore data if needed
rm ~/systracker/data/systracker.db
cp ~/systracker/data/systracker.db.v3.1.1 ~/systracker/data/systracker.db

# 4. Restart service
launchctl start com.systracker

# 5. Verify
launchctl list | grep systracker
curl -i http://localhost:7777
```

---

## Troubleshooting

### Service Won't Start After Upgrade

**Windows:**
```powershell
# Check what's preventing startup
Get-EventLog -LogName System -Source "systracker" | Select-Object -First 5

# Try manual start to see error
C:\"Program Files"\"SysTracker Server"\systracker-server-win.exe --debug

# Check port not in use
netstat -ano | findstr :7777
```

**Linux:**
```bash
# View error logs
sudo journalctl -u systracker -n 50 -p err

# Try manual start
cd /opt/systracker && npm start

# Check port
lsof -i :7777
```

**macOS:**
```bash
# View error logs
log show --predicate 'process contains "systracker"' --level debug --last 1h

# Try manual start
cd ~/systracker && npm start

# Check port
lsof -i :7777
```

### Database Errors

```bash
# Check database integrity
sqlite3 /path/to/systracker.db "PRAGMA integrity_check;"

# If corrupt, restore from backup
cp /path/to/systracker.db.v3.1.1 /path/to/systracker.db

# Restart service
# Windows: Restart-Service systracker
# Linux: sudo systemctl restart systracker
# macOS: launchctl stop/start com.systracker
```

### Port Already in Use

```bash
# Find what's using the port
# Windows: netstat -ano | findstr :7777
# Linux/macOS: lsof -i :7777

# Kill the process if needed
# Windows: taskkill /PID <PID> /F
# Linux/macOS: kill -9 <PID>

# Or change port in .env
PORT=7778
# Then restart service
```

### High Memory Usage

```bash
# Check process
# Windows: Get-Process | Where-Object {$_.Name -like "*node*"}
# Linux/macOS: ps aux | grep node

# If stuck, restart service
# Windows: Restart-Service systracker
# Linux: sudo systemctl restart systracker
# macOS: launchctl stop/start com.systracker

# Monitor memory
# Windows: Get-Process systracker-server-win | Select-Object Memory
# Linux: watch -n 1 'ps aux | grep node'
# macOS: top -p $(pgrep -f node)
```

---

## Platform-Specific Considerations

### Windows Considerations

- **NSSM Service Manager:** Ensure NSSM still valid after upgrade
- **Firewall:** Windows Defender Firewall may block port 7777
- **File Permissions:** Data directory must be writable to service account
- **Long Paths:** Support for paths >260 characters may require Windows 10 1607+

**Enable long paths (if needed):**
```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
    -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

### Linux Considerations

- **SELinux:** May need to update policies if enabled
- **AppArmor:** May need to update profiles if enabled
- **Disk Space:** Check available space before upgrade
- **User Permissions:** Ensure service user has write permissions

**Check and fix permissions:**
```bash
sudo chown -R systracker:systracker /opt/systracker/data
sudo chmod 755 /opt/systracker/data
```

### macOS Considerations

- **Gatekeeper:** May prompt to allow unsigned app on first run
- **Notarization:** Verify app is properly signed
- **Sandbox:** May need to grant permissions for file access
- **Homebrew:** If installed via Homebrew, use `brew upgrade systracker`

**Allow app execution:**
```bash
xattr -d com.apple.quarantine ~/systracker/bin/systracker
```

---

## Testing Agents After Upgrade

After upgrading the server, test that agents still communicate:

### Quick Test

1. Open dashboard: http://localhost:7777
2. Navigate to "Machines"
3. Verify existing machines still report data
4. Check timestamp of last update (should be recent)
5. Test metrics are displaying correctly

### Detailed Test

```bash
# On agent machine, verify connection
# Windows: Run: agent> .\client_agent.js
# Linux: Run: cd agent && node client_agent.js

# In dashboard, check:
# - Agent appears in "Machines" list
# - Status shows "Online"
# - Metrics updating every 30 seconds
# - No errors in agent logs
```

### Full Test

1. Deploy v3.1.2 server
2. Verify old agents (v3.1.1) still work
3. Deploy some new agents (v3.1.2)
4. Verify agent communication for all versions
5. Monitor mixed-version environment for 1 hour

---

## Maintenance & Monitoring

### Regular Tasks After Upgrade

**Daily:**
- Verify service is running
- Check dashboard loads quickly
- Monitor error logs for new issues

**Weekly:**
- Review system resources (memory, disk, CPU)
- Check for any error patterns in logs
- Test agent connectivity

**Monthly:**
- Update agents to latest version
- Review and optimize database (VACUUM)
- Check for security updates

### Database Optimization

```bash
# Run after upgrade
sqlite3 /path/to/systracker.db "VACUUM;"
sqlite3 /path/to/systracker.db "ANALYZE;"
sqlite3 /path/to/systracker.db "REINDEX;"
```

### Log Rotation (Optional)

**Windows:**
```powershell
# Set up log rotation
$schedule = New-JobTrigger -Weekly -DaysOfWeek Monday -At 2:00AM
Register-ScheduledJob -Name "SysTracker-LogRotate" -Trigger $schedule `
    -ScriptBlock { 
        Get-ChildItem "C:\Program Files\SysTracker Server\logs\*" -Filter "*.log" |
        Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-30)} |
        Move-Item -Destination "C:\Program Files\SysTracker Server\logs\archive\"
    }
```

**Linux:**
```bash
# Create logrotate config
sudo cat > /etc/logrotate.d/systracker << EOF
/opt/systracker/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 systracker systracker
}
EOF
```

---

## Support & Resources

### Documentation

- [INSTALLATION_VALIDATION_GUIDE.md](INSTALLATION_VALIDATION_GUIDE.md) - Post-install validation
- [RELEASE_NOTES_v3.1.2.md](RELEASE_NOTES_v3.1.2.md) - Full release notes
- [WINDOWS_SERVER_DEPLOYMENT.md](WINDOWS_SERVER_DEPLOYMENT.md) - Windows details
- [DEPLOYMENT_COMPARISON.md](DEPLOYMENT_COMPARISON.md) - Platform comparison
- [INSTALLATION_AND_DEPLOYMENT_GUIDE.md](INSTALLATION_AND_DEPLOYMENT_GUIDE.md) - Master guide

### Scripts Available

- `validate_windows_install.ps1` - Windows 14-point validation
- `validate_linux_install.sh` - Linux 14-point validation
- `validate_macos_install.sh` - macOS 17-point validation
- `validate_install.sh` - Auto-detect OS and validate

### Common Issues Checklist

- [ ] Port 7777 already in use → change PORT in .env
- [ ] Service won't start → check logs and permissions
- [ ] Database errors → restore from backup or regenerate
- [ ] High memory → restart service, check for memory leaks
- [ ] Agents not connecting → verify server URL in agent config
- [ ] Dashboard slow → check database integrity and system resources

---

## Upgrade Checklist Summary

**Pre-Upgrade:**
- [ ] Read release notes
- [ ] Backup data and configuration
- [ ] Verify disk space (500 MB+)
- [ ] Check system resources (2 GB+ RAM)
- [ ] Plan maintenance window

**During Upgrade:**
- [ ] Stop current service
- [ ] Replace or upgrade application
- [ ] Verify data integrity
- [ ] Start service
- [ ] Run validation script

**Post-Upgrade:**
- [ ] Test dashboard access
- [ ] Verify API endpoints
- [ ] Check agent connectivity
- [ ] Monitor performance
- [ ] Review logs for errors

**Confirmation:**
- [ ] Service running (✓ green status)
- [ ] Dashboard loads (< 1 second)
- [ ] API responding (HTTP 200)
- [ ] Agents reporting (data updating)
- [ ] Logs normal (no errors)

---

**Upgrade Strategy Summary:**  
Choose the method that best fits your infrastructure:

| Environment | Recommended | Benefits |
|---|---|---|
| Windows Developer | Standalone EXE | Simplest, no installation |
| Windows Enterprise | Docker Container | Enterprise-grade control |
| Linux Development | Git pull + systemd | Version control integration |
| Linux Enterprise | Docker Container | Standard deployment |
| macOS Development | launchd + Git | Native macOS integration |
| All Environments | Docker | Consistent across platforms |

---

**Last Updated:** 2025  
**Version:** 3.1.2  
**Upgrade Status:** Ready for production  
**Support:** Full for all platforms
