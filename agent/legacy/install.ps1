# SysTracker Agent Installer
$ErrorActionPreference = "Stop"

# Ensure Admin Privileges
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Please run this script as Administrator!" -ForegroundColor Red
    Start-Sleep -Seconds 5
    Exit
}

# STANDARDIZED: All versions now install to the same location
$InstallDir = "C:\Program Files\SysTracker Agent"
$ExeName = "SysTracker_Agent.exe"
$ConfigName = "config.json"
$SourceExe = Join-Path $PSScriptRoot $ExeName
$SourceConfig = Join-Path $PSScriptRoot $ConfigName

Write-Host "Installing SysTracker Agent..." -ForegroundColor Cyan

# Create Directory
if (!(Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    Write-Host "Created $InstallDir" -ForegroundColor Green
}

# Stop existing service if running
try {
    Stop-Service "SysTrackerAgent" -ErrorAction SilentlyContinue
    & "$InstallDir\$ExeName" --startup auto remove
} catch {}

# Copy Files
Copy-Item $SourceExe -Destination "$InstallDir\$ExeName" -Force
Write-Host "Copied executable." -ForegroundColor Green

# Handle Config
if (Test-Path "$InstallDir\$ConfigName") {
    $choice = Read-Host "Config file already exists. Overwrite? (y/N)"
    if ($choice -eq 'y') {
        Copy-Item $SourceConfig -Destination "$InstallDir\$ConfigName" -Force
        Write-Host "Config updated." -ForegroundColor Yellow
    } else {
        Write-Host "Kept existing config." -ForegroundColor Gray
    }
} else {
    Copy-Item $SourceConfig -Destination "$InstallDir\$ConfigName" -Force
    Write-Host "Config created." -ForegroundColor Green
    
    # Prompt for Server URL
    $url = Read-Host "Enter SysTracker Server URL (e.g., http://192.168.1.10:7777/api)"
    if ($url) {
        $json = Get-Content "$InstallDir\$ConfigName" | ConvertFrom-Json
        $json.api_url = $url
        $json | ConvertTo-Json | Set-Content "$InstallDir\$ConfigName"
        Write-Host "Server URL updated to $url" -ForegroundColor Green
    }
}

# Install Service
Set-Location $InstallDir
& ".\$ExeName" --startup auto install
Write-Host "Service Installed." -ForegroundColor Green

# Start Service
Start-Service "SysTrackerAgent"
Write-Host "Service Started! Agent is running in background." -ForegroundColor Cyan
