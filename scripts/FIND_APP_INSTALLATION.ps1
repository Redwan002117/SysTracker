# SysTracker Agent - Find Installation Locations
# This script helps locate where SysTracker Agent is installed on the system

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "SysTracker Agent Installation Locator" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$found = $false
$locations = @()

Write-Host "Searching for SysTracker Agent installations..." -ForegroundColor Yellow
Write-Host ""

# 1. Check Standard Installation Directory
Write-Host "[1] Checking Standard Installation Directory..." -ForegroundColor Gray
$standardPath = "C:\Program Files\SysTracker Agent"
if (Test-Path $standardPath) {
    Write-Host "✓ FOUND: $standardPath" -ForegroundColor Green
    $locations += @{Path = $standardPath; Type = "Standard Installation" }
    $found = $true
    
    # List files in the directory
    Get-ChildItem $standardPath | ForEach-Object { Write-Host "  - $_" }
    Write-Host ""
}
else {
    Write-Host "✗ NOT FOUND: $standardPath" -ForegroundColor Red
}

# 2. Check Legacy Installation Directory (without space)
Write-Host "[2] Checking Legacy Installation Directory (no space)..." -ForegroundColor Gray
$legacyPath = "C:\Program Files\SysTrackerAgent"
if (Test-Path $legacyPath) {
    Write-Host "✓ FOUND: $legacyPath" -ForegroundColor Green
    $locations += @{Path = $legacyPath; Type = "Legacy Installation" }
    $found = $true
    
    # List files in the directory
    Get-ChildItem $legacyPath | ForEach-Object { Write-Host "  - $_" }
    Write-Host ""
}
else {
    Write-Host "✗ NOT FOUND: $legacyPath" -ForegroundColor Red
}

# 3. Check MSIX Installation Directory (only if MSIX was used)
Write-Host "[3] Checking MSIX Package Installation..." -ForegroundColor Gray
$msixPath = "C:\Program Files\WindowsApps\Redwan002117.SysTrackerAgent_*"
$msixInstalls = Get-ChildItem "C:\Program Files\WindowsApps" -Filter "Redwan002117.SysTrackerAgent_*" -ErrorAction SilentlyContinue
if ($msixInstalls.Count -gt 0) {
    Write-Host "✓ FOUND MSIX Installation(s):" -ForegroundColor Green
    foreach ($install in $msixInstalls) {
        Write-Host "  - $($install.FullPath)" -ForegroundColor Green
        $locations += @{Path = $install.FullPath; Type = "MSIX Installation" }
        $found = $true
        
        # List main executable
        if (Test-Path "$($install.FullPath)\SysTracker_Agent.exe") {
            Write-Host "    ✓ SysTracker_Agent.exe found" -ForegroundColor Cyan
        }
    }
    Write-Host ""
}
else {
    Write-Host "✗ NO MSIX installations found" -ForegroundColor Red
}

# 4. Check AppData (portable or user-level installations)
Write-Host "[4] Checking AppData Locations..." -ForegroundColor Gray
$appDataPaths = @(
    "$env:APPDATA\SysTracker",
    "$env:LOCALAPPDATA\SysTracker",
    "$env:PROGRAMDATA\SysTracker"
)

foreach ($path in $appDataPaths) {
    if (Test-Path $path) {
        Write-Host "✓ FOUND: $path" -ForegroundColor Green
        $locations += @{Path = $path; Type = "AppData Installation" }
        $found = $true
        Get-ChildItem $path | ForEach-Object { Write-Host "  - $_" }
        Write-Host ""
    }
}

# 5. Check Scheduled Tasks
Write-Host "[5] Checking Scheduled Tasks..." -ForegroundColor Gray
$task = Get-ScheduledTask -TaskName "SysTrackerAgent" -ErrorAction SilentlyContinue
if ($task) {
    Write-Host "✓ FOUND Scheduled Task: 'SysTrackerAgent'" -ForegroundColor Green
    $action = $task.Actions[0]
    if ($action) {
        Write-Host "  Task Path: $($action.Execute)" -ForegroundColor Cyan
    }
    Write-Host ""
}
else {
    Write-Host "✗ NO Scheduled Task found" -ForegroundColor Red
}

# 6. Check Services
Write-Host "[6] Checking Windows Services..." -ForegroundColor Gray
$service = Get-Service -Name "*SysTracker*" -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "✓ FOUND Service: $($service.Name)" -ForegroundColor Green
    Write-Host "  Status: $($service.Status)" -ForegroundColor Cyan
    Write-Host ""
}
else {
    Write-Host "✗ NO SysTracker service found" -ForegroundColor Red
}

# 7. Check Running Processes
Write-Host "[7] Checking Running Processes..." -ForegroundColor Gray
$process = Get-Process -Name "SysTracker_Agent" -ErrorAction SilentlyContinue
if ($process) {
    Write-Host "✓ FOUND Running Process: 'SysTracker_Agent'" -ForegroundColor Green
    Write-Host "  Process ID: $($process.Id)" -ForegroundColor Cyan
    Write-Host "  Memory: $([math]::Round($process.WorkingSet / 1MB, 2)) MB" -ForegroundColor Cyan
    Write-Host ""
}
else {
    Write-Host "✗ NO running SysTracker_Agent process" -ForegroundColor Red
}

# 8. Global Search (slower - only if not found elsewhere)
if (-not $found) {
    Write-Host "[8] Performing Global Drive Search (this may take a moment)..." -ForegroundColor Yellow
    try {
        $results = Get-ChildItem -Path "C:\" -Filter "SysTracker_Agent.exe" -Recurse -ErrorAction SilentlyContinue -Force | Select-Object -First 10
        if ($results) {
            Write-Host "✓ FOUND via global search:" -ForegroundColor Green
            foreach ($result in $results) {
                Write-Host "  - $($result.FullName)" -ForegroundColor Green
                $locations += @{Path = $result.Directory.FullName; Type = "Global Search Result" }
                $found = $true
            }
        }
        else {
            Write-Host "✗ No results from global search" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "⚠ Global search encountered errors: $_" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan

# Summary
if ($found) {
    Write-Host "SUMMARY: Found $($locations.Count) installation(s):" -ForegroundColor Green
    Write-Host ""
    for ($i = 0; $i -lt $locations.Count; $i++) {
        Write-Host "[$($i+1)] $($locations[$i].Type)" -ForegroundColor Cyan
        Write-Host "     Path: $($locations[$i].Path)" -ForegroundColor White
        Write-Host ""
    }
}
else {
    Write-Host "⚠ WARNING: SysTracker Agent installation NOT FOUND!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible reasons:" -ForegroundColor Yellow
    Write-Host "1. The application was never installed" -ForegroundColor Gray
    Write-Host "2. The installation was removed" -ForegroundColor Gray
    Write-Host "3. The application crashed during installation" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To fix this, reinstall using one of these scripts:" -ForegroundColor Yellow
    Write-Host "• install_agent.ps1       (Standard Installation)" -ForegroundColor Cyan
    Write-Host "• legacy/install.ps1      (Alternative Method)" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "=====================================" -ForegroundColor Cyan
