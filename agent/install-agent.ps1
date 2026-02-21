# SysTracker Agent Installation Script
# This PowerShell script installs SysTracker Agent as a Windows background service

param(
    [string]$InstallPath = "$env:ProgramFiles\SysTracker\Agent",
    [string]$ServerURL = "http://localhost:3000",
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
Write-Host "║     SysTracker Agent Installation Script  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Installation Path: $InstallPath" -ForegroundColor Yellow
Write-Host "🌐 Server URL: $ServerURL" -ForegroundColor Yellow

# Create installation directory
Write-Host "📁 Creating installation directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null

# Copy application files
Write-Host "📋 Copying application files..." -ForegroundColor Yellow
$scriptDir = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "dist"

# Copy EXE and resources
$filesToCopy = @(
    "systracker-agent-win.exe",
    "app.ico",
    "logo.ico"
)

foreach ($file in $filesToCopy) {
    $source = Join-Path $scriptDir $file
    if (Test-Path $source) {
        Copy-Item $source -Destination $InstallPath -Force
        Write-Host "  ✓ Copied $file" -ForegroundColor Green
    }
}

# Create configuration file
Write-Host "⚙️  Creating configuration file..." -ForegroundColor Yellow

$configContent = @{
    serverURL = $ServerURL
    machineId = (Get-Random).ToString()
    enabled = $true
    version = "3.1.0"
} | ConvertTo-Json

Set-Content -Path (Join-Path $InstallPath "agent_config.json") -Value $configContent -Encoding UTF8
Write-Host "  ✓ Configuration created" -ForegroundColor Green

# Create desktop shortcut
if (-not $NoShortcuts) {
    Write-Host "🔗 Creating desktop shortcut..." -ForegroundColor Yellow
    
    $shell = New-Object -ComObject WScript.Shell
    $desktop = [System.Environment]::GetFolderPath('Desktop')
    $shortcutPath = Join-Path $desktop "SysTracker Agent.lnk"
    
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = Join-Path $InstallPath "launch-agent.bat"
    $shortcut.WorkingDirectory = $InstallPath
    $shortcut.IconLocation = Join-Path $InstallPath "logo.ico"
    $shortcut.Description = "SysTracker System Monitoring Agent"
    $shortcut.Save()
    
    Write-Host "  ✓ Desktop shortcut created" -ForegroundColor Green
}

# Create Start Menu shortcut
Write-Host "📌 Creating Start Menu entry..." -ForegroundColor Yellow

$startMenu = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\SysTracker"
New-Item -ItemType Directory -Path $startMenu -Force | Out-Null

$startMenuShortcut = $shell.CreateShortcut((Join-Path $startMenu "Agent.lnk"))
$startMenuShortcut.TargetPath = Join-Path $InstallPath "launch-agent.bat"
$startMenuShortcut.WorkingDirectory = $InstallPath
$startMenuShortcut.IconLocation = Join-Path $InstallPath "logo.ico"
$startMenuShortcut.Description = "SysTracker System Monitoring Agent"
$startMenuShortcut.Save()

Write-Host "  ✓ Start Menu entry created" -ForegroundColor Green

# Create registry entries for application
Write-Host "📝 Registering application..." -ForegroundColor Yellow

$regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\SysTracker-Agent"
New-Item -Path $regPath -Force | Out-Null

Set-ItemProperty -Path $regPath -Name "DisplayName" -Value "SysTracker Agent"
Set-ItemProperty -Path $regPath -Name "DisplayVersion" -Value "3.1.0"
Set-ItemProperty -Path $regPath -Name "Publisher" -Value "SysTracker Project"
Set-ItemProperty -Path $regPath -Name "InstallLocation" -Value $InstallPath
Set-ItemProperty -Path $regPath -Name "DisplayIcon" -Value (Join-Path $InstallPath "logo.ico")

Write-Host "  ✓ Application registered" -ForegroundColor Green

# Set up automatic startup (optional)
Write-Host ""
Write-Host "🚀 Optional: Set up automatic startup..." -ForegroundColor Yellow

$startupCreate = Read-Host "Create Windows Task to auto-start agent on boot? (y/n)"

if ($startupCreate -eq 'y' -or $startupCreate -eq 'Y') {
    $taskName = "SysTrackerAgent"
    $taskPath = "SysTracker\"
    
    # Remove existing task if it exists
    Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue | Unregister-ScheduledTask -Confirm:$false
    
    $action = New-ScheduledTaskAction -Execute (Join-Path $InstallPath "launch-agent.bat")
    $trigger = New-ScheduledTaskTrigger -AtStartup -RandomDelay 00:00:30
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    
    Register-ScheduledTask -Action $action -Trigger $trigger -Settings $settings `
        -TaskName $taskName -TaskPath $taskPath -Description "SysTracker Agent - System Monitoring" -Force | Out-Null
    
    Write-Host "  ✓ Startup task created" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║      Installation Completed ✓            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Application Location: $InstallPath" -ForegroundColor Cyan
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Double-click the desktop shortcut or Start Menu entry to run the agent" -ForegroundColor White
Write-Host "   2. The agent will run in the background, monitoring system metrics" -ForegroundColor White
Write-Host "   3. Data will be sent to the server at: $ServerURL" -ForegroundColor White
Write-Host ""
Write-Host "📊 View Your System Stats:" -ForegroundColor Yellow
Write-Host "   Open $ServerURL in your browser to see monitored data" -ForegroundColor White
Write-Host ""
