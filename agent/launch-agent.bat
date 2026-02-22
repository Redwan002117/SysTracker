@echo off
REM ============================================================
REM SysTracker Agent - Windows GUI Launcher
REM Launches the agent hidden; all output goes to log files in
REM  %ProgramData%\SysTracker\Agent\logs\  (primary)
REM  %APPDATA%\SysTracker\Agent\logs\      (fallback)
REM  <install dir>\logs\                   (last resort)
REM ============================================================

setlocal enabledelayedexpansion

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"
set "AGENT_EXE=%SCRIPT_DIR%dist\systracker-agent-win.exe"

REM Determine a fallback log path for the VBScript redirect (belt-and-suspenders).
REM The agent itself also writes structured logs from inside the exe.
set "LOG_ROOT=%PROGRAMDATA%\SysTracker\Agent\logs"
if not exist "%LOG_ROOT%" mkdir "%LOG_ROOT%" 2>nul
if not exist "%LOG_ROOT%" set "LOG_ROOT=%APPDATA%\SysTracker\Agent\logs"
if not exist "%LOG_ROOT%" mkdir "%LOG_ROOT%" 2>nul
if not exist "%LOG_ROOT%" set "LOG_ROOT=%SCRIPT_DIR%logs"
if not exist "%LOG_ROOT%" mkdir "%LOG_ROOT%" 2>nul

REM Get today's date for the fallback log filename (YYYY-MM-DD)
for /f "tokens=1-3 delims=/" %%a in ("%DATE%") do (
    set "TODAY=%%c-%%a-%%b"
)
set "FALLBACK_LOG=%LOG_ROOT%\launcher_%TODAY%.log"

REM Create a VBScript that launches the agent hidden and redirects output
set "VBS_FILE=%TEMP%\launch-agent-hidden.vbs"

(
    echo Set objShell = CreateObject("WScript.Shell"^)
    echo strCommand = "cmd.exe /c ""%AGENT_EXE%"" >> ""%FALLBACK_LOG%"" 2>&1"
    echo objShell.Run strCommand, 0, false
) > "%VBS_FILE%"

REM Run the VBScript to launch hidden, then clean up
cscript.exe //NoLogo "%VBS_FILE%"
del "%VBS_FILE%"

echo.
echo  SysTracker Agent started in background.
echo.
echo  Logs are written to:
echo    %LOG_ROOT%\
echo.
echo  To view live logs, open that folder or run:
echo    type "%LOG_ROOT%\launcher_%TODAY%.log"
echo.
