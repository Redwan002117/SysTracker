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
VIProductVersion     "3.1.6.0"
VIAddVersionKey      "ProductName"      "SysTracker Agent"
VIAddVersionKey      "CompanyName"      "Redwan002117"
VIAddVersionKey      "FileDescription"  "SysTracker System Monitoring Agent Installer"
VIAddVersionKey      "FileVersion"      "3.1.6.0"
VIAddVersionKey      "ProductVersion"   "3.1.6"
VIAddVersionKey      "LegalCopyright"   "© 2026 Redwan002117"

; ---- MUI Settings -------------------------------------------
!define MUI_ICON                    "app.ico"
!define MUI_UNICON                  "app.ico"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN          "$INSTDIR\systracker-agent.exe"
!define MUI_FINISHPAGE_RUN_TEXT     "Start SysTracker Agent service now"
!define MUI_FINISHPAGE_LINK         "View SysTracker on GitHub"
!define MUI_FINISHPAGE_LINK_LOCATION "https://github.com/Redwan002117/SysTracker"
!define MUI_WELCOMEPAGE_TITLE       "Welcome to SysTracker Agent Setup"
!define MUI_WELCOMEPAGE_TEXT        "This wizard will install the SysTracker Agent on your computer.$\r$\n$\r$\nThe agent runs as a background task and sends system metrics (CPU, RAM, disk, network) to your SysTracker server in real-time. It starts automatically when Windows boots.$\r$\n$\r$\nClick Next to continue."

; ---- Variables ----------------------------------------------
Var ServerURL
Var ApiKey
Var ServerURLField
Var ApiKeyField
Var Dialog

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

; ---- Config Page --------------------------------------------
Function ConfigPage
    !insertmacro MUI_HEADER_TEXT "Server Configuration" "Enter your SysTracker server address and API key."

    nsDialogs::Create 1018
    Pop $Dialog
    ${If} $Dialog == error
        Abort
    ${EndIf}

    ; Server URL label
    ${NSD_CreateLabel} 0 10u 100% 12u "Server URL (e.g. http://192.168.1.100:7777):"
    Pop $0

    ; Server URL field
    ${NSD_CreateText} 0 24u 100% 14u "$ServerURL"
    Pop $ServerURLField

    ; API Key label
    ${NSD_CreateLabel} 0 48u 100% 12u "API Key (from SysTracker Dashboard → Settings):"
    Pop $0

    ; API Key field
    ${NSD_CreateText} 0 62u 100% 14u "$ApiKey"
    Pop $ApiKeyField

    ; Hint
    ${NSD_CreateLabel} 0 86u 100% 24u "Note: You can change these settings later by editing:$\r$\n$INSTDIR\agent_config.json"
    Pop $0

    nsDialogs::Show
FunctionEnd

Function ConfigPageLeave
    ${NSD_GetText} $ServerURLField $ServerURL
    ${NSD_GetText} $ApiKeyField $ApiKey

    ${If} $ServerURL == ""
        MessageBox MB_ICONEXCLAMATION "Please enter the Server URL."
        Abort
    ${EndIf}
FunctionEnd

; ---- Installer Section --------------------------------------
Section "SysTracker Agent" SecMain
    SectionIn RO  ; Required

    SetOutPath "$INSTDIR"

    ; Copy agent executable
    File "dist\systracker-agent-win.exe"
    Rename "$INSTDIR\systracker-agent-win.exe" "$INSTDIR\systracker-agent.exe"

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
        "DisplayVersion"  "3.1.6"
    WriteRegStr   HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerAgent" \
        "Publisher"       "Redwan002117"
    WriteRegStr   HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerAgent" \
        "UninstallString" "$INSTDIR\Uninstall.exe"
    WriteRegStr   HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerAgent" \
        "DisplayIcon"     "$INSTDIR\systracker-agent.exe"
    WriteRegStr   HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerAgent" \
        "URLInfoAbout"    "https://github.com/Redwan002117/SysTracker"
    WriteRegDWORD HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerAgent" \
        "NoModify" 1
    WriteRegDWORD HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerAgent" \
        "NoRepair"  1

    ; Register as a scheduled task that runs at system startup under SYSTEM account.
    ; pkg-bundled Node.js exes cannot interact with the Windows SCM (error 1062),
    ; so Task Scheduler is the correct approach.
    DetailPrint "Registering SysTracker Agent as a startup task..."
    nsExec::ExecToLog 'schtasks /Delete /TN "SysTrackerAgent" /F'
    nsExec::ExecToLog 'schtasks /Create /TN "SysTrackerAgent" /TR "\"$INSTDIR\systracker-agent.exe\"" /SC ONSTART /RU SYSTEM /RL HIGHEST /F'
    DetailPrint "Starting SysTracker Agent..."
    nsExec::ExecToLog 'schtasks /Run /TN "SysTrackerAgent"'

    WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd

; ---- Uninstaller --------------------------------------------
Section "Uninstall"
    ; Stop and remove the scheduled task
    nsExec::ExecToLog 'schtasks /End /TN "SysTrackerAgent"'
    nsExec::ExecToLog 'schtasks /Delete /TN "SysTrackerAgent" /F'

    ; Remove files
    Delete "$INSTDIR\systracker-agent.exe"
    Delete "$INSTDIR\agent_config.json"
    Delete "$INSTDIR\Uninstall.exe"
    RMDir  "$INSTDIR"

    ; Remove shortcuts
    Delete "$SMPROGRAMS\SysTracker\SysTracker Agent.lnk"
    RMDir  "$SMPROGRAMS\SysTracker"

    ; Remove registry
    DeleteRegKey HKLM "Software\SysTracker\Agent"
    DeleteRegKey HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerAgent"
SectionEnd

; ---- Descriptions -------------------------------------------
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
    !insertmacro MUI_DESCRIPTION_TEXT ${SecMain} "Installs the SysTracker Agent as a startup task (runs at boot under SYSTEM)."
!insertmacro MUI_FUNCTION_DESCRIPTION_END
