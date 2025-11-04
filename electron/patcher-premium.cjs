/**
 * Folkhart Premium Game Patcher/Launcher
 * Professional launcher with real news integration
 */

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const https = require('https');
const { getLogger } = require('./logger.cjs');
const { initializeAntiCheat } = require('./antiCheat.cjs');

const logger = getLogger();
let patcherWindow = null;
let gameWindow = null;

// Export getter for game window
function getGameWindow() {
  return gameWindow;
}

// Configure auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

const API_URL = process.env.VITE_API_URL || 'https://folkhart.com';

class PremiumPatcher {
  constructor() {
    this.currentVersion = app.getVersion();
    this.updateAvailable = false;
    this.updateInfo = null;
  }

  createPatcherWindow() {
    patcherWindow = new BrowserWindow({
      width: 1000,
      height: 650,
      frame: false,
      resizable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      icon: path.join(__dirname, '../favicon.ico'),
      transparent: false,
      backgroundColor: '#000000',
    });

    patcherWindow.loadFile(path.join(__dirname, 'patcher-premium.html'));

    logger.info('PATCHER', 'Premium launcher window opened', { version: this.currentVersion });

    if (process.env.NODE_ENV === 'development') {
      patcherWindow.webContents.openDevTools();
    }

    patcherWindow.on('closed', () => {
      patcherWindow = null;
    });

    patcherWindow.webContents.on('did-finish-load', () => {
      this.sendVersion();
      this.fetchAndSendNews();
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

  /**
   * Fetch real news from the API
   */
  async fetchAndSendNews() {
    try {
      logger.info('NEWS', 'Fetching news from API', { url: API_URL });

      const newsData = await this.fetchNewsFromAPI();
      
      logger.info('NEWS', 'Raw news data received', { 
        hasData: !!newsData, 
        isArray: Array.isArray(newsData),
        length: newsData?.length 
      });
      
      if (newsData && newsData.length > 0) {
        const formattedNews = newsData.map(item => ({
          category: item.category || 'News',
          title: item.title,
          excerpt: item.excerpt || '',
          date: new Date(item.publishedAt || item.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
        })).slice(0, 5); // Show top 5 news items

        if (patcherWindow && !patcherWindow.isDestroyed()) {
          patcherWindow.webContents.send('update-news', formattedNews);
        }

        logger.info('NEWS', 'News loaded successfully', { count: formattedNews.length });
      } else {
        logger.warn('NEWS', 'No news data received, using fallback');
        this.sendFallbackNews();
      }
    } catch (error) {
      logger.error('NEWS', 'Failed to fetch news', { 
        error: error.message,
        stack: error.stack,
        apiUrl: API_URL 
      });
      this.sendFallbackNews();
    }
  }

  /**
   * Fetch news from the real API
   */
  fetchNewsFromAPI() {
    return new Promise((resolve, reject) => {
      try {
        // Parse the API URL
        const apiUrl = new URL(API_URL);
        const isHttps = apiUrl.protocol === 'https:';
        const httpModule = isHttps ? https : require('http');

        const options = {
          hostname: apiUrl.hostname,
          port: apiUrl.port || (isHttps ? 443 : 80),
          path: '/api/news/published?limit=5',
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        };

        logger.info('NEWS', 'Making HTTP request', { 
          hostname: options.hostname,
          port: options.port,
          path: options.path,
          isHttps 
        });

        const req = httpModule.request(options, (res) => {
          logger.info('NEWS', 'Got response', { 
            statusCode: res.statusCode,
            headers: res.headers 
          });

          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            logger.info('NEWS', 'Response body', { 
              length: data.length,
              preview: data.substring(0, 200)
            });

            try {
              const parsed = JSON.parse(data);
              // Backend returns { posts, total }
              logger.info('NEWS', 'Parsed response', {
                hasPosts: !!parsed.posts,
                postsLength: parsed.posts?.length,
                total: parsed.total
              });
              resolve(parsed.posts || []);
            } catch (e) {
              logger.error('NEWS', 'Failed to parse JSON', { 
                error: e.message,
                data: data.substring(0, 500)
              });
              reject(e);
            }
          });
        });

        req.on('error', (error) => {
          logger.error('NEWS', 'HTTP request error', { error: error.message });
          reject(error);
        });

        req.setTimeout(5000, () => {
          logger.error('NEWS', 'Request timeout after 5s');
          req.destroy();
          reject(new Error('Request timeout'));
        });

        req.end();
      } catch (error) {
        logger.error('NEWS', 'Error setting up request', { error: error.message });
        reject(error);
      }
    });
  }

  /**
   * Send fallback news if API is unavailable
   */
  sendFallbackNews() {
    const fallbackNews = [
      {
        category: 'Welcome',
        title: 'Welcome to Folkhart! Embark on your cozy adventure!',
        date: new Date().toLocaleDateString(),
      },
      {
        category: 'Update',
        title: 'Join our Discord community for events and updates',
        date: new Date().toLocaleDateString(),
      },
      {
        category: 'Event',
        title: 'Check out our Reddit for guides and discussions',
        date: new Date().toLocaleDateString(),
      },
    ];

    if (patcherWindow && !patcherWindow.isDestroyed()) {
      patcherWindow.webContents.send('update-news', fallbackNews);
    }
  }

  async checkForUpdates() {
    try {
      this.sendStatus('🔍 Checking for updates...');
      this.sendProgress(10, 'Checking...');
      
      logger.info('UPDATER', 'Checking for updates', { currentVersion: this.currentVersion });

      const result = await autoUpdater.checkForUpdates();
      
      if (result && result.updateInfo) {
        const latestVersion = result.updateInfo.version;
        
        if (latestVersion !== this.currentVersion) {
          this.updateAvailable = true;
          this.updateInfo = result.updateInfo;
          
          this.sendStatus(
            `📦 <span style="color: #84cc16;">Update available: v${latestVersion}</span><br>` +
            `Current version: v${this.currentVersion}`
          );
          this.sendProgress(20, 'Update Found');
          
          logger.info('UPDATER', 'Update available', {
            current: this.currentVersion,
            latest: latestVersion,
          });
          
          await this.downloadUpdate();
        } else {
          this.noUpdateAvailable();
        }
      } else {
        this.noUpdateAvailable();
      }
    } catch (error) {
      logger.error('UPDATER', 'Update check failed', { error: error.message });
      
      this.sendStatus('⚠️ <span style="color: #fbbf24;">Could not check for updates</span><br>Playing with current version');
      this.sendProgress(100, 'READY');
      this.setPlayButton(true);
    }
  }

  noUpdateAvailable() {
    this.sendStatus('✅ <span style="color: #84cc16;">Game is up to date!</span><br>Ready to embark on your adventure');
    this.sendProgress(100, 'READY');
    this.setPlayButton(true);
    
    logger.info('UPDATER', 'No update available', { version: this.currentVersion });
  }

  async downloadUpdate() {
    try {
      this.sendStatus('⬇️ <span style="color: #fbbf24;">Downloading update...</span>');
      this.sendProgress(30, 'Downloading...');
      
      logger.info('UPDATER', 'Starting download', { version: this.updateInfo.version });
      
      await autoUpdater.downloadUpdate();
    } catch (error) {
      logger.error('UPDATER', 'Download failed', { error: error.message });
      
      this.sendStatus('⚠️ <span style="color: #ef4444;">Download failed</span><br>Playing with current version');
      this.sendProgress(100, 'READY');
      this.setPlayButton(true);
    }
  }

  launchGame() {
    try {
      logger.info('GAME', 'Launching game', { version: this.currentVersion });

      if (patcherWindow && !patcherWindow.isDestroyed()) {
        patcherWindow.close();
      }

      gameWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 1024,
        minHeight: 600,
        frame: false, // Remove default titlebar - shows custom ElectronTitleBar
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, 'preload.cjs'),
          webSecurity: true,
          devTools: process.env.NODE_ENV === 'development' // Only in dev
        },
        icon: path.join(__dirname, '../favicon.ico'),
        title: 'Folkhart - Cozy Fantasy RPG',
        backgroundColor: '#1C1917', // Stone gray background
        show: false, // Don't show until ready
        autoHideMenuBar: true,
        titleBarStyle: 'hidden' // macOS specific
      });

