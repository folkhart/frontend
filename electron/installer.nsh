; Custom NSIS Installer Script for Folkhart
; This file customizes the installer appearance and behavior

!include "MUI2.nsh"
!include "FileFunc.nsh"

; Custom colors - Amber and Dark theme matching the game
!define MUI_BGCOLOR "1C1917"  ; Dark stone background
!define MUI_TEXTCOLOR "F59E0B"  ; Amber text

; Custom installer icon and header
; Uncomment these lines when you create custom BMP images
; !define MUI_HEADERIMAGE
; !define MUI_HEADERIMAGE_BITMAP "${BUILD_RESOURCES_DIR}\installer-header.bmp"
; !define MUI_WELCOMEFINISHPAGE_BITMAP "${BUILD_RESOURCES_DIR}\installer-wizard.bmp"

; Custom welcome page
!define MUI_WELCOMEPAGE_TITLE "Welcome to Folkhart - Cozy Fantasy RPG"
!define MUI_WELCOMEPAGE_TEXT "Embark on your adventure!$\r$\n$\r$\nThis wizard will guide you through the installation of Folkhart.$\r$\n$\r$\n⚔️ Explore dangerous dungeons$\r$\n🏰 Join or create guilds$\r$\n⚡ Enhance your equipment$\r$\n🎮 Play with friends$\r$\n$\r$\nClick Next to continue."

; Custom finish page
!define MUI_FINISHPAGE_TITLE "Installation Complete!"
!define MUI_FINISHPAGE_TEXT "Folkhart has been installed successfully!$\r$\n$\r$\nYour adventure awaits, brave hero!$\r$\n$\r$\nClick Finish to close this wizard."
!define MUI_FINISHPAGE_RUN "$INSTDIR\${PRODUCT_FILENAME}"
!define MUI_FINISHPAGE_RUN_TEXT "Launch Folkhart now"

; Add custom checkbox to finish page
!define MUI_FINISHPAGE_SHOWREADME ""
!define MUI_FINISHPAGE_SHOWREADME_NOTCHECKED
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Create Desktop Shortcut"
!define MUI_FINISHPAGE_SHOWREADME_FUNCTION createDesktopShortcut

; Custom link buttons on finish page
!define MUI_FINISHPAGE_LINK "Visit Folkhart Website"
!define MUI_FINISHPAGE_LINK_LOCATION "https://folkhart.com"

; Custom messages
!define MUI_ABORTWARNING_TEXT "Are you sure you want to quit Folkhart installation?"

; Custom directory page
!define MUI_DIRECTORYPAGE_TEXT_TOP "Setup will install Folkhart in the following folder.$\r$\n$\r$\nTo install in a different folder, click Browse and select another folder."

; Installer pages order
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "${BUILD_RESOURCES_DIR}\license.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; Uninstaller pages
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; Language
!insertmacro MUI_LANGUAGE "English"

; Custom function to create desktop shortcut
Function createDesktopShortcut
  CreateShortcut "$DESKTOP\Folkhart.lnk" "$INSTDIR\${PRODUCT_FILENAME}" "" "$INSTDIR\${PRODUCT_FILENAME}" 0
FunctionEnd

; Custom init function - runs before installer starts
Function .onInit
  ; Display custom splash screen (optional)
  ; You can add a splash screen here if you create one
  
  ; Check if app is already running
  System::Call 'kernel32::CreateMutexA(i 0, i 0, t "FolkhartMutex") i .r1 ?e'
  Pop $R0
  StrCmp $R0 0 +3
    MessageBox MB_OK|MB_ICONEXCLAMATION "Folkhart is already running. Please close it before installing." /SD IDOK
    Abort
FunctionEnd

; Custom section - runs during installation
Section "Install"
  ; Custom installation messages
  DetailPrint "Installing Folkhart - Cozy Fantasy RPG..."
  DetailPrint "⚔️ Setting up game files..."
  
  ; Add registry keys for better Windows integration
  WriteRegStr HKLM "Software\Folkhart" "InstallPath" "$INSTDIR"
  WriteRegStr HKLM "Software\Folkhart" "Version" "${VERSION}"
  
  DetailPrint "✅ Installation complete!"
SectionEnd

; Custom uninstall section
Section "Uninstall"
  DetailPrint "Removing Folkhart..."
  
  ; Remove registry keys
  DeleteRegKey HKLM "Software\Folkhart"
  
  ; Remove desktop shortcut if it exists
  Delete "$DESKTOP\Folkhart.lnk"
  
  DetailPrint "Farewell, hero. Your adventures will be remembered!"
SectionEnd

; Custom macros for installer
!macro customInstall
  ; This runs during installation
  DetailPrint "⚡ Configuring Folkhart..."
  
  ; Create additional shortcuts
  CreateShortcut "$SMPROGRAMS\Folkhart\Play Folkhart.lnk" "$INSTDIR\${PRODUCT_FILENAME}"
  CreateShortcut "$SMPROGRAMS\Folkhart\Uninstall Folkhart.lnk" "$INSTDIR\Uninstall ${PRODUCT_FILENAME}.exe"
!macroend

!macro customUnInstall
  ; This runs during uninstallation
  DetailPrint "🗑️ Cleaning up Folkhart files..."
  
  ; Remove start menu folder
  RMDir /r "$SMPROGRAMS\Folkhart"
!macroend

; Custom header for installer window
!macro customHeader
  ; You can add custom controls to the installer window here
  ; Example: Add a banner image or custom text
!macroend
