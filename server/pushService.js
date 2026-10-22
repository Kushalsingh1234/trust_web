import admin from 'firebase-admin';

class PushService {
  static initialized = false;
  static messaging = null;
  static firestore = null;

  static init() {
    if (this.initialized) return;

    try {
      // Initialize Firebase Admin with project credentials or default application credentials
      if (!admin.apps.length) {
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || 'trust-77f44'
        });
      }

      this.messaging = admin.messaging();
      this.firestore = admin.firestore();
      this.initialized = true;
      console.log('[PushService] Firebase Admin initialized for project trust-77f44.');

      // Start listening to new Firestore events for automatic push notifications
      this.startFirestoreListeners();
    } catch (err) {
      console.warn('[PushService] Initialization note (waiting for credentials):', err.message);
    }
  }

  /**
   * Send notification to all registered admin devices
   */
  static async sendAdminNotification({ title, body, data = {}, category = 'alert' }) {
    if (!this.initialized || !this.messaging || !this.firestore) {
      console.warn('[PushService] Firebase messaging not initialized yet.');
      return { success: false, reason: 'uninitialized' };
    }

    try {
      // 1. Fetch registered admin device tokens
      const snapshot = await this.firestore.collection('admin_devices').get();
      if (snapshot.empty) {
        console.log('[PushService] No admin devices registered yet in admin_devices collection.');
        return { success: false, reason: 'no_devices' };
      }

      const tokens = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        if (d?.token && typeof d.token === 'string') {
          tokens.push(d.token);
        }
      });

      if (tokens.length === 0) {
        return { success: false, reason: 'no_valid_tokens' };
      }

      console.log(`[PushService] Sending notification to ${tokens.length} admin device(s)...`);

      // 2. Build multi-cast payload with Android high priority & sound
      const message = {
        tokens,
        notification: {
          title,
          body
        },
        data: {
          ...data,
          category,
          timestamp: new Date().toISOString()
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'trust_admin_alerts',
            sound: 'default',
            priority: 'high',
            defaultVibrateTimings: true,
            color: '#b45309',
            icon: 'ic_launcher'
          }
        }
      };

      const response = await this.messaging.sendEachForMulticast(message);
      console.log(`[PushService] Notification dispatched: ${response.successCount} success, ${response.failureCount} failed.`);

      // Clean up invalid or unregistered tokens
      if (response.failureCount > 0) {
        response.responses.forEach(async (resp, idx) => {
          if (!resp.success) {
            const errCode = resp.error?.code;
            if (
              errCode === 'messaging/invalid-registration-token' ||
              errCode === 'messaging/registration-token-not-registered'
            ) {
              const staleToken = tokens[idx];
              try {
                await this.firestore.collection('admin_devices').doc(staleToken).delete();
                console.log(`[PushService] Removed invalid token from admin_devices: ${staleToken.slice(0, 10)}...`);
              } catch (e) {}
            }
          }
        });
      }

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount
      };
    } catch (err) {
      console.error('[PushService] sendAdminNotification error:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Listen to real-time additions on membershipApplications, donations, and helpRequests
   */
  static startFirestoreListeners() {
    if (!this.firestore) return;

    let initialLoadDoneApps = false;
    let initialLoadDoneDonations = false;
    let initialLoadDoneHelp = false;

    // 1. Listen for new Membership Applications
    try {
      this.firestore.collection('membershipApplications').onSnapshot((snapshot) => {
        if (!initialLoadDoneApps) {
          initialLoadDoneApps = true;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const applicantName = data?.fullName || data?.applicantName || 'नया आवेदक';
            const cat = data?.category === 'catA' ? 'श्रेणी-क' : data?.category === 'catC' ? 'श्रेणी-ग' : 'श्रेणी-ख';
            const fee = data?.membershipFee || 200;

            this.sendAdminNotification({
              title: '🔔 नया सदस्यता आवेदन प्राप्त हुआ!',
              body: `${applicantName} (${cat}) ने सदस्यता हेतु आवेदन किया है। शुल्क: ₹${fee}`,
              data: {
                tab: 'memberships',
                docId: change.doc.id,
                type: 'membership_application'
              }
            });
          }
        });
      }, (err) => console.warn('[PushService] membershipApplications listener note:', err.message));
    } catch (e) {}

    // 2. Listen for new Donations / Samarpan
    try {
      this.firestore.collection('donations').onSnapshot((snapshot) => {
        if (!initialLoadDoneDonations) {
          initialLoadDoneDonations = true;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const donor = data?.donorName || data?.fullName || 'दानदाता';
            const amount = data?.amount || data?.claimedAmount || data?.verifiedAmount || 0;

            this.sendAdminNotification({
              title: '💰 नया दान/समर्पण प्राप्त हुआ!',
              body: `${donor} द्वारा ₹${Number(amount).toLocaleString('en-IN')} का समर्पण किया गया।`,
              data: {
                tab: 'donations',
                docId: change.doc.id,
                type: 'donation'
              }
            });
          }
        });
      }, (err) => console.warn('[PushService] donations listener note:', err.message));
    } catch (e) {}

    // 3. Listen for new Help Requests
    try {
      this.firestore.collection('helpRequests').onSnapshot((snapshot) => {
        if (!initialLoadDoneHelp) {
          initialLoadDoneHelp = true;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const name = data?.fullName || 'प्रार्थी';
            const helpType = data?.helpType || 'सहायता प्रार्थना';

            this.sendAdminNotification({
              title: '🙏 नई सहायता प्रार्थना प्राप्त हुई!',
              body: `${name} ने ${helpType} हेतु अनुरोध प्रेषित किया है।`,
              data: {
                tab: 'helpRequests',
                docId: change.doc.id,
                type: 'help_request'
              }
            });
          }
        });
      }, (err) => console.warn('[PushService] helpRequests listener note:', err.message));
    } catch (e) {}
  }
}

export default PushService;
