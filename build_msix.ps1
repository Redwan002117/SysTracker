# Build MSIX Package
$ErrorActionPreference = "Stop"

$sourceExe = "SysTracker_Agent.exe"
$buildDir = "agent/msix_build"
$outputPackage = "SysTracker_Agent.msix"

Write-Host "Checking prerequisites..." -ForegroundColor Cyan

# 1. Check for SysTracker_Agent.exe
if (!(Test-Path "agent/$sourceExe")) {
    Write-Error "agent/$sourceExe not found! Please compile the agent first."
    exit 1
}

# 2. Check for MakeAppx
$makeAppx = Get-Command "MakeAppx.exe" -ErrorAction SilentlyContinue
if (!$makeAppx) {
    # Try finding in common SDK paths
    $sdkPaths = @(
        "C:\Program Files (x86)\Windows Kits\10\bin\*\x64\makeappx.exe",
        "C:\Program Files (x86)\Windows Kits\10\bin\*\x86\makeappx.exe"
    )
    foreach ($path in $sdkPaths) {
        $found = Get-Item $path -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $makeAppx = $found.FullName
            break
        }
    }
}

if (!$makeAppx) {
    Write-Warning "MakeAppx.exe not found in PATH or standard locations."
    Write-Warning "Please install the Windows 10/11 SDK or add MakeAppx to your PATH."
    Write-Warning "You can manually package the 'agent/msix_build' folder using the MSIX Packaging Tool."
    # We continue setup but skip final pack
    $canPack = $false
}
else {
    $canPack = $true
    Write-Host "Found MakeAppx: $makeAppx" -ForegroundColor Green
}

# 3. Prepare Build Directory
Write-Host "Preparing content..." -ForegroundColor Cyan
Copy-Item "agent/$sourceExe" "$buildDir/$sourceExe" -Force
Copy-Item "agent/client_agent.py" "$buildDir/client_agent.py" -Force 
# Note: Usually we only include the EXE if it's standalone. If standalone, we don't need .py.
# Assuming SysTracker_Agent.exe IS standalone (PyInstaller).

# 4. Generate Assets
Write-Host "Generating placeholder assets..." -ForegroundColor Cyan
./agent/generate_assets.ps1

# 5. Pack
if ($canPack) {
    Write-Host "Creating MSIX package..." -ForegroundColor Cyan
    try {
        & $makeAppx pack /d "$buildDir" /p "$outputPackage" /o
        Write-Host "Success! Package created at $outputPackage" -ForegroundColor Green
    }
    catch {
        Write-Error "Failed to create package: $_"
    }
}
else {
    Write-Host "Layout prepared at '$buildDir'." -ForegroundColor Yellow
    Write-Host "Please use MakeAppx or MSIX Packaging Tool to pack this folder." -ForegroundColor Yellow
}
