import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import TrustLogo from '../components/TrustLogo';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck,
  Globe
} from 'lucide-react';

export const LoginPage = () => {
  const { lang, toggleLanguage } = useLanguage();
  const { loginWithUsername, currentUser, userProfile, logout } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');

  // Destination to return after successful login
  const returnUrl = location.state?.from?.pathname || new URLSearchParams(location.search).get('redirect') || '/dashboard';
  const noticeMessage = location.state?.message;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    if (generalError) setGeneralError('');
  };

  const validate = () => {
    const errs = {};
    const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/;

    if (!formData.username.trim()) {
      errs.username = lang === 'hi' ? 'यूज़रनेम दर्ज करना अनिवार्य है' : 'Username is required';
    } else if (!usernameRegex.test(formData.username.trim())) {
      errs.username = lang === 'hi' 
        ? 'यूज़रनेम 4-20 अक्षरों का होना चाहिए (केवल अक्षर, अंक एवं _ मान्य)' 
        : 'Username must be 4-20 characters (letters, numbers, underscore only)';
    }

    if (!formData.password) {
      errs.password = lang === 'hi' ? 'पासवर्ड दर्ज करना अनिवार्य है' : 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = lang === 'hi' 
        ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए' 
        : 'Password must be at least 6 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setGeneralError('');

    try {
      await loginWithUsername(formData.username, formData.password);
      toast.success(lang === 'hi' ? 'सफलतापूर्वक लॉगिन हो गए!' : 'Logged in successfully!');
      navigate(returnUrl, { replace: true });
    } catch (err) {
      console.error("Auth error:", err);
      let userFriendlyMsg = lang === 'hi' 
        ? 'लॉगिन में त्रुटि हुई। कृपया पुनः प्रयास करें।' 
        : 'Authentication failed. Please check your credentials.';

      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        userFriendlyMsg = lang === 'hi' 
          ? 'यूज़रनेम अथवा पासवर्ड गलत है। कृपया पुनः जांचें।' 
          : 'Incorrect username or password. Please try again.';
      } else if (err.code === 'auth/network-request-failed') {
        userFriendlyMsg = lang === 'hi' 
          ? 'इंटरनेट कनेक्शन में समस्या है। कृपया नेटवर्क जांचें।' 
          : 'Network error. Please check your internet connection.';
      } else if (err.code === 'auth/too-many-requests') {
        userFriendlyMsg = lang === 'hi' 
          ? 'अत्यधिक असफल प्रयास। कृपया कुछ मिनट बाद पुनः प्रयास करें।' 
          : 'Too many failed attempts. Please try again later.';
      } else if (err.message) {
        userFriendlyMsg = err.message;
      }

      setGeneralError(userFriendlyMsg);
      toast.error(userFriendlyMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] pt-20 pb-12 px-4 sm:px-6 bg-[#FFF8EF] bg-mandala-subtle flex flex-col justify-center items-center">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#E9B44C]/40 overflow-hidden relative">
        
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-3 right-3">
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold flex items-center gap-1 transition-all"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5 text-[#E9B44C]" />
              <span>{lang === 'hi' ? 'English' : 'हिंदी'}</span>
            </button>
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <TrustLogo className="w-16 h-16 drop-shadow-md" showText={false} lang={lang} />
            <h1 className="text-xl sm:text-2xl font-black font-hindi-heading mt-2">
              {lang === 'hi' ? 'सदस्य / स्वयंसेवक लॉगिन' : 'Member & Volunteer Login'}
            </h1>
            <p className="text-xs text-white/90 mt-1 max-w-xs">
              {lang === 'hi' 
                ? 'राष्ट्रीय सनातन संस्कार सेवा संस्थान अधिकृत पोर्टल' 
                : 'Sanatan Sanskar Seva Sansthan Portal'}
            </p>
          </div>
        </div>

        {/* Notice Message if redirected from a protected action */}
        {noticeMessage && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center gap-2.5 text-xs text-amber-900 font-semibold text-left">
            <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>{noticeMessage}</span>
          </div>
        )}

        {/* Banner if already logged in */}
        {currentUser && (
          <div className="bg-amber-50/90 border-b border-amber-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-amber-900">
            <div className="flex items-center gap-2 text-center sm:text-left">
              <span className="font-semibold text-amber-800">
                {lang === 'hi' ? 'वर्तमान लॉगिन:' : 'Signed in:'}
              </span>
              <span className="font-bold text-primary">
                {userProfile?.fullName || currentUser.displayName || currentUser.email} (@{userProfile?.username || 'user'})
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  toast.info(lang === 'hi' ? 'लॉग आउट सफल। अब अपने खाते से लॉगिन करें।' : 'Logged out. Please sign in with your account.');
                }}
                className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
              >
                {lang === 'hi' ? 'खाता बदलें' : 'Switch'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-[11px] transition-colors cursor-pointer"
              >
                {lang === 'hi' ? 'डैशबोर्ड →' : 'Dashboard →'}
              </button>
            </div>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
          
          {generalError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-[#382719] mb-1">
              {lang === 'hi' ? 'यूज़रनेम (Username) *' : 'Username *'}
            </label>
            <div className="relative">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                autoCapitalize="none"
                autoCorrect="off"
                placeholder={lang === 'hi' ? 'उदा. rohit_sharma' : 'e.g. rohit_sharma'}
                className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.username ? 'border-rose-400 bg-rose-50/50' : 'border-gray-300 focus:border-primary'
                }`}
              />
              <span className="text-gray-400 font-bold text-xs absolute left-3 top-3">@</span>
            </div>
            {errors.username ? (
              <p className="text-[11px] text-rose-600 mt-1">{errors.username}</p>
            ) : (
              <p className="text-[10px] text-gray-500 mt-1">
                {lang === 'hi' ? 'पंजीकरण के समय बनाया गया यूज़रनेम' : 'Your registered account username'}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-[#382719] mb-1">
              {lang === 'hi' ? 'पासवर्ड (Password) *' : 'Password *'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.password ? 'border-rose-400 bg-rose-50/50' : 'border-gray-300 focus:border-primary'
                }`}
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 p-0.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-[11px] text-rose-600 mt-1">{errors.password}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white font-black text-sm shadow-saffron transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{lang === 'hi' ? 'कृपया प्रतीक्षा करें...' : 'Please wait...'}</span>
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                <span>{lang === 'hi' ? 'लॉगिन करें' : 'Sign In'}</span>
              </>
            )}
          </button>
        </form>

        {/* Footer: Guide new users to join trust */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-xs text-center text-gray-600">
          <p>
            {lang === 'hi' ? 'ट्रस्ट से नए सदस्य या स्वयंसेवक के रूप में जुड़ना चाहते हैं?' : 'Want to join as a new member or volunteer?'}{' '}
            <Link
              to="/"
              className="font-bold text-primary hover:underline ml-1"
            >
              {lang === 'hi' ? 'यहाँ आवेदन करें' : 'Apply here'}
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
