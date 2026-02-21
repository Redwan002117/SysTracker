# SysTracker — Self-Hosted Windows Fleet Monitoring

**SysTracker** is a powerful, self-hosted Remote Monitoring & Management (RMM) tool for Windows fleets.
Real-time telemetry, hardware inventory, process monitoring, Windows Event Logs — all on your own infrastructure.

![SysTracker Banner](https://raw.githubusercontent.com/Redwan002117/SysTracker/main/dashboard/public/banner.svg)

[![Version](https://img.shields.io/badge/version-3.2.1-blue.svg)](https://github.com/Redwan002117/SysTracker/releases/latest)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Website](https://img.shields.io/badge/website-systracker.rico.bd-informational)](https://systracker.rico.bd)

---

## Features

- **Real-Time Monitoring** — Live 3-5 second updates via Socket.IO across all connected agents
- **Hardware Inventory** — CPU, RAM modules, GPU, motherboard, disks, network adapters, serials, UUIDs
- **Process Monitoring** — Top processes with CPU%, RAM, and PID
- **Windows Event Logs** — Security and system events (login/logout, failures, service changes)
- **Fleet Overview** — All machines in a single dashboard with live status indicators
- **Remote Actions** — Restart or shut down machines remotely from the dashboard
- **Profile Management** — Assign names, floors, desks, asset IDs, and avatars to machines/users
- **JWT Authentication** — Secure admin login with token-based sessions
- **Static Dashboard** — Next.js exported frontend served directly by the Express server
- **Easy Deployment** — One-line PowerShell installer for agents; Docker support for the server

---

## Repository Structure

```
SysTracker/
├── server/          # Node.js (Express) backend — REST API, Socket.IO, SQLite
├── dashboard/       # Next.js frontend — static export served by the server
├── agent/           # Python agent — collects metrics, transmits to server
├── Docker/          # Docker Compose configurations
└── LICENSE          # SysTracker Proprietary License
```

---

## Quick Start

### Agent Installation (Windows — One Liner)

Open **PowerShell as Administrator** on any Windows machine you want to monitor:

```powershell
irm https://systracker.rico.bd/install | iex
```

The interactive installer will prompt for your Server URL and API key, install the agent as a Windows Scheduled Task, and start it automatically.

**Manual install:**
```powershell
.\SysTracker_Agent.exe --install --url https://your-server.com --key YOUR_API_KEY
```

**Manage the agent:**
```powershell
# Uninstall
.\SysTracker_Agent.exe --uninstall

# Kill switch
.\SysTracker_Agent.exe --kill

# Logs at: C:\Program Files\SysTracker Agent\agent.log
```

---

### Server Deployment

#### Option 1 — Docker Compose (Recommended)

```yaml
services:
  systracker:
    image: ghcr.io/redwan002117/systracker:latest
    container_name: systracker
    restart: unless-stopped
    ports:
      - "7777:7777"
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    environment:
      - ADMIN_USER=admin          # Optional: auto-creates admin account
      - ADMIN_PASSWORD=ChangeMe!  # Optional: skips Setup Wizard
```

```bash
docker compose up -d
# Open http://localhost:7777
```

#### Option 2 — Linux Native

```bash
chmod +x systracker-server-linux
./systracker-server-linux
# Open http://localhost:7777
```

#### Option 3 — Run from Source

```bash
# 1. Build the dashboard
cd dashboard && npm install && npm run build

# 2. Copy static export to server
cp -r dashboard/out/* server/dashboard-dist/

# 3. Start the server
cd server && npm install && node server.js
```

---

## Architecture

```
Admin Dashboard  (Next.js static export)
        |
        |  REST API + Socket.IO
        |
SysTracker Server  (Node.js / Express + SQLite)
        |
        |  HTTPS Agent Reports
   _____|_____
  /     |     \
Agent  Agent  Agent   (Windows, Python)
```

---

## Email / SMTP Configuration

Configure SMTP in the dashboard under **Settings > Email**. Recommended provider: **Brevo** (generous free tier).

| Setting  | Value                  |
|----------|------------------------|
| Host     | smtp-relay.brevo.com   |
| Port     | 587                    |
| Secure   | false (STARTTLS)       |
| User     | Your Brevo login email |
| Password | Brevo SMTP API key     |

---

## Remote Access (Cloudflare Tunnel)

To expose the server securely without opening firewall ports:

```bash
cloudflared tunnel run --url http://localhost:7777 systracker
```

Point agents to your public domain: `https://monitor.yourdomain.com`

---

## Development

```bash
# Agent (Python)
cd agent
pip install -r requirements.txt
pip install pyinstaller
pyinstaller SysTracker_Agent.spec   # outputs dist/SysTracker_Agent.exe

# Dashboard (Next.js)
cd dashboard
npm install
npm run dev     # development server on :3000
npm run build   # static export to out/

# Server (Node.js)
cd server
npm install
node server.js  # runs on :7777
```

---

## Code Signing

To sign Windows executables for release:

1. **Generate certificates** (Windows only):
   ```powershell
   .\scripts\create-codesign-cert.ps1
   ```

2. **Add GitHub Secrets**:
   - `CODESIGN_PFX_BASE64` — Base64-encoded PFX (from script output)
   - `CODESIGN_CA_BASE64` — Base64-encoded CA cert (optional but recommended)
   - `CODESIGN_PFX_PASSWORD` — PFX password (if you set one)

3. **Test**: Push a tag to trigger the release workflow with code signing enabled.

📚 **Full Guide:** [docs/CODE_SIGNING_SETUP.md](docs/CODE_SIGNING_SETUP.md)  
⚡ **Quick Reference:** [docs/CODE_SIGNING_QUICK_REF.md](docs/CODE_SIGNING_QUICK_REF.md)

---

## License

**SysTracker Proprietary License** — Personal and non-commercial use is permitted free of charge.
Commercial use, redistribution, or hosting as a service requires written permission from the author.

See [LICENSE](LICENSE) for full terms. Copyright (c) 2026 SysTracker / RedwanCodes.
