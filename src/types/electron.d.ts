export interface ElectronAPI {
  // Notification methods
  notify: (options: NotificationOptions) => void;
  
  // Tray methods
  updateTray: (playerData: TrayPlayerData) => void;
  
  // Badge methods
  setBadge: (count: number) => void;
  
  // Energy tracking
  sendEnergyStatus: (data: { energy: number; maxEnergy: number }) => void;
  
  // Guild notifications
  sendGuildMessage: (data: { username: string; message: string; isMention?: boolean }) => void;
  sendGuildInvite: (data: { guildName: string; inviterName: string }) => void;
  sendGuildEvent: (data: { eventType: string; message: string }) => void;
  
  // Friend system
  sendFriendRequest: (data: { username: string }) => void;
  sendFriendOnline: (data: { username: string }) => void;
  sendDirectMessage: (data: { username: string; message: string }) => void;
  
  // Game events
  sendIdleComplete: (data: { gold: number; exp: number }) => void;
  sendDungeonComplete: (data: { dungeonName: string; gold: number; exp: number; items?: string[] }) => void;
  sendLevelUp: (data: { newLevel: number }) => void;
  sendAchievementUnlocked: (data: { title: string; description: string }) => void;
  sendItemSold: (data: { itemName: string; gold: number }) => void;
  
  // Window actions
  flashWindow: () => void;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  isMaximized: () => Promise<boolean>;
  
  // App info
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  
  // Event listeners
  onNotificationClicked: (callback: (data: any) => void) => void;
  onWindowFocus: (callback: (focused: boolean) => void) => void;
  onWindowBlur: (callback: (focused: boolean) => void) => void;
  
  // Platform checks
  isElectron: boolean;
  platform: string;
  isWindows: boolean;
  isMac: boolean;
  isLinux: boolean;
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  silent?: boolean;
  urgency?: 'normal' | 'critical' | 'low';
  onClick?: any;
}

export interface TrayPlayerData {
  username: string;
  level: number;
  energy: number;
  maxEnergy: number;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export {};
