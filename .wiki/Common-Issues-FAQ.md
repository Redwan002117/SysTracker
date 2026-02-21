# Common Issues & FAQ

## Installation Issues

### "Port 7777 already in use"

**Windows:**
```powershell
# Find process using port
netstat -ano | findstr :7777

# Kill it (replace PID)
taskkill /PID 1234 /F
```

**Linux/macOS:**
```bash
# Find process
lsof -i :7777

# Kill it
kill -9 <PID>
```

**Or change port:**
```env
# In .env file
PORT=7778
```

---

### "Permission denied" (Linux/macOS)

```bash
# Give execute permission
chmod +x validate_linux_install.sh

# Run with proper permissions
sudo ./validate_linux_install.sh
```

---

### "Node.js not found"

**Windows:**
- Download from nodejs.org
- Install latest LTS
- Restart terminal

**Linux:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**macOS:**
```bash
brew install node
# or
nvm install 18
```

---

## Agent Issues

### Agent won't connect

**Check 1: Server running?**
```
http://localhost:7777  # Should load
```

**Check 2: Correct server URL?**
- In agent config, check URL matches your server
- Include port number: `http://your-server:7777`
- Use full URL, not just hostname

**Check 3: Firewall?**
- Windows: Allow port 7777 through firewall
- Linux: Check iptables/ufw rules
- Check that port 7777 is open

**Check 4: Network?**
```bash
ping your-server-ip
telnet your-server-ip 7777
```

---

### Agent keeps disconnecting

**Likely causes:**
1. Network instability → Check connection
2. Server restarting → Check logs
3. Agent crashing → Check agent logs
4. Memory issues → Monitor RAM

**Solution:**
```
Restart agent and monitor for 1 hour
If still issues, check logs for errors
```

---

### Agent not showing in dashboard

**Wait 60 seconds first** - agents take time to appear

**Then check:**
1. Is agent process running?
2. Are there error logs?
3. Can agent reach server URL?
4. Is server port accessible?

```bash
# Restart agent if needed
# Check agent logs for errors
```

---

## Dashboard Issues

### Dashboard loading slowly

**Causes:**
- Too many systems (database query slow)
- High server load
- Network latency
- Browser issue

**Solutions:**
```
1. Restart browser
2. Clear browser cache
3. Try different browser
4. Check server resources (CPU/Memory)
```

---

### Dashboard not loading at all

**Check 1: Server running?**
```powershell
# Windows: Check for systracker-server-win.exe in Task Manager
# Linux: systemctl status systracker
# macOS: launchctl list | grep systracker
```

**Check 2: Port accessible?**
```
http://localhost:7777
# Try different browser
# Try Ctrl+Shift+Delete to clear cache
```

**Check 3: Firewall?**
- Windows Defender Firewall blocking port?
- Corporate firewall?
- Check logs for connection errors

---

### Can't login

**Wrong password?**
- Reset via "Forgot Password" link
- Or restart server and check database

**Account locked?**
- Wait 15 minutes (security feature)
- Or contact admin

**Database issue?**
- Check database file exists: `data/systracker.db`
- Check permissions: `ls -la data/systracker.db`
- Restore from backup if corrupted

---

## Performance Issues

### High Memory Usage (> 500MB)

```bash
# Check process
ps aux | grep node
# or Task Manager (Windows)

# Likely causes:
# 1. Too many agents connected
# 2. Memory leak (restart helps)
# 3. Large dataset in database

# Restart server
# If persists, check database size:
ls -lh data/systracker.db
```

### High CPU Usage (> 50% idle)

```bash
# Monitor CPU
top -p $(pgrep -f node)

# Causes:
# 1. Database query slow
# 2. Too many API requests
# 3. Agent data processing

# Solutions:
# Restart server
# Optimize database (VACUUM)
# Check WebSocket connections
```

### Slow API Responses (> 200ms)

```bash
# Check response time
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:7777/api/auth/status

# Causes:
# 1. Database query slow
# 2. Server overloaded
# 3. Network latency

# Solutions:
# Restart server
# Reduce connected agents
# Increase resources
```

---

## Database Issues

### "Database locked"

**Cause:** Backup running or corrupted

**Solution:**
```bash
# Stop server
systemctl stop systracker  # Linux

# Remove lock file (if exists)
rm data/systracker.db-wal

# Start server
systemctl start systracker
```

---

### "Database corrupted"

**Cause:** Unexpected shutdown, file system issue

