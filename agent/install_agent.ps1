# SysTracker Agent Installer
# Usage: .\install_agent.ps1 -ServerURL "http://192.168.1.100:3001"

param (
    [string]$ServerURL = "http://localhost:3001"
)

$InstallDir = "C:\Program Files\SysTrackerAgent"
$NodeURL = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi" # Example Node.js URL (User might need to provide Node or we bundle it)
# For simplicity, assuming Node.js is installed or we use 'pkg' to bundle it later.
# This script assumes Node.js is available or we are just copying the script.

Write-Host "Installing SysTracker Agent..." -ForegroundColor Cyan

# 1. Create Directory
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
    Write-Host "Created $InstallDir"
}

# 2. Copy Files (In real scenario, download them)
# For now, we assume this script is run from the source folder or we download from the server.
# Let's assume we download `client_agent.js` and `package.json` from the Server.

try {
    Invoke-WebRequest -Uri "$ServerURL/agent/client_agent.js" -OutFile "$InstallDir\client_agent.js"
    # Invoke-WebRequest -Uri "$ServerURL/agent/package.json" -OutFile "$InstallDir\package.json"
} catch {
    Write-Warning "Could not download agent files from $ServerURL. Ensure server is running and files are served."
    # Fallback for local testing
    Copy-Item ".\client_agent.js" "$InstallDir\client_agent.js" -ErrorAction SilentlyContinue
}

# 3. Create Config
$Config = @{
    SERVER_URL = $ServerURL
}
$Config | ConvertTo-Json | Out-File "$InstallDir\agent_config.json"
Write-Host "Configured Agent to point to $ServerURL"

# 4. Install Dependencies (needs Node.js)
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "Node.js detected. Installing dependencies..."
    Set-Location $InstallDir
    # Simple install for now, or just rely on global/bundled modules if packed
    # npm install systeminformation axios 
} else {
    Write-Warning "Node.js not found. Please install Node.js or use the standalone executable version."
}

# 5. Setup Persistence (Scheduled Task or Service)
# Using Scheduled Task for simplicity as it doesn't require NSSM
$Trigger = New-ScheduledTaskTrigger -AtStartup
$User = "SYSTEM"
$Action = New-ScheduledTaskAction -Execute "node" -Argument "$InstallDir\client_agent.js"
Register-ScheduledTask -TaskName "SysTrackerAgent" -Trigger $Trigger -User $User -Action $Action -Force

Write-Host "Installation Complete! Agent will start on next boot or you can run it manually." -ForegroundColor Green
Start-ScheduledTask -TaskName "SysTrackerAgent"
