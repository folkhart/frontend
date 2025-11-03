import { useEffect, useCallback } from 'react';
import type { NotificationOptions, TrayPlayerData } from '../types/electron';

export function useElectron() {
  const isElectron = typeof window !== 'undefined' && window.electron?.isElectron;

  // Show notification
  const notify = useCallback((options: NotificationOptions) => {
    if (isElectron && window.electron) {
      window.electron.notify(options);
    }
  }, [isElectron]);

  // Update tray with player data
  const updateTray = useCallback((playerData: TrayPlayerData) => {
    if (isElectron && window.electron) {
      window.electron.updateTray(playerData);
    }
  }, [isElectron]);

  // Set badge count
  const setBadge = useCallback((count: number) => {
    if (isElectron && window.electron) {
      window.electron.setBadge(count);
    }
  }, [isElectron]);

  // Get app version
  const getAppVersion = useCallback(async () => {
    if (isElectron && window.electron) {
      return await window.electron.getAppVersion();
    }
    return null;
  }, [isElectron]);

  // Get platform
  const getPlatform = useCallback(async () => {
    if (isElectron && window.electron) {
      return await window.electron.getPlatform();
    }
    return null;
  }, [isElectron]);

  // Platform checks
  const platform = {
    isWindows: isElectron && window.electron?.isWindows,
    isMac: isElectron && window.electron?.isMac,
    isLinux: isElectron && window.electron?.isLinux,
    platform: isElectron && window.electron?.platform
  };

  // Energy tracking
  const sendEnergyStatus = useCallback((energy: number, maxEnergy: number) => {
    if (isElectron && window.electron) {
      window.electron.sendEnergyStatus({ energy, maxEnergy });
    }
  }, [isElectron]);

  // Guild methods
  const sendGuildMessage = useCallback((username: string, message: string, isMention?: boolean) => {
    if (isElectron && window.electron) {
      window.electron.sendGuildMessage({ username, message, isMention });
    }
  }, [isElectron]);

  const sendGuildInvite = useCallback((guildName: string, inviterName: string) => {
    if (isElectron && window.electron) {
      window.electron.sendGuildInvite({ guildName, inviterName });
    }
  }, [isElectron]);

  const sendGuildEvent = useCallback((eventType: string, message: string) => {
    if (isElectron && window.electron) {
      window.electron.sendGuildEvent({ eventType, message });
    }
  }, [isElectron]);

  // Friend system methods
  const sendFriendRequest = useCallback((username: string) => {
    if (isElectron && window.electron) {
      window.electron.sendFriendRequest({ username });
    }
  }, [isElectron]);

  const sendFriendOnline = useCallback((username: string) => {
    if (isElectron && window.electron) {
      window.electron.sendFriendOnline({ username });
    }
  }, [isElectron]);

  const sendDirectMessage = useCallback((username: string, message: string) => {
    if (isElectron && window.electron) {
      window.electron.sendDirectMessage({ username, message });
    }
  }, [isElectron]);

  const sendServerChatMention = useCallback((username: string, message: string) => {
    if (isElectron && window.electron) {
      window.electron.sendServerChatMention({ username, message });
    }
  }, [isElectron]);

  // Game event methods
  const sendIdleComplete = useCallback((gold: number, exp: number) => {
    if (isElectron && window.electron) {
      window.electron.sendIdleComplete({ gold, exp });
    }
  }, [isElectron]);

  const sendDungeonComplete = useCallback((dungeonName: string, gold: number, exp: number, items?: string[]) => {
    if (isElectron && window.electron) {
      window.electron.sendDungeonComplete({ dungeonName, gold, exp, items });
    }
  }, [isElectron]);

  const sendLevelUp = useCallback((newLevel: number) => {
    if (isElectron && window.electron) {
      window.electron.sendLevelUp({ newLevel });
    }
  }, [isElectron]);

  const sendAchievementUnlocked = useCallback((title: string, description: string) => {
    if (isElectron && window.electron) {
      window.electron.sendAchievementUnlocked({ title, description });
    }
  }, [isElectron]);

  const sendItemSold = useCallback((itemName: string, gold: number) => {
    if (isElectron && window.electron) {
      window.electron.sendItemSold({ itemName, gold });
    }
  }, [isElectron]);

  // Window actions
  const flashWindow = useCallback(() => {
    if (isElectron && window.electron) {
      window.electron.flashWindow();
    }
  }, [isElectron]);

  return {
    isElectron,
    notify,
    updateTray,
    setBadge,
    getAppVersion,
    getPlatform,
    platform,
    // Energy
    sendEnergyStatus,
    // Guild
    sendGuildMessage,
    sendGuildInvite,
    sendGuildEvent,
    // Friends
    sendFriendRequest,
    sendFriendOnline,
    sendDirectMessage,
    sendServerChatMention,
    // Game events
    sendIdleComplete,
    sendDungeonComplete,
    sendLevelUp,
    sendAchievementUnlocked,
    sendItemSold,
    // Window
    flashWindow
  };
}

