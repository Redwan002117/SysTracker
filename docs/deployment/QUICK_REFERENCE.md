# SysTracker Quick Reference Card

> Print this page and keep it handy during deployment!

---

## 🚀 Deployment Commands

### Local Development
```bash
# Build and deploy locally
./scripts/deploy-dashboard.sh

# Keyboard shortcut
Ctrl+Shift+D
```

### Remote Deployment
```bash
# Production deployment
./scripts/deploy-remote.sh production --restart

# Staging deployment
./scripts/deploy-remote.sh staging --restart

# Test before deploying (dry-run)
./scripts/deploy-remote.sh production --dry-run

# Deploy without building
./scripts/deploy-remote.sh production --no-build --restart
```

### VS Code Tasks
```
Ctrl+Shift+P → Tasks: Run Task → Select:
- 🚀 Deploy Dashboard (local)
- 🌐 Deploy to Production
- 🧪 Deploy to Staging
- 🔨 Build Dashboard Only
- ⚙️ Build & Quit
```

---

## 📂 Important Paths

### Local Development
```
Dashboard source:    /workspaces/SysTracker/dashboard/
Build output:        /workspaces/SysTracker/dashboard/out/
Deploy target:       /workspaces/SysTracker/server/dashboard-dist/
Deploy script:       /workspaces/SysTracker/scripts/deploy-dashboard.sh
```

### Production Server
```
Application root:    /var/www/systracker/
Server files:        /var/www/systracker/server/
Dashboard files:     /var/www/systracker/server/dashboard-dist/
Environment:         /var/www/systracker/server/.env
Backups:            /var/www/systracker/backups/
Logs:               /var/www/systracker/logs/
```

### Configuration Files
```
Production env:      .env.production.example
Deploy config:       deploy-config/production.conf
Nginx config:        /etc/nginx/sites-available/systracker
SSL certificates:    /etc/letsencrypt/live/yourdomain.com/
```

---

## 🔐 Common Environment Variables

```bash
# Server
PORT=7777
NODE_ENV=production
HOST=0.0.0.0

# Security
JWT_SECRET=your-secret-min-32-chars
API_KEY=your-api-key-min-32-chars

# Database
DATABASE_PATH=./data/systracker.db

# SMTP
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-smtp-api-key
SMTP_FROM=noreply@yourdomain.com

# URLs
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://yourdomain.com
```

---

## 🔧 Server Management

### PM2 Commands
```bash
# Start application
pm2 start server.js --name systracker

# Stop/restart
pm2 stop systracker
pm2 restart systracker

# View status
pm2 status
pm2 monit

# View logs
pm2 logs systracker
pm2 logs systracker --lines 100
pm2 logs systracker --err

# Save configuration
pm2 save
pm2 startup
```

### systemd Commands
```bash
# Start/stop service
sudo systemctl start systracker
sudo systemctl stop systracker
sudo systemctl restart systracker

# View status
sudo systemctl status systracker

# Enable auto-start
sudo systemctl enable systracker

# View logs
sudo journalctl -u systracker -f
sudo journalctl -u systracker --since today
sudo journalctl -u systracker -n 100
```

### Nginx Commands
```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# View status
sudo systemctl status nginx

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🔒 SSL/TLS Management

### Let's Encrypt (Certbot)
```bash
# Obtain certificate (first time)
sudo certbot --nginx -d yourdomain.com

# Renew certificate
sudo certbot renew
sudo certbot renew --force-renewal

# Check certificate
sudo certbot certificates

# Test auto-renewal
sudo certbot renew --dry-run
```

### Manual SSL Check
```bash
# Check certificate
openssl s_client -connect yourdomain.com:443

# Check expiry date
echo | openssl s_client -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## 🐛 Troubleshooting Commands

### Check Application
```bash
# Test server is running
curl -I http://localhost:7777
curl http://localhost:7777/api/health

# Test from outside
curl -I https://yourdomain.com
curl https://yourdomain.com/api/health
```

