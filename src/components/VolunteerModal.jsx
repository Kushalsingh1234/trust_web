import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { submitVolunteerApplication } from '../firebase/services';
import { uploadImageToCloudinary } from '../utils/cloudinaryService';
import { DEFAULT_PAYMENT_SETTINGS } from '../firebase/paymentService';
import {
  X,
  Users,
  CheckCircle2,
  Globe,
  Lock,
  User,
  Eye,
  EyeOff,
  Heart,
  QrCode,
  Building,
  Upload,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

const VOLUNTEER_AREAS = [
  { id: 'sanskar_camps', labelHi: '१६ वैदिक संस्कार जागरण शिविर', labelEn: '16 Vedic Sanskars Awareness Camps' },
  { id: 'labor_welfare', labelHi: 'श्रमिक अधिकार एवं समाज कल्याण कार्य', labelEn: 'Labor Rights & Welfare Campaigns' },
  { id: 'ration_aid', labelHi: 'आपातकालीन राशन व वस्त्र वितरण', labelEn: 'Emergency Ration & Relief Distribution' },
  { id: 'digital_media', labelHi: 'डिजिटल प्रचार एवं सनातन संस्कृति प्रसार', labelEn: 'Digital Media & Cultural Outreach' },
  { id: 'event_management', labelHi: 'धार्मिक व सार्वजनिक कार्यक्रम प्रबंधन', labelEn: 'Vedic Rites & Public Event Management' }
];

export const VolunteerModal = ({ isOpen, onClose }) => {
  const { lang, toggleLanguage } = useLanguage();
  const { currentUser, userProfile, registerWithUsername } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: userProfile?.fullName || userProfile?.displayName || '',
    username: '',
    password: '',
    confirmPassword: '',
    mobile: userProfile?.phone || userProfile?.mobile || '',
    whatsapp: userProfile?.phone || userProfile?.mobile || '',
    email: userProfile?.email || '',
    cityOrDistrict: 'गोरखपुर (Gorakhpur)',
    availability: 'weekends', // 'weekends' | 'full_time' | 'few_hours_daily'
    experience: '',
    preferredAreas: ['sanskar_camps'],
    optionalDonation: '',
    donationProofType: 'utr', // 'utr' | 'screenshot'
    donationUtr: '',
    donationScreenshotUrl: ''
  });

  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || userProfile.fullName || userProfile.displayName || '',
        mobile: prev.mobile || userProfile.phone || userProfile.mobile || '',
        whatsapp: prev.whatsapp || userProfile.phone || userProfile.mobile || '',
        email: prev.email || userProfile.email || ''
      }));
    }
  }, [userProfile]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file));
      if (errors.screenshot) setErrors(prev => ({ ...prev, screenshot: null }));
    }
  };

  const toggleArea = (areaId) => {
    setFormData(prev => {
      const exists = prev.preferredAreas.includes(areaId);
      const next = exists
        ? prev.preferredAreas.filter(a => a !== areaId)
        : [...prev.preferredAreas, areaId];
      return { ...prev, preferredAreas: next.length > 0 ? next : ['sanskar_camps'] };
    });
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = lang === 'hi' ? 'कृपया पूरा नाम दर्ज करें' : 'Enter full name';
    if (!formData.mobile.trim() || !/^[6-9]\d{9}$/.test(formData.mobile.replace(/\D/g, ''))) {
      errs.mobile = lang === 'hi' ? 'मान्य 10-अंकीय मोबाइल नंबर दर्ज करें' : 'Enter valid 10-digit mobile';
    }
    const cleanWhatsapp = (formData.whatsapp || '').replace(/\D/g, '');
    if (!cleanWhatsapp || cleanWhatsapp.length !== 10) {
      errs.whatsapp = lang === 'hi' ? 'मान्य 10-अंकीय व्हाट्सएप नंबर अनिवार्य है (सूचनाओं हेतु)' : 'Valid 10-digit WhatsApp number required for notices';
    }
    if (!formData.cityOrDistrict.trim()) errs.cityOrDistrict = lang === 'hi' ? 'स्थान / ज़िला दर्ज करें' : 'Enter city/district';

    // Account creation validation if not logged in
    if (!currentUser) {
      const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/;
      if (!formData.username.trim()) {
        errs.username = lang === 'hi' ? 'यूज़रनेम दर्ज करना अनिवार्य है' : 'Username is required';
      } else if (!usernameRegex.test(formData.username.trim())) {
        errs.username = lang === 'hi'
          ? 'यूज़रनेम 4-20 अक्षर (केवल a-z, 0-9, _) होना चाहिए'
          : 'Username must be 4-20 characters (a-z, 0-9, _ only)';
      }

      if (!formData.password || formData.password.length < 6) {
        errs.password = lang === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए' : 'Password must be at least 6 characters';
      } else if (formData.password !== formData.confirmPassword) {
        errs.confirmPassword = lang === 'hi' ? 'पासवर्ड मेल नहीं खाता' : 'Passwords do not match';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      let uid = currentUser?.uid;

      // 1. Create account if not already logged in
      if (!uid) {
        const userCred = await registerWithUsername({
          username: formData.username.trim(),
          password: formData.password,
          fullName: formData.fullName.trim(),
          phone: formData.mobile.trim(),
          email: formData.email.trim(),
          role: 'volunteer'
        });
        uid = userCred.uid;
      }

      // 2. Upload optional donation screenshot to Cloudinary if provided
      let uploadedScreenshotUrl = '';
      if (formData.optionalDonation && Number(formData.optionalDonation) > 0 && screenshotFile) {
        uploadedScreenshotUrl = await uploadImageToCloudinary(screenshotFile, 'trust_donations');
      }

      // 3. Submit Volunteer Application
      await submitVolunteerApplication({
        ...formData,
        donationScreenshotUrl: uploadedScreenshotUrl,
        voluntaryAmount: Number(formData.optionalDonation) || 0
      }, uid);

      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {}

      toast.success(
        lang === 'hi'
          ? 'स्वयंसेवक आवेदन सादर प्राप्त हुआ! आपका स्वयंसेवक डैशबोर्ड खोला जा रहा है।'
          : 'Volunteer application submitted! Opening your Volunteer Dashboard.'
      );

      onClose();
      navigate('/dashboard');
    } catch (err) {
      console.error('Volunteer submission failed:', err);
      setErrors({ form: err.message || (lang === 'hi' ? 'आवेदन दर्ज करने में त्रुटि' : 'Failed to submit') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-[#E9B44C]/40 my-auto sm:my-8 max-h-[94vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-primary text-white px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-secondary text-white font-bold flex items-center justify-center text-xs sm:text-sm shadow-sm flex-shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-black font-hindi-heading truncate">
                {lang === 'hi' ? 'सनातन स्वयंसेवक / कार्यकर्ता पंजीकरण' : 'Sanatan Volunteer Registration'}
              </h2>
              <p className="text-[10px] sm:text-xs text-white/80 truncate">
                {lang === 'hi' ? 'निःशुल्क पंजीकरण • धर्म, संस्कृति व समाज सेवा में अपना समय समर्पित करें' : 'Free Registration • Contribute time for Vedic culture & social service'}
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
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Account Credentials (if not logged in) */}
            {!currentUser && (
              <div className="p-3.5 rounded-2xl bg-[#FFF8EF] border border-[#E9B44C]/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-secondary uppercase tracking-wider">
                  <Lock className="w-4 h-4 text-primary" />
                  <span>{lang === 'hi' ? 'लॉगिन खाता विवरण (Login Credentials)' : 'Account Login Details'}</span>
                </div>
                <p className="text-[11px] text-[#523e2b]">
                  {lang === 'hi'
                    ? 'आवेदन जमा होते ही आपका स्वयंसेवक खाता स्वतः बन जाएगा। अगली बार इसी यूज़रनेम व पासवर्ड से लॉगिन करें।'
                    : 'Your account will be created automatically. Use this username and password to log in next time.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'यूज़रनेम *' : 'Username *'}
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="e.g. amit_sevak"
                      className={`w-full px-3 py-2 rounded-xl border text-xs ${errors.username ? 'border-red-500 bg-red-50/50' : 'border-gray-300 focus:border-primary'} focus:outline-none`}
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
                        className={`w-full pl-3 pr-8 py-2 rounded-xl border text-xs ${errors.password ? 'border-red-500 bg-red-50/50' : 'border-gray-300 focus:border-primary'} focus:outline-none`}
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
                      className={`w-full px-3 py-2 rounded-xl border text-xs ${errors.confirmPassword ? 'border-red-500 bg-red-50/50' : 'border-gray-300 focus:border-primary'} focus:outline-none`}
                    />
                    {errors.confirmPassword && <p className="text-[10px] text-red-500 mt-0.5">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Personal Details */}
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
                  placeholder={lang === 'hi' ? 'उदा. अमित त्रिपाठी' : 'e.g. Amit Tripathi'}
                  className={`w-full px-3 py-2 rounded-xl border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} text-xs focus:outline-none focus:border-primary`}
                />
                {errors.fullName && <p className="text-[10px] text-red-500 mt-0.5">{errors.fullName}</p>}
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
                  className={`w-full px-3 py-2 rounded-xl border ${errors.mobile ? 'border-red-500' : 'border-gray-300'} text-xs font-mono focus:outline-none focus:border-primary`}
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
                  className={`w-full px-3 py-2 rounded-xl border ${errors.whatsapp ? 'border-red-500 bg-red-50/30' : 'border-gray-300'} text-xs font-mono focus:outline-none focus:border-primary`}
                />
                {errors.whatsapp && <p className="text-[10px] text-red-500 mt-0.5">{errors.whatsapp}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#382719] mb-1">
                  {lang === 'hi' ? 'ईमेल (वैकल्पिक)' : 'Email (Optional)'}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="volunteer@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#382719] mb-1">
                  {lang === 'hi' ? 'सेवा का शहर / ज़िला *' : 'City / District of Service *'}
                </label>
                <input
                  type="text"
                  name="cityOrDistrict"
                  value={formData.cityOrDistrict}
                  onChange={handleInputChange}
                  placeholder="Gorakhpur"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#382719] mb-1">
                  {lang === 'hi' ? 'समय उपलब्धता (Availability) *' : 'Availability *'}
                </label>
                <select
                  name="availability"
                  value={formData.availability}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:border-primary"
                >
                  <option value="weekends">
                    {lang === 'hi' ? 'सप्ताहांत (शनिवार / रविवार)' : 'Weekends (Saturday / Sunday)'}
                  </option>
                  <option value="few_hours_daily">
                    {lang === 'hi' ? 'प्रतिदिन 1-2 घंटे' : '1-2 Hours Daily'}
                  </option>
                  <option value="full_time">
                    {lang === 'hi' ? 'पूर्णकालिक / आवश्यकतानुसार' : 'Full Time / As Needed'}
                  </option>
                </select>
              </div>
            </div>

            {/* Preferred Service Areas */}
            <div>
              <label className="block text-xs font-bold text-[#382719] mb-2">
                {lang === 'hi' ? 'सेवा के पसंदीदा क्षेत्र चुनें (Select Areas):' : 'Preferred Areas of Service:'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {VOLUNTEER_AREAS.map(area => {
                  const selected = formData.preferredAreas.includes(area.id);
                  return (
                    <div
                      key={area.id}
                      onClick={() => toggleArea(area.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center gap-2 transition-all ${
                        selected
                          ? 'border-primary bg-primary/10 font-bold text-primary'
                          : 'border-gray-200 bg-white text-[#454545] hover:border-[#E9B44C]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        readOnly
                        className="h-3.5 w-3.5 rounded text-primary focus:ring-primary pointer-events-none"
                      />
                      <span>{lang === 'hi' ? area.labelHi : area.labelEn}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#382719] mb-1">
                {lang === 'hi' ? 'पूर्व अनुभव / विशेष योग्यता (वैकल्पिक):' : 'Prior Experience or Skills (Optional):'}
              </label>
              <textarea
                name="experience"
                rows={2}
                value={formData.experience}
                onChange={handleInputChange}
                placeholder={lang === 'hi' ? 'उदा. सामाजिक संस्था में कार्य, वैदिक कर्मकांड ज्ञान, प्राथमिक चिकित्सा आदि' : 'e.g. Social work, cultural events, medical aid...'}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-primary"
              />
            </div>

            {/* Optional Additional Donation (NO 200 fee required for volunteers) */}
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <Heart className="w-4 h-4 text-primary" />
                <span>{lang === 'hi' ? 'ऐच्छिक सहयोग राशि (Optional Donation - Any Amount)' : 'Optional Contribution (No Mandatory Fee)'}</span>
              </div>
              <p className="text-[11px] text-amber-800">
                {lang === 'hi'
                  ? 'स्वयंसेवक के लिए ₹200 शुल्क अनिवार्य नहीं है। यदि आप सेवा कार्यों हेतु स्वेच्छा से दान करना चाहें तो नीचे विवरण दर्ज कर सकते हैं।'
                  : 'Volunteers do not need to pay the ₹200 fee. You can optionally make any voluntary donation below.'}
              </p>

              <div>
                <label className="block text-[11px] font-bold text-[#382719] mb-1">
                  {lang === 'hi' ? 'सहयोग राशि (₹) - यदि देना चाहें' : 'Contribution Amount (₹) - Optional'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  name="optionalDonation"
                  value={formData.optionalDonation}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="w-full max-w-xs px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-xs font-mono font-bold"
                />
              </div>

              {formData.optionalDonation && Number(formData.optionalDonation) > 0 && (
                <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs space-y-2 mt-2">
                  <div className="text-[11px] font-bold text-gray-700">
                    UPI ID: <span className="font-mono text-primary font-bold">{DEFAULT_PAYMENT_SETTINGS.upiId}</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">
                      {lang === 'hi' ? 'भुगतान UTR / संदर्भ संख्या (वैकल्पिक)' : 'Payment UTR / Ref (Optional)'}
                    </label>
                    <input
                      type="text"
                      name="donationUtr"
                      value={formData.donationUtr}
                      onChange={handleInputChange}
                      placeholder="12-digit UTR"
                      className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">
                      {lang === 'hi' ? 'या भुगतान स्क्रीनशॉट अपलोड करें' : 'Or Upload Screenshot'}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotChange}
                      className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:bg-primary file:text-white"
                    />
                    {screenshotPreview && (
                      <img src={screenshotPreview} alt="Preview" className="w-16 h-16 object-cover rounded mt-1.5 border" />
                    )}
                  </div>
                </div>
              )}
            </div>

            {errors.form && <p className="text-xs text-red-600 font-bold">{errors.form}</p>}

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-[#454545]"
              >
                {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs sm:text-sm shadow-saffron transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>
                  {isSubmitting
                    ? (lang === 'hi' ? 'पंजीकरण हो रहा है...' : 'Registering...')
                    : (lang === 'hi' ? 'स्वयंसेवक पंजीकरण पूर्ण करें' : 'Complete Volunteer Registration')}
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

export default VolunteerModal;
