import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { buildWhatsAppUrl, formatNoticeForWhatsApp, sendViaWhatsAppApi } from '../firebase/whatsappService';
import {
  X,
  MessageSquare,
  Users,
  CheckCircle2,
  Copy,
  ExternalLink,
  Send,
  Loader2,
  AlertCircle,
  Share2,
  Phone,
  Image as ImageIcon
} from 'lucide-react';

export const WhatsAppBroadcastModal = ({
  isOpen,
  onClose,
  notice,
  recipients = [],
  adminSettings
}) => {
  const { lang } = useLanguage();
  const toast = useToast();

  const [sentMap, setSentMap] = useState({});
  const [isAutomatedSending, setIsAutomatedSending] = useState(false);
  const [automatedProgress, setAutomatedProgress] = useState({ current: 0, total: 0 });
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'preview'

  if (!isOpen || !notice) return null;

  const formattedMessage = formatNoticeForWhatsApp(notice);

  // Filter recipients with valid phone/whatsapp
  const validRecipients = recipients.filter(
    (r) => (r.whatsapp || r.mobile || r.phone)
  );

  const handleCopyNotice = () => {
    navigator.clipboard.writeText(formattedMessage);
    setCopied(true);
    toast.success(
      lang === 'hi'
        ? 'व्हाट्सएप संदेश कॉपी हो गया! अब आप इसे सीधे व्हाट्सएप ग्रुप या ब्रॉडकास्ट में पेस्ट कर सकते हैं।'
        : 'WhatsApp notice copied! You can now paste into your broadcast list or group.'
    );
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSingleSend = (recipient) => {
    const phone = recipient.whatsapp || recipient.mobile || recipient.phone;
    const { webUrl, mobileUrl } = buildWhatsAppUrl(phone, formattedMessage);

    // Open WhatsApp Web or mobile app
    const url = window.innerWidth > 768 ? webUrl : mobileUrl;
    window.open(url, '_blank');

    setSentMap((prev) => ({ ...prev, [recipient.id || phone]: true }));
  };

  const handleStartAutomatedSending = async () => {
    if (!adminSettings?.provider || adminSettings.provider === 'direct') {
      toast.info(
        lang === 'hi'
          ? 'स्वचालित बैकग्राउंड डिलीवरी हेतु सेटिंग्स में अल्ट्रा-मैसेज (UltraMsg) या ग्रीन API कुंजी जोड़ें। नीचे दिए गए बटनों से तुरंत चैट खोल सकते हैं।'
          : 'For automated background delivery, configure UltraMsg or GreenAPI in Settings. Use 1-click links below to dispatch.'
      );
      return;
    }

    setIsAutomatedSending(true);
    setAutomatedProgress({ current: 0, total: validRecipients.length });

    let successCount = 0;
    for (let i = 0; i < validRecipients.length; i++) {
      const r = validRecipients[i];
      const phone = r.whatsapp || r.mobile || r.phone;
      try {
        await sendViaWhatsAppApi(phone, formattedMessage, notice.imageUrl, adminSettings);
        setSentMap((prev) => ({ ...prev, [r.id || phone]: true }));
        successCount++;
      } catch (err) {
        console.error(`Failed to send to ${phone}:`, err);
      }
      setAutomatedProgress({ current: i + 1, total: validRecipients.length });
      // Gentle delay between messages to respect rate limits
      await new Promise((res) => setTimeout(res, adminSettings.autoOpenDelayMs || 1500));
    }

    setIsAutomatedSending(false);
    toast.success(
      lang === 'hi'
        ? `${successCount} सदस्यों/स्वयंसेवकों को व्हाट्सएप संदेश सफलतापूर्वक भेजा गया!`
        : `Sent WhatsApp notice to ${successCount} recipients!`
    );
  };

  const sentCount = Object.keys(sentMap).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E9B44C]/40 overflow-hidden text-left">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                {lang === 'hi' ? 'व्हाट्सएप सूचना प्रेषक (WhatsApp Broadcast)' : 'WhatsApp Notice Dispatcher'}
              </h3>
              <p className="text-[11px] text-emerald-100 flex items-center gap-1.5 mt-0.5">
                <span>{lang === 'hi' ? 'प्रेषक नंबर:' : 'From Admin:'}</span>
                <span className="font-mono font-bold text-white bg-black/20 px-1.5 py-0.2 rounded">
                  +91 {adminSettings?.adminPhone || '9794590044'}
                </span>
                {adminSettings?.isConnected && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                    {lang === 'hi' ? 'सक्रिय' : 'Connected'}
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Summary Card */}
        <div className="p-4 bg-[#FFF8EF] border-b border-[#E9B44C]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary text-white">
                {notice.category || 'General'}
              </span>
              <span className="text-xs font-black text-[#382719] truncate">
                {notice.title}
              </span>
            </div>
            <p className="text-[11px] text-[#666666] line-clamp-1">
              {notice.content}
            </p>
            {notice.imageUrl && (
              <span className="inline-flex items-center gap-1 text-[10px] text-primary font-bold">
                <ImageIcon className="w-3 h-3" />
                {lang === 'hi' ? 'पोस्टर/चित्र संलग्न' : 'Image Poster Attached'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={handleCopyNotice}
              className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-xs font-bold text-[#382719] flex items-center justify-center gap-1.5 shadow-2xs transition-all"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-600" />}
              <span>{copied ? (lang === 'hi' ? 'कॉपी हुआ!' : 'Copied!') : (lang === 'hi' ? 'संदेश कॉपी करें' : 'Copy Text')}</span>
            </button>

            {adminSettings?.provider && adminSettings.provider !== 'direct' && (
              <button
                onClick={handleStartAutomatedSending}
                disabled={isAutomatedSending}
                className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all disabled:opacity-50"
              >
                {isAutomatedSending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{automatedProgress.current}/{automatedProgress.total}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'ऑटो सेंड शुरू करें' : 'Auto Broadcast'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Audience Stats & Progress Strip */}
        <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs font-bold text-gray-700">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>{validRecipients.length} {lang === 'hi' ? 'प्राप्तकर्ता (सदस्य व स्वयंसेवक)' : 'Total Recipients'}</span>
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-emerald-700">
              {sentCount} {lang === 'hi' ? 'को भेजा गया' : 'Dispatched'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'list' ? 'bg-emerald-800 text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {lang === 'hi' ? 'प्राप्तकर्ता सूची' : 'Recipient Queue'}
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'preview' ? 'bg-emerald-800 text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {lang === 'hi' ? 'संदेश प्रीव्यू' : 'Message Preview'}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'preview' ? (
            <div className="bg-[#EFEAE2] p-4 rounded-2xl border border-gray-300 font-sans text-xs whitespace-pre-wrap leading-relaxed shadow-inner max-w-lg mx-auto">
              <div className="bg-white p-3.5 rounded-xl rounded-tl-none shadow-xs border border-gray-200 text-gray-800 relative">
                {notice.imageUrl && (
                  <div className="mb-2.5 rounded-lg overflow-hidden border border-gray-200">
                    <img src={notice.imageUrl} alt="Notice poster" className="w-full max-h-48 object-cover" />
                  </div>
                )}
                {formattedMessage}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {validRecipients.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500">
                  {lang === 'hi' ? 'कोई सदस्य या स्वयंसेवक प्राप्तकर्ता उपलब्ध नहीं हैं।' : 'No members or volunteers found for this audience.'}
                </div>
              ) : (
                validRecipients.map((r, idx) => {
                  const phone = r.whatsapp || r.mobile || r.phone;
                  const isSent = Boolean(sentMap[r.id || phone]);
                  const isVolunteer = r.role === 'volunteer' || r.memberType === 'volunteer';

                  return (
                    <div
                      key={r.id || idx}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isSent ? 'bg-emerald-50/50 border-emerald-300' : 'bg-white hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                          isVolunteer ? 'bg-emerald-100 text-emerald-800' : 'bg-[#FFF8EF] text-primary'
                        }`}>
                          {(r.fullName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-[#382719] truncate">
                              {r.fullName || r.donorName || 'Member'}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                              isVolunteer ? 'bg-emerald-100 text-emerald-800' : 'bg-primary/10 text-primary'
                            }`}>
                              {isVolunteer ? 'Volunteer' : 'Member'}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-gray-500 block">
                            +91 {phone}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isSent && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{lang === 'hi' ? 'भेजा गया' : 'Sent'}</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleSingleSend(r)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                            isSent
                              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                          }`}
                        >
                          <Send className="w-3 h-3" />
                          <span>{isSent ? (lang === 'hi' ? 'पुनः भेजें' : 'Resend') : (lang === 'hi' ? 'व्हाट्सएप भेजें' : 'Send')}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs">
          <p className="text-[11px] text-gray-500">
            {lang === 'hi'
              ? '💡 टिप: "संदेश कॉपी करें" दबाकर सीधे अपने व्हाट्सएप ग्रुप या ब्रॉडकास्ट लिस्ट में भी भेज सकते हैं।'
              : '💡 Tip: Click "Copy Text" to send directly to your WhatsApp Broadcast List or Group.'}
          </p>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs transition-colors"
          >
            {lang === 'hi' ? 'बंद करें' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default WhatsAppBroadcastModal;
