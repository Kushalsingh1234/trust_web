import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory for storing session credentials
const SESSIONS_DIR = path.resolve(__dirname, '../storage/whatsapp_sessions');
const SESSION_ID = 'trust_admin';

class WhatsAppService {
  static sock = null;
  static state = {
    status: 'DISCONNECTED', // 'DISCONNECTED' | 'INITIALIZING' | 'QR_READY' | 'CONNECTED'
    qrCodeDataUrl: null,
    phoneNumber: null,
    connectedAt: null,
    lastError: null
  };
  static reconnectAttempts = 0;
  static logger = pino({ level: 'silent' });
  static messageStore = new Map();

  static saveMessage(id, message) {
    if (!id || !message) return;
    this.messageStore.set(id, message);
    if (this.messageStore.size > 1000) {
      const firstKey = this.messageStore.keys().next().value;
      if (firstKey) this.messageStore.delete(firstKey);
    }
  }

  static async getMessage(key) {
    if (key?.id && this.messageStore.has(key.id)) {
      return this.messageStore.get(key.id);
    }
    return undefined;
  }

  static getSessionDir() {
    const dir = path.join(SESSIONS_DIR, SESSION_ID);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  /**
   * Auto-resume existing session on startup if creds.json exists
   */
  static async autoResumeSession() {
    try {
      const sessionDir = this.getSessionDir();
      const credsPath = path.join(sessionDir, 'creds.json');
      if (fs.existsSync(credsPath)) {
        console.log('[WhatsApp] Existing credentials found. Auto-resuming admin WhatsApp session...');
        await this.initSession();
      }
    } catch (err) {
      console.warn('[WhatsApp] Failed to auto-resume session:', err.message);
    }
  }

  static getStatus() {
    return this.state;
  }

  /**
   * Initialize or resume WhatsApp Web pairing session
   */
  static async initSession() {
    if (this.sock && this.state.status === 'CONNECTED') {
      return this.state;
    }

    const sessionDir = this.getSessionDir();
    const { state: authState, saveCreds } = await useMultiFileAuthState(sessionDir);

    this.state = {
      status: 'INITIALIZING',
      qrCodeDataUrl: null,
      phoneNumber: null,
      connectedAt: null,
      lastError: null
    };

    try {
      const sock = makeWASocket({
        auth: authState,
        printQRInTerminal: false,
        logger: this.logger,
        browser: ['Rashtriya Sanatan Trust', 'Chrome', '1.0.0'],
        syncFullHistory: false,
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: false,
        getMessage: async (key) => {
          return await this.getMessage(key);
        }
      });

      this.sock = sock;

      sock.ev.on('creds.update', saveCreds);

      // Retain messages in cache for decryption retry requests
      sock.ev.on('messages.upsert', async ({ messages }) => {
        if (!Array.isArray(messages)) return;
        for (const m of messages) {
          if (m?.key?.id && m?.message) {
            this.saveMessage(m.key.id, m.message);
          }
        }
      });

      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            const qrCodeDataUrl = await QRCode.toDataURL(qr, {
              margin: 2,
              scale: 8,
              color: { dark: '#1e293b', light: '#ffffff' }
            });
            this.state = {
              status: 'QR_READY',
              qrCodeDataUrl,
              phoneNumber: null,
              connectedAt: null,
              lastError: null
            };
            console.log('[WhatsApp] QR code generated. Waiting for admin scan...');
          } catch (qrErr) {
            console.error('[WhatsApp] QR generation failed:', qrErr);
          }
        }

        if (connection === 'open') {
          const userJid = sock.user?.id || '';
          const rawNum = userJid.split(':')[0] || userJid.split('@')[0];
          const formattedPhone = rawNum.startsWith('91') ? `+${rawNum}` : `+91 ${rawNum}`;

          this.state = {
            status: 'CONNECTED',
            qrCodeDataUrl: null,
            phoneNumber: formattedPhone,
            connectedAt: new Date().toISOString(),
            lastError: null
          };
          this.reconnectAttempts = 0;
          console.log(`[WhatsApp] Admin WhatsApp connected successfully as ${formattedPhone}!`);

          if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
          }

          // 25-second keepalive ping to prevent socket/router idle drop
          this.keepAliveInterval = setInterval(() => {
            try {
              if (this.sock?.ws && this.sock.ws.readyState === 1) {
                this.sock.ws.ping();
              }
            } catch (e) {}
          }, 25000);
        }

        if (connection === 'close') {
          if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
          }

          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;
          const isRestart = statusCode === DisconnectReason.restartRequired;

          console.log(`[WhatsApp] Connection closed. Status code: ${statusCode}, LoggedOut: ${isLoggedOut}, Restart: ${isRestart}`);

