import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

class NotificationService {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only available on native platforms');
      return;
    }

    try {
      // Request permission
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }

      // Register with Apple / Google to receive push via APNS/FCM
      await PushNotifications.register();

      // Listen for registration
      await PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success, token: ' + token.value);
        // Send this token to your backend
        this.savePushToken(token.value);
      });

      // Listen for registration errors
      await PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration: ' + JSON.stringify(error));
      });

      // Show us the notification payload if the app is open on our device
      await PushNotifications.addListener(
        'pushNotificationReceived',
        (notification) => {
          console.log('Push notification received: ', notification);
          
          // Show custom in-app notification
          this.showInAppNotification(notification);
        }
      );

      // Method called when tapping on a notification
      await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification) => {
          console.log('Push notification action performed', notification.actionId, notification.inputValue);
          
          // Handle notification tap (navigate to specific screen, etc.)
          this.handleNotificationTap(notification);
        }
      );

      this.initialized = true;
      console.log('✅ Push notifications initialized');
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  private async savePushToken(token: string) {
    try {
      // Send token to your backend
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;

      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/push-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      console.log('✅ Push token saved to backend');
    } catch (error) {
      console.error('Failed to save push token:', error);
    }
  }

  private showInAppNotification(notification: any) {
    // Show toast notification when app is in foreground
    const title = notification.title || 'Notification';
    const body = notification.body || '';
    
    // Use your existing toast system
    (window as any).showToast?.(`${title}: ${body}`, 'info');
  }

  private handleNotificationTap(notification: any) {
    // Handle different notification types
    const data = notification.notification.data;
    
    if (data?.type === 'dungeon_completed') {
      // Navigate to dungeons tab
      window.location.hash = '#/game?tab=dungeons';
    } else if (data?.type === 'level_up') {
      // Navigate to character stats
      window.location.hash = '#/game?tab=character';
    } else if (data?.type === 'guild_invite') {
      // Navigate to guild tab
      window.location.hash = '#/game?tab=guild';
    }
  }

  async getDeliveredNotifications() {
    const notificationList = await PushNotifications.getDeliveredNotifications();
    console.log('Delivered notifications', notificationList);
    return notificationList;
  }

  async removeAllDeliveredNotifications() {
    await PushNotifications.removeAllDeliveredNotifications();
  }
}

export const notificationService = new NotificationService();

// Helper function to send notifications based on user settings
export const sendGameNotification = (type: 'idleFarming' | 'levelUp' | 'energyRefill' | 'dungeonComplete' | 'guildInvite' | 'friendRequest', title: string, body: string, data?: any) => {
  try {
    // Check if user has this notification type enabled
    const settings = localStorage.getItem('notificationSettings');
    const notificationSettings = settings ? JSON.parse(settings) : {
      idleFarming: true,
      levelUp: true,
      energyRefill: true,
      dungeonComplete: true,
      guildInvite: true,
      friendRequest: true,
    };

    if (!notificationSettings[type]) {
      console.log(`Notification type ${type} is disabled by user`);
      return;
    }

    // If not on native platform, show toast instead
    if (!Capacitor.isNativePlatform()) {
      (window as any).showToast?.(title + ': ' + body, 'info');
      return;
    }

    // Send local notification
    import('@capacitor/local-notifications').then(({ LocalNotifications }) => {
      LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) }, // 1 second from now
            sound: 'default',
            attachments: undefined,
            actionTypeId: '',
            extra: { type, ...data },
          },
        ],
      });
    }).catch((error) => {
      console.error('Failed to send notification:', error);
    });
  } catch (error) {
    console.error('Error in sendGameNotification:', error);
  }
};
