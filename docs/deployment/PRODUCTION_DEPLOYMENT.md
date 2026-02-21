# 🚀 SysTracker Production Deployment Guide

Complete guide for deploying SysTracker to production servers.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Server Setup](#server-setup)
- [Local Deployment](#local-deployment)
- [Remote Deployment](#remote-deployment)
- [Automated CI/CD](#automated-cicd)
- [Production Best Practices](#production-best-practices)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js**: v18+ or v20+
- **npm**: v9+ or v10+
- **Database**: SQLite3 (included)
- **Web Server**: Nginx or Apache (recommended)
- **Process Manager**: PM2 or systemd

### Server Requirements
- **RAM**: Minimum 1GB, recommended 2GB+
- **Storage**: 5GB minimum, 10GB+ recommended
- **OS**: Ubuntu 20.04+, Debian 11+, RHEL 8+, or Windows Server 2019+
- **Ports**: 3001 (or custom), 80/443 for reverse proxy

### Access Requirements
- SSH access to production server
- sudo/root privileges for service management
- Domain name (recommended)
- SSL certificate (Let's Encrypt recommended)

---

## Server Setup

### 1. Prepare Server Environment

#### Ubuntu/Debian
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install build tools
sudo apt install -y build-essential python3 git rsync

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

#### CentOS/RHEL
```bash
# Update system
sudo yum update -y

# Install Node.js 20.x
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Install build tools
sudo yum groupinstall -y "Development Tools"
sudo yum install -y git rsync

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo yum install -y nginx

# Install Certbot
sudo yum install -y certbot python3-certbot-nginx
```

### 2. Create Application Directory

```bash
# Create directory structure
sudo mkdir -p /var/www/systracker
sudo mkdir -p /var/www/systracker/server
sudo mkdir -p /var/www/systracker/backups
sudo mkdir -p /var/www/systracker/logs

# Set ownership (replace 'username' with your user)
sudo chown -R username:username /var/www/systracker
```

### 3. Deploy Application Files

```bash
# Clone repository (on server)
cd /var/www/systracker
git clone https://github.com/Redwan002117/SysTracker.git .

# Install server dependencies
cd server
npm install --production

# Or upload files via rsync (from local machine)
rsync -avz --exclude 'node_modules' \
  server/ username@your-server.com:/var/www/systracker/server/
```

### 4. Configure Environment

```bash
# Copy environment template
cd /var/www/systracker/server
cp ../.env.production.example .env

# Edit configuration
nano .env
```

**Required Configuration:**
```bash
NODE_ENV=production
PORT=3001
JWT_SECRET=$(openssl rand -base64 32)
API_KEY=$(openssl rand -hex 32)

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM="SysTracker <no-reply@yourdomain.com>"
```

### 5. Initialize Database

```bash
cd /var/www/systracker/server
node init_db.js
```

### 6. Setup PM2 Process Manager

```bash
# Start application with PM2
cd /var/www/systracker/server
pm2 start server.js --name systracker

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions printed by the command above
```

#### Alternative: systemd Service

Create `/etc/systemd/system/systracker.service`:

```ini
[Unit]
Description=SysTracker Monitoring System
After=network.target

[Service]
Type=simple
User=username
WorkingDirectory=/var/www/systracker/server
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
StandardOutput=append:/var/www/systracker/logs/server.log
StandardError=append:/var/www/systracker/logs/error.log

Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

**Enable and start:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable systracker
sudo systemctl start systracker
sudo systemctl status systracker
```

### 7. Configure Nginx Reverse Proxy

Create `/etc/nginx/sites-available/systracker`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/systracker-access.log;
    error_log /var/log/nginx/systracker-error.log;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Headers
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static file caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3001;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # File upload limits
    client_max_body_size 100M;
}
```

**Enable and test:**
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/systracker /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 8. Setup SSL Certificate

```bash
# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Verify auto-renewal
sudo certbot renew --dry-run

# Setup auto-renewal cron job (if not automatic)
sudo crontab -e
# Add: 0 0 * * * certbot renew --quiet
```

---

## Local Deployment

### Quick Deploy (Local to Server)

```bash
# Build dashboard
cd dashboard
npm install
npm run build

# Deploy to local server
cd ..
./scripts/deploy-dashboard.sh
```

**Output:**
```
╔═══════════════════════════════════════╗
║   SysTracker Dashboard Deployment    ║
╚═══════════════════════════════════════╝

🔨 Step 1: Building dashboard...
✓ Build completed successfully

🚀 Step 2: Deploying to server...
✓ Deployment completed successfully

📊 Step 3: Verifying deployment...
   Files deployed: 175
   Total size:     3.2M

╔═══════════════════════════════════════╗
║   ✓ Deployment Successful!           ║
╚═══════════════════════════════════════╝
```

---

## Remote Deployment

### Setup Remote Deployment

1. **Create SSH Key (if not exists):**
```bash
ssh-keygen -t ed25519 -C "deployment@systracker"
ssh-copy-id -i ~/.ssh/id_ed25519.pub username@your-server.com
```

2. **Create Deployment Configuration:**
```bash
mkdir -p deploy-config
cp deploy-config/production.conf.example deploy-config/production.conf
nano deploy-config/production.conf
```

**Configuration Example:**
```bash
# Production Server Configuration
REMOTE_USER="deployer"
REMOTE_HOST="systracker.yourdomain.com"
REMOTE_PORT="22"
REMOTE_PATH="/var/www/systracker"
REMOTE_SERVER_PATH="/var/www/systracker/server"
REMOTE_DASHBOARD_PATH="/var/www/systracker/server/dashboard-dist"

# Server Management
SERVER_SERVICE="systracker"
USE_PM2=true
PM2_APP_NAME="systracker"

# Deployment Options
BACKUP_BEFORE_DEPLOY=true
DEPLOY_ENV_FILE=false
RUN_MIGRATIONS=false

# Notifications (optional)
SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
DISCORD_WEBHOOK=""
```

3. **Deploy to Production:**
```bash
# Standard deployment
./scripts/deploy-remote.sh production

# Deploy without building (use cached build)
./scripts/deploy-remote.sh production --no-build

# Dry run (test without deploying)
./scripts/deploy-remote.sh production --dry-run

# Deploy and restart server
./scripts/deploy-remote.sh production --restart
```

---

## Automated CI/CD

### GitHub Actions Setup

The repository includes an automated deployment workflow that triggers on every push to main.

#### Configure GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add:

**Required Secrets:**
- `SSH_PRIVATE_KEY` - Your SSH private key for deployment
- `SSH_KNOWN_HOSTS` - Server's SSH fingerprint
- `REMOTE_USER` - SSH username
- `REMOTE_HOST` - Server hostname/IP
- `REMOTE_PATH` - Installation path on server
- `REMOTE_DASHBOARD_PATH` - Dashboard deployment path

**Optional Secrets:**
- `REMOTE_PORT` - SSH port (default: 22)
- `SERVER_SERVICE` - systemd service name
- `USE_PM2` - Set to `true` if using PM2
- `PM2_APP_NAME` - PM2 application name
- `SLACK_WEBHOOK` - Slack notifications
- `DISCORD_WEBHOOK` - Discord notifications

#### Get SSH Known Hosts

```bash
ssh-keyscan -H your-server.com
```

#### Manual Workflow Trigger

```bash
# Via GitHub CLI
gh workflow run deploy-dashboard.yml

# Or use GitHub UI:
# Actions → Deploy Dashboard to Production → Run workflow
```

---

## Production Best Practices

### 1. Security

✅ **Enable Firewall:**
```bash
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
```

✅ **Secure Environment Variables:**
- Never commit `.env` files
- Use strong JWT secrets and API keys
- Rotate credentials regularly

✅ **Regular Updates:**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js dependencies
npm audit fix
```

### 2. Monitoring

✅ **PM2 Monitoring:**
```bash
pm2 monit                  # Real-time monitoring
pm2 logs systracker       # View logs
pm2 status                # Check status
```

✅ **Server Resources:**
```bash
htop                      # CPU/Memory usage
df -h                     # Disk space
free -h                   # Memory usage
```

✅ **Application Logs:**
```bash
tail -f /var/www/systracker/logs/server.log
tail -f /var/log/nginx/systracker-access.log
```

### 3. Backups

✅ **Automated Database Backups:**
```bash
# Create backup script
cat > /var/www/systracker/scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/www/systracker/backups"
DATE=$(date +%Y%m%d-%H%M%S)
tar -czf "$BACKUP_DIR/db-backup-$DATE.tar.gz" \
  /var/www/systracker/server/systracker.db
# Keep only last 30 days
find "$BACKUP_DIR" -name "db-backup-*.tar.gz" -mtime +30 -delete
EOF

chmod +x /var/www/systracker/scripts/backup.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /var/www/systracker/scripts/backup.sh
```

### 4. Performance Optimization

✅ **Enable Gzip in Nginx:**
Add to nginx config:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
gzip_min_length 1000;
```

✅ **PM2 Cluster Mode:**
```bash
pm2 start server.js --name systracker -i max
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Check application status
pm2 status systracker

# Check Nginx status
sudo systemctl status nginx

# Check SSL certificate expiry
sudo certbot certificates

# Test endpoints
curl -I https://yourdomain.com
curl https://yourdomain.com/api/health
```

### Log Rotation

Create `/etc/logrotate.d/systracker`:

```
/var/www/systracker/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 username username
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Maintenance Tasks

**Daily:**
- Monitor logs for errors
- Check disk space
- Review application metrics

**Weekly:**
- Review backup integrity
- Check for security updates
- Review access logs

**Monthly:**
- Update dependencies
- Review and optimize database
- Test disaster recovery plan

---

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs systracker --lines 50

# Check environment variables
pm2 env 0

# Restart application
pm2 restart systracker

# Check port availability
sudo netstat -tulpn | grep 3001
```

### Nginx Errors

```bash
# Test configuration
sudo nginx -t

# Check error log
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Database Issues

```bash
# Check database file permissions
ls -la /var/www/systracker/server/systracker.db

# Backup and reinitialize if corrupted
cp systracker.db systracker.db.backup
node init_db.js
```

### Connection Issues

```bash
# Check firewall
sudo ufw status

# Check DNS
nslookup yourdomain.com

# Test SSL
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

### Performance Issues

```bash
# Check resource usage
htop
df -h
free -h

# Analyze slow queries
pm2 monit

# Clear PM2 logs
pm2 flush
```

---

## Quick Reference Commands

### Deployment
```bash
# Local deploy
./scripts/deploy-dashboard.sh

# Remote deploy
./scripts/deploy-remote.sh production

# Deploy with server restart
./scripts/deploy-remote.sh production --restart
```

### Server Management
```bash
# PM2
pm2 start/stop/restart systracker
pm2 logs systracker
pm2 monit

# systemd
sudo systemctl start/stop/restart systracker
sudo systemctl status systracker
sudo journalctl -u systracker -f
```

### Nginx
```bash
sudo nginx -t                    # Test config
sudo systemctl reload nginx      # Reload
sudo systemctl restart nginx     # Restart
```

### SSL
```bash
sudo certbot renew              # Renew certificates
sudo certbot certificates       # List certificates
```

---

## Support & Documentation

- **Repository**: https://github.com/Redwan002117/SysTracker
- **Wiki**: https://github.com/Redwan002117/SysTracker/wiki
- **Issues**: https://github.com/Redwan002117/SysTracker/issues

---

**Last Updated**: February 2026  
**Version**: 3.2.7