      // Show window when ready to prevent flashing
      gameWindow.once('ready-to-show', () => {
        gameWindow.show();
      });

      // Initialize anti-cheat system
      initializeAntiCheat(gameWindow);

      // Minimize to tray instead of closing
      gameWindow.on('close', (event) => {
        if (!app.isQuitting) {
          event.preventDefault();
          gameWindow.hide();
          logger.info('GAME', 'Game window minimized to tray');
          
          // Notify user
          gameWindow.webContents.send('show-tray-notification');
          
          return false;
        }
      });

      gameWindow.on('closed', () => {
        gameWindow = null;
        logger.info('GAME', 'Game window closed');
      });

      if (process.env.NODE_ENV === 'development') {
        gameWindow.loadURL('http://localhost:5173');
        // Don't auto-open devtools
      } else {
        gameWindow.loadFile(path.join(__dirname, '../dist/index.html'));
      }

      logger.info('GAME', 'Game launched successfully');
      
      // Return the window so we can reference it
      return gameWindow;
    } catch (error) {
      logger.error('GAME', 'Failed to launch game', { error: error.message });
    }
  }

  openSettings() {
    const settingsWindow = new BrowserWindow({
      width: 600,
      height: 500,
      frame: false,
      parent: patcherWindow,
      modal: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      backgroundColor: '#292524',
    });

    const settingsHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Press Start 2P', 'Courier New', monospace;
            background: #292524;
            color: #fef3c7;
            padding: 30px;
            margin: 0;
          }
          h2 {
            color: #fbbf24;
            border-bottom: 3px solid #d97706;
            padding-bottom: 15px;
            text-shadow: 2px 2px 0 #000;
            font-size: 16px;
          }
          .setting {
            margin: 25px 0;
            padding: 15px;
            background: rgba(28, 25, 23, 0.8);
            border: 3px solid #d97706;
            box-shadow: 0 4px 0 #1c1917;
          }
          .label {
            color: #fbbf24;
            font-size: 10px;
            margin-bottom: 10px;
          }
          .value {
            color: #fef3c7;
            font-size: 8px;
            word-break: break-all;
          }
          button {
            background: linear-gradient(180deg, #d97706 0%, #b45309 100%);
            color: #fff;
            border: 3px solid #fbbf24;
            padding: 12px 20px;
            cursor: pointer;
            font-family: inherit;
            margin-top: 20px;
            margin-right: 10px;
            text-shadow: 2px 2px 0 #000;
            font-size: 9px;
            box-shadow: 0 4px 0 #000;
            transition: all 0.2s;
          }
          button:hover {
            background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 0 #000;
          }
          button:active {
            transform: translateY(2px);
            box-shadow: 0 2px 0 #000;
          }
        </style>
      </head>
      <body>
        <h2>⚙️ SETTINGS</h2>
        <div class="setting">
          <div class="label">📁 LOG DIRECTORY</div>
          <div class="value">${logger.getLogPath()}</div>
        </div>
        <div class="setting">
          <div class="label">🎮 GAME VERSION</div>
          <div class="value">${this.currentVersion}</div>
        </div>
        <div class="setting">
          <div class="label">💻 PLATFORM</div>
          <div class="value">${process.platform.toUpperCase()}</div>
        </div>
        <button onclick="openLogs()">📂 OPEN LOGS</button>
        <button onclick="window.close()">✕ CLOSE</button>
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
      '✅ <span style="color: #84cc16;">Update downloaded!</span><br>' +
      '<span style="color: #fbbf24;">Game will update on next launch</span>'
    );
    patcherWindow.webContents.send('update-progress', 100, 'READY');
    patcherWindow.webContents.send('set-play-button', true);
  }
});

// IPC Handlers for social links
ipcMain.on('open-url', (event, url) => {
  logger.info('SOCIAL', 'Opening URL', { url });
  shell.openExternal(url);
});

module.exports = { PremiumPatcher, getGameWindow };
