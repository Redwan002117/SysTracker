# Windows Quick Start

## 60-Second Installation

### Step 1: Download
- Download `systracker-server-win.exe` (49 MB)
- No installation needed - it's portable!

### Step 2: Run
```powershell
.\systracker-server-win.exe
```

### Step 3: Access
Open browser: **http://localhost:7777**

### Step 4: Setup
- Click "Setup Wizard"
- Create admin account
- Generate API key
- Done! ✅

---

## What You'll See

### Dashboard
- System overview
- Connected machines
- Real-time metrics
- Alert status

### Setup Steps
1. **Admin Account** - Email and password
2. **Configuration** - Server settings
3. **First Agent** - Install on first system
4. **Verification** - Test connectivity

---

## Next Steps

1. **Create Admin Account**
   - Email: your@company.com
   - Password: Strong password
   - Click "Create Account"

2. **Configure Server**
   - Server Name: My SysTracker Server
   - Port: 7777 (default)
   - Optional: Email settings for alerts

3. **Add First System**
   - Copy agent download link
   - Run on target Windows PC
   - Wait 30-60 seconds
   - Agent appears in dashboard

---

## Install as Service (Optional)

Make server start automatically:

```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
.\install_windows_service.ps1
```

Now server starts automatically on Windows reboot.

---

## Verify Installation

```powershell
# Run validation
.\validate_windows_install.ps1

# Should show all green checkmarks (✓)
```

---

## Troubleshooting

### **Port already in use?**
```powershell
# Find what's using port 7777
netstat -ano | findstr :7777

# Change port in .env file
PORT=7778
```

### **Dashboard won't load?**
```powershell
# Restart manually
# Stop EXE (Ctrl+C in PowerShell)
# Run again: .\systracker-server-win.exe
```

### **Service issues?**
```powershell
# Check service status
Get-Service systracker

# View logs
Get-Content "data\logs\app.log" -Tail 20
```

---

## Next: Deploy Agents

- Download agent installer
- Run on each managed system
- Systems appear in dashboard
- Start monitoring!

→ [Agent Deployment Guide](Agent-Deployment)

---

## Tips

💡 **Keep running:** Leave dashboard open to monitor  
💡 **Configure alerts:** Set up email notifications  
💡 **Multiple servers:** Each server on different port  
💡 **Backup data:** Copy `data/` folder regularly  

---

**Need more help?** → [Full Windows Guide](Windows-Deployment)
