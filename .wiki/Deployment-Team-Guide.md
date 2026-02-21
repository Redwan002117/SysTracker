# Deployment Team - Complete Guide

## Overview

This guide provides all the information needed for deployment teams to:
1. ✅ Test on staging systems
2. ✅ Validate with agents
3. ✅ Plan production rollout
4. ✅ Train users and operators

---

## Phase 1: Staging Testing (Week 1)

### Setup Staging Environment

**Choose deployment method:**

**Option A: Windows Standalone (Easiest)**
```powershell
# Download systracker-server-win.exe
# Copy to staging PC
# Run executable
.\systracker-server-win.exe

# Access at http://staging-pc:7777
```

**Option B: Linux Docker**
```bash
docker-compose -f docker-compose.yml up -d
# Access at http://staging-server:7777
```

**Option C: macOS launchd**
```bash
git clone <repo>
cd SysTracker/server
npm install
launchctl load ~/Library/LaunchAgents/com.systracker.plist
# Access at http://localhost:7777
```

### Initial Testing Checklist

- [ ] Server starts without errors
- [ ] Dashboard loads at http://localhost:7777
- [ ] Setup wizard completes successfully
- [ ] Admin account created
- [ ] API key generated
- [ ] Database created and accessible
- [ ] Logs are being written
- [ ] Performance metrics normal

**Run automated validation:**
```powershell
# Windows
.\validate_windows_install.ps1

# Linux/macOS
./validate_linux_install.sh
```

---

## Phase 2: Agent Testing (Week 1-2)

### Deploy Test Agents

**Deploy agents to test systems:**

```powershell
# On test machine
cd agent
.\install_agent.ps1 -ServerURL http://staging-server:7777
```

**Verify agent connectivity:**

1. Open server dashboard
2. Navigate to "Machines"
3. Wait 30-60 seconds
4. Verify test agent appears
5. Check if metrics updating (CPU, Memory, Disk)

### Agent Testing Scenarios

| Scenario | Expected Result | Status |
|----------|---|---|
| Agent starts successfully | No errors in logs | ✅/❌ |
| Agent connects to server | Appears in dashboard within 60s | ✅/❌ |
| Metrics collected | CPU/Memory/Disk data visible | ✅/❌ |
| Real-time updates | Data refreshes every 30s | ✅/❌ |
| Server restart | Agent reconnects automatically | ✅/❌ |
| Network interruption | Agent handles gracefully | ✅/❌ |
| Agent restart | Server detects disconnect/reconnect | ✅/❌ |
| Multiple agents | All agents tracked independently | ✅/❌ |

### Performance Testing

**Monitor during test period:**

```bash
# Check server memory usage
ps aux | grep node

# Check server CPU usage
top -p $(pgrep -f node)

# Monitor for 24 hours
# Expected: Memory stable, CPU < 20% idle
```

**Expected Baselines:**
- Startup time: < 5 seconds
- Dashboard load: < 1 second
- API response: < 100ms
- Memory usage: 150-300 MB
- CPU usage (idle): < 5%

---

## Phase 3: Comprehensive Testing (Week 2)

### Functional Testing

**Start/Stop/Restart:**
```powershell
# Windows Service
Stop-Service systracker
Start-Service systracker

# Verify agents reconnect within 60 seconds
```

**Configuration Changes:**
```
1. Modify .env file
2. Change port to 7778
3. Restart server
4. Verify dashboard accessible on new port
5. Verify agents reconnect
```

**Data Persistence:**
```
1. Add systems, configure alerts
2. Create dashboard customizations
3. Restart server
4. Verify all data persists
```

### Security Testing

- [ ] API requires authentication
- [ ] JWT tokens expire properly
- [ ] HTTPS works (if configured)
- [ ] API rate limiting working (if enabled)
- [ ] Logs don't contain sensitive data

### Failover Testing

- [ ] Database backup working
- [ ] Restore from backup successful
- [ ] Agent continues running if server down
- [ ] Agent reconnects when server back up
- [ ] No data loss scenario testing

---

