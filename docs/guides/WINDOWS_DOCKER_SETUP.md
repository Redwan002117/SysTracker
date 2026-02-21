# SysTracker on Windows Docker Containers

**Docker Support for Windows Server Containers**

---

## Overview

Run SysTracker in Windows Docker containers instead of standalone EXE. Useful for:
- Containerized infrastructure
- Kubernetes on Windows
- Hybrid Docker environments
- CI/CD pipelines

---

## Prerequisites

### Windows Docker Desktop
- Windows 10/11 Pro/Enterprise
- Docker Desktop installed
- Container runtime: Windows Server Core
- 4GB RAM minimum

### Alternative: Windows Docker Server
- Windows Server 2022+
- Docker Server runtime
- Hyper-V enabled (for Linux containers)

---

## Quick Start: Windows Container

### Option 1: Build & Run Locally

```powershell
# Build image
docker build -f Docker/Dockerfile.windows -t systracker:windows .

# Run container
docker run -d `
  --name systracker `
  -p 7777:7777 `
  -v C:\systracker-data:/app/data `
  -e API_KEY="your_secure_key" `
  systracker:windows
```

### Option 2: Docker Compose

```powershell
# Start with docker-compose
docker-compose -f docker-compose.windows.yml up -d

# View logs
docker-compose -f docker-compose.windows.yml logs -f

# Stop
docker-compose -f docker-compose.windows.yml down
```

### Option 3: Kubernetes (Windows Pods)

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: systracker
spec:
  containers:
  - name: server
    image: systracker:windows
    ports:
    - containerPort: 7777
    env:
    - name: API_KEY
      value: "your_key"
    volumeMounts:
    - name: data
      mountPath: /app/data
  volumes:
  - name: data
    emptyDir: {}
```

---

## Configuration

### Environment Variables

```env
PORT=7777                               # Server port
API_KEY=your_secure_key_here           # Agent authentication
JWT_EXPIRES_IN=24h                     # Token expiration
SMTP_HOST=smtp.gmail.com               # Email (optional)
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_app_password
SMTP_SECURE=false
SMTP_FROM="SysTracker" <noreply@domain>
```

### Volume Mounts

```powershell
-v C:\systracker-data:/app/data       # Database & secrets
-v C:\systracker-logs:/app/logs       # Application logs
-v C:\systracker-uploads:/app/uploads # Profile pictures, etc
```

---

## Performance

### Windows Container Resource Usage
| Scenario | Memory | CPU |
|----------|--------|-----|
| Idle | 150-200 MB | <5% |
| 10 agents | 250-350 MB | 5-10% |
| 50 agents | 500-700 MB | 10-20% |

### Image Size
```
Base: mcr.microsoft.com/windows/servercore:ltsc2022 (~2 GB)
+ Node.js 18: +100 MB
+ Application & deps: +50 MB
Total image: ~2.15 GB (compressed ~700 MB)
```

---

## Networking

### Expose Port
```powershell
-p 7777:7777                           # Local access
-p 8080:7777                           # Different port
```

### Bridge Network
```powershell
docker run -d `
  --network my-network `
  -p 7777:7777 `
  systracker:windows
```

---

## Logging

### View Logs
```powershell
# Real-time logs
docker logs -f systracker

# Last 50 lines
docker logs --tail 50 systracker

# With timestamps
docker logs -f --timestamps systracker
```

### Log Files
Inside container: `/app/logs/`
- `service.log` - Application output
- `service-error.log` - Errors

---

## Health Checks

### Automatic Health Check
Container includes health check:
```
Check: HTTP GET /api/auth/status
Interval: 30 seconds
Timeout: 5 seconds
Retries: 3 before restart
```

### Manual Health Check
```powershell
docker exec systracker powershell -Command `
  "Invoke-WebRequest -Uri 'http://localhost:7777/api/auth/status'"
```

---

## Persistence

### Data Volumes
```powershell
# Named volume (recommended)
docker volume create systracker-data
docker run -v systracker-data:/app/data ...

# Host directory
docker run -v C:\systracker-data:/app/data ...
```

### Backup
```powershell
# Backup database
docker cp systracker:/app/data/systracker.db ./systracker_backup.db

# Restore database
docker cp ./systracker_backup.db systracker:/app/data/systracker.db
```

---

## Multi-Container Setup

### With Windows & Linux Containers

