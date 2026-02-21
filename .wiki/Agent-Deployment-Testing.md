# Agent Deployment & Testing

## Agent Overview

Agents are lightweight processes deployed on systems you want to monitor. They:
- Collect system metrics (CPU, Memory, Disk, Network)
- Send data to the server
- Receive commands from server
- Run in background automatically

---

## Quick Agent Deployment

### Windows Agent (5 minutes)

**Step 1: Download**
- Download agent installer from server dashboard
- Or from: `agent/client_agent.js` (requires Node.js)

**Step 2: Install**
```powershell
# Navigate to download directory
cd Downloads

# Run installer (if executable)
.\install_agent.ps1

# Follow prompts:
# 1. Enter server URL: http://your-server:7777
# 2. Choose installation method
# 3. Start service
```

**Step 3: Verify**
- Dashboard should show new system within 60 seconds
- Check system appears and metrics updating

---

### Linux Agent

```bash
# Download from server dashboard
# Or clone repository
git clone <repo>
cd SysTracker/agent

# Install dependencies
npm install

# Run agent
node client_agent.js --server=http://your-server:7777

# Or as service with systemd/PM2
pm2 start client_agent.js --name=systracker-agent
```

---

### macOS Agent

```bash
# Install Node.js if needed
brew install node

# Clone and setup
git clone <repo>
cd SysTracker/agent
npm install

# Create launchd plist for auto-start
# Or run manually:
node client_agent.js --server=http://your-server:7777
```

---

## Agent Testing

### Basic Connectivity Test

**Step 1: Start Agent**
```bash
# Windows
.\agent\client_agent.js

# Linux/macOS
node agent/client_agent.js --server=http://localhost:7777
```

**Step 2: Check Logs**
```
Agent should output:
"Connected to server"
"Sending metrics"
"Successfully sent"
```

**Step 3: Check Dashboard**
```
Dashboard → Machines → [New System]
Status: Online ✓
Metrics: Updating ✓
```

---

### Comprehensive Test Checklist

✅ **Connection Tests**
- [ ] Agent connects without errors
- [ ] Dashboard shows system within 60 seconds
- [ ] Status shows "Online"
- [ ] Last sync timestamp recent

✅ **Metric Collection**
- [ ] CPU metrics displayed
- [ ] Memory metrics displayed
- [ ] Disk metrics displayed
- [ ] Network metrics (if available)
- [ ] Metrics update every 30 seconds

✅ **Robustness Tests**
- [ ] Server disconnect → Agent waits peacefully
- [ ] Server restart → Agent reconnects automatically
- [ ] Agent restart → Dashboard detects offline then online
- [ ] Agent crash → Can restart without issues
- [ ] Long running → No memory leaks after 24 hours

✅ **Multi-Agent Tests**
- [ ] Deploy 5+ agents simultaneously
- [ ] All appear in dashboard
- [ ] Each tracked independently
- [ ] No conflicts or issues

✅ **Performance Tests**
- [ ] Agent memory < 100MB
- [ ] Agent CPU < 2% idle
- [ ] Network bandwidth minimal
- [ ] No slow API responses

---

## Test Scenarios

### Scenario 1: Fresh Installation

**Setup:**
1. Clean system
2. Download agent
3. Run installer

**Expected Results:**
- Agent installs without errors
- Agent starts automatically
- Appears in dashboard within 60 seconds
- Metrics collecting
- Service runs in background

**Pass/Fail:** ✅/❌

---

### Scenario 2: Network Interruption

**Setup:**
1. Agent running and connected
2. Server running and monitoring

**Test:**
1. Disconnect network cable / disable WiFi
2. Wait 30 seconds
3. Reconnect network

**Expected Results:**
- Agent handles disconnect gracefully
- No crashes or errors
- Agent reconnects automatically
- Dashboard reflects status change
- Metrics resume after reconnection

**Pass/Fail:** ✅/❌

---

### Scenario 3: Server Restart

**Setup:**
1. Multiple agents connected
2. Dashboard showing all systems

**Test:**
1. Restart server (service restart)
2. Monitor agent behavior
3. Verify dashboard

**Expected Results:**
- Server restarts cleanly
- Agents disconnect gracefully
- Agents reconnect within 60 seconds
- All agents show "Online"
- No data loss

**Pass/Fail:** ✅/❌

---

### Scenario 4: Long-Running Stability

**Setup:**
1. Deploy agents on test systems
2. Let run for 24+ hours
3. Monitor resource usage

