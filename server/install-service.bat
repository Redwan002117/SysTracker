@echo off
REM SysTracker Windows Service Manager
REM Install, Start, Stop, or Uninstall SysTracker as a Windows Service
REM Run as Administrator

setlocal enabledelayedexpansion

:: Check for administrator privileges
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if %errorlevel% neq 0 (
    echo.
    echo This script must be run as Administrator!
    echo.
    echo Right-click this file and select "Run as Administrator"
    echo.
    pause
    exit /b 1
)

cd /d "%~dp0"

set "SERVICE_NAME=SysTrackerServer"
set "DISPLAY_NAME=SysTracker (System Monitoring)"
set "EXE_PATH=%CD%\systracker-server-win.exe"

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║  SysTracker Windows Service Manager v3.1.2        ║
echo ╚════════════════════════════════════════════════════╝
echo.
echo Service Name: %SERVICE_NAME%
echo Executable: %EXE_PATH%
echo.

if "%1"=="install" goto install
if "%1"=="uninstall" goto uninstall
if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="status" goto status

echo Usage:
echo   install-service.bat install    - Install as Windows Service
echo   install-service.bat uninstall  - Remove Windows Service
echo   install-service.bat start      - Start the service
echo   install-service.bat stop       - Stop the service
echo   install-service.bat status     - Check service status
echo.
pause
exit /b 1

:install
echo Installing Windows Service...
echo.

REM Check if service already exists
sc query %SERVICE_NAME% >nul 2>&1
if %errorlevel% equ 0 (
    echo Error: Service already exists
    echo Run 'install-service.bat uninstall' first
    pause
    exit /b 1
)

REM Check if exe exists
if not exist "%EXE_PATH%" (
    echo Error: systracker-server-win.exe not found in this directory
    pause
    exit /b 1
)

REM Create the service
sc create %SERVICE_NAME% ^
    binPath= "%EXE_PATH%" ^
    DisplayName= "%DISPLAY_NAME%" ^
    start= auto ^
    >nul 2>&1

if %errorlevel% neq 0 (
    echo Error: Failed to create service
    pause
    exit /b 1
)

REM Set service description
sc description %SERVICE_NAME% "System monitoring and performance tracking server. Runs SysTracker with embedded dashboard on port 7777" >nul 2>&1

REM Set failure actions (restart on crash)
sc failure %SERVICE_NAME% reset= 86400 actions= restart/60000/restart/60000/support/300000 >nul 2>&1

echo.
echo ✓ Service installed successfully
echo.
echo Settings:
echo   - Service: %SERVICE_NAME%
echo   - Startup Type: Automatic
echo   - Recovery: Auto-restart after 1 minute on crash
echo.
echo Next steps:
echo   1. Run: install-service.bat start
echo   2. Open: http://localhost:7777
echo   3. Complete setup wizard
echo.
pause
exit /b 0

:uninstall
echo Uninstalling Windows Service...
echo.

REM Check if service exists
sc query %SERVICE_NAME% >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Service not found
    pause
    exit /b 1
)

REM Stop the service first
sc stop %SERVICE_NAME% >nul 2>&1
timeout /t 2 /nobreak

REM Delete the service
sc delete %SERVICE_NAME% >nul 2>&1

if %errorlevel% neq 0 (
    echo Error: Failed to delete service
    pause
    exit /b 1
)

echo ✓ Service uninstalled successfully
echo.
pause
exit /b 0

:start
echo Starting Windows Service...
echo.

REM Check if service exists
sc query %SERVICE_NAME% >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Service not found
    echo Run 'install-service.bat install' first
    pause
    exit /b 1
)

sc start %SERVICE_NAME% >nul 2>&1

timeout /t 2 /nobreak

REM Check if service started
sc query %SERVICE_NAME% | find "RUNNING" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Service started successfully
    echo.
    echo Dashboard will be available at: http://localhost:7777
    echo.
) else (
    echo Error: Failed to start service
    echo Check Windows Event Viewer for details
    echo.
)

pause
exit /b 0

:stop
echo Stopping Windows Service...
echo.

REM Check if service exists
sc query %SERVICE_NAME% >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Service not found
    pause
    exit /b 1
)

sc stop %SERVICE_NAME% >nul 2>&1

timeout /t 2 /nobreak

echo ✓ Service stopped
echo.
pause
exit /b 0

:status
echo.
sc query %SERVICE_NAME% | find "STATE" >nul 2>&1
if %errorlevel% equ 0 (
    sc query %SERVICE_NAME%
) else (
    echo Service not installed
)
echo.
pause
exit /b 0

endlocal
