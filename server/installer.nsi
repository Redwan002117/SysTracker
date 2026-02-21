; ============================================================
; SysTracker Server — NSIS Installer Script
; Creates: SysTracker-Server-Setup.exe
; Requirements: NSIS 3.x, MUI2, nsDialogs
; ============================================================

!include "MUI2.nsh"
!include "nsDialogs.nsh"
!include "LogicLib.nsh"
!include "WinMessages.nsh"

; ---- Metadata -----------------------------------------------
Name                 "SysTracker Server"
OutFile              "dist\SysTracker-Server-Setup.exe"
InstallDir           "$PROGRAMFILES64\SysTracker\Server"
InstallDirRegKey     HKLM "Software\SysTracker\Server" "InstallDir"
RequestExecutionLevel admin
SetCompressor        /SOLID lzma
Unicode              true

; ---- Version Info -------------------------------------------
VIProductVersion     "3.1.6.0"
VIAddVersionKey      "ProductName"      "SysTracker Server"
VIAddVersionKey      "CompanyName"      "Redwan002117"
VIAddVersionKey      "FileDescription"  "SysTracker Server Installer"
VIAddVersionKey      "FileVersion"      "3.1.6.0"
VIAddVersionKey      "ProductVersion"   "3.1.6"
VIAddVersionKey      "LegalCopyright"   "© 2026 Redwan002117"

; ---- MUI Settings -------------------------------------------
!define MUI_ICON                    "app.ico"
!define MUI_UNICON                  "app.ico"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN          "$INSTDIR\SysTrackerServer.exe"
!define MUI_FINISHPAGE_RUN_TEXT     "Launch SysTracker Server now"
!define MUI_FINISHPAGE_LINK         "Open Documentation"
!define MUI_FINISHPAGE_LINK_LOCATION "https://github.com/Redwan002117/SysTracker/wiki"
!define MUI_WELCOMEPAGE_TITLE       "Welcome to SysTracker Server Setup"
!define MUI_WELCOMEPAGE_TEXT        "This wizard will install the SysTracker Server on your computer.$\r$\n$\r$\nSysTracker Server provides a real-time dashboard for monitoring all your connected machines. It runs as a background process accessible via your web browser.$\r$\n$\r$\nClick Next to continue."

; ---- Variables ----------------------------------------------
Var ServerPort
Var AdminPassword
Var StartOnBoot
Var Dialog
Var PortField
Var PasswordField
Var BootCheckbox

; ---- Pages --------------------------------------------------
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "..\LICENSE"
!insertmacro MUI_PAGE_DIRECTORY
Page custom ServerConfigPage ServerConfigPageLeave
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

; ---- Server Config Page ------------------------------------
Function ServerConfigPage
    !insertmacro MUI_HEADER_TEXT "Server Configuration" "Configure your SysTracker Server settings."

    ; Default values
    StrCpy $ServerPort "7777"

    nsDialogs::Create 1018
    Pop $Dialog
    ${If} $Dialog == error
        Abort
    ${EndIf}

    ; Port
    ${NSD_CreateLabel} 0 10u 100% 12u "Server Port (default: 7777):"
    Pop $0
    ${NSD_CreateNumber} 0 24u 60u 14u "$ServerPort"
    Pop $PortField
    ${NSD_CreateLabel} 65u 26u 100% 10u "The dashboard will be at http://localhost:[PORT]"
    Pop $0

    ; Admin Password
    ${NSD_CreateLabel} 0 50u 100% 12u "Initial Admin Password:"
    Pop $0
    ${NSD_CreatePassword} 0 64u 100% 14u ""
    Pop $PasswordField

    ; Hint
    ${NSD_CreateLabel} 0 84u 100% 12u "You can log in with username: admin"
    Pop $0

    ; Start on boot
    ${NSD_CreateCheckbox} 0 106u 100% 12u "Start SysTracker Server automatically when Windows starts"
    Pop $BootCheckbox
    ${NSD_SetState} $BootCheckbox ${BST_CHECKED}

    nsDialogs::Show
FunctionEnd

Function ServerConfigPageLeave
    ${NSD_GetText}  $PortField     $ServerPort
    ${NSD_GetText}  $PasswordField $AdminPassword
    ${NSD_GetState} $BootCheckbox  $StartOnBoot

    ${If} $ServerPort == ""
        StrCpy $ServerPort "7777"
    ${EndIf}
    ${If} $AdminPassword == ""
        MessageBox MB_ICONEXCLAMATION "Please enter an admin password."
        Abort
    ${EndIf}
FunctionEnd

