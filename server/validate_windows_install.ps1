#Requires -RunAsAdministrator
<#
.SYNOPSIS
    SysTracker Windows Installation Validation Test
    
.DESCRIPTION
    Comprehensive test suite to verify Windows deployment is working correctly
    
.PARAMETER ServiceName
    Name of the service (default: SysTracker)
    
.PARAMETER Port
    Server port (default: 7777)
    
.PARAMETER InstallDir
    Installation directory (default: C:\Program Files\SysTracker Server)
    
.EXAMPLE
    .\validate_windows_install.ps1
    .\validate_windows_install.ps1 -Port 8080
#>

param(
    [string]$ServiceName = "SysTracker",
    [int]$Port = 7777,
    [string]$InstallDir = "C:\Program Files\SysTracker Server"
)

$Colors = @{
    Success = [System.ConsoleColor]::Green
    Error   = [System.ConsoleColor]::Red
    Warning = [System.ConsoleColor]::Yellow
    Info    = [System.ConsoleColor]::Cyan
    Muted   = [System.ConsoleColor]::Gray
}

function Write-Test {
    param($Message, $Result, $Details = "")
    $statusColor = if ($Result) { "Success" } else { "Error" }
    $statusText = if ($Result) { "✓ PASS" } else { "✗ FAIL" }
    Write-Host "  $statusText  " -ForegroundColor $Colors[$statusColor] -NoNewline
    Write-Host $Message
    if ($Details) {
        Write-Host "         $Details" -ForegroundColor $Colors["Muted"]
    }
    return $Result
}

function Test-AdminPrivilege {
    Write-Host ""
    Write-Host "1. ADMIN PRIVILEGES" -ForegroundColor $Colors["Info"]
    $principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return Write-Test "Running as Administrator" $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Test-ServiceExists {
    Write-Host ""
    Write-Host "2. SERVICE REGISTRATION" -ForegroundColor $Colors["Info"]
    $svc = Get-Service $ServiceName -ErrorAction SilentlyContinue
    $exists = $null -ne $svc
    Write-Test "Service '$ServiceName' registered" $exists
    return $exists
}

function Test-ServiceRunning {
    Write-Host ""
    Write-Host "3. SERVICE STATUS" -ForegroundColor $Colors["Info"]
    $svc = Get-Service $ServiceName -ErrorAction SilentlyContinue
    $running = $svc.Status -eq "Running"
    Write-Test "Service is running" $running "Status: $($svc.Status)"
    return $running
}

function Test-ServiceAutoStart {
    Write-Host ""
    Write-Host "4. AUTOSTART CONFIGURATION" -ForegroundColor $Colors["Info"]
    $svc = Get-Service $ServiceName -ErrorAction SilentlyContinue
    $autoStart = $svc.StartType -eq "Automatic"
    Write-Test "Service set to auto-start" $autoStart "StartType: $($svc.StartType)"
    return $autoStart
}

function Test-PortListening {
    Write-Host ""
    Write-Host "5. PORT LISTENING" -ForegroundColor $Colors["Info"]
    $listening = $false
    try {
        $connections = netstat -ano 2>$null | Select-String ":$Port " | Select-Object -First 1
        $listening = $null -ne $connections
    } catch { }
    Write-Test "Port $Port listening" $listening
    return $listening
}

function Test-DashboardAccess {
    Write-Host ""
    Write-Host "6. DASHBOARD CONNECTIVITY" -ForegroundColor $Colors["Info"]
    $accessible = $false
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
        $accessible = $response.StatusCode -eq 200
        if ($accessible) {
            Write-Test "Dashboard loads successfully" $true "Response: $($response.StatusCode)"
        } else {
            Write-Test "Dashboard loads successfully" $false "Response: $($response.StatusCode)"
        }
    } catch {
        Write-Test "Dashboard loads successfully" $false "Error: $($_.Exception.Message)"
    }
    return $accessible
}

function Test-APIHealth {
    Write-Host ""
    Write-Host "7. API HEALTH CHECK" -ForegroundColor $Colors["Info"]
    $healthy = $false
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port/api/auth/status" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
        $healthy = $response.StatusCode -eq 200
        if ($healthy) {
            Write-Test "API responding" $true "Endpoint: /api/auth/status"
        } else {
            Write-Test "API responding" $false "HTTP $($response.StatusCode)"
        }
    } catch {
        Write-Test "API responding" $false "Error: $($_.Exception.Message)"
    }
    return $healthy
}

function Test-DirectoryStructure {
    Write-Host ""
    Write-Host "8. DIRECTORY STRUCTURE" -ForegroundColor $Colors["Info"]
    
    $allExist = $true
    $dirs = @("data", "logs", "uploads")
    
    foreach ($dir in $dirs) {
        $path = "$InstallDir\$dir"
        $exists = Test-Path $path
        Write-Test "Directory exists: $dir" $exists "Path: $path"
        $allExist = $allExist -and $exists
    }
    
    return $allExist
}

function Test-ExecutableExists {
    Write-Host ""
    Write-Host "9. APPLICATION FILES" -ForegroundColor $Colors["Info"]
    
    $exePath = "$InstallDir\SysTracker_Server.exe"
    $exeExists = Test-Path $exePath
    Write-Test "Executable file exists" $exeExists "Path: $exePath"
    
    if ($exeExists) {
        $size = (Get-Item $exePath).Length / 1MB
        Write-Host "         Size: $([Math]::Round($size, 2)) MB" -ForegroundColor $Colors["Muted"]
    }
    
    return $exeExists
}

