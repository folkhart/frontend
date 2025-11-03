const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Notification API
  notify: (options) => {
    ipcRenderer.send('show-notification', options);
  },

  // Tray API
  updateTray: (playerData) => {
    ipcRenderer.send('update-tray', playerData);
  },

  // Badge API (for unread messages, etc.)
  setBadge: (count) => {
    ipcRenderer.send('set-badge', count.toString());
  },

  // Energy tracking
  sendEnergyStatus: (data) => {
    ipcRenderer.send('energy-status', data);
  },

  // Guild notifications
  sendGuildMessage: (data) => {
    ipcRenderer.send('guild-message', data);
  },

  sendGuildInvite: (data) => {
    ipcRenderer.send('guild-invite', data);
  },

  sendGuildEvent: (data) => {
    ipcRenderer.send('guild-event', data);
  },

  // Friend system
  sendFriendRequest: (data) => {
    ipcRenderer.send('friend-request', data);
  },

  sendFriendOnline: (data) => {
    ipcRenderer.send('friend-online', data);
  },

  sendDirectMessage: (data) => {
    ipcRenderer.send('direct-message', data);
  },

  sendServerChatMention: (data) => {
    ipcRenderer.send('server-chat-mention', data);
  },

  // Game events
  sendIdleComplete: (data) => {
    ipcRenderer.send('idle-complete', data);
  },

  sendDungeonComplete: (data) => {
    ipcRenderer.send('dungeon-complete', data);
  },

  sendLevelUp: (data) => {
    ipcRenderer.send('level-up', data);
  },

  sendAchievementUnlocked: (data) => {
    ipcRenderer.send('achievement-unlocked', data);
  },

  sendItemSold: (data) => {
    ipcRenderer.send('item-sold', data);
  },

  // Window actions
  flashWindow: () => {
    ipcRenderer.send('flash-window');
  },

  minimizeWindow: () => {
    ipcRenderer.send('window-minimize');
  },

  maximizeWindow: () => {
    ipcRenderer.send('window-maximize');
  },

  closeWindow: () => {
    ipcRenderer.send('window-close');
  },

  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  // Event listeners
  onNotificationClicked: (callback) => {
    ipcRenderer.on('notification-clicked', (event, data) => callback(data));
  },

  onWindowFocus: (callback) => {
    ipcRenderer.on('window-focus', (event, focused) => callback(focused));
  },

  onWindowBlur: (callback) => {
    ipcRenderer.on('window-blur', (event, focused) => callback(focused));
  },

  // Check if running in Electron
  isElectron: true,
  
  // Platform info
  platform: process.platform,
  isWindows: process.platform === 'win32',
  isMac: process.platform === 'darwin',
  isLinux: process.platform === 'linux'
});
