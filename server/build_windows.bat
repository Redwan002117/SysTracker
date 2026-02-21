@echo off
REM Build SysTracker Server Windows Executable
REM Requirements: Node.js 18+, npm, pkg

setlocal enabledelayedexpansion
cd /d "%~dp0"

color 0B
cls
echo.
echo =============================================================
echo   SysTracker Server - Windows Build Script
echo =============================================================
echo.

REM Check Node.js
echo [1/4] Checking Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    color 0C
    echo ERROR: Node.js not found!
    echo Download from: https://nodejs.org/ (v18 or later)
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✓ Found %NODE_VERSION%
echo.

REM Check npm
echo [2/4] Installing npm packages...
echo   • Server dependencies...
npm install --legacy-peer-deps
if errorlevel 1 (
    color 0C
    echo ERROR: npm install failed!
    pause
    exit /b 1
)
echo ✓ Server dependencies installed
echo.

REM Build Dashboard
echo [3/4] Building dashboard...
if not exist "..\dashboard\package.json" (
    echo ERROR: Dashboard not found at ..\dashboard\
    pause
    exit /b 1
)
cd ..\dashboard
echo   • Dashboard dependencies...
npm install --legacy-peer-deps
if errorlevel 1 (
    color 0C
    echo ERROR: Dashboard npm install failed!
    cd ..\server
    pause
    exit /b 1
)
echo   • Building with Next.js...
npm run build
if errorlevel 1 (
    color 0C
    echo ERROR: Dashboard build failed!
    cd ..\server
    pause
    exit /b 1
)
echo   • Copying assets to server...
rmdir /s /q "..\server\dashboard-dist" >nul 2>&1
mkdir "..\server\dashboard-dist"
xcopy /E /Y /I "out\*" "..\server\dashboard-dist\" >nul
if errorlevel 1 (
    color 0C
    echo ERROR: Failed to copy dashboard assets!
    cd ..\server
    pause
    exit /b 1
)
echo ✓ Dashboard built and integrated
cd ..\server
echo.

REM Build Windows EXE
echo [4/4] Building Windows executable...
echo   • Compiling with pkg...
call npm run build:win
if errorlevel 1 (
    color 0C
    echo ERROR: Build failed!
    pause
    exit /b 1
)

REM Get result
for /f "tokens=*" %%i in ('dir /b systracker-server-*.exe 2^>nul') do set EXE_FILE=%%i
if not defined EXE_FILE (
    color 0C
    echo ERROR: Output exe not found!
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('powershell -Command "(Get-Item '%EXE_FILE%').Length / 1MB | [Math]::Round($_,2)"') do set EXE_SIZE=%%i

color 0A
echo.
echo =============================================================
echo   Build Complete!
echo =============================================================
echo.
echo Output: %EXE_FILE%
echo Size: %EXE_SIZE% MB
echo.
echo Next Steps:
echo   1. Transfer %EXE_FILE% to your Windows PC
echo   2. Run installation: install_windows_service.ps1
echo      (PowerShell Admin mode)
echo.
echo Or: Download pre-built from:
echo   https://github.com/Redwan002117/SysTracker/releases
echo.
pause
