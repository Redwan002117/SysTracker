#Requires -RunAsAdministrator
<#
.SYNOPSIS
    SysTracker Server Management Script
    
.DESCRIPTION
    Unified management for SysTracker Windows Service
    
.PARAMETER Action
    start    - Start service
    stop     - Stop service
    restart  - Restart service
    status   - Show service status
    logs     - Show recent logs
    uninstall - Remove service and files
    
.EXAMPLE
    .\manage_service.ps1 -Action start
    .\manage_service.ps1 -Action logs -Lines 50
#>

param(
    [ValidateSet("start", "stop", "restart", "status", "logs", "uninstall")]
    [string]$Action = "status",
    
    [int]$Lines = 20,
    
    [string]$InstallDir = "C:\Program Files\SysTracker Server"
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
}

function Show-Header {
    Write-Host ""
    Write-Styled "╔════════════════════════════════════════════╗" "Info"
    Write-Styled "║  SysTracker Server - Service Manager       ║" "Cyan"
    Write-Styled "╚════════════════════════════════════════════╝" "Info"
    Write-Host ""
}

function Get-ServiceStatus {
    try {
        $svc = Get-Service SysTracker -ErrorAction SilentlyContinue
        if ($svc) {
            return $svc.Status
        } else {
            return "NotFound"
        }
    } catch {
        return "Error"
    }
}

function Action-Start {
    Write-Styled "Starting SysTracker service..." "Info"
    
    $status = Get-ServiceStatus
    if ($status -eq "Running") {
        Write-Styled "✓ Service is already running" "Success"
        Show-ServiceInfo
        return 0
    }
    
    try {
        Start-Service SysTracker -ErrorAction Stop
        Start-Sleep -Seconds 2
        
        if ((Get-ServiceStatus) -eq "Running") {
            Write-Styled "✓ Service started successfully" "Success"
            Write-Host ""
            Show-ServiceInfo
            return 0
        } else {
            Write-Styled "⚠ Service started but may not be running yet" "Warning"
            return 1
        }
    } catch {
        Write-Styled "ERROR: $($_.Exception.Message)" "Error"
        return 1
    }
}

function Action-Stop {
    Write-Styled "Stopping SysTracker service..." "Info"
    
    $status = Get-ServiceStatus
    if ($status -eq "Stopped") {
        Write-Styled "✓ Service is already stopped" "Success"
        return 0
    }
    
    try {
        Stop-Service SysTracker -ErrorAction Stop -Force
        Start-Sleep -Seconds 1
        Write-Styled "✓ Service stopped successfully" "Success"
        return 0
    } catch {
        Write-Styled "ERROR: $($_.Exception.Message)" "Error"
        return 1
    }
}

function Action-Restart {
    Write-Styled "Restarting SysTracker service..." "Info"
    Write-Host ""
    
    Action-Stop | Out-Null
    Start-Sleep -Seconds 2
    Write-Host ""
    Action-Start | Out-Null
}

function Action-Status {
    Show-Header
    Show-ServiceInfo
    Show-SystemInfo
}

function Show-ServiceInfo {
    $svc = Get-Service SysTracker -ErrorAction SilentlyContinue
    if (-not $svc) {
        Write-Styled "Service Status: NOT INSTALLED" "Error"
        return
    }
    
    $statusColor = if ($svc.Status -eq "Running") { "Success" } else { "Warning" }
    Write-Styled "Service Status: " "Muted" $true
    Write-Styled $svc.Status "Cyan"
    
    Write-Styled "Service Start Type: " "Muted" $true
    
    $startType = (Get-Service SysTracker | Select-Object -ExpandProperty StartType)
    Write-Styled "$startType" "Cyan"
    
    Write-Host ""
    Write-Styled "Dashboard: " "Info" $true
    Write-Styled "http://localhost:7777" "Cyan"
    Write-Host ""
}

