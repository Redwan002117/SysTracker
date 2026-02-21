# System Requirements for SysTracker v3.1.2

**Effective Date:** February 21, 2026

---

## Minimum Requirements

### Operating System

| Component | Requirement |
|-----------|-------------|
| **OS** | Windows 10 v1909 or later |
| **Alternative** | Windows 11 (all versions supported) |
| **Architecture** | 64-bit (x64) only |
| **Build Number** | Windows 10: Build 18363 minimum |

### Hardware

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **Processor** | 1 GHz dual-core | 2.5 GHz quad-core or better |
| **RAM** | 512 MB | 2 GB or more |
| **Disk Space** | 500 MB free | 2 GB free |
| **Display** | 1024x768 | 1920x1080 or higher |

### Additional Requirements

- **Administrator Access** - Required for installation and service management
- **.NET Framework** - Not required (self-contained)
- **Visual C++ Runtime** - Not required (bundled in executable)
- **Java Runtime** - Not required

---

## Optional Requirements

### Network (Optional)

- **Internet Connection** - Not required for local operation
- **Network Access** - Optional for remote agent connectivity
- **Ports** - Configurable (default: 7777 local)
- **Firewall** - Standard Windows Firewall compatible

### Additional Features (Optional)

- **Remote Dashboard** - Requires local network or VPN
- **Data Backup** - External storage recommended
- **Cloud Sync** - Requires internet (when available)

---

## Supported Windows Versions

### Windows 10

| Version | Build | Support |
|---------|-------|---------|
| 22H2 | 19045 | ✅ Fully Supported |
| 21H2 | 19044 | ✅ Fully Supported |
| 20H2 | 19042 | ✅ Fully Supported |
| 2004 | 19041 | ✅ Fully Supported |
| 1909 | 18363 | ✅ Minimum Supported |
| 1903 | 18362 | ❌ Not Supported |

### Windows 11

| Version | Build | Support |
|---------|-------|---------|
| 23H2 | 22635 | ✅ Fully Supported |
| 22H2 | 22621 | ✅ Fully Supported |
| 21H2 | 22000 | ✅ Fully Supported |

### Windows Server

| Version | Support | Notes |
|---------|---------|-------|
| Server 2022 | ✅ Yes | Full compatibility |
| Server 2019 | ✅ Yes | Tested and compatible |
| Server 2016 | ⚠️ Limited | Not officially tested |

---

## Browser Requirements (Dashboard)

For accessing the web dashboard:

| Browser | Version | Status |
|---------|---------|--------|
| **Chrome** | 90+ | ✅ Recommended |
| **Edge** | 90+ | ✅ Recommended |
| **Firefox** | 88+ | ✅ Supported |
| **Safari** | 14+ | ✅ Supported (Mac remote) |
| **Internet Explorer** | Any | ❌ Not Supported |

### Recommended Settings

- **JavaScript** - Enabled (required)
- **Cookies** - Enabled
- **Local Storage** - Enabled
- **Display Zoom** - 100% (120% tested, supported)
- **Tab Size** - Full screen recommended

---

## Installation Methods

### Method 1: Standalone Executable

**Requirements:**
- systracker-server-win.exe file
- Administrator access (for service installation)
- 500 MB disk space

**Process:**
```
1. Download systracker-server-win.exe
2. Run RUN-SYSTRACKER.bat
3. Access http://localhost:7777
```

### Method 2: Windows Service

**Requirements:**
- Administrator Command Prompt
- Service control permissions
- 500 MB disk space

**Process:**
```
1. Run install-service.bat as Administrator
2. Service auto-starts on system boot
3. Access dashboard from any user account
```

### Method 3: Desktop Shortcut

**Requirements:**
- User account (any privileges)
- Desktop write permissions

**Process:**
```
1. Run create-shortcut.bat
2. Desktop shortcut created
3. Click shortcut to launch
```

---

## Disk Space Requirements

