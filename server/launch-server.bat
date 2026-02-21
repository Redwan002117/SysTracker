@echo off
REM ============================================================
REM SysTracker Server - Windows GUI Launcher
REM This batch file launches the server without showing console
REM ============================================================

setlocal enabledelayedexpansion

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"

REM Create a VBScript to hide the console window
set "VBS_FILE=%TEMP%\launch-server-hidden.vbs"

(
    echo Set objShell = CreateObject("WScript.Shell"^)
    echo strCommand = "cmd.exe /c start """" /B ""%SCRIPT_DIR%systracker-server-win.exe"""
    echo objShell.Run strCommand, 0, false
) > "%VBS_FILE%"

REM Run the VBScript to launch hidden, then clean up
cscript.exe //NoLogo "%VBS_FILE%"
del "%VBS_FILE%"

REM Open browser to dashboard
timeout /t 2 /nobreak
start http://localhost:3000
