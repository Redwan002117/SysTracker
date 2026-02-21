# SysTracker Server Deployment Comparison

**Windows PC vs Ubuntu Server - Feature Parity & Differences**

---

## 📊 Deployment Overview

| Feature | Windows PC | Ubuntu Server | Notes |
|---------|-----------|---------------|-------|
| **OS** | Windows 10/11/Server | Ubuntu 20.04+ | Both fully supported |
| **Installation** | Single EXE + Service | Docker/Direct | Windows simpler |
| **Startup** | Auto-start as service | Systemd/Docker | Windows built-in |
| **Port** | 7777 (configurable) | 7777 (configurable) | Same |
| **Database** | SQLite (local) | PostgreSQL/SQLite | Data isolation |
| **Dashboard** | Bundled (embedded) | Bundled (static export) | Same UI |
| **Agents** | Supports all | Supports all | No difference |
| **Update** | Manual .exe replace | `docker pull` / `git pull` | Different mechanisms |

---

## ✅ Feature Parity

Both Windows and Ubuntu deployments support:
- ✅ Real-time metrics (CPU, RAM, Disk, Network)
- ✅ Remote command execution
- ✅ User management (Admin/Viewer roles)
- ✅ Alert policies with email notifications
- ✅ Agent auto-update mechanism
- ✅ SMTP email configuration
- ✅ JWT authentication
- ✅ API key for agent communication
- ✅ Database migrations
- ✅ Complete REST API
- ✅ Socket.IO real-time updates
- ✅ Dashboard customization

---

## 🎯 Use Cases

### Windows PC Server
**Best for:**
- Single administrator monitoring
- Small office deployments (1-10 machines)
- Windows-native environments
- Development/testing
- Running alongside existing Windows AD infrastructure

**Hardware:** 
- Minimum: Windows 10 + 2GB RAM
- Recommended: Windows 11 + 4GB RAM
- Single machine management

**Deployment Time:** 5 minutes

**Example Setup:**
```
Your Desktop (Windows 11)
 └─ SysTracker Server running as service
    └─ Monitors 5 workstations via agents
```

### Ubuntu Server 
**Best for:**
- Multi-machine enterprise deployments
- Cloud/Data center hosting
- Large-scale monitoring (50+ machines)
- Always-on dedicated server
- Docker/Kubernetes orchestration

**Hardware:**
- Minimum: Ubuntu 20.04 + 2GB RAM
- Recommended: Ubuntu 22.04 + 4GB RAM + SSD
- Scalable to multiple containers

**Deployment Time:** 10-15 minutes

**Example Setup:**
```
              ┌─────────────────────┐
              │  Ubuntu Server      │
              │  + SysTracker       │
              │  (Docker or Native) │
              └──────────┬──────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    Agent 1          Agent 2          Agent N
    (Windows)        (Linux)         (Windows)
```

---

## 🔄 Side-by-Side: Identical Functionality

### Viewing Machines
```windows
Browser: http://192.168.1.100:7777
User: admin
Password: xxxxxx
Machines: All connected agents visible
```

```linux
Browser: http://192.168.1.50:7777
User: admin
Password: xxxxxx
Machines: All connected agents visible
```

Both show identical dashboard and data.

### Installing Agents
```windows
# Windows Server - Download from Settings > Agent Management
SysTracker_Agent.exe --url http://192.168.1.100:7777 --key YOUR_API_KEY
```

```linux
# Ubuntu Server - Download from Settings > Agent Management (same EXE!)
SysTracker_Agent.exe --url http://192.168.1.50:7777 --key YOUR_API_KEY
```

Agents can be deployed to either server independently.

---

## 🔑 Key Differences

### Data Storage
| Aspect | Windows | Ubuntu |
|--------|---------|--------|
| **Database** | SQLite: `C:\Program Files\SysTracker Server\data\systracker.db` | SQLite (default) or PostgreSQL |
| **Location** | Local machine | Container volume or `/opt/systracker/data` |
| **Backup** | File copy | `docker exec` or file system |
| **Scalability** | Single machine | Can cluster with multiple containers |

### Management
| Task | Windows | Ubuntu |
|------|---------|--------|
| **Start** | `Start-Service SysTracker` | `docker-compose up -d` |
| **Stop** | `Stop-Service SysTracker` | `docker-compose down` |
| **Restart** | `Restart-Service SysTracker` | `docker-compose restart` |
| **Logs** | Event Viewer / Log file | `docker logs systracker` |
| **Update** | Replace .exe file | `docker pull` + `docker-compose up` |
| **Uninstall** | `nssm remove` + Delete folder | `docker-compose down` + Delete volume |

### Network Access
| Scenario | Windows | Ubuntu |
|----------|---------|--------|
| **Local Machine** | `http://localhost:7777` | `http://localhost:7777` |
| **Network LAN** | `http://<PC-IP>:7777` | `http://<Server-IP>:7777` |
| **Internet** | Requires port forward / tunnel | Requires reverse proxy / tunnel |
| **Firewall** | Windows Firewall rule | Ubuntu firewall (ufw) or cloud SG |

