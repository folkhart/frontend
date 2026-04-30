/**
 * Folkhart Main Process with Patcher/Launcher
 */

const { app, BrowserWindow, ipcMain, Notification, nativeImage, Tray, Menu } = require('electron');
const path = require('path');
const { PremiumPatcher, getGameWindow } = require('./patcher-premium.cjs');
const { getLogger } = require('./logger.cjs');
const { initializeAntiCheat } = require('./antiCheat.cjs');
const { initDiscordRPC, updatePresence, clearPresence } = require('./discordRPC.cjs');
const { initSteam, unlockAchievement } = require('./steam.cjs');

const logger = getLogger();
const isDev = process.env.NODE_ENV === 'development';

// Notification queue
const notificationQueue = [];
let isShowingNotification = false;

// Tray
let tray = null;

// Set app name
app.setName('Folkhart');
if (process.platform === 'win32') {
  app.setAppUserModelId('com.folkhart.app');
}

let patcher = null;

// Create tray icon
function createTray() {
  // Use different icon path for dev vs production
  const iconPath = isDev 
    ? path.join(__dirname, '../favicon.ico')
    : path.join(process.resourcesPath, 'favicon.ico');
  
  try {
    logger.info('TRAY', 'Creating tray icon', { iconPath, isDev, resourcesPath: process.resourcesPath });
    const icon = nativeImage.createFromPath(iconPath);
    
    if (icon.isEmpty()) {
      // Fallback: try alternate paths
      const fallbackPaths = [
        path.join(__dirname, '../favicon.ico'),
        path.join(process.resourcesPath, 'app.asar.unpacked', 'favicon.ico'),
        path.join(app.getAppPath(), 'favicon.ico')
      ];
      
      logger.warn('TRAY', 'Icon empty, trying fallbacks', { fallbackPaths });
      
      for (const fallbackPath of fallbackPaths) {
        const fallbackIcon = nativeImage.createFromPath(fallbackPath);
        if (!fallbackIcon.isEmpty()) {
          logger.info('TRAY', 'Fallback icon loaded', { path: fallbackPath });
          tray = new Tray(fallbackIcon.resize({ width: 16, height: 16 }));
          break;
        }
      }
      
      if (!tray) {
        logger.error('TRAY', 'Could not load any icon, creating empty tray');
        tray = new Tray(nativeImage.createEmpty());
      }
    } else {
      logger.info('TRAY', 'Icon loaded successfully');
      tray = new Tray(icon.resize({ width: 16, height: 16 }));
    }
    
    tray.setToolTip('Folkhart - Cozy Fantasy RPG');
    
    updateTrayMenu({
      username: 'Loading...',
      level: 0,
      energy: 0,
      maxEnergy: 100
    });
    
    // Click tray to show window
    tray.on('click', () => {
      const gameWindow = getGameWindow();
      if (gameWindow && !gameWindow.isDestroyed()) {
        if (gameWindow.isVisible()) {
          gameWindow.hide();
          logger.info('TRAY', 'Window hidden via tray click');
        } else {
          gameWindow.show();
          gameWindow.focus();
          logger.info('TRAY', 'Window shown via tray click');
        }
      } else {
        logger.warn('TRAY', 'No game window available');
      }
    });
    
    logger.info('TRAY', 'Tray icon created');
  } catch (error) {
    logger.error('TRAY', 'Failed to create tray icon', { error: error.message });
  }
}

