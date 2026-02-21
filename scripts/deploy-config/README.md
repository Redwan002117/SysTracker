# Deployment Configuration

This directory contains configuration files for remote deployment to different environments.

## Quick Start

1. **Copy the example configuration:**
   ```bash
   cp deploy-config/production.conf.example deploy-config/production.conf
   ```

2. **Edit the configuration:**
   ```bash
   nano deploy-config/production.conf
   ```

3. **Update the following required values:**
   - `REMOTE_USER` - Your SSH username
   - `REMOTE_HOST` - Your server hostname or IP
   - `REMOTE_PATH` - Server directory path
   - `PM2_APP_NAME` or `SYSTEMD_SERVICE` - Process manager configuration

4. **Test the deployment:**
   ```bash
   ./scripts/deploy-remote.sh production --dry-run
   ```

5. **Deploy for real:**
   ```bash
   ./scripts/deploy-remote.sh production --restart
   ```

## Available Environments

### Production (`production.conf`)
- **Purpose:** Live production server
- **Configuration:** [production.conf.example](production.conf.example)
- **Features:**
  - Backups enabled
  - Notifications on failure
  - Health check verification
  - Strict deployment procedures

### Staging (`staging.conf`)
- **Purpose:** Pre-production testing environment
- **Configuration:** [staging.conf.example](staging.conf.example)
- **Features:**
  - Mirrors production setup
  - Fewer backups retained
  - Test new features before production
  - Separate database required

### Demo (`demo.conf`)
- **Purpose:** Client demonstrations and showcases
- **Configuration:** [demo.conf.example](demo.conf.example)
- **Features:**
  - Rapid deployment
  - No backups (optional)
  - Development mode allowed
  - Can use sample data

## Configuration File Structure

Each configuration file contains the following sections:

### 1. SSH Configuration
```bash
REMOTE_USER="username"        # SSH username
REMOTE_HOST="server.com"      # Server hostname/IP
REMOTE_PORT="22"              # SSH port
```

### 2. Server Paths
```bash
REMOTE_PATH="/var/www/systracker"                              # Root directory
REMOTE_DASHBOARD_PATH="/var/www/systracker/server/dashboard-dist"  # Dashboard path
```

### 3. Process Management
Choose either PM2 or systemd:

**PM2 (Recommended):**
```bash
USE_PM2=true
PM2_APP_NAME="systracker"
```

**systemd:**
```bash
USE_SYSTEMD=true
SYSTEMD_SERVICE="systracker"
```

### 4. Backup Configuration
```bash
BACKUP_ENABLED=true                       # Create backup before deploy
BACKUP_PATH="/path/to/backups"            # Backup directory
MAX_BACKUPS=10                            # Number of backups to keep
```

### 5. Deployment Options
```bash
RESTART_AFTER_DEPLOY=true                 # Auto-restart after deploy
VERIFY_DEPLOYMENT=true                    # Verify deployment succeeded
CLEANUP_OLD_BUILDS=true                   # Remove old artifacts
```

### 6. Notifications
```bash
NOTIFY_ON_SUCCESS=false                   # Notify on success
NOTIFY_ON_FAILURE=true                    # Notify on failure
SLACK_WEBHOOK="https://..."               # Slack webhook URL
DISCORD_WEBHOOK="https://..."             # Discord webhook URL
```

## Setup Instructions

### Prerequisites

1. **SSH Access:**
   ```bash
   # Generate SSH key if you don't have one
   ssh-keygen -t rsa -b 4096 -C "your@email.com"
   
   # Copy key to server
   ssh-copy-id -p 22 username@server.com
   
   # Test connection
   ssh -p 22 username@server.com
   ```

2. **Server Directories:**
   ```bash
   # Create required directories on server
   ssh username@server.com
   sudo mkdir -p /var/www/systracker
   sudo mkdir -p /var/www/systracker/backups
   sudo chown -R username:username /var/www/systracker
   ```

