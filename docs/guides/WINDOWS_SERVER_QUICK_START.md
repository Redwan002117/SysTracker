# Windows Server Deployment - Quick Start

**One-page reference for deploying SysTracker on Windows**

---

## 🚀 Quick Setup (5 minutes)

### Prerequisites
- Windows 10/11 or Server 2019+
- NSSM installed (https://nssm.cc/download)
- Administrator access

### Installation Steps

```powershell
# 1. Download SysTracker_Server.exe
# From: https://github.com/Redwan002117/SysTracker/releases

# 2. Right-click PowerShell → "Run as Administrator"

# 3. Navigate to .exe directory and run:
powershell -ExecutionPolicy Bypass -File install_windows_service.ps1

# 4. Open browser:
http://localhost:7777
```

---

## 🎛️ Service Management

```powershell
# Status
Get-Service SysTracker

# Start
Start-Service SysTracker

# Stop
Stop-Service SysTracker

# Restart
Restart-Service SysTracker

# View logs (real-time)
Get-Content "C:\Program Files\SysTracker Server\logs\service.log" -Tail 50 -Wait

# Or use management script:
.\manage_service.ps1 -Action status
.\manage_service.ps1 -Action logs -Lines 100
.\manage_service.ps1 -Action restart
```

---

## 📁 File Locations

```
C:\Program Files\SysTracker Server\
├── SysTracker_Server.exe              ← Application
├── .env                               ← Configuration (EDIT THIS!)
├── logs/
│   ├── service.log                   ← Main output
│   └── service-error.log             ← Errors
├── data/
│   ├── systracker.db                 ← SQLite database
│   ├── jwt.secret                    ← Encryption key
│   └── agent_releases/               ← Uploaded agents
└── uploads/                          ← Profile pictures, etc
```

---

## ⚙️ Configuration

**Location:** `C:\Program Files\SysTracker Server\.env`

```env
PORT=7777                                    # Server port
API_KEY=your_secret_key_here                # Agent authentication key
SMTP_HOST=smtp.gmail.com                    # Email alerts (optional)
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_SECURE=false
SMTP_FROM="SysTracker" <noreply@domain.com>
```

**After editing .env:**
```powershell
Restart-Service SysTracker
```

---

## 🌐 Access Dashboard

- **Local:** http://localhost:7777
- **Network:** http://<your-windows-pc-ip>:7777
- **First time:** Click "Setup" to create admin account

---

## 🔧 Troubleshooting

### Service won't start
```powershell
# Check error log
Get-Content "C:\Program Files\SysTracker Server\logs\service-error.log" -Tail 50

# Test manually
& "C:\Program Files\SysTracker Server\SysTracker_Server.exe"

# Check port in use
netstat -ano | findstr :7777
```

### Can't access dashboard from another machine
```powershell
# Allow firewall
New-NetFirewallRule -DisplayName "SysTracker" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 7777

# Test connection
Test-NetConnection <your-pc-ip> -Port 7777
```

### Agents not connecting
- ✅ Check .env `API_KEY` matches agent config
- ✅ Check port 7777 is accessible
- ✅ Check `.env` exists and is readable
- ✅ Restart service after `.env` changes

---

## 📊 Initial Setup

1. **Dashboard:** http://localhost:7777
2. **Setup:** Click "Setup" → Create admin account
3. **Configure:** Settings → Update API Key and SMTP (if needed)
4. **Agent:** Settings → Agent Management → Download
5. **Install Agent:** Run on Windows machines you want to monitor

---

## 🔄 Update Server

```powershell
# 1. Stop service
Stop-Service SysTracker

# 2. Backup current
Copy-Item "C:\Program Files\SysTracker Server\SysTracker_Server.exe" `
          "C:\Program Files\SysTracker Server\SysTracker_Server.backup.exe"

# 3. Replace with new EXE

# 4. Restart
Start-Service SysTracker
```

---

## 🗑️ Uninstall

```powershell
# Remove service
nssm remove SysTracker confirm

# Delete all files
Remove-Item "C:\Program Files\SysTracker Server" -Recurse -Force

# Or use management script:
.\manage_service.ps1 -Action uninstall
```

---

## 📈 Build Your Own EXE

```bash
# From workspace root
cd server

# Build Windows EXE
npm install
npm run build:win

# Output: systracker-server-win.exe
```

---

## 🔗 Both Windows & Ubuntu Servers

Run simultaneously on different machines:

**Windows:** `http://192.168.1.100:7777` (your PC)  
**Ubuntu:** `http://192.168.1.50:7777` (server machine)

Agents point to their respective server URLs independently.

---

## 📞 Links

- **GitHub:** https://github.com/Redwan002117/SysTracker
- **Releases:** https://github.com/Redwan002117/SysTracker/releases
- **Issues:** https://github.com/Redwan002117/SysTracker/issues
- **NSSM:** https://nssm.cc/usage

---

## 🔐 Security Checklist

- [ ] Changed `API_KEY` from default value
- [ ] Configured SMTP (if using email alerts)
- [ ] Created strong admin password (8+ chars)
- [ ] Allowed firewall for port 7777 if needed
- [ ] Backed up database regularly

---

**Status:** Ready for Production ✅  
**Last Updated:** February 21, 2026
