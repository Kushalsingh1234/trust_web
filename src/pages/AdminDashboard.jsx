import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import TrustLogo from '../components/TrustLogo';
import MemberBadge from '../components/MemberBadge';
import {
  subscribeAllCollection,
  reviewDocument,
  getAllAnnouncementsForAdmin,
  createAnnouncement,
  deleteAnnouncement
} from '../firebase/services';
import {
  approveMembership,
  rejectMembership,
  removeMember,
  subscribeMembersList,
  markReceiptSent
} from '../firebase/membershipService';
import {
  approveDonationPayment,
  rejectDonationPayment,
  subscribePaymentSettings,
  updatePaymentSettings,
  DEFAULT_PAYMENT_SETTINGS
} from '../firebase/paymentService';
import { generateReceiptPDF } from '../firebase/receiptService';
import OfficialReceiptModal from '../components/OfficialReceiptModal';
import {
  subscribeAdminWhatsAppSettings,
  saveAdminWhatsAppSettings,
  connectAdminWhatsApp,
  disconnectAdminWhatsApp,
  getLocalWhatsAppSession,
  formatNoticeForWhatsApp,
  formatDonationReceiptWhatsAppMessage,
  buildWhatsAppUrl,
  checkBaileysServerStatus,
  broadcastNoticeViaBaileys,
  sendPersonalMessageViaBaileys
} from '../firebase/whatsappService';
import { uploadImageToCloudinary } from '../utils/cloudinaryService';
import WhatsAppBroadcastModal from '../components/WhatsAppBroadcastModal';
import WhatsAppPersonalModal from '../components/WhatsAppPersonalModal';
import WhatsAppDeviceModal from '../components/WhatsAppDeviceModal';
import {
  ShieldCheck,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  HandHeart,
  UserPlus,
  Users,
  Heart,
  Home,
  LogOut,
  Globe,
  X,
  AlertCircle,
  Check,
  Calendar,
  Phone,
  User,
  Settings,
  QrCode,
  Download,
  Trash2,
  UserX,
  IndianRupee,
  Building,
  Upload,
  ShieldAlert,
  Award,
  Bell,
  Send,
  Copy,
  ExternalLink,
  Mail,
  MessageSquare,
  Share2,
  Image as ImageIcon,
  Sparkles,
  Radio,
  Loader2,
  Smartphone,
  MapPin,
  SlidersHorizontal,
  MoreHorizontal,
  Receipt
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import PushNotificationService from '../services/pushNotificationService';
import { getWhatsAppApiBaseUrl } from '../firebase/whatsappService';
import CustomReceiptModal from '../components/CustomReceiptModal';

export const AdminDashboard = ({ onNavigateHome }) => {
  const { lang, toggleLanguage } = useLanguage();
  const { currentUser, userProfile, isAdmin, logout, refreshUserData, clearAdminSession } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Active Tab: 'helpRequests' | 'memberships' | 'members' | 'volunteers' | 'donations' | 'paymentSettings'
  const [activeTab, setActiveTab] = useState('helpRequests');
  const [applicationTypeFilter, setApplicationTypeFilter] = useState('all'); // 'all' | 'membership' | 'volunteer'
  const [customReceiptModalOpen, setCustomReceiptModalOpen] = useState(false);
  const prevCountsRef = useRef({ help: -1, mem: -1, vol: -1, don: -1 });

  // Realtime datasets (initialized from local cache to prevent 0 on refresh)
  const [helpRequests, setHelpRequests] = useState(() => {
    try {
      const c = localStorage.getItem('rsssst_cache_helpRequests');
      return c ? JSON.parse(c) : [];
    } catch { return []; }
  });
  const [memberships, setMemberships] = useState(() => {
    try {
      const c = localStorage.getItem('rsssst_cache_memberships');
      return c ? JSON.parse(c) : [];
    } catch { return []; }
  });
  const [membersList, setMembersList] = useState(() => {
    try {
      const c = localStorage.getItem('rsssst_cache_membersList');
      return c ? JSON.parse(c) : [];
    } catch { return []; }
  });
  const [volunteers, setVolunteers] = useState(() => {
    try {
      const c = localStorage.getItem('rsssst_cache_volunteers');
      return c ? JSON.parse(c) : [];
    } catch { return []; }
  });
  const [donations, setDonations] = useState(() => {
    try {
      const c = localStorage.getItem('rsssst_cache_donations');
      return c ? JSON.parse(c) : [];
    } catch { return []; }
  });
  const [paymentSettings, setPaymentSettings] = useState(DEFAULT_PAYMENT_SETTINGS);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // for general tabs
  const [memberFilter, setMemberFilter] = useState('active'); // 'active' | 'removed' | 'all'
  const [memberCategorySection, setMemberCategorySection] = useState('all'); // 'all' | 'catA' | 'catB' | 'catC'

  // Modal / Row Action States
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'view' | 'approve' | 'reject' | 'removeMember'
  const [verifiedAmountInput, setVerifiedAmountInput] = useState('');
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [removeReasonInput, setRemoveReasonInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  // Announcements & Notices State
  const [announcements, setAnnouncements] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    category: 'general'
  });
  const [noticeTargetAudience, setNoticeTargetAudience] = useState('both'); // 'both' | 'members' | 'volunteers'
  const [noticeImageFile, setNoticeImageFile] = useState(null);
  const [noticeImagePreview, setNoticeImagePreview] = useState(null);
  const [sendToWhatsAppOnPublish, setSendToWhatsAppOnPublish] = useState(true);
  const [isPublishingNotice, setIsPublishingNotice] = useState(false);

  // WhatsApp Admin Connection & Dispatch State
  const [whatsappSettings, setWhatsappSettings] = useState(() => getLocalWhatsAppSession());
  const [whatsappAdminPhoneInput, setWhatsappAdminPhoneInput] = useState('9794590044');
  const [whatsappAdminNameInput, setWhatsappAdminNameInput] = useState('Bajrangi Dubey (Trust Executive)');
  const [whatsappProviderInput, setWhatsappProviderInput] = useState('direct');
  const [whatsappInstanceIdInput, setWhatsappInstanceIdInput] = useState('');
  const [whatsappApiTokenInput, setWhatsappApiTokenInput] = useState('');
  const [whatsappApiEndpointInput, setWhatsappApiEndpointInput] = useState('');
  const [isSavingWhatsAppSettings, setIsSavingWhatsAppSettings] = useState(false);
  // Modals for WhatsApp Broadcast & Personal Messages
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [currentBroadcastNotice, setCurrentBroadcastNotice] = useState(null);
  const [broadcastRecipients, setBroadcastRecipients] = useState([]);

  const [personalWhatsAppModalOpen, setPersonalWhatsAppModalOpen] = useState(false);
  const [personalRecipient, setPersonalRecipient] = useState(null);

  // Baileys WhatsApp Engine Device Modal & Server Status
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [baileysServerState, setBaileysServerState] = useState({ online: false, connected: false, phoneNumber: null });

  // Mobile bottom bar & extra options state
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [isSendingTestPush, setIsSendingTestPush] = useState(false);

  const triggerHaptic = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
    } catch (e) {}
  };

  useEffect(() => {
    // 1. Initialize Capacitor Push Notifications for Admin
    PushNotificationService.init(currentUser, (action) => {
      const targetTab = action?.notification?.data?.tab;
      if (targetTab) {
        setActiveTab(targetTab);
      }
    });

    const handleSwitchTab = (e) => {
      if (e.detail) {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener('admin_switch_tab', handleSwitchTab);

    const handlePushReceived = (e) => {
      const notif = e.detail;
      if (notif?.title) {
        toast.info(`${notif.title}: ${notif.body || ''}`);
      }
    };
    window.addEventListener('admin_push_received', handlePushReceived);

    return () => {
      window.removeEventListener('admin_switch_tab', handleSwitchTab);
      window.removeEventListener('admin_push_received', handlePushReceived);
    };
  }, [currentUser]);

  useEffect(() => {
    const checkStatus = async () => {
      const s = await checkBaileysServerStatus();
      setBaileysServerState(s);
    };
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // Handler to send a real test push notification from mobile admin app
  const handleSendTestPush = async () => {
    try {
      setIsSendingTestPush(true);

      // 1. Immediately trigger native local notification on device
      if (Capacitor.isNativePlatform()) {
        try {
          const perm = await LocalNotifications.checkPermissions();
          if (perm.display !== 'granted') {
            await LocalNotifications.requestPermissions();
          }
          await LocalNotifications.schedule({
            notifications: [{
              title: lang === 'hi' ? '🔔 सनातन ट्रस्ट — टेस्ट नोटिफिकेशन' : '🔔 Sanatan Trust Admin Alert',
              body: lang === 'hi'
                ? 'सूचना प्रणाली पूर्णतः सक्रिय है! नए आवेदन और दान आने पर तुरंत मोबाइल पर घंटी व अलर्ट मिलेगा।'
                : 'Notification system is fully active! You will receive instant notifications for applications & donations.',
              id: Date.now() % 1000000,
              channelId: 'trust_admin_alerts',
              sound: 'default'
            }]
          });
          try {
            await Haptics.notification({ type: NotificationType.Success });
          } catch {}
          toast.success(lang === 'hi' ? 'टेस्ट नोटिफिकेशन भेजा गया! आपके फोन पर अलर्ट आ गया है।' : 'Test alert triggered on your device!');
        } catch (localErr) {
          console.warn('Local notification test error:', localErr);
        }
      }

      // 2. Also send via backend push server if reachable
      try {
        const baseUrl = getWhatsAppApiBaseUrl();
        const res = await fetch(`${baseUrl}/api/admin/send-test-push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: lang === 'hi' ? '🔔 सनातन ट्रस्ट व्यवस्थापक सूचना' : '🔔 Trust Admin Push Notification',
            body: lang === 'hi'
              ? 'पुश नोटिफिकेशन सफलतापूर्वक सक्रिय हो गया है! नए आवेदन व समर्पण की तत्काल सूचनाएं प्राप्त होंगी।'
              : 'Push notifications are fully active! You will receive real-time alerts for new applications & donations.'
          })
        });
        const data = await res.json();
        if (data.success && !Capacitor.isNativePlatform()) {
          toast.success(
            lang === 'hi'
              ? `टेस्ट नोटिफिकेशन प्रेषित किया गया! (सफल: ${data.result?.successCount || 1})`
              : `Test push sent successfully! (Delivered: ${data.result?.successCount || 1})`
          );
        }
      } catch (backendErr) {
        if (!Capacitor.isNativePlatform()) {
          toast.info(lang === 'hi' ? 'बैकग्राउंड अलर्ट सक्रिय।' : 'Alerts active.');
        }
      }
    } catch (err) {
      toast.info(lang === 'hi' ? 'अलर्ट सक्रिय है।' : 'Device registered for alerts.');
    } finally {
      setIsSendingTestPush(false);
    }
  };

  // Payment Settings Form State
  const [settingsForm, setSettingsForm] = useState(DEFAULT_PAYMENT_SETTINGS);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const loadAnnouncements = async () => {
    try {
      const data = await getAllAnnouncementsForAdmin();
      setAnnouncements(data);
    } catch (e) {
      console.warn("Could not load announcements:", e);
    }
  };

  const handleSendReceipt = async (item, colName = activeTab) => {
    try {
      setIsProcessing(true);
      const res = await markReceiptSent(colName, item.id, currentUser?.uid || 'admin');
      const updatedItem = {
        ...item,
        receiptNumber: res.receiptNumber || item.receiptNumber,
        receiptSent: true
      };

      // Open the specialized receipt modal so admin can preview the custom receipt and dispatch image/PDF to WhatsApp
      handleDownloadReceipt(updatedItem);

      toast.success(
        lang === 'hi'
          ? `रसीद तैयार है (संख्या: ${res.receiptNumber})! अब व्हाट्सएप पर इमेज/PDF भेजें।`
          : `Receipt ready (No: ${res.receiptNumber})! Preview and send image/PDF to WhatsApp.`
      );
    } catch (err) {
      toast.error('Failed to send receipt: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Collect target recipients for notice broadcast (deduplicated by phone number)
  const getBroadcastRecipients = (audience = 'both') => {
    const map = new Map();
    // 1. Members
    if (audience === 'both' || audience === 'members') {
      membersList.forEach((m) => {
        const phone = m.whatsapp || m.mobile || m.phone;
        if (phone && (m.status === 'approved' || !m.status)) {
          const clean = phone.replace(/\D/g, '');
          map.set(clean, {
            id: m.id || m.uid,
            fullName: m.fullName || m.name,
            role: 'member',
            whatsapp: phone
          });
        }
      });
    }
    // 2. Volunteers
    if (audience === 'both' || audience === 'volunteers') {
      volunteers.forEach((v) => {
        const phone = v.whatsapp || v.mobile || v.phone;
        if (phone && (v.status === 'approved' || !v.status)) {
          const clean = phone.replace(/\D/g, '');
          if (!map.has(clean)) {
            map.set(clean, {
              id: v.id || v.uid,
              fullName: v.fullName || v.name,
              role: 'volunteer',
              whatsapp: phone
            });
          }
        }
      });
    }
    return Array.from(map.values());
  };

  const handleNoticeImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(lang === 'hi' ? 'छवि 5MB से छोटी होनी चाहिए' : 'Image must be under 5MB');
      return;
    }
    setNoticeImageFile(file);
    setNoticeImagePreview(URL.createObjectURL(file));
  };

  const handleClearNoticeImage = () => {
    setNoticeImageFile(null);
    setNoticeImagePreview(null);
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
      toast.error(lang === 'hi' ? 'कृपया शीर्षक व विवरण दर्ज करें' : 'Title and content required');
      return;
    }

    setIsPublishingNotice(true);
    try {
      let uploadedImageUrl = '';
      if (noticeImageFile) {
        toast.info(lang === 'hi' ? 'सूचना पोस्टर अपलोड हो रहा है...' : 'Uploading notice image...');
        uploadedImageUrl = await uploadImageToCloudinary(noticeImageFile, 'trust_notices');
      }

      const created = await createAnnouncement({
        title: announcementForm.title.trim(),
        content: announcementForm.content.trim(),
        category: announcementForm.category,
        targetAudience: noticeTargetAudience,
        imageUrl: uploadedImageUrl,
        isPublished: true
      }, currentUser?.uid || 'admin', 'ट्रस्ट प्रबंधकारिणी');

      toast.success(lang === 'hi' ? 'सूचना सफलतापूर्वक प्रकाशित हुई!' : 'Notice published successfully!');

      const recipients = getBroadcastRecipients(noticeTargetAudience);

      if (sendToWhatsAppOnPublish && recipients.length > 0) {
        const fullNotice = {
          ...created,
          title: announcementForm.title.trim(),
          content: announcementForm.content.trim(),
          category: announcementForm.category,
          targetAudience: noticeTargetAudience,
          imageUrl: uploadedImageUrl
        };
        const formattedMsg = formatNoticeForWhatsApp(fullNotice, whatsappSettings.adminName || 'ट्रस्ट प्रबंधकारिणी');

        if (baileysServerState.connected) {
          // Automated direct broadcast
          toast.info(lang === 'hi' ? `व्हाट्सएप सर्वर द्वारा ${recipients.length} सदस्यों को स्वचालित संदेश भेजा जा रहा है...` : `Automating WhatsApp broadcast to ${recipients.length} recipients...`);
          try {
            await broadcastNoticeViaBaileys(recipients, formattedMsg, uploadedImageUrl, fullNotice.title);
            toast.success(lang === 'hi' ? `✅ सभी ${recipients.length} सदस्यों एवं स्वयंसेवकों के व्हाट्सएप पर संदेश तुरंत पहुंच गया!` : `✅ Notice successfully broadcast to all ${recipients.length} recipients on WhatsApp!`);
          } catch (bErr) {
            console.error('Automated broadcast error:', bErr);
            toast.error('Automated send error: ' + bErr.message);
            setCurrentBroadcastNotice(fullNotice);
            setBroadcastRecipients(recipients);
            setBroadcastModalOpen(true);
          }
        } else {
          // Device not connected yet -> prompt admin to link device via QR Code!
          toast.info(lang === 'hi' ? 'व्यवस्थापक व्हाट्सएप अभी लिंक नहीं है। कृपया QR कोड स्कैन करें।' : 'WhatsApp is not linked. Please scan QR Code to link your device.');
          setDeviceModalOpen(true);
          setCurrentBroadcastNotice(fullNotice);
          setBroadcastRecipients(recipients);
        }
      }

      setAnnouncementForm({ title: '', content: '', category: 'general' });
      setNoticeImageFile(null);
      setNoticeImagePreview(null);
      setNoticeTargetAudience('both');
      await loadAnnouncements();
    } catch (err) {
      console.error('Failed to publish notice:', err);
      toast.error('Failed to publish notice: ' + err.message);
    } finally {
      setIsPublishingNotice(false);
    }
  };

  const handleOpenNoticeBroadcast = async (notice) => {
    const recipients = getBroadcastRecipients(notice.targetAudience || 'both');
    const formattedMsg = formatNoticeForWhatsApp(notice, whatsappSettings.adminName || 'ट्रस्ट प्रबंधकारिणी');

    if (baileysServerState.connected) {
      if (window.confirm(lang === 'hi' ? `क्या आप इस सूचना को सभी ${recipients.length} सदस्यों एवं स्वयंसेवकों के व्हाट्सएप पर तुरंत स्वचालित रूप से भेजना चाहते हैं?` : `Broadcast this notice to all ${recipients.length} recipients on WhatsApp?`)) {
        toast.info(lang === 'hi' ? `स्वचालित प्रसारण शुरू हो गया (${recipients.length} प्राप्तकर्ता)...` : `Broadcasting to ${recipients.length} recipients...`);
        try {
          await broadcastNoticeViaBaileys(recipients, formattedMsg, notice.imageUrl, notice.title);
          toast.success(lang === 'hi' ? `✅ सभी ${recipients.length} सदस्यों के व्हाट्सएप पर संदेश सफलतापूर्वक भेजा गया!` : `Notice broadcast to ${recipients.length} recipients!`);
          return;
        } catch (err) {
          toast.error(err.message);
        }
      }
    }

    setCurrentBroadcastNotice(notice);
    setBroadcastRecipients(recipients);
    setBroadcastModalOpen(true);
  };

  const handleOpenPersonalWhatsApp = (recipient) => {
    setPersonalRecipient(recipient);
    setPersonalWhatsAppModalOpen(true);
  };

  const handleDeleteNotice = async (id) => {
    if (!window.confirm(lang === 'hi' ? 'क्या आप इस सूचना को हटाना चाहते हैं?' : 'Delete this notice?')) return;
    try {
      await deleteAnnouncement(id);
      toast.info(lang === 'hi' ? 'सूचना हटा दी गई।' : 'Notice deleted.');
      await loadAnnouncements();
    } catch (err) {
      toast.error('Failed to delete: ' + err.message);
    }
  };

  const handleConnectWhatsApp = async (e) => {
    e?.preventDefault();
    setIsSavingWhatsAppSettings(true);
    try {
      await connectAdminWhatsApp(whatsappAdminPhoneInput, whatsappAdminNameInput, {
        provider: whatsappProviderInput,
        instanceId: whatsappInstanceIdInput,
        apiToken: whatsappApiTokenInput,
        apiEndpoint: whatsappApiEndpointInput
      });
      toast.success(
        lang === 'hi'
          ? 'व्यवस्थापक व्हाट्सएप सफलतापूर्वक कनेक्ट हुआ! यह सत्र हमेशा सक्रिय रहेगा।'
          : 'Admin WhatsApp connected successfully! Session remains persistently active.'
      );
    } catch (err) {
      toast.error('Failed to connect WhatsApp: ' + err.message);
    } finally {
      setIsSavingWhatsAppSettings(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    if (!window.confirm(lang === 'hi' ? 'क्या आप व्हाट्सएप सत्र डिस्कनेक्ट करना चाहते हैं?' : 'Disconnect WhatsApp session?')) return;
    try {
      await disconnectAdminWhatsApp();
      toast.info(lang === 'hi' ? 'व्हाट्सएप डिस्कनेक्ट कर दिया गया।' : 'WhatsApp disconnected.');
    } catch (err) {
      toast.error('Failed to disconnect: ' + err.message);
    }
  };

  // Realtime subscriptions & Native Local Notifications
  useEffect(() => {
    // 1. Initialize Local Notification channel on Android
    if (Capacitor.isNativePlatform()) {
      (async () => {
        try {
          await LocalNotifications.createChannel({
            id: 'trust_admin_alerts',
            name: 'Trust Admin Alerts',
            description: 'Instant alerts for applications, donations, and help requests',
            importance: 5,
            visibility: 1,
            vibration: true,
            sound: 'default'
          });
          const perm = await LocalNotifications.checkPermissions();
          if (perm.display !== 'granted') {
            await LocalNotifications.requestPermissions();
          }
        } catch (e) {
          console.warn('[LocalNotif] Setup channel note:', e);
        }
      })();
    }

    const unsubHelp = subscribeAllCollection('helpRequests', (data) => {
      if (prevCountsRef.current.help !== -1 && data.length > prevCountsRef.current.help) {
        const diff = data.length - prevCountsRef.current.help;
        const newItems = data.slice(0, diff);
        newItems.forEach(item => {
          if (Capacitor.isNativePlatform() && (item.status || 'pending').toLowerCase() === 'pending') {
            LocalNotifications.schedule({
              notifications: [{
                title: 'नई सहायता प्रार्थना! 🙏',
                body: `${item.fullName || 'आवेदक'}: ${item.category || item.helpType || 'सहायता'} हेतु प्रार्थना प्राप्त हुई।`,
                id: Math.floor(Math.random() * 1000000),
                channelId: 'trust_admin_alerts',
                sound: 'default'
              }]
            }).catch(() => {});
          }
        });
      }
      prevCountsRef.current.help = data.length;
      setHelpRequests(data);
    });

    const unsubMem = subscribeAllCollection('memberships', (data) => {
      if (prevCountsRef.current.mem !== -1 && data.length > prevCountsRef.current.mem) {
        const diff = data.length - prevCountsRef.current.mem;
        const newItems = data.slice(0, diff);
        newItems.forEach(item => {
          if (Capacitor.isNativePlatform() && (item.status || 'pending').toLowerCase() === 'pending') {
            LocalNotifications.schedule({
              notifications: [{
                title: 'नया सदस्यता आवेदन! 🛡️',
                body: `${item.fullName || 'नया आवेदक'} ने सदस्यता हेतु आवेदन किया है।`,
                id: Math.floor(Math.random() * 1000000),
                channelId: 'trust_admin_alerts',
                sound: 'default'
              }]
            }).catch(() => {});
          }
        });
      }
      prevCountsRef.current.mem = data.length;
      setMemberships(data);
    });

    const unsubVol = subscribeAllCollection('volunteers', (data) => {
      if (prevCountsRef.current.vol !== -1 && data.length > prevCountsRef.current.vol) {
        const diff = data.length - prevCountsRef.current.vol;
        const newItems = data.slice(0, diff);
        newItems.forEach(item => {
          if (Capacitor.isNativePlatform() && (item.status || 'pending').toLowerCase() === 'pending') {
            LocalNotifications.schedule({
              notifications: [{
                title: 'नया स्वयंसेवक आवेदन! 🤝',
                body: `${item.fullName || 'नया स्वयंसेवक'} ने सेवा हेतु पंजीकरण किया है।`,
                id: Math.floor(Math.random() * 1000000),
                channelId: 'trust_admin_alerts',
                sound: 'default'
              }]
            }).catch(() => {});
          }
        });
      }
      prevCountsRef.current.vol = data.length;
      setVolunteers(data);
    });

    const unsubDon = subscribeAllCollection('donations', (data) => {
      if (prevCountsRef.current.don !== -1 && data.length > prevCountsRef.current.don) {
        const diff = data.length - prevCountsRef.current.don;
        const newItems = data.slice(0, diff);
        newItems.forEach(item => {
          if (Capacitor.isNativePlatform() && (item.status || 'pending').toLowerCase() === 'pending') {
            LocalNotifications.schedule({
              notifications: [{
                title: 'नया समर्पण / दान प्राप्त! 💰',
                body: `₹${item.verifiedAmount || item.claimedAmount || item.amount || 200}/- का समर्पण प्राप्त हुआ - ${item.donorName || item.fullName || 'दाता'}`,
                id: Math.floor(Math.random() * 1000000),
                channelId: 'trust_admin_alerts',
                sound: 'default'
              }]
            }).catch(() => {});
          }
        });
      }
      prevCountsRef.current.don = data.length;
      setDonations(data);
    });

    const unsubMembers = subscribeMembersList((data) => setMembersList(data));
    const unsubSettings = subscribePaymentSettings((settings) => {
      const safe = settings ? { ...DEFAULT_PAYMENT_SETTINGS, ...settings } : DEFAULT_PAYMENT_SETTINGS;
      setPaymentSettings(safe);
      setSettingsForm(safe);
    });
    const unsubWhatsApp = subscribeAdminWhatsAppSettings((settings) => {
      setWhatsappSettings(settings);
      setWhatsappAdminPhoneInput(settings.adminPhone || '9794590044');
      setWhatsappAdminNameInput(settings.adminName || 'Bajrangi Dubey (Trust Executive)');
      setWhatsappProviderInput(settings.provider || 'direct');
      setWhatsappInstanceIdInput(settings.instanceId || '');
      setWhatsappApiTokenInput(settings.apiToken || '');
      setWhatsappApiEndpointInput(settings.apiEndpoint || '');
    });
    loadAnnouncements();

    return () => {
      unsubHelp();
      unsubMem();
      unsubVol();
      unsubDon();
      unsubMembers();
      unsubSettings();
      unsubWhatsApp();
    };
  }, []);

  const handleExitAdmin = async () => {
    try {
      if (clearAdminSession) clearAdminSession();
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('rsssst_admin_pin_verified');
        localStorage.removeItem('rsssst_admin_pin_verified');
      }
      await logout();
      toast.info(lang === 'hi' ? 'व्यवस्थापक सत्र सुरक्षित समाप्त हुआ।' : 'Admin session closed.');
      navigate('/');
    } catch (err) {
      navigate('/');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'हाल ही में';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'हाल ही में';
    }
  };

  // Open Actions
  const handleOpenView = (item) => {
    setSelectedItem(item);
    setModalMode('view');
  };

  const handleOpenApprove = (item) => {
    setSelectedItem(item);
    const isExempted = item.category === 'catA' || item.claimedAmount === 0 || item.paymentStatus === 'exempted' || item.paymentId === 'CROSS_APPROVED_FREE';
    if (activeTab === 'memberships' || activeTab === 'volunteers') {
      setVerifiedAmountInput(isExempted ? '0' : String(item.claimedAmount || item.amount || paymentSettings.membershipFee || 200));
    } else if (activeTab === 'donations') {
      setVerifiedAmountInput(String(item.claimedAmount || item.amount || ''));
    }
    setAdminNoteInput(item.adminNote || '');
    setModalMode('approve');
  };

  const handleOpenReject = (item) => {
    setSelectedItem(item);
    setRejectReasonInput(item.rejectionReason || '');
    setModalMode('reject');
  };

  const handleOpenRemoveMember = (item) => {
    setSelectedItem(item);
    setRemoveReasonInput('');
    setModalMode('removeMember');
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setModalMode(null);
    setVerifiedAmountInput('');
    setAdminNoteInput('');
    setRejectReasonInput('');
    setRemoveReasonInput('');
  };

  // Execute Review / Approval Actions
  const handleConfirmAction = async () => {
    if (!selectedItem || !modalMode) return;

    setIsProcessing(true);
    try {
      if (modalMode === 'approve') {
        if (activeTab === 'memberships' || activeTab === 'volunteers') {
          const isCatA = selectedItem.category === 'catA';
          const isExempted = isCatA || selectedItem.claimedAmount === 0 || selectedItem.paymentStatus === 'exempted' || selectedItem.paymentId === 'CROSS_APPROVED_FREE';
          const num = isExempted ? 0 : Number(verifiedAmountInput);
          if (!isExempted && (isNaN(num) || num <= 0)) {
            toast.error("Please enter a valid numeric verified amount.");
            setIsProcessing(false);
            return;
          }

          const res = await approveMembership(selectedItem.id, num, currentUser?.uid || 'admin');
          const isVol = activeTab === 'volunteers' || selectedItem.appType === 'volunteer' || selectedItem.memberType === 'volunteer' || selectedItem.category === 'catC';
          toast.success(
            isExempted
              ? (isVol
                  ? `Volunteer Approved! ID: ${res.memberId} (Cross-Exempted ₹0)`
                  : `Member Approved! ID: ${res.memberId} (Exempted ₹0)`)
              : (isVol
                  ? `Volunteer Approved! ID: ${res.memberId} & Receipt: ${res.receiptNumber || 'N/A'}`
                  : `Membership Approved! ID: ${res.memberId} & Receipt: ${res.receiptNumber || 'N/A'}`)
          );
        } else if (activeTab === 'donations') {
          const num = Number(verifiedAmountInput);
          if (isNaN(num) || num <= 0) {
            toast.error("Please enter a valid numeric verified amount.");
            setIsProcessing(false);
            return;
          }

          const res = await approveDonationPayment(selectedItem.id, num, adminNoteInput, currentUser?.uid || 'admin');
          toast.success(`Donation Approved! Verified Amount ₹${res.verifiedAmount} • Receipt: ${res.receiptNumber}`);
        } else {
          // Standard Review (helpRequests)
          await reviewDocument(
            activeTab,
            selectedItem.id,
            { status: 'approved', adminNote: adminNoteInput.trim() },
            currentUser?.uid || 'admin'
          );
          toast.success('Approved successfully.');
        }
      } else if (modalMode === 'reject') {
        if (!rejectReasonInput.trim()) {
          toast.error("Please provide a rejection reason.");
          setIsProcessing(false);
          return;
        }

        if (activeTab === 'volunteers' || selectedItem.appType === 'volunteer') {
          await reviewDocument(
            'volunteers',
            selectedItem.id,
            { status: 'rejected', reason: rejectReasonInput.trim() },
            currentUser?.uid || 'admin'
          );
        } else if (activeTab === 'memberships') {
          await rejectMembership(selectedItem.id, rejectReasonInput.trim(), currentUser?.uid || 'admin');
        } else if (activeTab === 'donations') {
          await rejectDonationPayment(selectedItem.id, rejectReasonInput.trim(), currentUser?.uid || 'admin');
        } else {
          await reviewDocument(
            activeTab,
            selectedItem.id,
            { status: 'rejected', reason: rejectReasonInput.trim() },
            currentUser?.uid || 'admin'
          );
        }
        toast.info('Record rejected.');
      } else if (modalMode === 'removeMember') {
        if (!removeReasonInput.trim()) {
          toast.error("Please provide a reason for membership removal.");
          setIsProcessing(false);
          return;
        }

        const targetUid = selectedItem.uid || selectedItem.applicantUid || selectedItem.userUid;
        await removeMember(selectedItem.id, targetUid, removeReasonInput.trim(), currentUser?.uid || 'admin');
        if (refreshUserData && (!targetUid || targetUid === currentUser?.uid)) {
          await refreshUserData();
        }
        toast.success(`Member ${selectedItem.memberId || ''} removed successfully.`);
      }

      handleCloseModal();
    } catch (err) {
      console.error("Admin action failed:", err);
      toast.error('Error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-download / View Receipt PDF
  const handleDownloadReceipt = (record) => {
    if (!record) return;

    // If record has an associated member UID, find their profile in membersList or memberships
    const member = (record.uid || record.applicantUid || record.payerUid)
      ? (membersList.find(m => (m.uid && (m.uid === record.uid || m.uid === record.applicantUid || m.uid === record.payerUid)) || m.id === record.uid) ||
         memberships.find(m => (m.uid && (m.uid === record.uid || m.uid === record.applicantUid || m.uid === record.payerUid)) || m.id === record.uid))
      : null;

    const donorName = record.donorName || record.fullName || record.payerName || member?.fullName || member?.donorName || '—';
    const rawMobile = record.donorPhone || record.phone || record.mobile || record.payerMobile || record.whatsapp || member?.phone || member?.mobile || '';
    const fatherHusbandName = record.fatherHusbandName || record.fatherName || member?.fatherHusbandName || member?.fatherName || '—';
    const address = record.address || record.villageOrLocality || record.location || member?.address || member?.villageOrLocality || '—';
    const block = record.block || member?.block || '—';
    const district = record.district || member?.district || '—';
    const state = record.state || member?.state || 'उत्तर प्रदेश';

    const isDonationRecord = activeTab === 'donations' || record.purpose === 'samarpan' || record.purpose === 'donation';
    const isVolunteerRecord = activeTab === 'volunteers' || record.purpose === 'volunteer_registration' || record.role === 'volunteer';
    const effectivePurpose = isDonationRecord ? 'samarpan' : (isVolunteerRecord ? 'volunteer_registration' : (record.purpose || 'membership_fee'));
    const isPublicDonor = isDonationRecord && (!record.fatherHusbandName && !member?.fatherHusbandName) && (!record.address && !member?.address);

    const effectiveAmount = Number(record.verifiedAmount ?? record.amount ?? record.claimedAmount ?? (isDonationRecord ? 0 : 200));

    setViewingReceipt({
      ...record,
      receiptNumber: record.receiptNumber || `RSSSST-2026-${record.id?.slice(0, 4).toUpperCase() || '0001'}`,
      date: record.approvedAt || record.verifiedAt || record.createdAt,
      donorName,
      fullName: donorName,
      username: record.username || member?.username || '',
      memberId: record.memberId || member?.memberId || '',
      phone: rawMobile,
      mobile: rawMobile,
      donorPhone: rawMobile,
      fatherHusbandName,
      address,
      block,
      district,
      state,
      isPublicDonor,
      paymentId: record.paymentId || record.utrNumber || 'UPI-REF',
      purpose: effectivePurpose,
      itemType: isDonationRecord ? 'donation' : (isVolunteerRecord ? 'volunteer' : 'membership'),
      amount: effectiveAmount,
      verifiedAmount: effectiveAmount
    });
  };

  // Save Payment Settings
  const handleSavePaymentSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await updatePaymentSettings(settingsForm);
      toast.success('Payment settings updated successfully in Firestore!');
    } catch (err) {
      toast.error('Failed to save settings: ' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handle QR image file upload (base64)
  const handleQrFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error('Image size must be less than 1MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSettingsForm(prev => ({ ...prev, qrImageUrl: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  // Filtering for active tabs
  const getDisplayData = () => {
    if (activeTab === 'members') {
      return membersList.filter(m => {
        if (memberFilter === 'active' && m.status !== 'approved') return false;
        if (memberFilter === 'removed' && m.status !== 'removed') return false;

        // Category Section Filter ('all' | 'catA' | 'catB' | 'catC')
        if (memberCategorySection === 'catA' && m.category !== 'catA') return false;
        if (memberCategorySection === 'catB' && (m.category !== 'catB' && m.category !== undefined && m.category !== null && m.category !== '')) return false;
        if (memberCategorySection === 'catC' && m.category !== 'catC') return false;

        if (!searchQuery.trim()) return true;

        const q = searchQuery.toLowerCase();
        const name = (m.fullName || '').toLowerCase();
        const mid = (m.memberId || '').toLowerCase();
        const phone = (m.phone || '').toLowerCase();
        const pid = (m.paymentId || '').toLowerCase();
        const assist = (m.helpType || m.assistanceDescription || '').toLowerCase();
        const prof = (m.profession || m.workplace || '').toLowerCase();
        const avail = (m.availability || '').toLowerCase();
        return name.includes(q) || mid.includes(q) || phone.includes(q) || pid.includes(q) || assist.includes(q) || prof.includes(q) || avail.includes(q);
      });
    }

    let list = [];
    if (activeTab === 'helpRequests') {
      list = helpRequests;
    } else if (activeTab === 'memberships') {
      // Unified Applications tab: Merges both membership and volunteer applications with strict deduplication
      let rawCombined = [];
      if (applicationTypeFilter === 'all' || applicationTypeFilter === 'membership') {
        rawCombined = rawCombined.concat(memberships.map(m => ({
          ...m,
          appType: m.category === 'catC' || m.memberType === 'volunteer' ? 'volunteer' : 'membership'
        })));
      }
      if (applicationTypeFilter === 'all' || applicationTypeFilter === 'volunteer') {
        rawCombined = rawCombined.concat(volunteers.map(v => ({ ...v, appType: 'volunteer' })));
      }

      // Deduplicate applications by unique ID or membershipApplicationId or (phone + name)
      const seenAppKeys = new Set();
      const dedupedApps = [];
      for (const item of rawCombined) {
        const cleanId = (item.membershipApplicationId || item.id || '').trim();
        const cleanPhone = (item.phone || item.mobile || item.donorPhone || '').replace(/\D/g, '');
        const cleanName = (item.fullName || item.donorName || '').trim().toLowerCase();
        const fallbackKey = cleanPhone && cleanName ? `${cleanPhone}_${cleanName}` : null;
        const key = cleanId || fallbackKey;

        if (key && !seenAppKeys.has(key)) {
          seenAppKeys.add(key);
          dedupedApps.push(item);
        } else if (!key) {
          dedupedApps.push(item);
        }
      }

      dedupedApps.sort((a, b) => {
        const tA = a.createdAt?.seconds || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const tB = b.createdAt?.seconds || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return tB - tA;
      });
      list = dedupedApps;
    } else if (activeTab === 'volunteers') {
      list = volunteers.map(v => ({ ...v, appType: 'volunteer' }));
    } else if (activeTab === 'donations') {
      // Strict deduplication for donations
      const seenDonKeys = new Set();
      const dedupedDonations = [];
      for (const item of donations) {
        const cleanPid = (item.paymentId || item.utrNumber || '').trim().toUpperCase();
        const cleanReceipt = (item.receiptNumber || '').trim().toUpperCase();
        const isRealPid = cleanPid && !cleanPid.startsWith('UPI-') && !cleanPid.startsWith('PROOF-');
        const key = cleanReceipt || (isRealPid ? cleanPid : null) || item.id;

        if (key && !seenDonKeys.has(key)) {
          seenDonKeys.add(key);
          dedupedDonations.push(item);
        } else if (key) {
          const idx = dedupedDonations.findIndex(x => {
            const xPid = (x.paymentId || x.utrNumber || '').trim().toUpperCase();
            const xReceipt = (x.receiptNumber || '').trim().toUpperCase();
            return (cleanReceipt && xReceipt === cleanReceipt) || (isRealPid && xPid === cleanPid) || x.id === item.id;
          });
          if (idx !== -1 && (item.status === 'approved' || item.receiptNumber)) {
            dedupedDonations[idx] = { ...dedupedDonations[idx], ...item };
          }
        } else {
          dedupedDonations.push(item);
        }
      }

      dedupedDonations.sort((a, b) => {
        const tA = a.createdAt?.seconds || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const tB = b.createdAt?.seconds || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return tB - tA;
      });
      list = dedupedDonations;
    }

    return list.filter(item => {
      const statusMatch = statusFilter === 'all' || (item.status || 'pending').toLowerCase() === statusFilter.toLowerCase();
      if (!statusMatch) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const name = (item.fullName || item.donorName || '').toLowerCase();
      const phone = (item.phone || item.donorPhone || '').toLowerCase();
      const pid = (item.paymentId || item.utrNumber || item.id || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || pid.includes(q);
    });
  };

  const currentDisplayData = getDisplayData();
  const totalActiveMembers = membersList.filter(m => m.status === 'approved').length;
  const activeMembers = membersList.filter(m => memberFilter === 'all' || (memberFilter === 'active' ? m.status === 'approved' : m.status === 'removed'));
  const catACount = activeMembers.filter(m => m.category === 'catA').length;
  const catBCount = activeMembers.filter(m => m.category === 'catB' || !m.category).length;
  const catCCount = activeMembers.filter(m => m.category === 'catC').length;

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#454545] flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#382719] text-white shadow-md border-b border-[#E9B44C]/30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <TrustLogo className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0" showText={false} lang={lang} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-white text-sm sm:text-base tracking-tight font-hindi-heading truncate">
                  {lang === 'hi' ? 'सनातन संस्कार ट्रस्ट' : 'Sanatan Sanskar Trust'}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-primary text-white flex-shrink-0">
                  {lang === 'hi' ? 'व्यवस्थापक' : 'Admin'}
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-[#E9B44C] font-mono block truncate">
                {lang === 'hi' ? 'सुरक्षित व्यवस्थापक सत्र' : 'Protected Admin Session'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* Custom Receipt Button: Hidden on mobile top bar to protect Trust Name */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setCustomReceiptModalOpen(true);
              }}
              className="hidden sm:flex px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-[#E87516] hover:from-amber-600 hover:to-[#B84A06] text-white text-xs font-black items-center gap-1.5 transition-all shadow-md cursor-pointer"
              title={lang === 'hi' ? 'कस्टम रसीद बनाएं' : 'Generate Custom Receipt'}
            >
              <Receipt className="w-3.5 h-3.5 text-white" />
              <span>{lang === 'hi' ? '➕ कस्टम रसीद' : '➕ Custom Receipt'}</span>
            </button>

            <button
              type="button"
              onClick={toggleLanguage}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              title={lang === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
            >
              <Globe className="w-3.5 h-3.5 text-[#E9B44C]" />
              <span>{lang === 'hi' ? 'English' : 'हिंदी'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 pb-28 sm:py-6 flex-1 w-full space-y-5 sm:space-y-6">
        
        {/* Metric Badges Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[#E9B44C]/30 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] sm:text-xs text-[#777777] font-bold block mb-1 truncate">
              {lang === 'hi' ? 'सक्रिय सदस्य' : 'Active Members'}
            </span>
            <div className="flex items-center justify-between mt-auto">
              <span className="text-xl sm:text-2xl font-black text-[#382719] font-mono">{totalActiveMembers}</span>
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 flex-shrink-0" />
            </div>
          </div>

          <div className="bg-amber-50/70 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-amber-300 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] sm:text-xs text-amber-800 font-bold block mb-1 truncate">
              {lang === 'hi' ? 'लंबित आवेदन (सदस्य व स्वयंसेवक)' : 'Pending Applications'}
            </span>
            <div className="flex items-center justify-between mt-auto">
              <span className="text-xl sm:text-2xl font-black text-amber-700 font-mono">
                {memberships.filter(m => (m.status || 'pending').toLowerCase() === 'pending').length + volunteers.filter(v => (v.status || 'pending').toLowerCase() === 'pending').length}
              </span>
              <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 flex-shrink-0" />
            </div>
          </div>

          <div className="bg-emerald-50/70 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-300 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] sm:text-xs text-emerald-800 font-bold block mb-1 truncate">
              {lang === 'hi' ? 'लंबित दान/समर्पण' : 'Pending Donations'}
            </span>
            <div className="flex items-center justify-between mt-auto">
              <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
                {donations.filter(d => (d.status || 'pending').toLowerCase() === 'pending').length}
              </span>
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 flex-shrink-0" />
            </div>
          </div>

          <div className="bg-rose-50/70 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-rose-300 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] sm:text-xs text-rose-800 font-bold block mb-1 truncate">
              {lang === 'hi' ? 'सहायता प्रार्थनाएं' : 'Help Requests'}
            </span>
            <div className="flex items-center justify-between mt-auto">
              <span className="text-xl sm:text-2xl font-black text-rose-700 font-mono">
                {helpRequests.filter(h => (h.status || 'pending').toLowerCase() === 'pending').length}
              </span>
              <HandHeart className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600 flex-shrink-0" />
            </div>
          </div>
        </div>

        {/* 6 Core Tabs Navigation */}
        <div className="flex border-b border-[#E9B44C]/30 overflow-x-auto no-scrollbar gap-1 sm:gap-2 pb-1 scroll-smooth">
          <button
            type="button"
            onClick={() => { setActiveTab('helpRequests'); setSearchQuery(''); setStatusFilter('all'); }}
            className={`min-h-[44px] shrink-0 py-2.5 px-3 sm:px-4 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 ${
              activeTab === 'helpRequests'
                ? 'border-primary text-primary bg-[#FFF8EF] rounded-t-xl font-black'
                : 'border-transparent text-[#666666] hover:text-primary'
            }`}
          >
            <HandHeart className="w-4 h-4 flex-shrink-0" />
            <span>{lang === 'hi' ? 'सहायता प्रार्थनाएं' : 'Help Requests'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-mono font-bold">
              {helpRequests.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('memberships'); setSearchQuery(''); setStatusFilter('all'); setApplicationTypeFilter('all'); }}
            className={`min-h-[44px] shrink-0 py-2.5 px-3 sm:px-4 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 ${
              activeTab === 'memberships'
                ? 'border-primary text-primary bg-[#FFF8EF] rounded-t-xl font-black'
                : 'border-transparent text-[#666666] hover:text-primary'
            }`}
          >
            <UserPlus className="w-4 h-4 flex-shrink-0" />
            <span>{lang === 'hi' ? 'आवेदन (सदस्यता व स्वयंसेवक)' : 'Applications (Members & Volunteers)'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-mono font-bold">
              {memberships.length + volunteers.length}
            </span>
          </button>

          {/* Tab: Members */}
          <button
            type="button"
            onClick={() => { setActiveTab('members'); setSearchQuery(''); }}
            className={`min-h-[44px] shrink-0 py-2.5 px-3 sm:px-4 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 ${
              activeTab === 'members'
                ? 'border-primary text-primary bg-[#FFF8EF] rounded-t-xl font-black'
                : 'border-transparent text-[#666666] hover:text-primary'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{lang === 'hi' ? `सत्यापित सदस्य (${totalActiveMembers})` : `Members (${totalActiveMembers})`}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('volunteers'); setSearchQuery(''); setStatusFilter('all'); }}
            className={`min-h-[44px] shrink-0 py-2.5 px-3 sm:px-4 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 ${
              activeTab === 'volunteers'
                ? 'border-primary text-primary bg-[#FFF8EF] rounded-t-xl font-black'
                : 'border-transparent text-[#666666] hover:text-primary'
            }`}
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>{lang === 'hi' ? 'स्वयंसेवक' : 'Volunteers'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-mono font-bold">
              {volunteers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('donations'); setSearchQuery(''); setStatusFilter('all'); }}
            className={`min-h-[44px] shrink-0 py-2.5 px-3 sm:px-4 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 ${
              activeTab === 'donations'
                ? 'border-primary text-primary bg-[#FFF8EF] rounded-t-xl font-black'
                : 'border-transparent text-[#666666] hover:text-primary'
            }`}
          >
            <Heart className="w-4 h-4 flex-shrink-0" />
            <span>{lang === 'hi' ? 'समर्पण व दान' : 'Donations'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-mono font-bold">
              {donations.length}
            </span>
          </button>

          {/* Tab: Announcements & Notices */}
          <button
            type="button"
            onClick={() => { setActiveTab('announcements'); setSearchQuery(''); }}
            className={`min-h-[44px] shrink-0 py-2.5 px-3 sm:px-4 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 ${
              activeTab === 'announcements'
                ? 'border-primary text-primary bg-[#FFF8EF] rounded-t-xl font-black'
                : 'border-transparent text-[#666666] hover:text-primary'
            }`}
          >
            <Bell className="w-4 h-4 text-primary flex-shrink-0" />
            <span>{lang === 'hi' ? 'सूचनाएं व संदेश' : 'Notices & Updates'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-mono font-bold">
              {announcements.length}
            </span>
          </button>

          {/* Tab: Payment Settings */}
          <button
            type="button"
            onClick={() => setActiveTab('paymentSettings')}
            className={`min-h-[44px] shrink-0 py-2.5 px-3 sm:px-4 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 ${
              activeTab === 'paymentSettings'
                ? 'border-primary text-primary bg-[#FFF8EF] rounded-t-xl font-black'
                : 'border-transparent text-[#666666] hover:text-primary'
            }`}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            <span>{lang === 'hi' ? 'सेटिंग्स व व्हाट्सएप' : 'Settings & WhatsApp'}</span>
          </button>
        </div>

        {/* Tab 6: Settings & WhatsApp Panel */}
        {activeTab === 'paymentSettings' ? (
          <div className="space-y-6 max-w-4xl text-left">
            {/* Card 1: Admin WhatsApp Persistent Connection */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-600/35 shadow-card space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-600/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <MessageSquare className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-base sm:text-lg text-[#382719] font-hindi-heading">
                        {lang === 'hi' ? 'व्यवस्थापक व्हाट्सएप कनेक्शन' : 'Admin WhatsApp Connection'}
                      </h3>
                      {baileysServerState?.connected ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{baileysServerState?.phoneNumber ? `लिंक है: ${baileysServerState.phoneNumber}` : (lang === 'hi' ? 'सक्रिय रूप से कनेक्टेड' : 'Connected & Active')}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <span>{lang === 'hi' ? 'डिवाइस लिंक नहीं है' : 'Device Not Linked'}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#666666] mt-0.5">
                      {lang === 'hi'
                        ? 'QR कोड से एक बार लिंक करने के बाद आपके व्हाट्सएप से सभी नोटिस व संदेश तुरंत पृष्ठभूमि में स्वचालित रूप से जाएंगे।'
                        : 'Once linked via QR code, all notices and messages are automatically dispatched directly from your WhatsApp.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setDeviceModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md hover:scale-102 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>
                      {baileysServerState?.connected
                        ? (lang === 'hi' ? 'डिवाइस प्रबंधित करें / परीक्षण संदेश' : 'Manage Device / Test Send')
                        : (lang === 'hi' ? '📱 QR कोड स्कैन कर लिंक करें' : '📱 Scan QR Code to Link')}
                    </span>
                  </button>
                </div>
              </div>

              {/* Clean Automation Overview & Server Settings */}
              <div className="space-y-4 pt-1">
                {/* Status Box */}
                <div className={`p-4 rounded-2xl border text-xs ${
                  baileysServerState?.connected
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50/70 border-amber-200 text-amber-950'
                }`}>
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {baileysServerState?.connected ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        <span>{lang === 'hi' ? 'स्वचालित व्हाट्सएप प्रसारण प्रणाली सक्रिय है' : 'Automated WhatsApp Broadcasting is Active'}</span>
                      </>
                    ) : (
                      <>
                        <Smartphone className="w-4 h-4 text-amber-700" />
                        <span>{lang === 'hi' ? 'व्हाट्सएप डिवाइस अभी लिंक नहीं है' : 'WhatsApp Device Not Linked'}</span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed text-gray-700">
                    {baileysServerState?.connected
                      ? (lang === 'hi'
                          ? `आपके नंबर (+91 ${baileysServerState?.phoneNumber || ''}) से व्हाट्सएप जुड़ा हुआ है। जब भी आप नोटिस बोर्ड पर कोई सूचना या व्यक्तिगत संदेश पोस्ट करेंगे, वह सीधे बिना कोई विंडो खोले पृष्ठभूमि में स्वतः भेजा जाएगा।`
                          : `Connected with +91 ${baileysServerState?.phoneNumber || ''}. All broadcast notices and direct messages will be sent automatically in the background.`)
                      : (lang === 'hi'
                          ? 'उपरोक्त "QR कोड स्कैन कर लिंक करें" बटन पर क्लिक करके अपने व्हाट्सएप से QR कोड स्कैन करें। एक बार स्कैन करने के बाद आपको दोबारा लॉगिन नहीं करना पड़ेगा।'
                          : 'Click "Scan QR Code to Link" above to pair your WhatsApp account. Once scanned, pairing is saved automatically.')}
                  </p>
                </div>

                {/* Server Status Indicator */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${baileysServerState?.online ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                      <span className="font-bold text-gray-800">
                        {baileysServerState?.online
                          ? (lang === 'hi' ? 'व्हाट्सएप ऑटोमेशन सर्वर: ऑनलाइन (सक्रिय)' : 'WhatsApp Automation Server: Online')
                          : (lang === 'hi' ? 'व्हाट्सएप ऑटोमेशन सर्वर: कनेक्ट हो रहा है...' : 'WhatsApp Automation Server: Connecting...')}
                      </span>
                    </div>
                    {baileysServerState?.phoneNumber && (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-lg">
                        +{baileysServerState.phoneNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Payment & QR Settings */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9B44C]/35 shadow-card space-y-6">
              <div className="flex items-center gap-3 border-b border-[#E9B44C]/30 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-[#382719] font-hindi-heading">
                    Trust Payment & QR Code Settings
                  </h3>
                  <p className="text-xs text-[#666666]">
                    Configure official QR image, UPI ID, payee name, and membership fee displayed to all members.
                  </p>
                </div>
              </div>

            <form onSubmit={handleSavePaymentSettings} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* QR Preview & Upload Box */}
                <div className="md:col-span-4 p-4 rounded-2xl bg-[#FFF8EF] border border-[#E9B44C]/40 text-center space-y-3">
                  <span className="text-xs font-bold text-[#382719] block">
                    {lang === 'hi' ? 'वर्तमान भुगतान QR कोड' : 'Current Payment QR Code'}
                  </span>
                  
                  <div className="w-40 h-40 mx-auto p-2 rounded-xl bg-white border border-[#E9B44C] flex items-center justify-center overflow-hidden shadow-xs">
                    <img
                      src={settingsForm?.qrImageUrl || '/payment-qr.png'}
                      alt="Payment QR"
                      className="w-full h-full object-contain"
                      onError={(e) => { e.target.onerror = null; e.target.src = '/payment-qr.png'; }}
                    />
                  </div>

                  <div>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E9B44C] text-xs font-bold text-[#382719] hover:bg-primary hover:text-white cursor-pointer transition-all shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? 'नया QR कोड अपलोड करें' : 'Upload New QR Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrFileUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-[#777777] block mt-1">PNG / JPG (max 1MB)</span>
                  </div>
                </div>

                {/* Settings Input Fields */}
                <div className="md:col-span-8 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'ट्रस्ट का आधिकारिक नाम (Payee Name) *' : 'Payee / Trust Official Display Name *'}
                    </label>
                    <input
                      type="text"
                      value={settingsForm?.payeeName || ''}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, payeeName: e.target.value }))}
                      placeholder={lang === 'hi' ? 'उदा. राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट)' : 'e.g. Rashtriya Sanatan Sanskar Seva Sansthan (Trust)'}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E9B44C]/50 text-xs focus:ring-2 focus:ring-primary/40 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#382719] mb-1">
                        {lang === 'hi' ? 'ट्रस्ट UPI ID *' : 'Trust UPI ID *'}
                      </label>
                      <input
                        type="text"
                        value={settingsForm?.upiId || ''}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, upiId: e.target.value }))}
                        placeholder="e.g. boim-135883270012@boi"
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E9B44C]/50 text-xs font-mono font-bold focus:ring-2 focus:ring-primary/40 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#382719] mb-1">
                        {lang === 'hi' ? 'वार्षिक सदस्यता शुल्क (₹) *' : 'Annual Membership Fee (INR) *'}
                      </label>
                      <input
                        type="number"
                        value={settingsForm?.membershipFee ?? 200}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, membershipFee: Number(e.target.value) }))}
                        placeholder="200"
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E9B44C]/50 text-xs font-mono font-bold focus:ring-2 focus:ring-primary/40 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#382719] mb-1">
                        {lang === 'hi' ? 'बैंक खाता संख्या' : 'Bank Account Number'}
                      </label>
                      <input
                        type="text"
                        value={settingsForm?.accountNumber || ''}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E9B44C]/50 text-xs font-mono focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#382719] mb-1">
                        {lang === 'hi' ? 'बैंक IFSC कोड' : 'Bank IFSC Code'}
                      </label>
                      <input
                        type="text"
                        value={settingsForm?.ifsc || ''}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, ifsc: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E9B44C]/50 text-xs font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? '80G आयकर छूट पंजीकरण संख्या (वैकल्पिक)' : '80G Tax Exemption Registration Number (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={settingsForm?.section80G || ''}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, section80G: e.target.value }))}
                      placeholder={lang === 'hi' ? 'उदा. AAATR1234EF20261 (आधिकारिक रसीद पर प्रदर्शित होगा)' : 'e.g. AAATR1234EF20261 (Printed on official receipts if present)'}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E9B44C]/50 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="px-6 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs sm:text-sm shadow-saffron transition-all disabled:opacity-50"
                    >
                      {isSavingSettings ? (lang === 'hi' ? 'सेटिंग्स सहेजी जा रही हैं...' : 'Saving Settings...') : (lang === 'hi' ? 'पेमेंट सेटिंग्स सहेजें' : 'Save Payment Settings')}
                    </button>
                  </div>
                </div>

              </div>
            </form>
            </div>
          </div>
        ) : activeTab === 'announcements' ? (
          /* Tab: Announcements & Notices Panel */
          <div className="space-y-6">
            {/* Create Announcement Box */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E9B44C]/35 shadow-card max-w-4xl text-left space-y-4">
              <div className="flex items-center gap-2.5 border-b border-[#E9B44C]/30 pb-3">
                <Bell className="w-5 h-5 text-primary" />
                <h3 className="font-black text-base sm:text-lg text-[#382719] font-hindi-heading">
                  {lang === 'hi' ? 'नई सार्वजनिक सूचना / संदेश प्रकाशित करें' : 'Publish New Notice / Update'}
                </h3>
              </div>

              <form onSubmit={handleCreateNotice} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'सूचना का शीर्षक *' : 'Notice Title *'}
                    </label>
                    <input
                      type="text"
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                      placeholder={lang === 'hi' ? 'उदा. आगामी वैदिक संस्कार शिविर 25 अक्टूबर' : 'e.g. Upcoming Vedic Sanskar Camp 25th Oct'}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'श्रेणी (Category)' : 'Category'}
                    </label>
                    <select
                      value={announcementForm.category}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="general">सामान्य सूचना (General)</option>
                      <option value="urgent">अति महत्वपूर्ण (Urgent)</option>
                      <option value="event">धार्मिक/सेवा कार्यक्रम (Event)</option>
                      <option value="sanskar">संस्कार शिविर (Sanskar)</option>
                    </select>
                  </div>
                </div>

                {/* Target Audience Selector */}
                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1.5">
                    {lang === 'hi' ? 'सूचना प्राप्तकर्ता (Target Audience) *' : 'Target Audience *'}
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setNoticeTargetAudience('both')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                        noticeTargetAudience === 'both'
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                          : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700'
                      }`}
                    >
                      <span>👥 {lang === 'hi' ? 'सभी सदस्य व स्वयंसेवक (Default)' : 'Both (Members & Volunteers)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoticeTargetAudience('members')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                        noticeTargetAudience === 'members'
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                          : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700'
                      }`}
                    >
                      <span>🛡️ {lang === 'hi' ? 'केवल सदस्य (Members Only)' : 'Members Only'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoticeTargetAudience('volunteers')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                        noticeTargetAudience === 'volunteers'
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                          : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700'
                      }`}
                    >
                      <span>🤝 {lang === 'hi' ? 'केवल स्वयंसेवक (Volunteers Only)' : 'Volunteers Only'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'सूचना का विस्तृत विवरण *' : 'Notice Detailed Content *'}
                  </label>
                  <textarea
                    rows={4}
                    value={announcementForm.content}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                    placeholder={lang === 'hi' ? 'सूचना का पूरा विवरण लिखें जो सदस्य व स्वयंसेवक डैशबोर्ड पर दिखेगा और व्हाट्सएप पर जाएगा...' : 'Write the complete announcement content visible on Dashboards and sent to WhatsApp...'}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {/* Poster / Image Upload */}
                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'सूचना पोस्टर / छायाचित्र (वैकल्पिक)' : 'Notice Poster / Image (Optional)'}
                  </label>
                  {noticeImagePreview ? (
                    <div className="relative inline-block rounded-xl overflow-hidden border border-gray-300 bg-gray-50 p-1">
                      <img src={noticeImagePreview} alt="Preview" className="h-28 w-auto rounded-lg object-contain" />
                      <button
                        type="button"
                        onClick={handleClearNoticeImage}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 text-xs font-bold text-gray-700 cursor-pointer transition-all">
                      <Upload className="w-4 h-4 text-emerald-700" />
                      <span>{lang === 'hi' ? 'चित्र / पोस्टर अपलोड करें' : 'Upload Image / Poster'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleNoticeImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                  <span className="text-[10px] text-gray-500 block mt-1">PNG, JPG, WebP (max 5MB)</span>
                </div>

                {/* Send on WhatsApp Checkbox */}
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-950">
                    <input
                      type="checkbox"
                      checked={sendToWhatsAppOnPublish}
                      onChange={(e) => setSendToWhatsAppOnPublish(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                    />
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{lang === 'hi' ? 'प्रकाशित करते ही सभी लक्षित सदस्यों/स्वयंसेवकों के व्हाट्सएप पर भी भेजें' : 'Broadcast to WhatsApp upon publishing'}</span>
                  </label>
                  <span className="text-[11px] text-emerald-700 font-mono">
                    {lang === 'hi' ? 'प्रेषक:' : 'From:'} +91 {whatsappSettings.adminPhone || '9794590044'}
                  </span>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isPublishingNotice}
                    className="px-6 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs sm:text-sm shadow-saffron transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isPublishingNotice ? (lang === 'hi' ? 'प्रकाशित हो रहा है...' : 'Publishing...') : (lang === 'hi' ? 'डैशबोर्ड व व्हाट्सएप पर प्रकाशित करें' : 'Publish to Dashboards & WhatsApp')}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Announcements List */}
            <div className="max-w-4xl space-y-3 text-left">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#666666]">
                {lang === 'hi' ? `प्रकाशित सूचनाएं (${announcements.length})` : `Published Notices (${announcements.length})`}
              </h4>

              {announcements.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl border border-gray-200 text-center text-xs text-gray-500">
                  {lang === 'hi' ? 'अभी कोई सूचना प्रकाशित नहीं है।' : 'No notices published yet.'}
                </div>
              ) : (
                announcements.map((ann) => (
                  <div key={ann.id} className="p-4 sm:p-5 bg-white rounded-2xl border border-[#E9B44C]/35 shadow-xs flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary">
                          {ann.category || 'General'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {ann.targetAudience === 'members'
                            ? '🛡️ Members Only'
                            : ann.targetAudience === 'volunteers'
                            ? '🤝 Volunteers Only'
                            : '👥 All Members & Volunteers'}
                        </span>
                        <span className="text-[11px] text-gray-500 font-mono">
                          {formatDate(ann.publishedAt || ann.createdAt)}
                        </span>
                      </div>

                      <h5 className="font-extrabold text-sm sm:text-base text-[#382719]">
                        {ann.title}
                      </h5>

                      {ann.imageUrl && (
                        <div className="my-2">
                          <img
                            src={ann.imageUrl}
                            alt="Notice poster"
                            className="max-h-36 rounded-xl border border-gray-200 object-cover shadow-2xs"
                          />
                        </div>
                      )}

                      <p className="text-xs text-[#555555] whitespace-pre-wrap leading-relaxed">
                        {ann.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-start flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenNoticeBroadcast(ann)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                        title="Re-broadcast on WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{lang === 'hi' ? 'व्हाट्सएप भेजें' : 'Send WhatsApp'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteNotice(ann.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all flex-shrink-0"
                        title="Delete Notice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Table Views (Help Requests, Memberships, Members, Volunteers, Donations) */
          <>
            {/* When activeTab is 'members': Three Dedicated Sections for All 3 Member Types */}
            {activeTab === 'members' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-hindi-heading font-black text-sm sm:text-base text-[#382719] flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span>सदस्यता श्रेणी अनुभाग (Three Membership Categories)</span>
                    </h3>
                    <p className="text-[11px] text-[#666666]">
                      प्रत्येक श्रेणी के सदस्यों का पृथक विवरण, सहायता/व्यवसाय प्रोफाइल एवं कार्ड प्रबंधन
                    </p>
                  </div>

                  {/* All Categories Toggle Pill */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setMemberCategorySection('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        memberCategorySection === 'all'
                          ? 'bg-[#382719] text-white shadow-xs'
                          : 'bg-[#FFF8EF] text-[#666666] hover:text-[#382719] border border-[#E9B44C]/40'
                      }`}
                    >
                      सभी श्रेणियां (All {activeMembers.length})
                    </button>
                  </div>
                </div>

                {/* 3 Interactive Category Section Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Section 1: Category A */}
                  <button
                    type="button"
                    onClick={() => setMemberCategorySection('catA')}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                      memberCategorySection === 'catA'
                        ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-50 to-white border-emerald-500 shadow-md ring-2 ring-emerald-400/40'
                        : 'bg-white hover:bg-emerald-50/50 border-[#E9B44C]/30 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                          <Heart className="w-4 h-4 fill-white/20" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            श्रेणी - क • निःशुल्क (₹0)
                          </span>
                          <h4 className="font-extrabold text-xs sm:text-sm text-[#382719] mt-0.5 font-hindi-heading">
                            निराश्रित / सहायता लाभार्थी
                          </h4>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-black ${
                        memberCategorySection === 'catA' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {catACount}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#666666] mt-2 line-clamp-1">
                      चिकित्सा, राशन, शिक्षा एवं पारिवारिक सहायता प्राप्त सदस्य (शुल्क: ₹0)
                    </p>
                  </button>

                  {/* Section 2: Category B */}
                  <button
                    type="button"
                    onClick={() => setMemberCategorySection('catB')}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                      memberCategorySection === 'catB'
                        ? 'bg-gradient-to-br from-[#E87516]/10 via-[#FFF8EF] to-white border-[#E87516] shadow-md ring-2 ring-[#E87516]/40'
                        : 'bg-white hover:bg-[#FFF8EF]/50 border-[#E9B44C]/30 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#E87516] text-white flex items-center justify-center shadow-xs">
                          <Award className="w-4 h-4 fill-white/20" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#B85A09] bg-[#FFF8EF] border border-[#E9B44C]/60 px-1.5 py-0.5 rounded">
                            श्रेणी - ख • ₹200/वर्ष
                          </span>
                          <h4 className="font-extrabold text-xs sm:text-sm text-[#382719] mt-0.5 font-hindi-heading">
                            साधारण / संरक्षक सदस्य
                          </h4>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-black ${
                        memberCategorySection === 'catB' ? 'bg-[#E87516] text-white' : 'bg-[#FFF8EF] text-[#B85A09] border border-[#E9B44C]'
                      }`}>
                        {catBCount}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#666666] mt-2 line-clamp-1">
                      संस्कार संवर्धन, प्रचार एवं वार्षिक संरक्षक सहयोगदाता (शुल्क: ₹200)
                    </p>
                  </button>

                  {/* Section 3: Category C */}
                  <button
                    type="button"
                    onClick={() => setMemberCategorySection('catC')}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                      memberCategorySection === 'catC'
                        ? 'bg-gradient-to-br from-blue-500/10 via-blue-50 to-white border-blue-500 shadow-md ring-2 ring-blue-400/40'
                        : 'bg-white hover:bg-blue-50/50 border-[#E9B44C]/30 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                          <Users className="w-4 h-4 fill-white/20" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                            श्रेणी - ग • सेवा संकल्प
                          </span>
                          <h4 className="font-extrabold text-xs sm:text-sm text-[#382719] mt-0.5 font-hindi-heading">
                            समर्पित कार्यकर्ता / स्वयंसेवक
                          </h4>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-black ${
                        memberCategorySection === 'catC' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {catCCount}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#666666] mt-2 line-clamp-1">
                      जमीनी शिविर, रक्तदान, श्रमिक सहायता एवं कार्यक्रम प्रबंधन स्वयंसेवक
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-[#E9B44C]/30 shadow-xs">
              
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'members'
                      ? (lang === 'hi' ? 'सदस्य ID, नाम, फोन या भुगतान ID द्वारा खोजें...' : 'Search by Member ID, Name, Phone, or Payment ID...')
                      : (lang === 'hi' ? 'नाम, फोन, भुगतान ID / UTR द्वारा खोजें...' : 'Search by Name, Phone, Payment ID / UTR...')
                  }
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E9B44C]/40 bg-[#FFF8EF]/30 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
                />
              </div>

              {/* Status Filter for general tabs vs member filter */}
              {activeTab === 'members' ? (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setMemberFilter('active')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      memberFilter === 'active' ? 'bg-emerald-600 text-white' : 'bg-[#FFF8EF] text-[#666666]'
                    }`}
                  >
                    {lang === 'hi' ? `सक्रिय सदस्य (${totalActiveMembers})` : `Active Members (${totalActiveMembers})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberFilter('removed')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      memberFilter === 'removed' ? 'bg-rose-600 text-white' : 'bg-[#FFF8EF] text-[#666666]'
                    }`}
                  >
                    {lang === 'hi' ? `हटाए गए (${membersList.filter(m => m.status === 'removed').length})` : `Removed (${membersList.filter(m => m.status === 'removed').length})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      memberFilter === 'all' ? 'bg-primary text-white' : 'bg-[#FFF8EF] text-[#666666]'
                    }`}
                  >
                    {lang === 'hi' ? 'सभी इतिहास' : 'All History'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  {activeTab === 'memberships' && (
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      <button
                        type="button"
                        onClick={() => setApplicationTypeFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                          applicationTypeFilter === 'all'
                            ? 'bg-[#382719] text-white shadow-xs'
                            : 'bg-[#FFF8EF] text-[#666666] hover:text-[#382719] border border-[#E9B44C]/40'
                        }`}
                      >
                        {lang === 'hi' ? `सभी (${memberships.length + volunteers.length})` : `All (${memberships.length + volunteers.length})`}
                      </button>
                      <button
                        type="button"
                        onClick={() => setApplicationTypeFilter('membership')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                          applicationTypeFilter === 'membership'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-[#FFF8EF] text-[#666666] hover:text-[#382719] border border-[#E9B44C]/40'
                        }`}
                      >
                        🛡️ {lang === 'hi' ? `सदस्यता (${memberships.length})` : `Members (${memberships.length})`}
                      </button>
                      <button
                        type="button"
                        onClick={() => setApplicationTypeFilter('volunteer')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                          applicationTypeFilter === 'volunteer'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-[#FFF8EF] text-[#666666] hover:text-[#382719] border border-[#E9B44C]/40'
                        }`}
                      >
                        🤝 {lang === 'hi' ? `स्वयंसेवक (${volunteers.length})` : `Volunteers (${volunteers.length})`}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'all', label: lang === 'hi' ? 'सभी' : 'All' },
                    { id: 'pending', label: lang === 'hi' ? 'लंबित' : 'Pending' },
                    { id: 'approved', label: lang === 'hi' ? 'स्वीकृत' : 'Approved' },
                    { id: 'rejected', label: lang === 'hi' ? 'अस्वीकृत' : 'Rejected' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setStatusFilter(f.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        statusFilter === f.id
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-[#FFF8EF] text-[#666666] hover:text-[#382719] border border-[#E9B44C]/40'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                  </div>
                </div>
              )}
            </div>

            {/* Data Table (Desktop) & Cards (Mobile) */}
            <div className="bg-white rounded-2xl border border-[#E9B44C]/30 shadow-xs overflow-hidden">
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#FFF8EF] border-b border-[#E9B44C]/30 text-[#382719] font-black uppercase text-[11px] tracking-wider">
                      {activeTab === 'members' ? (
                        <>
                          <th className="py-3 px-4">{lang === 'hi' ? 'सदस्य ID व स्थिति' : 'Member ID & Status'}</th>
                          <th className="py-3 px-4">{lang === 'hi' ? 'सदस्य का नाम' : 'Member Name'}</th>
                          <th className="py-3 px-4">{lang === 'hi' ? 'फोन व स्थान' : 'Phone & Location'}</th>
                          <th className="py-3 px-4">
                            {memberCategorySection === 'catA' ? (lang === 'hi' ? 'आवश्यक सहायता' : 'Assistance Needed') :
                             memberCategorySection === 'catB' ? (lang === 'hi' ? 'व्यवसाय व कार्यक्षेत्र' : 'Profession & Workplace') :
                             memberCategorySection === 'catC' ? (lang === 'hi' ? 'सेवा क्षेत्र' : 'Seva Wings') :
                             (lang === 'hi' ? 'श्रेणी व विवरण' : 'Category & Details')}
                          </th>
                          <th className="py-3 px-4">
                            {memberCategorySection === 'catA' ? (lang === 'hi' ? 'स्वीकृति दिनांक' : 'Approved Date') : (lang === 'hi' ? 'भुगतान ID / शुल्क' : 'Payment ID / Fee')}
                          </th>
                          <th className="py-3 px-4 text-right">{lang === 'hi' ? 'कार्रवाई' : 'Actions'}</th>
                        </>
                      ) : (
                        <>
                          <th className="py-3 px-4">{lang === 'hi' ? 'दिनांक' : 'Date'}</th>
                          <th className="py-3 px-4">{lang === 'hi' ? 'आवेदक / दानदाता' : 'Applicant / Donor'}</th>
                          <th className="py-3 px-4">{lang === 'hi' ? 'मोबाइल नंबर' : 'Phone'}</th>
                          <th className="py-3 px-4">
                            {activeTab === 'donations' || activeTab === 'memberships'
                              ? (lang === 'hi' ? 'भुगतान ID व राशि' : 'Payment ID & Claimed Amt')
                              : (lang === 'hi' ? 'विवरण / प्रयोजन' : 'Details / Purpose')}
                          </th>
                          <th className="py-3 px-4">{lang === 'hi' ? 'स्थिति' : 'Status'}</th>
                          <th className="py-3 px-4 text-right">{lang === 'hi' ? 'कार्रवाई' : 'Actions'}</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9B44C]/20">
                    {currentDisplayData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[#888888]">
                          {lang === 'hi' ? 'खोज या फ़िल्टर के अनुसार कोई रिकॉर्ड नहीं मिला।' : 'No records found matching filters.'}
                        </td>
                      </tr>
                    ) : (
                      currentDisplayData.map((item) => {
                        const status = (item.status || 'pending').toLowerCase();
                        const name = item.fullName || item.donorName || item.payerName || 'Unknown';
                        const phone = item.phone || item.donorPhone || item.mobile || item.whatsapp || item.payerMobile || '—';

                        if (activeTab === 'members') {
                          const isRemoved = item.status === 'removed';
                          return (
                            <tr key={item.id} className="hover:bg-[#FFFDF9] transition-colors">
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="space-y-1">
                                  <span className="font-mono text-xs font-black text-[#382719] block">
                                    {item.memberId || 'N/A'}
                                  </span>
                                  {isRemoved ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 inline-block">
                                      Revoked Member
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-block">
                                      Active Member
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3.5 px-4 font-bold text-[#382719]">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {/* Badge directly in front of name! */}
                                  <MemberBadge
                                    category={item.category || 'catB'}
                                    memberId={item.memberId}
                                    variant="inline"
                                    lang={lang}
                                  />
                                  <span className="font-black text-sm">{name}</span>
                                  {item.memberType === 'volunteer' || item.category === 'catC' ? (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      🤝 स्वयंसेवक
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                      🛡️ सदस्य
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] font-mono text-secondary mt-0.5">
                                  {item.username ? `@${item.username}` : (item.uid ? `UID: ${item.uid.slice(0, 8)}...` : '')}
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-mono text-xs text-[#454545]">{phone}</div>
                                <div className="text-[11px] text-[#777777] line-clamp-1">
                                  {[item.district, item.state].filter(Boolean).join(', ') || 'Gorakhpur'}
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                {item.category === 'catA' ? (
                                  <div className="space-y-0.5">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 inline-block">
                                      {item.helpType || 'पारिवारिक सहायता'}
                                    </span>
                                    {item.monthlyIncome && (
                                      <div className="text-[11px] text-[#666666]">आय: {item.monthlyIncome}</div>
                                    )}
                                    {item.assistanceDescription && (
                                      <p className="text-[10px] text-[#777777] italic line-clamp-1">
                                        "{item.assistanceDescription}"
                                      </p>
                                    )}
                                  </div>
                                ) : item.category === 'catC' ? (
                                  <div className="space-y-0.5">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800 inline-block">
                                      {item.availability || 'Weekends'}
                                    </span>
                                    {item.serviceAreas && item.serviceAreas.length > 0 && (
                                      <div className="text-[10px] text-[#555555] font-medium line-clamp-1">
                                        विंग्स: {item.serviceAreas.join(', ')}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-0.5">
                                    {item.profession && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-[#B85A09] inline-block">
                                        {item.profession}
                                      </span>
                                    )}
                                    {item.workplace && (
                                      <div className="text-[11px] text-[#666666] line-clamp-1">{item.workplace}</div>
                                    )}
                                    {item.focusArea && (
                                      <div className="text-[10px] text-[#777777]">{item.focusArea}</div>
                                    )}
                                  </div>
                                )}
                              </td>

                              <td className="py-3.5 px-4 whitespace-nowrap">
                                {item.category === 'catA' ? (
                                  <div className="space-y-0.5 text-xs">
                                    <span className="text-[11px] font-bold text-emerald-700 block">निःशुल्क (₹0)</span>
                                    <span className="text-[10px] text-[#777777] block">
                                      {formatDate(item.memberSince || item.approvedAt || item.createdAt)}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="space-y-0.5">
                                    <span className="font-mono text-xs text-primary font-bold block">
                                      {item.paymentId || 'N/A'}
                                    </span>
                                    <span className="text-[10px] text-[#777777] block">
                                      शुल्क: ₹{item.verifiedAmount || item.annualFee || 200}/-
                                    </span>
                                  </div>
                                )}
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                                  {(() => {
                                    const isExempted = item.category === 'catA' || item.claimedAmount === 0 || item.paymentId === 'CROSS_APPROVED_FREE' || item.paymentStatus === 'exempted';
                                    if (item.status === 'approved' && isExempted) {
                                      return (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200" title="Cross-exempted / Free - No Receipt Needed">
                                          निःशुल्क (₹0)
                                        </span>
                                      );
                                    }
                                    if (item.receiptSent) {
                                      return (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800" title="Receipt Dispatched">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                          <span>रसीद भेजी गई</span>
                                        </span>
                                      );
                                    }
                                    if (item.status === 'approved') {
                                      return (
                                        <button
                                          type="button"
                                          onClick={() => handleSendReceipt(item, 'membershipApplications')}
                                          disabled={isProcessing}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary hover:bg-secondary text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                                          title="Send Receipt to Member"
                                        >
                                          <Send className="w-3 h-3" />
                                          <span>रसीद भेजें</span>
                                        </button>
                                      );
                                    }
                                    return null;
                                  })()}

                                  {item.receiptNumber && (
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadReceipt(item)}
                                      className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition-all"
                                      title="Download Receipt PDF"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                  )}

                                  {/* WhatsApp Personal Message */}
                                  {(item.whatsapp || item.mobile || item.phone || item.donorPhone || item.payerMobile) && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenPersonalWhatsApp(item)}
                                      className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-all flex items-center gap-1 text-[11px] font-bold"
                                      title={lang === 'hi' ? 'व्हाट्सएप संदेश भेजें' : 'Send WhatsApp Message'}
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                      <span className="hidden xl:inline">WhatsApp</span>
                                    </button>
                                  )}

                                  {!isRemoved && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenRemoveMember(item)}
                                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 transition-all"
                                      title="Remove Member"
                                    >
                                      <UserX className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        // Standard Table Row for memberships, donations, helpRequests, volunteers
                        return (
                          <tr key={item.id} className="hover:bg-[#FFFDF9] transition-colors">
                            <td className="py-3.5 px-4 whitespace-nowrap text-[#666666] text-xs">
                              {formatDate(item.createdAt || item.submittedAt)}
                            </td>

                            <td className="py-3.5 px-4 font-bold text-[#382719]">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {activeTab === 'memberships' && (
                                  <MemberBadge
                                    category={item.category || 'catB'}
                                    variant="inline"
                                    lang={lang}
                                  />
                                )}
                                <span>{name}</span>
                              </div>
                              {item.uid ? (
                                <span className="text-[10px] text-[#888888] font-mono">
                                  UID: {item.uid.slice(0, 8)}...
                                </span>
                              ) : activeTab === 'donations' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                                  🌟 {lang === 'hi' ? 'गैर-पंजीकृत दानदाता' : 'Public Donor'}
                                </span>
                              ) : null}
                            </td>

                            <td className="py-3.5 px-4 font-mono text-[#454545]">
                              {phone}
                            </td>

                            <td className="py-3.5 px-4">
                              {activeTab === 'memberships' && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {item.appType === 'volunteer' || item.memberType === 'volunteer' || item.category === 'catC' ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        🤝 स्वयंसेवक आवेदन (Volunteer)
                                      </span>
                                    ) : item.category === 'catA' ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                                        Cat A (निराश्रित/सहायता)
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                                        🛡️ सदस्यता आवेदन (Member)
                                      </span>
                                    )}
                                    {item.appType === 'volunteer' ? (
                                      <span className="text-[10px] font-bold text-emerald-700">सेवा पंजीकरण</span>
                                    ) : item.category === 'catA' ? (
                                      <span className="text-[10px] font-bold text-emerald-700">Fee: ₹0 (Exempted)</span>
                                    ) : (
                                      <span className="text-[10px] font-mono font-bold text-[#454545]">₹{item.claimedAmount || 200}</span>
                                    )}
                                  </div>

                                  {item.appType === 'volunteer' ? (
                                    <div className="text-[11px] text-[#555555]">
                                      <span className="font-semibold text-emerald-800">{item.cityOrDistrict || item.district || 'गोरखपुर'}</span>
                                      <span className="text-[10px] text-[#777777] block">
                                        समय: {item.availability === 'full_time' ? 'पूर्णकालिक (Full Time)' : 'सप्ताहांत (Weekends)'}
                                      </span>
                                      {item.serviceAreas && (
                                        <span className="text-[10px] text-[#555555] block">
                                          विंग्स: {Array.isArray(item.serviceAreas) ? item.serviceAreas.join(', ') : item.serviceAreas}
                                        </span>
                                      )}
                                    </div>
                                  ) : item.category === 'catA' ? (
                                    <div className="text-[11px] text-[#555555]">
                                      <span className="font-semibold text-primary">{item.helpType || 'सहायता प्रार्थी'}</span>
                                      {item.assistanceDescription && (
                                        <p className="text-[10px] text-[#777777] line-clamp-1 italic mt-0.5">"{item.assistanceDescription}"</p>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-[11px] text-[#555555]">
                                      <span className="font-mono text-xs font-bold text-primary">PID: {item.paymentId || 'N/A'}</span>
                                      {item.verifiedAmount && (
                                        <span className="text-emerald-700 font-bold ml-1.5">
                                          (Verified: ₹{item.verifiedAmount})
                                        </span>
                                      )}
                                      {item.profession && (
                                        <span className="text-[10px] text-[#777777] block capitalize">Profession: {item.profession}</span>
                                      )}
                                      {item.availability && (
                                        <span className="text-[10px] text-[#777777] block capitalize">Time: {item.availability}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              {activeTab === 'donations' && (
                                <div className="space-y-0.5">
                                  <div className="font-mono text-xs font-black text-primary">
                                    PID: {item.paymentId || item.utrNumber || 'N/A'}
                                  </div>
                                  <div className="text-[11px] text-[#555555]">
                                    Claimed: ₹{item.claimedAmount || item.amount || 0}
                                    {item.verifiedAmount && (
                                      <span className="text-emerald-700 font-bold ml-1.5">
                                        (Verified: ₹{item.verifiedAmount})
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-[#888888] uppercase block">
                                    {item.purpose || 'General Samarpan'}
                                  </span>
                                </div>
                              )}

                              {activeTab === 'helpRequests' && (
                                <div className="space-y-0.5">
                                  <span className="font-bold text-primary">{item.helpType || item.category}</span>
                                  {item.amountNeeded && (
                                    <span className="font-mono text-xs font-bold text-[#382719] block">
                                      Needed: ₹{Number(item.amountNeeded).toLocaleString('en-IN')}
                                    </span>
                                  )}
                                </div>
                              )}

                              {activeTab === 'volunteers' && (
                                <div className="space-y-0.5">
                                  <span className="font-semibold text-[#454545]">{item.cityOrDistrict || 'Gorakhpur'}</span>
                                  <span className="text-[10px] text-[#777777] block">
                                    {item.availability === 'full_time' ? 'Full Time' : 'Weekends'}
                                  </span>
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              {status === 'approved' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>{lang === 'hi' ? 'स्वीकृत' : 'Approved'}</span>
                                </span>
                              )}
                              {status === 'rejected' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  <span>{lang === 'hi' ? 'अस्वीकृत' : 'Rejected'}</span>
                                </span>
                              )}
                              {status === 'pending' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>{lang === 'hi' ? 'लंबित' : 'Pending'}</span>
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleOpenView(item)}
                                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#382719] transition-all"
                                  title={lang === 'hi' ? 'विवरण देखें' : 'View Details'}
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {status === 'approved' && (activeTab === 'memberships' || activeTab === 'donations' || activeTab === 'volunteers') && (() => {
                                  const isExempted = item.claimedAmount === 0 || item.paymentId === 'CROSS_APPROVED_FREE' || item.paymentStatus === 'exempted' || item.category === 'catA';
                                  if (isExempted) {
                                    return (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200" title={lang === 'hi' ? 'निःशुल्क (₹0)' : 'Exempted (₹0)'}>
                                        {lang === 'hi' ? 'निःशुल्क (₹0)' : 'Exempted (₹0)'}
                                      </span>
                                    );
                                  }
                                  return item.receiptSent ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800" title={lang === 'hi' ? 'रसीद भेजी जा चुकी है' : 'Receipt Dispatched'}>
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>{lang === 'hi' ? 'रसीद भेजी गई' : 'Receipt Sent'}</span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleSendReceipt(item, activeTab)}
                                      disabled={isProcessing}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary hover:bg-secondary text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                                      title={lang === 'hi' ? 'रसीद भेजें' : 'Send Receipt to User'}
                                    >
                                      <Send className="w-3 h-3" />
                                      <span>{lang === 'hi' ? 'रसीद भेजें' : 'Send Receipt'}</span>
                                    </button>
                                  );
                                })()}

                                {status === 'approved' && item.receiptNumber && (
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadReceipt(item)}
                                    className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition-all"
                                    title={lang === 'hi' ? 'रसीद देखें एवं डाउनलोड करें' : 'View & Download Receipt'}
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                )}

                                {/* WhatsApp Action: Send / Resend Official Receipt to WhatsApp for Donations */}
                                {activeTab === 'donations' && status === 'approved' && (item.donorPhone || item.whatsapp || item.mobile || item.phone || item.payerMobile) && (
                                  <button
                                    type="button"
                                    onClick={() => handleSendReceipt(item, 'donations')}
                                    disabled={isProcessing}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                                    title={lang === 'hi' ? 'व्हाट्सएप पर दान रसीद भेजें' : 'Send Donation Receipt on WhatsApp'}
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>{item.receiptSent ? (lang === 'hi' ? 'पुनः रसीद' : 'Resend WA') : (lang === 'hi' ? 'व्हाट्सएप रसीद' : 'WA Receipt')}</span>
                                  </button>
                                )}

                                {/* WhatsApp Personal Message */}
                                {(item.whatsapp || item.mobile || item.phone || item.donorPhone || item.payerMobile) && (activeTab !== 'donations' || status !== 'approved') && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPersonalWhatsApp(item)}
                                    className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition-all flex items-center gap-1 text-[11px] font-bold"
                                    title={lang === 'hi' ? 'व्हाट्सएप संदेश भेजें' : 'Send WhatsApp Message'}
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Pending Actions: Approve & Reject */}
                                {status === 'pending' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenApprove(item)}
                                      className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition-all cursor-pointer"
                                      title={lang === 'hi' ? 'स्वीकृत करें' : 'Approve'}
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenReject(item)}
                                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 transition-all cursor-pointer"
                                      title={lang === 'hi' ? 'अस्वीकृत करें' : 'Reject'}
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                )}

                                {/* Approved Action for Memberships: Cancel / Revoke Membership */}
                                {status === 'approved' && (activeTab === 'memberships' || activeTab === 'members') && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenRemoveMember(item)}
                                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 transition-all cursor-pointer"
                                    title={lang === 'hi' ? 'सदस्यता रद्द करें' : 'Cancel / Revoke Membership'}
                                  >
                                    <UserX className="w-4 h-4" />
                                  </button>
                                )}

                                {/* Removed status indicator */}
                                {status === 'removed' && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    {lang === 'hi' ? 'रद्द सदस्यता' : 'Cancelled'}
                                  </span>
                                )}

                                {/* Rejected status indicator */}
                                {status === 'rejected' && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-300">
                                    {lang === 'hi' ? 'अस्वीकृत' : 'Rejected'}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Vertical Cards View (under md) */}
              <div className="block md:hidden p-3 space-y-3 bg-[#FAF6EE]/30">
                {currentDisplayData.length === 0 ? (
                  <div className="py-10 px-4 text-center text-[#888888] bg-white rounded-xl border border-dashed border-[#E9B44C]/40 text-xs sm:text-sm">
                    {lang === 'hi' ? 'खोज या फ़िल्टर के अनुसार कोई रिकॉर्ड नहीं मिला।' : 'No records found matching filters.'}
                  </div>
                ) : (
                  currentDisplayData.map((item) => {
                    const status = (item.status || 'pending').toLowerCase();
                    const name = item.fullName || item.donorName || item.payerName || 'Unknown';
                    const phone = item.phone || item.donorPhone || item.payerMobile || '—';
                    const isRemoved = item.status === 'removed';

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-[#E9B44C]/35 shadow-xs p-3.5 space-y-2.5 transition-all text-left"
                      >
                        {/* 1. Header: Date/ID + Status Badge */}
                        <div className="flex items-center justify-between gap-2 text-xs">
                          {activeTab === 'members' ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-xs font-black text-[#382719] bg-[#FFF8EF] px-2 py-0.5 rounded border border-[#E9B44C]/40">
                                {item.memberId || 'N/A'}
                              </span>
                              {isRemoved ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                                  {lang === 'hi' ? 'रद्द सदस्यता' : 'Revoked'}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  {lang === 'hi' ? 'सक्रिय सदस्य' : 'Active'}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-[#777777]">
                              <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="font-medium">{formatDate(item.createdAt || item.submittedAt)}</span>
                            </div>
                          )}

                          {/* Status Pill */}
                          {status === 'approved' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{lang === 'hi' ? 'स्वीकृत' : 'Approved'}</span>
                            </span>
                          )}
                          {status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>{lang === 'hi' ? 'अस्वीकृत' : 'Rejected'}</span>
                            </span>
                          )}
                          {status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 shrink-0">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>{lang === 'hi' ? 'लंबित' : 'Pending'}</span>
                            </span>
                          )}
                          {status === 'removed' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                              {lang === 'hi' ? 'रद्द' : 'Revoked'}
                            </span>
                          )}
                        </div>

                        {/* 2. Applicant / Member Block */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {(activeTab === 'memberships' || activeTab === 'members') && (
                                <MemberBadge
                                  category={item.category || 'catB'}
                                  memberId={item.memberId}
                                  variant="inline"
                                  lang={lang}
                                />
                              )}
                              <h4 className="font-black text-sm text-[#382719] break-words">{name}</h4>
                              {item.memberType === 'volunteer' || item.category === 'catC' ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  {lang === 'hi' ? '🤝 स्वयंसेवक' : '🤝 Volunteer'}
                                </span>
                              ) : item.category === 'catA' ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
                                  {lang === 'hi' ? 'निराश्रित/सहायता' : 'Cat A'}
                                </span>
                              ) : (activeTab === 'memberships' || activeTab === 'members') ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                  {lang === 'hi' ? '🛡️ सदस्य' : '🛡️ Member'}
                                </span>
                              ) : (activeTab === 'donations' && (!item.uid || !item.memberId)) ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                  {lang === 'hi' ? '🌟 गैर-पंजीकृत दानदाता' : '🌟 Public Donor'}
                                </span>
                              ) : null}
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-[#777777] flex-wrap">
                              {item.username && (
                                <span className="font-mono text-secondary">@{item.username}</span>
                              )}
                              {item.uid && !item.username && (
                                <span className="font-mono text-[10px] text-[#888888]">UID: {item.uid.slice(0, 8)}...</span>
                              )}
                              {(item.district || item.cityOrDistrict || item.state) && (
                                <span className="inline-flex items-center gap-0.5 text-[#666666]">
                                  <MapPin className="w-3 h-3 text-[#A88B72] shrink-0" />
                                  {[item.district || item.cityOrDistrict, item.state].filter(Boolean).join(', ')}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Direct Phone / Call link */}
                          {phone && phone !== '—' && (
                            <a
                              href={`tel:${phone}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FFF8EF] border border-[#E9B44C]/40 text-[#382719] font-mono text-xs font-bold shrink-0 hover:bg-[#FFE8CC] transition-colors"
                              title={lang === 'hi' ? 'कॉल करें' : 'Call'}
                            >
                              <Phone className="w-3 h-3 text-primary" />
                              <span>{phone}</span>
                            </a>
                          )}
                        </div>

                        {/* 3. Details / Financial Block */}
                        {activeTab === 'memberships' && (
                          <div className="bg-[#FFFDF9] rounded-lg p-2.5 border border-[#E9B44C]/25 text-xs space-y-1">
                            {item.category === 'catA' ? (
                              <>
                                <div className="flex items-center justify-between">
                                  <span className="text-[#777777]">{lang === 'hi' ? 'सहायता प्रकार:' : 'Help Type:'}</span>
                                  <span className="font-bold text-primary">{item.helpType || 'पारिवारिक सहायता'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[#777777]">{lang === 'hi' ? 'शुल्क:' : 'Fee:'}</span>
                                  <span className="font-bold text-emerald-700">{lang === 'hi' ? 'निःशुल्क (₹0)' : 'Exempted (₹0)'}</span>
                                </div>
                                {item.monthlyIncome && (
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-[#777777]">{lang === 'hi' ? 'मासिक आय:' : 'Monthly Income:'}</span>
                                    <span className="font-medium text-[#454545]">{item.monthlyIncome}</span>
                                  </div>
                                )}
                                {item.assistanceDescription && (
                                  <p className="text-[11px] text-[#666666] italic bg-white p-1.5 rounded border border-gray-100 mt-1">
                                    "{item.assistanceDescription}"
                                  </p>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="flex items-center justify-between flex-wrap gap-1">
                                  <span className="text-[#777777] font-medium">{lang === 'hi' ? 'भुगतान ID:' : 'Payment ID:'}</span>
                                  <span className="font-mono font-bold text-primary">{item.paymentId || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[#777777]">{lang === 'hi' ? 'राशि:' : 'Amount:'}</span>
                                  <div className="font-bold text-[#382719]">
                                    ₹{item.claimedAmount || 200}
                                    {item.verifiedAmount && (
                                      <span className="text-emerald-700 ml-1 font-semibold">({lang === 'hi' ? 'सत्यापित' : 'Verified'}: ₹{item.verifiedAmount})</span>
                                    )}
                                  </div>
                                </div>
                                {item.profession && (
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-[#777777]">{lang === 'hi' ? 'व्यवसाय:' : 'Profession:'}</span>
                                    <span className="font-medium text-[#454545] capitalize">{item.profession}</span>
                                  </div>
                                )}
                                {item.availability && (
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-[#777777]">{lang === 'hi' ? 'समय:' : 'Time:'}</span>
                                    <span className="font-medium text-[#454545]">{item.availability}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {activeTab === 'donations' && (
                          <div className="bg-[#FFFDF9] rounded-lg p-2.5 border border-[#E9B44C]/25 text-xs space-y-1">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <span className="text-[#777777]">{lang === 'hi' ? 'भुगतान / UTR:' : 'Payment / UTR:'}</span>
                              <span className="font-mono font-bold text-primary">{item.paymentId || item.utrNumber || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[#777777]">{lang === 'hi' ? 'दान राशि:' : 'Donation Amt:'}</span>
                              <div className="font-bold text-[#382719]">
                                ₹{item.claimedAmount || item.amount || 0}
                                {item.verifiedAmount && (
                                  <span className="text-emerald-700 ml-1 font-semibold">({lang === 'hi' ? 'सत्यापित' : 'Verified'}: ₹{item.verifiedAmount})</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-[#777777]">{lang === 'hi' ? 'प्रयोजन:' : 'Purpose:'}</span>
                              <span className="font-semibold text-primary uppercase">{item.purpose || 'General Samarpan'}</span>
                            </div>
                          </div>
                        )}

                        {activeTab === 'helpRequests' && (
                          <div className="bg-[#FFFDF9] rounded-lg p-2.5 border border-[#E9B44C]/25 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[#777777]">{lang === 'hi' ? 'सहायता श्रेणी:' : 'Help Category:'}</span>
                              <span className="font-bold text-primary">{item.helpType || item.category}</span>
                            </div>
                            {item.amountNeeded && (
                              <div className="flex items-center justify-between">
                                <span className="text-[#777777]">{lang === 'hi' ? 'आवश्यक राशि:' : 'Amount Needed:'}</span>
                                <span className="font-mono font-bold text-[#382719]">₹{Number(item.amountNeeded).toLocaleString('en-IN')}</span>
                              </div>
                            )}
                            {item.urgency && (
                              <div className="flex items-center justify-between">
                                <span className="text-[#777777]">{lang === 'hi' ? 'प्राथमिकता:' : 'Urgency:'}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.urgency === 'immediate' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {item.urgency}
                                </span>
                              </div>
                            )}
                            {(item.description || item.assistanceDescription) && (
                              <p className="text-[11px] text-[#666666] italic bg-white p-1.5 rounded border border-gray-100 mt-1 line-clamp-2">
                                "{item.description || item.assistanceDescription}"
                              </p>
                            )}
                          </div>
                        )}

                        {activeTab === 'volunteers' && (
                          <div className="bg-[#FFFDF9] rounded-lg p-2.5 border border-[#E9B44C]/25 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[#777777]">{lang === 'hi' ? 'स्थान:' : 'City/District:'}</span>
                              <span className="font-bold text-[#382719]">{item.cityOrDistrict || 'Gorakhpur'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[#777777]">{lang === 'hi' ? 'समय उपलब्धता:' : 'Availability:'}</span>
                              <span className="font-medium text-[#454545]">{item.availability === 'full_time' ? (lang === 'hi' ? 'पूर्णकालिक' : 'Full Time') : (lang === 'hi' ? 'सप्ताहांत (Weekends)' : 'Weekends')}</span>
                            </div>
                            {item.serviceAreas && item.serviceAreas.length > 0 && (
                              <div className="text-[11px] text-[#666666]">
                                <span className="text-[#777777]">{lang === 'hi' ? 'सेवा क्षेत्र: ' : 'Wings: '}</span>
                                <span className="font-medium">{item.serviceAreas.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {activeTab === 'members' && (
                          <div className="bg-[#FFFDF9] rounded-lg p-2.5 border border-[#E9B44C]/25 text-xs space-y-1">
                            {item.category === 'catA' ? (
                              <>
                                <div className="flex items-center justify-between">
                                  <span className="text-[#777777]">{lang === 'hi' ? 'सहायता:' : 'Assistance:'}</span>
                                  <span className="font-bold text-emerald-700">{item.helpType || 'पारिवारिक सहायता'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[#777777]">{lang === 'hi' ? 'स्वीकृति दिनांक:' : 'Approved Date:'}</span>
                                  <span className="text-[#555555]">{formatDate(item.memberSince || item.approvedAt || item.createdAt)}</span>
                                </div>
                              </>
                            ) : item.category === 'catC' ? (
                              <>
                                <div className="flex items-center justify-between">
                                  <span className="text-[#777777]">{lang === 'hi' ? 'उपलब्धता:' : 'Availability:'}</span>
                                  <span className="font-bold text-blue-800">{item.availability || 'Weekends'}</span>
                                </div>
                                {item.serviceAreas && item.serviceAreas.length > 0 && (
                                  <div className="text-[11px] text-[#555555]">
                                    <span className="text-[#777777]">{lang === 'hi' ? 'विंग्स: ' : 'Wings: '}</span>
                                    <span>{item.serviceAreas.join(', ')}</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                {item.profession && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-[#777777]">{lang === 'hi' ? 'व्यवसाय:' : 'Profession:'}</span>
                                    <span className="font-bold text-[#B85A09]">{item.profession}</span>
                                  </div>
                                )}
                                {item.workplace && (
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-[#777777]">{lang === 'hi' ? 'कार्यक्षेत्र:' : 'Workplace:'}</span>
                                    <span className="text-[#555555] truncate max-w-[200px]">{item.workplace}</span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between">
                                  <span className="text-[#777777]">{lang === 'hi' ? 'भुगतान ID:' : 'Payment ID:'}</span>
                                  <span className="font-mono font-bold text-primary">{item.paymentId || 'N/A'}</span>
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {/* 4. Action Buttons Footer: 0 horizontal scrolling! */}
                        {status === 'pending' && (
                          <div className="pt-2 border-t border-[#E9B44C]/20 flex items-center gap-2">
                            {/* Approve Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenApprove(item)}
                              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                              <span>{lang === 'hi' ? 'स्वीकार करें' : 'Approve'}</span>
                            </button>

                            {/* Reject Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenReject(item)}
                              className="flex-1 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                            >
                              <X className="w-4 h-4 stroke-[3]" />
                              <span>{lang === 'hi' ? 'अस्वीकार करें' : 'Reject'}</span>
                            </button>

                            {/* View Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenView(item)}
                              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#382719] border border-gray-200 transition-all flex items-center justify-center cursor-pointer shrink-0"
                              title={lang === 'hi' ? 'विवरण देखें' : 'View Details'}
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* WhatsApp Button */}
                            {(item.whatsapp || item.mobile || item.phone) && (
                              <button
                                type="button"
                                onClick={() => handleOpenPersonalWhatsApp(item)}
                                className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-all flex items-center justify-center cursor-pointer shrink-0"
                                title={lang === 'hi' ? 'व्हाट्सएप संदेश भेजें' : 'Send WhatsApp Message'}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}

                        {status === 'approved' && (
                          <div className="pt-2 border-t border-[#E9B44C]/20 flex items-center gap-2 flex-wrap">
                            {/* Receipt button or receipt status */}
                            {(activeTab === 'memberships' || activeTab === 'donations' || activeTab === 'volunteers' || activeTab === 'members') && (() => {
                              const isExempted = item.claimedAmount === 0 || item.paymentId === 'CROSS_APPROVED_FREE' || item.paymentStatus === 'exempted' || item.category === 'catA';
                              if (isExempted) {
                                return (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    {lang === 'hi' ? 'निःशुल्क (₹0)' : 'Exempted (₹0)'}
                                  </span>
                                );
                              }
                              if (item.receiptSent) {
                                return (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>{lang === 'hi' ? 'रसीद भेजी गई' : 'Receipt Sent'}</span>
                                  </span>
                                );
                              }
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleSendReceipt(item, activeTab === 'members' ? 'membershipApplications' : activeTab)}
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex-1 justify-center"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>{lang === 'hi' ? 'रसीद भेजें' : 'Send Receipt'}</span>
                                </button>
                              );
                            })()}

                            {/* Download receipt if available */}
                            {item.receiptNumber && (
                              <button
                                type="button"
                                onClick={() => handleDownloadReceipt(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-bold transition-all cursor-pointer"
                                title={lang === 'hi' ? 'रसीद डाउनलोड करें' : 'Download Receipt'}
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>{lang === 'hi' ? 'रसीद' : 'Receipt'}</span>
                              </button>
                            )}

                            {/* WhatsApp for Donations (Receipt) */}
                            {activeTab === 'donations' && (item.donorPhone || item.whatsapp || item.mobile || item.phone || item.payerMobile) && (
                              <button
                                type="button"
                                onClick={() => handleSendReceipt(item, 'donations')}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                                title={lang === 'hi' ? 'व्हाट्सएप पर रसीद भेजें' : 'Send Receipt to WhatsApp'}
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>{item.receiptSent ? (lang === 'hi' ? 'पुनः रसीद' : 'Resend WA') : (lang === 'hi' ? 'व्हाट्सएप रसीद' : 'WA Receipt')}</span>
                              </button>
                            )}

                            {/* WhatsApp */}
                            {(item.whatsapp || item.mobile || item.phone || item.donorPhone || item.payerMobile) && activeTab !== 'donations' && (
                              <button
                                type="button"
                                onClick={() => handleOpenPersonalWhatsApp(item)}
                                className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-all flex items-center justify-center cursor-pointer shrink-0"
                                title={lang === 'hi' ? 'व्हाट्सएप संदेश भेजें' : 'Send WhatsApp'}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            )}

                            {/* View */}
                            <button
                              type="button"
                              onClick={() => handleOpenView(item)}
                              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#382719] border border-gray-200 transition-all flex items-center justify-center cursor-pointer shrink-0"
                              title={lang === 'hi' ? 'विवरण देखें' : 'View Details'}
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Cancel / Revoke Membership if applicable */}
                            {(activeTab === 'memberships' || activeTab === 'members') && !isRemoved && (
                              <button
                                type="button"
                                onClick={() => handleOpenRemoveMember(item)}
                                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 transition-all flex items-center justify-center cursor-pointer ml-auto"
                                title={lang === 'hi' ? 'सदस्यता रद्द करें' : 'Revoke Membership'}
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}

                        {(status === 'rejected' || status === 'removed') && (
                          <div className="pt-2 border-t border-[#E9B44C]/20 flex items-center justify-between gap-2">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 border border-gray-300">
                              {status === 'removed' ? (lang === 'hi' ? 'रद्द सदस्यता' : 'Cancelled') : (lang === 'hi' ? 'अस्वीकृत' : 'Rejected')}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {(item.whatsapp || item.mobile || item.phone) && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPersonalWhatsApp(item)}
                                  className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition-all flex items-center justify-center cursor-pointer"
                                  title={lang === 'hi' ? 'व्हाट्सएप संदेश भेजें' : 'Send WhatsApp'}
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenView(item)}
                                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#382719] border border-gray-200 transition-all flex items-center justify-center cursor-pointer"
                                title={lang === 'hi' ? 'विवरण देखें' : 'View Details'}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}

      </main>

      {/* ACTION MODAL (Approve / Reject / Remove / View) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-[#E9B44C]/40 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className={`px-5 py-4 flex items-center justify-between text-white ${
              modalMode === 'approve'
                ? 'bg-emerald-700'
                : modalMode === 'removeMember' || modalMode === 'reject'
                ? 'bg-rose-700'
                : 'bg-primary'
            }`}>
              <div className="flex items-center gap-2">
                {modalMode === 'approve' && <CheckCircle2 className="w-5 h-5" />}
                {modalMode === 'reject' && <XCircle className="w-5 h-5" />}
                {modalMode === 'removeMember' && <UserX className="w-5 h-5" />}
                {modalMode === 'view' && <Eye className="w-5 h-5" />}
                <h3 className="font-black text-sm sm:text-base font-hindi-heading">
                  {modalMode === 'approve' && (
                    lang === 'hi'
                      ? (activeTab === 'memberships' ? 'सदस्यता स्वीकृत करें एवं आईडी जारी करें' : 'स्वीकृत करें एवं सत्यापित राशि दर्ज करें')
                      : (activeTab === 'memberships' ? 'Approve Membership & Issue Member ID' : 'Approve Record & Enter Verified Amount')
                  )}
                  {modalMode === 'reject' && (
                    lang === 'hi' ? 'आवेदन अस्वीकृत करें (कारण दर्ज करें)' : 'Reject Record (Provide Reason)'
                  )}
                  {modalMode === 'removeMember' && (
                    lang === 'hi' ? 'सदस्यता रद्द करें' : 'Remove Member & Revoke Badge'
                  )}
                  {modalMode === 'view' && (
                    lang === 'hi' ? 'पूर्ण विवरण देखें' : 'Full Record Details'
                  )}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1 rounded-full hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-left">
              
              {/* Record Summary Box */}
              <div className="p-4 rounded-2xl bg-[#FFF8EF] border border-[#E9B44C]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#888888] font-bold">{lang === 'hi' ? 'आवेदक / दानकर्ता:' : 'Applicant / Contributor:'}</span>
                  <div className="flex items-center gap-1.5">
                    {selectedItem.category && (
                      <MemberBadge
                        category={selectedItem.category}
                        memberId={selectedItem.memberId}
                        variant="inline"
                        lang={lang}
                      />
                    )}
                    <span className="font-bold text-[#382719]">
                      {selectedItem.fullName || selectedItem.donorName || selectedItem.payerName}
                    </span>
                  </div>
                </div>

                {selectedItem.username && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#888888] font-bold">{lang === 'hi' ? 'यूज़रनेम:' : 'Username:'}</span>
                    <span className="font-mono font-bold text-secondary">@{selectedItem.username}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[#888888] font-bold">{lang === 'hi' ? 'मोबाइल नंबर:' : 'Phone Number:'}</span>
                  <span className="font-mono font-bold text-primary">
                    {selectedItem.phone || selectedItem.donorPhone || selectedItem.payerMobile || selectedItem.mobile}
                  </span>
                </div>

                {selectedItem.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#888888] font-bold">{lang === 'hi' ? 'ईमेल:' : 'Email:'}</span>
                    <span className="font-mono text-xs text-[#555555]">{selectedItem.email}</span>
                  </div>
                )}

                {selectedItem.address && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#888888] font-bold">{lang === 'hi' ? 'पता / शहर:' : 'Address / City:'}</span>
                    <span className="text-xs text-[#454545] text-right max-w-[60%]">
                      {[selectedItem.address, selectedItem.block, selectedItem.district, selectedItem.state].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}

                {/* Payment Proof Section: Screenshot OR UTR */}
                {(selectedItem.paymentScreenshotUrl || selectedItem.paymentId || selectedItem.utrNumber) && (
                  <div className="p-3 bg-white rounded-xl border border-[#E9B44C]/40 space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#382719] flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-primary" />
                        <span>{lang === 'hi' ? 'भुगतान प्रमाण' : 'Payment Proof'}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary">
                        {selectedItem.paymentProofType === 'screenshot' || selectedItem.paymentScreenshotUrl 
                          ? (lang === 'hi' ? 'स्क्रीनशॉट' : 'Screenshot') 
                          : 'UTR / Ref'}
                      </span>
                    </div>

                    {(selectedItem.paymentId || selectedItem.utrNumber) && (
                      <div className="flex items-center justify-between bg-[#FFF8EF] p-2 rounded-lg font-mono">
                        <span className="text-xs text-[#666666] font-bold">{lang === 'hi' ? 'यूटीआर / संदर्भ संख्या:' : 'UTR / Ref No:'}</span>
                        <span className="text-xs font-black text-primary tracking-wider">
                          {selectedItem.paymentId || selectedItem.utrNumber}
                        </span>
                      </div>
                    )}

                    {selectedItem.paymentScreenshotUrl && (
                      <div className="space-y-1.5 pt-1">
                        <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 max-h-56 flex items-center justify-center p-1">
                          <img
                            src={selectedItem.paymentScreenshotUrl}
                            alt="Payment Screenshot Proof"
                            className="max-h-52 w-auto object-contain rounded-lg"
                          />
                        </div>
                        <div className="text-right">
                          <a
                            href={selectedItem.paymentScreenshotUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-bold"
                          >
                            <span>{lang === 'hi' ? 'पूर्ण आकार में स्क्रीनशॉट देखें' : 'View Full Image'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Help Seeker Specific Details & Bank Info */}
                {(selectedItem.helpType || selectedItem.bankAccount || selectedItem.amountNeeded || activeTab === 'helpRequests') && (
                  <div className="p-3.5 bg-white rounded-xl border border-primary/20 space-y-2.5 mt-2">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                      <span className="font-black text-xs text-[#382719]">{lang === 'hi' ? 'सहायता प्रार्थी विवरण' : 'Help Seeker Details'}</span>
                      {selectedItem.urgency && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          selectedItem.urgency === 'urgent' || selectedItem.urgency === 'emergency' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {selectedItem.urgency}
                        </span>
                      )}
                    </div>

                    {selectedItem.description && (
                      <div className="text-xs text-[#555555] bg-gray-50 p-2 rounded-lg">
                        <span className="font-bold text-[#382719] block mb-0.5">{lang === 'hi' ? 'समस्या / आवश्यकता:' : 'Description / Requirement:'}</span>
                        <p className="whitespace-pre-line">{selectedItem.description}</p>
                      </div>
                    )}

                    {selectedItem.amountNeeded && (
                      <div className="flex items-center justify-between font-mono text-xs">
                        <span className="font-bold text-[#666666]">{lang === 'hi' ? 'आवश्यक राशि:' : 'Amount Needed:'}</span>
                        <span className="font-black text-primary text-sm">₹{Number(selectedItem.amountNeeded).toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    {/* Bank Details */}
                    <div className="bg-[#FFF8EF] p-2.5 rounded-lg border border-[#E9B44C]/30 space-y-1 text-xs">
                      <span className="font-bold text-secondary block text-[11px] uppercase tracking-wider">{lang === 'hi' ? 'बैंक खाता विवरण' : 'Bank Account Details'}</span>
                      <div className="flex justify-between">
                        <span className="text-[#666666]">{lang === 'hi' ? 'खाता संख्या:' : 'A/C Number:'}</span>
                        <span className="font-mono font-bold text-[#382719]">{selectedItem.bankAccount || selectedItem.accountNumber || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666666]">{lang === 'hi' ? 'IFSC कोड:' : 'IFSC Code:'}</span>
                        <span className="font-mono font-bold text-[#382719]">{selectedItem.ifsc || 'N/A'}</span>
                      </div>
                      {selectedItem.accountHolderName && (
                        <div className="flex justify-between">
                          <span className="text-[#666666]">{lang === 'hi' ? 'खाताधारक का नाम:' : 'Account Holder:'}</span>
                          <span className="font-bold text-[#382719]">{selectedItem.accountHolderName}</span>
                        </div>
                      )}
                      {(selectedItem.bankName || selectedItem.upiId) && (
                        <div className="flex justify-between">
                          <span className="text-[#666666]">{lang === 'hi' ? 'बैंक / UPI ID:' : 'Bank / UPI ID:'}</span>
                          <span className="font-mono text-[#382719]">{selectedItem.bankName || selectedItem.upiId}</span>
                        </div>
                      )}
                    </div>

                    {/* Direct Contact Links */}
                    <div className="pt-1.5 flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-[#666666]">{lang === 'hi' ? 'संपर्क करें:' : 'Contact:'}</span>
                      {(selectedItem.mobile || selectedItem.phone) && (
                        <a
                          href={`tel:${selectedItem.mobile || selectedItem.phone}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{lang === 'hi' ? 'कॉल' : 'Call'}</span>
                        </a>
                      )}
                      {(selectedItem.whatsapp || selectedItem.mobile || selectedItem.phone) && (
                        <button
                          type="button"
                          onClick={() => handleOpenPersonalWhatsApp(selectedItem)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{lang === 'hi' ? 'व्हाट्सएप संदेश' : 'WhatsApp'}</span>
                        </button>
                      )}
                      {selectedItem.email && (
                        <a
                          href={`mailto:${selectedItem.email}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all"
                        >
                          <Mail className="w-3 h-3" />
                          <span>{lang === 'hi' ? 'ईमेल' : 'Email'}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[#888888] font-bold">{lang === 'hi' ? 'दावा की गई राशि:' : 'Claimed Amount:'}</span>
                  <span className="font-mono font-bold text-[#382719]">
                    ₹{selectedItem.claimedAmount || selectedItem.amount || 200}/-
                  </span>
                </div>

                {selectedItem.memberId && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#888888] font-bold">{lang === 'hi' ? 'सदस्य आईडी:' : 'Member ID:'}</span>
                    <span className="font-mono font-black text-emerald-700">{selectedItem.memberId}</span>
                  </div>
                )}

                {selectedItem.receiptNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#888888] font-bold">{lang === 'hi' ? 'रसीद संख्या:' : 'Receipt Number:'}</span>
                    <span className="font-mono font-bold text-primary">{selectedItem.receiptNumber}</span>
                  </div>
                )}
              </div>

              {/* View Mode: Send Receipt Action if Approved */}
              {modalMode === 'view' && selectedItem.status === 'approved' && (activeTab === 'memberships' || activeTab === 'donations' || activeTab === 'members' || activeTab === 'volunteers') && (() => {
                const isExempted = selectedItem.claimedAmount === 0 || selectedItem.paymentId === 'CROSS_APPROVED_FREE' || selectedItem.paymentStatus === 'exempted' || selectedItem.category === 'catA';
                if (isExempted) {
                  return (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 shadow-xs">
                      <div>
                        <span className="font-bold text-xs text-emerald-900 block">
                          {lang === 'hi' ? 'निःशुल्क पंजीकरण छूट (₹0)' : 'Free Registration Exemption (₹0)'}
                        </span>
                        <span className="text-[11px] text-emerald-800">
                          {lang === 'hi' 
                            ? 'पूर्व-स्वीकृत सदस्य/स्वयंसेवक छूट के तहत यह पंजीकरण पूर्णतः निःशुल्क (₹0) है। रसीद आवश्यक नहीं है।'
                            : 'This registration is completely free (₹0) under pre-approved exemption. Receipt is not required.'}
                        </span>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="p-3.5 rounded-2xl bg-white border border-[#E9B44C]/40 flex items-center justify-between gap-3 shadow-xs">
                    <div>
                      <span className="font-bold text-xs text-[#382719] block">
                        {selectedItem.receiptSent 
                          ? (lang === 'hi' ? 'रसीद प्रेषित है' : 'Receipt Dispatched') 
                          : (lang === 'hi' ? 'रसीद अभी नहीं भेजी गई है' : 'Receipt not yet dispatched')}
                      </span>
                      <span className="text-[11px] text-[#777777]">
                        {selectedItem.receiptSent
                          ? (lang === 'hi' ? 'उपयोगकर्ता अपने डैशबोर्ड से रसीद डाउनलोड कर सकते हैं।' : 'User can download the receipt from their dashboard.')
                          : (lang === 'hi' ? 'रसीद भेजने के बाद ही उपयोगकर्ता इसे अपने डैशबोर्ड से डाउनलोड कर सकेंगे।' : 'User can only download receipt once sent by admin.')}
                      </span>
                    </div>

                    {selectedItem.receiptSent ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleDownloadReceipt(selectedItem)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{lang === 'hi' ? 'रसीद देखें' : 'View Receipt'}</span>
                        </button>
                        {(selectedItem.donorPhone || selectedItem.phone || selectedItem.mobile || selectedItem.whatsapp) && (
                          <button
                            type="button"
                            onClick={() => handleSendReceipt(selectedItem, activeTab === 'members' ? 'membershipApplications' : activeTab)}
                            disabled={isProcessing}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs inline-flex items-center gap-1 cursor-pointer"
                            title={lang === 'hi' ? 'व्हाट्सएप पर पुनः रसीद भेजें' : 'Resend Receipt on WhatsApp'}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{lang === 'hi' ? 'व्हाट्सएप पर पुनः भेजें' : 'Resend on WhatsApp'}</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendReceipt(selectedItem, activeTab === 'members' ? 'membershipApplications' : activeTab)}
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{lang === 'hi' ? 'रसीद जारी करें व व्हाट्सएप भेजें' : 'Dispatch & Send to WhatsApp'}</span>
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Approve Form Inputs */}
              {modalMode === 'approve' && (() => {
                const isItemExempted = selectedItem.category === 'catA' || selectedItem.claimedAmount === 0 || selectedItem.paymentId === 'CROSS_APPROVED_FREE' || selectedItem.paymentStatus === 'exempted';
                return (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs leading-relaxed">
                      <strong>{lang === 'hi' ? 'स्वीकृति सूचना: ' : 'Transaction Action: '}</strong>
                      {isItemExempted
                        ? (lang === 'hi' 
                            ? `निःशुल्क छूट (₹0) के तहत स्वीकृत किया जा रहा है। ${activeTab === 'volunteers' ? 'स्वयंसेवक आईडी (TRUST-V-XXXX)' : 'सदस्य आईडी (TRUST-M-XXXX)'} जारी होगी।`
                            : `Approving under Free Exemption (₹0). Generates ${activeTab === 'volunteers' ? 'Volunteer ID (TRUST-V-XXXX)' : 'Member ID (TRUST-M-XXXX)'}.`)
                        : activeTab === 'volunteers'
                        ? (lang === 'hi' 
                            ? 'स्वीकृति पर स्वयंसेवक आईडी जारी होगी एवं आधिकारिक रसीद बनेगी।' 
                            : 'Approving generates a unique sequential Volunteer ID (TRUST-V-XXXX) and an official receipt.')
                        : activeTab === 'memberships'
                        ? (lang === 'hi' 
                            ? 'स्वीकृति पर सदस्य आईडी जारी होगी एवं आधिकारिक रसीद बनेगी।' 
                            : 'Approving generates a unique sequential Member ID (TRUST-M-XXXX) and an official receipt.')
                        : (lang === 'hi' 
                            ? 'स्वीकृति पर सत्यापित राशि दर्ज होगी एवं आधिकारिक रसीद संख्या जारी होगी।' 
                            : 'Approving saves the admin-entered verified amount and generates an official receipt number.')}
                    </div>

                    {isItemExempted ? (
                      <div className="p-3 rounded-xl bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>{lang === 'hi' ? 'यह पंजीकरण पूर्व-स्वीकृत छूट के तहत पूर्णतः निःशुल्क (₹0) है।' : 'This registration is free under exemption (₹0).'}</span>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-black text-[#382719] mb-1">
                          {lang === 'hi' ? 'प्राप्त सत्यापित राशि (INR ₹) *' : 'Verified Amount Received (INR ₹) *'}
                        </label>
                        <input
                          type="number"
                          value={verifiedAmountInput}
                          onChange={(e) => setVerifiedAmountInput(e.target.value)}
                          placeholder="e.g. 200 or 501"
                          className="w-full p-3 rounded-xl border-2 border-emerald-500 font-mono font-black text-base focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          required
                        />
                        <span className="text-[11px] text-[#666666] block mt-1">
                          {lang === 'hi' 
                            ? 'आधिकारिक रसीद में हमेशा यही सत्यापित राशि दर्ज होगी।' 
                            : 'The official receipt will ALWAYS reflect this verified amount.'}
                        </span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-[#382719] mb-1">
                        {lang === 'hi' ? 'व्यवस्थापक टिप्पणी (वैकल्पिक):' : 'Admin Note (Optional):'}
                      </label>
                      <textarea
                        rows={2}
                        value={adminNoteInput}
                        onChange={(e) => setAdminNoteInput(e.target.value)}
                        placeholder={lang === 'hi' ? 'उदा. बैंक खाता यूटीआर सफलतापूर्वक सत्यापित हुआ।' : 'e.g. Bank statement UTR verified successfully.'}
                        className="w-full p-2.5 rounded-xl border border-[#E9B44C]/50 text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Reject Form Inputs */}
              {modalMode === 'reject' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    {lang === 'hi' 
                      ? 'कृपया स्पष्ट कारण बताएं। आवेदक यह कारण अपने डैशबोर्ड पर देख सकेंगे।' 
                      : 'Please provide a clear reason. The user will see this on their dashboard.'}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-rose-900 mb-1">
                      {lang === 'hi' ? 'अस्वीकृति का कारण *' : 'Reason for Rejection *'}
                    </label>
                    <textarea
                      rows={3}
                      value={rejectReasonInput}
                      onChange={(e) => setRejectReasonInput(e.target.value)}
                      placeholder={lang === 'hi' ? 'उदा. बैंक स्टेटमेंट में यूटीआर नहीं मिला या अमान्य राशि।' : 'e.g. UTR number not found in bank statement or invalid amount.'}
                      className="w-full p-3 rounded-xl border border-rose-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Remove Member Form */}
              {modalMode === 'removeMember' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs leading-relaxed flex items-start gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">
                        {lang === 'hi' ? 'क्या आप वाकई इस सदस्य की सदस्यता रद्द करना चाहते हैं?' : 'Are you sure you want to remove this member?'}
                      </p>
                      <p className="mt-1">
                        {lang === 'hi' 
                          ? 'इनकी सदस्यता स्थिति रद्द कर दी जाएगी एवं सत्यापित सदस्य बैज हट जाएगा।' 
                          : 'Their membership will be cancelled and verified badge will be revoked immediately.'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-rose-900 mb-1">
                      {lang === 'hi' ? 'रद्द करने का कारण (उपयोगकर्ता को दिखेगा) *' : 'Reason for Removal (Shown to User) *'}
                    </label>
                    <textarea
                      rows={3}
                      value={removeReasonInput}
                      onChange={(e) => setRemoveReasonInput(e.target.value)}
                      placeholder={lang === 'hi' ? 'उदा. सदस्यता अवधि समाप्त, अथवा संस्था के नियमों का उल्लंघन।' : 'e.g. Membership term expired, or policy violation.'}
                      className="w-full p-3 rounded-xl border border-rose-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Modal Actions */}
            <div className="px-5 py-4 bg-[#FFF8EF] border-t border-[#E9B44C]/30 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-xl border border-[#E9B44C]/50 text-[#382719] font-bold text-xs hover:bg-white transition-all cursor-pointer"
              >
                {lang === 'hi' ? 'बंद करें' : 'Close'}
              </button>

              {modalMode === 'approve' && (
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isProcessing 
                    ? (lang === 'hi' ? 'प्रक्रिया जारी...' : 'Processing...') 
                    : (lang === 'hi' ? 'पुष्टि करें एवं स्वीकृत करें' : 'Confirm & Approve')}
                </button>
              )}

              {modalMode === 'reject' && (
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isProcessing 
                    ? (lang === 'hi' ? 'प्रक्रिया जारी...' : 'Processing...') 
                    : (lang === 'hi' ? 'अस्वीकृत करें' : 'Confirm Reject')}
                </button>
              )}

              {modalMode === 'removeMember' && (
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <UserX className="w-4 h-4" />
                  <span>
                    {isProcessing
                      ? (lang === 'hi' ? 'रद्द किया जा रहा है...' : 'Revoking...')
                      : (lang === 'hi' ? 'सदस्यता रद्द करें' : 'Confirm Remove Member')}
                  </span>
                </button>
              )}

              {modalMode === 'view' && selectedItem.status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setModalMode('reject');
                      setRejectReasonInput('');
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>{lang === 'hi' ? 'अस्वीकृत करें' : 'Reject'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModalMode('approve');
                      setVerifiedAmountInput(String(selectedItem.claimedAmount || selectedItem.amount || 200));
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{lang === 'hi' ? 'स्वीकृत करें' : 'Approve'}</span>
                  </button>
                </>
              )}

              {modalMode === 'view' && selectedItem.status === 'approved' && (activeTab === 'memberships' || activeTab === 'members') && (
                <button
                  type="button"
                  onClick={() => {
                    setModalMode('removeMember');
                    setRemoveReasonInput('');
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UserX className="w-4 h-4" />
                  <span>{lang === 'hi' ? 'सदस्यता रद्द करें' : 'Cancel Membership'}</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Authentic Traditional / Public Donor Receipt Modal */}
      <OfficialReceiptModal
        isOpen={Boolean(viewingReceipt)}
        onClose={() => setViewingReceipt(null)}
        receipt={viewingReceipt}
        onReceiptSent={async (rcpt) => {
          try {
            await markReceiptSent(rcpt.tab || rcpt.colName || (activeTab === 'members' ? 'membershipApplications' : activeTab), rcpt.id, currentUser?.uid || 'admin');
            setViewingReceipt(prev => prev ? { ...prev, receiptSent: true } : null);
          } catch (e) {
            console.warn('Could not mark receipt sent:', e);
          }
        }}
      />

      {/* Custom Receipt Modal */}
      <CustomReceiptModal
        isOpen={customReceiptModalOpen}
        onClose={() => setCustomReceiptModalOpen(false)}
        onReceiptGenerated={(receiptData) => {
          setViewingReceipt(receiptData);
          toast.success(lang === 'hi' ? 'कस्टम रसीद तैयार की गई और सहेजी गई!' : 'Custom receipt generated and saved!');
        }}
      />

      {/* WhatsApp Notice Broadcast Modal */}
      <WhatsAppBroadcastModal
        isOpen={broadcastModalOpen}
        onClose={() => setBroadcastModalOpen(false)}
        notice={currentBroadcastNotice}
        recipients={broadcastRecipients}
        adminSettings={whatsappSettings}
      />

      {/* WhatsApp 1-to-1 Personal Message Modal */}
      <WhatsAppPersonalModal
        isOpen={personalWhatsAppModalOpen}
        onClose={() => {
          setPersonalWhatsAppModalOpen(false);
          setPersonalRecipient(null);
        }}
        recipient={personalRecipient}
        adminSettings={whatsappSettings}
      />

      {/* WhatsApp Device Connection Modal */}
      <WhatsAppDeviceModal
        isOpen={deviceModalOpen}
        onClose={() => setDeviceModalOpen(false)}
        onStatusChange={(connected, phone) => {
          setBaileysServerState({
            online: true,
            connected,
            phoneNumber: phone
          });
        }}
      />


      {/* ========================================================
          NATIVE MOBILE BOTTOM NAVIGATION BAR (for Trust Admin App)
          ======================================================== */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#2D1F14] text-white border-t border-[#E9B44C]/30 shadow-[0_-4px_24px_rgba(0,0,0,0.3)] pb-[max(env(safe-area-inset-bottom),10px)] pt-2 px-1 flex items-center justify-around sm:hidden">
        {/* Tab 1: Applications (संयुक्त आवेदन - सदस्यता व स्वयंसेवक) */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setActiveTab('memberships');
            setSearchQuery('');
            setStatusFilter('all');
            setApplicationTypeFilter('all');
          }}
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'memberships'
              ? 'text-[#E9B44C] font-black'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <div className="relative">
            <UserPlus className="w-5 h-5" />
            {(memberships.filter(m => (m.status || 'pending').toLowerCase() === 'pending').length + volunteers.filter(v => (v.status || 'pending').toLowerCase() === 'pending').length) > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center font-mono animate-pulse">
                {memberships.filter(m => (m.status || 'pending').toLowerCase() === 'pending').length + volunteers.filter(v => (v.status || 'pending').toLowerCase() === 'pending').length}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">
            {lang === 'hi' ? 'आवेदन' : 'Applications'}
          </span>
          {activeTab === 'memberships' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#E9B44C] mt-0.5" />
          )}
        </button>

        {/* Tab 2: Donations (समर्पण / दान) */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setActiveTab('donations');
            setSearchQuery('');
            setStatusFilter('all');
          }}
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'donations'
              ? 'text-[#E9B44C] font-black'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <div className="relative">
            <Heart className="w-5 h-5" />
            {donations.filter(d => (d.status || 'pending').toLowerCase() === 'pending').length > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center font-mono">
                {donations.filter(d => (d.status || 'pending').toLowerCase() === 'pending').length}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">
            {lang === 'hi' ? 'दान' : 'Donations'}
          </span>
          {activeTab === 'donations' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#E9B44C] mt-0.5" />
          )}
        </button>

        {/* Tab 3: Notices & Announcements (सूचना प्रकाशन) */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setActiveTab('announcements');
            setSearchQuery('');
          }}
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'announcements'
              ? 'text-[#E9B44C] font-black'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {announcements.length > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-white text-[9px] font-black flex items-center justify-center font-mono">
                {announcements.length}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">
            {lang === 'hi' ? 'सूचनाएं' : 'Notices'}
          </span>
          {activeTab === 'announcements' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#E9B44C] mt-0.5" />
          )}
        </button>

        {/* Tab 4: Help Requests (सहायता) */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setActiveTab('helpRequests');
            setSearchQuery('');
            setStatusFilter('all');
          }}
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'helpRequests'
              ? 'text-[#E9B44C] font-black'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <div className="relative">
            <HandHeart className="w-5 h-5" />
            {helpRequests.filter(h => (h.status || 'pending').toLowerCase() === 'pending').length > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center font-mono">
                {helpRequests.filter(h => (h.status || 'pending').toLowerCase() === 'pending').length}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">
            {lang === 'hi' ? 'सहायता' : 'Help'}
          </span>
          {activeTab === 'helpRequests' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#E9B44C] mt-0.5" />
          )}
        </button>

        {/* Tab 5: More (अधिक विकल्प - WhatsApp, Volunteers, Settings, Push Test) */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setMobileMoreOpen(true);
          }}
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'paymentSettings' || activeTab === 'volunteers' || mobileMoreOpen
              ? 'text-[#E9B44C] font-black'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">
            {lang === 'hi' ? 'अधिक' : 'More'}
          </span>
          {(activeTab === 'paymentSettings' || activeTab === 'volunteers') && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#E9B44C] mt-0.5" />
          )}
        </button>
      </nav>

      {/* ========================================================
          MOBILE "MORE" BOTTOM DRAWER / SHEET
          ======================================================== */}
      {mobileMoreOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end sm:hidden">
          <div
            className="fixed inset-0"
            onClick={() => setMobileMoreOpen(false)}
          />
          <div className="relative bg-white rounded-t-3xl border-t border-[#E9B44C]/40 p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto pb-[max(env(safe-area-inset-bottom),20px)]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                <h3 className="font-hindi-heading font-black text-base text-[#382719]">
                  {lang === 'hi' ? 'व्यवस्थापक अधिक विकल्प' : 'Admin More Options'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileMoreOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Custom Receipt Generator */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setCustomReceiptModalOpen(true);
                  setMobileMoreOpen(false);
                }}
                className="p-3 rounded-2xl border border-amber-300 bg-amber-50/80 text-left transition-all flex flex-col gap-1.5 cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <Receipt className="w-5 h-5 text-amber-700" />
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded">NEW</span>
                </div>
                <span className="text-xs font-black text-amber-950">
                  {lang === 'hi' ? 'कस्टम रसीद' : 'Custom Receipt'}
                </span>
                <span className="text-[10px] text-amber-800">
                  {lang === 'hi' ? 'विवरण भरकर रसीद बनाएं' : 'Generate & download'}
                </span>
              </button>

              {/* Verified Members List */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setActiveTab('members');
                  setSearchQuery('');
                  setMobileMoreOpen(false);
                }}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                  activeTab === 'members'
                    ? 'bg-primary/10 border-primary text-primary font-bold'
                    : 'bg-[#FFFDF9] border-[#E9B44C]/30 text-gray-800 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {membersList.length}
                  </span>
                </div>
                <span className="text-xs font-black">
                  {lang === 'hi' ? 'सत्यापित सदस्य' : 'Verified Members'}
                </span>
                <span className="text-[10px] text-gray-500">
                  {lang === 'hi' ? 'आईडी कार्ड व सूची' : 'Members & ID cards'}
                </span>
              </button>

              {/* Volunteers List */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setActiveTab('volunteers');
                  setSearchQuery('');
                  setStatusFilter('all');
                  setMobileMoreOpen(false);
                }}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                  activeTab === 'volunteers'
                    ? 'bg-primary/10 border-primary text-primary font-bold'
                    : 'bg-[#FFFDF9] border-[#E9B44C]/30 text-gray-800 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    {volunteers.length}
                  </span>
                </div>
                <span className="text-xs font-black">
                  {lang === 'hi' ? 'स्वयंसेवक सूची' : 'Volunteers List'}
                </span>
                <span className="text-[10px] text-gray-500">
                  {lang === 'hi' ? 'स्वयंसेवक व संपर्क' : 'Manage volunteers'}
                </span>
              </button>

              {/* Payment & Settings */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setActiveTab('paymentSettings');
                  setMobileMoreOpen(false);
                }}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                  activeTab === 'paymentSettings'
                    ? 'bg-primary/10 border-primary text-primary font-bold'
                    : 'bg-[#FFFDF9] border-[#E9B44C]/30 text-gray-800 hover:bg-gray-50'
                }`}
              >
                <QrCode className="w-5 h-5 text-amber-600" />
                <span className="text-xs font-black">
                  {lang === 'hi' ? 'भुगतान सेटिंग्स' : 'Payment Settings'}
                </span>
                <span className="text-[10px] text-gray-500">
                  {lang === 'hi' ? 'UPI, QR व बैंक विवरण' : 'QR code & UPI info'}
                </span>
              </button>

              {/* WhatsApp Bot Connection */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setDeviceModalOpen(true);
                  setMobileMoreOpen(false);
                }}
                className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 text-left transition-all flex flex-col gap-1.5 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  <span className={`w-2 h-2 rounded-full ${baileysServerState.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                </div>
                <span className="text-xs font-black text-emerald-900">
                  {lang === 'hi' ? 'व्हाट्सएप बॉट' : 'WhatsApp Bot'}
                </span>
                <span className="text-[10px] text-emerald-700">
                  {baileysServerState.connected ? (baileysServerState.phoneNumber || 'सक्रिय (Online)') : (lang === 'hi' ? 'QR स्कैन करें' : 'Pair Device')}
                </span>
              </button>

              {/* Test Push Notification */}
              <button
                type="button"
                onClick={handleSendTestPush}
                disabled={isSendingTestPush}
                className="p-3 rounded-2xl border border-blue-200 bg-blue-50/70 text-left transition-all flex flex-col gap-1.5 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <Bell className="w-5 h-5 text-blue-600" />
                  {isSendingTestPush && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />}
                </div>
                <span className="text-xs font-black text-blue-900">
                  {lang === 'hi' ? 'टेस्ट नोटिफिकेशन' : 'Test Push Alert'}
                </span>
                <span className="text-[10px] text-blue-700">
                  {lang === 'hi' ? 'अलर्ट जांचें' : 'Trigger test alert'}
                </span>
              </button>
            </div>

            {/* Background 24/7 Notification Helper Note */}
            <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-[11px] text-amber-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Bell className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>24/7 बैकग्राउंड अलर्ट सेटिंग (Keep Alerts Active):</span>
              </div>
              <p className="text-[10.5px] text-amber-800 leading-relaxed">
                फोन बंद होने या ऐप हटने पर भी घंटी बजने के लिए: फोन की <strong>Settings &gt; Apps &gt; Trust Admin &gt; Battery Usage</strong> में <strong>"Allow Background Activity"</strong> व <strong>"Auto-launch"</strong> चालू रखें।
              </p>
            </div>

            {/* Quick Action: Language */}
            <div className="pt-2 border-t border-gray-100 flex items-center">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  toggleLanguage();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Globe className="w-4 h-4 text-primary" />
                <span>{lang === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
