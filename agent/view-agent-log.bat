@echo off
REM SysTracker Agent Log Viewer
REM Opens the latest agent log file in Notepad

echo Searching for agent logs in multiple locations...
echo.

REM Try location 1: ProgramData (most common for services)
set LOG_DIR=%PROGRAMDATA%\SysTracker\Agent\logs
if exist "%LOG_DIR%\agent_*.log" (
    echo Found logs in: %LOG_DIR%
    goto :FOUND
)

REM Try location 2: User AppData
set LOG_DIR=%APPDATA%\SysTracker\Agent\logs
if exist "%LOG_DIR%\agent_*.log" (
    echo Found logs in: %LOG_DIR%
    goto :FOUND
)

REM Try location 3: Temp directory
set LOG_DIR=%TEMP%\SysTracker\logs
if exist "%LOG_DIR%\agent_*.log" (
    echo Found logs in: %LOG_DIR%
    goto :FOUND
)

REM Try location 4: Script directory (where agent is installed)
set SCRIPT_DIR=%~dp0
set LOG_DIR=%SCRIPT_DIR%logs
if exist "%LOG_DIR%\agent_*.log" (
    echo Found logs in: %LOG_DIR%
    goto :FOUND
)

REM Try location 5: Common installation directory
set LOG_DIR=C:\Program Files\SysTrackerAgent\logs
if exist "%LOG_DIR%\agent_*.log" (
    echo Found logs in: %LOG_DIR%
    goto :FOUND
)

echo.
echo ERROR: No log files found in any of these locations:
echo   1. %PROGRAMDATA%\SysTracker\Agent\logs
echo   2. %APPDATA%\SysTracker\Agent\logs
echo   3. %TEMP%\SysTracker\logs
echo   4. %SCRIPT_DIR%logs
echo   5. C:\Program Files\SysTrackerAgent\logs
echo.
echo The agent may not be running, or may not have permission to create logs.
echo Try running the agent manually to see startup messages.
pause
exit /b 1

:FOUND

REM Find the most recent log file
for /f "delims=" %%i in ('dir /b /od "%LOG_DIR%\agent_*.log" 2^>nul') do set "LATEST_LOG=%%i"

if not defined LATEST_LOG (
    echo No log files found in: %LOG_DIR%
    pause
    exit /b 1
)

echo Opening log file: %LOG_DIR%\%LATEST_LOG%
echo.
start notepad "%LOG_DIR%\%LATEST_LOG%"