// Update tray menu with player data
function updateTrayMenu(playerData) {
  if (!tray) return;
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: `⚔️ ${playerData.username || 'Folkhart'}`,
      enabled: false
    },
    {
      type: 'separator'
    },
    {
      label: `Level: ${playerData.level || 0}`,
      enabled: false
    },
    {
      label: `⚡ Energy: ${playerData.energy || 0}/${playerData.maxEnergy || 100}`,
      enabled: false
    },
    {
      type: 'separator'
    },
    {
      label: '🏠 Show Game',
      click: () => {
        const gameWindow = getGameWindow();
        if (gameWindow && !gameWindow.isDestroyed()) {
          gameWindow.show();
          gameWindow.focus();
          logger.info('TRAY', 'Window shown via menu');
        } else {
          logger.warn('TRAY', 'No game window to show');
        }
      }
    },
    {
      label: '🔄 Reload',
      click: () => {
        const gameWindow = getGameWindow();
        if (gameWindow && !gameWindow.isDestroyed()) {
          gameWindow.reload();
          logger.info('TRAY', 'Window reloaded');
        }
      }
    },
    {
      type: 'separator'
    },
    {
      label: '❌ Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
}

// App ready
app.whenReady().then(() => {
  logger.info('APP', 'Application starting', {
    version: app.getVersion(),
    platform: process.platform,
    dev: isDev,
  });

  // Create tray icon
  createTray();
  
  // Create patcher instance
  patcher = new PremiumPatcher();
  patcher.createPatcherWindow();

  // Only check for updates in production
  if (!isDev) {
    setTimeout(() => {
      patcher.checkForUpdates();
    }, 1500);
  }
});

// IPC Handlers
ipcMain.on('patcher-ready', () => {
  logger.info('PATCHER', 'Patcher UI ready');
  
  // In dev mode, skip updates and enable play button immediately when UI is ready
  if (isDev && patcher) {
    patcher.sendStatus('🛠️ Development Mode<br><span style="color: #4ecca3;">Updates disabled</span>');
    patcher.sendProgress(100, 'READY');
    patcher.setPlayButton(true);
  }
});

ipcMain.on('launch-game', () => {
  logger.info('PATCHER', 'User clicked Play button');
  // Initialize Discord Rich Presence in the background
  try {
    initDiscordRPC();
  } catch (err) {
    logger.error('DISCORD', 'Failed to initialize Discord RPC', { error: err.message });
  }

  // Initialize Steamworks
  try {
    initSteam();
  } catch (err) {
    logger.error('STEAM', 'Failed to initialize Steam', { error: err.message });
  }
  patcher.launchGame();
});

ipcMain.on('open-settings', () => {
  logger.info('PATCHER', 'User opened settings');
  patcher.openSettings();
});

ipcMain.on('close-patcher', () => {
  logger.info('PATCHER', 'User closed patcher');
  app.quit();
});

ipcMain.on('open-logs', () => {
  logger.openLogDirectory();
});

// Security event logging
ipcMain.on('security-event', (event, eventType, metadata) => {
  logger.security(`Client reported: ${eventType}`, metadata);
});

// All windows closed - Don't quit, keep running in tray
app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows closed (standard behavior)
  // On Windows/Linux, keep running in tray
  logger.info('APP', 'All windows closed, running in tray');
});

app.on('activate', () => {
  // Re-create patcher on macOS if closed
  if (BrowserWindow.getAllWindows().length === 0 && patcher) {
    patcher.createPatcherWindow();
  }
});

// Window control handlers
ipcMain.on('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.minimize();
  }
});

ipcMain.on('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.close();
  }
});

