import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { submitMembershipWithPaymentId } from '../firebase/membershipService';
import { subscribePaymentSettings, DEFAULT_PAYMENT_SETTINGS } from '../firebase/paymentService';
import { uploadImageToCloudinary } from '../utils/cloudinaryService';
import {
  X,
  UserPlus,
  Users,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Globe,
  QrCode,
  Building,
  Upload,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Phone,
  CreditCard,
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const JoinTrustModal = ({ isOpen, onClose, defaultCategory = 'catB', initialType = 'member' }) => {
  const { lang, toggleLanguage } = useLanguage();
  const { currentUser, userProfile, registerWithUsername } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [joinType, setJoinType] = useState(initialType || 'member'); // 'member' | 'volunteer'
  const [paymentSettings, setPaymentSettings] = useState(DEFAULT_PAYMENT_SETTINGS);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedIfsc, setCopiedIfsc] = useState(false);

  const [formData, setFormData] = useState({
    fullName: currentUser ? (userProfile?.fullName || userProfile?.displayName || '') : '',
    username: '',
    password: '',
    confirmPassword: '',
    fatherHusbandName: '',
    villageOrLocality: '',
    postOffice: '',
    district: 'गोरखपुर (Gorakhpur)',
    state: 'उत्तर प्रदेश (UP)',
    pincode: '273016',
    mobile: currentUser ? (userProfile?.phone || userProfile?.mobile || '') : '',
    whatsapp: currentUser ? (userProfile?.phone || userProfile?.mobile || '') : '',
    email: currentUser ? (userProfile?.email || '') : '',
    category: defaultCategory || 'catB',
    profession: 'business',
    workplace: '',
    focusArea: 'sanskar',
    proofOption: 'utr', // 'utr' | 'screenshot'
    utrNumber: '',
    isConsentGiven: true
  });

  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribePaymentSettings((settings) => {
      setPaymentSettings(settings);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialType) {
        setJoinType(initialType);
      }
      if (!currentUser) {
        setFormData({
          fullName: '',
          username: '',
          password: '',
          confirmPassword: '',
          fatherHusbandName: '',
          villageOrLocality: '',
          postOffice: '',
          district: 'गोरखपुर (Gorakhpur)',
          state: 'उत्तर प्रदेश (UP)',
          pincode: '273016',
          mobile: '',
          whatsapp: '',
          email: '',
          category: defaultCategory || 'catB',
          profession: 'business',
          workplace: '',
          focusArea: 'sanskar',
          proofOption: 'utr',
          utrNumber: '',
          isConsentGiven: true
        });
        setScreenshotFile(null);
        setScreenshotPreview(null);
        setErrors({});
      } else if (userProfile) {
        setFormData((prev) => ({
          ...prev,
          fullName: userProfile.fullName || userProfile.displayName || '',
          mobile: userProfile.phone || userProfile.mobile || '',
          whatsapp: userProfile.phone || userProfile.mobile || '',
          email: userProfile.email || '',
          category: defaultCategory || 'catB'
        }));
      }
    }
  }, [isOpen, currentUser, userProfile, defaultCategory, initialType]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file));
      if (errors.proof) setErrors((prev) => ({ ...prev, proof: null }));
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard?.writeText(text);
    if (type === 'upi') {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else if (type === 'acc') {
      setCopiedAcc(true);
      setTimeout(() => setCopiedAcc(false), 2000);
    } else if (type === 'ifsc') {
      setCopiedIfsc(true);
      setTimeout(() => setCopiedIfsc(false), 2000);
    }
  };

  const isVolunteer = joinType === 'volunteer';

  // Cross-Registration Fee Exemption Logic:
  // When a user is already approved as a member and wants to join as a volunteer, or vice versa, no fee is needed!
  const isAlreadyApprovedMember = Boolean(
    currentUser && (userProfile?.isMember === true || userProfile?.membershipStatus === 'approved')
  );
  const isAlreadyApprovedVolunteer = Boolean(
    currentUser && (userProfile?.isVolunteer === true || userProfile?.volunteerStatus === 'approved' || userProfile?.role === 'volunteer')
  );
  const isCrossExempted = Boolean(
    currentUser && (
      (isVolunteer && isAlreadyApprovedMember) ||
      (!isVolunteer && isAlreadyApprovedVolunteer)
    )
  );

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) {
      errs.fullName = lang === 'hi' ? 'पूरा नाम दर्ज करें' : 'Full name is required';
    }

    const cleanMobile = formData.mobile.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length !== 10) {
      errs.mobile = lang === 'hi' ? 'मान्य 10-अंकीय मोबाइल नंबर दर्ज करें' : 'Valid 10-digit mobile required';
    }

    const cleanWhatsapp = (formData.whatsapp || '').replace(/\D/g, '');
    if (!cleanWhatsapp || cleanWhatsapp.length !== 10) {
      errs.whatsapp = lang === 'hi' ? 'मान्य 10-अंकीय व्हाट्सएप नंबर अनिवार्य है (सूचनाओं हेतु)' : 'Valid 10-digit WhatsApp number required for notices';
    }

    if (!formData.villageOrLocality.trim()) {
      errs.villageOrLocality = lang === 'hi' ? 'पता / मोहल्ला दर्ज करें' : 'Address/locality required';
    }

    // Account validation if not logged in
    if (!currentUser) {
      const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/;
      if (!formData.username.trim()) {
        errs.username = lang === 'hi' ? 'यूज़रनेम दर्ज करना अनिवार्य है' : 'Username is required';
      } else if (!usernameRegex.test(formData.username.trim())) {
        errs.username = lang === 'hi'
          ? 'यूज़रनेम 4-20 अक्षर (a-z, 0-9, _) होना चाहिए'
          : 'Username must be 4-20 characters (a-z, 0-9, _ only)';
      }

      if (!formData.password || formData.password.length < 6) {
        errs.password = lang === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए' : 'Password must be at least 6 characters';
      } else if (formData.password !== formData.confirmPassword) {
        errs.confirmPassword = lang === 'hi' ? 'पासवर्ड मेल नहीं खाता' : 'Passwords do not match';
      }
    }

    // Payment proof validation: ONLY IF NOT CROSS EXEMPTED
    if (!isCrossExempted) {
      if (formData.proofOption === 'utr') {
        const cleanUtr = formData.utrNumber.trim();
        if (!cleanUtr || cleanUtr.length < 6) {
          errs.proof = lang === 'hi' ? 'कृपया मान्य UTR / लेनदेन संदर्भ संख्या दर्ज करें' : 'Valid UTR/transaction ref number required';
        }
      } else if (formData.proofOption === 'screenshot') {
        if (!screenshotFile) {
          errs.proof = lang === 'hi' ? 'कृपया भुगतान का स्क्रीनशॉट अपलोड करें' : 'Please upload payment screenshot';
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      let uid = currentUser?.uid;

      // 1. Create account with username and password if not logged in
      if (!uid) {
        const userCred = await registerWithUsername({
          username: formData.username.trim(),
          password: formData.password,
          fullName: formData.fullName.trim(),
          phone: formData.mobile.trim(),
          email: formData.email.trim(),
          role: isVolunteer ? 'volunteer' : 'member'
        });
        uid = userCred.uid;
      }

      // 2. Upload screenshot to Cloudinary if chosen (only if not cross-exempted)
      let uploadedScreenshotUrl = null;
      if (!isCrossExempted && formData.proofOption === 'screenshot' && screenshotFile) {
        uploadedScreenshotUrl = await uploadImageToCloudinary(screenshotFile, 'trust_receipts');
      }

      const paymentReference = isCrossExempted
        ? 'CROSS_APPROVED_FREE'
        : (formData.proofOption === 'utr' ? formData.utrNumber.trim() : `SCREENSHOT_${Date.now()}`);

      // 3. Submit Membership / Volunteer Application with Payment Proof
      await submitMembershipWithPaymentId({
        fullName: formData.fullName.trim(),
        phone: formData.mobile.trim(),
        fatherHusbandName: formData.fatherHusbandName.trim(),
        address: formData.villageOrLocality.trim(),
        district: formData.district.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        category: isVolunteer ? 'catC' : (formData.category || 'catB'),
        memberType: isVolunteer ? 'volunteer' : 'member',
        role: isVolunteer ? 'volunteer' : 'member',
        claimedAmount: isCrossExempted ? 0 : 200,
        annualFee: isCrossExempted ? 0 : 200,
        amount: isCrossExempted ? 0 : 200,
        paymentId: paymentReference,
        paymentStatus: isCrossExempted ? 'exempted' : 'pending_verification',
        paymentDate: isCrossExempted ? null : new Date().toISOString().split('T')[0],
        paymentProofType: isCrossExempted ? 'exempted' : formData.proofOption,
        paymentScreenshotUrl: uploadedScreenshotUrl,
        profession: formData.profession,
        workplace: formData.workplace,
        focusArea: formData.focusArea,
        uid: uid
      });

      try {
        confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
      } catch {}

      toast.success(
        isVolunteer
          ? (lang === 'hi'
              ? 'सनातन स्वयंसेवक पंजीकरण आवेदन सफलतापूर्वक प्रेषित! आपका डैशबोर्ड खोला जा रहा है।'
              : 'Volunteer application submitted! Opening your Dashboard.')
          : (lang === 'hi'
              ? 'सदस्यता आवेदन सफलतापूर्वक प्रेषित! आपका सदस्य डैशबोर्ड खोला जा रहा है।'
              : 'Membership application submitted! Opening your Member Dashboard.')
      );

      onClose();
      navigate('/dashboard');
    } catch (err) {
      console.error('Submission error:', err);
      const errMsg = err.message || (lang === 'hi' ? 'आवेदन जमा करने में त्रुटि' : 'Failed to submit application');
      toast.error(errMsg);
      setErrors({ form: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="relative bg-white w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-[#E9B44C]/40 my-auto sm:my-8 max-h-[94vh] flex flex-col">
        
        {/* Header */}
        <div className={`px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between flex-shrink-0 text-white ${
          isVolunteer
            ? 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-amber-700'
            : 'bg-gradient-to-r from-primary via-[#EA6F0B] to-secondary'
        }`}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/15 border border-white/30 text-white font-bold flex items-center justify-center text-xs sm:text-sm shadow-sm flex-shrink-0">
              {isVolunteer ? <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-black font-hindi-heading truncate">
                {isVolunteer
                  ? (lang === 'hi' ? 'सनातन स्वयंसेवक पंजीकरण प्रपत्र' : 'Trust Volunteer Registration Form')
                  : (lang === 'hi' ? 'ट्रस्ट सदस्यता पंजीकरण प्रपत्र' : 'Trust Membership Registration Form')}
              </h2>
              <p className="text-[10px] sm:text-xs text-white/90 truncate">
                {isCrossExempted
                  ? (lang === 'hi' ? 'पूर्व-स्वीकृत छूट: निःशुल्क (₹0) पंजीकरण' : 'Cross-Exempted: Free (₹0) Registration')
                  : isVolunteer
                  ? (lang === 'hi' ? 'वार्षिक सहयोग शुल्क ₹200 • स्वयंसेवक टैग • डिजिटल स्वयंसेवक पहचान पत्र' : 'Annual Fee ₹200 • Volunteer Tag • Digital Volunteer Card')
                  : (lang === 'hi' ? 'वार्षिक सहयोग शुल्क ₹200 • सदस्य टैग • डिजिटल सदस्य पहचान पत्र' : 'Annual Fee ₹200 • Member Tag • Digital Member Card')}
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
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-left">
          {/* Top Role Selector Tabs: Choose Member vs Volunteer */}
          <div className="mb-5 bg-gradient-to-r from-amber-50 to-orange-50 p-3 sm:p-4 rounded-2xl border border-amber-200/80 shadow-2xs">
            <label className="block text-xs font-black text-[#382719] mb-2 uppercase tracking-wide">
              {lang === 'hi' ? '१. जुड़ने का प्रकार चुनें (Choose Role / Tag) *' : '1. Choose Joining Role / Tag *'}
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setJoinType('member')}
                className={`p-3 rounded-xl border-2 flex items-center gap-2.5 sm:gap-3 text-left transition-all ${
                  joinType === 'member'
                    ? 'bg-white border-primary shadow-md ring-2 ring-primary/25 text-[#382719]'
                    : 'bg-white/70 border-amber-200/60 hover:bg-white text-[#666666]'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  joinType === 'member' ? 'bg-primary text-white shadow-xs' : 'bg-amber-100 text-primary'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="font-black text-xs sm:text-sm block truncate font-hindi-heading">
                    {lang === 'hi' ? 'ट्रस्ट सदस्य (Member)' : 'Trust Member'}
                  </span>
                  <span className="text-[10px] text-[#777777] block truncate">
                    {lang === 'hi' ? '🛡️ सदस्य टैग (Member Tag)' : 'Official Member Tag'}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setJoinType('volunteer')}
                className={`p-3 rounded-xl border-2 flex items-center gap-2.5 sm:gap-3 text-left transition-all ${
                  joinType === 'volunteer'
                    ? 'bg-white border-emerald-600 shadow-md ring-2 ring-emerald-500/25 text-[#382719]'
                    : 'bg-white/70 border-emerald-200/60 hover:bg-white text-[#666666]'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  joinType === 'volunteer' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="font-black text-xs sm:text-sm block truncate font-hindi-heading">
                    {lang === 'hi' ? 'सनातन स्वयंसेवक (Volunteer)' : 'Trust Volunteer'}
                  </span>
                  <span className="text-[10px] text-[#777777] block truncate">
                    {lang === 'hi' ? '🤝 स्वयंसेवक टैग (Volunteer Tag)' : 'Volunteer Tag'}
                  </span>
                </div>
              </button>
            </div>
            <p className="text-[11px] text-[#777777] mt-2 italic">
              {isCrossExempted
                ? (lang === 'hi'
                    ? `* पूर्व-स्वीकृत छूट लागू: आप संस्थान के स्वीकृत ${isAlreadyApprovedMember ? 'सदस्य' : 'स्वयंसेवक'} हैं, अतः आपके लिए यह आवेदन पूर्णतः निःशुल्क (₹0) है।`
                    : `* Cross-exemption active: As an approved ${isAlreadyApprovedMember ? 'Member' : 'Volunteer'}, this application is free (₹0) for you.`)
                : (lang === 'hi'
                    ? '* दोनों हेतु प्रक्रिया एवं ₹200 वार्षिक सहयोग शुल्क एक समान है। केवल आपका पद / टैग और अधिकृत पहचान पत्र भिन्न होगा।'
                    : '* Same registration process & ₹200 fee apply for both. Your profile will receive the respective tag and distinct ID card.')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {errors.form && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs font-bold flex items-center gap-2">
                <X className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{errors.form}</span>
              </div>
            )}

            {/* Section 1: Account Login Details (Direct creation if not logged in) */}
            {!currentUser && (
              <div className="p-4 rounded-2xl bg-[#FFF8EF] border border-[#E9B44C]/50 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-secondary uppercase tracking-wider">
                  <Lock className="w-4 h-4 text-primary" />
                  <span>{lang === 'hi' ? 'लॉगिन खाता विवरण (Login Credentials)' : 'Account Login Details'}</span>
                </div>
                <p className="text-xs text-[#523e2b]">
                  {lang === 'hi'
                    ? 'आवेदन जमा होते ही आपका सदस्य खाता स्वतः बन जाएगा। अगली बार सीधे इसी यूज़रनेम व पासवर्ड से लॉगिन कर सकेंगे।'
                    : 'Your member account will be created automatically. You will use this username and password to log in next time.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'यूज़रनेम (Username) *' : 'Username *'}
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="e.g. rohit_sharma"
                      className={`w-full px-3 py-2 rounded-xl border text-xs ${
                        errors.username ? 'border-red-500 bg-red-50/50' : 'border-gray-300 focus:border-primary'
                      } focus:outline-none`}
                    />
                    {errors.username && <p className="text-[10px] text-red-500 mt-0.5">{errors.username}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'पासवर्ड (कम से कम 6 अक्षर) *' : 'Password (min 6 chars) *'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        className={`w-full pl-3 pr-8 py-2 rounded-xl border text-xs ${
                          errors.password ? 'border-red-500 bg-red-50/50' : 'border-gray-300 focus:border-primary'
                        } focus:outline-none`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 p-0.5"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-[10px] text-red-500 mt-0.5">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'पासवर्ड की पुष्टि *' : 'Confirm Password *'}
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className={`w-full px-3 py-2 rounded-xl border text-xs ${
                        errors.confirmPassword ? 'border-red-500 bg-red-50/50' : 'border-gray-300 focus:border-primary'
                      } focus:outline-none`}
                    />
                    {errors.confirmPassword && <p className="text-[10px] text-red-500 mt-0.5">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Section 2: Applicant Information */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-[#E9B44C]/30 pb-1">
                <span>{lang === 'hi' ? '१. सदस्य व्यक्तिगत विवरण (Personal Details)' : '1. Member Personal Details'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'पूरा नाम *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder={lang === 'hi' ? 'उदा. राजेश कुमार मिश्र' : 'e.g. Rajesh Kumar Mishra'}
                    className={`w-full px-3 py-2 rounded-xl border ${
                      errors.fullName ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                    } text-xs focus:outline-none focus:border-primary`}
                  />
                  {errors.fullName && <p className="text-[10px] text-red-500 mt-0.5">{errors.fullName}</p>}
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
                    placeholder={lang === 'hi' ? 'श्री बैजनाथ मिश्र' : 'Shri Baijnath Mishra'}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'मोबाइल नंबर (लॉगिन एवं संपर्क हेतु) *' : 'Mobile Number (Primary) *'}
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    maxLength={10}
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="9876543210"
                    className={`w-full px-3 py-2 rounded-xl border font-mono ${
                      errors.mobile ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                    } text-xs focus:outline-none focus:border-primary`}
                  />
                  {errors.mobile && <p className="text-[10px] text-red-500 mt-0.5">{errors.mobile}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#382719]">
                      {lang === 'hi' ? 'व्हाट्सएप नंबर (सूचनाओं हेतु अनिवार्य) *' : 'WhatsApp Number (Required for Notices) *'}
                    </label>
                    {formData.mobile && formData.whatsapp !== formData.mobile && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, whatsapp: prev.mobile }));
                          if (errors.whatsapp) setErrors(prev => ({ ...prev, whatsapp: null }));
                        }}
                        className="text-[10px] text-emerald-700 hover:underline font-bold"
                      >
                        {lang === 'hi' ? 'मोबाइल नंबर जैसा' : 'Same as Mobile'}
                      </button>
                    )}
                  </div>
                  <input
                    type="tel"
                    name="whatsapp"
                    maxLength={10}
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    placeholder="9876543210"
                    className={`w-full px-3 py-2 rounded-xl border ${
                      errors.whatsapp ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                    } text-xs font-mono focus:outline-none focus:border-primary`}
                  />
                  {errors.whatsapp && <p className="text-[10px] text-red-500 mt-0.5">{errors.whatsapp}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'पूरा पता (मोहल्ला / ग्राम / वार्ड) *' : 'Full Address / Village / Locality *'}
                  </label>
                  <input
                    type="text"
                    name="villageOrLocality"
                    value={formData.villageOrLocality}
                    onChange={handleInputChange}
                    placeholder={lang === 'hi' ? 'उदा. मकान नं. 14, रूस्तमपुर, निकट प्राचीन शिव मंदिर' : 'e.g. H.No 14, Rustampur, Near Shiva Temple'}
                    className={`w-full px-3 py-2 rounded-xl border ${
                      errors.villageOrLocality ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                    } text-xs focus:outline-none focus:border-primary`}
                  />
                  {errors.villageOrLocality && <p className="text-[10px] text-red-500 mt-0.5">{errors.villageOrLocality}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'शहर / ज़िला' : 'City / District'}
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'पिन कोड' : 'Pin Code'}
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="273016"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Fee Exemption Banner (When Cross-Registered) or Standard Payment */}
            {isCrossExempted ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-50 border-2 border-emerald-300 shadow-xs space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-900 font-black text-sm sm:text-base font-hindi-heading">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    {lang === 'hi'
                      ? '२. निःशुल्क पंजीकरण छूट (₹0 Fee Exemption Active)'
                      : '2. Free Registration Exemption (₹0 Fee)'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                  {lang === 'hi'
                    ? `विशेष छूट: क्योंकि आप पहले से संस्थान के स्वीकृत ${isAlreadyApprovedMember ? 'सदस्य' : 'स्वयंसेवक'} हैं, इसलिए ${isVolunteer ? 'स्वयंसेवक' : 'ट्रस्ट सदस्य'} के रूप में जुड़ने हेतु कोई सहयोग शुल्क (₹0) अथवा UTR / स्क्रीनशॉट प्रमाण की आवश्यकता नहीं है। आवेदन सीधे समीक्षा उपरांत स्वीकृत किया जाएगा।`
                    : `Special Exemption: Because you are already an approved ${isAlreadyApprovedMember ? 'Member' : 'Volunteer'}, cross-registering as a ${isVolunteer ? 'Volunteer' : 'Member'} requires no fee (₹0) or payment proof.`}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFF8EF] via-white to-[#FFF8EF] border-2 border-[#E9B44C]/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#E9B44C]/30 pb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <span className="text-sm font-black text-[#382719]">
                      {lang === 'hi' ? '२. सदस्यता सहयोग शुल्क भुगतान (₹200)' : '2. Annual Membership Contribution (₹200)'}
                    </span>
                  </div>
                  <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/30 w-fit">
                    ₹200.00 (Annual)
                  </span>
                </div>

                {/* QR and Bank Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  
                  {/* QR Code Column */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-[#E9B44C]/40 text-center shadow-xs">
                    <img
                      src={paymentSettings.qrImageUrl || '/payment-qr.png'}
                      alt="Payment QR"
                      className="w-36 h-36 object-contain rounded-lg border border-gray-200"
                    />
                    <div className="mt-2 flex items-center justify-center gap-1.5 text-xs font-bold text-[#382719]">
                      <span className="font-mono text-[11px] text-primary">{paymentSettings.upiId}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentSettings.upiId, 'upi')}
                        className="p-1 hover:bg-gray-100 rounded text-gray-500"
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-0.5">
                      {lang === 'hi' ? 'किसी भी UPI ऐप से ₹200 स्कैन कर भुगतान करें' : 'Scan via any UPI app to pay ₹200'}
                    </span>
                  </div>

                  {/* Bank Details Column */}
                  <div className="md:col-span-7 bg-white p-3.5 rounded-xl border border-[#E9B44C]/40 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-secondary text-[11px] uppercase tracking-wider">
                      <Building className="w-4 h-4 text-primary" />
                      <span>{lang === 'hi' ? 'संस्था का अधिकृत बैंक खाता विवरण' : 'Trust Official Bank Account Details'}</span>
                    </div>

                    <div className="space-y-1.5 text-[11px] pt-1">
                      <div>
                        <span className="text-gray-500 block">{lang === 'hi' ? 'खाताधारक का नाम:' : 'Account Name:'}</span>
                        <span className="font-bold text-[#382719] block">{paymentSettings.payeeName}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-500 block">{lang === 'hi' ? 'बैंक का नाम:' : 'Bank Name:'}</span>
                          <span className="font-bold text-[#382719]">{paymentSettings.bankName}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">{lang === 'hi' ? 'शाखा:' : 'Branch:'}</span>
                          <span className="font-medium text-[#382719]">{paymentSettings.branch}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-[#FFF8EF] p-2 rounded-lg border border-[#E9B44C]/30">
                        <div>
                          <span className="text-gray-500 block">{lang === 'hi' ? 'खाता संख्या (A/C No):' : 'Account Number:'}</span>
                          <span className="font-mono font-bold text-primary text-xs">{paymentSettings.accountNumber}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(paymentSettings.accountNumber, 'acc')}
                          className="px-2 py-1 text-[10px] rounded bg-white border border-gray-200 font-bold hover:bg-gray-50 flex items-center gap-1"
                        >
                          {copiedAcc ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedAcc ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between bg-[#FFF8EF] p-2 rounded-lg border border-[#E9B44C]/30">
                        <div>
                          <span className="text-gray-500 block">{lang === 'hi' ? 'IFSC कोड:' : 'IFSC Code:'}</span>
                          <span className="font-mono font-bold text-[#382719] text-xs">{paymentSettings.ifsc}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(paymentSettings.ifsc, 'ifsc')}
                          className="px-2 py-1 text-[10px] rounded bg-white border border-gray-200 font-bold hover:bg-gray-50 flex items-center gap-1"
                        >
                          {copiedIfsc ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedIfsc ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Payment Proof Selection: One is Mandatory */}
                <div className="pt-2 border-t border-[#E9B44C]/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="text-xs font-black text-[#382719]">
                      {lang === 'hi' ? 'भुगतान सत्यापन प्रमाण विकल्प (Payment Proof - One Mandatory) *' : 'Payment Proof Option (Mandatory - Select One) *'}
                    </label>
                    <span className="text-[10px] text-amber-800 font-bold">
                      {lang === 'hi' ? 'दोनों में से कोई एक विकल्प चुनना अनिवार्य है' : 'Choose either UTR or Screenshot'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, proofOption: 'utr' }));
                        if (errors.proof) setErrors((prev) => ({ ...prev, proof: null }));
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        formData.proofOption === 'utr'
                          ? 'border-primary bg-primary text-white shadow-xs'
                          : 'border-gray-300 bg-white text-[#454545] hover:border-[#E9B44C]'
                      }`}
                    >
                      <span>1. UTR / संदर्भ संख्या (UTR Number)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, proofOption: 'screenshot' }));
                        if (errors.proof) setErrors((prev) => ({ ...prev, proof: null }));
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        formData.proofOption === 'screenshot'
                          ? 'border-primary bg-primary text-white shadow-xs'
                          : 'border-gray-300 bg-white text-[#454545] hover:border-[#E9B44C]'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>2. स्क्रीनशॉट अपलोड (Upload Screenshot)</span>
                    </button>
                  </div>

                  {/* Sub-Form for UTR */}
                  {formData.proofOption === 'utr' && (
                    <div>
                      <label className="block text-xs font-bold text-[#382719] mb-1">
                        {lang === 'hi' ? '12-अंकीय UTR / UPI Ref संख्या दर्ज करें *' : 'Enter 12-Digit UTR / Transaction Reference ID *'}
                      </label>
                      <input
                        type="text"
                        name="utrNumber"
                        value={formData.utrNumber}
                        onChange={handleInputChange}
                        placeholder="e.g. 428901234567"
                        className={`w-full px-3 py-2 rounded-xl border font-mono text-xs ${
                          errors.proof ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                        } focus:outline-none focus:border-primary`}
                      />
                      <p className="text-[10px] text-gray-500 mt-1">
                        {lang === 'hi' ? 'यह संख्या आपके UPI ऐप (PhonePe, GooglePay, Paytm आदि) की रसीद में उपलब्ध होती है।' : 'Found in your UPI receipt details (12 digits).'}
                      </p>
                    </div>
                  )}

                  {/* Sub-Form for Screenshot */}
                  {formData.proofOption === 'screenshot' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-[#382719]">
                        {lang === 'hi' ? 'भुगतान रसीद का स्क्रीनशॉट चुनें *' : 'Select Payment Screenshot *'}
                      </label>
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotChange}
                          className="text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-secondary cursor-pointer"
                        />
                        {screenshotPreview && (
                          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border">
                            <img src={screenshotPreview} alt="Receipt preview" className="w-12 h-12 object-cover rounded" />
                            <span className="text-[11px] text-green-700 font-bold">✓ रसीद चयनित (Selected)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {errors.proof && (
                    <p className="text-xs text-red-600 font-bold mt-1 bg-red-50 p-2 rounded-lg border border-red-200">
                      {errors.proof}
                    </p>
                  )}
                </div>

              </div>
            )}

            {errors.form && (
              <p className="text-xs text-red-600 font-bold bg-red-50 p-2.5 rounded-xl border border-red-200">
                {errors.form}
              </p>
            )}

            {/* Bottom Actions */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-[#454545] hover:bg-gray-100 transition-colors cursor-pointer"
              >
                {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-7 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white font-bold text-xs sm:text-sm shadow-saffron transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>
                  {isSubmitting
                    ? (lang === 'hi' ? 'आवेदन जमा हो रहा है...' : 'Submitting Application...')
                    : isCrossExempted
                    ? (isVolunteer
                        ? (lang === 'hi' ? '🤝 निःशुल्क स्वयंसेवक आवेदन जमा करें' : 'Submit Free Volunteer Application')
                        : (lang === 'hi' ? '🛡️ निःशुल्क सदस्यता आवेदन जमा करें' : 'Submit Free Membership Application'))
                    : isVolunteer
                    ? (lang === 'hi' ? '🤝 स्वयंसेवक आवेदन एवं प्रमाण जमा करें' : 'Submit Volunteer Application & Proof')
                    : (lang === 'hi' ? '🛡️ सदस्यता आवेदन एवं प्रमाण जमा करें' : 'Submit Membership Application & Proof')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default JoinTrustModal;
