@echo off
REM ============================================
REM SysTracker Agent Diagnostic Tool
REM ============================================
REM Run this to troubleshoot agent installation and connection issues

echo.
echo ============================================
echo SysTracker Agent Diagnostic Tool
echo ============================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Running as Administrator
) else (
    echo [WARNING] Not running as Administrator
    echo Some checks may fail. Right-click and "Run as Administrator" for full diagnostics.
)
echo.

REM 1. Check Service Status
echo [1/8] Checking Windows Service status...
sc query "SysTracker Agent" >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Service is installed
    sc query "SysTracker Agent" | findstr "STATE"
) else (
    echo [ERROR] Service "SysTracker Agent" is NOT installed
    echo        Run install-agent.ps1 to install the service
)
echo.

REM 2. Check Installation Directory
echo [2/8] Checking installation directory...
if exist "C:\Program Files\SysTrackerAgent\SysTracker_Agent.exe" (
    echo [OK] Agent executable found: C:\Program Files\SysTrackerAgent\SysTracker_Agent.exe
) else if exist "C:\Program Files\SysTrackerAgent\client_agent.py" (
    echo [OK] Agent script found: C:\Program Files\SysTrackerAgent\client_agent.py
) else (
    echo [ERROR] Agent not found in C:\Program Files\SysTrackerAgent\
)
echo.

REM 3. Check Configuration File
echo [3/8] Checking configuration file...
if exist "C:\Program Files\SysTrackerAgent\config.json" (
    echo [OK] Config file exists: C:\Program Files\SysTrackerAgent\config.json
    type "C:\Program Files\SysTrackerAgent\config.json"
) else (
    echo [WARNING] No config.json found - using default settings
    echo           Server URL: https://monitor.rico.bd/api
    echo           API Key: YOUR_STATIC_API_KEY_HERE
)
echo.

REM 4. Check Log Directories
echo [4/8] Checking for log directories...
set FOUND_LOGS=0

if exist "%PROGRAMDATA%\SysTracker\Agent\logs\agent_*.log" (
    echo [OK] Logs found in: %PROGRAMDATA%\SysTracker\Agent\logs
    set FOUND_LOGS=1
)

if exist "%APPDATA%\SysTracker\Agent\logs\agent_*.log" (
    echo [OK] Logs found in: %APPDATA%\SysTracker\Agent\logs
    set FOUND_LOGS=1
)

if exist "%TEMP%\SysTracker\logs\agent_*.log" (
    echo [OK] Logs found in: %TEMP%\SysTracker\logs
    set FOUND_LOGS=1
)

if %FOUND_LOGS%==0 (
    echo [WARNING] No log files found
    echo           Agent may not have started yet or lacks write permissions
)
echo.

REM 5. Check Server Connectivity
echo [5/8] Testing server connectivity...
echo Testing: https://monitor.rico.bd/api/health
curl -s -m 10 https://monitor.rico.bd/api/health >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Server is reachable
    curl -s -m 10 https://monitor.rico.bd/api/health
) else (
    echo [ERROR] Cannot reach server
    echo        - Check if server is running
    echo        - Check firewall/network settings
    echo        - Verify SSL certificate is valid
)
echo.

REM 6. Check Python Installation (if running Python version)
echo [6/8] Checking Python installation...
python --version >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Python is installed:
    python --version
    
    REM Check required modules
    echo.
    echo Checking required Python modules...
    python -c "import psutil" 2>nul && echo [OK] psutil installed || echo [ERROR] psutil missing
    python -c "import requests" 2>nul && echo [OK] requests installed || echo [ERROR] requests missing
    python -c "import socketio" 2>nul && echo [OK] socketio installed || echo [ERROR] socketio missing
) else (
    echo [INFO] Python not in PATH (OK if using compiled .exe version)
)
echo.

REM 7. Check Windows Event Log
echo [7/8] Checking Windows Event Log for errors...
powershell -Command "Get-EventLog -LogName Application -Source '*SysTracker*' -Newest 3 -ErrorAction SilentlyContinue | Format-List TimeGenerated, EntryType, Message" 2>nul
if %errorLevel% neq 0 (
    echo [INFO] No events found in Windows Event Log
)
echo.

REM 8. Port Check
echo [8/8] Checking network connectivity to server port...
powershell -Command "Test-NetConnection -ComputerName monitor.rico.bd -Port 443 -InformationLevel Quiet" >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Port 443 is reachable
) else (
    echo [WARNING] Port 443 may be blocked by firewall
)
echo.

echo ============================================
echo Diagnostic complete
echo ============================================
echo.
echo Next steps:
echo   - View logs: run view-agent-log.bat
echo   - Check service: services.msc (look for "SysTracker Agent")
echo   - Manual test: cd "C:\Program Files\SysTrackerAgent" && SysTracker_Agent.exe
echo.
pause
