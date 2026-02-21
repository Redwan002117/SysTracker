# Windows Staging Testing Guide

Your PC Testing Checklist - Everything you need to do before production deployment!

---

## Pre-Testing Setup

### 1. Hardware Requirements Check

```powershell
# Check your PC specs
Get-ComputerInfo -Property WindowsProductName, OsVersion

# Minimum requirements:
# - Windows 10 v1909+ or Windows 11
# - 2GB RAM (4GB+ recommended)
# - 500MB disk space
# - Network connectivity
```

### 2. Prerequisites Installation

```powershell
# Check for Node.js (you said you have dependencies)
node --version    # Should be 14+

# Check npm
npm --version     # Should be 6+

# Optional: Install curl for testing
# Already built into Windows 10+
```

---

## Phase 1: Server Installation (30 minutes)

### Step 1: Prepare Directory

```powershell
# Create a test directory
mkdir C:\SysTracker-Test
cd C:\SysTracker-Test

# Copy the EXE here
Copy-Item "C:\path\to\systracker-server-win.exe" .

# List contents
ls -la
```

### Step 2: Start Server

```powershell
# Run the EXE
.\systracker-server-win.exe

# You should see output like:
# Starting SysTracker Server v3.1.2
# Listening on port 7777
# Dashboard: http://localhost:7777
```

**Don't close this terminal!** The server is running.

### Step 3: Verify Server Started

**Open another PowerShell window:**

```powershell
# Test connectivity
Invoke-WebRequest -Uri "http://localhost:7777" -UseBasicParsing

# Should return 200 or 302 status
```

### Step 4: Access Dashboard

1. Open Web Browser (Chrome, Edge, Firefox)
2. Navigate to: **http://localhost:7777**
3. You should see SysTracker login/setup page

**✅ Checkpoint: Can you see the setup page?**

---

## Phase 2: Initial Configuration (15 minutes)

### Step 1: Run Setup Wizard

In dashboard:
1. Click **"Setup Wizard"**
2. Read welcome message
3. Click **"Start"**

### Step 2: Create Admin Account

Fill in:
- **Email:** your@email.com
- **Password:** StrongPassword123!
- Click **"Create Account"**

**✅ Checkpoint: Admin account created?**

### Step 3: Configure Server

Fill in:
- **Server Name:** My Test SysTracker
- **Port:** 7777  
- **Timezone:** Your timezone
- Optional: SMTP for email alerts
- Click **"Configure"**

**✅ Checkpoint: Configuration saved?**

### Step 4: View Dashboard

After setup:
1. Dashboard should show overview
2. Click around to verify all pages load
3. No errors should appear

**✅ Checkpoint: Dashboard fully functional?**

---

## Phase 3: Validation Tests (15 minutes)

### Run Automated Validator

```powershell
# Run validation script
.\validate_windows_install.ps1

# Should show all green checkmarks (✓)
```

**Expected output:**
```
✓ PASS  Admin Privilege Check
✓ PASS  Service Registration
✓ PASS  Database File Found
✓ PASS  API Health Check
✓ PASS  Port 7777 Listening
... (14 tests total)

RESULT: PASSED (14/14) ✅
```

**✅ Checkpoint: All 14 tests passing?**

---

## Phase 4: Agent Testing (30 minutes)

### Step 1: Prepare Agent

```powershell
# Navigate to agent directory
cd agent

# Install dependencies
npm install

# Create config file
Copy-Item "agent_config.json.example" "agent_config.json" -Force

# Edit config
notepad agent_config.json

# Change:
# "server": "http://localhost:7777"
```

### Step 2: Start Agent

```powershell
# In agent directory
node client_agent.js

# Should output:
# Connected to server
# Sending metrics
# Successfully sent
```

**Don't close this terminal!** Let it run.

### Step 3: Verify Agent in Dashboard

