# 🖥️ Folkhart Desktop App - Electron Setup Guide

## ✅ Setup Complete!

The Electron desktop app for Folkhart is now configured and ready to use!

---

## 📁 Files Created

### Core Electron Files:
- `electron/main.js` - Main process (Node.js)
- `electron/preload.js` - Secure IPC bridge
- `electron-builder.json` - Build configuration

### Frontend Integration:
- `src/types/electron.d.ts` - TypeScript types
- `src/hooks/useElectron.ts` - React hooks for Electron features

### Configuration:
- `package.json` - Updated with Electron scripts and dependencies

---

## 📦 Installation

### 1. Install Dependencies

```bash
cd frontend
npm install
```

This will install:
- `electron` - Electron framework
- `electron-builder` - Build & packaging tool
- `concurrently` - Run multiple commands
- `cross-env` - Cross-platform environment variables
- `wait-on` - Wait for server to start

---

## 🚀 Development

### Run in Development Mode:

```bash
npm run electron:dev
```

This will:
1. Start Vite dev server (localhost:5173)
2. Wait for server to be ready
3. Launch Electron app
4. Enable DevTools
5. Hot reload on code changes

### Development Features:
- ✅ Live reload
- ✅ DevTools enabled
- ✅ Connects to localhost:5173
- ✅ Full debugging

---

## 🎨 Icon Setup

### Required Icons:

You need to create these icon files in `electron/assets/`:

1. **icon.png** (512x512px)
   - Main app icon
   - Used for notifications
   - Format: PNG with transparency

2. **tray-icon.png** (32x32px)
   - System tray icon
   - Format: PNG with transparency
   - Should be simple/monochrome

3. **icon.icns** (Mac only - optional)
   - macOS app icon
   - Use `png2icons` or similar tool

4. **icon.ico** (Windows only - optional)
   - Windows app icon
   - Use `png2icons` or similar tool

### Quick Icon Setup:

```bash
# Create assets directory
mkdir electron/assets

# Copy your icon files
cp /path/to/your/icon.png electron/assets/icon.png
cp /path/to/your/tray-icon.png electron/assets/tray-icon.png
```

### Icon Generation Tools:
- https://www.electron.build/icons
- https://github.com/iTwin/png2icons
- https://www.img2go.com/convert-to-ico

---

## 🔨 Building for Production

### Build for Windows:

```bash
npm run electron:build:win
```

**Output:**
- `dist-electron/Folkhart-0.1.0-x64.exe` (Installer)
- `dist-electron/Folkhart-0.1.0-ia32.exe` (32-bit Installer)
- `dist-electron/Folkhart-0.1.0-Portable.exe` (Portable)

### Build for Mac:

```bash
npm run electron:build:mac
```

**Output:**
- `dist-electron/Folkhart-0.1.0.dmg` (Installer)
- `dist-electron/Folkhart-0.1.0-mac.zip` (Archive)

### Build for Linux:

```bash
npm run electron:build:linux
```

**Output:**
- `dist-electron/Folkhart-0.1.0.AppImage`
- `dist-electron/folkhart_0.1.0_amd64.deb`
- `dist-electron/folkhart-0.1.0.x86_64.rpm`

### Build All Platforms:

```bash
npm run electron:build
```

---

## 🎮 Using Electron Features in Your Code

### 1. Basic Usage

```typescript
import { useElectron } from '@/hooks/useElectron';

function MyComponent() {
  const { isElectron, notify } = useElectron();

  const handleClick = () => {
    if (isElectron) {
      notify({
        title: 'Hello!',
        body: 'This is a notification from Folkhart'
      });
    }
  };

  return (
    <button onClick={handleClick}>
      {isElectron ? 'Show Notification' : 'Not in Electron'}
    </button>
  );
}
```

### 2. Game Notifications

```typescript
import { useGameNotifications } from '@/hooks/useElectron';

function DungeonTab() {
  const { notifyDungeonComplete } = useGameNotifications();

  const completeDungeon = async () => {
    // ... dungeon logic
    
    notifyDungeonComplete('Dragon\'s Lair', {
      gold: 1000,
      exp: 500,
      items: ['Iron Sword +5', 'Dragon Scale']
    });
  };
}
```

### 3. Tray Integration

```typescript
import { useTraySync } from '@/hooks/useElectron';

function GamePage() {
  const player = usePlayerStore(state => state.player);
  const character = usePlayerStore(state => state.character);

  // Auto-sync tray with player data
  useTraySync(player, character);

  return <div>...</div>;
}
```

### 4. Energy Full Notification

```typescript
useEffect(() => {
  if (player.energy === player.maxEnergy) {
    notifyEnergyFull();
  }
}, [player.energy, player.maxEnergy]);
```

