#Requires -RunAsAdministrator
<#
.SYNOPSIS
    SysTracker Installer - interactive menu for installing, updating, and
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

# Force UTF-8 so all characters render correctly in any terminal
$OutputEncoding           = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
& chcp 65001 2>&1 | Out-Null

# ─────────────────────────────────────────────────────────────────
#  CONSTANTS
# ─────────────────────────────────────────────────────────────────
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

# ─────────────────────────────────────────────────────────────────
#  UI HELPERS
# ─────────────────────────────────────────────────────────────────
function Get-Width { [Math]::Max(72, [Math]::Min(120, $Host.UI.RawUI.WindowSize.Width)) }

function Write-Divider {
    param([System.ConsoleColor]$Color = 'DarkCyan', [string]$Char = '=')
    $w = Get-Width
    Write-Host ("  " + ($Char * ($w - 4))) -ForegroundColor $Color
}

function Write-Header {
    Clear-Host
    Write-Host ""
    Write-Divider DarkCyan '='
    Write-Host ""
    Write-Host "       ___           _____               _           " -ForegroundColor Cyan
    Write-Host "      / __| _  _  __|_   _| _ __  __ _ | |__ ___  _ " -ForegroundColor Cyan
    Write-Host "      \__ \| || |(_-< | || '_/ _' / _`` | / // -_)| '_|" -ForegroundColor Cyan
    Write-Host "      |___/ \_, |/__/ |_||_| \__,_\__,_|_\_\\___||_|  " -ForegroundColor Cyan
    Write-Host "            |__/                                       " -ForegroundColor Cyan
    Write-Host ""
    Write-Host "      System Monitoring Dashboard  |  RedwanCodes  |  $WebUrl" -ForegroundColor DarkGray
    Write-Host ""
    Write-Divider DarkCyan '='
    Write-Host ""
}

function Write-BoxTop {
    param([string]$Title = '')
    $w = Get-Width
    if ($Title) {
        $rest = [Math]::Max(2, $w - 7 - $Title.Length)
        Write-Host ("  +-- " + $Title + " " + ("-" * $rest) + "+") -ForegroundColor Cyan
    } else {
        Write-Host ("  +" + ("-" * ($w - 5)) + "+") -ForegroundColor Cyan
    }
}

function Write-BoxLine {
    param([string]$Text = '', [System.ConsoleColor]$Color = 'DarkGray')
    $w     = Get-Width
    $inner = $w - 6
    $line  = $Text.PadRight($inner)
    if ($line.Length -gt $inner) { $line = $line.Substring(0, $inner) }
    Write-Host "  |" -NoNewline -ForegroundColor DarkGray
    Write-Host " $line " -NoNewline -ForegroundColor $Color
    Write-Host "|" -ForegroundColor DarkGray
}

function Write-BoxBottom {
    $w = Get-Width
    Write-Host ("  +" + ("-" * ($w - 5)) + "+") -ForegroundColor Cyan
}

function Get-InstalledVersion {
    param([string]$Component)
    try {
        # Check both 64-bit and 32-bit (Wow6432Node) registry hives
        $key64 = $UninstallKeys[$Component]
        $key32 = $key64 -replace '\\SOFTWARE\\', '\\SOFTWARE\\Wow6432Node\\'
        foreach ($key in @($key64, $key32)) {
            if (Test-Path $key) {
                $ver = (Get-ItemProperty $key -ErrorAction SilentlyContinue).DisplayVersion
                if ($ver) { return $ver }
            }
        }
    } catch {}
    return $null
}

function Get-LatestRelease {
    try {
        $rel = Invoke-RestMethod -Uri $ApiUrl -UseBasicParsing -TimeoutSec 8
        return $rel.tag_name -replace '^v',''
    } catch { return $null }
}

function Show-InstalledStatus {
    $sv = Get-InstalledVersion 'Server'
    $av = Get-InstalledVersion 'Agent'

    Write-Host "  Installed:" -ForegroundColor DarkGray
    Write-Host "    Server  " -NoNewline -ForegroundColor DarkGray
    if ($sv) { Write-Host "v$sv  [installed]" -ForegroundColor Green  }
    else      { Write-Host "not installed"     -ForegroundColor DarkGray }
    Write-Host "    Agent   " -NoNewline -ForegroundColor DarkGray
    if ($av) { Write-Host "v$av  [installed]" -ForegroundColor Green  }
    else      { Write-Host "not installed"     -ForegroundColor DarkGray }
    Write-Host ""
}

