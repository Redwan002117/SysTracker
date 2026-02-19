# SysTracker - Enterprise System Monitoring Solution

**SysTracker** is a powerful, self-hosted system monitoring tool designed to track performance metrics (CPU, RAM, Disk, Network) across a fleet of Windows computers. It consists of a central **Admin Dashboard** and lightweight **Agents** deployed on client machines.

![SysTracker Dashboard](https://raw.githubusercontent.com/Redwan002117/SysTracker/main/dashboard/public/banner.svg) 

---

## 🚀 Key Features

*   **Real-Time Monitoring**: Live 3-second updates via optimized Socket.IO.
*   **All-in-One Standalone**: The server is a single EXE containing the Dashboard and Agent.
*   **Centralized Dashboard**: View all your machines in one sleek, updated interface.
*   **Detailed Metrics**: Track CPU Usage, RAM, Disk Space, Network details, and Uptime.
*   **Remote Management**: Send commands (Restart, Shutdown) to agents.
*   **Zero-Dependency Agents**: Download pre-configured agents directly from your dashboard.

---

## 📂 Repository Structure

*   **/server**: Node.js Standalone Backend. Serves both the API and the embedded Dashboard.
*   **/dashboard**: Next.js (React) Frontend. Bundled into the server binary.
*   **/agent**: Python-based Client Agent. Optimized for minimal payload size.
*   **/Release**: Contains the latest compiled v2.6.2 binaries.

---

## 💻 Agent Installation (Windows)

The Agent runs as a **Windows Service** (starts automatically, runs in background).

### 3. Install the Agent (Single Standalone App)
You can install the agent on any Windows machine using the standalone executable.
The Agent is a **Single Standalone Application**. It installs itself as a Windows Service.

1.  **Download** `SysTracker_Agent.exe` from the Release.
2.  Open **PowerShell** or **Command Prompt** as Administrator.
3.  Run the install command:
    ```powershell
    .\SysTracker_Agent.exe --install
    ```
    *You can also pass `--url` and `--key` arguments to skip prompts.*

4.  The agent will:
    *   **Prompt you for Server URL and API Key** (if not provided).
    *   **Test the connection** to the server.
    *   Copy itself to `C:\Program Files\SysTrackerAgent`.
    *   Create a `config.json` with your settings.
    *   Register a background Scheduled Task (`SysTrackerAgent`).
    *   Start automatically.

### Management
- **Stop/Uninstall**: `.\SysTracker_Agent.exe --uninstall`
- **Kill Switch**: `.\SysTracker_Agent.exe --kill`
- **Logs**: Check `agent.log` in `C:\Program Files\SysTrackerAgent`.

## 📦 Installation & Deployment

### Quick Start (The "Easy Way")
Go to the [**Releases Page**](https://github.com/Redwan002117/SysTracker/releases/latest) and download the latest version (**v2.6.2**).

**1. Run the Admin Server**
*   **Windows**: Download `SysTracker_Server.exe`. Run it.
*   **Linux**: Download `SysTracker_Server`. Run `chmod +x` and then execute it.
*   **Access**: Open `http://localhost:7777` in your browser.

**2. Setup & Deployment**
*   Create your admin account through the setup wizard.
*   Go to **Settings > Deployment & Downloads**.
*   Download the **Agent EXE** and run it on machines you want to monitor. It's already configured to talk to your server!

---

### Metric 2: Docker / CasaOS (Recommended)
We automatically publish multi-arch Docker images (AMD64 & ARM64) to GitHub Container Registry (GHCR).

**CasaOS Setup:**
1.  **Install Custom App**.
2.  **Image**: `ghcr.io/redwan002117/systracker:latest`
3.  **Ports**: Map Host `7777` to Container `7777`.
4.  **Volumes**: Map `/DATA/AppData/systracker/data` to `/app/data`.
5.  **Environment Variables (Optional for Auto-Setup)**:
    *   `ADMIN_USER`: `admin`
    *   `ADMIN_PASSWORD`: `secure_password`

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
    environment:
      - ADMIN_USER=admin          # Optional: Creates admin user automatically
      - ADMIN_PASSWORD=ChangeMe!  # Optional: Skips Setup Wizard
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
pip install pyinstaller

# Build standalone executable (Silent Mode)
pyinstaller SysTracker_Agent.spec
# Output will be in dist/SysTracker_Agent.exe
```

---

## 🔒 Security & Remote Access
To access your Admin Server from outside your network securely, we recommend **Cloudflare Tunnel**.

1.  Install `cloudflared` on your Server.
2.  Start the tunnel: `cloudflared tunnel run --url http://localhost:7777 systracker`
3.  Point your Agents to your public domain (e.g., `https://monitor.yourdomain.com/api`).

3.  Point your Agents to your public domain (e.g., `https://monitor.yourdomain.com/api`).

---

## 📧 Email Configuration (SMTP)

SysTracker supports sending emails for password resets and notifications. You can configure this directly in the **Dashboard > Settings** page.

### Recommended Providers (Smart Host)
You can use any standard SMTP provider. Here are the settings for **Brevo (formerly Sendinblue)**, which has a generous free tier:

*   **Host**: `smtp-relay.brevo.com`
*   **Port**: `587`
*   **User**: `your-email@example.com` (The email you use to login to Brevo)
*   **Password**: `YOUR_XSmtpw_API_KEY` (Get this from Brevo Dashboard > SMTP & API > SMTP Keys)
*   **Secure**: `false` (uses STARTTLS)
*   **From Email**: `admin@your-domain.com` (Must be a sender authenticated in Brevo)

*Note: Gmail can also be used, but requires an "App Password" and `secure: true` on port `465`.*

---

## License
MIT License. Free to use and modify.