---

## ✨ Features Included

### ✅ Notifications
- Dungeon completion
- Energy full
- Guild messages
- Friend requests
- Level ups
- Idle farming rewards
- Item sales

### ✅ System Tray
- Minimize to tray
- Quick stats view
- Energy counter
- Show/hide window
- Quit option

### ✅ Window Management
- Single instance (can't open twice)
- Minimize instead of close
- Focus/blur events
- Always on top option

### ✅ Platform Detection
- Windows/Mac/Linux detection
- Platform-specific features
- Native notifications

---

## 🎯 Integration Points

### Add to GamePage.tsx:

```typescript
import { useElectron, useTraySync } from '@/hooks/useElectron';

function GamePage() {
  const { isElectron } = useElectron();
  const player = usePlayerStore(state => state.player);
  const character = usePlayerStore(state => state.character);

  // Sync tray with player data
  useTraySync(player, character);

  return (
    <div>
      {isElectron && (
        <div className="electron-badge">
          🖥️ Desktop App
        </div>
      )}
      {/* Rest of your game */}
    </div>
  );
}
```

### Add to Socket Handlers:

```typescript
import { useGameNotifications } from '@/hooks/useElectron';

function setupSocketListeners() {
  const { notifyDungeonComplete, notifyGuildMessage } = useGameNotifications();

  onDungeonComplete((data) => {
    // ... existing logic
    notifyDungeonComplete(data.dungeonName, data.rewards);
  });

  onGuildMessage((data) => {
    // ... existing logic
    notifyGuildMessage(data.username, data.message);
  });
}
```

---

## 🔧 Configuration

### Update vite.config.ts (if needed):

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Important for Electron
  server: {
    port: 5173
  }
});
```

---

## 📋 Testing Checklist

Before building for production:

- [ ] Icons created in `electron/assets/`
- [ ] Test notifications working
- [ ] Test system tray working
- [ ] Test minimize to tray
- [ ] Test window focus/blur
- [ ] Test on target platforms
- [ ] Update version in package.json
- [ ] Test installer on clean system

---

## 🚨 Common Issues & Solutions

### Issue: "Electron not found"
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Can't find icon.png"
**Solution:**
- Create `electron/assets/icon.png` (512x512)
- Or update path in `electron/main.js`

### Issue: "Port 5173 already in use"
**Solution:**
- Kill existing Vite server
- Or change port in vite.config.ts

### Issue: "White screen in Electron"
**Solution:**
- Check console for errors
- Make sure vite server is running
- Check CORS settings

### Issue: "Notifications not showing"
**Solution:**
- Check OS notification permissions
- Test with `notify-send` (Linux)
- Check Do Not Disturb settings

---

## 📊 Build Sizes

Estimated sizes:
- **Windows Installer:** ~80-100 MB
- **Mac DMG:** ~90-110 MB
- **Linux AppImage:** ~85-105 MB
- **Portable:** ~70-90 MB

---

## 🔄 Auto-Updates (Future)

To enable auto-updates later:

1. Install `electron-updater`:
```bash
npm install electron-updater
```

2. Uncomment auto-updater code in `electron/main.js`

3. Setup GitHub releases or custom update server

4. Configure update channel in `electron-builder.json`

---

## 🎉 Next Steps

1. **Test Development:**
   ```bash
   npm run electron:dev
   ```

2. **Add Icon Files:**
   - Copy your icons to `electron/assets/`

3. **Integrate Notifications:**
   - Add `useGameNotifications()` to components
   - Call `notify*()` functions on events

4. **Build for Production:**
   ```bash
   npm run electron:build:win
   ```

5. **Test Installer:**
   - Install on clean system
   - Test all features
   - Share with users!

---

## 📞 Support

### Documentation:
- [Electron Docs](https://www.electronjs.org/docs)
- [Electron Builder](https://www.electron.build/)
- [IPC Communication](https://www.electronjs.org/docs/latest/tutorial/ipc)

### Common Commands:
```bash
# Development
npm run electron:dev

# Build current platform
npm run electron:build

# Build specific platform
npm run electron:build:win
npm run electron:build:mac
npm run electron:build:linux

# Pack without installer (faster)
npm run pack
```

---

## ✅ Checklist for Release

- [ ] Update version in package.json
- [ ] Test on Windows
- [ ] Test on Mac
- [ ] Test on Linux
- [ ] All notifications working
- [ ] Tray icon functional
- [ ] Icons look good
- [ ] Installer tested
- [ ] Update notes prepared
- [ ] Upload to website/GitHub

---

*Happy Desktop App Development! 🖥️✨*

**Your Folkhart desktop app is ready to build and ship!**
