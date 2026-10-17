import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { submitPaymentRecord } from '../firebase/services';
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
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const PaymentModal = ({ isOpen, onClose, defaultPurpose = 'samarpan', defaultAmount = '200' }) => {
  const { lang, toggleLanguage, t } = useLanguage();
  const { currentUser, userProfile } = useAuth();

  const [formData, setFormData] = useState({
    payerName: userProfile?.displayName || '',
    payerMobile: userProfile?.mobile || '',
    purpose: defaultPurpose, // 'membership_fee' | 'samarpan' | 'labor_welfare'
    amount: defaultAmount,
    paymentMethod: 'upi', // 'upi' | 'bank_transfer'
    utrNumber: '',
    notes: ''
  });

  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'acc') {
      setCopiedAcc(true);
      setTimeout(() => setCopiedAcc(false), 2000);
    } else {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.payerName.trim()) {
      errs.payerName = lang === 'hi' ? 'कृपया भुगतानकर्ता का नाम दर्ज करें' : 'Enter payer name';
    }
    if (!formData.payerMobile.trim() || !/^[6-9]\d{9}$/.test(formData.payerMobile.replace(/\D/g, ''))) {
      errs.payerMobile = lang === 'hi' ? 'मान्य 10-अंकीय मोबाइल नंबर दर्ज करें' : 'Enter valid 10-digit mobile';
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      errs.amount = lang === 'hi' ? 'मान्य राशि दर्ज करें' : 'Enter valid amount';
    }
    if (!formData.utrNumber.trim() || formData.utrNumber.trim().length < 6) {
      errs.utrNumber = lang === 'hi' ? 'मान्य UTR / UPI Ref / बैंक संदर्भ संख्या दर्ज करें (कम से कम 6 अक्षर)' : 'Enter valid UTR / Ref Number (min 6 chars)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await submitPaymentRecord(formData, currentUser?.uid || null);
      setSubmitted(true);
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {}
    } catch (err) {
      console.error("Payment submission failed:", err);
      setErrors({ form: err.message || (lang === 'hi' ? 'भुगतान विवरण दर्ज करने में त्रुटि' : 'Failed to submit') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSubmitted(false);
    setFormData({
      payerName: userProfile?.displayName || '',
      payerMobile: userProfile?.mobile || '',
      purpose: defaultPurpose,
      amount: defaultAmount,
      paymentMethod: 'upi',
      utrNumber: '',
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
              ₹
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-black font-hindi-heading truncate">
                {lang === 'hi' ? 'समर्पण / सदस्यता शुल्क एवं UTR' : 'Donation & Payment Verification'}
              </h2>
              <p className="text-[10px] sm:text-xs text-white/80 truncate">
                {lang === 'hi' ? 'बैंक खाता / UPI द्वारा भुगतान का सत्यापन' : 'Official Bank & UPI Transfer Verification'}
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
          {submitted ? (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-full bg-trust-green/10 text-trust-green mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#382719] font-hindi-heading">
                  {lang === 'hi' ? 'भुगतान संदर्भ सफलतापूर्वक दर्ज हुआ!' : 'Payment Reference Recorded!'}
                </h3>
                <p className="text-xs sm:text-sm text-[#454545] mt-2 max-w-md mx-auto leading-relaxed">
                  {lang === 'hi'
                    ? 'आपका UTR संदर्भ संख्या सत्यापन हेतु दर्ज कर लिया गया है। बैंक मिलान उपरांत व्यवस्थापक द्वारा इसे सत्यापित किया जाएगा, जिसके पश्चात आपकी आधिकारिक डिजिटल रसीद जारी होगी।'
                    : 'Your transaction reference has been logged. Once verified against bank records by the trust admin, your verified official receipt will be generated.'}
                </p>
              </div>

              <div className="p-4 bg-[#FFF8EF] rounded-2xl border border-[#E9B44C]/40 max-w-sm mx-auto text-xs space-y-1">
                <p className="text-[#666666]">
                  {lang === 'hi' ? 'स्थिति:' : 'Status:'} <span className="text-amber-700 font-bold">{lang === 'hi' ? 'सत्यापन प्रतीक्षारत (Pending Verification)' : 'Pending Verification'}</span>
                </p>
                <p className="font-mono text-primary font-bold">
                  UTR: {formData.utrNumber}
                </p>
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
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Trust Authorized Bank & UPI Information Strip */}
              <div className="p-4 rounded-2xl bg-[#FFF8EF] border border-[#E9B44C]/40 space-y-3">
                <div className="flex items-center justify-between border-b border-[#E9B44C]/25 pb-2">
                  <span className="text-xs font-bold text-[#382719] flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-primary" />
                    <span>Bank of India (Gorakhpur)</span>
                  </span>
                  <span className="text-[10px] bg-trust-green/10 text-trust-green px-2 py-0.5 rounded-md font-bold">
                    Official Trust A/c
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#E9B44C]/30">
                    <div>
                      <span className="text-[10px] text-[#666666] block">A/c No:</span>
                      <span className="font-mono font-bold text-[#382719]">135820110000012</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('135820110000012', 'acc')}
                      className="p-1 text-[#666666] hover:text-primary"
                    >
                      {copiedAcc ? <Check className="w-3.5 h-3.5 text-trust-green" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#E9B44C]/30">
                    <div>
                      <span className="text-[10px] text-[#666666] block">UPI ID:</span>
                      <span className="font-mono font-bold text-[#382719]">boim-135883270012@boi</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('boim-135883270012@boi', 'upi')}
                      className="p-1 text-[#666666] hover:text-primary"
                    >
                      {copiedUpi ? <Check className="w-3.5 h-3.5 text-trust-green" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'भुगतानकर्ता का नाम *' : "Payer's Name *"}
                  </label>
                  <input
                    type="text"
                    name="payerName"
                    value={formData.payerName}
                    onChange={handleInputChange}
                    placeholder={lang === 'hi' ? 'उदा. रमेश कुमार' : 'e.g. Ramesh Kumar'}
                    className={`w-full px-3 py-2 rounded-xl border ${
                      errors.payerName ? 'border-red-500' : 'border-[#E9B44C]/50'
                    } text-xs focus:outline-none focus:border-primary`}
                  />
                  {errors.payerName && <p className="text-[10px] text-red-500 mt-0.5">{errors.payerName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'मोबाइल नंबर *' : 'Mobile Number *'}
                  </label>
                  <input
                    type="tel"
                    name="payerMobile"
                    maxLength={10}
                    value={formData.payerMobile}
                    onChange={handleInputChange}
                    placeholder="9876543210"
                    className={`w-full px-3 py-2 rounded-xl border ${
                      errors.payerMobile ? 'border-red-500' : 'border-[#E9B44C]/50'
                    } text-xs font-mono focus:outline-none focus:border-primary`}
                  />
                  {errors.payerMobile && <p className="text-[10px] text-red-500 mt-0.5">{errors.payerMobile}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'भुगतान का उद्देश्य *' : 'Payment Purpose *'}
                  </label>
                  <select
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-[#E9B44C]/50 text-xs focus:outline-none focus:border-primary bg-white"
                  >
                    <option value="membership_fee">
                      {lang === 'hi' ? 'वार्षिक सदस्यता शुल्क (₹200)' : 'Annual Membership Fee (₹200)'}
                    </option>
                    <option value="samarpan">
                      {lang === 'hi' ? 'ऐच्छिक समर्पण निधि (Voluntary Donation)' : 'Voluntary Donation (Samarpan)'}
                    </option>
                    <option value="labor_welfare">
                      {lang === 'hi' ? 'श्रमिक सहायता कोष (Labor Welfare)' : 'Labor Welfare Support Fund'}
                    </option>
                    <option value="vedic_sanskar">
                      {lang === 'hi' ? 'षोडश संस्कार आयोजन सहयोग' : 'Vedic Sanskar Rites Contribution'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'हस्तांतरित राशि (₹) *' : 'Amount Transferred (INR) *'}
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="200"
                    className={`w-full px-3 py-2 rounded-xl border ${
                      errors.amount ? 'border-red-500' : 'border-[#E9B44C]/50'
                    } text-xs font-mono focus:outline-none focus:border-primary`}
                  />
                  {errors.amount && <p className="text-[10px] text-red-500 mt-0.5">{errors.amount}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'UTR / UPI संदर्भ संख्या (Transaction Reference Number) *' : 'UTR / UPI Reference Number *'}
                  </label>
                  <input
                    type="text"
                    name="utrNumber"
                    value={formData.utrNumber}
                    onChange={handleInputChange}
                    placeholder={lang === 'hi' ? 'उदा. 4289XXXXXXXX या UPI-Ref-123456' : 'e.g. 4289XXXXXXXX or UPI-Ref-123456'}
                    className={`w-full px-3 py-2 rounded-xl border ${
                      errors.utrNumber ? 'border-red-500' : 'border-[#E9B44C]/50'
                    } text-xs font-mono uppercase focus:outline-none focus:border-primary`}
                  />
                  <span className="text-[10px] text-[#666666] block mt-0.5">
                    {lang === 'hi' ? 'GPay, PhonePe, Paytm अथवा बैंक रसीद में प्रदर्शित 12-अंकीय UTR नंबर' : '12-digit UTR shown in your UPI app / bank confirmation'}
                  </span>
                  {errors.utrNumber && <p className="text-[10px] text-red-500 mt-0.5">{errors.utrNumber}</p>}
                </div>
              </div>

              {/* Security Alert */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-[11px] text-[#454545]">
                <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <span>
                  {lang === 'hi'
                    ? 'कृपया केवल वास्तविक भुगतान का UTR दर्ज करें। गलत अथवा जाली संदर्भ संख्या दर्ज करने पर आवेदन निरस्त हो सकता है।'
                    : 'Please enter only authentic transaction details. Submissions are verified against bank ledger entries.'}
                </span>
              </div>
              {errors.form && <p className="text-xs text-red-600 font-bold">{errors.form}</p>}

              {/* Submit Buttons */}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-[#454545] hover:bg-gray-50"
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs sm:text-sm shadow-saffron transition-all disabled:opacity-50"
                >
                  {isSubmitting
                    ? (lang === 'hi' ? 'सत्यापन हेतु भेजा जा रहा है...' : 'Submitting...')
                    : (lang === 'hi' ? 'सत्यापन हेतु UTR दर्ज करें' : 'Submit Reference')}
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