In browser (http://localhost:7777):
1. Go to **"Machines"** or **"Dashboard"**
2. Wait 30-60 seconds
3. Your computer should appear
4. Status should show **"Online"**
5. Metrics should update every 30 seconds

**✅ Checkpoint: Agent connected and sending data?**

---

## Phase 5: Performance Testing (1 hour)

### Monitor While Running

While both server and agent are running, monitor:

```powershell
# In new PowerShell window

# Check server memory every 30 seconds
while($true) {
    $proc = Get-Process | Where-Object {$_.Name -like "*node*"}
    $memory = [math]::Round($proc.WorkingSet/1MB, 2)
    Write-Host "Memory: $memory MB"
    Start-Sleep -Seconds 30
}
```

### Check Memory Usage

Expected:
- **Server:** 150-300 MB
- **Agent:** 50-100 MB
- **Combined:** < 400 MB

### Check CPU Usage

Expected:
- **Server (idle):** < 5%
- **Agent (idle):** < 2%
- **Server (queries):** 10-30%
- **Agent (collecting):** 5-15%

### Generate Some Data

1. In dashboard, navigate around
2. Refresh page a few times
3. View system details
4. Check responsiveness

Expected:
- **Page load:** < 2 seconds
- **No slowdown:** Smooth operation
- **No errors:** No 500 errors

**✅ Checkpoint: Performance acceptable?**

---

## Phase 6: Restart Testing (20 minutes)

### Test 1: Restart Agent

```powershell
# In agent terminal, press Ctrl+C to stop

# Wait 5 seconds

# Restart it
node client_agent.js

# Check dashboard:
# Should show "Offline" then "Online" within 60s
```

**✅ Checkpoint: Agent reconnects automatically?**

### Test 2: Restart Server

```powershell
# In server terminal, press Ctrl+C to stop

# Wait 10 seconds

# Restart it
.\systracker-server-win.exe

# Wait for startup message

# Open browser, refresh: http://localhost:7777
# Agent should be offline then reconnect
```

**✅ Checkpoint: Server recovers gracefully?**

### Test 3: Restart Computer (Optional)

For full integration test:

```powershell
# Stop both server and agent
# Restart your PC
# After restart, manually start both again
# Verify everything reconnects
```

**✅ Checkpoint: Full restart working?**

---

## Phase 7: Error Recovery (15 minutes)

### Simulate Common Issues

**Issue 1: Change port**
```powershell
# Stop server
# Edit .env file, change PORT=7778
# Restart server
# Verify: http://localhost:7778
```

**Issue 2: Database issue**
```powershell
# Stop server
# Backup database: copy data\systracker.db data\systracker.db.backup
# Delete symtracker.db
# Restart server (will recreate)
# Database should be clean and working
```

**Issue 3: Permission issue**
```powershell
# Verify data directory is writable
# You should be able to create files there
# If not, fix permissions
```

**✅ Checkpoint: Can recover from issues?**

---

## Phase 8: Validation Results Checklist

### Server Tests
- [ ] Server starts without errors
- [ ] Server listens on port 7777
- [ ] Dashboard loads at http://localhost:7777
- [ ] Setup wizard completes
- [ ] Admin account created
- [ ] API responds to requests
- [ ] Database created and working
- [ ] All 14 validation tests pass

### Agent Tests
- [ ] Agent connects to server
- [ ] Agent appears in dashboard
- [ ] Metrics collecting (CPU, Memory, Disk)
- [ ] Data updating every 30 seconds
- [ ] Agent handles server disconnect
- [ ] Agent reconnects automatically
- [ ] Multiple agents work together

### Performance Tests
- [ ] Server memory < 300 MB
- [ ] Agent memory < 100 MB
- [ ] CPU usage acceptable
- [ ] Dashboard responsive (< 2 sec load)
- [ ] API response < 100ms
- [ ] No slowdown over time

### Recovery Tests
- [ ] Agent restart works
- [ ] Server restart works
- [ ] Port change works
- [ ] Database restore works
- [ ] Data persists after restart
- [ ] No data loss

---

## Testing Report

### Before Production, Fill Out:

```markdown
# SysTracker Staging Test Report

**Date:** February 21, 2025
**Tester:** Your Name
**System:** [Windows 10/11/Server version]
**EXE Version:** 3.1.2
**Status:** PASS/FAIL

## Test Results

### Server Installation
- [ ] Success
- Date/Time: 
- Issues: None

### Initial Configuration
- [ ] Success
- Admin account created: Yes
- Dashboard accessible: Yes

### Validation Tests
- [ ] All 14 tests passed
- Result Summary: PASS (14/14)

### Agent Testing
- [ ] Agent connected successfully
- [ ] Metrics collected: CPU, Memory, Disk
- [ ] Data updating: Every 30 seconds
- [ ] Time to appear in dashboard: 45 seconds

### Performance Testing
- Server Memory: 250 MB
- Server CPU: 3% (idle)
- Agent Memory: 80 MB
- Agent CPU: 1% (idle)
- Dashboard Load Time: 1.2 seconds

### Restart Testing
- [ ] Agent restart: SUCCESS
- [ ] Server restart: SUCCESS
- [ ] Reconnection time: 32 seconds
- [ ] Data preserved: Yes

### Issues Found
- None / [List issues]

## Recommendation

**PASS** - Ready for production deployment ✅

**OR**

**FAIL** - Issues need to be addressed before production

Issues to fix:
1. [Issue 1]
2. [Issue 2]
```

---

## Success Criteria

✅ **Testing Complete When:**

All of the following are true:
- [x] All 14 automated validation tests PASS
- [x] Server memory < 300 MB
- [x] Agent appears in dashboard within 60 seconds
- [x] Metrics collecting and updating every 30 seconds
- [x] Dashboard loads in < 2 seconds
- [x] No errors in logs
- [x] Agent handles disconnects gracefully
- [x] Server recovers after restart
- [x] Your team feels confident deploying
- [x] All issues documented and resolved (or accepted)

---

## Next Steps After Testing

**If all tests PASS:**
1. ✅ Create test report
2. ✅ Document any customizations
3. ✅ Prepare agent deployment process
4. ✅ Plan production rollout schedule
5. ✅ Train operations team
6. ✅ Deploy to production!

**If any FAIL:**
1. Document issue
2. Troubleshoot (see Common Issues)
3. Retry test
4. Retest until PASS
5. Create issue ticket if needed
6. Contact support if stuck

---

## Troubleshooting During Testing

### Server won't start
→ [See Port Already in Use](Common-Issues-FAQ#port-7777-already-in-use)

### Agent won't connect
→ [See Agent Connectivity](Common-Issues-FAQ#agent-wont-connect)

### Dashboard slow
→ [See Performance Issues](Common-Issues-FAQ#performance-issues)

### Database error
→ [See Database Issues](Common-Issues-FAQ#database-issues)

---

## Testing Timeline

```
Phase 1: Server Installation (0-30 min)
Phase 2: Configuration (30-45 min)
Phase 3: Validation (45-60 min)
Phase 4: Agent Testing (60-90 min)
Phase 5: Performance Testing (90-150 min)
Phase 6: Restart Testing (150-170 min)
Phase 7: Error Recovery (170-185 min)
Phase 8: Results & Report (185-210 min)

TOTAL TIME: 3.5 hours
TOTAL WITH BREAKS: ~4-5 hours
```

---

## Keep Records

Save for reference:
- ✅ Test report (filled out)
- ✅ Screenshots of dashboard
- ✅ Performance metrics
- ✅ Agent logs
- ✅ Server logs
- ✅ Any customizations made

---

**Good luck with your testing! 🚀**

**Issues or questions?** Check Common Issues guide or contact support.

---

**Last Updated:** February 21, 2025  
**Version:** 3.1.2  
**Estimated Testing Time:** 4-5 hours
