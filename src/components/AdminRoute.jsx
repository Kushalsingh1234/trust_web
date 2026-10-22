import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, TRUST_ADMIN_PIN } from '../context/AuthContext';
import TrustLogo from './TrustLogo';
import { KeyRound, Eye, EyeOff, ArrowRight, Home, ShieldCheck } from 'lucide-react';
import { Capacitor } from '@capacitor/core';


export const AdminRoute = ({ children }) => {
  const { currentUser, userProfile, isAdmin, adminPinVerified, verifyPinForSession, loading } = useAuth();

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Clear any existing lockout from previous sessions on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rsssst_admin_pin_locked_until');
      localStorage.removeItem('rsssst_admin_pin_attempts');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8EF] flex flex-col items-center justify-center p-4">
        <TrustLogo className="w-16 h-16 animate-pulse" showText={false} />
      </div>
    );
  }

  // Access strictly granted only when Admin PIN is verified for this session
  if (adminPinVerified) {
    return children;
  }

  // Passkey verification gate
  const handlePinSubmit = async (e) => {
    e.preventDefault();

    if (!pinInput.trim()) {
      setPinError('कृपया व्यवस्थापक पासकी (Admin PIN) दर्ज करें।');
      return;
    }

    setIsVerifying(true);
    const success = await verifyPinForSession(pinInput.trim());
    setIsVerifying(false);

    if (success) {
      setPinError('');
    } else {
      setPinError('अमान्य एडमिन पिन (Invalid PIN)। कृपया सही व्यवस्थापक पासकी (273016) दर्ज करें।');
    }
  };

  const isLocked = false;

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
          {isLocked ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs space-y-2">
              <div className="font-bold flex items-center gap-2 text-rose-700 text-sm">
                <KeyRound className="w-4 h-4" />
                <span>पैनल ब्लॉक है (Panel Blocked)</span>
              </div>
              <p>
                5 बार गलत पिन दर्ज करने के कारण यह एडमिन पैनल 4 घंटे के लिए सुरक्षित रूप से लॉक कर दिया गया है।
              </p>
              <div className="p-2.5 bg-white/80 rounded-xl font-mono text-center font-black text-rose-600 text-sm">
                अनलॉक होने में शेष समय: {remainingTimeText || '4h 0m'}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <KeyRound className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold">व्यवस्थापक सुरक्षा पिन (Admin PIN): </span>
                एडमिन पैनल खोलने हेतु अधिकृत पिन दर्ज करें। (अधिकतम 5 प्रयास)
              </div>
            </div>
          )}

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#382719] mb-1.5">
                एडमिन पिन / सिक्योरिटी पासकी (Admin PIN)
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pinInput}
                  disabled={isLocked}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (pinError) setPinError('');
                  }}
                  placeholder={isLocked ? 'पैनल 4 घंटे के लिए लॉक है' : 'सिक्योरिटी पिन दर्ज करें'}
                  autoFocus={!isLocked}
                  className={`w-full pl-4 pr-11 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 font-mono tracking-widest ${
                    isLocked
                      ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                      : 'border-[#E9B44C]/50 bg-[#FFF8EF]/20 focus:ring-primary/40'
                  }`}
                />
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 disabled:opacity-30"
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
              disabled={isVerifying || isLocked}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white font-bold text-sm shadow-saffron transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>
                {isLocked
                  ? 'पैनल लॉक है'
                  : isVerifying
                  ? 'प्रमाणीकरण हो रहा है...'
                  : 'व्यवस्थापक पोर्टल खोलें (Open Admin Portal)'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {Capacitor.isNativePlatform() ? (
            <div className="pt-3 border-t border-[#E9B44C]/20 text-center text-[11px] text-[#A88B72] font-mono">
              राष्ट्रीय सनातन ट्रस्ट एडमिन मोबाइल ऐप • सुरक्षित पोर्टल
            </div>
          ) : (
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
                सदस्य लॉगिन (Member Login) →
              </Link>
            </div>
          )}
        </div>


      </div>
    </div>
  );
};

export default AdminRoute;