### Installation Size

| Component | Disk Space |
|-----------|-----------|
| **Executable** | 49 MB |
| **Configuration** | 5 MB |
| **Database (initial)** | 10 MB |
| **Logs** | 50 MB (default rotation) |
| **Cache** | 20 MB |
| **Total** | ~500 MB |

### Runtime Disk Space

- **Database Growth** - ~1 MB per day per 10 agents
- **Log Files** - ~50 MB per month
- **Backup Files** - Configurable retention

---

## Memory Requirements

### Runtime Memory Usage

| Scenario | Memory Usage |
|----------|------------|
| **Idle** | 150 MB |
| **Dashboard Open** | 250 MB |
| **10+ Agents Connected** | 400 MB |
| **Peak Usage** | 500 MB |

**Note:** Memory usage varies based on:
- Number of connected agents
- Dashboard refresh rate
- Historical data retention
- System monitoring frequency

---

## Network Requirements

### Local Operation (Default)

- **Network:** Not required
- **Internet:** Not required
- **Ports:** TCP 7777 (configurable)
- **Firewall:** Localhost only

### Remote Operation (Optional)

- **Network:** Stable connection required
- **Bandwidth:** 1 Mbps minimum recommended
- **Ports:** TCP/UDP (configurable)
- **Firewall:** Inbound rules required
- **VPN:** Recommended for security

### Port Requirements

| Port | Protocol | Usage |
|------|----------|-------|
| 7777 | TCP | Web Dashboard (default) |
| 7778 | TCP | WebSocket (optional) |
| 5555 | TCP | Agent Communication (configurable) |

---

## Antivirus Compatibility

### Tested Antivirus Software

| Software | Version | Status |
|----------|---------|--------|
| Windows Defender | Current | ✅ Compatible |
| Norton 360 | 23+ | ✅ Compatible |
| McAfee Total Protection | 16+ | ✅ Compatible |
| Kaspersky | 22+ | ✅ Compatible |
| Avast | 22+ | ✅ Compatible |
| AVG | 22+ | ✅ Compatible |

### Exclusions (if needed)

Add to exclusion list if experiencing issues:

```
C:\Program Files\SysTracker\
%AppData%\SysTracker\
```

---

## Performance Requirements

### Dashboard Performance

| Metric | Requirement |
|--------|          |
| **Page Load** | < 2 seconds |
| **Dashboard Response** | < 500 ms |
| **Metric Update Rate** | 1-5 seconds |
| **CPU Usage** | < 5% during idle monitoring |

### Agent Performance

| Metric | Value |
|--------|-------|
| **CPU Usage** | < 2% (light monitoring) |
| **Memory Usage** | 50-100 MB per agent |
| **Network Bandwidth** | 10-50 KB/s per agent |
| **Update Frequency** | Configurable (1-60 seconds) |

---

## Security Requirements

### Encryption

- **TLS 1.2+** - For remote connections
- **AES-256** - For credential storage
- **SHA-256** - For data integrity

### Authentication

- **Multi-user Support** - JWT-based authentication
- **Password Hashing** - bcrypt algorithm
- **Session Timeout** - Configurable (default 30 minutes)

### Permissions

- **Administrator Rights** - For service installation
- **User Account** - For dashboard access
- **File Permissions** - Standard Windows ACLs

---

## Supported Languages & Localization

| Language | Support |
|----------|---------|
| English (US) | ✅ Default |
| English (UK) | ✅ Supported |
| Other Languages | 🔜 Future versions |

---

## Accessibility Requirements

### WCAG 2.1 AA Support

- ✅ Keyboard navigation
- ✅ Screen reader compatibility
- ✅ High contrast mode
- ✅ Font scaling support
- ✅ Color scheme options

### Accessibility Features

- **Keyboard Shortcuts** - Full keyboard control
- **Screen Readers** - NVDA, JAWS compatible
- **Color Contrast** - WCAG AA compliant
- **Text Scaling** - 100%-200% supported