ipcMain.handle('window-is-maximized', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return win ? win.isMaximized() : false;
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

// Notification functions
function showNotification(options) {
  if (!Notification.isSupported()) {
    logger.warn('NOTIFICATION', 'Notifications not supported on this system');
    return;
  }

  notificationQueue.push(options);
  processNotificationQueue();
}

function processNotificationQueue() {
  if (isShowingNotification || notificationQueue.length === 0) {
    return;
  }
  
  isShowingNotification = true;
  const options = notificationQueue.shift();
  
  const notification = new Notification({
    title: options.title,
    body: options.body,
    icon: options.icon || path.join(__dirname, '../favicon.ico'),
    silent: options.silent || false,
  });
  
  notification.on('click', () => {
    const gameWindow = getGameWindow();
    if (gameWindow && !gameWindow.isDestroyed()) {
      gameWindow.show();
      gameWindow.focus();
      logger.info('NOTIFICATION', 'Window shown via notification click');
    }
  });
  
  notification.show();
  
  // Allow next notification after 2 seconds
  setTimeout(() => {
    isShowingNotification = false;
    processNotificationQueue();
  }, 2000);
}

// Tray update
ipcMain.on('update-tray', (event, playerData) => {
  updateTrayMenu(playerData);
});

// Show tray notification
ipcMain.on('show-tray-notification', () => {
  showNotification({
    title: '🎮 Folkhart',
    body: 'Game minimized to tray. Click the tray icon to restore.',
  });
});

// Game notification handlers
ipcMain.on('show-notification', (event, options) => {
  showNotification(options);
});

ipcMain.on('level-up', (event, data) => {
  showNotification({
    title: '🎉 Level Up!',
    body: `You reached level ${data.newLevel}!`,
  });
  // Trigger Steam Achievement for level up
  // Using Spacewar test ID: ACH_WIN_ONE_GAME
  unlockAchievement('ACH_WIN_ONE_GAME');
});

ipcMain.on('achievement-unlocked', (event, data) => {
  showNotification({
    title: '🏆 Achievement Unlocked!',
    body: `${data.title}: ${data.description}`,
  });
});

ipcMain.on('dungeon-complete', (event, data) => {
  const itemsText = data.items && data.items.length > 0 ? `\nLoot: ${data.items.join(', ')}` : '';
  showNotification({
    title: `⚔️ ${data.dungeonName} Complete!`,
    body: `+${data.gold}g, +${data.exp} XP${itemsText}`,
  });
  // Trigger Steam Achievement for completing a dungeon
  // Using Spacewar test ID: ACH_WIN_100_GAMES
  unlockAchievement('ACH_WIN_100_GAMES');
});

ipcMain.on('idle-complete', (event, data) => {
  showNotification({
    title: '😴 Idle Farming Complete!',
    body: `Earned ${data.gold} gold and ${data.exp} XP!`,
  });
});

ipcMain.on('guild-invite', (event, data) => {
  showNotification({
    title: '🏰 Guild Invitation!',
    body: `${data.inviterName} invited you to join ${data.guildName}`,
  });
});

ipcMain.on('friend-request', (event, data) => {
  showNotification({
    title: '👋 Friend Request',
    body: `${data.username} wants to be your friend!`,
  });
});

ipcMain.on('direct-message', (event, data) => {
  showNotification({
    title: `💬 ${data.username}`,
    body: data.message,
  });
});

ipcMain.on('energy-status', (event, data) => {
  const { energy, maxEnergy } = data;
  if (energy === maxEnergy) {
    showNotification({
      title: '⚡ Energy Full!',
      body: 'Your energy is fully restored. Time to adventure!',
    });
  }
});

// Discord Rich Presence Handlers
ipcMain.on('update-presence', (event, data) => {
  const { details, state, largeImageKey, largeImageText, startTimestamp, endTimestamp, smallImageKey, smallImageText } = data;
  updatePresence(details, state, largeImageKey, largeImageText, startTimestamp, endTimestamp, smallImageKey, smallImageText);
});

ipcMain.on('clear-presence', () => {
  clearPresence();
});

ipcMain.on('toggle-fullscreen', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.setFullScreen(!win.isFullScreen());
  }
});

// Before quit
app.on('before-quit', () => {
  logger.info('APP', 'Application quitting');
});

// Handle errors
process.on('uncaughtException', (error) => {
  logger.error('PROCESS', 'Uncaught exception', {
    error: error.message,
    stack: error.stack,
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('PROCESS', 'Unhandled rejection', {
    reason: String(reason),
  });
});

logger.info('MAIN', 'Main process initialized');