## Phase 4: User & Operator Training (Week 2-3)

### Training Checklist

### For System Administrators

**Topics to cover:**
- [ ] Installation procedures
- [ ] Service start/stop/restart
- [ ] Log location and analysis
- [ ] Database backup and restore
- [ ] Performance monitoring
- [ ] Troubleshooting common issues
- [ ] Escalation procedures

**Demo scenarios:**
1. Complete fresh installation
2. Backup and restore database
3. Restart service with connected agents
4. Debug and fix common problems

### For End Users

**Topics to cover:**
- [ ] Dashboard navigation
- [ ] View system metrics
- [ ] Set up alerts
- [ ] Create custom views
- [ ] Export reports
- [ ] Reset password

**Demo scenarios:**
1. Login and navigate
2. Add a new system
3. Set alert threshold
4. View historical data
5. Create custom dashboard

### For Operations Team

**Topics to cover:**
- [ ] Monitoring procedures
- [ ] Alert response
- [ ] Performance analysis
- [ ] Capacity planning
- [ ] Incident response
- [ ] Escalation procedures

**Documentation to provide:**
- [ ] Quick reference card (laminated)
- [ ] Runbook for common issues
- [ ] Contact list for support
- [ ] Emergency escalation procedure

---

## Pre-Production Checklist

### Infrastructure

- [ ] Network connectivity verified
- [ ] Firewall rules configured (port 7777)
- [ ] DNS resolved correctly
- [ ] SSL certificates installed (if required)
- [ ] Load balancer configured (if multi-instance)
- [ ] Backup system operational

### Configuration

- [ ] .env file configured for production
- [ ] Logging configured appropriately
- [ ] Database backups scheduled
- [ ] Email alerts configured (SMTP)
- [ ] Authentication settings finalized
- [ ] API rates configured

### Monitoring

- [ ] Health checks configured
- [ ] Alerting system active
- [ ] Logs being aggregated
- [ ] Performance baselines established
- [ ] Dashboard accessible
- [ ] Agent connectivity verified

### Documentation

- [ ] Runbooks completed
- [ ] Team trained
- [ ] Escalation procedures defined
- [ ] Contact list updated
- [ ] Backup procedures documented
- [ ] Disaster recovery plan ready

### Validation

- [ ] All validation tests pass
- [ ] Agent connectivity verified
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Data integrity confirmed
- [ ] Rollback plan tested

---

## Production Rollout Plan

### Day 1: Limited Rollout (10-20% of systems)

**Morning:**
- Deploy to 1-2 production systems
- Monitor continuously for 4 hours
- Run validation tests hourly
- Have rollback team on standby

**Afternoon:**
- Review logs and metrics
- Gather feedback from users
- Address any issues found
- Plan next batch deployment

**Evening:**
- Deploy to additional 5-10% of systems
- Continue monitoring
- Document experience
- Prepare Day 2 plan

### Day 2: Broader Rollout (30% total)

**Morning:**
- Deploy to next batch
- Continue monitoring
- Review Day 1 findings
- Adjust procedures if needed

**Afternoon/Evening:**
- Continue deployment to 30% mark
- Monitor health metrics
- Prepare for final rollout

### Day 3+: Full Rollout (100%)

**Phased deployment:**
- Deploy to remaining 70% of systems
- Continue 24/7 monitoring
- Maintain rollback capability
- Document all activities

**Post-rollout:**
- Day 1: Intensive monitoring (24/7)
- Days 2-7: Enhanced monitoring (business hours)
- Week 2: Normal operations

---

## Rollback Procedures

### Quick Rollback (< 5 minutes)

**If critical issues detected:**

**Windows:**
```powershell
# 1. Stop current service
Stop-Service systracker

# 2. Restore backup data
Copy-Item -Path "C:\backup\data" -Destination "C:\SysTracker\data" -Force

# 3. Restore previous executable
Copy-Item -Path "C:\backup\systracker-server-win.exe" `
    -Destination "C:\SysTracker\systracker-server-win.exe" -Force

# 4. Start service
Start-Service systracker

