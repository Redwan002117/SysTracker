# SysTracker — System Monitoring Platform

**Latest Version:** 3.2.0
**Status:** Production Ready
**Updated:** February 2026

---

## Welcome to SysTracker

SysTracker is a self-hosted Remote Monitoring & Management (RMM) platform for Windows fleets.
It runs a lightweight Express server on Linux/Windows with Python agents deployed across your Windows machines for real-time monitoring.

---

## Quick Start

### Windows Agent (Any machine you want to monitor)

Open **PowerShell as Administrator**:

```powershell
irm https://systracker.rico.bd/install | iex
```

This downloads and installs the agent interactively — prompts for your Server URL and API key.

**Manual install:**
```powershell
.\SysTracker_Agent.exe --install --url https://your-server.com --key YOUR_API_KEY
```

**→ [Windows Quick Start Guide](Windows-Quick-Start)**
**→ [Windows PC Testing Guide](Windows-PC-Testing-Guide)**

### Server (Linux / Docker)

```bash
docker compose up -d   # uses docker-compose.yml from the server/ directory
# Open http://localhost:7777
```

**→ [Agent Deployment & Testing](Agent-Deployment-Testing)**
**→ [Deployment Team Guide](Deployment-Team-Guide)**

---

## Documentation

| Page | Purpose |
|------|---------|
| [Windows Quick Start](Windows-Quick-Start) | 60-second setup path |
| [Windows PC Testing Guide](Windows-PC-Testing-Guide) | Complete 4-5 hour testing procedure |
| [Agent Deployment & Testing](Agent-Deployment-Testing) | Deploy and validate agents |
| [Deployment Team Guide](Deployment-Team-Guide) | Team-based rollout procedures |
| [Common Issues & FAQ](Common-Issues-FAQ) | Troubleshooting reference |
| [Wiki Setup Guide](Wiki-Setup-Guide) | Maintaining this wiki |

---

## Architecture

```
Admin Dashboard  (Next.js static export → served by Express)
        |
        |  REST API + Socket.IO (:7777)
        |
SysTracker Server  (Node.js + SQLite)
        |
        |  HTTPS Agent Reports
   _____|_____
  /     |     \
Agent  Agent  Agent   (Windows, Python service)
```

---

## License

SysTracker Proprietary License — personal/non-commercial use free.
Commercial use requires written permission. See the [LICENSE](https://github.com/Redwan002117/SysTracker/blob/main/LICENSE) file.
