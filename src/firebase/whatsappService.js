/**
 * WhatsApp Integration Service for Rashtriya Sanatan Sanskar Seva Sansthan (Trust)
 * Handles:
 * - Persistent Admin WhatsApp connection session
 * - Broadcast notices to members and volunteers
 * - Personal direct messages to members, volunteers, and help seekers
 * - Multi-provider support (Direct wa.me, UltraMsg, Green API, Custom Webhook)
 */

import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

export const DEFAULT_WHATSAPP_SETTINGS = {
  isConnected: false,
  adminPhone: '9794590044',
  adminName: 'Bajrangi Dubey (Trust Executive)',
  provider: 'direct', // 'direct' | 'ultramsg' | 'greenapi' | 'custom'
  instanceId: '',
  apiToken: '',
  apiEndpoint: '',
  autoOpenDelayMs: 1500,
  connectedAt: null,
  lastUsedAt: null
};

const LOCAL_STORAGE_KEY = 'rsssst_admin_whatsapp_session';

/**
 * Get cached WhatsApp session from localStorage
 */
export const getLocalWhatsAppSession = () => {
  if (typeof window === 'undefined') return DEFAULT_WHATSAPP_SETTINGS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_WHATSAPP_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('Could not read local WhatsApp session:', e);
  }
  return DEFAULT_WHATSAPP_SETTINGS;
};

/**
 * Save WhatsApp session to localStorage
 */
export const setLocalWhatsAppSession = (settings) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Could not save local WhatsApp session:', e);
  }
};

/**
 * Fetch WhatsApp Settings from Firestore with local fallback
 */
export const getAdminWhatsAppSettings = async () => {
  try {
    const ref = doc(db, 'settings', 'whatsapp');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = { ...DEFAULT_WHATSAPP_SETTINGS, ...snap.data() };
      setLocalWhatsAppSession(data);
      return data;
    }
  } catch (err) {
    console.warn('Error reading WhatsApp settings from Firestore:', err);
  }
  return getLocalWhatsAppSession();
};

/**
 * Subscribe to realtime WhatsApp settings
 */
export const subscribeAdminWhatsAppSettings = (callback) => {
  const local = getLocalWhatsAppSession();
  callback(local);

  try {
    const ref = doc(db, 'settings', 'whatsapp');
    return onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const merged = { ...DEFAULT_WHATSAPP_SETTINGS, ...snap.data() };
          setLocalWhatsAppSession(merged);
          callback(merged);
        } else {
          callback(local);
        }
      },
      (err) => {
        console.warn('WhatsApp settings subscription fallback:', err);
        callback(local);
      }
    );
  } catch (err) {
    return () => {};
  }
};

/**
 * Update Admin WhatsApp Settings in Firestore and localStorage
 */
export const saveAdminWhatsAppSettings = async (settings) => {
  const payload = {
    ...settings,
    updatedAt: serverTimestamp()
  };

  // Immediate local cache update
  setLocalWhatsAppSession(payload);

  try {
    const ref = doc(db, 'settings', 'whatsapp');
    await setDoc(ref, payload, { merge: true });
  } catch (err) {
    console.warn('Could not save to Firestore, cached locally:', err);
  }
  return payload;
};

/**
 * Connect Admin WhatsApp
 */
export const connectAdminWhatsApp = async (phone, name = 'Trust Admin', providerConfig = {}) => {
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
  const formattedPhone = cleanPhone.startsWith('91') && cleanPhone.length === 12 
    ? cleanPhone.slice(2) 
    : cleanPhone;

  const newSettings = {
    ...DEFAULT_WHATSAPP_SETTINGS,
    ...providerConfig,
    isConnected: true,
    adminPhone: formattedPhone || '9794590044',
    adminName: name,
    connectedAt: new Date().toISOString()
  };

  return await saveAdminWhatsAppSettings(newSettings);
};

/**
 * Disconnect Admin WhatsApp (Only when admin explicitly clicks disconnect)
 */
export const disconnectAdminWhatsApp = async () => {
  const newSettings = {
    ...DEFAULT_WHATSAPP_SETTINGS,
    isConnected: false,
    connectedAt: null
  };
  return await saveAdminWhatsAppSettings(newSettings);
};

/**
 * Format a notice into an engaging, structured WhatsApp text message
 */
