@echo off
REM SysTracker Agent Log Viewer
REM Opens the latest agent log file in Notepad

set LOG_DIR=%PROGRAMDATA%\SysTracker\Agent\logs

if not exist "%LOG_DIR%" (
    echo Error: Log directory not found: %LOG_DIR%
    echo The agent may not be running yet.
    pause
    exit /b 1
)

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
