import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, TRUST_ADMIN_PIN } from '../context/AuthContext';
import TrustLogo from './TrustLogo';
import { KeyRound, Eye, EyeOff, ArrowRight, Home, ShieldCheck } from 'lucide-react';

export const AdminRoute = ({ children }) => {
  const { currentUser, userProfile, isAdmin, adminPinVerified, verifyPinForSession, loading } = useAuth();

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8EF] flex flex-col items-center justify-center p-4">
        <TrustLogo className="w-16 h-16 animate-pulse" showText={false} />
      </div>
    );
  }

  // If already authenticated as admin via Firestore role or session passkey PIN
  if (isAdmin || userProfile?.role === 'admin' || adminPinVerified) {
    return children;
  }

  // Passkey verification gate
  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setPinError('कृपया व्यवस्थापक पासकी (Admin Passkey) दर्ज करें।');
      return;
    }

    setIsVerifying(true);
    const success = await verifyPinForSession(pinInput.trim());
    setIsVerifying(false);

    if (success) {
      setPinError('');
    } else {
      setPinError('अमान्य सुरक्षा पासकी (Invalid Admin Passkey).');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8EF] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E9B44C]/40 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#382719] via-[#4d3623] to-[#382719] p-6 text-white text-center border-b border-[#E9B44C]/30">
          <TrustLogo className="w-16 h-16 mx-auto mb-3" showText={false} lang="hi" />
          <h2 className="text-lg sm:text-xl font-black font-hindi-heading text-white">
            व्यवस्थापक प्रमाणीकरण (Admin Portal)
          </h2>
          <p className="text-xs text-[#E9B44C] mt-1 font-medium">
            राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट), गोरखपुर
          </p>
        </div>

        {/* Verification Form */}
        <div className="p-6 sm:p-8 space-y-5">
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <KeyRound className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">व्यवस्थापक सुरक्षा पासकी (Admin Passkey): </span>
              एडमिन पैनल खोलने हेतु संस्था अधिकृत पासकी दर्ज करें।
            </div>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#382719] mb-1.5">
                एडमिन पासकी / सिक्योरिटी पिन (Admin Passkey / PIN)
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (pinError) setPinError('');
                  }}
                  placeholder="सुरक्षा पासकी दर्ज करें"
                  autoFocus
                  className="w-full pl-4 pr-11 py-3 rounded-xl border border-[#E9B44C]/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono tracking-widest bg-[#FFF8EF]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pinError && (
                <p className="mt-1.5 text-xs text-rose-600 font-bold">{pinError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white font-bold text-sm shadow-saffron transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isVerifying ? 'प्रमाणीकरण हो रहा है...' : 'व्यवस्थापक पोर्टल खोलें (Open Admin Portal)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick passkey hint or info */}
          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-center text-[11px] text-[#666666]">
            पासकी: <span className="font-mono font-bold text-[#382719]">273016</span>
          </div>

          <div className="pt-3 border-t border-[#E9B44C]/20 flex items-center justify-between text-xs">
            <Link
              to="/"
              className="text-[#666666] hover:text-primary font-bold flex items-center gap-1"
            >
              <Home className="w-3.5 h-3.5" />
              <span>मुख्य पृष्ठ (Home)</span>
            </Link>

            <Link
              to="/login"
              className="text-primary hover:underline font-bold"
            >
              यूज़र लॉगिन (User Login) →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminRoute;
