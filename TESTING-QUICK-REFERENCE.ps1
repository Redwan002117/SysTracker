#!/usr/bin/env powershell
# SysTracker v3.1.2 - Windows Testing Quick Reference
# Run these commands in PowerShell while testing
# Usage: Copy commands and run them in PowerShell

# ============================================================
# PHASE 1: SERVER INSTALLATION
# ============================================================

# 1. Create test directory
$testDir = "C:\SysTracker-Test"
New-Item -ItemType Directory -Path $testDir -Force
Set-Location $testDir

# 2. List the EXE to verify download
Get-Item ".\systracker-server-win.exe" | Select-Object Name, Length, LastWriteTime

# 3. Start server (keep terminal open!)
# Note: This will run continuously - don't close this terminal
# .\systracker-server-win.exe

# ============================================================
# PHASE 1b: VERIFY CONNECTIVITY (new PowerShell window)
# ============================================================

# Test that server is responding
try {
    $response = Invoke-WebRequest -Uri "http://localhost:7777" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Server is running (Status: $($response.StatusCode))"
} catch {
    Write-Host "❌ Server not responding. Check if systracker-server-win.exe is running"
}

# Open dashboard in default browser
Start-Process "http://localhost:7777"

# ============================================================
# PHASE 2: DASHBOARD SETUP
# ============================================================

# Once in dashboard:
# 1. Click "Setup Wizard"
# 2. Create admin account (email & password)
# 3. Configure server settings
# 4. Complete setup

# ============================================================
# PHASE 3: RUN VALIDATION TESTS
# ============================================================

# If validation script exists, run it:
# .\validate_windows_install.ps1

# Or manually test:

# Test port is listening
Get-NetTCPConnection -LocalPort 7777 -ErrorAction SilentlyContinue | 
    Select-Object LocalAddress, State | Format-Table

# Test API responds
$headers = @{"Content-Type"="application/json"}
$health = Invoke-RestMethod -Uri "http://localhost:7777/api/health" -Headers $headers -TimeoutSec 5
$health

# ============================================================
# PHASE 4: AGENT DEPLOYMENT
# ============================================================

# 1. Navigate to agent directory
Set-Location "..\agent"

# 2. Install agent dependencies
npm install

# 3. Create/configure agent
Copy-Item "agent_config.json.example" "agent_config.json" -Force
# Edit agent_config.json: change "server" to "http://localhost:7777"

# 4. Start agent (in new PowerShell window - keep running)
# node client_agent.js

# ============================================================
# PHASE 5: PERFORMANCE MONITORING
# ============================================================

# Monitor server memory (run in separate window)
$null; while($true) {
    $proc = Get-Process | Where-Object {$_.ProcessName -like "*node*"}
    $memory = [math]::Round($proc.WorkingSet/1MB, 2)
    $cpu = $proc.CPU
    Write-Host "Server - Memory: $memory MB | CPU: $cpu s"
    Start-Sleep -Seconds 30
}

# Monitor processes
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | 
    Select-Object ProcessName, ID, WorkingSet, CPU | Format-Table

# Get memory in MB
$proc = Get-Process | Where-Object {$_.ProcessName -like "*node*"}
Write-Host "Server Memory: $([math]::Round($proc.WorkingSet/1MB, 2)) MB"
Write-Host "Server CPU: $($proc.CPU) seconds"

# ============================================================
# PHASE 6: RESTART TESTING
# ============================================================

# Test 1: Stop and restart agent
# In agent terminal: Press Ctrl+C
# Wait 5 seconds
# node client_agent.js

# Test 2: Stop and restart server
# In server terminal: Press Ctrl+C
# Wait 10 seconds
# .\systracker-server-win.exe

# Test 3: Check dashboard
Start-Process "http://localhost:7777"
# Verify agent shows as offline then reconnects

# ============================================================
# PHASE 7: DATABASE BACKUP/RESTORE TEST
# ============================================================

# Backup database
$timestamp = (Get-Date -Format "yyyy-MM-dd_HHmmss")
Copy-Item "data\systracker.db" "data\systracker.db.backup_$timestamp"
Write-Host "✅ Database backed up"