function Test-ConfigurationFile {
    Write-Host ""
    Write-Host "10. CONFIGURATION" -ForegroundColor $Colors["Info"]
    
    $envPath = "$InstallDir\.env"
    $envExists = Test-Path $envPath
    Write-Test "Configuration file (.env) exists" $envExists
    
    if ($envExists) {
        $content = Get-Content $envPath -Raw
        $hasPort = $content -match "PORT\s*=\s*$Port"
        Write-Test "PORT setting correct" $hasPort
        
        $hasApiKey = $content -match "API_KEY\s*="
        Write-Test "API_KEY configured" $hasApiKey
    }
    
    return $envExists
}

function Test-Database {
    Write-Host ""
    Write-Host "11. DATABASE" -ForegroundColor $Colors["Info"]
    
    $dbPath = "$InstallDir\data\systracker.db"
    $dbExists = Test-Path $dbPath
    Write-Test "Database file exists" $dbExists
    
    if ($dbExists) {
        $size = (Get-Item $dbPath).Length / 1MB
        $sizeMB = [Math]::Round($size, 2)
        Write-Test "Database has data" ($size -gt 0) "Size: $sizeMB MB"
    }
    
    return $dbExists
}

function Test-Logs {
    Write-Host ""
    Write-Host "12. LOGS" -ForegroundColor $Colors["Info"]
    
    $logPath = "$InstallDir\logs\service.log"
    $logExists = Test-Path $logPath
    Write-Test "Service log file exists" $logExists
    
    if ($logExists) {
        $recent = Get-Content $logPath -Tail 1 -ErrorAction SilentlyContinue
        if ($recent) {
            Write-Test "Log file has entries" $true "Recent: $(if ($recent.Length -gt 50) { $recent.Substring(0, 50) + '...' } else { $recent })"
        }
    }
    
    return $logExists
}

function Test-Memory {
    Write-Host ""
    Write-Host "13. MEMORY USAGE" -ForegroundColor $Colors["Info"]
    
    $process = Get-Process | Where-Object { $_.ProcessName -like "*SysTracker*" -or $_.ProcessName -eq "node" } | Select-Object -First 1
    
    if ($process) {
        $memMB = [Math]::Round($process.WorkingSet64 / 1MB, 2)
        $reasonable = $memMB -lt 1000  # Less than 1GB is reasonable
        Write-Test "Memory usage reasonable" $reasonable "Usage: $memMB MB"
        return $true
    } else {
        Write-Test "Server process found" $false
        return $false
    }
}

function Test-Connectivity {
    Write-Host ""
    Write-Host "14. NETWORK CONNECTIVITY" -ForegroundColor $Colors["Info"]
    
    $canConnect = $false
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect("127.0.0.1", $Port)
        $canConnect = $tcpClient.Connected
        $tcpClient.Close()
    } catch { }
    
    Write-Test "Can connect to port $Port" $canConnect
    return $canConnect
}

function Show-Summary {
    param($Results)
    
    Write-Host ""
    Write-Host "═════════════════════════════════════════" -ForegroundColor $Colors["Info"]
    Write-Host "VALIDATION SUMMARY" -ForegroundColor $Colors["Info"]
    Write-Host "═════════════════════════════════════════" -ForegroundColor $Colors["Info"]
    
    $passed = ($Results | Where-Object { $_ }).Count
    $total = $Results.Count
    $percentage = [Math]::Round(($passed / $total) * 100)
    
    Write-Host "Passed: $passed / $total tests ($percentage%)" -ForegroundColor $(if ($percentage -eq 100) { "Green" } else { "Yellow" })
    
    if ($percentage -eq 100) {
        Write-Host ""
        Write-Host "✓ ALL TESTS PASSED - Installation is working correctly!" -ForegroundColor $Colors["Success"]
    } elseif ($percentage -ge 80) {
        Write-Host ""
        Write-Host "⚠ MOST TESTS PASSED - Installation working with minor issues" -ForegroundColor $Colors["Warning"]
    } else {
        Write-Host ""
        Write-Host "✗ TESTS FAILED - Installation has problems" -ForegroundColor $Colors["Error"]
    }
    
    Write-Host ""
}

# ============================================================================
# MAIN
# ============================================================================

Write-Host ""
Write-Host "╔═════════════════════════════════════════╗" -ForegroundColor $Colors["Info"]
Write-Host "║  SysTracker - Installation Validation   ║" -ForegroundColor $Colors["Info"]
Write-Host "╚═════════════════════════════════════════╝" -ForegroundColor $Colors["Info"]
Write-Host "Service: $ServiceName" -ForegroundColor $Colors["Muted"]
Write-Host "Port: $Port" -ForegroundColor $Colors["Muted"]
Write-Host "Location: $InstallDir" -ForegroundColor $Colors["Muted"]

$results = @()

$results += Test-AdminPrivilege
$results += Test-ServiceExists
$results += Test-ServiceRunning
$results += Test-ServiceAutoStart
$results += Test-PortListening
$results += Test-DashboardAccess
$results += Test-APIHealth
$results += Test-DirectoryStructure
$results += Test-ExecutableExists
$results += Test-ConfigurationFile
$results += Test-Database
$results += Test-Logs
$results += Test-Memory
$results += Test-Connectivity

Show-Summary $results

Write-Host "Next Steps:" -ForegroundColor $Colors["Info"]
Write-Host "  1. Open browser: http://localhost:$Port" -ForegroundColor $Colors["Muted"]
Write-Host "  2. Create admin account in Setup wizard" -ForegroundColor $Colors["Muted"]
Write-Host "  3. Configure API key in Settings" -ForegroundColor $Colors["Muted"]
Write-Host "  4. Download and install agent on test machine" -ForegroundColor $Colors["Muted"]
Write-Host ""

if (($results | Where-Object { $_ }).Count -eq $results.Count) {
    exit 0
} else {
    exit 1
}
