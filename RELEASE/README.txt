# SysTracker - System Monitoring Solution
Version: v1.1.5

This package contains everything you need to deploy SysTracker on Windows, Linux, or Docker.

## ⚠️ IMPORTANT: WINDOWS SECURITY WARNING
When running `SysTracker_Admin.exe` or `SysTracker_Agent.exe` for the first time, Windows Defender SmartScreen might block it with a blue popup saying **"Windows protected your PC"**.

**This is normal.** It happens because this application is not "digitally signed" with a costly enterprise certificate.
**To Run It:**
1.  Click **"More info"**.
2.  Click **"Run anyway"**.

---

## FOLDER STRUCTURE
1.  **Server_Windows**: Contains `SysTracker_Admin.exe`. Run this on a Windows Server/PC to host the dashboard.
2.  **Server_Linux**: Contains `SysTracker_Admin_Linux`. Run this on Ubuntu/Debian servers.
3.  **Agent_Windows**: Contains `SysTracker_Agent.exe`. Deploy this to client PCs you want to monitor.
4.  **Agent_Legacy_x86**: Python source code for older 32-bit Windows PCs that can't run the EXE.
5.  **Docker**: Documentation & Files for containerized deployment (CasaOS, Portainer, etc.).

---

## 1. SETTING UP THE ADMIN SERVER

### OPTION A: Windows
1.  Go to `Server_Windows`.
2.  Run `SysTracker_Admin.exe`.
3.  Access Dashboard: `http://localhost:7777`

### OPTION B: Linux (Ubuntu/Debian)
1.  Go to `Server_Linux`.
2.  Run `chmod +x SysTracker_Admin_Linux`
3.  Run `./SysTracker_Admin_Linux`
4.  Access Dashboard: `http://YOUR_SERVER_IP:7777`

### OPTION C: Docker / CasaOS
1.  Go to `Docker` folder.
2.  Read `README_DOCKER.txt`.
3.  **Image Name**: `ghcr.io/redwan002117/systracker:latest`

---

## 2. DEPLOYING AGENTS (CLIENTS)

### Standard Deployment (Windows 64-bit)
1.  Go to `Agent_Windows`.
2.  Copy `SysTracker_Agent.exe` to the client PC.
3.  **Run it**. 
    *   *Note*: This binary connects to `https://monitor.rico.bd/api` by default.
    *   **To Override**: Create a `config.json` file next to the EXE with:
        ```json
        {
          "api_url": "http://YOUR_SERVER_IP:7777/api",
          "api_key": "YOUR_STATIC_API_KEY_HERE"
        }
        ```

### Legacy Deployment (Windows 32-bit / x86)
For older machines (Win 7 32-bit, etc.):
1.  Go to `Agent_Legacy_x86`.
2.  Install Python 3.x (32-bit).
3.  Run: `pip install -r requirements.txt`
4.  Run: `python agent.py` (Ensure `config.json` is configured).

---

## 3. REMOTE ACCESS (Cloudflare Tunnel)
If hosting on a local server but accessing remotely:
1.  Install `cloudflared` on the Server.
2.  Run: `cloudflared tunnel run --url http://localhost:7777 systracker`
3.  Point your Agent's `config.json` (or build) to your tunnel URL.

ENJOY!