3. **Process Manager:**
   
   **PM2 (Recommended):**
   ```bash
   # On server
   npm install -g pm2
   pm2 startup
   ```
   
   **systemd:**
   ```bash
   # Create service file
   sudo nano /etc/systemd/system/systracker.service
   sudo systemctl daemon-reload
   sudo systemctl enable systracker
   ```

### Webhook Setup (Optional)

**Slack:**
1. Go to https://api.slack.com/messaging/webhooks
2. Create an incoming webhook
3. Copy webhook URL to `SLACK_WEBHOOK` in config

**Discord:**
1. Go to Server Settings → Integrations → Webhooks
2. Create a new webhook
3. Copy webhook URL to `DISCORD_WEBHOOK` in config

## Usage Examples

### Basic Deployment
```bash
# Deploy to production
./scripts/deploy-remote.sh production

# Deploy to staging
./scripts/deploy-remote.sh staging

# Deploy to demo
./scripts/deploy-remote.sh demo
```

### Advanced Options
```bash
# Deploy without building locally
./scripts/deploy-remote.sh production --no-build

# Test deployment (dry-run)
./scripts/deploy-remote.sh production --dry-run

# Deploy and restart server
./scripts/deploy-remote.sh production --restart

# Combine options
./scripts/deploy-remote.sh production --no-build --restart
```

### From VS Code
```
Ctrl+Shift+P → Tasks: Run Task → Select:
- 🌐 Deploy to Production
- 🧪 Deploy to Staging
```

## Multiple Servers

You can create multiple configurations for different servers:

```bash
# Create multiple production configs
production.conf           # Primary production
production-us-east.conf   # US East server
production-eu-west.conf   # EU West server

# Deploy to specific server
./scripts/deploy-remote.sh production-us-east
```

## Security Best Practices

1. **SSH Keys:**
   - Use SSH keys instead of passwords
   - Protect your private key with a passphrase
   - Use different keys for different environments

2. **Configuration Files:**
   - Never commit actual .conf files to git
   - Only commit .example files
   - Add `deploy-config/*.conf` to .gitignore

3. **Webhooks:**
   - Keep webhook URLs secret
   - Use different webhooks for different environments
   - Rotate webhooks if compromised

4. **Server Access:**
   - Use non-root user for deployment
   - Restrict SSH access with firewall
   - Use fail2ban to prevent brute force

## Troubleshooting

### SSH Connection Failed
```bash
# Test SSH connection
ssh -v -p 22 username@server.com

# Check SSH key
ssh-add -l

# Add key if needed
ssh-add ~/.ssh/id_rsa
```

### Permission Denied
```bash
# Check directory ownership on server
ssh username@server.com "ls -la /var/www/"

# Fix permissions
ssh username@server.com "sudo chown -R username:username /var/www/systracker"
```

### Deployment Hangs
```bash
# Check server disk space
ssh username@server.com "df -h"

# Check process status
ssh username@server.com "pm2 status"

# View logs
ssh username@server.com "pm2 logs systracker"
```

### Rsync Errors
```bash
# Test rsync manually
rsync --dry-run -avz dashboard/out/ username@server.com:/var/www/systracker/server/dashboard-dist/

# Verify paths exist
ssh username@server.com "ls -la /var/www/systracker/server/"
```

## Files in This Directory

- `production.conf.example` - Production server template
- `staging.conf.example` - Staging server template
- `demo.conf.example` - Demo server template
- `README.md` - This file
- `*.conf` - Actual configurations (not in git)

## Related Documentation

- **[PRODUCTION_DEPLOYMENT.md](../PRODUCTION_DEPLOYMENT.md)** - Complete deployment guide
- **[DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md)** - Quick reference
- **[QUICK_REFERENCE.md](../QUICK_REFERENCE.md)** - Common commands
- **[scripts/deploy-remote.sh](../scripts/deploy-remote.sh)** - Deployment script

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review [PRODUCTION_DEPLOYMENT.md](../PRODUCTION_DEPLOYMENT.md)
3. Enable verbose mode: Add `set -x` to deploy-remote.sh
4. Check server logs: `pm2 logs` or `journalctl -u systracker`

---

**Last Updated:** February 21, 2026  
**Version:** 3.2.7
