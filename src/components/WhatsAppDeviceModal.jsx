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
  Info,
  Copy,
  QrCode,
  KeyRound,
  Share2,
  Sparkles
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getWhatsAppApiBaseUrl } from '../firebase/whatsappService';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

export const WhatsAppDeviceModal = ({ isOpen, onClose, onStatusChange }) => {
  const toast = useToast();
  const [status, setStatus] = useState('DISCONNECTED'); // 'DISCONNECTED' | 'INITIALIZING' | 'QR_READY' | 'CONNECTED'
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [serverOnline, setServerOnline] = useState(true);

  // Mobile pairing code alternative (No camera scan required)
  const [linkMode, setLinkMode] = useState('pairingCode'); // 'pairingCode' | 'qrCode'
  const [adminPhoneInput, setAdminPhoneInput] = useState('9794590044');
  const [pairingCode, setPairingCode] = useState('');
  const [isRequestingPairingCode, setIsRequestingPairingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchStatus = async () => {
    try {
      const baseUrl = getWhatsAppApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/whatsapp/status`, {
        headers: { 'Accept': 'application/json' }
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        setServerOnline(true);
        if (json.success && json.data) {
          setStatus(json.data.status);
          if (json.data.phoneNumber) setPhoneNumber(json.data.phoneNumber);
          if (json.data.qrCodeDataUrl) setQrCodeDataUrl(json.data.qrCodeDataUrl);
          if (onStatusChange) {
            onStatusChange(json.data.status === 'CONNECTED', json.data.phoneNumber);
          }
        }
      } else {
        setServerOnline(false);
      }
    } catch (err) {
      setServerOnline(false);
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
      const baseUrl = getWhatsAppApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/whatsapp/connect`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('WhatsApp ऑटोमेशन सर्वर कनेक्ट नहीं हो सका। कृपया जांचें कि Node.js सर्वर सक्रिय है।');
      }
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

  // Request 8-character pairing code for mobile users
  const handleRequestPairingCode = async (e) => {
    if (e) e.preventDefault();
    const cleanNum = adminPhoneInput.replace(/\D/g, '');
    if (cleanNum.length !== 10) {
      toast.error('कृपया मान्य 10-अंकीय व्हाट्सएप मोबाइल नंबर दर्ज करें।');
      return;
    }

    setIsRequestingPairingCode(true);
    setPairingCode('');
    try {
      const baseUrl = getWhatsAppApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/whatsapp/pairing-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ phone: cleanNum })
      });

      const json = await res.json();
      if (json.success && json.data?.pairingCode) {
        setPairingCode(json.data.pairingCode);
        toast.success('पेयरिंग कोड तैयार है! नीचे दिए 4 चरणों का पालन कर WhatsApp से लिंक करें।');
      } else {
        toast.error(json.message || 'पेयरिंग कोड उत्पन्न नहीं हो सका। कृपया पुनः प्रयास करें।');
      }
    } catch (err) {
      toast.error('पेयरिंग कोड अनुरोध विफल: ' + err.message);
    } finally {
      setIsRequestingPairingCode(false);
    }
  };

  const handleCopyCode = () => {
    if (!pairingCode) return;
    navigator.clipboard?.writeText(pairingCode);
    setCopiedCode(true);
    toast.success('पेयरिंग कोड कॉपी हो गया! अब WhatsApp खोलकर दर्ज करें।');
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleShareQr = async () => {
    if (!qrCodeDataUrl) return;
    try {
      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title: 'Trust WhatsApp QR Code',
          text: 'राष्ट्रीय सनातन संस्कार सेवा संस्थान - व्हाट्सएप लिंक QR कोड। इसे किसी अन्य फ़ोन/लैपटॉप पर खोलकर स्कैन करें।',
          url: qrCodeDataUrl,
          dialogTitle: 'QR कोड शेयर करें'
        });
      } else if (navigator.share) {
        await navigator.share({
          title: 'Trust WhatsApp QR Code',
          text: 'राष्ट्रीय सनातन संस्कार सेवा संस्थान - व्हाट्सएप लिंक QR कोड',
          url: window.location.href
        });
      } else {
        toast.info('QR कोड को सेव कर किसी अन्य स्क्रीन पर खोलें और स्कैन करें।');
      }
    } catch (err) {
      console.warn('Share QR error:', err);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('क्या आप व्यवस्थापक व्हाट्सएप डिस्कनेक्ट करना चाहते हैं? स्वचालित प्रसारण रोक दिया जाएगा।')) {
      return;
    }
    setIsLoading(true);
    try {
      const baseUrl = getWhatsAppApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/whatsapp/disconnect`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Server not responding');
      }
      const json = await res.json();
      if (json.success) {
        setStatus('DISCONNECTED');
        setPhoneNumber(null);
        setQrCodeDataUrl(null);
        setPairingCode('');
        if (onStatusChange) onStatusChange(false, null);
        toast.success('व्हाट्सएप डिवाइस सफलतापूर्वक डिस्कनेक्ट कर दिया गया।');
      }
    } catch (err) {
      toast.error('Could not disconnect: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!testPhone || testPhone.length < 10) {
      toast.error('कृपया मान्य 10-अंकीय मोबाइल नंबर दर्ज करें।');
      return;
    }
    setIsSendingTest(true);
    try {
      const baseUrl = getWhatsAppApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/whatsapp/test-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ targetPhone: testPhone })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`परीक्षण संदेश ${testPhone} पर सफलतापूर्वक भेज दिया गया!`);
        setTestPhone('');
      } else {
        toast.error(json.message || 'परीक्षण संदेश नहीं भेजा जा सका।');
      }
    } catch (err) {
      toast.error('Failed to send test: ' + err.message);
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
                व्यवस्थापक व्हाट्सएप कनेक्शन (WhatsApp Link)
              </h3>
              <p className="text-[11px] text-emerald-100">
                स्वचालित संदेश एवं सूचना प्रसारण प्रणाली
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
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
                    यह सत्र स्थायी रूप से सक्रिय रहेगा। जब तक आप डिस्कनेक्ट नहीं करते, पुनः लिंक करने की आवश्यकता नहीं होगी।
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
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
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
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>व्हाट्सएप डिवाइस अनलिंक करें (Disconnect)</span>
                </button>
              </div>
            </div>
          ) : (
            /* DISCONNECTED OR INITIALIZING: DUAL METHOD SELECTOR */
            <div className="space-y-4">
              {/* Method Tabs */}
              <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-2xl gap-1 border border-gray-200">
                <button
                  type="button"
                  onClick={() => setLinkMode('pairingCode')}
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    linkMode === 'pairingCode'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  <span>फ़ोन नंबर (No Camera)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLinkMode('qrCode');
                    if (status !== 'QR_READY') handleConnect();
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    linkMode === 'qrCode'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>QR कोड स्कैन</span>
                </button>
              </div>

              {/* METHOD 1: PAIRING CODE (Directly on this phone without camera) */}
              {linkMode === 'pairingCode' ? (
                <div className="space-y-3.5">
                  <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-1">
                    <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>उसी मोबाइल से लिंक करने का सबसे आसान तरीका (No Camera Needed)</span>
                    </span>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      चूंकि आप इसी मोबाइल में WhatsApp चला रहे हैं, QR कोड स्कैन करने की आवश्यकता नहीं है। अपना नंबर डालकर 8-अंकीय कोड प्राप्त करें और सीधे WhatsApp में दर्ज करें।
                    </p>
                  </div>

                  <form onSubmit={handleRequestPairingCode} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-[#382719] mb-1">
                        व्यवस्थापक का व्हाट्सएप नंबर (Admin WhatsApp Number)
                      </label>
                      <div className="flex items-center">
                        <span className="px-3.5 py-2.5 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl text-xs font-mono font-bold text-gray-700">
                          +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          value={adminPhoneInput}
                          onChange={(e) => setAdminPhoneInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="9794590044"
                          className="w-full px-3 py-2.5 rounded-r-xl border border-gray-300 text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isRequestingPairingCode}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isRequestingPairingCode ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>पेयरिंग कोड उत्पन्न हो रहा है...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          <span>पेयरिंग कोड प्राप्त करें (Get 8-Digit Pairing Code)</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* DISPLAY PAIRING CODE IF GENERATED */}
                  {pairingCode ? (
                    <div className="p-4 rounded-2xl bg-white border-2 border-emerald-500 shadow-md text-center space-y-3 animate-in fade-in">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                        आपका व्हाट्सएप लिंक कोड (Your 8-Digit Code)
                      </span>
                      <div className="font-mono text-2xl sm:text-3xl font-black tracking-widest text-emerald-800 bg-emerald-50 py-3 px-4 rounded-xl border border-emerald-200">
                        {pairingCode}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        {copiedCode ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedCode ? 'कोड कॉपी हो गया!' : 'कोड कॉपी करें (Copy Code)'}</span>
                      </button>

                      {/* Step-by-Step Guide */}
                      <div className="text-left bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1.5 text-xs">
                        <span className="font-extrabold text-gray-800 flex items-center gap-1.5">
                          <Info className="w-4 h-4 text-emerald-600" />
                          <span>WhatsApp में दर्ज करने के 4 आसान चरण:</span>
                        </span>
                        <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-700 leading-relaxed font-medium">
                          <li>अपने इसी फोन में <strong>WhatsApp</strong> खोलें।</li>
                          <li>ऊपर दाईं ओर <strong>3 बिंदु (Menu)</strong> पर टैप करें &gt; <strong>Linked Devices</strong> चुनें।</li>
                          <li><strong>"Link a Device"</strong> पर टैप करें।</li>
                          <li>नीचे <strong>"Link with phone number instead" (फ़ोन नंबर से लिंक करें)</strong> पर टैप करें और ऊपर दिया गया 8-अंकीय कोड डालें।</li>
                        </ol>
                      </div>
                    </div>
                  ) : (
                    <div className="text-left bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1.5 text-xs">
                      <span className="font-extrabold text-gray-800 flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-emerald-600" />
                        <span>यह कैसे काम करता है?</span>
                      </span>
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        WhatsApp अब बिना किसी दूसरे कैमरे के सीधे 8-अंकीय कोड से उसी फोन पर लिंक करने की सुविधा देता है। ऊपर "पेयरिंग कोड प्राप्त करें" दबाएं और कोड आने पर WhatsApp में दर्ज करें।
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* METHOD 2: QR CODE (Scan from another screen / Share QR) */
                <div className="space-y-4 text-center">
                  {status === 'QR_READY' && qrCodeDataUrl ? (
                    <div className="space-y-3">
                      <div className="inline-block p-3 rounded-2xl bg-white border-2 border-emerald-500 shadow-md">
                        <img
                          src={qrCodeDataUrl}
                          alt="WhatsApp QR Code"
                          className="w-52 h-52 mx-auto rounded-lg object-contain"
                        />
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={handleShareQr}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>QR कोड शेयर करें (Share to other screen)</span>
                        </button>
                      </div>

                      <div className="text-left bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                        <span className="font-bold flex items-center gap-1 text-emerald-900">
                          <Info className="w-4 h-4" />
                          <span>स्कैन करने हेतु:</span>
                        </span>
                        <p className="text-[11px] text-emerald-800 leading-relaxed">
                          यदि आप किसी अन्य फोन या कंप्यूटर स्क्रीन पर इसे खोल रहे हैं, तो अपने फोन के WhatsApp &gt; Linked Devices &gt; Link a Device से सीधे स्कैन कर सकते हैं।
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 py-3">
                      <p className="text-xs text-gray-600">
                        QR कोड उत्पन्न करने के लिए नीचे दिए बटन पर क्लिक करें:
                      </p>
                      <button
                        type="button"
                        onClick={handleConnect}
                        disabled={isLoading}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 mx-auto disabled:opacity-50 cursor-pointer"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        <span>QR कोड उत्पन्न करें (Generate QR)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-gray-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>End-to-End Encrypted Secure WhatsApp Link</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
          >
            बंद करें (Close)
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppDeviceModal;