function Show-SystemInfo {
    Write-Styled "System Information:" "Info"
    
    $processExe = Get-Process | Where-Object { $_.ProcessName -like "*SysTracker*" } | Select-Object -First 1
    if ($processExe) {
        $mem = [Math]::Round($processExe.WorkingSet64 / 1MB, 2)
        Write-Host "  Memory Usage: $mem MB" -ForegroundColor $Colors["Muted"]
    }
    
    $port = 7777
    $portInUse = netstat -ano 2>$null | Select-String ":$port " | Select-Object -First 1
    if ($portInUse) {
        Write-Host "  Port $port: In use (listening)" -ForegroundColor $Colors["Success"]
    } else {
        Write-Host "  Port $port: Not listening" -ForegroundColor $Colors["Warning"]
    }
    
    if (Test-Path "$InstallDir\.env") {
        Write-Host "  Configuration: Present" -ForegroundColor $Colors["Success"]
    }
    
    if (Test-Path "$InstallDir\data\systracker.db") {
        $dbSize = [Math]::Round((Get-Item "$InstallDir\data\systracker.db").Length / 1MB, 2)
        Write-Host "  Database: $dbSize MB" -ForegroundColor $Colors["Muted"]
    }
    
    Write-Host ""
}

function Action-Logs {
    $logFile = "$InstallDir\logs\service.log"
    $errorFile = "$InstallDir\logs\service-error.log"
    
    Write-Host ""
    Write-Styled "Recent Service Output (last $Lines lines):" "Info"
    Write-Host ""
    
    if (Test-Path $logFile) {
        Write-Styled "=== Standard Output ===" "Muted"
        Get-Content $logFile -Tail $Lines | ForEach-Object {
            if ($_ -match "ERROR|error") {
                Write-Styled $_ "Error"
            } elseif ($_ -match "WARNING|warning") {
                Write-Styled $_ "Warning"
            } else {
                Write-Host $_
            }
        }
    } else {
        Write-Styled "No output log yet" "Muted"
    }
    
    Write-Host ""
    Write-Styled "=== Errors ===" "Muted"
    if (Test-Path $errorFile) {
        $errorContent = Get-Content $errorFile -Tail $Lines
        if ($errorContent) {
            Write-Styled $errorContent "Error"
        } else {
            Write-Styled "No errors logged" "Success"
        }
    } else {
        Write-Styled "No error log yet" "Muted"
    }
    
    Write-Host ""
    Write-Host "View full logs:"
    Write-Host "  Standard: $logFile" -ForegroundColor $Colors["Muted"]
    Write-Host "  Errors: $errorFile" -ForegroundColor $Colors["Muted"]
    Write-Host "Real-time: Get-Content `"$logFile`" -Tail 50 -Wait" -ForegroundColor $Colors["Muted"]
    Write-Host ""
}

function Action-Uninstall {
    Show-Header
    Write-Styled "WARNING: This will uninstall SysTracker service and delete all files!" "Warning"
    Write-Host ""
    
    $confirm = Read-Host "Type 'yes' to confirm uninstall"
    if ($confirm -ne "yes") {
        Write-Styled "Uninstall cancelled" "Info"
        return
    }
    
    Write-Host ""
    Write-Styled "Uninstalling..." "Info"
    
    # Stop service
    $status = Get-ServiceStatus
    if ($status -eq "Running") {
        Write-Styled "  Stopping service..." "Muted"
        Stop-Service SysTracker -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
    
    # Remove service
    Write-Styled "  Removing service registration..." "Muted"
    nssm remove SysTracker confirm 2>$null
    Start-Sleep -Seconds 1
    
    # Delete directory
    Write-Styled "  Deleting installation directory..." "Muted"
    if (Test-Path $InstallDir) {
        Remove-Item "$InstallDir" -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    Write-Host ""
    Write-Styled "✓ Uninstall complete" "Success"
}

# ============================================================================
# MAIN
# ============================================================================

try {
    # Check admin
    $principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Styled "ERROR: This script must run as Administrator!" "Error"
        exit 1
    }

    switch ($Action) {
        "start"     { Action-Start }
        "stop"      { Action-Stop }
        "restart"   { Action-Restart }
        "status"    { Action-Status }
        "logs"      { Action-Logs }
        "uninstall" { Action-Uninstall }
        default     { Action-Status }
    }
} catch {
    Write-Styled "ERROR: $($_.Exception.Message)" "Error"
    exit 1
}
