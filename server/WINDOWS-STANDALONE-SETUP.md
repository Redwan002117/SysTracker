# 🎉 SysTracker v3.1.2 - Windows Standalone Setup

**Everything included. No PowerShell required.**

---

## ✅ What You Have

### **Main Executable**
- `systracker-server-win.exe` (49 MB)
- Fully standalone - includes Node.js and all dependencies
- No installation needed - run directly

### **Launcher Scripts** (Choose One)

1. **RUN-SYSTRACKER.bat** - Simple launcher
   - Runs server in background
   - No PowerShell window stays open
   - Safe to close launcher after server starts
   - Best for: Quick testing and prototyping

2. **install-service.bat** - Windows Service installer
   - Installs as Windows Service (runs automatically on startup)
   - Auto-restart on crash
   - Run as Administrator required
   - Best for: Production deployment

3. **create-shortcut.bat** - Desktop shortcut creator
   - Creates desktop shortcut to launcher
   - Quick access from desktop
   - Run once to set up

---

## 🚀 Quick Start (Choose Your Method)

### **Method 1: Simple Launcher** ⭐ (Easiest)

1. **Navigate** to folder containing files
2. **Double-click** `RUN-SYSTRACKER.bat`
3. **Wait** ~3 seconds for startup
4. **Close** the batch window (server continues running!)
5. **Open** browser to: http://localhost:7777

✅ **Done!** Server is running in background.

---

### **Method 2: Windows Service** (Production)

#### Step 1: Install Service
1. **Right-click** `install-service.bat`
2. **Select** "Run as Administrator"
3. **Wait** for completion
4. **Close** the window

#### Step 2: Start Service
```
Option A: Run "start-service.bat"
Option B: Open Services app → Find "SysTracker" → Right-click → Start
Option C: Command line: net start SysTrackerServer
```

#### Step 3: Access Dashboard
- Open: http://localhost:7777
- Service runs automatically on system startup
- Restarts automatically if it crashes

#### Stop Service (When Needed)
```
Option A: Run "stop-service.bat"
Option B: Services app → Right-click → Stop
Option C: Command line: net stop SysTrackerServer
```

#### Uninstall Service (If Needed)
```
Right-click install-service.bat → Run as Administrator
Select "uninstall" option
```

---

### **Method 3: Desktop Shortcut** (Convenience)

1. **Run** `create-shortcut.bat` (once)
2. **Shortcut** appears on Desktop
3. **Double-click** shortcut to start server
4. Server runs in background

---

## 📋 File Descriptions

| File | Purpose | Run As | Admin |
|------|---------|--------|-------|
| `systracker-server-win.exe` | Main server executable | Direct | No |
| `RUN-SYSTRACKER.bat` | Background launcher | Batch | No |
| `install-service.bat` | Service installer | Batch | **Yes** |
| `create-shortcut.bat` | Shortcut creator | Batch | No |
| `.env` | Configuration (auto-created) | Text | - |
| `data/systracker.db` | Database (auto-created) | - | - |
| `logs/` | Log files (auto-created) | - | - |

---

## ⚙️ Configuration

### **Auto-Created Configuration**

On first run, these files are automatically created:

```
.env                    - Server configuration
data/systracker.db      - SQLite database
logs/systracker-*.log   - Server logs
data/jwt.secret         - JWT secret key
```

### **Manual Configuration**

Edit `.env` file to customize:

```env
PORT=7777                          # Server port (default: 7777)
NODE_ENV=production               # Environment
JWT_SECRET=your-secret-key        # JWT secret (auto-generated if blank)
DASHBOARD_DIR=dashboard-dist      # Dashboard files location
DATABASE_PATH=data/systracker.db  # Database location
LOG_DIR=logs                       # Logs directory
```

---

## 🔍 Verification

### **Check Server Status**

```powershell
# Check if process is running
tasklist | findstr systracker-server-win.exe

# Check if port is listening
netstat -ano | findstr :7777

# Visit dashboard
Start http://localhost:7777
```

---

## 🛠️ Troubleshooting

### **Port 7777 Already In Use**

```powershell
# Find what's using port 7777
netstat -ano | findstr :7777

# Kill the process (replace PID with actual ID)
taskkill /PID <PID> /F

# Or change PORT in .env file
# Edit: PORT=7778
# Then restart server
```

### **Server Won't Start**

**Check if executable exists:**
```powershell
Test-Path .\systracker-server-win.exe
```

**Check Windows Firewall:**
- Open Windows Defender Firewall
- Allow `systracker-server-win.exe` through firewall
- Allow ports 7777 (HTTP)

**Check Event Viewer for errors:**
- Event Viewer → Windows Logs → Application
- Filter for "systracker" events

### **Service Won't Install**

**Must run as Administrator:**
- Right-click `install-service.bat`
- Select "Run as Administrator"
- Confirm UAC prompt

### **Database Locked Error**

**Close any other SysTracker instances:**
```powershell
# Stop running instances
taskkill /IM systracker-server-win.exe /F

# Wait 5 seconds
timeout /t 5

# Restart single instance
.\RUN-SYSTRACKER.bat
```

