#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Downloads and installs SysTracker without SmartScreen blocking.

.DESCRIPTION
    Browsers tag downloaded files with a "Mark of the Web" (Zone.Identifier
    alternate data stream). Windows SmartScreen reads that tag and may block or
    warn about unsigned/unknown software. This script downloads via
    Invoke-WebRequest and immediately calls Unblock-File to remove the tag
    before launching the installer, so SmartScreen never sees it.

.PARAMETER Component
    Which installer to download: Agent, Server, or Both (default: Both)

.PARAMETER Tag
    GitHub release tag to download from (default: latest)

.EXAMPLE
    # Run directly from PowerShell (as Admin):
    irm https://github.com/Redwan002117/SysTracker/releases/latest/download/Install-SysTracker.ps1 | iex

.EXAMPLE
    # Or download and run manually:
    .\Install-SysTracker.ps1 -Component Agent
#>
param(
    [ValidateSet('Agent','Server','Both')]
    [string]$Component = 'Both',

    [string]$Tag = 'latest'
)

$ErrorActionPreference = 'Stop'
$ProgressPreference    = 'SilentlyContinue'   # speeds up Invoke-WebRequest

$repo    = 'Redwan002117/SysTracker'
$baseUrl = if ($Tag -eq 'latest') {
    "https://github.com/$repo/releases/latest/download"
} else {
    "https://github.com/$repo/releases/download/$Tag"
}

$files = @{
    Agent  = 'SysTracker-Agent-Setup.exe'
    Server = 'SysTracker-Server-Setup.exe'
}

function Get-AndInstall {
    param(
        [string]$Name,
        [string]$FileName
    )

    $dest = Join-Path $env:TEMP $FileName
    $url  = "$baseUrl/$FileName"

    Write-Host ""
    Write-Host "[$Name] Downloading from $url ..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing

    Write-Host "[$Name] Removing Zone.Identifier (Mark of the Web) ..." -ForegroundColor Yellow
    Unblock-File -Path $dest

    Write-Host "[$Name] Launching installer ..." -ForegroundColor Green
    Start-Process -FilePath $dest -Wait

    Remove-Item $dest -Force -ErrorAction SilentlyContinue
    Write-Host "[$Name] Done." -ForegroundColor Green
}

Write-Host ""
Write-Host "SysTracker Installer Helper" -ForegroundColor Magenta
Write-Host "============================" -ForegroundColor Magenta

switch ($Component) {
    'Agent'  { Get-AndInstall 'Agent'  $files['Agent']  }
    'Server' { Get-AndInstall 'Server' $files['Server'] }
    'Both'   {
        Get-AndInstall 'Server' $files['Server']
        Get-AndInstall 'Agent'  $files['Agent']
    }
}

Write-Host ""
Write-Host "SysTracker installation complete." -ForegroundColor Green