# 5. Verify
curl http://localhost:7777
```

**Linux:**
```bash
# Stop service
systemctl stop systracker

# Restore data
cp -r /backup/data /opt/systracker/data

# Revert code
cd /opt/systracker && git checkout <previous-commit>

# Restart
systemctl start systracker

# Verify
curl http://localhost:7777
```

### Full Rollback Plan

- Scope: Which systems affected?
- Impact: What functionality lost?
- Decision: Escalate or proceed?
- Execute: Run rollback procedures
- Verify: Validate rollback success
- Notify: Inform users completion

---

## Monitoring During Rollout

### Key Metrics to Watch

1. **Server Health**
   - Memory usage < 500MB
   - CPU usage < 50%
   - API response < 200ms
   - Errors in logs: 0

2. **Agent Connectivity**
   - Agent count increasing
   - Agent disconnect rate < 1%
   - Message queue (if any): stable
   - Network errors: minimal

3. **Dashboard Performance**
   - Page load: < 2 seconds
   - API response: < 100ms
   - Database queries: < 50ms
   - Error rate: 0%

4. **Data Quality**
   - Metrics collected: accurate
   - Timestamps: correct
   - No data loss detected
   - Storage growing normally

### Alert Thresholds

| Metric | Yellow | Red |
|--------|--------|-----|
| Memory | > 400MB | > 700MB |
| CPU | > 50% | > 80% |
| API Response | > 200ms | > 500ms |
| Agent Disconnect | > 2% | > 5% |
| Error Rate | > 1% | > 5% |
| Dashboard Load | > 2s | > 5s |

---

## Daily Operations

### Morning Checklist (Start of Day)

- [ ] Server running and healthy
- [ ] All agents connected
- [ ] No errors in logs
- [ ] Dashboard accessible
- [ ] Performance normal
- [ ] Backups completed successfully

### During Business Hours

- [ ] Monitor dashboards every hour
- [ ] Check for error logs
- [ ] Respond to alerts
- [ ] Collect metrics
- [ ] Document issues

### Evening Tasks (End of Day)

- [ ] Review day's logs
- [ ] Archive metrics
- [ ] Trigger database backup
- [ ] Document any issues
- [ ] Prepare next day report

### Weekly Tasks

- [ ] Analyze performance trends
- [ ] Review security logs
- [ ] Test disaster recovery
- [ ] Update documentation
- [ ] Plan capacity adjustments

---

## Support Escalation

### Level 1: Local Support
- Restart service
- Check connectivity
- Review logs
- Basic troubleshooting

### Level 2: System Administration
- Database issues
- Complex configuration
- Performance tuning
- Security review

### Level 3: Development Team
- Code issues
- API problems
- Architecture changes
- Emergency support

### Escalation Process
1. Document issue with logs
2. Try Level 1 procedures
3. If unresolved, escalate to Level 2
4. If still unresolved, escalate to Level 3
5. Document resolution for knowledge base

---

## Knowledge Base

### Common Scenarios

**Agent won't connect:**
→ [Check Agent Connectivity](../troubleshooting/Common-Issues#agent-connectivity)

**Server running slow:**
→ [Performance Troubleshooting](../troubleshooting/Performance)

**Dashboard not loading:**
→ [Dashboard Issues](../troubleshooting/Common-Issues#dashboard)

**Port already in use:**
→ [Port Conflicts](../troubleshooting/Common-Issues#port-conflicts)

---

## Success Criteria

✅ **Deployment Complete When:**
- All validation tests pass
- All agents reporting data
- Dashboard responsive
- No error logs
- Performance acceptable
- Team trained and confident
- Documentation complete

---

## Post-Deployment Review

### Metrics to Report

- Deployment duration
- Systems deployed
- Issues encountered
- Support calls received
- Performance analysis
- Cost/benefit analysis

### Team Feedback

- What went well?
- What could improve?
- Training gaps identified?
- Documentation gaps?
- Recommendations for next release?

---

**Last Updated:** February 21, 2025  
**Version:** 3.1.2  
**Status:** Ready for Production Rollout
