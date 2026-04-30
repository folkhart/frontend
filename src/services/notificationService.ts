import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

class NotificationService {
  private isCapacitor = Capacitor.isNativePlatform();
  private permissionGranted = false;

  async initialize() {
    if (this.isCapacitor) {
      // Request permission for notifications
      const permission = await LocalNotifications.requestPermissions();
      this.permissionGranted = permission.display === 'granted';
      
      if (this.permissionGranted) {
        console.log('✅ Android notification permission granted');
      }
    }
  }

  private getNotificationId(): number {
    // Android needs int (max 2,147,483,647), so use modulo to keep it small
    return Math.floor(Date.now() % 2147483647);
  }

  private async sendGenericNotification(title: string, body: string) {
    if (this.isCapacitor && this.permissionGranted) {
      // Android/iOS - Use Capacitor Local Notifications
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: this.getNotificationId(),
            schedule: { at: new Date(Date.now() + 100) }, // Show immediately
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: null,
          },
        ],
      });
    } else if (window.electron) {
      // Electron - Use existing notify method
      window.electron.notify({ title, body });
    } else {
      // Web fallback - Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      }
    }
  }

  // Dungeon Complete
  async notifyDungeonComplete(dungeonName: string, gold: number, exp: number, items?: string[]) {
    if (window.electron) {
      window.electron.sendDungeonComplete({ dungeonName, gold, exp, items });
    } else {
      const itemsText = items && items.length > 0 ? ` | Items: ${items.join(', ')}` : '';
      await this.sendGenericNotification(
        '🏆 Dungeon Complete!',
        `${dungeonName} | +${gold}g, +${exp} EXP${itemsText}`
      );
    }
  }

  // Idle Farming Complete
  async notifyIdleFarmingComplete(gold: number, exp: number) {
    if (window.electron) {
      window.electron.sendIdleComplete({ gold, exp });
    } else {
      await this.sendGenericNotification(
        '🌾 Idle Farming Complete!',
        `+${gold} gold, +${exp} EXP`
      );
    }
  }

  // Level Up
  async notifyLevelUp(newLevel: number) {
    if (window.electron) {
      window.electron.sendLevelUp({ newLevel });
    } else {
      await this.sendGenericNotification(
        '⬆️ Level Up!',
        `You reached level ${newLevel}!`
      );
    }
  }

  // Energy Full
  async notifyEnergyFull() {
    if (window.electron) {
      window.electron.notify({
        title: '⚡ Energy Full!',
        body: 'Your energy is full. Time to adventure!',
      });
    } else {
      await this.sendGenericNotification(
        '⚡ Energy Full!',
        'Your energy is full. Time to adventure!'
      );
    }
  }

  // Boss Ready
  async notifyBossReady(dungeonName: string) {
    if (window.electron) {
      window.electron.notify({
        title: '👹 Boss Ready!',
        body: `You can fight ${dungeonName} boss again!`,
      });
    } else {
      await this.sendGenericNotification(
        '👹 Boss Ready!',
        `You can fight ${dungeonName} boss again!`
      );
    }
  }

  // Achievement Unlocked
  async notifyAchievementUnlocked(title: string, description: string) {
    if (window.electron) {
      window.electron.sendAchievementUnlocked({ title, description });
    } else {
      await this.sendGenericNotification(
        `🏅 ${title}`,
        description
      );
    }
  }

  // Item Sold
  async notifyItemSold(itemName: string, gold: number) {
    if (window.electron) {
      window.electron.sendItemSold({ itemName, gold });
    } else {
      await this.sendGenericNotification(
        '💰 Item Sold!',
        `${itemName} sold for ${gold} gold`
      );
    }
  }
}

export const notificationService = new NotificationService();
