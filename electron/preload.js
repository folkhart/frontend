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