---

## Upgrade Path

### From Previous Versions

- **v3.0.0+** - Direct upgrade supported
- **v2.x.x** - Migration available
- **v1.x.x** - Requires fresh installation

### Backup Recommendation

Before upgrading:
1. Backup existing database
2. Export monitoring history
3. Document custom settings
4. Test in non-production first

---

## Uninstall Requirements

### Files Created

When uninstalling, the following may be left:

- Configuration files (optional cleanup)
- Database backups (optional)
- Saved preferences

### Clean Uninstall

To completely remove SysTracker:

1. Uninstall via Windows Control Panel
2. Remove service: `sc delete SysTrackerService`
3. Delete folder: `C:\Program Files\SysTracker\`
4. Delete user data: `%AppData%\SysTracker\` (optional)

---

## Troubleshooting

### Insufficient Resources

**Symptoms:** Slow performance, crashes, high CPU usage

**Solution:**
1. Check available disk space
2. Reduce monitoring frequency
3. Limit agent connections
4. Increase available RAM

### Compatibility Issues

**Symptoms:** Won't install, crashes on launch

**Solution:**
1. Update Windows to latest version
2. Verify OS is supported version
3. Check antivirus exclusions
4. Ensure admin privileges

### Network Issues

**Symptoms:** Dashboard won't load, agents can't connect

**Solution:**
1. Check firewall rules
2. Verify port availability
3. Test network connectivity
4. Review firewall logs

---

## Pre-Installation Checklist

Before installing SysTracker:

- [ ] Windows 10 v1909+ or Windows 11 installed
- [ ] 500 MB free disk space available
- [ ] Administrator access available
- [ ] Antivirus software up to date
- [ ] System is connected to power (for laptops)
- [ ] No installation conflicts known
- [ ] Backup current system (recommended)

---

## Post-Installation Verification

After installation:

- [ ] Service starts automatically
- [ ] Dashboard loads at http://localhost:7777
- [ ] Login works with credentials
- [ ] System metrics display correctly
- [ ] Agents can connect and report data
- [ ] Performance is acceptable

---

## Support for Older Systems

### Windows Vista/7/8

**Status:** ❌ Not Supported

SysTracker requires Windows 10 v1909 or later. Older systems:

- Cannot run the application
- Receive a compatibility error
- Should upgrade to supported OS

### Windows Embedded

**Status:** ⚠️ Not Officially Tested

May work but not officially supported. Use at your own risk.

---

## Reporting Requirements

### System Information Required for Support

When reporting issues, include:

```
- Windows Version (e.g., Windows 11 Build 22621)
- Installed SysTracker Version
- System Hardware Specs (RAM, CPU, Disk)
- Error Messages (exact text)
- Antivirus Software in Use
- Recent System Changes
- Steps to Reproduce Issue
```

---

## Performance Tuning

### For Resource-Constrained Systems

1. **Reduce Monitoring Frequency** - Increase update interval
2. **Disable Unused Features** - Turn off unneeded monitors
3. **Limit Database Retention** - Keep fewer historical days
4. **Limit Agent Connections** - Reduce max concurrent agents
5. **Clear Old Logs** - Regularly clear archived logs

---

## Future Requirements (Planned)

### Upcoming Features

- **GPU Monitoring** - NVIDIA/AMD GPU support
- **Network Tracing** - Advanced packet analysis
- **Custom Plugins** - User-created monitoring plugins
- **Cloud Integration** - Optional cloud storage (v3.2+)

---

## Support Information

For questions about system requirements:

- **GitHub Issues:** https://github.com/Redwan002117/SysTracker/issues
- **Documentation:** See README.md and WINDOWS-STANDALONE-SETUP.md
- **Status Page:** Check GitHub for known issues

---

**Status:** ✅ Certification Ready

**Last Updated:** February 21, 2026  
**Version:** 3.1.2
