# 📁 Electron Assets Folder

## ⚠️ IMPORTANT: Add Your Icon Files Here!

You need to add your Folkhart icon files to this folder before building the app.

---

## Required Files:

### 1. icon.png (512x512px)
- **Main application icon**
- Used for: App icon, notifications, taskbar
- Format: PNG with transparency
- Recommended: 512x512px or higher

### 2. tray-icon.png (32x32px)
- **System tray icon**
- Used for: System tray (Windows/Mac/Linux)
- Format: PNG with transparency
- Should be simple/monochrome for best visibility
- Recommended: 32x32px (or 16x16, 24x24, 32x32 for multi-size)

### 3. icon.icns (Mac - Optional)
- macOS-specific icon format
- Only needed for Mac builds
- Can be generated from icon.png using tools

### 4. icon.ico (Windows - Optional)
- Windows-specific icon format
- Only needed if you want custom Windows icon
- Can be generated from icon.png using tools

---

## 🎨 Icon Requirements:

### Main Icon (icon.png):
- ✅ 512x512px or larger
- ✅ PNG format with transparency
- ✅ Folkhart orb/logo design
- ✅ High quality (not pixelated)
- ✅ Clear on dark and light backgrounds

### Tray Icon (tray-icon.png):
- ✅ 32x32px (or 16x16, 24x24, 32x32 for multi-size)
- ✅ PNG format with transparency
- ✅ Simple, monochrome design
- ✅ Visible at small size
- ✅ Works on light and dark themes

---

## 🛠️ How to Generate Icons

### Option 1: Use Online Tools
- https://www.img2go.com/convert-to-ico (PNG → ICO)
- https://cloudconvert.com/png-to-icns (PNG → ICNS)
- https://www.electron.build/icons (Official guide)

### Option 2: Use electron-icon-maker
```bash
npm install -g electron-icon-maker
electron-icon-maker --input=icon.png --output=./assets
```

### Option 3: Use png2icons
```bash
npm install -g png2icons
png2icons icon.png ./assets --icns --ico
```

---

## 📂 Final Folder Structure:

```
electron/
├── assets/
│   ├── icon.png          ✅ Required
│   ├── tray-icon.png     ✅ Required
│   ├── icon.icns         ⬜ Optional (Mac)
│   └── icon.ico          ⬜ Optional (Windows)
├── main.js
├── preload.js
└── README.md (this file)
```

---

## ✅ Quick Checklist:

- [ ] Created/copied `icon.png` (512x512)
- [ ] Created/copied `tray-icon.png` (32x32)
- [ ] Icons look good on dark background
- [ ] Icons look good on light background
- [ ] Tray icon is simple enough for small size
- [ ] All icons have transparency
- [ ] Tested in development mode

---

## 🚀 After Adding Icons:

1. **Test in development:**
   ```bash
   npm run electron:dev
   ```

2. **Check if icons load:**
   - App window should show your icon
   - System tray should show tray icon
   - Notifications should show your icon

3. **If icons don't appear:**
   - Check file names (case-sensitive!)
   - Check file paths in main.js
   - Check image formats (must be PNG)
   - Restart Electron app

4. **Build for production:**
   ```bash
   npm run electron:build:win
   ```

---

## 💡 Tips:

- **Keep it simple:** Simpler icons work better at small sizes
- **Test at different sizes:** Icons should look good from 16px to 512px
- **Use transparency:** Makes icons work on any background
- **Monochrome tray icon:** Works better with system themes
- **High quality:** Use vector graphics if possible, then export to PNG

---

## 🎨 Design Guidelines:

### App Icon:
- Should represent Folkhart clearly
- Recognizable at all sizes
- Looks good in square format
- Has visual impact
- Matches game's aesthetic

### Tray Icon:
- Should be simpler than app icon
- Recognizable at 16x16 pixels
- Works in monochrome
- Has good contrast
- Not too detailed

---

## ❓ Don't Have Icons Yet?

You can use placeholder icons for testing:

1. Create a simple colored square in Photoshop/GIMP
2. Add text "FK" or "Folkhart" 
3. Save as PNG with transparency
4. Use until you get final designs

**But make sure to replace with proper icons before release!**

---

*Once you add your icons, you're ready to build! 🎉*
