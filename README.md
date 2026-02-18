# SysTracker - Enterprise System Monitoring Solution

**SysTracker** is a powerful, self-hosted system monitoring tool designed to track performance metrics (CPU, RAM, Disk, Network) across a fleet of Windows computers. It consists of a central **Admin Dashboard** and lightweight **Agents** deployed on client machines.

![SysTracker Dashboard](https://raw.githubusercontent.com/Redwan002117/SysTracker/main/dashboard/public/banner.svg) 

---

## 🚀 Key Features

*   **Real-Time Monitoring**: Live updates via Socket.IO.
*   **Centralized Dashboard**: View all your machines in one sleek interface.
*   **Detailed Metrics**: Track CPU Usage, RAM, Disk Space, Network details, and Uptime.
*   **Remote Management**: Send commands (Restart, Shutdown) to agents (Admin privileges required).
*   **Cross-Platform Server**: Host the Admin Server on **Windows**, **Linux (Ubuntu/Debian)**, or **Docker (CasaOS)**.
*   **Zero-Config Agents**: Pre-compiled agents can be hardcoded to your server URL.

---

## 📂 Repository Structure

*   **/server**: Node.js Backend (Express + Socket.IO + SQLite). Handles telemetry and API.
*   **/dashboard**: Next.js (React) Frontend. Static export is served by the backend.
*   **/agent**: Python-based Client Agent. Collects system data and pushes to server.
*   **/RELEASE**: (In local builds) Contains the compiled binaries and artifacts.
*   **/.github/workflows**: CI/CD pipelines for automated Docker builds.

---

## 💻 Agent Installation (Windows)

The Agent runs as a **Windows Service** (starts automatically, runs in background).

1.  **Download** the `SysTracker_Agent_Windows.zip` from the [Latest Release](https://github.com/Redwan002117/SysTracker/releases/latest).
2.  **Extract** the zip file to a folder (e.g., Downloads).
3.  Right-click `install.ps1` and select **Run with PowerShell**.
    *   *Note: If prompted about Execution Policy, type `Y` to allow.*
4.  Enter your **Server URL** when prompted (e.g., `http://192.168.1.10:7777/api`).
5.  The script will:
    *   Install the agent to `C:\Program Files\SysTracker Agent`.
    *   Register and Start the Background Service.

### Manual Service Control
- **Start**: `Start-Service SysTrackerAgent`
- **Stop**: `Stop-Service SysTrackerAgent`
- **Logs**: Check Event Viewer -> Windows Logs -> Application.

## 📦 Installation & Deployment

### Metric 1: The "Easy Way" (Pre-built Binaries)
Go to the [**Releases Page**](https://github.com/Redwan002117/SysTracker/releases/latest) and download the latest version.

**1. Admin Server (Host)**
*   **Windows**: Download `SysTracker_Admin.exe` and run it. Open `http://localhost:7777`.
*   **Linux**: Download `SysTracker_Admin_Linux`. Run `chmod +x` and then execute it.

**2. Agents (Clients)**
*   **Windows (64-bit)**: Download `SysTracker_Agent.exe`.
*   **Configuration**:
    *   If using the "Generic" agent, create a `config.json` file next to it:
        ```json
        {
          "api_url": "http://YOUR_SERVER_IP:7777/api",
          "api_key": "YOUR_STATIC_API_KEY_HERE"
        }
        ```
    *   *Pro Tip*: You can build your own agent with the IP hardcoded (see Development below).

---

### Metric 2: Docker / CasaOS (Recommended for Servers)
We automatically publish Docker images to GitHub Container Registry (GHCR).

**CasaOS Setup:**
1.  **Install Custom App**.
2.  **Image**: `ghcr.io/redwan002117/systracker:latest`
3.  **Ports**: Map Host `7777` to Container `7777`.
4.  **Volumes**: Map `/DATA/AppData/systracker/data` to `/app/data` (to save your database).

**Docker Compose:**
```yaml
version: '3'
services:
  systracker:
    image: ghcr.io/redwan002117/systracker:latest
    container_name: systracker-admin
    restart: unless-stopped
    ports:
      - "7777:7777"
    volumes:
      - ./data:/app/data
```

---

## 🛠️ Development (Build from Source)

### Prerequisites
*   Node.js (v18+)
*   Python 3.10+ (for Agent)
*   `pip install pyinstaller` (for building Agent EXE)
*   `npm install -g pkg` (for bundling Server EXE)

### 1. Build the Dashboard
```bash
cd dashboard
npm install
npm run build
# This creates a static export in dashboard/out
```

### 2. Build the Server
```bash
cd server
# Copy dashboard assets to server
mkdir dashboard-dist
cp -r ../dashboard/out/* dashboard-dist/

# Install dependencies
npm install

# Run locally
node server.js

# OR Build Executable
pkg . --out-path dist
```

### 3. Build the Agent
```bash
cd agent
pip install -r requirements.txt
# Edit default API_URL in agent.py if desired
python -m PyInstaller --onefile --noconsole --name "SysTracker_Agent" --uac-admin agent.py
```

---

## 🔒 Security & Remote Access
To access your Admin Server from outside your network securely, we recommend **Cloudflare Tunnel**.

1.  Install `cloudflared` on your Server.
2.  Start the tunnel: `cloudflared tunnel run --url http://localhost:7777 systracker`
3.  Point your Agents to your public domain (e.g., `https://monitor.yourdomain.com/api`).

---

## License
MIT License. Free to use and modify.