export const formatNoticeForWhatsApp = (notice, customNote = '') => {
  const categoryEmojis = {
    general: '📢',
    urgent: '🚨',
    event: '🕉️',
    sanskar: '🪔'
  };

  const emoji = categoryEmojis[notice.category] || '📢';
  const categoryTitle = (notice.category || 'General').toUpperCase();

  let msg = `*${emoji} राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट)*\n`;
  msg += `_पंजीकृत धर्मार्थ न्यास • गोरखपुर, उ.प्र._\n\n`;
  msg += `*📌 ${notice.title}*\n`;
  msg += `🏷️ श्रेणी: *${categoryTitle}*\n`;
  msg += `📅 दिनांक: ${new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })}\n\n`;
  msg += `${notice.content}\n\n`;

  if (customNote) {
    msg += `💬 *विशेष निर्देश:* ${customNote}\n\n`;
  }

  msg += `🌐 *ट्रस्ट की आधिकारिक वेबसाइट:* https://rashtriyasanatantrust.in\n`;
  msg += `📞 *संपर्क सूत्र:* +91 9794590044\n`;
  msg += `🙏 _जय श्री राम • सर्वे भवन्तु सुखिनः_`;

  return msg;
};

/**
 * Generate personal message templates for individual recipients
 */
export const getPersonalMessageTemplates = (recipient, adminName = 'ट्रस्ट प्रबंधकारिणी') => {
  const name = recipient.fullName || recipient.donorName || recipient.applicantName || 'भक्त/सदस्य';
  const id = recipient.memberId || recipient.volunteerId || recipient.id || '';
  const role = recipient.role === 'volunteer' || recipient.cardType === 'volunteer' ? 'स्वयंसेवक' : 'सदस्य';

  return [
    {
      id: 'welcome_approval',
      titleHi: 'सदस्यता / स्वयंसेवक स्वीकृति',
      titleEn: 'Approval & Welcome',
      text: `*राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट)*\n\nसादर जय श्री राम, *${name}* जी 🙏\n\nहमें आपको सूचित करते हुए अत्यंत हर्ष हो रहा है कि आपका ट्रस्ट में *${role}* पद हेतु आवेदन सहर्ष *स्वीकृत* कर लिया गया है।\n\n🆔 *आपकी पहचान संख्या (ID):* ${id || 'उपलब्ध'}\n\nआप वेबसाइट पर लॉगिन करके अपना अधिकृत डिजिटल पहचान पत्र (ID Card) एवं रसीद डाउनलोड कर सकते हैं:\n👉 https://rashtriyasanatantrust.in/dashboard\n\nसंस्थान में आपका हार्दिक स्वागत एवं अभिनंदन है!\n\n_प्रेषक: ${adminName}_\n_संपर्क: +91 9794590044_`
    },
    {
      id: 'id_receipt_ready',
      titleHi: 'पहचान पत्र व रसीद उपलब्ध',
      titleEn: 'ID Card & Receipt Ready',
      text: `*राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट)*\n\nसादर जय श्री राम, *${name}* जी 🙏\n\nआपके नाम से अधिकृत ट्रस्ट पहचान पत्र एवं रसीद प्रणाली में जारी कर दी गई है।\n\nकृपया अपने प्रोफाइल में जाकर इसे डाउनलोड कर लें:\n👉 https://rashtriyasanatantrust.in/dashboard\n\nकिसी भी समस्या के लिए इसी नंबर पर संपर्क करें।\n\n_प्रेषक: ${adminName}_`
    },
    {
      id: 'help_update',
      titleHi: 'सहायता आवेदन प्रगति',
      titleEn: 'Help Request Update',
      text: `*राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट)*\n\nसादर प्रणाम, *${name}* जी 🙏\n\nट्रस्ट कल्याण समिति द्वारा आपके सहायता आवेदन की समीक्षा की जा रही है। हमारे प्रतिनिधि शीघ्र ही आपसे संपर्क करेंगे।\n\n_प्रेषक: ${adminName}_\n_हेल्पलाइन: +91 9794590044_`
    },
    {
      id: 'custom',
      titleHi: 'कस्टम संदेश',
      titleEn: 'Custom Message',
      text: `*राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट)*\n\nसादर जय श्री राम, *${name}* जी 🙏\n\n`
    }
  ];
};

/**
 * Build clean WhatsApp Web and wa.me links
 */
export const buildWhatsAppUrl = (phone, text) => {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  const fullPhone = clean.length === 10 ? `91${clean}` : clean;
  const encodedText = encodeURIComponent(text);

  return {
    mobileUrl: `https://wa.me/${fullPhone}?text=${encodedText}`,
    webUrl: `https://web.whatsapp.com/send?phone=${fullPhone}&text=${encodedText}`
  };
};

