# 🚀 Production Deployment Checklist

Use this checklist to ensure a smooth production deployment of SysTracker.

## Pre-Deployment

### Server Infrastructure
- [ ] Server provisioned (minimum 2GB RAM, 10GB storage)
- [ ] Operating system updated
- [ ] Domain name configured and DNS propagated
- [ ] Firewall configured (ports 22, 80, 443)
- [ ] Backup system configured

### Software Installation
- [ ] Node.js 20.x installed
- [ ] npm updated to latest version
- [ ] PM2 or systemd configured
- [ ] Nginx installed and configured
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] Git installed
- [ ] rsync installed

### Security
- [ ] SSH key-based authentication configured
- [ ] Password authentication disabled for SSH
- [ ] Sudo access configured for deployment user
- [ ] JWT_SECRET generated (32+ characters)
- [ ] API_KEY generated (64+ characters)
- [ ] Firewall rules applied
- [ ] Fail2ban or similar installed (optional)

### Application Setup
- [ ] Application directory created (`/var/www/systracker`)
- [ ] Proper file permissions set
- [ ] Environment file configured (`.env`)
- [ ] Database initialized
- [ ] Admin user created
- [ ] SMTP credentials configured (if using email)

## Deployment

### Local Deployment
- [ ] Dashboard built successfully (`npm run build`)
- [ ] No TypeScript errors
- [ ] Build output verified (`dashboard/out/`)
- [ ] Deployment script tested
- [ ] Files copied to server directory

### Remote Deployment
- [ ] SSH connection tested
- [ ] Deployment configuration created
- [ ] Remote directory structure verified
- [ ] Backup before deployment created
- [ ] Dashboard deployed via rsync
- [ ] File permissions verified on server

### Server Configuration
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed and verified
- [ ] HTTP to HTTPS redirect working
- [ ] WebSocket connections working
- [ ] Static file caching configured
- [ ] Gzip compression enabled
- [ ] Security headers added

### Application Start
- [ ] Application started with PM2/systemd
- [ ] Application accessible on localhost:3001
- [ ] PM2 startup script saved
- [ ] Application auto-starts on reboot
- [ ] Logs configured and rotation setup

## Post-Deployment Testing

### Basic Functionality
- [ ] Website accessible via domain
- [ ] SSL certificate valid (no warnings)
- [ ] Login page loads correctly
- [ ] User authentication works
- [ ] Dashboard displays properly
- [ ] Real-time updates working (WebSocket)

### Feature Testing
- [ ] Machine monitoring working
- [ ] Alerts system functional
- [ ] Chat feature operational
- [ ] Mail system working
- [ ] User management accessible
- [ ] Settings can be updated
- [ ] Profile updates working

### Performance Testing
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] WebSocket latency acceptable
- [ ] No memory leaks during operation
- [ ] CPU usage reasonable under load

### Security Testing
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Security headers present
- [ ] XSS protection enabled
- [ ] CSRF protection working
- [ ] API authentication required
- [ ] Rate limiting functional

### Browser Compatibility
- [ ] Chrome/Edge working
- [ ] Firefox working
- [ ] Safari working
- [ ] Mobile browsers working

## Monitoring Setup

### Application Monitoring
- [ ] PM2 monitoring configured
- [ ] Application logs accessible
- [ ] Error logging working
- [ ] Log rotation configured
- [ ] Health check endpoint working

### Server Monitoring
- [ ] CPU/RAM monitoring setup
- [ ] Disk space monitoring
- [ ] Network monitoring
- [ ] Nginx logs accessible
- [ ] SSL certificate expiry monitoring

### Alerting
- [ ] Critical error alerts configured
- [ ] Disk space alerts setup
- [ ] Service down alerts configured
- [ ] SSL expiry alerts setup
- [ ] Backup failure alerts configured

## Backup & Recovery

### Backup Configuration
- [ ] Database backup script created
- [ ] Automated daily backups configured
- [ ] Backup retention policy set
- [ ] Backup storage location configured
- [ ] Off-site backup configured (optional)

### Recovery Testing
- [ ] Database restore tested
- [ ] Application restore tested
- [ ] Recovery time documented
- [ ] Rollback procedure documented

## CI/CD Setup (Optional)

### GitHub Actions
- [ ] Deployment workflow configured
- [ ] GitHub secrets added
- [ ] SSH keys configured
- [ ] Automated build tested
- [ ] Automated deployment tested
- [ ] Notification webhooks configured

### Deployment Automation
- [ ] Remote deployment script configured
- [ ] Deployment configuration file created
- [ ] SSH known hosts configured
- [ ] Backup before deploy enabled
- [ ] Server restart automated

## Documentation

### Internal Documentation
- [ ] Server access details documented
- [ ] Deployment procedures documented
- [ ] Rollback procedures documented
- [ ] Troubleshooting guide created
- [ ] Monitoring dashboard documented

### User Documentation
- [ ] User guide updated
- [ ] API documentation updated
- [ ] Agent installation guide updated
- [ ] FAQ updated
- [ ] Known issues documented

## Final Checks

### Pre-Launch
- [ ] All features tested and working
- [ ] Performance benchmarks met
- [ ] Security scan completed
- [ ] Team access configured
- [ ] Support channels ready

### Launch
- [ ] Production URL announced
- [ ] DNS propagation verified
- [ ] Initial monitoring period (24h)
- [ ] User feedback collected
- [ ] Quick fixes deployed if needed

### Post-Launch
- [ ] Performance metrics collected
- [ ] Error rates monitored
- [ ] User issues addressed
- [ ] Team debriefing completed
- [ ] Lessons learned documented

---

## Quick Commands Reference

### Check Service Status
```bash
pm2 status systracker
sudo systemctl status nginx
sudo certbot certificates
```

### View Logs
```bash
pm2 logs systracker --lines 50
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
pm2 restart systracker
sudo systemctl reload nginx
```

### Emergency Rollback
```bash
cd /var/www/systracker/backups
tar -xzf dashboard-backup-YYYYMMDD-HHMMSS.tar.gz -C ..
pm2 restart systracker
```

---

## Troubleshooting Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| 502 Bad Gateway | `pm2 restart systracker` |
| SSL Certificate Error | `sudo certbot renew --force-renewal` |
| Out of Disk Space | Clean logs: `pm2 flush` and `sudo journalctl --vacuum-time=7d` |
| High CPU Usage | Check logs, restart: `pm2 restart systracker` |
| Database Locked | Stop app, backup DB, restart |
| WebSocket Not Working | Check Nginx WebSocket config, reload Nginx |

---

## Emergency Contacts

**Development Team:**
- Name: _______________
- Email: _______________
- Phone: _______________

**Infrastructure Team:**
- Name: _______________
- Email: _______________
- Phone: _______________

**Hosting Provider:**
- Support: _______________
- Account: _______________
- Emergency: _______________

---

## Sign-Off

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Reviewed By:** _______________  
**Approved By:** _______________  

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

---

**Version:** 3.2.7  
**Last Updated:** February 2026
