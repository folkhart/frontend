# 🎨 Custom NSIS Installer Setup for Folkhart

## ✅ What's Been Configured

Your Windows installer now has extensive customization!

---

## 📁 Files Created

### 1. **`electron/installer.nsh`** - Custom NSIS Script
Custom installer behavior with:
- 🎨 Dark stone (#1C1917) and amber (#F59E0B) color theme
- 📝 Custom welcome messages with game features
- ⚔️ Themed completion messages
- 🔗 Website link on finish page
- ✅ Optional desktop shortcut checkbox
- 🚫 Prevents installation while game is running
- 📋 Windows registry integration
- 🎮 Creates Start Menu shortcuts

### 2. **`electron/assets/license.txt`** - EULA
End-user license agreement displayed during installation with:
- Game-specific terms
- Online services clause
- Ownership and restrictions
- Contact information

### 3. **`electron/assets/INSTALLER_IMAGES_GUIDE.md`**
Complete guide for creating custom installer images.

---

## 🎨 Customization Features

### Welcome Page
```
╔══════════════════════════════════╗
║  Welcome to Folkhart             ║
║  Cozy Fantasy RPG                ║
║                                  ║
║  ⚔️ Explore dangerous dungeons   ║
║  🏰 Join or create guilds        ║
║  ⚡ Enhance your equipment       ║
║  🎮 Play with friends            ║
║                                  ║
║  [Next >]                        ║
╚══════════════════════════════════╝
```

### License Agreement
- Shows your custom EULA
- Required to accept before installation
- Game-specific terms included

### Installation Directory
- Default: `C:\Users\Username\AppData\Local\Folkhart`
- Customizable by user
- Prevents installation if game is running

### Finish Page
```
╔══════════════════════════════════╗
║  Installation Complete!          ║
║                                  ║
║  Your adventure awaits!          ║
║                                  ║
║  ☑ Launch Folkhart now          ║
║  ☑ Create Desktop Shortcut      ║
║                                  ║
║  [Visit Folkhart Website]        ║
║  [Finish]                        ║
╚══════════════════════════════════╝
```

---

## 🖼️ Custom Images (Optional)

To make your installer truly unique, create these images:

### Required Dimensions:
1. **installer-wizard.bmp** (164x314) - Left sidebar
2. **installer-header.bmp** (150x57) - Top header
3. **uninstaller-wizard.bmp** (164x314) - Uninstaller sidebar

See `electron/assets/INSTALLER_IMAGES_GUIDE.md` for detailed instructions.

**Note:** Installer works without images (uses defaults), but custom images make it much more professional!

---

## 🔧 Installer Settings

Configured in `electron-builder.json`:

```json
{
  "oneClick": false,              // Shows installation wizard
  "allowToChangeInstallationDirectory": true,
  "createDesktopShortcut": "always",
  "createStartMenuShortcut": true,
  "runAfterFinish": true,         // Launch game after install
  "menuCategory": "Games",        // Windows Start Menu category
  "deleteAppDataOnUninstall": false,  // Keeps save data
  "include": "electron/installer.nsh"  // Your custom script
}
```

---

## 🚀 Building the Installer

```bash
cd frontend

# Build for Windows
npm run electron:build:win

# Output files:
# - Folkhart-Setup-0.1.0.exe (Custom installer)
# - Folkhart-0.1.0-Portable.exe (Portable version)
```

---

## 🎮 Installer Features

### During Installation:
- ✅ Custom welcome screen with game features
- 📜 License agreement (EULA)
- 📁 Directory selection
- 🚫 Checks if game is already running
- ⚙️ Creates registry entries
- 📌 Creates Start Menu shortcuts
- 🖥️ Optional desktop shortcut

### On Finish:
- ▶️ Option to launch game immediately
- 🖥️ Option to create desktop shortcut
- 🔗 Link to your website
- 🎉 Themed completion message

### Uninstaller:
- 🗑️ Removes all installed files
- 🧹 Cleans up registry entries
- 📌 Removes shortcuts
- 💾 Preserves user data (configurable)
- 👋 Farewell message

---

## 🎨 Customizing Messages

Edit `electron/installer.nsh` to change:

### Welcome Message:
```nsh
!define MUI_WELCOMEPAGE_TEXT "Your custom welcome text here"
```

### Finish Message:
```nsh
!define MUI_FINISHPAGE_TEXT "Your custom completion text here"
```

### Website Link:
```nsh
!define MUI_FINISHPAGE_LINK_LOCATION "https://your-website.com"
```

---

## 🎨 Color Customization

Current theme matches Folkhart's design:
- **Background:** `#1C1917` (Dark stone)
- **Text:** `#F59E0B` (Amber)

To change colors, edit in `installer.nsh`:
```nsh
!define MUI_BGCOLOR "1C1917"
!define MUI_TEXTCOLOR "F59E0B"
```

---

## 📋 What Users Will See

### Installation Flow:
1. **Welcome Screen** - Game introduction with features
2. **License Agreement** - EULA (must accept)
3. **Choose Location** - Installation directory
4. **Installing** - Progress bar with custom messages
5. **Completion** - Launch game + shortcuts options

### After Installation:
- **Desktop:** Folkhart shortcut (if selected)
- **Start Menu:** Games → Folkhart
- **Programs:** Listed in Windows Programs & Features
- **Registry:** Proper Windows integration

---

## 🔍 Testing Your Installer

1. **Build the installer:**
   ```bash
   npm run electron:build:win
   ```

2. **Test installation:**
   - Run the .exe file
   - Go through all pages
   - Check for typos/issues
   - Test launch after install

3. **Test uninstallation:**
   - Uninstall via Windows Settings
   - Verify all files removed
   - Check shortcuts are gone

4. **Test upgrade:**
   - Install version 1.0.0
   - Build version 1.0.1
   - Install new version over old

---

## 🎯 Pro Tips

✅ **Always test before releasing** - Install on a clean VM
✅ **Create custom images** - Makes installer look professional
✅ **Keep license updated** - Match your actual terms
✅ **Version your installers** - Easy to track what users have
✅ **Sign your code** - Prevents SmartScreen warnings (requires certificate)
✅ **Test on Windows 10 & 11** - Ensure compatibility

---

## 🚀 Next Steps

### Phase 1: Basic (Already Done ✅)
- Custom NSIS script
- License agreement
- Custom messages
- Themed colors

### Phase 2: Visual Enhancement
- Create installer-wizard.bmp (164x314)
- Create installer-header.bmp (150x57)
- Create uninstaller-wizard.bmp (164x314)
- Rebuild installer

### Phase 3: Advanced (Optional)
- Code signing certificate
- Auto-update functionality
- Custom installation types (Minimal/Full)
- Plugin integration
- Multi-language support

---

## 📞 Support

Need help?
- **Images Guide:** `electron/assets/INSTALLER_IMAGES_GUIDE.md`
- **NSIS Docs:** https://nsis.sourceforge.io/Docs/
- **Electron Builder:** https://www.electron.build/

---

## 🎉 Result

Your Windows installer now has:
- 🎨 Custom branding and colors
- 📝 Professional license agreement
- ⚔️ Game-themed messages
- 🎮 Perfect for a cozy fantasy RPG
- 🚀 Ready for distribution

**Your installer is now 100% custom and matches Folkhart's aesthetic!** ⚔️🏰✨
