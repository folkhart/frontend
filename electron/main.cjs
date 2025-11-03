const { app, BrowserWindow, ipcMain, Notification, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// Set app name and user model ID for proper Windows notifications
app.setName('Folkhart');
if (process.platform === 'win32') {
  app.setAppUserModelId('com.folkhart.app');
}

let mainWindow = null;
let tray = null;

// Notification queue to prevent spam
const notificationQueue = [];
let isShowingNotification = false;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 600,
    frame: false, // Remove default titlebar
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'Folkhart - Cozy Fantasy RPG',
    backgroundColor: '#1C1917', // Stone gray background
    show: false, // Don't show until ready
    autoHideMenuBar: true,
    titleBarStyle: 'hidden' // macOS specific
  });

  // Show window when ready to prevent flashing
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the app
  if (isDev) {
    // Try common Vite ports - will auto-fallback if one fails
    const ports = [5173, 5174, 5175];
    let loaded = false;
    
    for (const port of ports) {
      try {
        await mainWindow.loadURL(`http://localhost:${port}`);
        console.log(`✅ Connected to Vite dev server on port ${port}`);
        loaded = true;
        break;
      } catch (err) {
        console.log(`❌ Port ${port} not available, trying next...`);
      }
    }
    
    if (!loaded) {
      console.error('❌ Could not connect to Vite dev server on any port');
    }
    
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL('https://folkhart.com');
  }

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      
      // Show notification on first minimize
      if (!app.hasShownMinimizeNotification) {
        showNotification({
          title: 'Folkhart Running in Background',
          body: 'The app will continue running. Click the tray icon to restore.',
          silent: true
        });
        app.hasShownMinimizeNotification = true;
      }
    }
  });

  // Handle window being closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Send window state to renderer
  mainWindow.on('focus', () => {
    mainWindow.webContents.send('window-focus', true);
  });

  mainWindow.on('blur', () => {
    mainWindow.webContents.send('window-blur', false);
  });
}

function createTray() {
  // Create tray icon
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  const trayIcon = nativeImage.createFromPath(iconPath);
  
  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
  
  // Set tooltip
  tray.setToolTip('Folkhart - Cozy Fantasy RPG');
  
  // Create context menu
  updateTrayMenu({
    username: 'Loading...',
    level: 0,
    energy: 0,
    maxEnergy: 100
  });
  
  // Click tray icon to show window
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });
}

function updateTrayMenu(playerData) {
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
      label: '🏠 Show Folkhart',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: '🔄 Reload',
      click: () => {
        if (mainWindow) {
          mainWindow.reload();
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
  
  if (tray) {
    tray.setContextMenu(contextMenu);
  }
}

function showNotification(options) {
  // Check if notifications are supported
  if (!Notification.isSupported()) {
    console.log('Notifications not supported on this system');
    return;
  }

  // Add to queue
  notificationQueue.push(options);
  
  // Process queue
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
    icon: options.icon || path.join(__dirname, 'assets', 'icon.png'),
    silent: options.silent || false,
    urgency: options.urgency || 'normal'
  });
  
  notification.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
    if (options.onClick) {
      mainWindow.webContents.send('notification-clicked', options.onClick);
    }
  });
  
  notification.show();
  
  // Allow next notification after 2 seconds
  setTimeout(() => {
    isShowingNotification = false;
    processNotificationQueue();
  }, 2000);
}

// IPC Handlers
ipcMain.on('show-notification', (event, options) => {
  showNotification(options);
});

ipcMain.on('update-tray', (event, playerData) => {
  updateTrayMenu(playerData);
  
  // Update tray icon badge if energy is full
  if (playerData.energy === playerData.maxEnergy && tray) {
    tray.setToolTip(`Folkhart - ⚡ Energy Full!`);
  } else if (tray) {
    tray.setToolTip('Folkhart - Cozy Fantasy RPG');
  }
});

