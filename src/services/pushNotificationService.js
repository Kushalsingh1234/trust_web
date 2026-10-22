import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { db } from '../firebase/config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

class PushNotificationService {
  static initialized = false;
  static currentToken = null;

  static async init(currentUser = null, onNotificationAction = null) {
    if (!Capacitor.isNativePlatform()) {
      console.log('[Push] Non-native platform, skipping native push notification init.');
      return;
    }

    if (this.initialized) {
      if (currentUser && this.currentToken) {
        await this.syncTokenWithFirestore(this.currentToken, currentUser);
      }
      return;
    }

    try {
      // 1. Create high priority notification channel for Android
      try {
        await PushNotifications.createChannel({
          id: 'trust_admin_alerts',
          name: 'Trust Admin Alerts',
          description: 'Instant notifications for new membership applications, donations, and help requests',
          importance: 5,
          visibility: 1,
          vibration: true,
          lights: true,
          lightColor: '#b45309'
        });
      } catch (channelErr) {
        console.warn('[Push] Channel creation note:', channelErr);
      }

      // 2. Check and request permissions
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('[Push] Push notification permission not granted:', permStatus.receive);
        return;
      }

      // 3. Register with Apple / Google APNS / FCM
      await PushNotifications.register();

      // 4. Token event listener
      PushNotifications.addListener('registration', async (token) => {
        console.log('[Push] Device registered with FCM token:', token.value);
        this.currentToken = token.value;
        await this.syncTokenWithFirestore(token.value, currentUser);
      });

      // 5. Error listener
      PushNotifications.addListener('registrationError', (error) => {
        console.error('[Push] Error on push registration:', error);
      });

      // 6. Foreground notification received
      PushNotifications.addListener('pushNotificationReceived', async (notification) => {
        console.log('[Push] Foreground notification received:', notification);
        try {
          await Haptics.notification({ type: NotificationType.Success });
        } catch (hErr) {}

        // Broadcast event so UI can display in-app banner or toast
        window.dispatchEvent(
          new CustomEvent('admin_push_received', {
            detail: notification
          })
        );
      });

      // 7. Notification tapped / action performed
      PushNotifications.addListener('pushNotificationActionPerformed', async (action) => {
        console.log('[Push] Push notification action performed:', action);
        const data = action?.notification?.data;
        const targetTab = data?.tab || data?.targetTab;

        if (targetTab) {
          window.dispatchEvent(
            new CustomEvent('admin_switch_tab', {
              detail: targetTab
            })
          );
        }

        if (typeof onNotificationAction === 'function') {
          onNotificationAction(action);
        }
      });

      this.initialized = true;
    } catch (err) {
      console.error('[Push] Failed to initialize push notifications:', err);
    }
  }

  static async syncTokenWithFirestore(token, user) {
    if (!token) return;
    try {
      const deviceRef = doc(db, 'admin_devices', token);
      await setDoc(deviceRef, {
        token,
        role: 'admin',
        platform: Capacitor.getPlatform(),
        adminUid: user?.uid || 'admin',
        adminEmail: user?.email || 'admin@trust.in',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }, { merge: true });
      console.log('[Push] Device FCM token successfully synced to Firestore.');
    } catch (err) {
      console.warn('[Push] Firestore sync token error:', err);
    }
  }
}

export default PushNotificationService;
