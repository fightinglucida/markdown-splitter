Unicode true
!include "MUI2.nsh"

!ifndef APP_SOURCE
  !error "APP_SOURCE is required"
!endif

!ifndef OUT_FILE
  !define OUT_FILE "Markdown2Card-Setup.exe"
!endif

!ifndef APP_VERSION
  !define APP_VERSION "0.1.0"
!endif

Name "Markdown2Card"
OutFile "${OUT_FILE}"
InstallDir "$LOCALAPPDATA\Programs\Markdown2Card"
InstallDirRegKey HKCU "Software\Markdown2Card" "InstallDir"
RequestExecutionLevel user

VIProductVersion "${APP_VERSION}.0"
VIAddVersionKey "ProductName" "Markdown2Card"
VIAddVersionKey "CompanyName" "LinshuTech"
VIAddVersionKey "FileDescription" "Markdown2Card Installer"
VIAddVersionKey "FileVersion" "${APP_VERSION}"
VIAddVersionKey "ProductVersion" "${APP_VERSION}"

!define MUI_ABORTWARNING
!define MUI_ICON "..\build\icon.ico"
!define MUI_UNICON "..\build\icon.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\Markdown2Card.exe"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "SimpChinese"

Section "Markdown2Card" SEC_APP
  SetShellVarContext current
  SetOutPath "$INSTDIR"
  RMDir /r "$INSTDIR"
  CreateDirectory "$INSTDIR"
  SetOutPath "$INSTDIR"
  File /r "${APP_SOURCE}\*.*"

  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\Markdown2Card" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Markdown2Card" "DisplayName" "Markdown2Card"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Markdown2Card" "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Markdown2Card" "Publisher" "LinshuTech"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Markdown2Card" "DisplayIcon" "$INSTDIR\Markdown2Card.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Markdown2Card" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Markdown2Card" "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Markdown2Card" "NoRepair" 1

  CreateDirectory "$SMPROGRAMS\Markdown2Card"
  CreateShortcut "$SMPROGRAMS\Markdown2Card\Markdown2Card.lnk" "$INSTDIR\Markdown2Card.exe" "" "$INSTDIR\Markdown2Card.exe" 0
  CreateShortcut "$SMPROGRAMS\Markdown2Card\卸载 Markdown2Card.lnk" "$INSTDIR\Uninstall.exe" "" "$INSTDIR\Uninstall.exe" 0
  CreateShortcut "$DESKTOP\Markdown2Card.lnk" "$INSTDIR\Markdown2Card.exe" "" "$INSTDIR\Markdown2Card.exe" 0
SectionEnd

Section "Uninstall"
  SetShellVarContext current
  Delete "$DESKTOP\Markdown2Card.lnk"
  Delete "$SMPROGRAMS\Markdown2Card\Markdown2Card.lnk"
  Delete "$SMPROGRAMS\Markdown2Card\卸载 Markdown2Card.lnk"
  RMDir "$SMPROGRAMS\Markdown2Card"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Markdown2Card"
  DeleteRegKey HKCU "Software\Markdown2Card"
SectionEnd
