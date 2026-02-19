SysTracker v2.2.1 Release
===========================

This folder contains the standalone binaries for the SysTracker system.

Contents:
---------
1. SysTracker_Server.exe  - The Dashboard and API Server.
2. SysTracker_Agent.exe   - The Client Agent (Portable EXE).
3. SysTracker_Agent.msix  - The Client Agent (Windows Installer).

Instructions:
-------------

### Server Setup:
1. Run `SysTracker_Server.exe`.
2. Open your browser to `http://localhost:3001` (or the port displayed in the console).
3. Default Login: admin / admin (Change this immediately!).

### Agent Setup (MSIX):
1. Double-click `SysTracker_Agent.msix` to install.
2. The agent will run in the background.

### Agent Setup (Portable EXE):
1. Run `SysTracker_Agent.exe` as Administrator.
2. By default, it connects to `https://monitor.rico.bd/api`.
3. To change the server URL, create a `agent_config.json` in the same folder:
   {
       "API_URL": "http://YOUR_SERVER_IP:3001/api",
       "API_KEY": "YOUR_API_KEY"
   }

Troubleshooting:
----------------
- If the Server fails to start, ensure port 3001 is free.
- If the Agent fails to connect, check your firewall and `agent_config.json`.