ipcMain.on('set-badge', (event, text) => {
  // Set app badge (macOS/Linux)
  if (app.setBadgeCount) {
    const count = parseInt(text) || 0;
    app.setBadgeCount(count);
  }
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

// Energy tracking
let lastEnergyNotification = 0;
ipcMain.on('energy-status', (event, data) => {
  const { energy, maxEnergy } = data;
  
  // Notify when energy is full (throttle to once every 5 minutes)
  if (energy === maxEnergy) {
    const now = Date.now();
    if (now - lastEnergyNotification > 300000) { // 5 minutes
      showNotification({
        title: '⚡ Energy Full!',
        body: 'Your energy is fully restored. Time to adventure!',
        urgency: 'low',
        silent: false
      });
      lastEnergyNotification = now;
    }
  }
});

// Guild notifications
ipcMain.on('guild-message', (event, data) => {
  const { username, message, isMention } = data;
  
  // Only notify if window is not focused or if it's a mention
  if (!mainWindow.isFocused() || isMention) {
    showNotification({
      title: isMention ? `💬 ${username} mentioned you!` : `💬 ${username}`,
      body: message.substring(0, 100),
      urgency: isMention ? 'normal' : 'low'
    });
  }
});

ipcMain.on('guild-invite', (event, data) => {
  const { guildName, inviterName } = data;
  showNotification({
    title: '🏰 Guild Invitation!',
    body: `${inviterName} invited you to join ${guildName}`,
    urgency: 'normal'
  });
});

ipcMain.on('guild-event', (event, data) => {
  const { eventType, message } = data;
  showNotification({
    title: `🏰 Guild Event: ${eventType}`,
    body: message,
    urgency: 'low'
  });
});

// Friend system
ipcMain.on('friend-request', (event, data) => {
  const { username } = data;
  showNotification({
    title: '👋 Friend Request',
    body: `${username} wants to be your friend!`,
    urgency: 'normal'
  });
});

ipcMain.on('friend-online', (event, data) => {
  const { username } = data;
  showNotification({
    title: '🟢 Friend Online',
    body: `${username} is now online!`,
    urgency: 'low',
    silent: true
  });
});

ipcMain.on('direct-message', (event, data) => {
  const { username, message } = data;
  showNotification({
    title: `💬 ${username}`,
    body: message.substring(0, 100),
    urgency: 'normal'
  });
});

// Server chat mention
ipcMain.on('server-chat-mention', (event, data) => {
  const { username, message } = data;
  showNotification({
    title: `📢 ${username} mentioned you!`,
    body: message.substring(0, 100),
    urgency: 'normal'
  });
});

// Idle farming complete
ipcMain.on('idle-complete', (event, data) => {
  const { gold, exp } = data;
  showNotification({
    title: '😴 Idle Farming Complete!',
    body: `Earned ${gold}g and ${exp} XP while you were away`,
    urgency: 'normal'
  });
});

// Dungeon complete
ipcMain.on('dungeon-complete', (event, data) => {
  const { dungeonName, gold, exp, items } = data;
  const itemsText = items && items.length > 0 ? `\nLoot: ${items.join(', ')}` : '';
  showNotification({
    title: '✅ Dungeon Complete!',
    body: `${dungeonName}\n💰 ${gold}g | ⭐ ${exp} XP${itemsText}`,
    urgency: 'normal'
  });
});

// Level up
ipcMain.on('level-up', (event, data) => {
  const { newLevel } = data;
  showNotification({
    title: '🎉 Level Up!',
    body: `Congratulations! You reached level ${newLevel}!`,
    urgency: 'normal'
  });
});

// Achievement unlocked
ipcMain.on('achievement-unlocked', (event, data) => {
  const { title, description } = data;
  showNotification({
    title: `🏆 Achievement Unlocked!`,
    body: `${title}\n${description}`,
    urgency: 'normal'
  });
});

// Item sold/traded
ipcMain.on('item-sold', (event, data) => {
  const { itemName, gold } = data;
  showNotification({
    title: '💰 Item Sold!',
    body: `${itemName} sold for ${gold}g`,
    urgency: 'low',
    silent: true
  });
});

// Flash window for important notifications
ipcMain.on('flash-window', () => {
  if (mainWindow && !mainWindow.isFocused()) {
    mainWindow.flashFrame(true);
  }
});

// Window controls
ipcMain.on('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// App Events
app.whenReady().then(() => {
  createWindow();
  createTray();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, keep app running when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

// Auto-updater setup (for future use with electron-updater)
// const { autoUpdater } = require('electron-updater');
// autoUpdater.checkForUpdatesAndNotify();