**Solution:**
```bash
# Stop server

# Check integrity
sqlite3 data/systracker.db "PRAGMA integrity_check;"

# If failed, restore backup
cp data/systracker.db.backup data/systracker.db

# Start server
```

---

### Database growing too large

**Check size:**
```bash
ls -lh data/systracker.db
du -sh data/
```

**Cleanup:**
```bash
# Stop server

# Optimize database
sqlite3 data/systracker.db "VACUUM;"
sqlite3 data/systracker.db "ANALYZE;"

# Start server
```

---

## Log Analysis

### Where are the logs?

**Windows:**
```
C:\Program Files\SysTracker Server\logs\app.log
or
C:\Users\YourUser\systracker\logs\app.log
```

**Linux:**
```
/opt/systracker/logs/app.log
or with systemd: journalctl -u systracker
```

**macOS:**
```
~/systracker/logs/app.log
or: log show --predicate 'process contains "systracker"'
```

---

### What to look for

**Errors:**
```
[ERROR] ...
```

**Warnings:**
```
[WARN] ...
```

**Info:**
```
[INFO] ...
```

**Debug:**
```
[DEBUG] ...
```

---

### Read recent logs

**Terminal:**
```bash
tail -50 logs/app.log      # Last 50 lines
tail -f logs/app.log       # Live view (press Ctrl+C to exit)
grep ERROR logs/app.log    # Find errors
```

---

## Service Management

### Windows Service

```powershell
# Start
Start-Service systracker

# Stop
Stop-Service systracker

#Restart
Restart-Service systracker

# Status
Get-Service systracker

# Uninstall
# See installation script
```

---

### Linux systemd

```bash
# Start
sudo systemctl start systracker

# Stop
sudo systemctl stop systracker

# Restart
sudo systemctl restart systracker

# Status
sudo systemctl status systracker

# View logs
sudo journalctl -u systracker -f
```

---

### macOS launchd

```bash
# Start
launchctl start com.systracker

# Stop
launchctl stop com.systracker

# Check running
launchctl list | grep systracker

# Reload (if modified)
launchctl unload ~/Library/LaunchAgents/com.systracker.plist
launchctl load ~/Library/LaunchAgents/com.systracker.plist
```

---

## Validation

### Run Post-Installation Tests

```powershell
# Windows
.\validate_windows_install.ps1

# Linux
./validate_linux_install.sh

# macOS
./validate_macos_install.sh

# Auto-detect OS
./validate_install.sh
```

**Expected result:** All tests green ✅

---

## CI / Build Pipeline Issues

### `build-server-release` fails — sqlite3 gyp "Could not find any Visual Studio"

**Root cause:** sqlite3 v5.1.x has no prebuilt binary for the requested Node/NAPI version on Windows and falls back to compiling from source via `node-gyp`, which requires the Windows SDK. The GitHub-hosted `windows-latest` runner has Visual Studio but **no Windows SDK** installed, so the compilation fails.

**Fix applied in `publish.yml`:** The `build-server-release` job uses two sequential `setup-node` steps:
1. **Node 20** — used for the dashboard rebuild (Next.js requires `>=20.9.0`) and agent build.
2. **Node 18** — switched to immediately before `npm install` in the `server/` directory, matching the `pkg` target (`node18-win-x64`). sqlite3 ships prebuilt NAPI binaries for Node 18 on Windows x64, so native compilation is never attempted.

---

### `Rebuild Dashboard Locally` fails — "Node.js version `>=20.9.0` is required"

**Root cause:** Next.js 16.x requires Node.js `>=20.9.0`. If the CI job sets Node 18 globally before the dashboard build step, Next.js refuses to run.

**Fix:** In `publish.yml`, the `build-server-release` job starts on **Node 20** and only switches to Node 18 via a second `actions/setup-node` step *after* the dashboard is built and copied to `server/dashboard-dist`.

---

### `notify-release` fails with 403 "Resource not accessible by integration"

**Root cause:** The `GITHUB_TOKEN` used in GitHub Actions only has the permissions explicitly declared in the job's `permissions:` block. The `notify-release` job was missing `issues: write`, so attempts to call `github.rest.issues.create()` via `actions/github-script` were denied.

**Fix:** Added `permissions: issues: write` to the `notify-release` job in `release-automation.yml`.

---

## Getting More Help

1. **Check logs** → Understanding what went wrong
2. **Run validation** → Automated diagnostics
3. **Browse troubleshooting** → More detailed guides
4. **Contact support** → For complex issues

---

**Last Updated:** February 21, 2026  
**Version:** 3.1.7  
**Most Common Issues:** Port conflicts, connectivity, permissions
