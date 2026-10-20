import React, { useState, useEffect } from 'react';
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
  Phone, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ShieldCheck 
} from 'lucide-react';

export const LoginPage = () => {
  const { lang, t } = useLanguage();
  const { loginWithUsername, registerWithUsername, currentUser, userProfile, logout, isAdmin } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Mode: 'login' or 'signup'
  const [isSignUp, setIsSignUp] = useState(() => {
    return location.pathname === '/signup' || location.search.includes('mode=signup');
  });

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    } else if (formData.password.length < 8) {
      errs.password = lang === 'hi' 
        ? 'पासवर्ड कम से कम 8 अक्षरों का होना चाहिए' 
        : 'Password must be at least 8 characters';
    }

    if (isSignUp) {
      if (!formData.fullName.trim()) {
        errs.fullName = lang === 'hi' ? 'पूरा नाम दर्ज करें' : 'Full name is required';
      }

      const cleanPhone = formData.phone.replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length !== 10) {
        errs.phone = lang === 'hi' ? 'मान्य 10-अंकीय मोबाइल नंबर दर्ज करें' : 'Enter a valid 10-digit phone number';
      }

      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        errs.email = lang === 'hi' ? 'अमान्य ईमेल प्रारूप' : 'Invalid email format';
      }

      if (formData.password !== formData.confirmPassword) {
        errs.confirmPassword = lang === 'hi' ? 'पासवर्ड मेल नहीं खाता' : 'Passwords do not match';
      }
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
      if (isSignUp) {
        await registerWithUsername({
          fullName: formData.fullName,
          username: formData.username,
          phone: formData.phone,
          password: formData.password,
          email: formData.email
        });

        toast.success(lang === 'hi' ? 'पंजीकरण सफल! आपका स्वागत है।' : 'Account created successfully! Welcome.');
        navigate(returnUrl, { replace: true });
      } else {
        await loginWithUsername(formData.username, formData.password);
        toast.success(lang === 'hi' ? 'सफलतापूर्वक लॉगिन हो गए!' : 'Logged in successfully!');
        navigate(returnUrl, { replace: true });
      }
    } catch (err) {
      console.error("Auth error:", err);
      let userFriendlyMsg = lang === 'hi' 
        ? 'लॉगिन में त्रुटि हुई। कृपया पुनः प्रयास करें।' 
        : 'Authentication failed. Please check your credentials.';

      if (err.code === 'auth/username-already-in-use') {
        userFriendlyMsg = err.message;
        setErrors(prev => ({ ...prev, username: err.message }));
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        userFriendlyMsg = lang === 'hi' 
          ? 'यूज़रनेम अथवा पासवर्ड गलत है। कृपया पुनः जांचें।' 
          : 'Incorrect username or password. Please try again.';
      } else if (err.code === 'auth/email-already-in-use') {
        userFriendlyMsg = lang === 'hi' 
          ? 'यह यूज़रनेम पहले से किसी अन्य सदस्य द्वारा उपयोग में है।' 
          : 'This username is already taken. Please choose another.';
        setErrors(prev => ({ ...prev, username: userFriendlyMsg }));
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
          <div className="relative z-10 flex flex-col items-center">
            <TrustLogo className="w-16 h-16 drop-shadow-md" showText={false} lang={lang} />
            <h1 className="text-xl sm:text-2xl font-black font-hindi-heading mt-2">
              {isSignUp 
                ? (lang === 'hi' ? 'नया खाता बनाएं (Sign Up)' : 'Create Member Account')
                : (lang === 'hi' ? 'सदस्य लॉगिन (Member Login)' : 'Member Sign In')}
            </h1>
            <p className="text-xs text-white/90 mt-1 max-w-xs">
              {lang === 'hi' 
                ? 'राष्ट्रीय सनातन संस्कार सेवा संस्थान पोर्टल' 
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
                  toast.info(lang === 'hi' ? 'लॉग आउट सफल। अब अपने सदस्य खाते से लॉगिन करें।' : 'Logged out. Please sign in with your member account.');
                }}
                className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
              >
                {lang === 'hi' ? 'लॉग आउट / खाता बदलें' : 'Logout / Switch'}
              </button>
              <button
                type="button"
                onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
                className="px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-[11px] transition-colors cursor-pointer"
              >
                {lang === 'hi' ? 'डैशबोर्ड →' : 'Dashboard →'}
              </button>
            </div>
          </div>
        )}

        {/* Tab Toggle: Login vs Sign Up */}
        <div className="grid grid-cols-2 p-1.5 bg-[#FFF8EF] border-b border-[#E9B44C]/30 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setErrors({});
              setGeneralError('');
            }}
            className={`py-2.5 rounded-2xl transition-all ${
              !isSignUp
                ? 'bg-white text-primary shadow-xs font-black'
                : 'text-[#666666] hover:text-[#382719]'
            }`}
          >
            {lang === 'hi' ? 'लॉगिन (Sign In)' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setErrors({});
              setGeneralError('');
            }}
            className={`py-2.5 rounded-2xl transition-all ${
              isSignUp
                ? 'bg-white text-primary shadow-xs font-black'
                : 'text-[#666666] hover:text-[#382719]'
            }`}
          >
            {lang === 'hi' ? 'नया पंजीकरण (Sign Up)' : 'Sign Up'}
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
          
          {generalError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Full Name (Sign Up only) */}
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-[#382719] mb-1">
                {lang === 'hi' ? 'पूरा नाम (Full Name) *' : 'Full Name *'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder={lang === 'hi' ? 'उदा. अमित कुमार शर्मा' : 'e.g. John Doe'}
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    errors.fullName ? 'border-rose-400 bg-rose-50/50' : 'border-gray-300 focus:border-primary'
                  }`}
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
              {errors.fullName && <p className="text-[11px] text-rose-600 mt-1">{errors.fullName}</p>}
            </div>
          )}

          {/* Username (Login & Sign Up) */}
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
                placeholder={lang === 'hi' ? 'अक्षरों, अंकों व _ सहित' : 'e.g. rahul_99'}
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
                {lang === 'hi' ? '4-20 अक्षर (letters, numbers, _)' : '4-20 alphanumeric characters or underscore'}
              </p>
            )}
          </div>

          {/* Phone (Sign Up only) */}
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-[#382719] mb-1">
                {lang === 'hi' ? 'मोबाइल नंबर (Phone) *' : 'Phone Number *'}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder={lang === 'hi' ? '10 अंकों का मोबाइल' : '10-digit mobile number'}
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    errors.phone ? 'border-rose-400 bg-rose-50/50' : 'border-gray-300 focus:border-primary'
                  }`}
                />
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
              {errors.phone && <p className="text-[11px] text-rose-600 mt-1">{errors.phone}</p>}
            </div>
          )}

          {/* Optional Real Email (Sign Up only) */}
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-[#382719] mb-1">
                {lang === 'hi' ? 'ईमेल (वैकल्पिक / Optional)' : 'Real Email (Optional)'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={lang === 'hi' ? 'name@example.com' : 'name@example.com'}
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    errors.email ? 'border-rose-400 bg-rose-50/50' : 'border-gray-300 focus:border-primary'
                  }`}
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
              {errors.email && <p className="text-[11px] text-rose-600 mt-1">{errors.email}</p>}
            </div>
          )}

          {/* Password (Login & Sign Up) */}
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
            {errors.password ? (
              <p className="text-[11px] text-rose-600 mt-1">{errors.password}</p>
            ) : (
              <p className="text-[10px] text-gray-500 mt-1">
                {lang === 'hi' ? 'न्यूनतम 8 अक्षर' : 'Minimum 8 characters'}
              </p>
            )}
          </div>

          {/* Confirm Password (Sign Up only) */}
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-[#382719] mb-1">
                {lang === 'hi' ? 'पासवर्ड की पुष्टि करें *' : 'Confirm Password *'}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    errors.confirmPassword ? 'border-rose-400 bg-rose-50/50' : 'border-gray-300 focus:border-primary'
                  }`}
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 p-0.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-[11px] text-rose-600 mt-1">{errors.confirmPassword}</p>}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white font-black text-sm shadow-saffron transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{lang === 'hi' ? 'कृपया प्रतीक्षा करें...' : 'Please wait...'}</span>
              </>
            ) : isSignUp ? (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{lang === 'hi' ? 'खाता बनाएं एवं आगे बढ़ें' : 'Create Account & Continue'}</span>
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                <span>{lang === 'hi' ? 'लॉगिन करें' : 'Sign In'}</span>
              </>
            )}
          </button>
        </form>

        {/* Footer switch prompt */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-xs text-center text-gray-600">
          {isSignUp ? (
            <p>
              {lang === 'hi' ? 'पहले से खाता है?' : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setErrors({});
                  setGeneralError('');
                }}
                className="font-bold text-primary hover:underline"
              >
                {lang === 'hi' ? 'लॉगिन करें' : 'Sign In here'}
              </button>
            </p>
          ) : (
            <p>
              {lang === 'hi' ? 'नया खाता बनाना चाहते हैं?' : "Don't have an account yet?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setErrors({});
                  setGeneralError('');
                }}
                className="font-bold text-primary hover:underline"
              >
                {lang === 'hi' ? 'यहाँ नया पंजीकरण करें' : 'Sign Up here'}
              </button>
            </p>
          )}
        </div>


      </div>
    </div>
  );
};

export default LoginPage;