// Notification helpers for common game events
export function useGameNotifications() {
  const { notify, isElectron } = useElectron();

  const notifyDungeonComplete = useCallback((dungeonName: string, rewards: { gold: number; exp: number; items?: string[] }) => {
    if (!isElectron) return;
    
    const itemsText = rewards.items && rewards.items.length > 0 
      ? `\nLoot: ${rewards.items.join(', ')}` 
      : '';
    
    notify({
      title: '✅ Dungeon Complete!',
      body: `${dungeonName}\n💰 ${rewards.gold}g | ⭐ ${rewards.exp} XP${itemsText}`,
      onClick: { action: 'openGame', tab: 'adventure' }
    });
  }, [notify, isElectron]);

  const notifyEnergyFull = useCallback(() => {
    if (!isElectron) return;
    
    notify({
      title: '⚡ Energy Full!',
      body: 'Your energy is fully restored. Time to adventure!',
      urgency: 'low',
      onClick: { action: 'openGame', tab: 'adventure' }
    });
  }, [notify, isElectron]);

  const notifyGuildMessage = useCallback((username: string, message: string) => {
    if (!isElectron) return;
    
    notify({
      title: `💬 ${username}`,
      body: message.substring(0, 100), // Limit message length
      onClick: { action: 'openGame', tab: 'guild' }
    });
  }, [notify, isElectron]);

  const notifyFriendRequest = useCallback((username: string) => {
    if (!isElectron) return;
    
    notify({
      title: '👋 Friend Request',
      body: `${username} wants to be your friend!`,
      urgency: 'normal'
    });
  }, [notify, isElectron]);

  const notifyLevelUp = useCallback((newLevel: number) => {
    if (!isElectron) return;
    
    notify({
      title: '🎉 Level Up!',
      body: `Congratulations! You reached level ${newLevel}!`,
      urgency: 'normal'
    });
  }, [notify, isElectron]);

  const notifyIdleComplete = useCallback((rewards: { gold: number; exp: number }) => {
    if (!isElectron) return;
    
    notify({
      title: '😴 Idle Farming Complete!',
      body: `Earned ${rewards.gold}g and ${rewards.exp} XP while you were away`,
      urgency: 'low',
      onClick: { action: 'openGame', tab: 'village' }
    });
  }, [notify, isElectron]);

  const notifyGuildInvite = useCallback((guildName: string) => {
    if (!isElectron) return;
    
    notify({
      title: '🏰 Guild Invitation',
      body: `You've been invited to join ${guildName}!`,
      urgency: 'normal',
      onClick: { action: 'openGame', tab: 'guild' }
    });
  }, [notify, isElectron]);

  const notifyItemSold = useCallback((itemName: string, gold: number) => {
    if (!isElectron) return;
    
    notify({
      title: '💰 Item Sold!',
      body: `${itemName} sold for ${gold}g`,
      urgency: 'low',
      silent: true
    });
  }, [notify, isElectron]);

  return {
    notifyDungeonComplete,
    notifyEnergyFull,
    notifyGuildMessage,
    notifyFriendRequest,
    notifyLevelUp,
    notifyIdleComplete,
    notifyGuildInvite,
    notifyItemSold
  };
}

// Hook to sync tray with player state
export function useTraySync(player: any, character: any) {
  const { updateTray, isElectron } = useElectron();

  useEffect(() => {
    if (!isElectron || !player || !character) return;

    updateTray({
      username: character.name,
      level: character.level,
      energy: player.energy,
      maxEnergy: player.maxEnergy
    });
  }, [player?.energy, player?.maxEnergy, character?.name, character?.level, isElectron, updateTray]);
}

// Hook to auto-track energy and send notifications
export function useEnergyTracking(player: any) {
  const { sendEnergyStatus, isElectron } = useElectron();

  useEffect(() => {
    if (!isElectron || !player) return;

    // Send energy status updates
    sendEnergyStatus(player.energy, player.maxEnergy);
  }, [player?.energy, player?.maxEnergy, isElectron, sendEnergyStatus]);
}
