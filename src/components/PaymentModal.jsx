import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { submitDonationWithPaymentId, subscribePaymentSettings, DEFAULT_PAYMENT_SETTINGS } from '../firebase/paymentService';
import {
  X,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  Building,
  AlertCircle,
  Globe,
  Info,
  Calendar,
  Heart,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

const DONATION_PURPOSES = [
  { id: 'samarpan', labelHi: 'सामान्य समर्पण निधि (General Welfare Samarpan)', labelEn: 'General Welfare Samarpan' },
  { id: 'labor_welfare', labelHi: 'श्रमिक कल्याण एवं दुर्घटना सहायता', labelEn: 'Labor Welfare & Relief Fund' },
  { id: 'sanskar_camps', labelHi: '१६ वैदिक संस्कार जागरण शिविर', labelEn: '16 Vedic Sanskars Awareness Camps' },
  { id: 'medical_aid', labelHi: 'निर्धन चिकित्सा एवं औषधि सहयोग', labelEn: 'Needy Medical & Hospitalization Support' },
  { id: 'cow_service', labelHi: 'गौ सेवा एवं पोषण प्रकल्प', labelEn: 'Gau Seva & Animal Care' }
];

export const PaymentModal = ({ isOpen, onClose, defaultPurpose = 'samarpan', defaultAmount = '501' }) => {
  const { lang, toggleLanguage } = useLanguage();
  const { currentUser, userProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [paymentSettings, setPaymentSettings] = useState(DEFAULT_PAYMENT_SETTINGS);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const [formData, setFormData] = useState({
    payerName: userProfile?.fullName || userProfile?.displayName || '',
    payerMobile: userProfile?.phone || userProfile?.mobile || '',
    purpose: defaultPurpose,
    amount: defaultAmount,
    paymentId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState(null);

  // Subscribe to payment settings
  useEffect(() => {
    const unsub = subscribePaymentSettings((settings) => {
      setPaymentSettings(settings);
    });
    return () => unsub();
  }, []);


  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        payerName: prev.payerName || userProfile.fullName || userProfile.displayName || '',
        payerMobile: prev.payerMobile || userProfile.phone || userProfile.mobile || ''
      }));
    }
  }, [userProfile]);

  if (!isOpen) return null;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    if (name === 'paymentId') {
      value = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.payerName.trim()) {
      errs.payerName = lang === 'hi' ? 'कृपया दानदाता का नाम दर्ज करें' : 'Enter donor name';
    }
    if (!formData.payerMobile.trim() || !/^[6-9]\d{9}$/.test(formData.payerMobile.replace(/\D/g, ''))) {
      errs.payerMobile = lang === 'hi' ? 'मान्य 10-अंकीय व्हाट्सएप नंबर दर्ज करें' : 'Enter valid 10-digit WhatsApp number';
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      errs.amount = lang === 'hi' ? 'मान्य समर्पण राशि दर्ज करें' : 'Enter valid positive amount';
    }

    const cleanPid = (formData.paymentId || '').trim();
    if (!cleanPid) {
      errs.paymentId = lang === 'hi'
        ? 'कृपया Payment ID / UTR दर्ज करें।'
        : 'Payment ID / UTR is required.';
    } else if (cleanPid.length < 8 || cleanPid.length > 30) {
      errs.paymentId = lang === 'hi'
        ? 'Payment ID / UTR 8 से 30 अक्षरों या अंकों का होना चाहिए।'
        : 'Payment ID must be 8-30 alphanumeric characters.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const result = await submitDonationWithPaymentId({
        donorName: formData.payerName,
        donorPhone: formData.payerMobile,
        claimedAmount: formData.amount,
        purpose: formData.purpose,
        paymentId: formData.paymentId,
        paymentDate: formData.paymentDate,
        uid: currentUser?.uid || null
      });

      setSubmittedRef(result.paymentId);
      toast.success(
        lang === 'hi'
          ? 'Submitted. Your payment will be verified by the admin.'
          : 'Submitted. Your payment will be verified by the admin.'
      );

      try {
        confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
      } catch {}
    } catch (err) {
      console.error("Payment submission failed:", err);
      let errorMsg = err.message;
      if (err.message && err.message.includes("already used")) {
        errorMsg = "This Payment ID was already used";
        setErrors(prev => ({ ...prev, paymentId: errorMsg }));
      } else {
        setErrors(prev => ({ ...prev, form: errorMsg }));
      }
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSubmittedRef(null);
    setFormData({
      payerName: userProfile?.fullName || userProfile?.displayName || '',
      payerMobile: userProfile?.phone || userProfile?.mobile || '',
      purpose: defaultPurpose,
      amount: defaultAmount,
      paymentId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-[#E9B44C]/40 my-auto sm:my-8 max-h-[94vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-primary text-white px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-secondary text-white font-bold flex items-center justify-center text-xs sm:text-sm shadow-sm flex-shrink-0">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-black font-hindi-heading truncate">
                {lang === 'hi' ? 'समर्पण निधि / दान एवं UTR सत्यापन' : 'Donation & Payment Verification'}
              </h2>
              <p className="text-[10px] sm:text-xs text-white/80 truncate">
                {paymentSettings.payeeName || 'Rashtriya Sanatan Sanskar Seva Sansthan (Trust)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1 transition-all"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5 text-[#E9B44C]" />
              <span>{lang === 'hi' ? 'EN' : 'हिंदी'}</span>
            </button>
            <button
              type="button"
              onClick={resetAndClose}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-left">
          {submittedRef ? (
            <div className="text-center py-6 sm:py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  {lang === 'hi' ? 'सफलतापूर्वक दर्ज' : 'Recorded Successfully'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#382719] mt-2 font-hindi-heading">
                  Submitted. Your payment will be verified by the admin.
                </h3>
                <p className="text-xs sm:text-sm text-[#454545] max-w-md mx-auto mt-2 leading-relaxed">
                  {lang === 'hi'
                    ? 'आपका समर्पण विवरण एवं Payment ID दर्ज हो गया है। ट्रस्ट व्यवस्थापक द्वारा बैंक मिलान कर राशि सत्यापित की जाएगी, जिसके उपरांत आपकी आधिकारिक रसीद जनरेट होगी।'
                    : 'Your transaction reference has been logged. Once verified against bank records by the trust admin, your verified official receipt will be generated.'}
                </p>
              </div>

              <div className="p-4 bg-[#FFF8EF] rounded-2xl border border-[#E9B44C]/40 max-w-sm mx-auto text-xs space-y-1">
                <span className="text-[#777777] block">दर्ज Payment ID / UTR:</span>
                <span className="font-mono font-black text-primary text-sm sm:text-base tracking-wider break-all">
                  {submittedRef}
                </span>
                <span className="text-[11px] text-amber-700 font-bold block mt-1">
                  स्थिति: सत्यापन प्रतीक्षारत (Pending Verification)
                </span>
              </div>

              <button
                type="button"
                onClick={resetAndClose}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs sm:text-sm shadow-saffron transition-all"
              >
                {lang === 'hi' ? 'सम्पन्न' : 'Done'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* No sign up needed - Guest Samarpan Reassurance Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-start gap-3 shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <span className="font-extrabold text-emerald-900 block text-[13px]">
                    {lang === 'hi' ? 'लॉगिन / साइन-अप की कोई आवश्यकता नहीं' : 'No Sign-up or Registration Needed'}
                  </span>
                  <span className="text-emerald-800 font-medium">
                    {lang === 'hi'
                      ? 'कोई भी श्रद्धालु सीधे समर्पण कर सकता है। आपके समर्पण की आधिकारिक डिजिटल रसीद नीचे दिए गए व्हाट्सएप नंबर पर तुरंत भेजी जाएगी।'
                      : 'Anyone can donate directly. The official digital trust receipt will be dispatched to your WhatsApp number below.'}
                  </span>
                </div>
              </div>
              
              {/* QR & Bank Information Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFF8EF] via-white to-[#FFF8EF] border border-[#E9B44C]/50 space-y-4">
                
                <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-[#E9B44C]/30 pb-4">
                  <div className="w-32 h-32 p-2 bg-white rounded-2xl border-2 border-dashed border-[#E9B44C] shadow-sm flex items-center justify-center flex-shrink-0">
                    <img
                      src={paymentSettings.qrImageUrl || '/payment-qr.png'}
                      alt="UPI QR Code"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/payment-qr.png';
                      }}
                    />
                  </div>

                  <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-trust-green uppercase tracking-wider bg-trust-green/10 px-2.5 py-0.5 rounded-full">
                      Verified Trust Account
                    </span>
                    <h4 className="font-black text-[#382719] text-sm truncate">
                      {paymentSettings.payeeName || 'Rashtriya Sanatan Sanskar Seva Sansthan (Trust)'}
                    </h4>

                    {/* UPI ID with 1-click copy */}
                    <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#E9B44C]/40 shadow-xs max-w-full">
                      <span className="font-mono text-xs font-bold text-primary truncate">
                        {paymentSettings.upiId || 'boim-135883270012@boi'}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentSettings.upiId || 'boim-135883270012@boi')}
                        className="p-1 rounded hover:bg-[#FFF8EF] text-secondary hover:text-primary transition-colors flex-shrink-0"
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? <Check className="w-3.5 h-3.5 text-trust-green" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <p className="text-[11px] text-[#555555] font-semibold italic">
                      "Scan and pay, then enter your Payment ID below"
                    </p>
                  </div>
                </div>

                {/* Form Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'दानदाता का नाम *' : "Donor's Full Name *"}
                    </label>
                    <input
                      type="text"
                      name="payerName"
                      value={formData.payerName}
                      onChange={handleInputChange}
                      placeholder="उदा. रमेश कुमार"
                      className={`w-full px-3 py-2 rounded-xl border ${
                        errors.payerName ? 'border-red-500' : 'border-[#E9B44C]/50'
                      } text-xs focus:outline-none focus:ring-2 focus:ring-primary/40`}
                    />
                    {errors.payerName && <p className="text-[10px] text-red-500 mt-0.5">{errors.payerName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="text-emerald-600 font-extrabold">📱 WhatsApp</span>
                        <span>{lang === 'hi' ? 'नंबर (रसीद प्रेषण हेतु) *' : 'Number (For Receipt Delivery) *'}</span>
                      </span>
                    </label>
                    <input
                      type="tel"
                      name="payerMobile"
                      value={formData.payerMobile}
                      onChange={handleInputChange}
                      maxLength={10}
                      placeholder={lang === 'hi' ? '10-अंकीय व्हाट्सएप नंबर' : '10-digit WhatsApp number'}
                      className={`w-full px-3 py-2 rounded-xl border ${
                        errors.payerMobile ? 'border-red-500' : 'border-[#E9B44C]/50'
                      } text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono`}
                    />
                    <p className="text-[10px] text-[#555555] font-medium mt-1">
                      {lang === 'hi' ? 'सत्यापन उपरांत रसीद इसी व्हाट्सएप नंबर पर भेजी जाएगी।' : 'Official receipt will be sent to this WhatsApp number.'}
                    </p>
                    {errors.payerMobile && <p className="text-[10px] text-red-500 mt-0.5">{errors.payerMobile}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'भुगतान की गई राशि (Claimed Amount ₹) *' : 'Claimed Amount Paid (INR) *'}
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="उदा. 501"
                      className={`w-full px-3 py-2 rounded-xl border ${
                        errors.amount ? 'border-red-500' : 'border-[#E9B44C]/50'
                      } text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/40`}
                    />
                    <span className="text-[10px] text-[#777777] block mt-0.5">
                      व्यवस्थापक द्वारा बैंक मिलान उपरांत राशि सत्यापित होगी।
                    </span>
                    {errors.amount && <p className="text-[10px] text-red-500 mt-0.5">{errors.amount}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'समर्पण का उद्देश्य (Purpose) *' : 'Donation Purpose *'}
                    </label>
                    <select
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl border border-[#E9B44C]/50 text-xs bg-white focus:outline-none"
                    >
                      {DONATION_PURPOSES.map(p => (
                        <option key={p.id} value={p.id}>
                          {lang === 'hi' ? p.labelHi : p.labelEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Required Payment ID / UTR */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-[#382719]">
                    Payment ID / UTR / Transaction Reference *
                  </label>
                  <input
                    type="text"
                    name="paymentId"
                    value={formData.paymentId}
                    onChange={handleInputChange}
                    placeholder="उदा. 429381749201"
                    className={`w-full px-3.5 py-2.5 rounded-xl border font-mono uppercase text-sm ${
                      errors.paymentId ? 'border-red-500 bg-red-50/30' : 'border-[#E9B44C]/60 bg-white'
                    } focus:outline-none focus:ring-2 focus:ring-primary/40`}
                  />

                  {/* Helper text saying where to find it */}
                  <div className="flex items-start gap-1.5 mt-1 text-[11px] text-[#666666] leading-relaxed">
                    <Info className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <span>
                      {lang === 'hi'
                        ? 'कहाँ मिलेगा: अपने UPI ऐप (GPay / PhonePe / Paytm / BHIM) के भुगतान विवरण में 12-अंकीय UTR या UPI Reference No देखें।'
                        : 'Where to find: Look for the 12-digit UTR or UPI Reference Number in your UPI app payment details screen.'}
                    </span>
                  </div>

                  {errors.paymentId && (
                    <p className="text-xs text-red-600 font-bold mt-1">{errors.paymentId}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      भुगतान दिनांक (Payment Date) - Optional
                    </label>
                    <input
                      type="date"
                      name="paymentDate"
                      value={formData.paymentDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-xl border border-[#E9B44C]/50 text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      अतिरिक्त टिप्पणी (Optional Note)
                    </label>
                    <input
                      type="text"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="उदा. जन्मदिन / पुण्यतिथि संकल्प"
                      className="w-full px-3 py-2 rounded-xl border border-[#E9B44C]/50 text-xs focus:outline-none"
                    />
                  </div>
                </div>

              </div>

              {errors.form && <p className="text-xs text-red-600 font-bold mt-2">{errors.form}</p>}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E9B44C]/30">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="px-4 py-2.5 rounded-xl border border-[#E9B44C]/50 text-[#382719] font-bold text-xs hover:bg-[#FFF8EF] transition-all"
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white font-bold text-xs sm:text-sm shadow-saffron transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'जमा हो रहा है...' : 'समर्पण एवं Payment ID जमा करें'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default PaymentModal;