/**
 * Automated dispatch via third-party WhatsApp Gateway API (UltraMsg, GreenAPI, Whapi)
 */
export const sendViaWhatsAppApi = async (toPhone, text, imageUrl, settings) => {
  const clean = toPhone.replace(/\D/g, '');
  const fullPhone = clean.length === 10 ? `91${clean}` : clean;

  if (settings.provider === 'ultramsg') {
    const instanceId = settings.instanceId;
    const token = settings.apiToken;
    if (!instanceId || !token) throw new Error('UltraMsg Instance ID and Token are required in Settings.');

    if (imageUrl) {
      const url = `https://api.ultramsg.com/${instanceId}/messages/image`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          to: fullPhone,
          image: imageUrl,
          caption: text
        })
      });
      return await res.json();
    } else {
      const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          to: fullPhone,
          body: text
        })
      });
      return await res.json();
    }
  }

  if (settings.provider === 'greenapi') {
    const idInstance = settings.instanceId;
    const apiTokenInstance = settings.apiToken;
    if (!idInstance || !apiTokenInstance) throw new Error('Green API Instance ID and Token are required.');

    const chatId = `${fullPhone}@c.us`;
    if (imageUrl) {
      const url = `https://api.green-api.com/waInstance${idInstance}/sendFileByUrl/${apiTokenInstance}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          urlFile: imageUrl,
          fileName: 'notice.jpg',
          caption: text
        })
      });
      return await res.json();
    } else {
      const url = `https://api.green-api.com/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          message: text
        })
      });
      return await res.json();
    }
  }

  if (settings.provider === 'custom' && settings.apiEndpoint) {
    const res = await fetch(settings.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(settings.apiToken ? { 'Authorization': `Bearer ${settings.apiToken}` } : {})
      },
      body: JSON.stringify({
        to: fullPhone,
        text,
        imageUrl
      })
    });
    return await res.json();
  }

  throw new Error(`Provider ${settings.provider} is not an automated API. Use Direct dispatch.`);
};

export const DEFAULT_WHATSAPP_SERVER_URL = 'https://trust-ykvi.onrender.com';

/**
 * Get the hardcoded WhatsApp backend API base URL
 */
export const getWhatsAppApiBaseUrl = () => {
  return import.meta.env.VITE_WHATSAPP_SERVER_URL || DEFAULT_WHATSAPP_SERVER_URL;
};

export const setWhatsAppApiBaseUrl = (_url) => {
  // No-op: hardcoded to live Render backend for client deployment simplicity
};

/**
 * Check if the automated Baileys WhatsApp server is active & connected
 */
export const checkBaileysServerStatus = async () => {
  try {
    const baseUrl = getWhatsAppApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/whatsapp/status`, {
      headers: { 'Accept': 'application/json' }
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return { online: false, connected: false, status: 'OFFLINE' };
    }
    const json = await res.json();
    return {
      online: true,
      connected: json?.data?.status === 'CONNECTED',
      status: json?.data?.status || 'DISCONNECTED',
      phoneNumber: json?.data?.phoneNumber
    };
  } catch (err) {
    return { online: false, connected: false, status: 'OFFLINE', error: err.message };
  }
};

/**
 * Broadcast notice to all members and volunteers directly via Baileys automated engine
 */
export const broadcastNoticeViaBaileys = async (recipients, message, imageUrl = null, title = '') => {
  const baseUrl = getWhatsAppApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/whatsapp/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      recipients,
      message,
      imageUrl,
      title
    })
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('व्हाट्सएप ऑटोमेशन सेवा से संपर्क नहीं हो पा रहा है। कृपया कुछ क्षण बाद पुनः प्रयास करें।');
  }

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to broadcast via WhatsApp automation engine.');
  }
  return json;
};

/**
 * Send personal message via automated socket
 */
export const sendPersonalMessageViaBaileys = async (phone, message, imageUrl = null) => {
  const baseUrl = getWhatsAppApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/whatsapp/send-personal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      phone,
      message,
      imageUrl
    })
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('व्हाट्सएप ऑटोमेशन सेवा से संपर्क नहीं हो पा रहा है। कृपया कुछ क्षण बाद पुनः प्रयास करें।');
  }

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to send personal message via WhatsApp automation engine.');
  }
  return json;
};