**Expected Results:**
- Agent memory stable (no leak)
- Agent CPU stable (no spike)
- Continuous data collection
- Zero errors in logs
- No manual intervention needed

**Pass/Fail:** ✅/❌

---

### Scenario 5: Upgrade Compatibility

**Setup:**
1. Old agent version running
2. Update server to new version
3. Leave old agent running

**Expected Results:**
- Old agent still connects
- New version works with old agent
- No compatibility issues
- Backward compatible

**Pass/Fail:** ✅/❌

---

## Agent Configuration

### Server URL

Required when starting agent:

```bash
# Format
http://[server-ip]:[port]

# Examples
http://192.168.1.100:7777
http://systracker.company.com:7777
https://systracker.company.com:443  # With SSL/TLS
```

---

### Environment Variables

```bash
# Server URL
export SYSTRACKER_SERVER=http://your-server:7777

# Agent name/identifier
export AGENT_NAME=workstation-01

# Polling interval (seconds)
export POLL_INTERVAL=30

# Debug mode
export DEBUG=true
```

---

### Configuration File

(`agent/config.json`):

```json
{
  "server": "http://localhost:7777",
  "pollInterval": 30,
  "agentName": "auto-generated",
  "enableSSL": false,
  "debug": false
}
```

---

## Monitoring Agents

### From Dashboard

Navigate to **Machines**:
- See all connected agents
- Click for detailed metrics
- View historical data
- Configure alerts

---

### From Command Line

**Windows Service Status:**
```powershell
Get-Service systracker-agent
```

**Linux systemd Status:**
```bash
systemctl status systracker-agent
```

**Check Process:**
```bash
ps aux | grep agent
```

---

### Resource Usage

**Monitor Agent Memory:**
```bash
# Windows Task Manager
# Linux: top
# macOS: Activity Monitor

# Expected: 50-150MB
```

**Monitor Agent CPU:**
```bash
# Expected: < 2% idle
# Spike during metric collection: normal
```

---

## Troubleshooting Agents

### Agent won't start

**Check 1: Prerequisites**
```bash
# Is Node.js installed?
node --version
npm --version

# Is it v12+?
```

**Check 2: Permissions**
```bash
# Do you have read permissions?
ls -la client_agent.js

# Fix if needed:
chmod +x client_agent.js
```

**Check 3: Dependencies**
```bash
# Are dependencies installed?
npm install

# Any missing packages?
```

---

### Agent won't connect to server

**Check 1: Server URL**
```bash
# Test connectivity
ping your-server-ip
telnet your-server-ip 7777

# Or:
curl http://your-server:7777
```

**Check 2: Config**
```bash
# Check config file or params
cat config.json
# or
node client_agent.js --help
```

**Check 3: Server Running**
```bash
# Is server accepting connections?
http://your-server:7777/api/auth/status
# Should return HTTP 200
```

---

### Agent stops after running

**Check logs:**
```bash
# Windows: Event Viewer or log file
# Linux/macOS: terminal output or syslog

# Look for error messages
tail -50 agent.log
```

**Common causes:**
1. Network connectivity lost
2. Server stopped
3. Memory issue (check free RAM)
4. Permission error
5. Port blocked by firewall

---

## Performance Testing

### Load Test: 100+ Agents

**Setup:**
```
Deploy 100+ agents to same server
Monitor dashboard and resource usage
Track for 1 hour baseline
```

**Monitor:**
- Server memory
- Server CPU
- Network bandwidth
- Dashboard responsiveness
- Database size growth

**Expected Results:**
- Server handles smoothly
- Memory < 500MB
- CPU < 50%
- No connection failures
- Dashboard responsive

---

### Stress Test: Network Conditions

**Simulate:**
- High latency (slow network)
- Packet loss
- Intermittent connectivity
- Bandwidth throttling

**Agent behavior:**
- Graceful degradation
- Automatic retry/reconnect
- No crashes
- DATA preserved

---

## Success Criteria

✅ **Agent Deployment Ready When:**

- [ ] Agents deploy without errors
- [ ] Agents connect to server reliably
- [ ] Metrics collecting accurately
- [ ] Dashboard shows all agents
- [ ] Agents handle network issues
- [ ] Performance acceptable
- [ ] No resource leaks
- [ ] Documentation clear

---

## Next Steps

1. **Deploy to Staging** - Test with 10-20 systems
2. **Monitor for 24 hours** - Verify stability
3. **Deploy to Production** - Full rollout
4. **Continuous Monitoring** - Ongoing operations

---

**Last Updated:** February 21, 2025  
**Version:** 3.1.2  
**Agent Status:** Production Ready