function Read-SingleKey {
    $k = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
    return $k.Character.ToString().Trim()
}

function Pause-Menu {
    Write-Host ""
    Write-Host "  Press any key to return to the menu..." -ForegroundColor DarkGray
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
}

function Confirm-Action {
    param([string]$Prompt)
    Write-Host ""
    Write-Host "  $Prompt [Y/N]: " -NoNewline -ForegroundColor Yellow
    $k = Read-SingleKey
    Write-Host $k -ForegroundColor White
    return $k -match '^[Yy]$'
}

function Download-AndInstall {
    param([string]$Name, [string]$FileName)
    $dest = Join-Path $env:TEMP $FileName
    $url  = "$BaseUrl/$FileName"

    Write-Host ""
    Write-Host "  >> Downloading $Name installer..." -ForegroundColor Cyan
    Write-Host "     $url" -ForegroundColor DarkGray
    try {
        Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
    } catch {
        Write-Host "  [FAIL] Download failed: $_" -ForegroundColor Red
        return $false
    }

    Write-Host "  >> Removing Mark-of-the-Web..." -ForegroundColor DarkGray
    Unblock-File -Path $dest

    if ($Unattended) {
        Write-Host "  >> Installing silently..." -ForegroundColor Green
        $proc = Start-Process -FilePath $dest -ArgumentList '/S' -Wait -PassThru
        if ($proc.ExitCode -ne 0) {
            Write-Host "  [FAIL] Installer exited with code $($proc.ExitCode)" -ForegroundColor Red
            Remove-Item $dest -Force -ErrorAction SilentlyContinue
            return $false
        }
    } else {
        Write-Host "  >> Launching installer wizard..." -ForegroundColor Green
        Start-Process -FilePath $dest -Wait
    }

    Remove-Item $dest -Force -ErrorAction SilentlyContinue
    Write-Host ""
    Write-Host "  [OK] $Name installed successfully." -ForegroundColor Green
    return $true
}

function Uninstall-Component {
    param([string]$Name)
    $key64 = $UninstallKeys[$Name]
    $key32 = $key64 -replace '\\SOFTWARE\\', '\\SOFTWARE\\Wow6432Node\\'
    $uninstStr = $null
    foreach ($key in @($key64, $key32)) {
        if (Test-Path $key) {
            $uninstStr = (Get-ItemProperty $key -ErrorAction SilentlyContinue).UninstallString
            if ($uninstStr) { break }
        }
    }
    if (-not $uninstStr) {
        Write-Host "  [!] $Name is not installed or uninstall entry is missing." -ForegroundColor Yellow
        return
    }
    Write-Host "  >> Uninstalling $Name..." -ForegroundColor Cyan
    Start-Process -FilePath $uninstStr -Wait
    Write-Host "  [OK] $Name uninstalled." -ForegroundColor Green
}

# ─────────────────────────────────────────────────────────────────
#  MENU ACTIONS
# ─────────────────────────────────────────────────────────────────
function Do-InstallServer {
    Write-Header
    Write-BoxTop "Install SysTracker Server"
    Write-BoxLine ""
    Write-BoxLine "  The server hosts the web dashboard on your machine." White
    Write-BoxLine "  Access it at http://localhost:7777 after installation." DarkGray
    Write-BoxLine ""
    Write-BoxBottom
    Download-AndInstall 'Server' $Files['Server']
    Pause-Menu
}

function Do-InstallAgent {
    Write-Header
    Write-BoxTop "Install SysTracker Agent"
    Write-BoxLine ""
    Write-BoxLine "  The agent runs on each machine you want to monitor." White
    Write-BoxLine "  You will need the server URL and API key during setup." DarkGray
    Write-BoxLine ""
    Write-BoxBottom
    Download-AndInstall 'Agent' $Files['Agent']
    Pause-Menu
}