; ---- Installer Section --------------------------------------
Section "SysTracker Server" SecServer
    SectionIn RO

    SetOutPath "$INSTDIR"

    ; Core server EXE (the pkg-built Node.js server)
    File "dist\systracker-server-win.exe"
    Rename "$INSTDIR\systracker-server-win.exe" "$INSTDIR\SysTracker-Server-Core.exe"

    ; System tray launcher (compiled C# GUI wrapper)
    File "dist\SysTrackerServer.exe"

    ; Optional: icon file for tray
    File "app.ico"
    Rename "$INSTDIR\app.ico" "$INSTDIR\systracker.ico"

    ; Install code signing certificates so Windows trusts SysTracker binaries
    ; Root CA cert goes to Trusted Root so UAC shows "Redwan002117" as publisher
    ; (non-fatal — skipped if certs were not generated yet)
    File /nonfatal "..\scripts\SysTrackerCA.cer"
    IfFileExists "$INSTDIR\SysTrackerCA.cer" 0 +3
        DetailPrint "Installing SysTracker Root CA certificate..."
        nsExec::ExecToLog 'certutil -addstore "Root" "$INSTDIR\SysTrackerCA.cer"'

    File /nonfatal "..\scripts\SysTracker.cer"
    IfFileExists "$INSTDIR\SysTracker.cer" 0 +3
        DetailPrint "Installing SysTracker code signing certificate..."
        nsExec::ExecToLog 'certutil -addstore "TrustedPublisher" "$INSTDIR\SysTracker.cer"'

    ; Write .env configuration
    FileOpen $0 "$INSTDIR\.env" w
    FileWrite $0 "PORT=$ServerPort$\r$\n"
    FileWrite $0 "ADMIN_PASSWORD=$AdminPassword$\r$\n"
    FileWrite $0 "JWT_SECRET=$\r$\n"
    FileClose $0

    ; Create Start Menu shortcuts (point to tray launcher, not core)
    CreateDirectory "$SMPROGRAMS\SysTracker"
    CreateShortcut "$SMPROGRAMS\SysTracker\SysTracker Server.lnk" \
        "$INSTDIR\SysTrackerServer.exe" "" "$INSTDIR\SysTrackerServer.exe" 0
    CreateShortcut "$SMPROGRAMS\SysTracker\Open Dashboard.lnk" \
        "http://localhost:$ServerPort" "" "" 0
    CreateShortcut "$SMPROGRAMS\SysTracker\Uninstall SysTracker Server.lnk" \
        "$INSTDIR\Uninstall.exe" "" "" 0

    ; Desktop shortcut
    CreateShortcut "$DESKTOP\SysTracker Server.lnk" \
        "$INSTDIR\SysTrackerServer.exe" "" "$INSTDIR\SysTrackerServer.exe" 0

    ; Optionally register to start on Windows boot
    ${If} $StartOnBoot == ${BST_CHECKED}
        WriteRegStr HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Run" \
            "SysTrackerServer" '"$INSTDIR\SysTrackerServer.exe"'
    ${EndIf}

    ; Windows Firewall rule (allow inbound on the chosen port)
    DetailPrint "Adding Windows Firewall rule for port $ServerPort..."
    nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="SysTracker Server"'
    nsExec::ExecToLog 'netsh advfirewall firewall add rule name="SysTracker Server" dir=in action=allow protocol=TCP localport=$ServerPort'

    ; Write uninstall registry
    WriteRegStr   HKLM "Software\SysTracker\Server" "InstallDir" "$INSTDIR"
    WriteRegStr   HKLM "Software\SysTracker\Server" "Port"       "$ServerPort"
    WriteRegStr   HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerServer" \
        "DisplayName"      "SysTracker Server"
    WriteRegStr   HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerServer" \
        "DisplayVersion"   "3.1.6"
    WriteRegStr   HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerServer" \
        "Publisher"        "Redwan002117"
    WriteRegStr   HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerServer" \
        "UninstallString"  "$INSTDIR\Uninstall.exe"
    WriteRegStr   HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerServer" \
        "DisplayIcon"      "$INSTDIR\SysTrackerServer.exe"
    WriteRegStr   HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerServer" \
        "URLInfoAbout"     "https://github.com/Redwan002117/SysTracker"
    WriteRegDWORD HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerServer" \
        "EstimatedSize"    50000
    WriteRegDWORD HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerServer" \
        "NoModify" 1
    WriteRegDWORD HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerServer" \
        "NoRepair"  1

    WriteUninstaller "$INSTDIR\Uninstall.exe"

    DetailPrint "SysTracker Server installed successfully!"
SectionEnd

; ---- Uninstaller --------------------------------------------
Section "Uninstall"
    ; Remove startup entry
    DeleteRegValue HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Run" "SysTrackerServer"

    ; Remove firewall rule
    nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="SysTracker Server"'

    ; Kill running instances
    nsExec::ExecToLog 'taskkill /IM SysTrackerServer.exe /F'
    nsExec::ExecToLog 'taskkill /IM SysTracker-Server-Core.exe /F'
    Sleep 1000

    ; Remove files
    Delete "$INSTDIR\SysTracker-Server-Core.exe"
    Delete "$INSTDIR\SysTrackerServer.exe"
    Delete "$INSTDIR\systracker.ico"
    Delete "$INSTDIR\.env"
    Delete "$INSTDIR\SysTrackerCA.cer"
    Delete "$INSTDIR\SysTracker.cer"
    Delete "$INSTDIR\Uninstall.exe"
    RMDir /r "$INSTDIR\data"
    RMDir /r "$INSTDIR\logs"
    RMDir    "$INSTDIR"

    ; Remove shortcuts
    Delete "$SMPROGRAMS\SysTracker\SysTracker Server.lnk"
    Delete "$SMPROGRAMS\SysTracker\Open Dashboard.lnk"
    Delete "$SMPROGRAMS\SysTracker\Uninstall SysTracker Server.lnk"
    RMDir  "$SMPROGRAMS\SysTracker"
    Delete "$DESKTOP\SysTracker Server.lnk"

    ; Remove registry
    DeleteRegKey HKLM "Software\SysTracker\Server"
    DeleteRegKey HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\SysTrackerServer"
SectionEnd