---

## 📊 Default Settings

| Setting | Value |
|---------|-------|
| **Port** | 7777 |
| **Dashboard URL** | http://localhost:7777 |
| **Database** | SQLite (data/systracker.db) |
| **Memory Usage** | 150-300 MB (idle) |
| **CPU Usage** | < 5% (idle) |
| **Startup Time** | 2-3 seconds |
| **Auto-Start** | Yes (if installed as service) |

---

## 🎯 Common Tasks

### **Start Server**
```powershell
# Method 1: Simple launcher
.\RUN-SYSTRACKER.bat

# Method 2: Direct execution  
.\systracker-server-win.exe

# Method 3: Service
net start SysTrackerServer
```

### **Stop Server**
```powershell
# Kill process
taskkill /IM systracker-server-win.exe /F

# Or stop service
net stop SysTrackerServer
```

### **View Logs**
```powershell
# Show latest logs
Get-Content logs\systracker-*.log -Tail 50

# Monitor logs in real-time
Get-Content logs\systracker-*.log -Wait
```

### **Back Up Data**
```powershell
# Back up database
Copy-Item data\systracker.db data\systracker.db.backup
```

### **Change Port**
```powershell
# Edit .env
notepad .env

# Change: PORT=7777 to PORT=8080
# Save and restart
```

---

## 🔐 Security Notes

- ✅ All communication is local by default (only listens on 127.0.0.1)
- ✅ JWT tokens secure API access
- ✅ No admin password required for local use
- ⚠️ To enable remote access, configure firewall and network binding
- ⚠️ Use HTTPS in production with reverse proxy

---

## 📈 Performance Tips

### **Minimize Memory Usage**
- Dashboard is lightweight (60+ MB minified)
- Database auto-optimizes
- Logs rotate daily

### **Optimize CPU**
- Agent connection pooling
- Efficient WebSocket communication
- Database connection caching

### **Scale Up** (If Needed)
- Increase RAM available to Windows
- Use SSD for database
- Monitor with Task Manager

---

## 🚨 Emergency Procedures

### **Server Crashed**

If installed as service:
```powershell
# Automatic: Service restarts after 60 seconds
# Manual: net start SysTrackerServer
```

If running from batch:
```powershell
# Stop: taskkill /IM systracker-server-win.exe /F
# Start: .\RUN-SYSTRACKER.bat
```

### **Reset Database**

```powershell
# Stop server first
taskkill /IM systracker-server-win.exe /F

# Backup existing
Copy-Item data\systracker.db data\systracker.db.old

# Delete database (will recreate on next start)
Remove-Item data\systracker.db

# Restart server
.\RUN-SYSTRACKER.bat
```

### **Restore from Backup**

```powershell
# Stop server
taskkill /IM systracker-server-win.exe /F

# Restore from backup
Move-Item data\systracker.db.backup data\systracker.db -Force

# Restart server
.\RUN-SYSTRACKER.bat
```

---

## 📞 Getting Help

### **Error Messages**
- Check `logs/systracker-*.log` for detailed errors
- Review troubleshooting section above
- Check Windows Event Viewer

### **Common Issues**
- **Can't connect to dashboard** → Wrong port or firewall blocked
- **Server keeps crashing** → Check logs for errors
- **Service won't start** → Run as Administrator
- **Database locked** → Close all instances

### **Support Resources**
- GitHub Issues: https://github.com/Redwan002117/SysTracker
- Documentation: See wiki files
- Logs: Check `logs/` directory

---

## 🎓 Best Practices

✅ **DO:**
- Back up database regularly
- Monitor memory usage
- Review logs periodically
- Use Windows Service for production
- Enable Windows Firewall protection

❌ **DON'T:**
- Run multiple EXE instances (use service instead)
- Edit database files directly
- Delete log files while running
- Modify .exe or core files
- Use weak passwords in setup

---

## 📝 Next Steps

### **First-Time Setup**

1. ✅ Run `RUN-SYSTRACKER.bat`
2. ✅ Open http://localhost:7777
3. ✅ Complete setup wizard
4. ✅ Create admin account
5. ✅ Configure server settings

### **Deploy Agents**

See wiki: [Agent Deployment Guide](Agent-Deployment-Testing)

### **Production Deployment**

1. Install as Windows Service
2. Configure firewall
3. Set up HTTPS (with reverse proxy)
4. Enable backups
5. Monitor performance

---

## 🎉 You're Ready!

**Your standalone SysTracker is ready to use.**

Choose your launch method and go!

| Quick | Service | Shortcut |
|-------|---------|----------|
| `RUN-SYSTRACKER.bat` | `install-service.bat` | `create-shortcut.bat` |
| Perfect for testing | Perfect for production | Perfect for convenience |

---

**SysTracker v3.1.2**  
**Windows Standalone Setup**  
**Ready to Monitor Your Systems!** 🚀

---

**Questions?** See the troubleshooting section or check the wiki documentation.