function Do-InstallBoth {
    Write-Header
    Write-BoxTop "Install Server + Agent"
    Write-BoxLine ""
    Write-BoxLine "  Installing Server first, then Agent..." White
    Write-BoxLine ""
    Write-BoxBottom
    Download-AndInstall 'Server' $Files['Server']
    Write-Host ""
    Download-AndInstall 'Agent' $Files['Agent']
    Pause-Menu
}

function Do-UninstallServer {
    Write-Header
    Write-BoxTop "Uninstall SysTracker Server"
    Write-BoxLine ""
    Write-BoxLine "  This will remove the Server and all associated files." Yellow
    Write-BoxLine ""
    Write-BoxBottom
    if (Confirm-Action "Are you sure you want to uninstall SysTracker Server?") {
        Uninstall-Component 'Server'
    } else {
        Write-Host "  Cancelled." -ForegroundColor DarkGray
    }
    Pause-Menu
}

function Do-UninstallAgent {
    Write-Header
    Write-BoxTop "Uninstall SysTracker Agent"
    Write-BoxLine ""
    Write-BoxLine "  This will remove the Agent and all associated files." Yellow
    Write-BoxLine ""
    Write-BoxBottom
    if (Confirm-Action "Are you sure you want to uninstall SysTracker Agent?") {
        Uninstall-Component 'Agent'
    } else {
        Write-Host "  Cancelled." -ForegroundColor DarkGray
    }
    Pause-Menu
}

function Do-CheckUpdates {
    Write-Header
    Write-BoxTop "Check for Updates"
    Write-BoxLine ""
    Write-BoxLine "  Querying GitHub for the latest release..." DarkGray
    Write-BoxLine ""
    Write-BoxBottom
    Write-Host ""

    $latest = Get-LatestRelease
    if (-not $latest) {
        Write-Host "  [FAIL] Could not reach GitHub. Check your internet connection." -ForegroundColor Red
        Pause-Menu
        return
    }
    Write-Host "  Latest release : " -NoNewline -ForegroundColor DarkGray
    Write-Host "v$latest" -ForegroundColor Green
    Write-Host ""

    $anyUpdate = $false
    foreach ($comp in @('Server','Agent')) {
        $cur = Get-InstalledVersion $comp
        Write-Host "  $comp : " -NoNewline -ForegroundColor DarkGray
        if ($cur) {
            if ($cur -eq $latest) {
                Write-Host "v$cur  -- up to date" -ForegroundColor Green
            } else {
                Write-Host "v$cur --> v$latest  -- UPDATE AVAILABLE" -ForegroundColor Yellow
                $anyUpdate = $true
            }
        } else {
            Write-Host "not installed" -ForegroundColor DarkGray
        }
    }

    if ($anyUpdate) {
        if (Confirm-Action "Install the latest versions now?") {
            if (Get-InstalledVersion 'Server') { Download-AndInstall 'Server' $Files['Server'] }
            if (Get-InstalledVersion 'Agent')  { Download-AndInstall 'Agent'  $Files['Agent']  }
        }
    }
    Pause-Menu
}

function Do-OpenDashboard {
    Write-Header
    Write-BoxTop "Open Dashboard"
    $sv = Get-InstalledVersion 'Server'
    if ($sv) {
        $regPort = try { (Get-ItemProperty 'HKLM:\Software\SysTracker\Server' -ErrorAction Stop).Port } catch { '7777' }
        $url = "http://localhost:$regPort"
        Write-BoxLine ""
        Write-BoxLine "  Opening: $url" Cyan
        Write-BoxLine ""
        Write-BoxBottom
        Write-Host ""
        Start-Process $url
        Write-Host "  >> Browser launched." -ForegroundColor Green
    } else {
        Write-BoxLine ""
        Write-BoxLine "  SysTracker Server is not installed." Yellow
        Write-BoxLine "  Install the server first to access the dashboard." DarkGray
        Write-BoxLine ""
        Write-BoxBottom
    }
    Pause-Menu
}

