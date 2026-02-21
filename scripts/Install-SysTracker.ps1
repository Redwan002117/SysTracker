#Requires -RunAsAdministrator
<#
.SYNOPSIS
    SysTracker Installer — interactive menu for installing, updating, and
    removing SysTracker Server and/or Agent on Windows.

.DESCRIPTION
    Run via PowerShell one-liner (recommended):
        irm https://systracker.rico.bd/install | iex

    Or download and call directly for scripted / unattended installs:
        .\Install-SysTracker.ps1 -Component Server
        .\Install-SysTracker.ps1 -Component Agent
        .\Install-SysTracker.ps1 -Component Both
        .\Install-SysTracker.ps1 -Action Uninstall -Component Server

.PARAMETER Component
    Target component: Agent | Server | Both   (default: interactive menu)

.PARAMETER Action
    Install | Uninstall                        (default: Install)

.PARAMETER Tag
    GitHub release tag to download from       (default: latest)

.PARAMETER Unattended
    Skip all prompts and run silently. Requires -Component to be set.
#>
param(
    [ValidateSet('Agent','Server','Both','')]
    [string]$Component = '',

    [ValidateSet('Install','Uninstall')]
    [string]$Action = 'Install',

    [string]$Tag = 'latest',

    [switch]$Unattended
)

$ErrorActionPreference = 'Stop'
$ProgressPreference    = 'SilentlyContinue'

# ──────────────────────────────────────────────────────────────
#  CONSTANTS
# ──────────────────────────────────────────────────────────────
$Repo    = 'Redwan002117/SysTracker'
$BaseUrl = if ($Tag -eq 'latest') {
    "https://github.com/$Repo/releases/latest/download"
} else {
    "https://github.com/$Repo/releases/download/$Tag"
}
$ApiUrl  = "https://api.github.com/repos/$Repo/releases/latest"
$WebUrl  = 'https://systracker.rico.bd/'
$WikiUrl = 'https://github.com/Redwan002117/SysTracker/wiki'
$Files   = @{
    Agent  = 'SysTracker-Agent-Setup.exe'
    Server = 'SysTracker-Server-Setup.exe'
}
$UninstallKeys = @{
    Server = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerServer'
    Agent  = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerAgent'
}

# ──────────────────────────────────────────────────────────────
#  HELPERS
# ──────────────────────────────────────────────────────────────
function Write-Header {
    Clear-Host
    $w = $Host.UI.RawUI.WindowSize.Width
    if ($w -lt 60) { $w = 80 }
    $line = '─' * ($w - 2)
    Write-Host ""
    Write-Host "  $line" -ForegroundColor DarkCyan
    Write-Host "" 
    Write-Host "        ███████╗██╗   ██╗███████╗████████╗██████╗  █████╗  ██████╗██╗  ██╗███████╗██████╗ " -ForegroundColor Cyan
    Write-Host "        ██╔════╝╚██╗ ██╔╝██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██╔════╝██╔══██╗" -ForegroundColor Cyan
    Write-Host "        ███████╗ ╚████╔╝ ███████╗   ██║   ██████╔╝███████║██║     █████╔╝ █████╗  ██████╔╝" -ForegroundColor Cyan
    Write-Host "        ╚════██║  ╚██╔╝  ╚════██║   ██║   ██╔══██╗██╔══██║██║     ██╔═██╗ ██╔══╝  ██╔══██╗" -ForegroundColor Cyan
    Write-Host "        ███████║   ██║   ███████║   ██║   ██║  ██║██║  ██║╚██████╗██║  ██╗███████╗██║  ██║" -ForegroundColor Cyan
    Write-Host "        ╚══════╝   ╚═╝   ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "        System Monitoring Dashboard  •  RedwanCodes  •  $WebUrl" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  $line" -ForegroundColor DarkCyan
    Write-Host ""
}

function Write-Status {
    param([string]$Label, [string]$Status, [System.ConsoleColor]$Color = 'Green')
    Write-Host "  $Label" -NoNewline -ForegroundColor DarkGray
    Write-Host " $Status" -ForegroundColor $Color
}

function Get-InstalledVersion {
    param([string]$Component)
    try {
        $key = $UninstallKeys[$Component]
        if (Test-Path $key) {
            return (Get-ItemProperty $key).DisplayVersion
        }
    } catch {}
    return $null
}

