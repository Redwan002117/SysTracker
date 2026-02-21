#Requires -RunAsAdministrator
<#
.SYNOPSIS
    SysTracker Server - Windows Service Installation Script
    
.DESCRIPTION
    Installs SysTracker Server as a Windows Service that auto-starts
    Requires: Administrator privileges, NSSM (https://nssm.cc/download)
    
.PARAMETER InstallDir
    Installation directory (default: C:\Program Files\SysTracker Server)
    
.PARAMETER ExePath
    Path to systracker-server-win.exe (default: script directory)
    
.PARAMETER Port
    Server port (default: 7777)
    
.PARAMETER StartService
    Start service immediately after installation (default: $true)
    
.EXAMPLE
    .\install_windows_service.ps1
    
.EXAMPLE
    .\install_windows_service.ps1 -InstallDir "D:\SysTracker" -Port 8080
#>

param(
    [string]$InstallDir = "C:\Program Files\SysTracker Server",
    [string]$ExePath = $PSScriptRoot,
    [int]$Port = 7777,
    [switch]$StartService = $true,
    [switch]$Help = $false
)

# Colors
$Colors = @{
    Success = [System.ConsoleColor]::Green
    Error   = [System.ConsoleColor]::Red
    Warning = [System.ConsoleColor]::Yellow
    Info    = [System.ConsoleColor]::Cyan
    Muted   = [System.ConsoleColor]::Gray
}

function Write-Styled {
    param($Message, $Color = "Info", $NoNewline = $false)
    Write-Host $Message -ForegroundColor $Colors[$Color] -NoNewline:$NoNewline
    if (-not $NoNewline) { Write-Host "" }
}

function Show-Header {
    Write-Host ""
    Write-Styled "╔════════════════════════════════════════════╗" "Info"
    Write-Styled "║  SysTracker Server - Windows Installation  ║" "Cyan"
    Write-Styled "╚════════════════════════════════════════════╝" "Info"
    Write-Host ""
}

function Show-Help {
    Write-Host @"
SysTracker Server - Windows Service Installation

SYNTAX
    .\install_windows_service.ps1 [-InstallDir <string>] [-ExePath <string>] [-Port <int>] [-StartService] [-Help]

PARAMETERS
    -InstallDir <string>
        Installation directory. Default: C:\Program Files\SysTracker Server

    -ExePath <string>
        Path to systracker-server-win.exe. Default: Script directory

    -Port <int>
        Server port number. Default: 7777

    -StartService
        Start service immediately. Default: $true

    -Help
        Show this help message

EXAMPLES
    # Install in default location
    .\install_windows_service.ps1

    # Install to custom directory
    .\install_windows_service.ps1 -InstallDir "D:\SysTracker"

    # Install on custom port
    .\install_windows_service.ps1 -Port 8080

    # Install without starting service
    .\install_windows_service.ps1 -StartService:$false

REQUIREMENTS
    - Administrator privileges
    - NSSM (Node Simple Service Manager)
      Download: https://nssm.cc/download
      Extract to: C:\nssm or add to PATH

TROUBLESHOOTING
    Port in use: netstat -ano | findstr :7777
    Service logs: $InstallDir\logs\service.log
    View service: Get-Service SysTracker
    Stop service: Stop-Service SysTracker
    Remove service: nssm remove SysTracker confirm
"@
}

# ============================================================================
# MAIN SCRIPT
# ============================================================================

try {
    if ($Help) {
        Show-Help
        exit 0
    }

    Show-Header

    # 1. Check Admin Privileges
    Write-Styled "Checking administrator privileges..." "Info"
    $principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Styled "ERROR: This script must run as Administrator!" "Error"
        Write-Styled "Right-click PowerShell and select 'Run as Administrator'" "Warning"
        exit 1
    }
    Write-Styled "✓ Running as Administrator" "Success"
    Write-Host ""

    # 2. Find Executable
    Write-Styled "Locating executable..." "Info"
    $ExeFile = Get-ChildItem -Path $ExePath -Filter "systracker-server*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    
    if (-not $ExeFile) {
        Write-Styled "ERROR: systracker-server-win.exe not found" "Error"
        Write-Styled "Searched in: $ExePath" "Muted"
        Write-Styled "Solutions:" "Warning"
        Write-Styled "  1. Build it: cd server && npm run build:win" "Muted"
        Write-Styled "  2. Download from: https://github.com/Redwan002117/SysTracker/releases" "Muted"
        Write-Styled "  3. Place .exe in: $ExePath" "Muted"
        exit 1
    }
    
    Write-Styled "✓ Found: $($ExeFile.Name)" "Success"
    Write-Styled "  Size: $([Math]::Round($ExeFile.Length / 1MB, 2)) MB" "Muted"
    Write-Host ""

    # 3. Check NSSM
    Write-Styled "Checking for NSSM..." "Info"
    $nssm = Get-Command nssm -ErrorAction SilentlyContinue
    if (-not $nssm) {
        Write-Styled "ERROR: NSSM (Node Simple Service Manager) not found in PATH" "Error"
        Write-Host ""
        Write-Styled "Installation steps:" "Warning"
        Write-Host "  1. Download NSSM: https://nssm.cc/download" -ForegroundColor $Colors["Muted"]
        Write-Host "  2. Extract: C:\nssm (or any PATH location)" -ForegroundColor $Colors["Muted"]
        Write-Host "  3. Verify: nssm --version" -ForegroundColor $Colors["Muted"]
        Write-Host "  4. Run this script again" -ForegroundColor $Colors["Muted"]
        Write-Host ""
        exit 1
    }
    Write-Styled "✓ NSSM found at: $($nssm.Source)" "Success"
    Write-Host ""

    # 4. Create Directories
    Write-Styled "Creating installation directories..." "Info"
    $dirs = @($InstallDir, "$InstallDir\data", "$InstallDir\logs", "$InstallDir\uploads")
    foreach ($dir in $dirs) {
        if (Test-Path $dir) {
            Write-Styled "  • $dir (exists)" "Muted"
        } else {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Styled "  • $dir (created)" "Success"
        }
    }
    Write-Host ""

    # 5. Copy Executable
    Write-Styled "Copying files..." "Info"
    $targetExe = "$InstallDir\SysTracker_Server.exe"
    Copy-Item -Path $ExeFile.FullName -Destination $targetExe -Force
    Write-Styled "✓ Copied executable" "Success"
    Write-Host ""

    # 6. Create .env Configuration
    Write-Styled "Setting up configuration..." "Info"
    $envFile = "$InstallDir\.env"
    if (Test-Path $envFile) {
        Write-Styled "  • .env exists (preserving)" "Muted"
    } else {
        $envContent = @"
# SysTracker Server Configuration
# Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

# Server port
PORT=$Port

# Private key for JWT tokens (auto-generated if not provided)
# Generate: [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes('your-secret-here'))
# JWT_SECRET=base64_encoded_secret_min_64_chars

# JWT token expiration time
JWT_EXPIRES_IN=24h

# API Key for Agent communication (CHANGE THIS!)
# Agents must provide this key in X-API-Key header
API_KEY=systracker_please_change_me_to_something_secure

# SMTP Configuration (for email alerts - optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_not_regular_password
SMTP_SECURE=false
SMTP_FROM="SysTracker Alerts" <noreply@systracker.local>

# Database configuration
# Database will be stored in: data/systracker.db
# This is auto-created and managed by the application
"@
        Set-Content -Path $envFile -Value $envContent -Encoding UTF8
        Write-Styled "✓ Created .env" "Success"
        Write-Styled "  Location: $envFile" "Muted"
    }
    Write-Host ""

    # 7. Create Startup Batch Script
    Write-Styled "Creating startup scripts..." "Info"
    $batFile = "$InstallDir\start-server.bat"
    $batContent = @"
@echo off
REM SysTracker Server Startup Script
REM Run this manually to test the server before installing as service

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ╔══════════════════════════════════════════════════╗
echo ║  SysTracker Server Starting...                   ║
echo ╚══════════════════════════════════════════════════╝
echo.

SysTracker_Server.exe

if errorlevel 1 (
    echo.
    echo ERROR: Server failed to start!
    echo Check .env configuration and logs\service-error.log
    pause
)
"@
    Set-Content -Path $batFile -Value $batContent -Encoding ASCII
    Write-Styled "✓ Created startup script" "Success"
    Write-Styled "  Location: $batFile" "Muted"
    Write-Host ""

    # 8. Check Existing Service
    Write-Styled "Checking for existing service..." "Info"
    $existingService = Get-Service SysTracker -ErrorAction SilentlyContinue
    if ($existingService) {
        Write-Styled "⚠ Found existing SysTracker service" "Warning"
        Write-Styled "  Status: $($existingService.Status)" "Muted"
        
        if ($existingService.Status -eq "Running") {
            Write-Styled "  Stopping service..." "Info"
            Stop-Service SysTracker -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
            Write-Styled "  ✓ Service stopped" "Success"
        }
        
        Write-Styled "  Removing old service..." "Info"
        & nssm remove SysTracker confirm 2>$null
        Start-Sleep -Seconds 1
        Write-Styled "  ✓ Service removed" "Success"
    }
    Write-Host ""

    # 9. Install Service
    Write-Styled "Installing Windows Service..." "Info"
    & nssm install SysTracker "$targetExe" ""
    if ($LASTEXITCODE -ne 0) {
        Write-Styled "ERROR: Failed to install service" "Error"
        exit 1
    }
    Write-Styled "✓ Service installed" "Success"
    Write-Host ""

    # 10. Configure Service
    Write-Styled "Configuring service..." "Info"
    
    # Set working directory
    & nssm set SysTracker AppDirectory "$InstallDir" | Out-Null
    Write-Styled "  • Working directory set" "Muted"
    
    # Set environment for UTF-8
    & nssm set SysTracker AppEnvironmentExtra "PYTHONIOENCODING=utf-8" | Out-Null
    
    # Configure output redirection
    & nssm set SysTracker AppStdout "$InstallDir\logs\service.log" | Out-Null
    & nssm set SysTracker AppStderr "$InstallDir\logs\service-error.log" | Out-Null
    Write-Styled "  • Log files configured" "Muted"
    
    # Configure restart behavior
    & nssm set SysTracker AppExit Default Restart | Out-Null
    & nssm set SysTracker AppRestartDelay 5000 | Out-Null  # 5 second delay
    Write-Styled "  • Auto-restart enabled (5s delay)" "Muted"
    
    # Set to auto-start
    & nssm set SysTracker Start SERVICE_AUTO_START | Out-Null
    Write-Styled "  • Auto-start on boot enabled" "Muted"
    
    # Set priority
    & nssm set SysTracker AppPriority HIGH_PRIORITY_CLASS | Out-Null
    
    # Allow service to interact with desktop (not recommended but sometimes needed)
    # & nssm set SysTracker AppInteractive Yes | Out-Null
    
    Write-Host ""

    # 11. Start Service
    if ($StartService) {
        Write-Styled "Starting service..." "Info"
        & nssm start SysTracker | Out-Null
        Start-Sleep -Seconds 3
        
        $status = nssm status SysTracker
        if ($status -match "SERVICE_RUNNING") {
            Write-Styled "✓ Service started successfully" "Success"
        } else {
            Write-Styled "⚠ Service may not have started immediately" "Warning"
            Write-Styled "  Status: $status" "Muted"
        }
    }
    Write-Host ""

    # 12. Summary
    Write-Styled "╔════════════════════════════════════════════╗" "Success"
    Write-Styled "║  Installation Complete!                   ║" "Success"
    Write-Styled "╚════════════════════════════════════════════╝" "Success"
    Write-Host ""

    Write-Styled "Installation Details:" "Info"
    Write-Host "  Service Name: SysTracker" -ForegroundColor $Colors["Muted"]
    Write-Host "  Install Dir: $InstallDir" -ForegroundColor $Colors["Muted"]
    Write-Host "  Port: $Port" -ForegroundColor $Colors["Muted"]
    Write-Host "  Auto-start: Yes" -ForegroundColor $Colors["Muted"]
    Write-Host ""

    Write-Styled "Next Steps:" "Info"
    Write-Styled "1. Configure:" "Muted"
    Write-Host "   Edit $envFile" -ForegroundColor $Colors["Muted"]
    Write-Host "   • Change API_KEY to something secure" -ForegroundColor $Colors["Muted"]
    Write-Host "   • Configure SMTP if needed" -ForegroundColor $Colors["Muted"]
    Write-Host "   • Restart service after changes: Restart-Service SysTracker" -ForegroundColor $Colors["Muted"]
    Write-Host ""

    Write-Styled "2. Access Dashboard:" "Muted"
    Write-Host "   http://localhost:$Port" -ForegroundColor $Colors["Cyan"]
    Write-Host "   http://<your-pc-ip>:$Port (from other machines)" -ForegroundColor $Colors["Cyan"]
    Write-Host ""

    Write-Styled "3. Setup Admin:" "Muted"
    Write-Host "   • Visit /setup to create first admin account" -ForegroundColor $Colors["Muted"]
    Write-Host "   • Configure SMTP in settings for email alerts" -ForegroundColor $Colors["Muted"]
    Write-Host "   • Download agent from Agent Management" -ForegroundColor $Colors["Muted"]
    Write-Host ""

    Write-Styled "Service Management:" "Info"
    Write-Host "  View status: Get-Service SysTracker" -ForegroundColor $Colors["Muted"]
    Write-Host "  Start: Start-Service SysTracker" -ForegroundColor $Colors["Muted"]
    Write-Host "  Stop: Stop-Service SysTracker" -ForegroundColor $Colors["Muted"]
    Write-Host "  Restart: Restart-Service SysTracker" -ForegroundColor $Colors["Muted"]
    Write-Host "  View logs: Get-Content `"$InstallDir\logs\service.log`" -Tail 50" -ForegroundColor $Colors["Muted"]
    Write-Host ""

    Write-Styled "Uninstall:" "Warning"
    Write-Host "  nssm remove SysTracker confirm" -ForegroundColor $Colors["Muted"]
    Write-Host "  Remove-Item `"$InstallDir`" -Recurse" -ForegroundColor $Colors["Muted"]
    Write-Host ""

} catch {
    Write-Styled "ERROR: $($_.Exception.Message)" "Error"
    Write-Styled "Stack trace: $($_.ScriptStackTrace)" "Muted"
    exit 1
}
