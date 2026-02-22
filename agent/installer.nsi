; ============================================================
; SysTracker Agent — NSIS Installer Script
; Creates: SysTracker-Agent-Setup.exe
; Requirements: NSIS 3.x, MUI2, nsDialogs
; ============================================================

!include "MUI2.nsh"
!include "nsDialogs.nsh"
!include "LogicLib.nsh"
!include "WinMessages.nsh"

; ---- Metadata -----------------------------------------------
Name                 "SysTracker Agent"
OutFile              "dist\SysTracker-Agent-Setup.exe"
InstallDir           "$PROGRAMFILES64\SysTracker\Agent"
InstallDirRegKey     HKLM "Software\SysTracker\Agent" "InstallDir"
RequestExecutionLevel admin
SetCompressor        /SOLID lzma
Unicode              true

; ---- Version Info -------------------------------------------
VIProductVersion     "3.2.4.0"
VIAddVersionKey      "ProductName"      "SysTracker Agent"
VIAddVersionKey      "CompanyName"      "RedwanCodes"
VIAddVersionKey      "FileDescription"  "SysTracker System Monitoring Agent Installer"
VIAddVersionKey      "FileVersion"      "3.2.4.0"
VIAddVersionKey      "ProductVersion"   "3.2.4"
VIAddVersionKey      "LegalCopyright"   "© 2026 SysTracker / RedwanCodes"

; ---- MUI Settings -------------------------------------------
!define MUI_ICON                    "app.ico"
!define MUI_UNICON                  "app.ico"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN          "$INSTDIR\systracker-agent.exe"
!define MUI_FINISHPAGE_RUN_TEXT     "Start SysTracker Agent service now"
!define MUI_FINISHPAGE_LINK         "Visit the SysTracker website"
!define MUI_FINISHPAGE_LINK_LOCATION "https://systracker.rico.bd/"
!define MUI_WELCOMEPAGE_TITLE       "Welcome to SysTracker Agent Setup"
!define MUI_WELCOMEPAGE_TEXT        "This wizard will install the SysTracker Agent on your computer.$\r$\n$\r$\nThe agent runs as a background task and sends system metrics (CPU, RAM, disk, network) to your SysTracker server in real-time. It starts automatically when Windows boots.$\r$\n$\r$\nClick Next to continue."

; ---- Variables ----------------------------------------------
Var ServerHost
Var ServerPort
Var ServerURL
Var ApiKey
Var ServerHostField
Var ServerPortField
Var ApiKeyField
Var Dialog
Var ProtocolLabel
Var HintLabel

; ---- Pages --------------------------------------------------
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "..\LICENSE"
!insertmacro MUI_PAGE_DIRECTORY
Page custom ConfigPage ConfigPageLeave
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

; ---- Init: pre-fill defaults --------------------------------
Function .onInit
    StrCpy $ServerHost ""
    StrCpy $ServerPort "7777"
    StrCpy $ApiKey     ""
    StrCpy $ServerURL  ""
FunctionEnd

; ---- Config Page --------------------------------------------
Function ConfigPage
    !insertmacro MUI_HEADER_TEXT "Server Configuration" "Enter your SysTracker server address and API key."

    nsDialogs::Create 1018
    Pop $Dialog
    ${If} $Dialog == error
        Abort
    ${EndIf}

    ; Protocol/Host label
    ${NSD_CreateLabel} 0 10u 100% 12u "Server Address (hostname, domain, or IP address):"
    Pop $ProtocolLabel

    ; Server Host/IP field — narrower to leave room for port
    ${NSD_CreateText} 0 24u 78% 14u "$ServerHost"
    Pop $ServerHostField

    ; Colon label between host and port
    ${NSD_CreateLabel} 79% 27u 2% 12u ":"
    Pop $0

    ; Port field — compact
    ${NSD_CreateText} 82% 24u 18% 14u "$ServerPort"
    Pop $ServerPortField

    ; Flexible hint explaining what to put in each field
    ${NSD_CreateLabel} 0 42u 100% 12u "Examples: 192.168.1.100  |  monitor.example.com  |  https://myserver.io"
    Pop $HintLabel

    ; API Key label
    ${NSD_CreateLabel} 0 60u 100% 12u "API Key (from SysTracker Dashboard → Settings):"
    Pop $0

    ; API Key field
    ${NSD_CreateText} 0 74u 100% 14u "$ApiKey"
    Pop $ApiKeyField

    ; Edit-later hint
    ${NSD_CreateLabel} 0 96u 100% 24u "Note: You can change these settings later by editing:$\r$\n$INSTDIR\agent_config.json"
    Pop $0

    nsDialogs::Show
FunctionEnd

