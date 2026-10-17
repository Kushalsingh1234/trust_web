import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Lock,
  User,
  KeyRound,
  Shield,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Phone,
  Globe
} from 'lucide-react';

export const LoginModal = ({ isOpen, onClose, initialMode = 'login', onOpenJoin }) => {
  const { lang, toggleLanguage } = useLanguage();
  const {
    loginWithUsername,
    registerWithUsername,
    loginAdmin,
    resetPassword
  } = useAuth();

  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'admin' | 'forgot'
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    mobile: '',
    adminPin: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    if (errors.form) setErrors(prev => ({ ...prev, form: null }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.username.trim()) {
      errs.username = lang === 'hi' ? 'यूज़रनेम अथवा ईमेल दर्ज करें' : 'Enter username or email';
    }
    if (mode !== 'forgot') {
      if (!formData.password || formData.password.length < 6) {
        errs.password = lang === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए' : 'Password must be at least 6 characters';
      }
    }
    if (mode === 'register') {
      if (!formData.fullName.trim()) errs.fullName = lang === 'hi' ? 'पूरा नाम दर्ज करें' : 'Enter full name';
      if (!formData.mobile.trim() || !/^[6-9]\d{9}$/.test(formData.mobile.replace(/\D/g, ''))) {
        errs.mobile = lang === 'hi' ? 'मान्य 10-अंकीय मोबाइल नंबर दर्ज करें' : 'Enter valid 10-digit mobile';
      }
    }
    if (mode === 'admin') {
      if (!formData.adminPin.trim() || formData.adminPin.trim().length !== 6) {
        errs.adminPin = lang === 'hi' ? '6-अंकीय एडमिन सुरक्षा पिन दर्ज करें' : 'Enter 6-digit Admin PIN';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});
    setSuccessMsg('');

    try {
      if (mode === 'login') {
        await loginWithUsername(formData.username, formData.password);
        onClose();
      } else if (mode === 'register') {
        await registerWithUsername(formData.username, formData.password, {
          fullName: formData.fullName,
          mobile: formData.mobile
        });
        setSuccessMsg(lang === 'hi' ? 'पंजीकरण सफल! आपका खाता सक्रिय है।' : 'Registration successful!');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else if (mode === 'admin') {
        await loginAdmin(formData.username, formData.password, formData.adminPin);
        onClose();
        window.location.href = '/admin';
      } else if (mode === 'forgot') {
        await resetPassword(formData.username);
        setSuccessMsg(lang === 'hi' ? 'पासवर्ड रीसेट लिंक प्रेषित कर दिया गया है।' : 'Password reset link sent.');
      }
    } catch (err) {
      console.error("Auth error:", err);
      let msg = err.message;
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = lang === 'hi' ? 'गलत यूज़रनेम अथवा पासवर्ड।' : 'Invalid username or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = lang === 'hi' ? 'यह यूज़रनेम पहले से पंजीकृत है।' : 'Username already registered.';
      }
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="relative bg-white w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-[#E9B44C]/40 my-auto sm:my-8 max-h-[94vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-primary text-white px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-secondary text-white font-bold flex items-center justify-center text-xs sm:text-sm shadow-sm flex-shrink-0">
              {mode === 'admin' ? <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <Lock className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-black font-hindi-heading truncate">
                {mode === 'admin'
                  ? (lang === 'hi' ? 'व्यवस्थापक पोर्टल (Admin Portal)' : 'Trust Admin Login')
                  : mode === 'register'
                  ? (lang === 'hi' ? 'नया सदस्य पंजीकरण' : 'Member Registration')
                  : mode === 'forgot'
                  ? (lang === 'hi' ? 'पासवर्ड पुनर्प्राप्ति' : 'Password Recovery')
                  : (lang === 'hi' ? 'सदस्य लॉगिन (Member Login)' : 'Member Login')}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-white/80 truncate">
                {mode === 'admin'
                  ? (lang === 'hi' ? 'अधिकृत ट्रस्ट प्रबंधकारिणी हेतु' : 'For Trust Executive Council')
                  : (lang === 'hi' ? 'सुरक्षित प्रवेश' : 'Secure Authentication')}
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

        {/* Tab Switcher */}
        <div className="flex border-b border-[#E9B44C]/30 bg-[#FFF8EF]">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrors({}); }}
            className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${
              mode === 'login'
                ? 'border-primary text-primary bg-white'
                : 'border-transparent text-[#454545] hover:text-primary'
            }`}
          >
            {lang === 'hi' ? 'सदस्य लॉगिन' : 'Member Login'}
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrors({}); }}
            className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${
              mode === 'register'
                ? 'border-primary text-primary bg-white'
                : 'border-transparent text-[#454545] hover:text-primary'
            }`}
          >
            {lang === 'hi' ? 'नया खाता बनाएं' : 'Sign Up'}
          </button>
          <button
            type="button"
            onClick={() => { setMode('admin'); setErrors({}); }}
            className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${
              mode === 'admin'
                ? 'border-secondary text-secondary bg-white'
                : 'border-transparent text-[#454545] hover:text-secondary'
            }`}
          >
            {lang === 'hi' ? 'व्यवस्थापक' : 'Admin'}
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-left">
          {successMsg ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-trust-green mx-auto" />
              <p className="text-sm font-bold text-[#382719]">{successMsg}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Registration Extra Fields */}
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'आवेदक का पूरा नाम *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder={lang === 'hi' ? 'उदा. राजेश कुमार' : 'e.g. Rajesh Kumar'}
                      className={`w-full px-3.5 py-2 rounded-xl border ${errors.fullName ? 'border-red-500' : 'border-[#E9B44C]/50'} text-xs focus:outline-none focus:border-primary`}
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
                      className={`w-full px-3.5 py-2 rounded-xl border ${errors.mobile ? 'border-red-500' : 'border-[#E9B44C]/50'} text-xs font-mono focus:outline-none focus:border-primary`}
                    />
                    {errors.mobile && <p className="text-[10px] text-red-500 mt-0.5">{errors.mobile}</p>}
                  </div>
                </>
              )}

              {/* Username field */}
              <div>
                <label className="block text-xs font-bold text-[#382719] mb-1">
                  {lang === 'hi' ? 'यूज़रनेम / यूज़र आईडी *' : 'Username / ID *'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder={mode === 'admin' ? 'admin' : (lang === 'hi' ? 'उदा. kushal123' : 'e.g. kushal123')}
                    className={`w-full pl-9 pr-3.5 py-2 rounded-xl border ${errors.username ? 'border-red-500' : 'border-[#E9B44C]/50'} text-xs focus:outline-none focus:border-primary font-mono`}
                  />
                </div>
                {errors.username && <p className="text-[10px] text-red-500 mt-0.5">{errors.username}</p>}
              </div>

              {/* Password field */}
              {mode !== 'forgot' && (
                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'पासवर्ड *' : 'Password *'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className={`w-full pl-9 pr-3.5 py-2 rounded-xl border ${errors.password ? 'border-red-500' : 'border-[#E9B44C]/50'} text-xs focus:outline-none focus:border-primary`}
                    />
                  </div>
                  {errors.password && <p className="text-[10px] text-red-500 mt-0.5">{errors.password}</p>}
                </div>
              )}

              {/* Admin PIN field */}
              {mode === 'admin' && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5">
                  <label className="block text-xs font-bold text-[#382719] flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-secondary" />
                    <span>{lang === 'hi' ? 'व्यवस्थापक सुरक्षा पिन (Admin PIN) *' : '6-digit Admin Security PIN *'}</span>
                  </label>
                  <input
                    type="password"
                    name="adminPin"
                    maxLength={6}
                    value={formData.adminPin}
                    onChange={handleInputChange}
                    placeholder="••••••"
                    className={`w-full px-3 py-2 rounded-xl border ${errors.adminPin ? 'border-red-500' : 'border-amber-300'} bg-white text-xs font-mono tracking-widest text-center focus:outline-none focus:border-primary`}
                  />
                  <p className="text-[10px] text-[#666666]">
                    {lang === 'hi' ? 'ट्रस्ट सुरक्षा प्रोटोकॉल: एडमिन हेतु पिन अनिवार्य है।' : 'Security standard: PIN is strictly required for Admin access.'}
                  </p>
                  {errors.adminPin && <p className="text-[10px] text-red-500 mt-0.5">{errors.adminPin}</p>}
                </div>
              )}

              {errors.form && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-bold flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errors.form}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs sm:text-sm shadow-saffron transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>
                  {isSubmitting
                    ? (lang === 'hi' ? 'सत्यापन हो रहा है...' : 'Authenticating...')
                    : mode === 'admin'
                    ? (lang === 'hi' ? 'व्यवस्थापक पोर्टल प्रवेश' : 'Enter Admin Panel')
                    : mode === 'register'
                    ? (lang === 'hi' ? 'खाता बनाएं' : 'Create Account')
                    : (lang === 'hi' ? 'लॉगिन करें' : 'Login')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Bottom helpers */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-[#666666]">
                {mode === 'login' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="hover:text-primary underline"
                    >
                      {lang === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}
                    </button>
                    {onOpenJoin && (
                      <button
                        type="button"
                        onClick={() => { onClose(); onOpenJoin(); }}
                        className="text-primary font-bold hover:underline"
                      >
                        {lang === 'hi' ? 'सदस्यता आवेदन करें →' : 'Apply for Membership →'}
                      </button>
                    )}
                  </>
                ) : mode === 'forgot' ? (
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-primary font-bold hover:underline"
                  >
                    {lang === 'hi' ? '← लॉगिन पर वापस जाएं' : '← Back to Login'}
                  </button>
                ) : null}
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default LoginModal;