```yaml
version: '3.8'
services:
  systracker-windows:
    image: systracker:windows
    ports:
      - "7777:7777"
  
  systracker-linux:
    image: systracker:linux
    ports:
      - "7778:7777"
    networks:
      - systracker-net
```

---

## Troubleshooting

### Container Won't Start
```powershell
# Check logs
docker logs systracker

# Inspect container
docker inspect systracker

# Check resources
docker stats systracker
```

### Port Already in Use
```powershell
# Find what's using port 7777
netstat -ano | findstr :7777

# Use different port
docker run -p 8080:7777 systracker:windows
```

### Permission Issues
```powershell
# Run with elevated privileges
docker run --privileged systracker:windows
```

### Database Locked
```powershell
# Restart container
docker restart systracker

# Or rebuild volume
docker volume rm systracker-data
docker volume create systracker-data
```

---

## Production Deployment

### Docker Swarm
```powershell
# Initialize swarm
docker swarm init

# Deploy service
docker service create `
  --name systracker `
  --publish 7777:7777 `
  -e API_KEY="production_key" `
  systracker:windows
```

### Kubernetes on Windows
```bash
kubectl apply -f k8s-windows-deployment.yaml
kubectl port-forward pod/systracker 7777:7777
```

---

## Security

### Build Security
- Base image: Official Microsoft Windows Server Core
- Dependencies: Verified Node.js from official source
- Application: SysTracker source included

### Runtime Security
- No privileged mode by default
- Filesystem isolated per container
- Network sandboxed (bridge network)
- No shell access without explicit exec

### Configuration
- API key should be changed from default
- Use secrets manager for production keys
- Mount .env from secure location

---

## Comparison: Standalone vs Container

| Feature | Standalone .exe | Windows Container |
|---------|---|---|
| **Setup** | 5 minutes | 10 minutes (includes build) |
| **Performance** | Native | ~95% native |
| **Isolation** | None | Full filesystem isolation |
| **Updates** | Manual .exe replace | `docker pull` + restart |
| **Scaling** | Single machine | Multiple containers |
| **Orchestration** | None | Docker Compose, Swarm, K8s |
| **Rollback** | Manual backup | Docker image history |

---

## Advanced Configuration

### Custom .env File
```powershell
# Mount custom .env
docker run -v C:\path\to\.env:/app/.env systracker:windows
```

### Volume Permissions
```powershell
# Ensure container can write to volumes
icacls C:\systracker-data /grant "Everyone:(OI)(CI)F"
```

### Environment File
```powershell
docker run --env-file ./systracker.env systracker:windows
```

---

## Updating Container

### Pull New Image
```powershell
docker pull registry.example.com/systracker:v3.1.2-windows
```

### Rebuild from Source
```powershell
docker build -f Docker/Dockerfile.windows -t systracker:latest .
docker-compose -f docker-compose.windows.yml up --build -d
```

### Blue-Green Deployment
```powershell
# Keep old container running
docker run -p 7777:7777 systracker:v3.1.1-windows

# Start new container on different port
docker run -p 7778:7777 systracker:v3.1.2-windows

# Test new version, then switch traffic
# Keep old container for quick rollback
```

---

## Monitoring

### Container Metrics
```powershell
docker stats systracker

docker inspect systracker | Select-String -Pattern '"Status"'
```

### Application Metrics
```powershell
# Access via container
docker exec systracker powershell -Command `
  "Invoke-WebRequest -Uri 'http://localhost:7777/api/debug/config'"
```

---

## Development Setup

### Build for Testing
```powershell
# Dev build with debug logging
docker build `
  -f Docker/Dockerfile.windows `
  --build-arg DEBUG=true `
  -t systracker:dev-windows .

# Run with interactive terminal
docker run -it systracker:dev-windows powershell
```

### Volume Binding for Development
```powershell
docker run `
  -v C:\Projects\SysTracker\server:C:\app `
  -e NODE_ENV=development `
  systracker:windows
```

---

## Summary

Windows Docker support provides:
- ✅ Container-based deployment
- ✅ Kubernetes-ready
- ✅ Full isolation
- ✅ Easy updates & rollbacks
- ✅ Production-grade orchestration
- ✅ Same features as standalone EXE

---

**Related Documentation:**
- [Windows Standalone EXE](WINDOWS_SERVER_DEPLOYMENT.md)
- [Docker Compose (Linux)](Docker/README_DOCKER.txt)
- [Kubernetes Setup](../SYSTEM_INTEGRATION_REPORT.md)

**Status:** ✅ Production Ready  
**Last Updated:** February 21, 2026