          if (!isLoggedOut) {
            this.reconnectAttempts++;
            // Reconnect forever - immediate for restartRequired, exponential backoff for network drops up to 30s
            const delay = isRestart ? 1000 : Math.min(30000, 2000 + (Math.min(this.reconnectAttempts, 10) * 2000));
            console.log(`[WhatsApp] Auto-reconnecting in ${delay}ms (reconnect cycle #${this.reconnectAttempts})...`);

            this.state = {
              status: 'INITIALIZING',
              qrCodeDataUrl: null,
              phoneNumber: null,
              connectedAt: null,
              lastError: `Reconnecting (cycle #${this.reconnectAttempts})...`
            };

            setTimeout(() => {
              this.initSession().catch(console.error);
            }, delay);
          } else {
            console.log('[WhatsApp] Phone explicitly disconnected/logged out.');
            this.state = {
              status: 'DISCONNECTED',
              qrCodeDataUrl: null,
              phoneNumber: null,
              connectedAt: null,
              lastError: 'Logged out from phone'
            };
            this.sock = null;
            try {
              const sessionDir = this.getSessionDir();
              if (fs.existsSync(sessionDir)) {
                fs.rmSync(sessionDir, { recursive: true, force: true });
                console.log('[WhatsApp] Cleared expired credentials from disk.');
              }
            } catch (e) {
              console.error('[WhatsApp] Failed to clear expired session:', e);
            }
          }
        }
      });

      return this.state;
    } catch (err) {
      console.error('[WhatsApp] initSession error:', err);
      this.state = {
        status: 'DISCONNECTED',
        qrCodeDataUrl: null,
        phoneNumber: null,
        connectedAt: null,
        lastError: err.message
      };
      return this.state;
    }
  }

  static formatPhoneToJid(phone) {
    if (!phone) return '';
    let clean = phone.replace(/\D/g, '');
    if (clean.length === 10) {
      clean = `91${clean}`;
    }
    return `${clean}@s.whatsapp.net`;
  }

  /**
   * Send a direct message (text and optional image) through the active Baileys socket
   */
  static async sendMessage(recipientPhone, messageText, imageUrl = null) {
    if (!this.sock || this.state.status !== 'CONNECTED') {
      return {
        success: false,
        error: 'WhatsApp is not connected. Please scan the QR code in Admin Settings.'
      };
    }

    try {
      const jid = this.formatPhoneToJid(recipientPhone);
      if (!jid) {
        return { success: false, error: 'Invalid recipient phone number.' };
      }

      let res;
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
        res = await this.sock.sendMessage(jid, {
          image: { url: imageUrl },
          caption: messageText
        });
      } else {
        res = await this.sock.sendMessage(jid, {
          text: messageText
        });
      }

      if (res?.key?.id && res?.message) {
        this.saveMessage(res.key.id, res.message);
      }

      return {
        success: true,
        messageId: res?.key?.id
      };
    } catch (err) {
      console.error(`[WhatsApp] Failed to send message to ${recipientPhone}:`, err);
      return {
        success: false,
        error: err.message || 'Failed to send WhatsApp message'
      };
    }
  }

  /**
   * Send a broadcast batch to multiple recipients with human-like delays
   */
  static async sendBroadcast(recipients, messageText, imageUrl = null, onProgress = null) {
    let sent = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i];
      const phone = r.phone || r.whatsapp || r.mobile;
      if (!phone) continue;

      const result = await this.sendMessage(phone, messageText, imageUrl);
      if (result.success) {
        sent++;
      } else {
        failed++;
        errors.push({ phone, error: result.error });
      }

      if (onProgress) {
        onProgress(i + 1, recipients.length, result.success);
      }

      // Add 2-4 seconds delay between recipients to prevent rate limits
      if (i < recipients.length - 1) {
        const delayMs = Math.floor(Math.random() * (4000 - 2000) + 2000);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return { sent, failed, errors };
  }

  /**
   * Disconnect and remove saved credentials from disk
   */
  static async disconnect() {
    if (this.sock) {
      try {
        await this.sock.logout();
      } catch (err) {
        console.warn('[WhatsApp] Logout error:', err.message);
      }
    }

    this.sock = null;
    this.state = {
      status: 'DISCONNECTED',
      qrCodeDataUrl: null,
      phoneNumber: null,
      connectedAt: null,
      lastError: null
    };

    const sessionDir = this.getSessionDir();
    if (fs.existsSync(sessionDir)) {
      try {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        console.log('[WhatsApp] Session credentials cleared from disk.');
      } catch (rmErr) {
        console.warn('[WhatsApp] Could not delete session folder:', rmErr.message);
      }
    }

    return true;
  }
}

export default WhatsAppService;
