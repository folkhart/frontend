/**
 * Folkhart Game Patcher/Launcher
 * Checks for updates, downloads them, and launches the game
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { getLogger } = require('./logger.cjs');

const logger = getLogger();
let patcherWindow = null;
let gameWindow = null;

// Configure auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

class Patcher {
  constructor() {
    this.currentVersion = app.getVersion();
    this.updateAvailable = false;
    this.updateInfo = null;
  }

  createPatcherWindow() {
    patcherWindow = new BrowserWindow({
      width: 800,
      height: 600,
      frame: false,
      resizable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      icon: path.join(__dirname, '../favicon.ico'),
    });

    patcherWindow.loadFile(path.join(__dirname, 'patcher.html'));

    // Log patcher launch
    logger.info('PATCHER', 'Launcher window opened', { version: this.currentVersion });

    // Dev tools in development
    if (process.env.NODE_ENV === 'development') {
      patcherWindow.webContents.openDevTools();
    }

    patcherWindow.on('closed', () => {
      patcherWindow = null;
    });

    // Send initial version
    patcherWindow.webContents.on('did-finish-load', () => {
      this.sendVersion();
      this.sendNews();
    });
  }

  sendStatus(message) {
    if (patcherWindow && !patcherWindow.isDestroyed()) {
      patcherWindow.webContents.send('update-status', message);
    }
  }

  sendProgress(percent, text) {
    if (patcherWindow && !patcherWindow.isDestroyed()) {
      patcherWindow.webContents.send('update-progress', percent, text);
    }
  }

  sendVersion() {
    if (patcherWindow && !patcherWindow.isDestroyed()) {
      patcherWindow.webContents.send('update-version', this.currentVersion);
    }
  }

  setPlayButton(enabled) {
    if (patcherWindow && !patcherWindow.isDestroyed()) {
      patcherWindow.webContents.send('set-play-button', enabled);
    }
  }

  sendNews() {
    // In production, fetch from API
    // For now, use dummy data
    const news = [
      {
        type: 'UPDATE',
        title: 'New dungeon added: The Abyss',
        date: new Date().toLocaleDateString(),
      },
      {
        type: 'EVENT',
        title: 'Double XP Weekend!',
        date: new Date().toLocaleDateString(),
      },
      {
        type: 'NEWS',
        title: 'Anti-cheat system improved',
        date: new Date().toLocaleDateString(),
      },
    ];

    if (patcherWindow && !patcherWindow.isDestroyed()) {
      patcherWindow.webContents.send('update-news', news);
    }
  }

  async checkForUpdates() {
    try {
      this.sendStatus('🔍 Checking for updates...');
      this.sendProgress(10, 'Checking...');
      
      logger.info('UPDATER', 'Checking for updates', { currentVersion: this.currentVersion });

      // Check for updates
      const result = await autoUpdater.checkForUpdates();
      
      if (result && result.updateInfo) {
        const latestVersion = result.updateInfo.version;
        
        if (latestVersion !== this.currentVersion) {
          this.updateAvailable = true;
          this.updateInfo = result.updateInfo;
          
          this.sendStatus(
            `📦 Update available: v${latestVersion}<br>` +
            `<span style="color: #4ecca3;">Current: v${this.currentVersion}</span>`
          );
          this.sendProgress(20, 'Update Found');
          
          logger.info('UPDATER', 'Update available', {
            current: this.currentVersion,
            latest: latestVersion,
          });
          
          // Ask to download
          await this.downloadUpdate();
        } else {
          this.noUpdateAvailable();
        }
      } else {
        this.noUpdateAvailable();
      }
    } catch (error) {
      logger.error('UPDATER', 'Update check failed', { error: error.message });
      
      // If update check fails, allow playing with current version
      this.sendStatus('⚠️ Could not check for updates<br><span style="color: #4ecca3;">Playing with current version</span>');
      this.sendProgress(100, 'READY');
      this.setPlayButton(true);
    }
  }

  noUpdateAvailable() {
    this.sendStatus('✅ Game is up to date!<br><span style="color: #4ecca3;">Ready to play</span>');
    this.sendProgress(100, 'READY');
    this.setPlayButton(true);
    
    logger.info('UPDATER', 'No update available', { version: this.currentVersion });
  }

  async downloadUpdate() {
    try {
      this.sendStatus('⬇️ Downloading update...');
      this.sendProgress(30, 'Downloading...');
      
      logger.info('UPDATER', 'Starting download', { version: this.updateInfo.version });
      
      await autoUpdater.downloadUpdate();
    } catch (error) {
      logger.error('UPDATER', 'Download failed', { error: error.message });
      
      this.sendStatus('⚠️ Download failed<br><span style="color: #4ecca3;">Playing with current version</span>');
      this.sendProgress(100, 'READY');
      this.setPlayButton(true);
    }
  }

  launchGame() {
    try {
      logger.info('GAME', 'Launching game', { version: this.currentVersion });

      // Close patcher
      if (patcherWindow && !patcherWindow.isDestroyed()) {
        patcherWindow.close();
      }

      // Create game window
      gameWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
        },
        icon: path.join(__dirname, '../favicon.ico'),
      });

      // In development, load from vite dev server
      if (process.env.NODE_ENV === 'development') {
        gameWindow.loadURL('http://localhost:5173');
      } else {
        // In production, load built files
        gameWindow.loadFile(path.join(__dirname, '../dist/index.html'));
      }

      gameWindow.on('closed', () => {
        gameWindow = null;
        logger.info('GAME', 'Game window closed');
        app.quit();
      });

      logger.info('GAME', 'Game launched successfully');
    } catch (error) {
      logger.error('GAME', 'Failed to launch game', { error: error.message });
    }
  }

  openSettings() {
    const settingsWindow = new BrowserWindow({
      width: 500,
      height: 400,
      frame: false,
      parent: patcherWindow,
      modal: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    const settingsHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Courier New', monospace;
            background: #292524;
            color: #fef3c7;
            padding: 20px;
            margin: 0;
          }
          h2 {
            color: #fbbf24;
            border-bottom: 2px solid #d97706;
            padding-bottom: 10px;
          }
          .setting {
            margin: 20px 0;
            padding: 10px;
            background: rgba(28, 25, 23, 0.8);
            border: 2px solid #d97706;
          }
          button {
            background: #d97706;
            color: #fff;
            border: 2px solid #fbbf24;
            padding: 10px 20px;
            cursor: pointer;
            font-family: inherit;
            margin-top: 20px;
            margin-right: 10px;
            text-shadow: 1px 1px 0px #000;
          }
          button:hover {
            background: #f59e0b;
            transform: scale(1.05);
          }
        </style>
      </head>
      <body>
        <h2>⚙️ SETTINGS</h2>
        <div class="setting">
          <strong>Log Directory:</strong><br>
          ${logger.getLogPath()}
        </div>
        <div class="setting">
          <strong>Version:</strong><br>
          ${this.currentVersion}
        </div>
        <button onclick="openLogs()">Open Logs Folder</button>
        <button onclick="window.close()">Close</button>
        <script>
          const { ipcRenderer } = require('electron');
          function openLogs() {
            ipcRenderer.send('open-logs');
          }
        </script>
      </body>
      </html>
    `;

    settingsWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(settingsHtml)}`);
  }
}

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
  logger.info('UPDATER', 'Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  logger.info('UPDATER', 'Update available', { version: info.version });
});

autoUpdater.on('update-not-available', (info) => {
  logger.info('UPDATER', 'Update not available', { version: info.version });
});

autoUpdater.on('error', (err) => {
  logger.error('UPDATER', 'Auto-updater error', { error: err.message });
});

autoUpdater.on('download-progress', (progressObj) => {
  const percent = Math.round(progressObj.percent);
  if (patcherWindow && !patcherWindow.isDestroyed()) {
    patcherWindow.webContents.send('update-progress', 30 + (percent * 0.6), `Downloading... ${percent}%`);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  logger.info('UPDATER', 'Update downloaded', { version: info.version });
  
  if (patcherWindow && !patcherWindow.isDestroyed()) {
    patcherWindow.webContents.send('update-status', 
      '✅ Update downloaded!<br>' +
      '<span style="color: #4ecca3;">Game will update on next launch</span>'
    );
    patcherWindow.webContents.send('update-progress', 100, 'READY');
    patcherWindow.webContents.send('set-play-button', true);
  }
});

module.exports = { Patcher };