---

## 💾 Backup & Recovery

### Windows PC
```powershell
# Backup
Copy-Item "C:\Program Files\SysTracker Server\data\systracker.db" `
          "C:\Backups\systracker_backup.db"

# Restore
Copy-Item "C:\Backups\systracker_backup.db" `
          "C:\Program Files\SysTracker Server\data\systracker.db"
```

### Ubuntu Server
```bash
# Backup
cp /opt/systracker/data/systracker.db ~/backups/systracker_backup.db

# Or with Docker
docker exec systracker-server cp /app/data/systracker.db /backups/systracker_backup.db

# Restore
cp ~/backups/systracker_backup.db /opt/systracker/data/systracker.db
```

---

## 📦 Version Alignment

Both deployments run the **same version** of SysTracker:

- **Dashboard:** Identical UI components
- **Server:** Same API endpoints
- **Database Schema:** Same structure
- **Agent Compatibility:** 100% compatible

**Migration between platforms possible:** Export database from Windows, import to Ubuntu (or vice versa).

---

## 🚀 Scaling Model

### Windows PC
```
Single Windows PC
└─ SysTracker Server (single instance)
   └─ Can monitor 20-50 machines realistically
      (depends on hardware & metric frequency)
```

**Vertical scaling:** Upgrade PC RAM/CPU

### Ubuntu Server
```
Multiple Ubuntu Servers (optional clustering)
├─ Primary Server (writes)
└─ Replica Servers (read-only)

Or single server with elastic scaling (cloud).
```

**Horizontal scaling:** Add more containers/servers

---

## 💡 Deployment Decision Matrix

| Factor | Choose Windows | Choose Ubuntu |
|--------|---|---|
| **Scale: 1-5 machines** | ✅ | ✅ Either |
| **Scale: 5-50 machines** | ✅ | ✅ Ubuntu better |
| **Scale: 100+ machines** | ❌ | ✅ Required |
| **Always-on critical** | ❌ | ✅ Required |
| **Dev/Test environment** | ✅ | ✅ Either |
| **Existing Windows DC** | ✅ | ✅ Both work |
| **Cloud deployment** | ❌ | ✅ Required |
| **Docker/K8s** | ❌ | ✅ Required |
| **Simple 5-min setup** | ✅ | ✅ Docker |
| **Most control/flexibility** | ✅ | ✅ Native Ubuntu |

---

## 🔐 Security: Windows vs Ubuntu

Both implement:
- ✅ JWT authentication
- ✅ API key verification
- ✅ Password hashing (bcrypt)
- ✅ SQL injection prevention
- ✅ Role-based access control

**Windows-specific:**
- Windows Firewall integration
- Windows Services isolation
- NTFS permissions

**Ubuntu-specific:**
- SSH key-based access
- UFW firewall
- systemd security features
- SELinux/AppArmor (optional)

---

## 🎓 Quick Decision Guide

### I have a Windows PC and want to monitor a few machines:
➡️ Use **Windows Server deployment** (5-minute setup)

### I have a Linux server in a data center:
➡️ Use **Ubuntu Server deployment** (10-minute setup)

### I want to monitor both Windows workstations AND Linux servers:
➡️ Deploy **both** (independent servers) or use **Ubuntu** (agents work on all OS)

### I need 24/7 reliability:
➡️ Use **Ubuntu** with monitoring (enables redundancy)

### I want testing/development:
➡️ Use **Windows PC** (simpler to manage on local machine)

---

## 📋 Implementation Roadmap

### Phase 1: Single Server
- Deploy Windows OR Ubuntu server
- Configure SMTP, API key
- Install 5-10 agents
- Verify metrics flow

### Phase 2: Multi-Server (Optional)
- Deploy second server on different platform
- Agents report to respective servers independently
- Each server manages its own database
- No sync needed

### Phase 3: Scale-Up (Optional)
- Based on growth, move to Ubuntu infrastructure
- Migrate database (SQLite → PostgreSQL)
- Add redundancy with multiple server instances

---

## 📞 Which Should You Choose?

**I recommend:**
- **Windows PC** if: Single office, under 30 machines, exists already
- **Ubuntu Server** if: Enterprise, 50+ machines, always-on required, cloud

**Both can coexist:** Different teams/departments use different servers.

---

## ✅ Verification Checklist

After deployment (either platform):

- [ ] Dashboard loads: `http://<server-ip>:7777`
- [ ] Admin account created
- [ ] API key configured securely
- [ ] SMTP configured (if needed for alerting)
- [ ] First agent installed and appears in dashboard
- [ ] Metrics update every 3 seconds
- [ ] Can execute remote commands
- [ ] Alerts work (create test alert)
- [ ] Database backed up
- [ ] Logs monitored for errors

---

**Status:** Both implementations production-ready ✅  
**Last Updated:** February 21, 2026
