import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { submitVolunteerApplication } from '../firebase/services';
import { X, Users, CheckCircle2, ShieldCheck, HeartHandshake, Globe } from 'lucide-react';
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
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    fullName: userProfile?.fullName || userProfile?.displayName || '',
    mobile: userProfile?.phone || userProfile?.mobile || '',
    email: userProfile?.email || '',
    cityOrDistrict: 'गोरखपुर (Gorakhpur)',
    availability: 'weekends', // 'weekends' | 'full_time' | 'few_hours_daily'
    experience: '',
    preferredAreas: ['sanskar_camps']
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Protected action: require login
  useEffect(() => {
    if (isOpen && !currentUser) {
      onClose();
      navigate('/login', {
        state: { from: location, message: 'Please sign in to continue' }
      });
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || userProfile.fullName || userProfile.displayName || '',
        mobile: prev.mobile || userProfile.phone || userProfile.mobile || '',
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
    if (!formData.cityOrDistrict.trim()) errs.cityOrDistrict = lang === 'hi' ? 'स्थान / ज़िला दर्ज करें' : 'Enter city/district';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await submitVolunteerApplication(formData, currentUser?.uid || null);
      setSubmitted(true);
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {}
    } catch (err) {
      console.error("Volunteer submission failed:", err);
      setErrors({ form: err.message || (lang === 'hi' ? 'आवेदन दर्ज करने में त्रुटि' : 'Failed to submit') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSubmitted(false);
    onClose();
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
                {lang === 'hi' ? 'सनातन स्वयंसेवक / कार्यकर्ता आवेदन' : 'Sanatan Volunteer Application'}
              </h2>
              <p className="text-[10px] sm:text-xs text-white/80 truncate">
                {lang === 'hi' ? 'धर्म, संस्कृति व समाज सेवा में अपना समय समर्पित करें' : 'Contribute your time for Vedic culture & social welfare'}
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
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-trust-green/10 text-trust-green mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-[#382719] font-hindi-heading">
                {lang === 'hi' ? 'स्वयंसेवक आवेदन सादर प्राप्त हुआ!' : 'Volunteer Application Received!'}
              </h3>
              <p className="text-xs sm:text-sm text-[#454545] max-w-md mx-auto leading-relaxed">
                {lang === 'hi'
                  ? 'सनातन संस्कृति के जागरण एवं लोककल्याण हेतु आपके सेवा संकल्प का हम हार्दिक अभिनंदन करते हैं। ट्रस्ट की जिला प्रबंधकारिणी शीघ्र ही आपसे संपर्क करेगी।'
                  : 'Thank you for stepping forward to serve. The Trust local team will contact you shortly regarding upcoming camps and activities.'}
              </p>
              <button
                type="button"
                onClick={resetAndClose}
                className="mt-4 px-6 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs sm:text-sm shadow-saffron transition-all"
              >
                {lang === 'hi' ? 'सम्पन्न' : 'Done'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className={`w-full px-3 py-2 rounded-xl border ${errors.fullName ? 'border-red-500' : 'border-[#E9B44C]/50'} text-xs focus:outline-none focus:border-primary`}
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
                    className={`w-full px-3 py-2 rounded-xl border ${errors.mobile ? 'border-red-500' : 'border-[#E9B44C]/50'} text-xs font-mono focus:outline-none focus:border-primary`}
                  />
                  {errors.mobile && <p className="text-[10px] text-red-500 mt-0.5">{errors.mobile}</p>}
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
                    placeholder={lang === 'hi' ? 'गोरखपुर' : 'Gorakhpur'}
                    className="w-full px-3 py-2 rounded-xl border border-[#E9B44C]/50 text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'समय उपलब्धता (Availability) *' : 'Availability *'}
                  </label>
                  <select
                    name="availability"
                    value={formData.availability}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-[#E9B44C]/50 text-xs bg-white focus:outline-none focus:border-primary"
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
                            : 'border-[#E9B44C]/30 bg-white text-[#454545] hover:border-[#E9B44C]'
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
                  {lang === 'hi' ? 'पूर्व अनुभव / विशेष योग्यता (यदि कोई हो):' : 'Prior Experience or Skills (Optional):'}
                </label>
                <textarea
                  name="experience"
                  rows={2}
                  value={formData.experience}
                  onChange={handleInputChange}
                  placeholder={lang === 'hi' ? 'उदा. सामाजिक संस्था में कार्य, वैदिक कर्मकांड ज्ञान, प्राथमिक चिकित्सा आदि' : 'e.g. Social work, cultural events, medical aid...'}
                  className="w-full px-3 py-2 rounded-xl border border-[#E9B44C]/50 text-xs focus:outline-none focus:border-primary"
                />
              </div>

              {errors.form && <p className="text-xs text-red-600 font-bold">{errors.form}</p>}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-[#454545]"
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs sm:text-sm shadow-saffron transition-all disabled:opacity-50"
                >
                  {isSubmitting
                    ? (lang === 'hi' ? 'जमा हो रहा है...' : 'Submitting...')
                    : (lang === 'hi' ? 'स्वयंसेवक आवेदन जमा करें' : 'Submit Volunteer Application')}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default VolunteerModal;
