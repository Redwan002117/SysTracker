# SysTracker Agent Installer (v2.4)
# Usage: .\install_agent.ps1 -ServerURL "http://192.168.1.100:7777"

param (
    [string]$ServerURL = "http://localhost:7777"
)

$InstallDir = "C:\Program Files\SysTrackerAgent"
$AgentExe = "SysTracker_Agent.exe"

Write-Host "Installing SysTracker Agent (v2.4 Silent Mode)..." -ForegroundColor Cyan

# 1. Create Directory
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
    Write-Host "Created $InstallDir"
}

# 2. Download Agent Executable
# Try to download from Server/release or use local file if present
try {
    Write-Host "Downloading Agent from $ServerURL..."
    # Attempt to download from server (requires server to serve static files from release folder, which it might not yet)
    # Fallback to local copy for now if script is run from release folder
    Copy-Item ".\$AgentExe" "$InstallDir\$AgentExe" -ErrorAction Stop
    Write-Host "Copied $AgentExe to installation directory."
}
catch {
    Write-Warning "Could not copy $AgentExe. Ensure you are running this script next to the executable."
    exit
}

# 3. Create Config
$Config = @{
    api_url = "$ServerURL/api"
    api_key = "YOUR_STATIC_API_KEY_HERE" # User should replace this or we pass it as arg
}
$Config | ConvertTo-Json | Out-File "$InstallDir\config.json"
Write-Host "Configured Agent to point to $ServerURL"

# 4. Cleanup Old Task
Unregister-ScheduledTask -TaskName "SysTrackerAgent" -Confirm:$false -ErrorAction SilentlyContinue

# 5. Register Silent System Task
# Runs as SYSTEM, hidden, on startup
$Trigger = New-ScheduledTaskTrigger -AtStartup
$User = "SYSTEM"
$Action = New-ScheduledTaskAction -Execute "$InstallDir\$AgentExe"
Register-ScheduledTask -TaskName "SysTrackerAgent" -Trigger $Trigger -User $User -Action $Action -Force -Description "SysTracker System Monitoring Agent"

# 6. Start the Agent
Write-Host "Starting Agent..."
Start-ScheduledTask -TaskName "SysTrackerAgent"
Write-Host "Installation Complete! Agent is running in the background." -ForegroundColor Green
Write-Host "To stop the agent, run: & '$InstallDir\$AgentExe' --kill" -ForegroundColor Yellow
