import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { submitAssistanceRequest } from '../firebase/services';
import {
  X,
  HandHeart,
  User,
  Phone,
  MapPin,
  IndianRupee,
  FileText,
  AlertCircle,
  CheckCircle2,
  Send,
  Download,
  Copy,
  Clock,
  Building,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';

const REASON_CATEGORIES = [
  { id: 'medical', labelHi: '🏥 गंभीर बीमारी / चिकित्सा व दवा उपचार', labelEn: '🏥 Medical / Emergency Hospitalization' },
  { id: 'education', labelHi: '🎓 बच्चों की शिक्षा / विद्यालय शुल्क व पुस्तकें', labelEn: '🎓 Education / School & College Fees' },
  { id: 'marriage', labelHi: '🌸 निर्धन कन्या विवाह / संस्कार सहयोग', labelEn: "🌸 Daughter's Marriage / Vedic Sanskar Support" },
  { id: 'ration', labelHi: '🌾 आकस्मिक राशन व परिवार भोजन सहायता', labelEn: '🌾 Emergency Food & Ration Support' },
  { id: 'labor_welfare', labelHi: '🔨 श्रमिक परिवार सहायता / आजीविका संकट', labelEn: '🔨 Grassroots Laborer / Livelihood Crisis' },
  { id: 'last_rites', labelHi: '🕊️ अंतिम संस्कार / अंत्येष्टि सहायता', labelEn: '🕊️ Last Rites / Antyeshti Sanskar Support' },
  { id: 'other', labelHi: '🤝 अन्य आपात मानवीय / पारिवारिक संकट', labelEn: '🤝 Other Humanitarian Emergency' }
];

const QUICK_AMOUNTS = ['5000', '10000', '25000', '50000', '100000'];

export const HelpRequestModal = ({ isOpen, onClose }) => {
  const { lang } = useLanguage();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const printRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState(() => {
    const isMock = typeof window !== 'undefined' && window.location.search.includes('submitted=true');
    return {
      fullName: isMock ? 'राजेश कुमार मिश्र' : (userProfile?.fullName || userProfile?.displayName || ''),
      fatherHusbandName: isMock ? 'श्री बैजनाथ मिश्र' : '',
      mobile: isMock ? '9876543210' : (userProfile?.phone || userProfile?.mobile || ''),
      whatsapp: isMock ? '9876543210' : (userProfile?.phone || userProfile?.mobile || ''),
      email: userProfile?.email || '',
      location: isMock ? 'मकान नं. 24, निकट प्राचीन शिव मंदिर, रूस्तमपुर' : '',
      cityDistrict: 'गोरखपुर (Gorakhpur)',
      state: 'उत्तर प्रदेश (UP)',
      pincode: isMock ? '273016' : '',
      amountNeeded: isMock ? '25000' : '',
      category: 'medical',
      urgency: 'urgent',
      description: isMock ? 'पिताजी के आकस्मिक चिकित्सा व दवा उपचार हेतु तत्काल आर्थिक सहायता की आवश्यकता है।' : '',
      bankAccountNumber: '',
      bankIfsc: '',
      bankAccountHolder: '',
      bankOrUpi: isMock ? '9876543210@upi' : '',
      isConsentGiven: true
    };
  });

  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || userProfile.fullName || userProfile.displayName || '',
        mobile: prev.mobile || userProfile.phone || userProfile.mobile || '',
        whatsapp: prev.whatsapp || userProfile.phone || userProfile.mobile || ''
      }));
    }
  }, [userProfile]);

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(() => {
    return typeof window !== 'undefined' && window.location.search.includes('submitted=true');
  });
  const [applicationId, setApplicationId] = useState(() => {
    return typeof window !== 'undefined' && window.location.search.includes('submitted=true')
      ? 'RSSSST-HELP-2026-4892'
      : '';
  });
  const [copied, setCopied] = useState(false);
  const [submissionDate, setSubmissionDate] = useState(() => {
    return typeof window !== 'undefined' && window.location.search.includes('submitted=true')
      ? '15/10/2026 10:45 PM'
      : '';
  });

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSelectQuickAmount = (amount) => {
    setFormData(prev => ({ ...prev, amountNeeded: amount }));
    if (errors.amountNeeded) {
      setErrors(prev => ({ ...prev, amountNeeded: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = lang === 'hi' ? 'कृपया आवेदक का पूरा नाम दर्ज करें' : 'Please enter full name';
    }
    if (!formData.mobile.trim()) {
      newErrors.mobile = lang === 'hi' ? 'कृपया मोबाइल नंबर दर्ज करें' : 'Please enter mobile number';
    } else if (!/^[6-9]\d{9}$/.test(formData.mobile.replace(/\D/g, ''))) {
      newErrors.mobile = lang === 'hi' ? 'कृपया मान्य 10-अंकीय भारतीय मोबाइल नंबर दर्ज करें' : 'Enter valid 10-digit mobile number';
    }
    if (!formData.location.trim()) {
      newErrors.location = lang === 'hi' ? 'कृपया निवास स्थान / पता दर्ज करें' : 'Please enter address';
    }
    if (!formData.cityDistrict.trim()) {
      newErrors.cityDistrict = lang === 'hi' ? 'कृपया शहर / ज़िला दर्ज करें' : 'Please enter city/district';
    }
    if (!formData.amountNeeded || Number(formData.amountNeeded) <= 0) {
      newErrors.amountNeeded = lang === 'hi' ? 'कृपया आवश्यक सहायता राशि दर्ज करें' : 'Please enter amount needed';
    }
    if (!formData.description.trim() || formData.description.trim().length < 15) {
      newErrors.description = lang === 'hi' ? 'कृपया सहायता की आवश्यकता का कारण कम से कम 15 अक्षरों में विस्तार से लिखें' : 'Please provide detailed reason (min 15 chars)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    try {
      const result = await submitAssistanceRequest(formData, currentUser?.uid || null);
      const trackingId = result.trackingId;

      setApplicationId(trackingId);
      setSubmissionDate(formattedDate);
      setSubmitted(true);

      // Save to local storage as fallback cache
      try {
        const existing = JSON.parse(localStorage.getItem('rsssst_help_requests') || '[]');
        existing.unshift({
          id: trackingId,
          date: formattedDate,
          ...formData
        });
        localStorage.setItem('rsssst_help_requests', JSON.stringify(existing.slice(0, 50)));
      } catch {}

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {}
    } catch (err) {
      console.error("Assistance submission failed:", err);
      setErrors(prev => ({ ...prev, form: err.message || 'सहायता आवेदन प्रेषण में त्रुटि हुई।' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard?.writeText(applicationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const [isExportingSlip, setIsExportingSlip] = useState(false);
  const handleDownloadSlip = async () => {
    if (!printRef.current) return;
    setIsExportingSlip(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#FFF8EF',
        logging: false
      });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `sahayata-slip-${submittedId || 'request'}.jpg`;
      link.click();
    } catch (err) {
      console.error('Slip download failed:', err);
    } finally {
      setIsExportingSlip(false);
    }
  };

  const selectedCategoryObj = REASON_CATEGORIES.find(c => c.id === formData.category) || REASON_CATEGORIES[0];
  const categoryLabel = lang === 'hi' ? selectedCategoryObj.labelHi : selectedCategoryObj.labelEn;

  const urgencyLabel = {
    emergency: lang === 'hi' ? 'तत्काल / आपातकालीन (24 घंटे)' : 'Emergency (Within 24 Hours)',
    urgent: lang === 'hi' ? 'अति आवश्यक (48 घंटे)' : 'Urgent (Within 48 Hours)',
    normal: lang === 'hi' ? 'सामान्य (3-5 दिन)' : 'Normal (3-5 Days)'
  }[formData.urgency];

  // Pre-formatted WhatsApp Message to Trust Manager
  const whatsappMessage = `*राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट)*
*सहायता अनुरोध प्रपत्र (Assistance Application)*

📋 *आवेदन संख्या:* ${applicationId}
👤 *आवेदक का नाम:* ${formData.fullName} ${formData.fatherHusbandName ? `(आत्मज/पत्नी: ${formData.fatherHusbandName})` : ''}
📞 *संपर्क नंबर:* ${formData.mobile} ${formData.whatsapp ? `| WhatsApp: ${formData.whatsapp}` : ''}
📍 *स्थान / पता:* ${formData.location}, ${formData.cityDistrict}, ${formData.state} ${formData.pincode ? `(${formData.pincode})` : ''}
💰 *आवश्यक सहायता राशि:* ₹${Number(formData.amountNeeded).toLocaleString('en-IN')}
🏷️ *सहायता का कारण:* ${categoryLabel}
⚠️ *प्राथमिकता:* ${urgencyLabel}
📝 *समस्या का विवरण:* ${formData.description}
${formData.bankOrUpi ? `🏦 *बैंक/UPI विवरण:* ${formData.bankOrUpi}\n` : ''}
📅 *आवेदन दिनांक:* ${submissionDate}
----------------------------------------
_निवेदन: कृपया इस आवेदन की समीक्षा कर सहायता प्रदान करने की कृपा करें।_`;

  const trustWhatsAppUrl = `https://wa.me/919794590044?text=${encodeURIComponent(whatsappMessage)}`;

  const resetForm = () => {
    setSubmitted(false);
    setFormData({
      fullName: '',
      fatherHusbandName: '',
      mobile: '',
      whatsapp: '',
      location: '',
      cityDistrict: 'गोरखपुर (Gorakhpur)',
      state: 'उत्तर प्रदेश (UP)',
      pincode: '',
      amountNeeded: '',
      category: 'medical',
      urgency: 'urgent',
      description: '',
      bankOrUpi: '',
      isConsentGiven: true
    });
    setErrors({});
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-[#E9B44C]/40 max-w-2xl w-full overflow-hidden my-auto sm:my-8 max-h-[94vh] flex flex-col transition-all">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FFF8EF] via-[#FFF3E0] to-[#FFF8EF] px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[#E9B44C]/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary flex-shrink-0 shadow-sm">
              <HandHeart className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase text-secondary bg-primary/10 px-2 py-0.5 rounded">
                  {lang === 'hi' ? 'जन सेवा एवं राहत' : 'Public Welfare Assistance'}
                </span>
              </div>
              <h3 className="text-base sm:text-xl font-black text-[#382719] font-hindi-heading truncate">
                {lang === 'hi' ? 'सहायता अनुरोध प्रपत्र (Ask for Help)' : 'Financial & Social Assistance Request'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-full text-[#454545] hover:text-primary hover:bg-white/80 transition-colors flex-shrink-0 ml-2"
            aria-label="Close"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {!submitted ? (
            /* ================= FORM VIEW ================= */
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Trust assurance note */}
              <div className="p-3.5 rounded-xl bg-[#FFF8EF] border border-[#E9B44C]/50 flex items-start gap-3 text-xs sm:text-sm text-[#382719]">
                <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#382719]">
                    {lang === 'hi'
                      ? 'राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट) पीड़ित व ज़रूरतमंद सनातन परिवारों के साथ खड़ा है।'
                      : 'Rashtriya Sanatan Sanskar Seva Sansthan stands firmly with underprivileged families in times of crisis.'}
                  </p>
                  <p className="text-xs text-[#454545] mt-0.5">
                    {lang === 'hi'
                      ? 'कृपया सही जानकारी दर्ज करें ताकि ट्रस्ट समिति यथाशीघ्र सत्यापन कर सहायता प्रदान कर सके।'
                      : 'Please provide authentic details so our welfare committee can review and coordinate assistance promptly.'}
                  </p>
                </div>
              </div>

              {/* 1. Applicant Personal Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-[#E9B44C]/30 pb-1">
                  <User className="w-4 h-4" />
                  <span>{lang === 'hi' ? '1. आवेदक का विवरण (Applicant Details)' : '1. Applicant Details'}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'आवेदक का पूरा नाम' : 'Full Name'} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder={lang === 'hi' ? 'उदा. रामसेवक शुक्ल' : 'e.g. Ram Sevak Shukla'}
                        className={`w-full text-sm px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                          errors.fullName ? 'border-red-500 bg-red-50/20' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.fullName && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'पिता / पति का नाम' : "Father's / Husband's Name"}
                    </label>
                    <input
                      type="text"
                      name="fatherHusbandName"
                      value={formData.fatherHusbandName}
                      onChange={handleInputChange}
                      placeholder={lang === 'hi' ? 'उदा. श्री दीनदयाल शुक्ल' : 'e.g. Shri Deendayal Shukla'}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'संपर्क मोबाइल नंबर (Calling No.)' : 'Mobile Number'} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex">
                      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-xs text-gray-600 font-bold">
                        +91
                      </span>
                      <input
                        type="tel"
                        name="mobile"
                        maxLength="10"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        placeholder="9876543210"
                        className={`w-full text-sm px-3.5 py-2.5 rounded-r-xl border bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                          errors.mobile ? 'border-red-500 bg-red-50/20' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.mobile && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.mobile}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'व्हाट्सएप नंबर (वैकल्पिक)' : 'WhatsApp Number (Optional)'}
                    </label>
                    <input
                      type="tel"
                      name="whatsapp"
                      maxLength="10"
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                      placeholder="9876543210"
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'ईमेल पता (वैकल्पिक परंतु अनुशंसित)' : 'Email Address (Optional but recommended)'}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder={lang === 'hi' ? 'उदा. applicant@gmail.com' : 'e.g. applicant@gmail.com'}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Location Information */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-[#E9B44C]/30 pb-1">
                  <MapPin className="w-4 h-4" />
                  <span>{lang === 'hi' ? '2. निवास स्थान एवं पता (Location Details)' : '2. Location & Address'}</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'पूरा पता (मोहल्ला / ग्राम / वार्ड)' : 'Full Address / Village / Ward'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder={lang === 'hi' ? 'उदा. ग्राम रूस्तमपुर, मकान नं. 45, निकट शिव मंदिर' : 'e.g. Village Rustampur, Near Shiva Temple'}
                    className={`w-full text-sm px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                      errors.location ? 'border-red-500 bg-red-50/20' : 'border-gray-300'
                    }`}
                  />
                  {errors.location && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.location}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'शहर / ज़िला' : 'City / District'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="cityDistrict"
                      value={formData.cityDistrict}
                      onChange={handleInputChange}
                      placeholder="Gorakhpur"
                      className={`w-full text-sm px-3 py-2 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                        errors.cityDistrict ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'राज्य' : 'State'}
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'पिन कोड' : 'Pin Code'}
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      maxLength="6"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="273016"
                      className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Financial Amount Needed & Reason */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-[#E9B44C]/30 pb-1">
                  <IndianRupee className="w-4 h-4" />
                  <span>{lang === 'hi' ? '3. आवश्यक सहायता राशि एवं कारण (Amount & Reason)' : '3. Amount & Purpose of Help'}</span>
                </h4>

                {/* Amount Input with quick buttons */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#382719]">
                      {lang === 'hi' ? 'आवश्यक सहायता राशि (₹)' : 'Financial Amount Needed (₹)'} <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-[#454545]">
                      {formData.amountNeeded ? `₹${Number(formData.amountNeeded).toLocaleString('en-IN')}` : ''}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 font-bold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      name="amountNeeded"
                      min="100"
                      step="100"
                      value={formData.amountNeeded}
                      onChange={handleInputChange}
                      placeholder={lang === 'hi' ? 'राशि दर्ज करें (उदा. 15000)' : 'Enter amount (e.g. 15000)'}
                      className={`w-full text-base font-bold pl-8 pr-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                        errors.amountNeeded ? 'border-red-500 bg-red-50/20' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.amountNeeded && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.amountNeeded}</p>}

                  {/* Quick Select Buttons */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[11px] text-gray-500 font-bold">{lang === 'hi' ? 'त्वरित चयन:' : 'Quick Select:'}</span>
                    {QUICK_AMOUNTS.map((amt) => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => handleSelectQuickAmount(amt)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition-colors ${
                          formData.amountNeeded === amt
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-white hover:bg-gray-100 text-[#382719] border-gray-300'
                        }`}
                      >
                        ₹{Number(amt).toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assistance Category */}
                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'सहायता का मुख्य कारण / श्रेणी' : 'Primary Reason / Category'} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {REASON_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {lang === 'hi' ? cat.labelHi : cat.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Urgency Priority */}
                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1.5">
                    {lang === 'hi' ? 'आवश्यकता की प्राथमिकता (Urgency)' : 'Urgency Level'}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {[
                      { id: 'normal', labelHi: 'सामान्य (3-5 दिन)', labelEn: 'Normal (3-5d)', color: 'border-blue-300 hover:border-blue-500' },
                      { id: 'urgent', labelHi: 'अति आवश्यक (48 घंटे)', labelEn: 'Urgent (48h)', color: 'border-yellow-400 hover:border-yellow-600' },
                      { id: 'emergency', labelHi: 'आपातकाल (24 घंटे)', labelEn: 'Emergency (24h)', color: 'border-red-400 hover:border-red-600' }
                    ].map((lvl) => (
                      <button
                        type="button"
                        key={lvl.id}
                        onClick={() => setFormData(prev => ({ ...prev, urgency: lvl.id }))}
                        className={`text-[11px] sm:text-xs py-2 px-1 sm:px-2 rounded-xl font-bold border text-center transition-all min-h-[44px] flex items-center justify-center ${
                          formData.urgency === lvl.id
                            ? 'bg-secondary text-white border-secondary shadow-sm'
                            : `bg-white text-[#454545] ${lvl.color}`
                        }`}
                      >
                        {lang === 'hi' ? lvl.labelHi : lvl.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Detailed Description */}
                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'समस्या एवं कारण का विस्तृत विवरण' : 'Detailed Explanation of Situation'} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder={
                      lang === 'hi'
                        ? 'कृपया स्पष्ट रूप से लिखें कि सहायता की आवश्यकता क्यों है, परिवार की वर्तमान आर्थिक स्थिति क्या है, और इस राशि का उपयोग कहाँ होगा...'
                        : 'Explain the hardship, family circumstances, and how the Trust financial assistance will be utilized...'
                    }
                    className={`w-full text-sm px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                      errors.description ? 'border-red-500 bg-red-50/20' : 'border-gray-300'
                    }`}
                  ></textarea>
                  {errors.description && <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.description}</p>}
                </div>

                {/* 4. Bank Account Details */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-[#E9B44C]/30 pb-1">
                    <Building className="w-4 h-4" />
                    <span>{lang === 'hi' ? '4. बैंक खाता विवरण (Direct Aid Bank Details)' : '4. Bank Account Information'}</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#382719] mb-1">
                        {lang === 'hi' ? 'बैंक खाता संख्या (Bank Account No.)' : 'Bank Account Number'}
                      </label>
                      <input
                        type="text"
                        name="bankAccountNumber"
                        value={formData.bankAccountNumber}
                        onChange={handleInputChange}
                        placeholder={lang === 'hi' ? 'उदा. 123456789012' : 'e.g. 123456789012'}
                        className="w-full text-sm px-3.5 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#382719] mb-1">
                        {lang === 'hi' ? 'IFSC कोड' : 'IFSC Code'}
                      </label>
                      <input
                        type="text"
                        name="bankIfsc"
                        value={formData.bankIfsc}
                        onChange={(e) => setFormData(prev => ({ ...prev, bankIfsc: e.target.value.toUpperCase() }))}
                        placeholder="SBIN0001234"
                        className="w-full text-sm px-3.5 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#382719] mb-1">
                        {lang === 'hi' ? 'खाताधारक का नाम' : 'Account Holder Name'}
                      </label>
                      <input
                        type="text"
                        name="bankAccountHolder"
                        value={formData.bankAccountHolder}
                        onChange={handleInputChange}
                        placeholder={lang === 'hi' ? 'उदा. राजेश कुमार' : 'e.g. Rajesh Kumar'}
                        className="w-full text-sm px-3.5 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#382719] mb-1">
                        {lang === 'hi' ? 'UPI आईडी / बैंक नाम (वैकल्पिक)' : 'UPI ID / Bank Name (Optional)'}
                      </label>
                      <input
                        type="text"
                        name="bankOrUpi"
                        value={formData.bankOrUpi}
                        onChange={handleInputChange}
                        placeholder="9876543210@upi"
                        className="w-full text-sm px-3.5 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-3 border-t border-[#E9B44C]/30 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-full border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-primary hover:bg-secondary text-white font-black text-sm sm:text-base shadow-saffron transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                >
                  <HandHeart className="w-5 h-5" />
                  <span>{isSubmitting ? (lang === 'hi' ? 'प्रेषित हो रहा है...' : 'Submitting...') : (lang === 'hi' ? 'सहायता अनुरोध प्रेषित करें' : 'Submit Assistance Request')}</span>
                </button>
              </div>
            </form>
          ) : (
            /* ================= SUCCESS & CONFIRMATION VIEW ================= */
            <div className="space-y-5 animate-fadeIn">
              
              {/* Success Banner */}
              <div className="text-center py-4 px-5 rounded-2xl bg-gradient-to-b from-[#FFF8EF] to-white border-2 border-[#E9B44C]/40 shadow-sm">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center text-green-600 mb-3 shadow-md animate-bounce">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h4 className="text-xl sm:text-2xl font-black text-[#382719] font-hindi-heading">
                  {lang === 'hi' 
                    ? 'अनुरोध प्राप्त हो गया है, शीघ्र ही इस संबंध में आपको जानकारी दी जाएगी।' 
                    : "Request submitted, you'll hear back regarding your request soon."}
                </h4>
                <p className="text-xs sm:text-sm text-[#523e2b] max-w-md mx-auto mt-2 font-medium">
                  {lang === 'hi'
                    ? 'राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट), गोरखपुर समिति द्वारा आपके विवरण की जांच की जा रही है। प्रतिनिधि दिए गए मोबाइल नंबर पर संपर्क करेंगे।'
                    : 'Our welfare committee is reviewing your details. A trust representative will connect with you on your provided contact number shortly.'}
                </p>

                {/* Application ID Card */}
                <div className="mt-4 p-3 bg-white rounded-xl border border-[#E9B44C]/50 inline-flex flex-col sm:flex-row items-center gap-2 shadow-sm">
                  <span className="text-xs text-gray-600 font-bold">
                    {lang === 'hi' ? 'आवेदन संदर्भ क्रमांक (Application ID):' : 'Application Reference ID:'}
                  </span>
                  <span className="font-mono font-black text-base text-primary bg-[#FFF8EF] px-3 py-1 rounded-lg border border-[#E9B44C]/40">
                    {applicationId}
                  </span>
                  <button
                    onClick={handleCopyId}
                    type="button"
                    className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:text-primary px-2 py-1 rounded bg-gray-50 border border-gray-200"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? (lang === 'hi' ? 'कॉपी हुआ!' : 'Copied!') : (lang === 'hi' ? 'कॉपी' : 'Copy')}</span>
                  </button>
                </div>
              </div>

              {/* Printable Slip Card */}
              <div
                ref={printRef}
                className="bg-[#FFF8EF] border border-[#E9B44C]/50 rounded-2xl p-4 sm:p-5 text-left space-y-3.5 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-[#E9B44C]/40 pb-2">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-primary" />
                    <span className="text-xs font-extrabold text-[#382719]">
                      राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट)
                    </span>
                  </div>
                  <span className="text-[11px] text-[#454545] font-mono">{submissionDate}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 font-bold block">{lang === 'hi' ? 'आवेदक का नाम:' : 'Applicant Name:'}</span>
                    <span className="font-extrabold text-[#382719] text-sm">{formData.fullName}</span>
                    {formData.fatherHusbandName && (
                      <span className="text-gray-600 block text-[11px]">पिता/पति: {formData.fatherHusbandName}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-500 font-bold block">{lang === 'hi' ? 'मोबाइल नंबर:' : 'Contact Mobile:'}</span>
                    <span className="font-extrabold text-[#382719] text-sm">+91 {formData.mobile}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-bold block">{lang === 'hi' ? 'स्थान / पता:' : 'Location & City:'}</span>
                    <span className="font-semibold text-[#382719]">{formData.location}, {formData.cityDistrict}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-bold block">{lang === 'hi' ? 'आवश्यक सहायता राशि:' : 'Amount Requested:'}</span>
                    <span className="font-black text-primary text-base">₹{Number(formData.amountNeeded).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-bold block">{lang === 'hi' ? 'सहायता श्रेणी:' : 'Category:'}</span>
                    <span className="font-semibold text-[#382719]">{categoryLabel}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-bold block">{lang === 'hi' ? 'प्राथमिकता:' : 'Urgency:'}</span>
                    <span className="font-semibold text-secondary">{urgencyLabel}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E9B44C]/30 text-xs">
                  <span className="text-gray-500 font-bold block mb-0.5">{lang === 'hi' ? 'समस्या का विवरण:' : 'Reason / Details:'}</span>
                  <p className="text-gray-800 bg-white p-2.5 rounded-xl border border-gray-200 text-xs leading-relaxed">
                    {formData.description}
                  </p>
                </div>

                {formData.bankOrUpi && (
                  <div className="text-xs">
                    <span className="text-gray-500 font-bold block">{lang === 'hi' ? 'बैंक/UPI विवरण:' : 'Bank/UPI:'}</span>
                    <span className="font-mono text-gray-800">{formData.bankOrUpi}</span>
                  </div>
                )}
              </div>

              {/* Review Time Notice */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-xs text-amber-900">
                <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    {lang === 'hi'
                      ? 'ट्रस्ट समीक्षा प्रक्रिया: 24 से 48 घंटे के भीतर संपर्क'
                      : 'Trust Verification: Follow-up within 24-48 hours'}
                  </p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    {lang === 'hi'
                      ? 'गोरखपुर कार्यालय की क्षेत्रीय सहायता समिति आपके विवरण व दस्तावेजों की जांच कर सीधे फोन पर संपर्क करेगी। आपात स्थिति हेतु सीधे व्हाट्सएप पर संपर्क करें।'
                      : 'Our welfare committee will review your request. For immediate assistance, message directly on WhatsApp below.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons: WhatsApp Send & Print */}
              <div className="space-y-2 pt-2">
                <a
                  href={trustWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-white font-black text-sm sm:text-base shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Send className="w-5 h-5" />
                  <span>
                    {lang === 'hi' ? 'व्हाट्सएप पर तुरंत ट्रस्ट को आवेदन भेजें' : 'Send Application Directly to Trust on WhatsApp'}
                  </span>
                </a>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadSlip}
                    disabled={isExportingSlip}
                    className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs sm:text-sm font-bold text-[#382719] transition-colors disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 text-primary" />
                    <span>{lang === 'hi' ? 'रसीद / पर्ची डाउनलोड करें' : 'Download Application Slip'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs sm:text-sm font-bold text-[#454545] transition-colors"
                  >
                    <HandHeart className="w-4 h-4 text-secondary" />
                    <span>{lang === 'hi' ? 'नया आवेदन करें' : 'New Application'}</span>
                  </button>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="min-h-[44px] inline-flex items-center justify-center text-xs font-bold text-gray-500 hover:text-gray-800 underline px-3"
                  >
                    {lang === 'hi' ? 'खिड़की बंद करें' : 'Close this window'}
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default HelpRequestModal;
