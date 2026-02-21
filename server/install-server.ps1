# SysTracker Application Installer
# This PowerShell script installs SysTracker as a proper Windows application

param(
    [string]$InstallPath = "$env:ProgramFiles\SysTracker",
    [switch]$RunAsService = $false,
    [switch]$NoShortcuts = $false
)

$ErrorActionPreference = "Stop"
$VerbosePreference = "Continue"

# Check admin rights
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    exit 1
}

Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   SysTracker Server Installation Script   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Installation Path: $InstallPath" -ForegroundColor Yellow

# Create installation directory
Write-Host "📁 Creating installation directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null

# Copy application files
Write-Host "📋 Copying application files..." -ForegroundColor Yellow
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Define source files
$filesToCopy = @(
    "systracker-server-win.exe",
    "app.ico",
    "logo.ico",
    ".env.example"
)

foreach ($file in $filesToCopy) {
    $source = Join-Path $scriptDir $file
    if (Test-Path $source) {
        Copy-Item $source -Destination $InstallPath -Force
        Write-Host "  ✓ Copied $file" -ForegroundColor Green
    }
}

# Create desktop shortcut
if (-not $NoShortcuts) {
    Write-Host "🔗 Creating desktop shortcut..." -ForegroundColor Yellow
    
    $shell = New-Object -ComObject WScript.Shell
    $desktop = [System.Environment]::GetFolderPath('Desktop')
    $shortcutPath = Join-Path $desktop "SysTracker Server.lnk"
    
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = Join-Path $InstallPath "SysTrackerServer.exe"
    $shortcut.WorkingDirectory = $InstallPath
    $shortcut.IconLocation = Join-Path $InstallPath "systracker.ico"
    $shortcut.Description = "SysTracker System Monitoring Dashboard"
    $shortcut.Save()
    
    Write-Host "  ✓ Desktop shortcut created" -ForegroundColor Green
}

# Create Start Menu shortcut
Write-Host "📌 Creating Start Menu shortcut..." -ForegroundColor Yellow

$startMenu = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\SysTracker"
New-Item -ItemType Directory -Path $startMenu -Force | Out-Null

$startMenuShortcut = $shell.CreateShortcut((Join-Path $startMenu "Server.lnk"))
$startMenuShortcut.TargetPath = Join-Path $InstallPath "SysTrackerServer.exe"
$startMenuShortcut.WorkingDirectory = $InstallPath
$startMenuShortcut.IconLocation = Join-Path $InstallPath "systracker.ico"
$startMenuShortcut.Description = "SysTracker System Monitoring Dashboard"
$startMenuShortcut.Save()

Write-Host "  ✓ Start Menu entry created" -ForegroundColor Green

# Create registry entries for application
Write-Host "📝 Registering application..." -ForegroundColor Yellow

$regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\SysTracker-Server"
New-Item -Path $regPath -Force | Out-Null

Set-ItemProperty -Path $regPath -Name "DisplayName" -Value "SysTracker Server"
Set-ItemProperty -Path $regPath -Name "DisplayVersion" -Value "3.2.2"
Set-ItemProperty -Path $regPath -Name "Publisher" -Value "RedwanCodes"
Set-ItemProperty -Path $regPath -Name "InstallLocation" -Value $InstallPath
Set-ItemProperty -Path $regPath -Name "DisplayIcon" -Value (Join-Path $InstallPath "logo.ico")

Write-Host "  ✓ Application registered" -ForegroundColor Green

# Create .env file if not exists
$envFile = Join-Path $InstallPath ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "⚙️  Creating configuration file..." -ForegroundColor Yellow
    @"
NODE_ENV=production
PORT=7777
DB_PATH=./data/sys_tracker.db
ALLOWED_IPS=localhost,127.0.0.1
"@ | Out-File $envFile -Encoding UTF8
    Write-Host "  ✓ Configuration file created (.env)" -ForegroundColor Green
}

# Create data directory
Write-Host "📂 Creating data directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path (Join-Path $InstallPath "data") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $InstallPath "logs") -Force | Out-Null
Write-Host "  ✓ Data and logs directories created" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║      Installation Completed ✓            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Application Location: $InstallPath" -ForegroundColor Cyan
Write-Host "🎯 You can now:" -ForegroundColor Cyan
Write-Host "   1. Double-click the desktop shortcut to start" -ForegroundColor White
Write-Host "   2. Or search for 'SysTracker Server' in Start Menu" -ForegroundColor White
Write-Host "   3. Or run: & '$InstallPath\SysTrackerServer.exe'" -ForegroundColor White
Write-Host ""
Write-Host "🌐 The dashboard will open at: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "ℹ️  Tip: Add to Windows Startup" -ForegroundColor Cyan
Write-Host "   Run: shell:startup" -ForegroundColor White
Write-Host "   Then place a shortcut to SysTrackerServer.exe there" -ForegroundColor White
Write-Host ""
