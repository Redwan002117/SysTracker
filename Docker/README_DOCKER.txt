# ====================================================
# SysTracker Docker Deployment Guide
# ====================================================

## Quick Start

### Option 1: Docker Compose (Recommended)
```bash
cd /path/to/SysTracker
docker compose up -d
# Open http://localhost:7777
```

### Option 2: Docker Run
```bash
docker run -d \
  -p 7777:7777 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  -e JWT_SECRET=your-secret-min-32-chars \
  -e API_KEY=your-api-key-min-32-chars \
  --name systracker \
  ghcr.io/redwan002117/systracker:latest
```

### Option 3: Build from Source
```bash
# Build image
docker build -t systracker:latest .

# Run container
docker compose up -d
```

---

## CasaOS Installation

### METHOD 1: CasaOS "Custom App" (Standard)

1. In CasaOS, click "+" → "Install a Custom App"

2. Fill in these fields:
   - **Docker Image**: `ghcr.io/redwan002117/systracker:latest`
   - **Title**: SysTracker
   - **Web UI**: `http://172.17.0.1:7777` (or `http://0.0.0.0:7777`)
   - **Icon URL**: `https://raw.githubusercontent.com/Redwan002117/SysTracker/main/dashboard/public/logo.svg`
   - **Network**: `bridge`

3. Port Settings:
   - Host: `7777`
   - Container: `7777`

4. Volumes (CRITICAL):
   - Host: `/DATA/AppData/systracker/data` → Container: `/app/data`
   - Host: `/DATA/AppData/systracker/uploads` → Container: `/app/uploads`
   - Host: `/DATA/AppData/systracker/logs` → Container: `/app/logs`

5. Environment Variables (IMPORTANT):
   - `JWT_SECRET` = `your-secret-key-min-32-chars-change-this`
   - `API_KEY` = `your-api-key-min-32-chars-change-this`
   - `NODE_ENV` = `production`

6. Click "Install"

### METHOD 2: Docker Compose (Import)

1. In CasaOS, click "+" → "Install a Custom App" → top right "Import" icon
2. Select "Docker Compose"
3. Paste the contents of `Docker/docker-compose.yml`
4. **IMPORTANT**: Edit the environment variables to set your own secrets
5. Click Submit

---

## Configuration

### Required Environment Variables

```bash
PORT=7777                    # Server port
NODE_ENV=production          # Environment mode
DATABASE_PATH=./data/systracker.db  # Database location

# Security (MUST CHANGE IN PRODUCTION!)
JWT_SECRET=your-secret-key-min-32-chars
API_KEY=your-api-key-min-32-chars
```

### Optional Environment Variables

```bash
# URLs
FRONTEND_URL=http://localhost:7777
BACKEND_URL=http://localhost:7777

# SMTP Email Configuration
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-smtp-api-key
SMTP_FROM=noreply@yourdomain.com

# Auto-create admin user (remove after first run)
ADMIN_USER=admin
ADMIN_PASSWORD=ChangeMe!
```

### Generating Secure Secrets

```bash
# Generate JWT secret (32+ characters)
openssl rand -base64 32

# Generate API key (32+ characters)
openssl rand -hex 32
```

---

## Volumes

Persist important data with volumes:

- `/app/data` - SQLite database (critical)
- `/app/uploads` - User avatars and attachments
- `/app/logs` - Application logs

---

## Networking

### Local Network
```
http://localhost:7777
http://YOUR_LOCAL_IP:7777
```

### Cloudflare Tunnel

⚠️ **TROUBLESHOOTING: "Bad Gateway 502"**

If you get a 502 error with Cloudflare Tunnel:

**Problem**: Cloudflare is pointed to `127.0.0.1` (localhost)

**Solution**: In Cloudflare Dashboard, set Service URL to:
- Your **LAN IP**: `http://192.168.1.100:7777`
- Docker Gateway: `http://172.17.0.1:7777`
- Container Name: `http://systracker:7777`

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name monitor.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:7777;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket support for Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:7777;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## Management Commands

### View Logs
```bash
docker logs systracker
docker logs -f systracker  # Follow logs
docker logs --tail 100 systracker  # Last 100 lines
```

### Restart Container
```bash
docker restart systracker
```

### Stop/Start Container
```bash
docker stop systracker
docker start systracker
```

### Update to Latest Version
```bash
docker pull ghcr.io/redwan002117/systracker:latest
docker compose down
docker compose up -d
```

### Enter Container Shell
```bash
docker exec -it systracker sh
```

### Check Container Status
```bash
docker ps | grep systracker
docker stats systracker
```

---

## Building from Source

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum
- 5GB disk space

### Build Commands

```bash
# 1. Clone repository
git clone https://github.com/Redwan002117/SysTracker.git
cd SysTracker

# 2. Build Docker image
docker build -t systracker:latest .

# 3. Run with Docker Compose
docker compose up -d

# 4. Check logs
docker logs -f systracker
```

### Build for Multiple Architectures

```bash
# Setup buildx
docker buildx create --use

# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64,linux/arm/v7 \
  -t ghcr.io/redwan002117/systracker:latest \
  --push .
```

---

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs systracker

# Check if port is already in use
netstat -tulpn | grep 7777
lsof -i :7777

# Try different port
docker run -p 8080:7777 ...
```

### Database Permission Issues
```bash
# Fix volume permissions
sudo chown -R 1000:1000 ./data
```

### Can't Access Dashboard
```bash
# Check container is running
docker ps | grep systracker

# Check health
docker exec systracker node -e "require('http').get('http://localhost:7777/api/health')"

# Check network
docker exec systracker wget -O- http://localhost:7777
```

### Out of Disk Space
```bash
# Clean old images
docker system prune -a

# Clean build cache
docker builder prune
```

---

## Security Best Practices

1. **Change Default Secrets**: Never use default JWT_SECRET or API_KEY
2. **Use HTTPS**: Setup SSL with Nginx or Cloudflare
3. **Limit Exposure**: Don't expose port 7777 directly to internet
4. **Regular Backups**: Backup `/app/data` directory regularly
5. **Update Regularly**: Pull latest image for security updates

---

## Performance Tuning

### Resource Limits

Edit `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
    reservations:
      cpus: '0.5'
      memory: 512M
```

### Optimize Database

```bash
# Enter container
docker exec -it systracker sh

# Run VACUUM on database
sqlite3 data/systracker.db "VACUUM;"
```

---

## Backup & Restore

### Backup
```bash
# Backup database
docker exec systracker tar -czf /tmp/backup.tar.gz data/ uploads/
docker cp systracker:/tmp/backup.tar.gz ./backup-$(date +%Y%m%d).tar.gz
```

### Restore
```bash
# Stop container
docker compose down

# Restore files
tar -xzf backup-20260221.tar.gz

# Start container
docker compose up -d
```

---

## Support

- **GitHub**: https://github.com/Redwan002117/SysTracker
- **Issues**: https://github.com/Redwan002117/SysTracker/issues
- **Documentation**: https://github.com/Redwan002117/SysTracker/wiki

---

**Version**: 3.3.0
**Last Updated**: February 21, 2026
**Docker Image**: ghcr.io/redwan002117/systracker:latest