function Do-Help {
    Write-Header
    Write-BoxTop "Help / Documentation"
    Write-BoxLine ""
    Write-BoxLine "  QUICK START" White
    Write-BoxLine "  1. Install the Server on the machine you want as dashboard host." DarkGray
    Write-BoxLine "  2. Install the Agent on every monitored machine." DarkGray
    Write-BoxLine "     Enter the server URL and API key when prompted." DarkGray
    Write-BoxLine "  3. Open http://localhost:7777 to see the live dashboard." DarkGray
    Write-BoxLine ""
    Write-BoxLine "  SCRIPTED INSTALL" White
    Write-BoxLine "  irm https://systracker.rico.bd/install | iex" Yellow
    Write-BoxLine "  .\Install-SysTracker.ps1 -Component Server -Unattended" Yellow
    Write-BoxLine "  .\Install-SysTracker.ps1 -Component Agent  -Tag v3.2.3" Yellow
    Write-BoxLine ""
    Write-BoxLine "  LINKS" White
    Write-BoxLine "  Website : $WebUrl" DarkGray
    Write-BoxLine "  Wiki    : $WikiUrl" DarkGray
    Write-BoxLine "  GitHub  : https://github.com/$Repo" DarkGray
    Write-BoxLine ""
    Write-BoxBottom
    Pause-Menu
}

# ─────────────────────────────────────────────────────────────────
#  NON-INTERACTIVE (SCRIPTED) MODE
# ─────────────────────────────────────────────────────────────────
if ($Component -ne '' -or $Unattended) {
    Write-Host ""
    Write-Host "  SysTracker Installer  |  RedwanCodes  |  $WebUrl" -ForegroundColor Cyan
    Write-Divider DarkCyan '='
    Write-Host ""

    $targets = switch ($Component) {
        'Server' { @('Server') }
        'Agent'  { @('Agent')  }
        default  { @('Server','Agent') }
    }

    foreach ($t in $targets) {
        if ($Action -eq 'Uninstall') { Uninstall-Component $t }
        else                         { Download-AndInstall $t $Files[$t] | Out-Null }
    }

    Write-Host ""
    Write-Host "  Done." -ForegroundColor Green
    exit 0
}

# ─────────────────────────────────────────────────────────────────
#  INTERACTIVE MENU LOOP
# ─────────────────────────────────────────────────────────────────
while ($true) {
    Write-Header
    Show-InstalledStatus

    Write-BoxTop "What would you like to do?"
    Write-BoxLine ""
    Write-BoxLine "   [1]  Install Server    -  Dashboard + backend" White
    Write-BoxLine "   [2]  Install Agent     -  Monitoring agent for this PC" White
    Write-BoxLine "   [3]  Install Both      -  Server + Agent (all-in-one)" White
    Write-BoxLine ""
    Write-BoxLine "   [4]  Uninstall Server" DarkGray
    Write-BoxLine "   [5]  Uninstall Agent" DarkGray
    Write-BoxLine ""
    Write-BoxLine "   [6]  Check for Updates" Cyan
    Write-BoxLine "   [7]  Open Dashboard    -  http://localhost:7777" Cyan
    Write-BoxLine "   [8]  Help / Docs" DarkGray
    Write-BoxLine ""
    Write-BoxLine "   [0]  Exit" DarkGray
    Write-BoxLine ""
    Write-BoxBottom
    Write-Host ""
    Write-Host "  Press a key [0-8]: " -NoNewline -ForegroundColor Yellow

    $choice = Read-SingleKey
    Write-Host $choice -ForegroundColor White

    switch ($choice) {
        '1' { Do-InstallServer   }
        '2' { Do-InstallAgent    }
        '3' { Do-InstallBoth     }
        '4' { Do-UninstallServer }
        '5' { Do-UninstallAgent  }
        '6' { Do-CheckUpdates    }
        '7' { Do-OpenDashboard   }
        '8' { Do-Help            }
        '0' {
            Write-Host ""
            Write-Host "  Goodbye." -ForegroundColor DarkGray
            Write-Host ""
            exit 0
        }
        default {
            Write-Host "  Invalid key. Press 0-8." -ForegroundColor Red
            Start-Sleep -Milliseconds 700
        }
    }
}
