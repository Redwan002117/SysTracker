@echo off
REM ============================================================
REM SysTracker Agent - Windows GUI Launcher
REM This batch file launches the agent without showing console
REM ============================================================

setlocal enabledelayedexpansion

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"

REM Create a VBScript to hide the console window
set "VBS_FILE=%TEMP%\launch-agent-hidden.vbs"

(
    echo Set objShell = CreateObject("WScript.Shell"^)
    echo strCommand = "cmd.exe /c start """" /B ""%SCRIPT_DIR%dist\systracker-agent-win.exe"""
    echo objShell.Run strCommand, 0, false
) > "%VBS_FILE%"

REM Run the VBScript to launch hidden, then clean up
cscript.exe //NoLogo "%VBS_FILE%"
del "%VBS_FILE%"

echo.
echo ✓ SysTracker Agent started in background
echo.
echo Agent is now monitoring your system and connecting to the server.
echo No console window needed - the agent runs as a service.
echo.