### Check Ports
```bash
# Check if port is listening
netstat -tulpn | grep 7777
lsof -i :7777
ss -tulpn | grep 7777
```

### Check Processes
```bash
# Find Node.js processes
ps aux | grep node
pgrep -a node

# Check resource usage
top -p $(pgrep node)
htop
```

### Check Disk Space
```bash
# Disk usage
df -h
du -sh /var/www/systracker/*

# Find large files
du -h /var/www/systracker | sort -rh | head -10
```

### Check Logs
```bash
# Application logs (PM2)
pm2 logs systracker --lines 100

# Application logs (systemd)
sudo journalctl -u systracker -n 100 -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# System logs
sudo tail -f /var/log/syslog
```

---

## 🔄 Backup & Restore

### Create Backup
```bash
# Manual backup
cd /var/www/systracker
tar -czf backups/dashboard-backup-$(date +%Y%m%d-%H%M%S).tar.gz server/dashboard-dist/
tar -czf backups/server-backup-$(date +%Y%m%d-%H%M%S).tar.gz server/

# Database backup
cp data/systracker.db backups/systracker-$(date +%Y%m%d-%H%M%S).db
```

### Restore Backup
```bash
# Restore dashboard
cd /var/www/systracker
tar -xzf backups/dashboard-backup-YYYYMMDD-HHMMSS.tar.gz

# Restore database
cp backups/systracker-YYYYMMDD-HHMMSS.db data/systracker.db

# Restart
pm2 restart systracker
```

---

## 🔍 Health Check URLs

```
Main dashboard:      https://yourdomain.com/
API health:          https://yourdomain.com/api/health
Server status:       https://yourdomain.com/api/status
WebSocket test:      wss://yourdomain.com/socket.io/
```

---

## 📞 Quick Links

| Document | Purpose |
|----------|---------|
| [PRODUCTION_SETUP_COMPLETE.md](PRODUCTION_SETUP_COMPLETE.md) | Overview of deployment system |
| [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) | Complete setup guide |
| [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) | Pre-launch checklist |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Quick deployment reference |

---

## ⚡ Keyboard Shortcuts (VS Code)

```
Ctrl+Shift+D    Deploy Dashboard
Ctrl+Shift+B    Build Dashboard Only
Ctrl+Shift+Q    Build & Quit
```

---

## 🆘 Emergency Procedures

### Application Not Responding
```bash
# 1. Check if running
pm2 status systracker

# 2. Check logs
pm2 logs systracker --err --lines 50

# 3. Restart
pm2 restart systracker

# 4. If still fails, reload from backup
cd /var/www/systracker/backups
ls -lt dashboard-backup-*.tar.gz | head -1
tar -xzf dashboard-backup-LATEST.tar.gz
pm2 restart systracker
```

### SSL Certificate Expired
```bash
# 1. Renew certificate
sudo certbot renew --force-renewal

# 2. Reload Nginx
sudo systemctl reload nginx

# 3. Verify
curl -I https://yourdomain.com
```

### Disk Full
```bash
# 1. Check space
df -h

# 2. Clean old backups
cd /var/www/systracker/backups
ls -lt | tail -n +11 | awk '{print $9}' | xargs rm

# 3. Clean PM2 logs
pm2 flush

# 4. Clean old logs
sudo journalctl --vacuum-time=7d
```

### Server Unreachable
```bash
# 1. Check server status
sudo systemctl status systracker

# 2. Check Nginx
sudo systemctl status nginx

# 3. Check firewall
sudo ufw status

# 4. Check network
ping -c 4 yourdomain.com
curl -I https://yourdomain.com
```

---

## 📊 Monitoring Commands

```bash
# Real-time monitoring
pm2 monit

# Resource usage
htop
free -h
df -h

# Network connections
netstat -an | grep 7777
ss -tulpn | grep 7777

# Check uptime
uptime
pm2 info systracker
```

---

**Last Updated:** February 21, 2026  
**Version:** 3.2.7  
**SysTracker Quick Reference** | Keep this handy during deployment!
