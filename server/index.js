import express from 'express';
import cors from 'cors';
import WhatsAppService from './whatsappService.js';
import PushService from './pushService.js';

const app = express();
const PORT = process.env.PORT || 5002;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-with');
  if (req.headers['access-control-request-private-network']) {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Rashtriya Sanatan Trust WhatsApp Server' });
});

/**
 * GET /api/whatsapp/status
 * Get the current connection status and pairing QR code if ready
 */
app.get('/api/whatsapp/status', (req, res) => {
  try {
    const state = WhatsAppService.getStatus();
    return res.json({
      success: true,
      data: state
    });
  } catch (err) {
    console.error('WhatsApp status error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/whatsapp/connect
 * Initiate Baileys WhatsApp pairing and return QR code
 */
app.post('/api/whatsapp/connect', async (req, res) => {
  try {
    const state = await WhatsAppService.initSession();
    return res.json({
      success: true,
      message: 'WhatsApp pairing session initiated.',
      data: state
    });
  } catch (err) {
    console.error('WhatsApp connect error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/whatsapp/disconnect
 * Disconnect and remove saved session credentials from disk
 */
app.post('/api/whatsapp/disconnect', async (req, res) => {
  try {
    await WhatsAppService.disconnect();
    return res.json({
      success: true,
      message: 'WhatsApp session disconnected successfully.'
    });
  } catch (err) {
    console.error('WhatsApp disconnect error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/whatsapp/send-personal
 * Send a 1-to-1 personal WhatsApp message directly
 */
app.post('/api/whatsapp/send-personal', async (req, res) => {
  try {
    const { phone, message, imageUrl } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, message: 'Phone and message are required.' });
    }

    const result = await WhatsAppService.sendMessage(phone, message, imageUrl);
    if (result.success) {
      return res.json({
        success: true,
        message: 'Personal WhatsApp message sent successfully!',
        messageId: result.messageId
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.error || 'Failed to send WhatsApp message.'
      });
    }
  } catch (err) {
    console.error('WhatsApp send-personal error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/whatsapp/broadcast
 * Broadcast notice with optional image poster to all members/volunteers in background
 */
app.post('/api/whatsapp/broadcast', async (req, res) => {
  try {
    const { recipients, message, imageUrl, title } = req.body;
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ success: false, message: 'Recipients list is required.' });
    }
    if (!message) {
      return res.status(400).json({ success: false, message: 'Notice content is required.' });
    }

    const state = WhatsAppService.getStatus();
    if (state.status !== 'CONNECTED') {
      return res.status(400).json({
        success: false,
        message: 'Admin WhatsApp is not connected. Please scan the QR code in Settings first.'
      });
    }

    // Start sending in background without blocking the HTTP response
    console.log(`[WhatsApp Broadcast] Starting broadcast to ${recipients.length} recipients...`);
    WhatsAppService.sendBroadcast(recipients, message, imageUrl, (current, total, ok) => {
      console.log(`[WhatsApp Broadcast Progress] ${current}/${total} (Success: ${ok})`);
    }).then((summary) => {
      console.log(`[WhatsApp Broadcast Complete] Sent: ${summary.sent}, Failed: ${summary.failed}`);
    }).catch((err) => {
      console.error('[WhatsApp Broadcast Error]:', err);
    });

    return res.json({
      success: true,
      message: `WhatsApp broadcast initiated to ${recipients.length} recipients in the background!`,
      recipientCount: recipients.length
    });
  } catch (err) {
    console.error('WhatsApp broadcast error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/whatsapp/test-send
 * Send test message to verify session
 */
app.post('/api/whatsapp/test-send', async (req, res) => {
  try {
    const { targetPhone } = req.body;
    if (!targetPhone) {
      return res.status(400).json({ success: false, message: 'Please enter target phone number.' });
    }

    const testMessage = `🕉️ *राष्ट्रीय सनातन संस्कार सेवा संस्थान*\n\n✅ व्यवस्थापक व्हाट्सएप सफलतापूर्वक कनेक्ट हो गया है!\n\nअब सभी आधिकारिक सूचनाएं, पोस्टर व व्यक्तिगत संदेश इसी नंबर से सदस्यों व स्वयंसेवकों को स्वचालित रूप से भेजे जाएंगे।\n\n🌐 https://rashtriyasanatantrust.in`;

    const result = await WhatsAppService.sendMessage(targetPhone, testMessage);
    if (result.success) {
      return res.json({
        success: true,
        message: `Test message sent to ${targetPhone} successfully!`,
        messageId: result.messageId
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.error || 'Failed to send test message.'
      });
    }
  } catch (err) {
    console.error('WhatsApp test-send error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/admin/send-test-push
 * Send test push notification to verify Capacitor app notifications
 */
app.post('/api/admin/send-test-push', async (req, res) => {
  try {
    const { title, body } = req.body;
    const result = await PushService.sendAdminNotification({
      title: title || '🔔 व्यवस्थापक टेस्ट सूचना (Test Push)',
      body: body || 'पुश नोटिफिकेशन सफलतापूर्वक सक्रिय हो गया है! अब आपको सभी आवेदन व दान की सूचनाएं निरंतर प्राप्त होंगी।',
      data: { tab: 'memberships', type: 'test' }
    });
    return res.json({ success: true, result });
  } catch (err) {
    console.error('Test push error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

const server = app.listen(PORT, () => {
  console.log(`[Trust WhatsApp Server] Running on http://localhost:${PORT}`);
  // Auto-resume previously authenticated session from disk
  WhatsAppService.autoResumeSession();
  // Initialize Push Notification Service
  PushService.init();
});


server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[Trust WhatsApp Server] Port ${PORT} is already in use by another instance. WhatsApp server continues.`);
  } else {
    console.error('[Trust WhatsApp Server] Server error:', err);
  }
});