Function ConfigPageLeave
    ${NSD_GetText} $ServerHostField $ServerHost
    ${NSD_GetText} $ServerPortField $ServerPort
    ${NSD_GetText} $ApiKeyField $ApiKey

    ; Trim whitespace
    ${If} $ServerHost == ""
        MessageBox MB_ICONEXCLAMATION "Please enter the Server Address."
        Abort
    ${EndIf}

    ; Use 7777 as default if port is blank or zero
    ${If} $ServerPort == ""
        StrCpy $ServerPort "7777"
    ${EndIf}
    ${If} $ServerPort == "0"
        StrCpy $ServerPort "7777"
    ${EndIf}

    ; Auto-prefix protocol if the host doesn't already start with http
    ; Check if already has a scheme (http:// or https://)
    StrCpy $0 $ServerHost 8  ; grab first 8 chars
    ${If} $0 == "https://"
        ; already full URL with https — extract just the host+path for port insertion
        ; Remove the https:// prefix for host field display
        StrCpy $ServerURL "$ServerHost"
    ${ElseIf} $0 == "http://"
        StrCpy $ServerURL "$ServerHost"
    ${Else}
        ; No scheme — default to http. Users with https should type https://
        StrCpy $ServerURL "http://$ServerHost:$ServerPort"
    ${EndIf}

    ; For URLs that already include a scheme, append port only if no port is present
    ; (simple check: if last segment contains a colon after the ://)
    ; This is a basic heuristic to avoid double-port issues.
    ; Full case: if user typed http://host or https://host, append :port
    StrCpy $1 $ServerURL 7
    ${If} $1 == "http://"
    ${OrIf} $1 == "https:/"
        ; Check if there are 2+ colons (scheme colon + port colon)
        ; nsDialogs has no regex, so just append port for bare http(s)://host URLs
        ; If user typed http://host:7777 themselves, this may double the port.
        ; Safest: tell user to include the port in the host field if using http(s)://
        ; For now: reconstruct cleanly
        StrCpy $0 $ServerHost 8
        ${If} $0 == "https://"
            ; Strip https://
            StrCpy $2 $ServerHost "" 8
            StrCpy $ServerURL "https://$2:$ServerPort"
        ${Else}
            ; Strip http://
            StrCpy $2 $ServerHost "" 7
            StrCpy $ServerURL "http://$2:$ServerPort"
        ${EndIf}
    ${EndIf}
FunctionEnd

; ---- Installer Section --------------------------------------
Section "SysTracker Agent" SecMain
    SectionIn RO  ; Required

    ; Force 64-bit registry view so uninstall entry is visible to 64-bit PowerShell
    SetRegView 64

    SetOutPath "$INSTDIR"

    ; Copy agent executable
    File "dist\systracker-agent-win.exe"
    Rename "$INSTDIR\systracker-agent-win.exe" "$INSTDIR\systracker-agent.exe"

    ; Install code signing certificates so Windows trusts SysTracker binaries
    ; Root CA cert goes to Trusted Root so UAC shows "RedwanCodes" as publisher
    ; (non-fatal — skipped if certs were not generated yet)
    File /nonfatal "..\scripts\SysTrackerCA.cer"
    IfFileExists "$INSTDIR\SysTrackerCA.cer" 0 +3
        DetailPrint "Installing SysTracker Root CA certificate..."
        nsExec::ExecToLog 'certutil -addstore "Root" "$INSTDIR\SysTrackerCA.cer"'

    File /nonfatal "..\scripts\SysTracker.cer"
    IfFileExists "$INSTDIR\SysTracker.cer" 0 +3
        DetailPrint "Installing SysTracker code signing certificate..."
        nsExec::ExecToLog 'certutil -addstore "TrustedPublisher" "$INSTDIR\SysTracker.cer"'

    ; Write config file
    FileOpen $0 "$INSTDIR\agent_config.json" w
    FileWrite $0 '{$\r$\n'
    FileWrite $0 '    "SERVER_URL": "$ServerURL",$\r$\n'
    FileWrite $0 '    "API_KEY": "$ApiKey"$\r$\n'
    FileWrite $0 '}$\r$\n'
    FileClose $0

    ; Create Start Menu shortcuts
    CreateDirectory "$SMPROGRAMS\SysTracker"
    CreateShortcut "$SMPROGRAMS\SysTracker\SysTracker Agent.lnk" \
        "$INSTDIR\systracker-agent.exe" "" "$INSTDIR\systracker-agent.exe" 0

    ; Write registry for uninstall
    WriteRegStr   HKLM "Software\SysTracker\Agent" "InstallDir" "$INSTDIR"
    WriteRegStr   HKLM "Software\SysTracker\Agent" "ServerURL"  "$ServerURL"
    WriteRegStr   HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerAgent" \
        "DisplayName"     "SysTracker Agent"
    WriteRegStr   HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerAgent" \
        "DisplayVersion"  "3.2.4"
    WriteRegStr   HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerAgent" \
        "Publisher"       "RedwanCodes"
    WriteRegStr   HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerAgent" \
        "UninstallString" "$INSTDIR\Uninstall.exe"
    WriteRegStr   HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerAgent" \
        "DisplayIcon"     "$INSTDIR\systracker-agent.exe"
    WriteRegStr   HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerAgent" \
        "URLInfoAbout"    "https://systracker.rico.bd/"
    WriteRegDWORD HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerAgent" \
        "NoModify" 1
    WriteRegDWORD HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerAgent" \
        "NoRepair"  1

    ; Pre-create the ProgramData log directory so the SYSTEM account can write logs
    ; before the agent itself gets a chance to create it
    CreateDirectory "$APPDATA\..\..\..\ProgramData\SysTracker\Agent\logs"
    ; Grant write access to all users (so SYSTEM task and logged-in users both work)
    nsExec::ExecToLog 'icacls "$APPDATA\..\..\..\ProgramData\SysTracker\Agent\logs" /grant "SYSTEM:(OI)(CI)F" /grant "Administrators:(OI)(CI)F" /grant "Users:(OI)(CI)M" /T /Q'

    ; Register as a scheduled task that runs at system startup under SYSTEM account.
    ; pkg-bundled Node.js exes cannot interact with the Windows SCM (error 1062),
    ; so Task Scheduler is the correct approach.
    ; Wrap the exe in a cmd redirect so stdout/stderr also go to a log file as backup.
    DetailPrint "Registering SysTracker Agent as a startup task..."
    nsExec::ExecToStack 'cmd /c schtasks /Delete /TN "SysTrackerAgent" /F 2>nul'
    Pop $0
    Pop $1 ; discard output — failure here just means no old task existed
    nsExec::ExecToLog 'schtasks /Create /TN "SysTrackerAgent" /TR "cmd /c \"\"$INSTDIR\systracker-agent.exe\"\" >> \"C:\ProgramData\SysTracker\Agent\logs\service_output.log\" 2>&1" /SC ONSTART /RU SYSTEM /RL HIGHEST /F'
    DetailPrint "Starting SysTracker Agent..."
    nsExec::ExecToLog 'schtasks /Run /TN "SysTrackerAgent"'

    ; Create a Start Menu shortcut to open the logs folder
    CreateShortcut "$SMPROGRAMS\SysTracker\View Agent Logs.lnk" \
        "C:\Windows\explorer.exe" \
        "C:\ProgramData\SysTracker\Agent\logs" \
        "C:\Windows\System32\shell32.dll" 22

    ; Strip Mark-of-the-Web (Zone.Identifier ADS) from installed files.
    ; This prevents SmartScreen from flagging the agent exe after install.
    nsExec::ExecToLog 'powershell -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass \
        -Command "Get-ChildItem -LiteralPath \"$INSTDIR\" -Filter *.exe -Recurse | Unblock-File"'

    WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd

; ---- Uninstaller --------------------------------------------
Section "Uninstall"
    SetRegView 64
    ; Stop and remove the scheduled task
    nsExec::ExecToLog 'schtasks /End /TN "SysTrackerAgent"'
    nsExec::ExecToLog 'schtasks /Delete /TN "SysTrackerAgent" /F'

    ; Self-deregister from the SysTracker server (best-effort, non-fatal)
    ; Reads SERVER_URL and API_KEY from agent_config.json and calls /api/deregister
    DetailPrint "Notifying SysTracker server of removal..."
    FileOpen $1 "$TEMP\st_dereg.ps1" w
    FileWrite $1 "try {$\r$\n"
    FileWrite $1 "  if (Test-Path '$INSTDIR\agent_config.json') {$\r$\n"
    FileWrite $1 "    $$cfg = Get-Content -Raw '$INSTDIR\agent_config.json' | ConvertFrom-Json;$\r$\n"
    FileWrite $1 "    $$url = $$cfg.SERVER_URL + '/deregister';$\r$\n"
    FileWrite $1 "    $$hdr = @{'x-api-key'=$$cfg.API_KEY;'Content-Type'='application/json'};$\r$\n"
    FileWrite $1 "    $$bdy = ConvertTo-Json @{machine_id=$$env:COMPUTERNAME};$\r$\n"
    FileWrite $1 "    Invoke-RestMethod -Uri $$url -Method POST -Headers $$hdr -Body $$bdy -TimeoutSec 5 | Out-Null$\r$\n"
    FileWrite $1 "  }$\r$\n"
    FileWrite $1 "} catch { Write-Host ('Deregister skipped: ' + $$_.Exception.Message) }"
    FileClose $1
    nsExec::ExecToLog 'powershell -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "$TEMP\st_dereg.ps1"'
    Delete "$TEMP\st_dereg.ps1"

    ; Remove files
    Delete "$INSTDIR\systracker-agent.exe"
    Delete "$INSTDIR\agent_config.json"
    Delete "$INSTDIR\SysTrackerCA.cer"
    Delete "$INSTDIR\SysTracker.cer"
    Delete "$INSTDIR\Uninstall.exe"
    RMDir  "$INSTDIR"

    ; Remove shortcuts
    Delete "$SMPROGRAMS\SysTracker\SysTracker Agent.lnk"
    Delete "$SMPROGRAMS\SysTracker\View Agent Logs.lnk"
    RMDir  "$SMPROGRAMS\SysTracker"

    ; Remove registry
    DeleteRegKey HKLM "Software\SysTracker\Agent"
    DeleteRegKey HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerAgent"
SectionEnd

; ---- Descriptions -------------------------------------------
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
    !insertmacro MUI_DESCRIPTION_TEXT ${SecMain} "Installs the SysTracker Agent as a startup task (runs at boot under SYSTEM)."
!insertmacro MUI_FUNCTION_DESCRIPTION_END
