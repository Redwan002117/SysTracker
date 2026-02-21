@echo off
REM SysTracker Server - Standalone Windows Launcher
REM This script runs SysTracker as a windows service or background process
REM No PowerShell window needs to stay open

setlocal enabledelayedexpansion

:: Get current directory
cd /d "%~dp0"

:: Check if SysTracker is already running
tasklist /FI "IMAGENAME eq systracker-server-win.exe" 2>NUL | find /I /N "systracker-server-win.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✓ SysTracker is already running
    echo.
    echo Dashboard: http://localhost:7777
    timeout /t 3 /nobreak
    exit /b 0
)

:: Display startup message
cls
echo.
echo ╔════════════════════════════════════════╗
echo ║   SysTracker Server v3.1.2             ║
echo ║   Starting as Standalone Service       ║
echo ╚════════════════════════════════════════╝
echo.
echo Starting server...
echo.

:: Check if .env exists, if not create default
if not exist ".env" (
    echo Creating default configuration...
    (
        echo PORT=7777
        echo NODE_ENV=production
        echo JWT_SECRET=auto-generated-key
    ) > ".env"
)

:: Start the server in background using vbscript
set "vbscript=%temp%\run-systracker.vbs"
(
    echo Set objShell = CreateObject("WScript.Shell"^)
    echo objShell.Run """!CD!\systracker-server-win.exe""", 0, False
) > "!vbscript!"

cscript.exe "!vbscript!" //B //nologo

:: Give server time to start
timeout /t 3 /nobreak

:: Check if server started successfully
tasklist /FI "IMAGENAME eq systracker-server-win.exe" 2>NUL | find /I /N "systracker-server-win.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo.
    echo ╔════════════════════════════════════════╗
    echo ║   ✓ SysTracker Started Successfully    ║
    echo ║                                        ║
    echo ║   Dashboard: http://localhost:7777    ║
    echo ║                                        ║
    echo ║   The server is running in background  ║
    echo ║   You can close this window            ║
    echo ╚════════════════════════════════════════╝
    echo.
    echo Tip: Open http://localhost:7777 in your browser
    echo.
    timeout /t 5 /nobreak
) else (
    echo.
    echo ✗ ERROR: Failed to start SysTracker
    echo.
    echo Troubleshooting:
    echo   1. Check if port 7777 is already in use
    echo   2. Make sure systracker-server-win.exe exists in this directory
    echo   3. Check Windows Firewall settings
    echo.
    pause
    exit /b 1
)

endlocal
exit /b 0
