# Windows Server Setup Checklist

**Complete step-by-step verification of your Windows deployment**

---

## 📋 Pre-Installation Checklist

- [ ] **OS Requirements:**
  - [ ] Windows 10, Windows 11, or Windows Server 2019+
  - [ ] Administrator account available
  - [ ] Minimum 2GB RAM free
  - [ ] Minimum 500MB disk space free

- [ ] **Prerequisites Installed:**
  - [ ] NSSM downloaded (https://nssm.cc/download)
  - [ ] NSSM extracted to `C:\nssm` or PATH
  - [ ] Verified: `nssm --version` in Command Prompt
  - [ ] PowerShell 5.0+ available (`$PSVersionTable.PSVersion`)

- [ ] **Network:**
  - [ ] Port 7777 is available (not in use)
  - [ ] Verified: `netstat -ano | findstr :7777` (should be empty)
  - [ ] Firewall allows outbound (for agent connections)

- [ ] **Files Ready:**
  - [ ] `SysTracker_Server.exe` downloaded/built
  - [ ] `install_windows_service.ps1` available
  - [ ] `manage_service.ps1` available (optional)

---

## 🚀 Installation Checklist

- [ ] **Windows Service Installation:**
  - [ ] Opened PowerShell **as Administrator**
  - [ ] Ran: `powershell -ExecutionPolicy Bypass -File install_windows_service.ps1`
  - [ ] Installation completed without errors
  - [ ] Service "SysTracker" appears in Services: `Get-Service SysTracker`

- [ ] **Service Status:**
  - [ ] Service Status shows "Running": `Get-Service SysTracker`
  - [ ] Service Start Type shows "Automatic"
  - [ ] No errors in: `C:\Program Files\SysTracker Server\logs\service-error.log`

- [ ] **Port Verification:**
  - [ ] Port 7777 is listening: `netstat -ano | findstr :7777`
  - [ ] Process ID matches SysTracker service

- [ ] **Directory Structure Created:**
  - [ ] `C:\Program Files\SysTracker Server\` exists
  - [ ] `data/` subdirectory exists
  - [ ] `logs/` subdirectory exists
  - [ ] `uploads/` subdirectory exists
  - [ ] `SysTracker_Server.exe` file present
  - [ ] `.env` configuration file present

---

## ⚙️ Configuration Checklist

- [ ] **Edit Configuration File:**
  - [ ] Opened: `C:\Program Files\SysTracker Server\.env`
  - [ ] Located `API_KEY` setting
  - [ ] Changed `API_KEY` from default value (8+ characters minimum)
  - [ ] Saved `.env` file
  - [ ] Restarted service: `Restart-Service SysTracker`

- [ ] **Optional - Email Alerts (SMTP):**
  - [ ] Located SMTP settings in `.env`
  - [ ] Configured `SMTP_HOST` (e.g., smtp.gmail.com)
  - [ ] Configured `SMTP_PORT` (e.g., 587)
  - [ ] Configured `SMTP_USER` (your email)
  - [ ] Configured `SMTP_PASS` (app password, not regular password)
  - [ ] Configured `SMTP_FROM` (sender address)
  - [ ] Saved and restarted service

- [ ] **Database Ready:**
  - [ ] File exists: `C:\Program Files\SysTracker Server\data\systracker.db`
  - [ ] File size > 0 bytes
  - [ ] File created with current timestamp: `Get-Item "C:\Program Files\SysTracker Server\data\systracker.db"`

---

## 🌐 Dashboard Verification

- [ ] **Access Dashboard:**
  - [ ] Opened browser: `http://localhost:7777`
  - [ ] Dashboard loads (no connection refused)
  - [ ] SysTracker logo/interface appears

- [ ] **Setup Wizard:**
  - [ ] Saw "Setup Required" message or login page
  - [ ] Clicked "Setup" link (if showing)
  - [ ] Filled Admin Account form:
    - [ ] Username: Entered strong username
    - [ ] Email: Entered valid email address
    - [ ] Password: Entered 8+ character password
  - [ ] Clicked "Create Admin Account"
  - [ ] Got "Setup complete" message
  - [ ] Redirected to login page

- [ ] **First Login:**
  - [ ] Clicked "Login" (or returned to http://localhost:7777)
  - [ ] Entered admin username
  - [ ] Entered admin password
  - [ ] Successfully logged in
  - [ ] Dashboard main page loads
  - [ ] Navigation menu visible on left

---

## 🔑 Settings Configuration

- [ ] **General Settings:**
  - [ ] Navigated to: Settings > General
  - [ ] Saw API Key displayed
  - [ ] Verified it matches `.env` `API_KEY` value
  - [ ] Optionally updated API Key (agents will use new value)

- [ ] **SMTP Settings (if configured):**
  - [ ] Navigated to: Settings > SMTP
  - [ ] SMTP Host populated correctly
  - [ ] SMTP Port populated correctly
  - [ ] SMTP User populated correctly
  - [ ] Saw "password ****" (masked)
  - [ ] Clicked "Test Email"
  - [ ] Received test email in inbox

- [ ] **Agent Management:**
  - [ ] Navigated to: Settings > Agent Management
  - [ ] Saw "No agents installed yet" (or current version if upgraded)
  - [ ] Found "Download Agent" button
  - [ ] Ready to download agent for Windows machines

---

## 👥 User Management (Optional)

- [ ] **Create Additional Users:**
  - [ ] Navigated to: Settings > Users or Dashboard > Users
  - [ ] Clicked "Add User"
  - [ ] Entered username, email, password
  - [ ] Selected role (Admin or Viewer)
  - [ ] Clicked "Create"
  - [ ] User appears in user list

- [ ] **Verify Roles:**
  - [ ] Logged in as Viewer account
  - [ ] Can see machines and metrics (read-only)
  - [ ] Cannot access Settings
  - [ ] Cannot execute commands
  - [ ] Logged back in as Admin
  - [ ] Full access verified

---

## 📊 Agent Setup

- [ ] **Download Agent:**
  - [ ] Navigated to: Settings > Agent Management
  - [ ] Clicked "Download SysTracker_Agent.exe"
  - [ ] File saved to Downloads

- [ ] **Install Agent on Test Machine:**
  - [ ] Opened command prompt on another Windows PC (or same if testing)
  - [ ] Ran: `.\SysTracker_Agent.exe --install`
  - [ ] Provided server URL: `http://<server-ip>:7777`
  - [ ] Provided API Key: (from Settings > General)
  - [ ] Agent installation completed
  - [ ] Service registered in Services

- [ ] **Verify Agent Connection:**
  - [ ] Returned to dashboard in browser
  - [ ] Refreshed page: `F5`
  - [ ] New machine appeared in the machines list
  - [ ] Machine showed "Online" status
  - [ ] Metrics updating (CPU, RAM, Disk visible)
  - [ ] Metrics refreshing every 3-5 seconds

---

## 🔄 Functionality Testing

- [ ] **Metrics Display:**
  - [ ] CPU usage displayed and changing
  - [ ] RAM usage displayed and changing
  - [ ] Disk usage displayed and changing
  - [ ] Uptime increasing over time
  - [ ] Network stats visible (if available)

- [ ] **Machine Details:**
  - [ ] Clicked on machine name (or "Details" button)
  - [ ] Saw hardware information:
    - [ ] Processor type/cores
    - [ ] Total RAM
    - [ ] Storage devices
    - [ ] Network adapters
  - [ ] Saw performance graph
  - [ ] Saw list of running processes

- [ ] **Remote Commands (Optional):**
  - [ ] Clicked "Terminal" tab
  - [ ] Entered test command: `echo test`
  - [ ] Command executed and returned output
  - [ ] Command history visible

- [ ] **Alerts (Optional):**
  - [ ] Navigated to: Dashboard > Alerts
  - [ ] Created test alert:
    - [ ] Metric: CPU Usage
    - [ ] Operator: >
    - [ ] Threshold: 90%
    - [ ] Enabled: Yes
  - [ ] Alert created successfully
  - [ ] Alert appears in alert list

---

## 📝 Logs and Monitoring

- [ ] **Service Logs:**
  - [ ] Location verified: `C:\Program Files\SysTracker Server\logs\`
  - [ ] Files exist:
    - [ ] `service.log` (application output)
    - [ ] `service-error.log` (errors)
  - [ ] Recent entries visible: `Get-Content "C:\Program Files\SysTracker Server\logs\service.log" -Tail 20`
  - [ ] No error messages in error log

- [ ] **Performance Monitoring:**
  - [ ] Service running: `Get-Service SysTracker`
  - [ ] Memory usage reasonable: `(Get-Process).Length` < 500MB
  - [ ] Port listening: `netstat -ano | findstr :7777`
  - [ ] No excessive CPU usage

---

## 🔐 Security Verification

- [ ] **Authentication Working:**
  - [ ] Logged out of dashboard
  - [ ] Attempted to access `/dashboard` without login
  - [ ] Redirected to login page
  - [ ] Could not access protected pages without token

- [ ] **API Key Verification:**
  - [ ] Agents using correct API key
  - [ ] Changed API key in `.env`
  - [ ] Old agents failed to connect (after 5+ minutes)
  - [ ] Downloaded new agent with new key
  - [ ] New agent connected successfully

- [ ] **Password Security:**
  - [ ] Admin password is 8+ characters (mixed case, numbers)
  - [ ] Not a common password
  - [ ] Can change password: Settings > Change Password
  - [ ] Password change works

---

## 🆘 Troubleshooting Verification

- [ ] **If Service Won't Start:**
  - [ ] Checked error log: `C:\Program Files\SysTracker Server\logs\service-error.log`
  - [ ] Verified port not in use: `netstat -ano | findstr :7777`
  - [ ] Verified `.env` file exists and is readable
  - [ ] Tried manual start: `& "C:\Program Files\SysTracker Server\SysTracker_Server.exe"`
  - [ ] Documented error message

- [ ] **If Dashboard Won't Load:**
  - [ ] Verified service is running: `Get-Service SysTracker`
  - [ ] Verified port is listening: `netstat -ano | findstr :7777`
  - [ ] Tried different browser (Chrome, Edge, Firefox)
  - [ ] Cleared browser cache: `Ctrl+Shift+Delete`
  - [ ] Tried accessing as: `http://127.0.0.1:7777`

- [ ] **If Agent Won't Connect:**
  - [ ] Verified server URL is correct in agent config
  - [ ] Verified API key matches in Settings > General
  - [ ] Verified network connectivity: `ping <server-ip>`
  - [ ] Verified firewall allows port 7777 from agent machine
  - [ ] Checked agent logs: `C:\Program Files\SysTracker Agent\agent.log`

---

## 📦 Backup Setup

- [ ] **Initial Backup Created:**
  - [ ] Created backup directory: `C:\Backups\` (or external drive)
  - [ ] Backed up database:
    ```powershell
    Copy-Item "C:\Program Files\SysTracker Server\data\systracker.db" `
              "C:\Backups\systracker_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').db"
    ```
  - [ ] Verified backup file exists
  - [ ] Noted timestamp of backup

- [ ] **Backup Strategy Planned:**
  - [ ] Frequency determined (daily/weekly)
  - [ ] Storage location chosen (external drive/cloud)
  - [ ] Restoration procedure documented

---

## 🎉 Final Sign-Off

- [ ] **All Checks Passed:**
  - [ ] Service running and auto-starting
  - [ ] Dashboard accessible and working
  - [ ] Agents connecting and sending metrics
  - [ ] Security configured
  - [ ] Backups in place
  - [ ] No critical errors in logs

**Status:** ✅ **Ready for Production**

**Date Completed:** _______________

**Signed By:** _______________

---

## 📞 Support Resources

If you encounter issues, check:
1. **Logs:** `C:\Program Files\SysTracker Server\logs\service-error.log`
2. **Quick Start:** [WINDOWS_SERVER_QUICK_START.md](WINDOWS_SERVER_QUICK_START.md)
3. **Full Guide:** [WINDOWS_SERVER_DEPLOYMENT.md](WINDOWS_SERVER_DEPLOYMENT.md)
4. **Comparison:** [DEPLOYMENT_COMPARISON.md](DEPLOYMENT_COMPARISON.md)
5. **GitHub Issues:** https://github.com/Redwan002117/SysTracker/issues

---

**Last Updated:** February 21, 2026  
**Version:** 3.1.1+
