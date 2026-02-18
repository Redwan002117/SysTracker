# SysTracker

**A Modern, Real-time System Monitoring Solution**

SysTracker is a lightweight, agent-based system monitoring tool designed to track performance metrics (CPU, RAM, Disk, Network) and hardware details across multiple machines in a network. It consists of a **Python Agent** running on client machines and a **Node.js Server** + **Next.js Dashboard** for centralization and visualization.

## Features

- **Real-time Telemetry:** Live updates for CPU, RAM, Disk, and Network usage.
- **Hardware Inspection:** Detailed views for Motherboard, CPU, GPU, Memory, and Network Interfaces.
- **Process Monitoring:** Track resource-heavy processes on connected machines.
- **Event Logging:** Capture important system events and machine status changes.
- **Modern Dashboard:** A beautiful, responsive UI built with Next.js, Tailwind CSS, and Framer Motion.
- **Lightweight Agent:** Minimal footprint Python agent using standard libraries and WMI.

## Repository Structure

- **/agent**: Python script for collecting and sending telemetry.
- **/server**: Node.js/Express backend with SQLite database and Socket.IO.
- **/dashboard**: Next.js (React) frontend for visualizing data.

## Quick Start

### 1. Start the Server
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
node server.js
```
The server runs on port **3001** (by default).

### 2. Run the Dashboard
For development:
```bash
cd dashboard
npm install
npm run dev
```
The dashboard runs on **localhost:3000**.

For production (lower RAM usage):
```bash
cd dashboard
npm run build
# The server.js is configured to serve the 'out' directory statically
```

### 3. Deploy Agents
On each target machine (must have Python installed):
```bash
cd agent
pip install requests psutil WMI pywin32
python agent.py
```
*Note: `WMI` and `pywin32` are required for Windows hardware details.*

## Configuration

- **Agent:** Edit `agent.py` to set `SERVER_URL` (default: `http://localhost:3001`).
- **Server:** Edit `server.js` or `.env` to configure ports and database paths.

## Tech Stack

- **Agent:** Python 3, WMI, psutil
- **Backend:** Node.js, Express, Socket.IO, SQLite
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Lucide React

## License

MIT License.
