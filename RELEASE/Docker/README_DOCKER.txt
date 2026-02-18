# SysTracker Docker / CasaOS Guide

## ⚠️ TROUBLESHOOTING: "Bad Gateway 502"
If you are using **Cloudflare Tunnel** and get a 502 Error, it is because you pointed Cloudflare to `127.0.0.1`.
**Fix**: In Cloudflare Dashboard, set Service URL to your **LAN IP** (e.g., `192.168.10.8`) or the Docker Gateway (`172.17.0.1`).

---

## METHOD 1: CasaOS "Custom App" (Standard)
1. In CasaOS, click "+" -> "Install a Custom App".

**Fill in these fields:**
*   **Docker Image**: `ghcr.io/redwan002117/systracker:latest`
*   **Title**: SysTracker
*   **Web UI**: `http://172.17.0.1:7777`  (or `http://0.0.0.0:7777`)
*   **Icon URL**: `https://raw.githubusercontent.com/Redwan002117/SysTracker/main/dashboard/public/logo.png`
*   **Network**: `bridge`

**Port Settings:**
*   Host: `7777`
*   Container: `7777`

**Volumes (CRITICAL):**
*   Host: `/DATA/AppData/systracker/data`
*   Container: `/app/data`

2. Click "Install".

---

## METHOD 2: Docker Compose (Import)
1. In CasaOS, Click "+" -> "Install a Custom App" -> top right "Import" icon.
2. Select "Docker Compose".
3. Paste the contents of `docker-compose.yml` (included in this folder).
4. Click Submit.

---

## METHOD 3: Manual Run
`docker run -d -p 7777:7777 -v ./data:/app/data --name systracker ghcr.io/redwan002117/systracker:latest`
