import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import {
  getPersonalMessageTemplates,
  buildWhatsAppUrl,
  sendViaWhatsAppApi,
  sendPersonalMessageViaBaileys
} from '../firebase/whatsappService';
import {
  X,
  MessageSquare,
  Send,
  Copy,
  CheckCircle2,
  ExternalLink,
  User,
  Phone,
  Sparkles,
  Loader2
} from 'lucide-react';

export const WhatsAppPersonalModal = ({
  isOpen,
  onClose,
  recipient,
  adminSettings
}) => {
  const { lang } = useLanguage();
  const toast = useToast();

  const phone = recipient?.whatsapp || recipient?.mobile || recipient?.phone || recipient?.donorPhone || '';
  const isDonation = recipient?.donorPhone || recipient?.purpose === 'samarpan' || recipient?.purpose === 'donation' || (!recipient?.memberId && recipient?.amount);

  const [selectedTemplateId, setSelectedTemplateId] = useState(isDonation ? 'donation_receipt' : 'welcome_approval');
  const [messageText, setMessageText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSendingApi, setIsSendingApi] = useState(false);

  useEffect(() => {
    if (recipient && isOpen) {
      const isDon = recipient?.donorPhone || recipient?.purpose === 'samarpan' || recipient?.purpose === 'donation' || (!recipient?.memberId && recipient?.amount);
      const initialTplId = isDon ? 'donation_receipt' : 'welcome_approval';
      setSelectedTemplateId(initialTplId);

      const templates = getPersonalMessageTemplates(recipient, adminSettings?.adminName || 'ट्रस्ट प्रबंधकारिणी');
      const defaultTpl = templates.find((t) => t.id === initialTplId) || templates[0];
      setMessageText(defaultTpl?.text || '');
    }
  }, [recipient, isOpen, adminSettings]);

  if (!isOpen || !recipient) return null;

  const templates = getPersonalMessageTemplates(recipient, adminSettings?.adminName || 'ट्रस्ट प्रबंधकारिणी');

  const handleTemplateChange = (tplId) => {
    setSelectedTemplateId(tplId);
    const chosen = templates.find((t) => t.id === tplId);
    if (chosen) {
      setMessageText(chosen.text);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    toast.success(lang === 'hi' ? 'संदेश कॉपी हो गया!' : 'Message copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendDirect = () => {
    if (!phone) {
      toast.error(lang === 'hi' ? 'व्हाट्सएप नंबर उपलब्ध नहीं है' : 'No phone number available');
      return;
    }
    const { webUrl, mobileUrl } = buildWhatsAppUrl(phone, messageText);
    const url = window.innerWidth > 768 ? webUrl : mobileUrl;
    window.open(url, '_blank');
  };

  const handleSendViaApi = async () => {
    if (!phone) {
      toast.error(lang === 'hi' ? 'व्हाट्सएप नंबर उपलब्ध नहीं है' : 'No phone number available');
      return;
    }
    if (!adminSettings?.provider || adminSettings.provider === 'direct') {
      toast.info(lang === 'hi' ? 'सीधे व्हाट्सएप खोलें बटन का उपयोग करें।' : 'Click "Open WhatsApp Chat" button.');
      return;
    }

    setIsSendingApi(true);
    try {
      await sendViaWhatsAppApi(phone, messageText, null, adminSettings);
      toast.success(lang === 'hi' ? 'व्हाट्सएप संदेश सफलतापूर्वक भेजा गया!' : 'WhatsApp message sent successfully!');
      onClose();
    } catch (err) {
      toast.error('Failed to send via API: ' + err.message);
    } finally {
      setIsSendingApi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#E9B44C]/40 overflow-hidden text-left flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                {lang === 'hi' ? 'व्यक्तिगत व्हाट्सएप संदेश भेजें' : 'Send Personal WhatsApp Message'}
              </h3>
              <p className="text-[11px] text-emerald-100 flex items-center gap-1 mt-0.5 font-mono">
                <span>{lang === 'hi' ? 'प्रेषक:' : 'From:'}</span>
                <span>+91 {adminSettings?.adminPhone || '9794590044'}</span>
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

        {/* Recipient Strip */}
        <div className="p-3.5 bg-[#FFF8EF] border-b border-[#E9B44C]/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              {(recipient.fullName || recipient.donorName || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-[#382719] block truncate">
                {recipient.fullName || recipient.donorName || 'Recipient'}
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                {phone ? `+91 ${phone}` : (lang === 'hi' ? 'नंबर उपलब्ध नहीं' : 'No Phone')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
              {recipient.role || recipient.memberType || 'Contact'}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Template Selector */}
          <div>
            <label className="block text-xs font-bold text-[#382719] mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>{lang === 'hi' ? 'संदेश टेम्पलेट चुनें:' : 'Select Message Template:'}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleTemplateChange(tpl.id)}
                  className={`p-2 rounded-xl text-left border text-xs font-bold transition-all ${
                    selectedTemplateId === tpl.id
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-2xs ring-1 ring-emerald-500'
                      : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                >
                  <span className="block truncate">{lang === 'hi' ? tpl.titleHi : tpl.titleEn}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Message Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#382719]">
                {lang === 'hi' ? 'संदेश की विषय-वस्तु (WhatsApp Text):' : 'Message Content:'}
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
              >
                {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? (lang === 'hi' ? 'कॉपी हुआ' : 'Copied') : (lang === 'hi' ? 'कॉपी करें' : 'Copy')}</span>
              </button>
            </div>
            <textarea
              rows={8}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-300 text-xs sm:text-sm font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/40 bg-gray-50/50 leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold transition-colors"
          >
            {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                if (!phone) {
                  toast.error(lang === 'hi' ? 'व्हाट्सएप नंबर उपलब्ध नहीं है' : 'No phone number available');
                  return;
                }
                setIsSendingApi(true);
                try {
                  await sendPersonalMessageViaBaileys(phone, messageText);
                  toast.success(lang === 'hi' ? 'व्हाट्सएप संदेश तुरंत भेजा गया!' : 'WhatsApp message sent instantly via linked device!');
                  onClose();
                } catch (err) {
                  toast.error(err.message || 'त्रुटि: सीधे चैट खोलें');
                  handleSendDirect();
                } finally {
                  setIsSendingApi(false);
                }
              }}
              disabled={isSendingApi || !phone}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all hover:scale-102 disabled:opacity-50 cursor-pointer"
              title="Send instantly from linked admin WhatsApp without opening chat window"
            >
              {isSendingApi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{lang === 'hi' ? 'तुरंत स्वचालित भेजें (Instant Send)' : 'Instant Automated Send'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendDirect}
              disabled={!phone}
              className="p-2 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold transition-all disabled:opacity-50"
              title="Open in WhatsApp Web"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WhatsAppPersonalModal;
