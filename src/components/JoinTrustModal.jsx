import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { submitMembershipApplication } from '../firebase/services';
import {
  X,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Heart,
  Users,
  HandHeart,
  Copy,
  Check,
  ArrowRight,
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const JoinTrustModal = ({ isOpen, onClose, defaultCategory = 'catB', onOpenLogin }) => {
  const { lang, toggleLanguage } = useLanguage();
  const { currentUser } = useAuth();

  const [category, setCategory] = useState(defaultCategory); // 'catA', 'catB', 'catC'
  const [formData, setFormData] = useState({
    fullName: '',
    fatherHusbandName: '',
    villageOrLocality: '',
    postOffice: '',
    district: 'गोरखपुर (Gorakhpur)',
    state: 'उत्तर प्रदेश (UP)',
    pincode: '273016',
    mobile: '',
    whatsapp: '',
    voluntaryAmount: '',
    // Category specific
    assistanceNeed: '',
    volunteerArea: 'sanskar_camps',
    isConsentGiven: true
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState(null);
  const [copied, setCopied] = useState(false);

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

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) {
      errs.fullName = lang === 'hi' ? 'कृपया पूरा नाम दर्ज करें' : 'Please enter full name';
    }
    if (!formData.fatherHusbandName.trim()) {
      errs.fatherHusbandName = lang === 'hi' ? 'पिता / पति का नाम दर्ज करें' : 'Enter Father/Husband name';
    }
    if (!formData.mobile.trim() || !/^[6-9]\d{9}$/.test(formData.mobile.replace(/\D/g, ''))) {
      errs.mobile = lang === 'hi' ? 'मान्य 10-अंकीय मोबाइल नंबर दर्ज करें' : 'Enter valid 10-digit mobile number';
    }
    if (!formData.villageOrLocality.trim()) {
      errs.villageOrLocality = lang === 'hi' ? 'ग्राम / मोहल्ला / वार्ड दर्ज करें' : 'Enter village/locality';
    }
    if (!formData.district.trim()) {
      errs.district = lang === 'hi' ? 'ज़िला दर्ज करें' : 'Enter district';
    }
    if (!formData.isConsentGiven) {
      errs.isConsentGiven = lang === 'hi' ? 'कृपया नियम एवं गोपनीयता सहमति स्वीकार करें' : 'Please accept trust terms';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        fullName: formData.fullName,
        fatherHusbandName: formData.fatherHusbandName,
        villageOrLocality: formData.villageOrLocality,
        postOffice: formData.postOffice,
        district: formData.district,
        state: formData.state,
        pincode: formData.pincode,
        mobile: formData.mobile,
        whatsapp: formData.whatsapp || formData.mobile,
        category: category,
        voluntaryAmount: category === 'catB' ? formData.voluntaryAmount : 0,
        categoryDetails: {
          assistanceNeed: category === 'catA' ? formData.assistanceNeed : null,
          volunteerArea: category === 'catC' ? formData.volunteerArea : null
        }
      };

      const result = await submitMembershipApplication(payload, currentUser?.uid || null);
      setSubmittedRef(result.applicationRef);

      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {}
    } catch (err) {
      console.error("Submission failed:", err);
      setErrors({ form: err.message || (lang === 'hi' ? 'आवेदन प्रेषण में त्रुटि हुई' : 'Submission failed') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (submittedRef) {
      navigator.clipboard.writeText(submittedRef);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetForm = () => {
    setSubmittedRef(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="relative bg-white w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-[#E9B44C]/40 my-auto sm:my-8 max-h-[94vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-primary text-white px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary text-white font-black flex items-center justify-center text-xs sm:text-sm shadow-sm flex-shrink-0">
              ॐ
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-black font-hindi-heading leading-tight truncate">
                {lang === 'hi' ? 'ट्रस्ट सदस्यता आवेदन' : 'Trust Membership Application'}
              </h2>
              <p className="text-[10px] sm:text-xs text-white/80 truncate">
                {lang === 'hi' ? 'राष्ट्रीय सनातन संस्कार सेवा संस्थान (गोरखपुर)' : 'Rashtriya Sanatan Sanskar Seva Sansthan (Trust)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5 text-[#E9B44C]" />
              <span>{lang === 'hi' ? 'EN' : 'हिंदी'}</span>
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="p-1.5 sm:p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1">
          {submittedRef ? (
            /* Success State */
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 rounded-full bg-trust-green/10 text-trust-green mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[#382719] font-hindi-heading">
                  {lang === 'hi' ? 'सदस्यता आवेदन सफलतापूर्वक दर्ज हुआ!' : 'Membership Application Submitted!'}
                </h3>
                <p className="text-sm text-[#454545] mt-2 max-w-lg mx-auto">
                  {lang === 'hi'
                    ? 'आपका आवेदन समीक्षा हेतु ट्रस्ट प्रबंधकारिणी को प्रेषित कर दिया गया है। ट्रस्ट नियमों के अनुसार सत्यापन उपरांत आपकी सदस्यता अनुमोदित होगी।'
                    : 'Your application has been received for review. Upon verification by the Trust Executive Council, your membership will be approved.'}
                </p>
              </div>

              {/* Reference ID Box */}
              <div className="bg-[#FFF8EF] p-4 rounded-2xl border border-[#E9B44C]/50 max-w-md mx-auto">
                <span className="text-xs font-bold text-[#666666] block uppercase tracking-wider">
                  {lang === 'hi' ? 'आवेदन संदर्भ संख्या (Application Reference)' : 'Application Reference ID'}
                </span>
                <div className="flex items-center justify-center gap-3 mt-1.5">
                  <span className="font-mono text-lg font-black text-primary">
                    {submittedRef}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg bg-white border border-[#E9B44C]/40 hover:border-primary text-[#382719] text-xs font-bold flex items-center gap-1 shadow-sm"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-trust-green" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-xs text-[#454545] max-w-lg mx-auto text-left space-y-1.5">
                <p className="font-bold text-[#382719] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>{lang === 'hi' ? 'महत्वपूर्ण सूचना:' : 'Important Notice:'}</span>
                </p>
                <p>
                  {category === 'catA'
                    ? (lang === 'hi' ? '• श्रेणी-क (सहायता आकांक्षी) हेतु वार्षिक सदस्यता शुल्क पूर्णतः निःशुल्क (छूट) है।' : '• Category A is exempt from annual membership fees.')
                    : (lang === 'hi' ? '• वार्षिक सदस्यता शुल्क ₹200 है। आप सदस्य डैशबोर्ड में जाकर बैंक/UPI से भुगतान कर सकते हैं।' : '• Annual fee is ₹200. You can submit payment details in the Member Portal.')}
                </p>
                <p>
                  {lang === 'hi'
                    ? '• आवेदन की स्थिति जांचने अथवा डिजिटल पहचान पत्र प्राप्त करने हेतु अपने यूज़रनेम से लॉगिन करें।'
                    : '• Please log in using your account to track your review status and receive your Digital ID card.'}
                </p>
              </div>

              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#382719] font-bold text-sm transition-all"
                >
                  {lang === 'hi' ? 'बंद करें' : 'Close'}
                </button>
                {onOpenLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      onOpenLogin();
                    }}
                    className="px-6 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-sm shadow-saffron transition-all"
                  >
                    {lang === 'hi' ? 'लॉगिन / सदस्य पोर्टल देखें' : 'Login / Member Portal'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="space-y-6 text-left">
              
              {/* Category Selector Cards */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#382719] mb-2.5">
                  {lang === 'hi' ? 'सदस्यता श्रेणी चुनें (Choose Category):' : 'Select Membership Category:'}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Cat A */}
                  <div
                    onClick={() => setCategory('catA')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      category === 'catA'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-[#E9B44C]/30 bg-white hover:border-[#E9B44C]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <HandHeart className="w-4 h-4 text-primary" />
                      <span className="font-extrabold text-xs text-[#382719]">
                        {lang === 'hi' ? 'श्रेणी - क' : 'Category A'}
                      </span>
                    </div>
                    <p className="font-bold text-xs text-[#382719]">
                      {lang === 'hi' ? 'सहायता आकांक्षी / निराश्रित' : 'Assistance Seeker'}
                    </p>
                    <span className="text-[10px] text-trust-green font-bold block mt-1">
                      {lang === 'hi' ? 'शुल्क: पूर्णतः निःशुल्क (छूट)' : 'Fee: Exempted (₹0)'}
                    </span>
                  </div>

                  {/* Cat B */}
                  <div
                    onClick={() => setCategory('catB')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      category === 'catB'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-[#E9B44C]/30 bg-white hover:border-[#E9B44C]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className="w-4 h-4 text-primary" />
                      <span className="font-extrabold text-xs text-[#382719]">
                        {lang === 'hi' ? 'श्रेणी - ख' : 'Category B'}
                      </span>
                    </div>
                    <p className="font-bold text-xs text-[#382719]">
                      {lang === 'hi' ? 'सम्पन्न / दानदाता सदस्य' : 'Donor / Supporter'}
                    </p>
                    <span className="text-[10px] text-primary font-bold block mt-1">
                      {lang === 'hi' ? 'वार्षिक शुल्क: ₹200/-' : 'Annual Fee: ₹200/-'}
                    </span>
                  </div>

                  {/* Cat C */}
                  <div
                    onClick={() => setCategory('catC')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      category === 'catC'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-[#E9B44C]/30 bg-white hover:border-[#E9B44C]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-secondary" />
                      <span className="font-extrabold text-xs text-[#382719]">
                        {lang === 'hi' ? 'श्रेणी - ग' : 'Category C'}
                      </span>
                    </div>
                    <p className="font-bold text-xs text-[#382719]">
                      {lang === 'hi' ? 'कार्यकर्ता / स्वयंसेवक' : 'Volunteer Member'}
                    </p>
                    <span className="text-[10px] text-secondary font-bold block mt-1">
                      {lang === 'hi' ? 'वार्षिक शुल्क: ₹200/-' : 'Annual Fee: ₹200/-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'आवेदक का पूरा नाम *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder={lang === 'hi' ? 'उदा. रमेश कुमार मिश्र' : 'e.g. Ramesh Kumar Mishra'}
                    className={`w-full px-3.5 py-2.5 rounded-xl border ${
                      errors.fullName ? 'border-red-500' : 'border-[#E9B44C]/50'
                    } focus:outline-none focus:border-primary text-sm`}
                  />
                  {errors.fullName && <p className="text-[11px] text-red-500 mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'पिता / पति का नाम *' : "Father / Husband's Name *"}
                  </label>
                  <input
                    type="text"
                    name="fatherHusbandName"
                    value={formData.fatherHusbandName}
                    onChange={handleInputChange}
                    placeholder={lang === 'hi' ? 'उदा. श्री बैजनाथ मिश्र' : 'e.g. Shri Baijnath Mishra'}
                    className={`w-full px-3.5 py-2.5 rounded-xl border ${
                      errors.fatherHusbandName ? 'border-red-500' : 'border-[#E9B44C]/50'
                    } focus:outline-none focus:border-primary text-sm`}
                  />
                  {errors.fatherHusbandName && <p className="text-[11px] text-red-500 mt-1">{errors.fatherHusbandName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'मोबाइल नंबर *' : 'Mobile Number *'}
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    maxLength={10}
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="9876543210"
                    className={`w-full px-3.5 py-2.5 rounded-xl border ${
                      errors.mobile ? 'border-red-500' : 'border-[#E9B44C]/50'
                    } focus:outline-none focus:border-primary text-sm font-mono`}
                  />
                  {errors.mobile && <p className="text-[11px] text-red-500 mt-1">{errors.mobile}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'व्हाट्सएप नंबर (यदि भिन्न हो)' : 'WhatsApp Number (if different)'}
                  </label>
                  <input
                    type="tel"
                    name="whatsapp"
                    maxLength={10}
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9B44C]/50 focus:outline-none focus:border-primary text-sm font-mono"
                  />
                </div>
              </div>

              {/* Address Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'ग्राम / मोहल्ला / वार्ड *' : 'Village / Locality / Ward *'}
                  </label>
                  <input
                    type="text"
                    name="villageOrLocality"
                    value={formData.villageOrLocality}
                    onChange={handleInputChange}
                    placeholder={lang === 'hi' ? 'उदा. शिवाजी नगर, सेक्टर-2' : 'e.g. Shivaji Nagar, Sector-2'}
                    className={`w-full px-3.5 py-2.5 rounded-xl border ${
                      errors.villageOrLocality ? 'border-red-500' : 'border-[#E9B44C]/50'
                    } focus:outline-none focus:border-primary text-sm`}
                  />
                  {errors.villageOrLocality && <p className="text-[11px] text-red-500 mt-1">{errors.villageOrLocality}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'डाकघर (Post Office)' : 'Post Office'}
                  </label>
                  <input
                    type="text"
                    name="postOffice"
                    value={formData.postOffice}
                    onChange={handleInputChange}
                    placeholder={lang === 'hi' ? 'रूस्तमपुर' : 'Rustampur'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9B44C]/50 focus:outline-none focus:border-primary text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'ज़िला *' : 'District *'}
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    placeholder={lang === 'hi' ? 'गोरखपुर' : 'Gorakhpur'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9B44C]/50 focus:outline-none focus:border-primary text-sm"
                  />
                </div>
              </div>

              {/* Category-Specific Questions */}
              {category === 'catA' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                  <label className="block text-xs font-bold text-[#382719]">
                    {lang === 'hi' ? 'अपेक्षित सहायता का संक्षिप्त विवरण:' : 'Brief Description of Assistance Needed:'}
                  </label>
                  <textarea
                    name="assistanceNeed"
                    rows={2}
                    value={formData.assistanceNeed}
                    onChange={handleInputChange}
                    placeholder={lang === 'hi' ? 'उदा. आकस्मिक चिकित्सा, कन्या विवाह या शिक्षा सहयोग...' : 'e.g. Medical, Education, or Sanskar help...'}
                    className="w-full px-3.5 py-2 rounded-xl border border-amber-300 bg-white text-xs focus:outline-none focus:border-primary"
                  />
                  <p className="text-[11px] text-[#666666]">
                    {lang === 'hi' ? 'नोट: यह जानकारी पूर्णतः गोपनीय रखी जाती है।' : 'Note: This sensitive detail is kept strictly confidential.'}
                  </p>
                </div>
              )}

              {category === 'catB' && (
                <div className="p-4 rounded-2xl bg-[#FFF8EF] border border-[#E9B44C]/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#382719]">
                      {lang === 'hi' ? 'निर्धारित वार्षिक सदस्यता शुल्क:' : 'Standard Annual Membership Fee:'}
                    </span>
                    <span className="font-mono font-black text-sm text-primary">₹200 / {lang === 'hi' ? 'वर्ष' : 'Year'}</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#454545] mt-2 mb-1">
                      {lang === 'hi' ? 'ऐच्छिक अतिरिक्त समर्पण राशि (यदि कोई हो):' : 'Voluntary Additional Contribution (Optional):'}
                    </label>
                    <input
                      type="number"
                      name="voluntaryAmount"
                      value={formData.voluntaryAmount}
                      onChange={handleInputChange}
                      placeholder={lang === 'hi' ? 'उदा. 500, 1100, 2100' : 'e.g. 500, 1100, 2100'}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E9B44C]/40 bg-white text-xs font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {category === 'catC' && (
                <div className="p-4 rounded-2xl bg-[#FFF8EF] border border-[#E9B44C]/50 space-y-2">
                  <label className="block text-xs font-bold text-[#382719]">
                    {lang === 'hi' ? 'रुचि का सेवा क्षेत्र:' : 'Preferred Volunteer Area:'}
                  </label>
                  <select
                    name="volunteerArea"
                    value={formData.volunteerArea}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E9B44C]/40 bg-white text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="sanskar_camps">
                      {lang === 'hi' ? '16 संस्कार जागरण एवं वैदिक शिविर' : '16 Vedic Sanskar Awareness Camps'}
                    </option>
                    <option value="labor_welfare">
                      {lang === 'hi' ? 'श्रमिक कल्याण एवं जागरूकता अभियान' : 'Labor Rights & Welfare Campaigns'}
                    </option>
                    <option value="ration_distribution">
                      {lang === 'hi' ? 'राशन एवं आकस्मिक सहायता वितरण' : 'Emergency Ration & Food Distribution'}
                    </option>
                    <option value="cultural_events">
                      {lang === 'hi' ? 'सांस्कृतिक व आध्यात्मिक कार्यक्रम प्रबंधन' : 'Cultural & Vedic Event Management'}
                    </option>
                  </select>
                </div>
              )}

              {/* Privacy Consent Checkbox */}
              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  id="consentCheck"
                  name="isConsentGiven"
                  checked={formData.isConsentGiven}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 rounded text-primary focus:ring-primary border-gray-300"
                />
                <label htmlFor="consentCheck" className="text-xs text-[#454545] leading-relaxed cursor-pointer">
                  {lang === 'hi'
                    ? 'मैं प्रमाणित करता/करती हूँ कि दी गई जानकारी सत्य है एवं मैं राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट) के नियमों व आदर्शों का सम्मान करूँगा/करूँगी।'
                    : 'I certify that the information provided is accurate and I agree to uphold the ideals and constitution of the Trust.'}
                </label>
              </div>
              {errors.isConsentGiven && <p className="text-[11px] text-red-500">{errors.isConsentGiven}</p>}
              {errors.form && <p className="text-xs text-red-600 font-bold">{errors.form}</p>}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#E9B44C]/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-[11px] text-[#666666]">
                  {lang === 'hi' ? '* सभी चिह्नित विवरण आवश्यक हैं' : '* Required fields'}
                </p>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-xs font-bold text-[#454545]"
                  >
                    {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs sm:text-sm shadow-saffron transition-all disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>
                      {isSubmitting
                        ? (lang === 'hi' ? 'प्रक्रियाधीन...' : 'Submitting...')
                        : (lang === 'hi' ? 'सदस्यता आवेदन जमा करें' : 'Submit Application')}
                    </span>
                  </button>
                </div>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default JoinTrustModal;