function Get-LatestRelease {
    try {
        $rel = Invoke-RestMethod -Uri $ApiUrl -UseBasicParsing -TimeoutSec 8
        return $rel.tag_name -replace '^v',''
    } catch {
        return $null
    }
}

function Show-InstalledStatus {
    $serverVer = Get-InstalledVersion 'Server'
    $agentVer  = Get-InstalledVersion 'Agent'
    Write-Host "  Installed:" -ForegroundColor DarkGray
    if ($serverVer) {
        Write-Status "    Server  " "v$serverVer (installed)" Green
    } else {
        Write-Status "    Server  " "not installed" DarkGray
    }
    if ($agentVer) {
        Write-Status "    Agent   " "v$agentVer (installed)" Green
    } else {
        Write-Status "    Agent   " "not installed" DarkGray
    }
    Write-Host ""
}

function Download-AndInstall {
    param([string]$Name, [string]$FileName, [string]$SilentArgs = '')

    $dest = Join-Path $env:TEMP $FileName
    $url  = "$BaseUrl/$FileName"

    Write-Host ""
    Write-Host "  ► Downloading $Name installer..." -ForegroundColor Cyan
    Write-Host "    $url" -ForegroundColor DarkGray
    try {
        Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
    } catch {
        Write-Host "  ✗ Download failed: $_" -ForegroundColor Red
        return $false
    }

    Write-Host "  ► Removing Mark-of-the-Web..." -ForegroundColor Yellow
    Unblock-File -Path $dest

    if ($Unattended -or $SilentArgs) {
        Write-Host "  ► Installing silently..." -ForegroundColor Green
        $proc = Start-Process -FilePath $dest -ArgumentList '/S' -Wait -PassThru
        if ($proc.ExitCode -ne 0) {
            Write-Host "  ✗ Installer exited with code $($proc.ExitCode)" -ForegroundColor Red
            Remove-Item $dest -Force -ErrorAction SilentlyContinue
            return $false
        }
    } else {
        Write-Host "  ► Launching installer wizard..." -ForegroundColor Green
        Start-Process -FilePath $dest -Wait
    }

    Remove-Item $dest -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ $Name installed successfully." -ForegroundColor Green
    return $true
}

function Uninstall-Component {
    param([string]$Name)
    $key = $UninstallKeys[$Name]
    if (-not (Test-Path $key)) {
        Write-Host "  ✗ $Name is not installed." -ForegroundColor Yellow
        return
    }
    $uninstStr = (Get-ItemProperty $key).UninstallString
    if (-not $uninstStr) {
        Write-Host "  ✗ Could not find uninstall entry for $Name." -ForegroundColor Red
        return
    }
    Write-Host "  ► Uninstalling $Name..." -ForegroundColor Cyan
    Write-Host "    $uninstStr" -ForegroundColor DarkGray
    Start-Process -FilePath $uninstStr -Wait
    Write-Host "  ✓ $Name uninstalled." -ForegroundColor Green
}

function Pause-Menu {
    Write-Host ""
    Write-Host "  Press any key to return to the menu..." -ForegroundColor DarkGray
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
}

# ──────────────────────────────────────────────────────────────
#  MENU ACTIONS
# ──────────────────────────────────────────────────────────────
function Do-InstallServer {
    Write-Host ""
    Write-Host "  ┌─ Install SysTracker Server ────────────────────────────────┐" -ForegroundColor Cyan
    Write-Host "  │  The server hosts the web dashboard on your machine.        │" -ForegroundColor DarkGray
    Write-Host "  │  Access it at http://localhost:7777 after installation.     │" -ForegroundColor DarkGray
    Write-Host "  └─────────────────────────────────────────────────────────────┘" -ForegroundColor Cyan
    Download-AndInstall 'Server' $Files['Server']
    Pause-Menu
}

function Do-InstallAgent {
    Write-Host ""
    Write-Host "  ┌─ Install SysTracker Agent ─────────────────────────────────┐" -ForegroundColor Cyan
    Write-Host "  │  The agent runs on each machine you want to monitor.        │" -ForegroundColor DarkGray
    Write-Host "  │  You will need the server URL and API key during setup.     │" -ForegroundColor DarkGray
    Write-Host "  └─────────────────────────────────────────────────────────────┘" -ForegroundColor Cyan
    Download-AndInstall 'Agent' $Files['Agent']
    Pause-Menu
}

