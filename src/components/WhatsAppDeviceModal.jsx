import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Unlink,
  ShieldCheck,
  Zap,
  Loader2,
  Info
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const WhatsAppDeviceModal = ({ isOpen, onClose, onStatusChange }) => {
  const toast = useToast();
  const [status, setStatus] = useState('DISCONNECTED'); // 'DISCONNECTED' | 'INITIALIZING' | 'QR_READY' | 'CONNECTED'
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setStatus(json.data.status);
          if (json.data.phoneNumber) setPhoneNumber(json.data.phoneNumber);
          if (json.data.qrCodeDataUrl) setQrCodeDataUrl(json.data.qrCodeDataUrl);
          if (onStatusChange) {
            onStatusChange(json.data.status === 'CONNECTED', json.data.phoneNumber);
          }
        }
      }
    } catch (err) {
      console.warn('WhatsApp status check:', err.message);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/whatsapp/connect', { method: 'POST' });
      const json = await res.json();
      if (json.success && json.data) {
        setStatus(json.data.status);
        if (json.data.qrCodeDataUrl) setQrCodeDataUrl(json.data.qrCodeDataUrl);
      } else {
        toast.error(json.message || 'Failed to initiate pairing');
      }
    } catch (err) {
      toast.error('Could not connect to WhatsApp service: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('क्या आप व्यवस्थापक व्हाट्सएप डिस्कनेक्ट करना चाहते हैं? स्वचालित प्रसारण रोक दिया जाएगा।')) {
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setStatus('DISCONNECTED');
        setPhoneNumber(null);
        setQrCodeDataUrl(null);
        toast.info('व्हाट्सएप सफलतापूर्वक डिस्कनेक्ट किया गया।');
        if (onStatusChange) onStatusChange(false, null);
      }
    } catch (err) {
      toast.error('Failed to disconnect: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!testPhone.trim() || testPhone.replace(/\D/g, '').length < 10) {
      toast.error('कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।');
      return;
    }

    setIsSendingTest(true);
    try {
      const res = await fetch('/api/whatsapp/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPhone: testPhone })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`परीक्षण संदेश ${testPhone} पर सफलतापूर्वक भेजा गया!`);
        setTestPhone('');
      } else {
        toast.error(json.message || 'परीक्षण संदेश भेजने में विफल।');
      }
    } catch (err) {
      toast.error('Failed to send test message: ' + err.message);
    } finally {
      setIsSendingTest(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-emerald-600/30 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-800 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base font-hindi-heading">
                व्यवस्थापक व्हाट्सएप डिवाइस कनेक्शन (Baileys Engine)
              </h3>
              <p className="text-[11px] text-emerald-100">
                SwaadSevak स्टाइल स्वचालित पृष्ठभूमि संदेश प्रणाली
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* CONNECTED STATE */}
          {status === 'CONNECTED' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-emerald-950">सफलतापूर्वक लिंक व सक्रिय है!</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900 animate-pulse">
                      ACTIVE
                    </span>
                  </div>
                  <div className="font-mono font-bold text-sm text-emerald-800 mt-0.5">
                    {phoneNumber || 'Admin WhatsApp'}
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    यह सत्र स्थायी रूप से सक्रिय रहेगा। जब तक आप डिस्कनेक्ट नहीं करते, पुनः स्कैन करने की आवश्यकता नहीं होगी।
                  </p>
                </div>
              </div>

              {/* Test Send Box */}
              <div className="p-4 rounded-2xl bg-[#FFF8EF] border border-[#E9B44C]/40 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#382719]">
                  <Zap className="w-4 h-4 text-primary" />
                  <span>कनेक्शन परीक्षण (Send Test WhatsApp Message)</span>
                </div>
                <p className="text-[11px] text-[#666666]">
                  अपना या किसी सदस्य का नंबर दर्ज कर जांचें कि स्वचालित संदेश तुरंत पहुंच रहा है या नहीं:
                </p>
                <form onSubmit={handleSendTest} className="flex gap-2">
                  <div className="flex items-center flex-1">
                    <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl text-xs font-mono font-bold text-gray-600">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9794590044"
                      className="w-full px-3 py-2 rounded-r-xl border border-gray-300 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSendingTest}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
                  >
                    {isSendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>भेजें</span>
                  </button>
                </form>
              </div>

              {/* Disconnect Action */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>व्हाट्सएप डिवाइस अनलिंक करें (Disconnect)</span>
                </button>
              </div>
            </div>
          ) : status === 'QR_READY' && qrCodeDataUrl ? (
            /* QR READY STATE */
            <div className="space-y-4 text-center">
              <div className="inline-block p-3 rounded-2xl bg-white border-2 border-emerald-500 shadow-lg">
                <img
                  src={qrCodeDataUrl}
                  alt="WhatsApp Pairing QR Code"
                  className="w-56 h-56 mx-auto rounded-lg object-contain"
                />
              </div>

              <div className="space-y-2 text-left bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 text-xs text-emerald-950">
                <span className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <Info className="w-4 h-4" />
                  <span>स्कैन करने के निर्देश (Simple 4 Steps):</span>
                </span>
                <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-emerald-900">
                  <li>अपने मोबाइल फोन में <strong>WhatsApp</strong> खोलें।</li>
                  <li>ऊपर दाईं ओर <strong>Menu (तीन बिंदु)</strong> या <strong>Settings</strong> पर टैप करें।</li>
                  <li><strong>"Linked Devices" (लिंक किए गए डिवाइस)</strong> चुनें।</li>
                  <li><strong>"Link a Device"</strong> पर टैप करें और ऊपर दिए गए QR कोड को कैमरे से स्कैन करें।</li>
                </ol>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                <span>फोन द्वारा स्कैन किए जाने की प्रतीक्षा कर रहा है...</span>
              </div>
            </div>
          ) : (
            /* DISCONNECTED OR INITIALIZING STATE */
            <div className="space-y-5 text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                <Smartphone className="w-8 h-8" />
              </div>

              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="font-extrabold text-base text-[#382719]">
                  व्हाट्सएप डिवाइस कनेक्टेड नहीं है
                </h4>
                <p className="text-xs text-[#666666] leading-relaxed">
                  QR कोड उत्पन्न करने के लिए नीचे दिए बटन पर क्लिक करें। एक बार स्कैन करने के बाद आपके व्यवस्थापक व्हाट्सएप नंबर से सभी नोटिस व संदेश तुरंत स्वचालित रूप से जाएंगे।
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition-all hover:scale-102 flex items-center gap-2 mx-auto disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>QR कोड तैयार हो रहा है...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>WhatsApp लिंक करें (Generate QR Code)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-gray-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>End-to-End Encrypted via Baileys Multi-File Auth</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-white transition-all"
          >
            बंद करें (Close)
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppDeviceModal;
