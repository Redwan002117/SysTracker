# SysTracker v3.3.0 — Start Here

**Current production version: 3.3.0**

---

## ✨ What's New in v3.3.0

### Modern Dashboard Design
- 🎨 Complete UI redesign with Glassmorphism and Soft UI Evolution
- ✨ Smooth animations (200-300ms) throughout the interface
- 🎯 Blue-to-purple gradient theme with enhanced shadows
- ♿ WCAG AA+ accessibility compliance
- 📱 Fully responsive design for all devices

### Production-Ready Deployment
- 🚀 Remote SSH deployment automation (`deploy-remote.sh`)
- 🤖 GitHub Actions CI/CD pipeline for automated deployments
- 💾 Automatic backup and rollback capabilities
- 🌐 Multi-environment support (production/staging/demo)
- 🔔 Slack/Discord webhook notifications

### What's Ready

### Server
- Docker image: `ghcr.io/redwan002117/systracker:latest`
- Linux binary: `systracker-server-linux` (in `server/` directory)
- **Port:** 7777
- **Dashboard:** Accessible at `http://your-server:7777`

### Agent (Windows)
- **One-line install (recommended):**
  ```powershell
  irm https://systracker.rico.bd/install | iex
  ```
- **Manual install from EXE:**
  ```powershell
  .\SysTracker_Agent.exe --install --url https://your-server.com --key YOUR_API_KEY
  ```
- Installs as a Windows Scheduled Task, auto-starts on boot
- Logs at: `C:\Program Files\SysTracker Agent\agent.log`

---

## Wiki Pages

| Page | Purpose | Start Here? |
|------|---------|-------------|
| [Windows Quick Start](Windows-Quick-Start) | Fastest setup path | Yes |
| [Windows PC Testing Guide](Windows-PC-Testing-Guide) | Full 4-5 hour test | Thorough testing |
| [Agent Deployment & Testing](Agent-Deployment-Testing) | Agent procedures | Agent focus |
| [Deployment Team Guide](Deployment-Team-Guide) | Team rollout | Team deployments |
| [Common Issues & FAQ](Common-Issues-FAQ) | Troubleshooting | When stuck |

---

## Your Next Steps

### Step 1: Start the Server (5 minutes)
Choose your method:

**Docker (recommended):**
```bash
cd server
docker compose up -d
```

**Linux native:**
```bash
chmod +x systracker-server-linux
./systracker-server-linux
```

Open `http://localhost:7777` and complete the setup wizard.

### Step 2: Install an Agent (5 minutes)

On a Windows machine (PowerShell as Administrator):
```powershell
irm https://systracker.rico.bd/install | iex
```

Follow the prompts: enter your server URL and the API key from your dashboard.

### Step 3: Verify Monitoring
- Open the dashboard at `http://your-server:7777`
- You should see the machine appear within 30 seconds
- Check CPU, RAM, disk, and network metrics are updating

---

## Troubleshooting

**Agent not appearing in dashboard?**
1. Check agent logs: `C:\Program Files\SysTracker Agent\agent.log`
2. Verify the server URL is reachable from the agent machine
3. Confirm the API key is correct (Dashboard > Settings > API Keys)
4. Check Windows Firewall allows outbound HTTPS to your server

**→ [Common Issues & FAQ](Common-Issues-FAQ)**