function Do-InstallBoth {
    Write-Host ""
    Write-Host "  Installing Server first, then Agent..." -ForegroundColor Cyan
    Download-AndInstall 'Server' $Files['Server']
    Write-Host ""
    Download-AndInstall 'Agent' $Files['Agent']
    Pause-Menu
}

function Do-UninstallServer {
    Write-Host ""
    $confirm = Read-Host "  Are you sure you want to uninstall SysTracker Server? [y/N]"
    if ($confirm -match '^[Yy]') {
        Uninstall-Component 'Server'
    } else {
        Write-Host "  Cancelled." -ForegroundColor DarkGray
    }
    Pause-Menu
}

function Do-UninstallAgent {
    Write-Host ""
    $confirm = Read-Host "  Are you sure you want to uninstall SysTracker Agent? [y/N]"
    if ($confirm -match '^[Yy]') {
        Uninstall-Component 'Agent'
    } else {
        Write-Host "  Cancelled." -ForegroundColor DarkGray
    }
    Pause-Menu
}

function Do-CheckUpdates {
    Write-Host ""
    Write-Host "  Checking for the latest release..." -ForegroundColor Cyan
    $latest = Get-LatestRelease
    if (-not $latest) {
        Write-Host "  ✗ Could not reach GitHub. Check your internet connection." -ForegroundColor Red
        Pause-Menu
        return
    }
    Write-Host "  Latest release : v$latest" -ForegroundColor Green
    $serverVer = Get-InstalledVersion 'Server'
    $agentVer  = Get-InstalledVersion 'Agent'
    Write-Host ""
    foreach ($comp in @('Server','Agent')) {
        $cur = if ($comp -eq 'Server') { $serverVer } else { $agentVer }
        if ($cur) {
            if ($cur -eq $latest) {
                Write-Host "  $comp : v$cur — up to date ✓" -ForegroundColor Green
            } else {
                Write-Host "  $comp : v$cur → v$latest — UPDATE AVAILABLE" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  $comp : not installed" -ForegroundColor DarkGray
        }
    }

    Write-Host ""
    $upd = Read-Host "  Would you like to install the latest versions now? [y/N]"
    if ($upd -match '^[Yy]') {
        if ($serverVer) { Download-AndInstall 'Server' $Files['Server'] }
        if ($agentVer)  { Download-AndInstall 'Agent'  $Files['Agent']  }
    }
    Pause-Menu
}

function Do-OpenDashboard {
    Write-Host ""
    $serverVer = Get-InstalledVersion 'Server'
    if ($serverVer) {
        $regPort = try { (Get-ItemProperty 'HKLM:\Software\SysTracker\Server' -ErrorAction Stop).Port } catch { '7777' }
        $url = "http://localhost:$regPort"
        Write-Host "  Opening $url ..." -ForegroundColor Cyan
        Start-Process $url
    } else {
        Write-Host "  SysTracker Server is not installed." -ForegroundColor Yellow
        Write-Host "  Install the server first to access the dashboard." -ForegroundColor DarkGray
    }
    Pause-Menu
}

function Do-Help {
    Write-Host ""
    Write-Host "  ┌─ SysTracker Help ───────────────────────────────────────────┐" -ForegroundColor Cyan
    Write-Host "  │                                                              │" -ForegroundColor DarkGray
    Write-Host "  │  QUICK START                                                 │" -ForegroundColor White
    Write-Host "  │  1. Install the Server on the machine that runs the          │" -ForegroundColor DarkGray
    Write-Host "  │     dashboard (option 1).                                    │" -ForegroundColor DarkGray
    Write-Host "  │  2. Install the Agent on every machine you want to           │" -ForegroundColor DarkGray
    Write-Host "  │     monitor (option 2). Enter your server URL + API key.     │" -ForegroundColor DarkGray
    Write-Host "  │  3. Open http://localhost:7777 to view the dashboard.        │" -ForegroundColor DarkGray
    Write-Host "  │                                                              │" -ForegroundColor DarkGray
    Write-Host "  │  SCRIPTED / UNATTENDED INSTALL                               │" -ForegroundColor White
    Write-Host "  │  irm https://systracker.rico.bd/install | iex                │" -ForegroundColor Yellow
    Write-Host "  │  .\Install-SysTracker.ps1 -Component Server -Unattended     │" -ForegroundColor Yellow
    Write-Host "  │  .\Install-SysTracker.ps1 -Component Agent  -Tag v3.1.8     │" -ForegroundColor Yellow
    Write-Host "  │                                                              │" -ForegroundColor DarkGray
    Write-Host "  │  DOCUMENTATION                                               │" -ForegroundColor White
    Write-Host "  │  Website : $WebUrl" -ForegroundColor DarkGray
    Write-Host "  │  Wiki    : $WikiUrl" -ForegroundColor DarkGray
    Write-Host "  │  GitHub  : https://github.com/$Repo" -ForegroundColor DarkGray
    Write-Host "  │                                                              │" -ForegroundColor DarkGray
    Write-Host "  └──────────────────────────────────────────────────────────────┘" -ForegroundColor Cyan
    Pause-Menu
}

# ──────────────────────────────────────────────────────────────
#  NON-INTERACTIVE (SCRIPTED) MODE
# ──────────────────────────────────────────────────────────────
if ($Component -ne '' -or $Unattended) {

    Write-Host ""
    Write-Host "==============================" -ForegroundColor Cyan
    Write-Host " SysTracker Installer" -ForegroundColor Cyan
    Write-Host " RedwanCodes  •  $WebUrl" -ForegroundColor DarkGray
    Write-Host "==============================" -ForegroundColor Cyan

    $targets = switch ($Component) {
        'Server' { @('Server') }
        'Agent'  { @('Agent')  }
        default  { @('Server','Agent') }
    }

    foreach ($t in $targets) {
        if ($Action -eq 'Uninstall') {
            Uninstall-Component $t
        } else {
            Download-AndInstall $t $Files[$t]
        }
    }

    Write-Host ""
    Write-Host "  Done." -ForegroundColor Green
    exit 0
}

# ──────────────────────────────────────────────────────────────
#  INTERACTIVE MENU LOOP
# ──────────────────────────────────────────────────────────────
while ($true) {
    Write-Header
    Show-InstalledStatus

    Write-Host "  ┌─ What would you like to do? ────────────────────────────────┐" -ForegroundColor DarkCyan
    Write-Host "  │                                                              │" -ForegroundColor DarkGray
    Write-Host "  │   [1]  Install Server     - Dashboard + backend             │" -ForegroundColor White
    Write-Host "  │   [2]  Install Agent      - Monitoring agent for this PC    │" -ForegroundColor White
    Write-Host "  │   [3]  Install Both       - Server + Agent (all-in-one)     │" -ForegroundColor White
    Write-Host "  │                                                              │" -ForegroundColor DarkGray
    Write-Host "  │   [4]  Uninstall Server                                     │" -ForegroundColor DarkGray
    Write-Host "  │   [5]  Uninstall Agent                                      │" -ForegroundColor DarkGray
    Write-Host "  │                                                              │" -ForegroundColor DarkGray
    Write-Host "  │   [6]  Check for Updates                                    │" -ForegroundColor Cyan
    Write-Host "  │   [7]  Open Dashboard     - http://localhost:7777            │" -ForegroundColor Cyan
    Write-Host "  │   [8]  Help / Documentation                                  │" -ForegroundColor DarkGray
    Write-Host "  │                                                              │" -ForegroundColor DarkGray
    Write-Host "  │   [0]  Exit                                                  │" -ForegroundColor DarkGray
    Write-Host "  │                                                              │" -ForegroundColor DarkGray
    Write-Host "  └──────────────────────────────────────────────────────────────┘" -ForegroundColor DarkCyan
    Write-Host ""

    $choice = Read-Host "  Enter option"

    switch ($choice.Trim()) {
        '1' { Do-InstallServer  }
        '2' { Do-InstallAgent   }
        '3' { Do-InstallBoth    }
        '4' { Do-UninstallServer }
        '5' { Do-UninstallAgent  }
        '6' { Do-CheckUpdates   }
        '7' { Do-OpenDashboard  }
        '8' { Do-Help           }
        '0' {
            Write-Host ""
            Write-Host "  Goodbye." -ForegroundColor DarkGray
            Write-Host ""
            exit 0
        }
        default {
            Write-Host "  Invalid option. Please choose 0-8." -ForegroundColor Red
            Start-Sleep -Seconds 1
        }
    }
}
