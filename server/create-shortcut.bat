@echo off
REM Create Desktop Shortcut for SysTracker
REM This script creates a convenient desktop shortcut to launch SysTracker

setlocal enabledelayedexpansion

cd /d "%~dp0"

set "EXE_PATH=%CD%\systracker-server-win.exe"
set "BATCH_PATH=%CD%\RUN-SYSTRACKER.bat"
set "ICON_PATH=%CD%\logo.ico"
set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT_PATH=%DESKTOP%\SysTracker.lnk"

echo.
echo Creating SysTracker Desktop Shortcut...
echo.

if not exist "%EXE_PATH%" (
    echo Error: systracker-server-win.exe not found
    pause
    exit /b 1
)

REM Use VBScript to create the shortcut (works better than direct shortcuts)
set "vbscript=%temp%\create-shortcut.vbs"
(
    echo Set objWshShell = WScript.CreateObject("WScript.Shell"^)
    echo Set objLink = objWshShell.CreateLink("%SHORTCUT_PATH%"^)
    echo objLink.TargetPath = "%BATCH_PATH%"
    echo objLink.WorkingDirectory = "%CD%"
    echo objLink.Description = "SysTracker Server - System Monitoring Platform"
    if exist "%ICON_PATH%" (
        echo objLink.IconLocation = "%ICON_PATH%"
    ) else (
        echo objLink.IconLocation = "%SystemRoot%\System32\shell32.dll,50"
    )
    echo objLink.WindowStyle = 1
    echo objLink.Save
) > "!vbscript!"

cscript.exe "!vbscript!" //B //nologo

if exist "%SHORTCUT_PATH%" (
    echo ✓ Shortcut created successfully!
    echo.
    echo Location: %SHORTCUT_PATH%
    echo.
    echo You can now:
    echo   1. Double-click the shortcut to start SysTracker
    echo   2. Right-click > Pin to Start for quick access
    echo   3. Right-click > Send to > Taskbar for taskbar shortcut
    echo.
) else (
    echo Error: Failed to create shortcut
    echo.
)

pause
endlocal