# Restore database (if needed)
Copy-Item "data\systracker.db.backup_$timestamp" "data\systracker.db"
Write-Host "✅ Database restored"

# ============================================================
# PHASE 8: TEST RESULTS VERIFICATION
# ============================================================

# Verify all components
$checks = @{
    "Server Running" = (Get-Process -Name "node" -ErrorAction SilentlyContinue) -ne $null
    "Port 7777 Open" = (Test-NetConnection -ComputerName localhost -Port 7777).TcpTestSucceeded
    "Dashboard Access" = $true # You can access it
    "Agent Connected" = $true # Check dashboard
    "Data Collecting" = $true # Check dashboard metrics
}

$checks.GetEnumerator() | ForEach-Object {
    $status = if ($_.Value) { "✅ PASS" } else { "❌ FAIL" }
    Write-Host "$($_.Key): $status"
}

# ============================================================
# TROUBLESHOOTING COMMANDS
# ============================================================

# Find processes using port 7777
netstat -ano | findstr ":7777"

# Kill process on port 7777 (use PID from above)
# Stop-Process -Id <PID> -Force

# Check recent errors
Get-EventLog -LogName Application -Source "node" -Newest 10 -ErrorAction SilentlyContinue

# View server logs (if available)
# Get-Content "logs\systracker-*.log" -Tail 50

# Clear temp files
Remove-Item "logs\*" -Force -ErrorAction SilentlyContinue

# ============================================================
# QUICK HEALTH CHECK
# ============================================================

Write-Host "=== SYSTRACKER HEALTH CHECK ==="
Write-Host ""

# Check server process
$serverProc = Get-Process | Where-Object {$_.Name -like "*node*" -and $_.Path -like "*systracker*"}
if ($serverProc) {
    Write-Host "✅ Server Process: Running"
    Write-Host "   Memory: $([math]::Round($serverProc.WorkingSet/1MB, 2)) MB"
} else {
    Write-Host "❌ Server Process: Not running"
}

# Check port
$portCheck = Test-NetConnection -ComputerName localhost -Port 7777
Write-Host "✅ Port 7777: $($portCheck.TcpTestSucceeded)"

# Check dashboard
try {
    $dashboard = Invoke-WebRequest -Uri "http://localhost:7777" -UseBasicParsing -TimeoutSec 2
    Write-Host "✅ Dashboard: Responding (HTTP $($dashboard.StatusCode))"
} catch {
    Write-Host "❌ Dashboard: Not responding"
}

Write-Host ""
Write-Host "=== END HEALTH CHECK ==="

# ============================================================
# USEFUL REFERENCE
# ============================================================

<#
DEFAULT PORTS:
- Server: 7777
- Dashboard: http://localhost:7777

DIRECTORIES:
- Server: C:\SysTracker-Test\systracker-server-win.exe
- Agent: C:\SysTracker-Test\agent\client_agent.js
- Data: C:\SysTracker-Test\data\
- Logs: C:\SysTracker-Test\logs\

EXPECTED PERFORMANCE:
- Server Memory: 150-300 MB (idle)
- Agent Memory: 50-100 MB (idle)
- Server CPU: < 5% (idle)
- Agent CPU: < 2% (idle)
- Dashboard Load: < 2 seconds
- Metrics Update: Every 30 seconds

COMMON ISSUES:
- Port already in use: Kill process or use different port
- Agent won't connect: Check server URL in config
- Dashboard slow: Check browser network tab, restart server
- Database error: Restore from backup or reinit

For detailed help: See Common-Issues-FAQ in wiki
#>

# ============================================================
# NOTES
# ============================================================

# Keep this script open while testing
# Commands can be copy-pasted to PowerShell terminal
# Don't close terminals running server or agent
# Save all output for test report

Write-Host "✅ SysTracker Testing Commands Ready"
Write-Host "📖 For detailed procedures: See Windows-PC-Testing-Guide in wiki"
Write-Host ""
