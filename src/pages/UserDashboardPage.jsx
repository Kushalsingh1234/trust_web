import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import TrustLogo from '../components/TrustLogo';
import HelpRequestModal from '../components/HelpRequestModal';
import JoinTrustModal from '../components/JoinTrustModal';
import VolunteerModal from '../components/VolunteerModal';
import PaymentModal from '../components/PaymentModal';
import MemberBadge from '../components/MemberBadge';
import OfficialReceiptModal from '../components/OfficialReceiptModal';
import { generateReceiptPDF, generateMemberCardPDF } from '../firebase/receiptService';
import { getPaymentSettings } from '../firebase/paymentService';
import { subscribeUserCollection } from '../firebase/services';
import {
  User,
  Phone,
  Mail,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  HandHeart,
  UserPlus,
  Users,
  Heart,
  Plus,
  LogOut,
  Home,
  ExternalLink,
  ChevronRight,
  Info,
  Calendar,
  MapPin,
  Sparkles,
  Download,
  CreditCard,
  FileText,
  BadgeCheck
} from 'lucide-react';

export const UserDashboardPage = () => {
  const { lang, toggleLanguage } = useLanguage();
  const { currentUser, userProfile, logout, isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Active Tab: 'helpRequests' | 'memberships' | 'volunteers' | 'donations'
  const [activeTab, setActiveTab] = useState('helpRequests');

  // Realtime Data from onSnapshot
  const [helpRequests, setHelpRequests] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [donations, setDonations] = useState([]);

  const [loading, setLoading] = useState(true);

  // Modals state
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [volunteerModalOpen, setVolunteerModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  // Subscribe to all 4 collections for the current user in realtime
  useEffect(() => {
    if (!currentUser?.uid) return;

    setLoading(true);
    let loadedCount = 0;
    const markLoaded = () => {
      loadedCount++;
      if (loadedCount >= 4) setLoading(false);
    };

    const unsubHelp = subscribeUserCollection('helpRequests', currentUser.uid, (data) => {
      setHelpRequests(data);
      markLoaded();
    });

    const unsubMem = subscribeUserCollection('memberships', currentUser.uid, (data) => {
      setMemberships(data);
      markLoaded();
    });

    const unsubVol = subscribeUserCollection('volunteers', currentUser.uid, (data) => {
      setVolunteers(data);
      markLoaded();
    });

    const unsubDon = subscribeUserCollection('donations', currentUser.uid, (data) => {
      setDonations(data);
      markLoaded();
    });

    return () => {
      unsubHelp();
      unsubMem();
      unsubVol();
      unsubDon();
    };
  }, [currentUser?.uid]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.info(lang === 'hi' ? 'सफलतापूर्वक लॉगआउट किया गया।' : 'Logged out successfully.');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Logout failed');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'हाल ही में (Recent)';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
      return date.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'हाल ही में (Recent)';
    }
  };

  const [paymentSettings, setPaymentSettings] = useState(null);

  useEffect(() => {
    getPaymentSettings().then((settings) => {
      setPaymentSettings(settings);
    }).catch(console.error);
  }, []);

  // Compute membership status
  const approvedMembership = memberships.find((m) => m.status?.toLowerCase() === 'approved');
  const removedMembership = memberships.find((m) => m.status?.toLowerCase() === 'removed');
  const isMember = Boolean(userProfile?.isMember === true);
  const memberId = isMember ? (userProfile?.memberId || approvedMembership?.memberId || '') : '';
  const memberSince = isMember ? (userProfile?.memberSince || approvedMembership?.memberSince || approvedMembership?.approvedAt) : null;

  const handleDownloadMemberCard = () => {
    generateMemberCardPDF({
      fullName: userProfile?.fullName || approvedMembership?.fullName || 'Verified Member',
      username: userProfile?.username || approvedMembership?.username || 'member',
      phone: userProfile?.phone || approvedMembership?.phone || '',
      memberId: memberId,
      memberSince: memberSince
    }, paymentSettings);
    toast.success(lang === 'hi' ? 'सदस्यता कार्ड डाउनलोड हो गया।' : 'Member Card downloaded successfully!');
  };

  // Status Badge Component
  const renderStatusBadge = (status) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'approved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{lang === 'hi' ? 'आपका आवेदन स्वीकृत है ✅' : 'Your application is approved ✅'}</span>
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>{lang === 'hi' ? 'अस्वीकृत' : 'Rejected'}</span>
        </span>
      );
    }
    if (s === 'removed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>{lang === 'hi' ? 'सदस्यता निरस्त (Removed)' : 'Membership Removed'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-300">
        <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin-slow" />
        <span>{lang === 'hi' ? 'समीक्षाधीन (Under review)' : 'Under review'}</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#454545] flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#FFF8EF]/95 backdrop-blur-md border-b border-[#E9B44C]/30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <TrustLogo className="w-9 h-9" showText={false} lang={lang} />
            <div>
              <span className="font-extrabold text-[#382719] text-sm sm:text-base tracking-tight font-hindi-heading block leading-tight">
                {lang === 'hi' ? 'सनातन संस्कार ट्रस्ट' : 'Sanatan Sanskar Trust'}
              </span>
              <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">
                {lang === 'hi' ? 'उपयोगकर्ता डैशबोर्ड' : 'User Dashboard'}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {isAdmin && (
              <Link
                to="/admin"
                className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-secondary transition-all flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{lang === 'hi' ? 'व्यवस्थापक पैनल' : 'Admin Panel'}</span>
              </Link>
            )}

            <button
              type="button"
              onClick={toggleLanguage}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#FFF8EF] border border-[#E9B44C]/40 text-[#382719] text-xs font-bold transition-all shadow-xs"
            >
              {lang === 'hi' ? 'English' : 'हिंदी'}
            </button>

            <Link
              to="/about"
              className="p-2 rounded-xl text-[#382719] hover:bg-white border border-[#E9B44C]/40 text-xs font-bold flex items-center gap-1"
              title="About Trust"
            >
              <Home className="w-4 h-4 text-primary" />
              <span className="hidden md:inline">{lang === 'hi' ? 'ट्रस्ट परिचय' : 'About'}</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition-all"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'hi' ? 'लॉगआउट' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full">
        
        {/* Removed Membership Notification Banner */}
        {removedMembership && !userProfile?.isMember && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border border-rose-300 text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs animate-in fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm sm:text-base text-rose-900 font-hindi-heading">
                  {lang === 'hi' ? 'आपकी सदस्यता समाप्त / निरस्त कर दी गई है' : 'Your membership was removed'}
                </h4>
                <p className="text-xs text-rose-800 mt-0.5">
                  <span className="font-bold">{lang === 'hi' ? 'कारण: ' : 'Reason: '}</span>
                  {removedMembership.removalReason || (lang === 'hi' ? 'प्रशासनिक निर्णय' : 'Administrative decision')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setJoinModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              <span>{lang === 'hi' ? 'पुनः सदस्यता आवेदन करें' : 'Apply for Membership Again'}</span>
            </button>
          </div>
        )}

        {/* Profile Summary Card */}
        <div className="mb-6 sm:mb-8 rounded-3xl bg-gradient-to-br from-[#FFF8EF] via-white to-[#FFF8EF] border border-[#E9B44C]/40 p-5 sm:p-7 shadow-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl -z-10 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            {/* User Identity Details */}
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center font-black text-2xl shadow-saffron flex-shrink-0 border-2 border-white">
                {(userProfile?.fullName || userProfile?.username || 'U').charAt(0).toUpperCase()}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  {isMember && (
                    <MemberBadge
                      category={userProfile?.category || approvedMembership?.category || 'catB'}
                      memberId={memberId}
                      variant="inline"
                      lang={lang}
                    />
                  )}
                  <h1 className="text-xl sm:text-2xl font-black text-[#382719] font-hindi-heading">
                    {userProfile?.fullName || 'सदस्य (Member)'}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    {userProfile?.role === 'admin' ? 'व्यवस्थापक (Admin)' : isMember ? 'सत्यापित सदस्य (Verified Member)' : 'पंजीकृत उपयोगकर्ता (User)'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm text-[#555555]">
                  <div className="flex items-center gap-1.5 font-mono font-bold text-[#382719]">
                    <span className="text-secondary">@</span>
                    <span>{userProfile?.username || 'user'}</span>
                  </div>

                  {userProfile?.phone && (
                    <div className="flex items-center gap-1 text-[#454545]">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      <span>{userProfile.phone}</span>
                    </div>
                  )}

                  {userProfile?.email && (
                    <div className="flex items-center gap-1 text-[#454545]">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      <span>{userProfile.email}</span>
                    </div>
                  )}
                </div>

                {/* Verified Member Badge and ID Card Button */}
                {isMember && (
                  <div className="pt-1.5 flex flex-wrap items-center gap-2.5">
                    <MemberBadge memberId={memberId} variant="default" />
                    <button
                      type="button"
                      onClick={handleDownloadMemberCard}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FFF8EF] border border-[#E9B44C]/60 text-[#382719] text-xs font-bold shadow-xs transition-all hover:scale-102"
                      title="Download Printable Member Card"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-primary" />
                      <span>{lang === 'hi' ? 'सदस्यता कार्ड (ID Card)' : 'Member Card'}</span>
                      <Download className="w-3 h-3 text-[#777777]" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setHelpModalOpen(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all"
              >
                <HandHeart className="w-4 h-4" />
                <span>{lang === 'hi' ? 'सहायता मांगें' : 'Request Help'}</span>
              </button>

              <button
                type="button"
                onClick={() => setJoinModalOpen(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs shadow-saffron transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>{lang === 'hi' ? 'सदस्यता लें' : 'Join Trust'}</span>
              </button>

              <Link
                to="/donate"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-secondary to-primary hover:from-primary hover:to-secondary text-white font-bold text-xs shadow-xs transition-all"
              >
                <Heart className="w-4 h-4 fill-white" />
                <span>{lang === 'hi' ? 'दान करें' : 'Donate'}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Core Tabs Navigation */}
        <div className="flex border-b border-[#E9B44C]/30 mb-6 overflow-x-auto no-scrollbar gap-1.5 sm:gap-2 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('helpRequests')}
            className={`min-h-[44px] shrink-0 py-2.5 px-4 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'helpRequests'
                ? 'border-primary text-primary bg-[#FFF8EF] rounded-t-xl font-black'
                : 'border-transparent text-[#666666] hover:text-primary'
            }`}
          >
            <HandHeart className="w-4 h-4" />
            <span>{lang === 'hi' ? 'मेरी सहायता प्रार्थनाएं' : 'My Help Requests'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary">
              {helpRequests.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('memberships')}
            className={`min-h-[44px] shrink-0 py-2.5 px-4 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'memberships'
                ? 'border-primary text-primary bg-[#FFF8EF] rounded-t-xl font-black'
                : 'border-transparent text-[#666666] hover:text-primary'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>{lang === 'hi' ? 'मेरी सदस्यता' : 'My Membership'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary">
              {memberships.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('volunteers')}
            className={`min-h-[44px] shrink-0 py-2.5 px-4 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'volunteers'
                ? 'border-primary text-primary bg-[#FFF8EF] rounded-t-xl font-black'
                : 'border-transparent text-[#666666] hover:text-primary'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{lang === 'hi' ? 'मेरी स्वयंसेवक सेवा' : 'My Volunteer Application'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary">
              {volunteers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('donations')}
            className={`min-h-[44px] shrink-0 py-2.5 px-4 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'donations'
                ? 'border-primary text-primary bg-[#FFF8EF] rounded-t-xl font-black'
                : 'border-transparent text-[#666666] hover:text-primary'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>{lang === 'hi' ? 'मेरे दान एवं समर्पण' : 'My Donations'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary">
              {donations.length}
            </span>
          </button>
        </div>

        {/* Tab 1: My Help Requests */}
        {activeTab === 'helpRequests' && (
          <div className="space-y-4">
            {helpRequests.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-3xl bg-white border border-[#E9B44C]/30 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                  <HandHeart className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[#382719] font-hindi-heading">
                  {lang === 'hi' ? 'आपने अभी तक कोई सहायता प्रार्थना नहीं भेजी है' : "You haven't requested help yet"}
                </h3>
                <p className="text-sm text-[#666666] max-w-md mx-auto mt-1 mb-5">
                  {lang === 'hi'
                    ? 'यदि आपको चिकित्सा, शिक्षा, पुत्री विवाह या पारिवारिक आपदा में सहयोग चाहिए, तो तत्काल आवेदन करें।'
                    : 'If you need medical, educational, marriage, or humanitarian assistance, submit a request.'}
                </p>
                <button
                  type="button"
                  onClick={() => setHelpModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs shadow-saffron transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'hi' ? 'सहायता प्रार्थना पत्र भरें' : 'Request Help Now'}</span>
                </button>
              </div>
            ) : (
              helpRequests.map((item) => {
                const isApproved = item.status?.toLowerCase() === 'approved';
                const isRejected = item.status?.toLowerCase() === 'rejected';

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl p-5 sm:p-6 bg-white border transition-all shadow-xs ${
                      isApproved
                        ? 'border-emerald-300 ring-1 ring-emerald-200'
                        : isRejected
                        ? 'border-rose-200'
                        : 'border-[#E9B44C]/40'
                    }`}
                  >
                    {/* Approved Banner for Help Requests */}
                    {isApproved && (
                      <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1 text-left">
                          <h4 className="font-black text-emerald-900 text-sm">
                            {lang === 'hi' ? 'आपकी सहायता प्रार्थना स्वीकृत कर ली गई है ✅' : 'Your assistance request has been APPROVED ✅'}
                          </h4>
                          <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                            {item.adminNote
                              ? item.adminNote
                              : (lang === 'hi'
                                  ? 'ट्रस्ट कार्यकारिणी द्वारा आपका आवेदन स्वीकृत हो गया है। ट्रस्ट प्रतिनिधि शीघ्र ही आपसे संपर्क कर आगे की कार्यवाही करेंगे।'
                                  : 'Our trust committee has approved your request. An official coordinator will contact you shortly regarding next steps.')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Rejected Banner */}
                    {isRejected && (
                      <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1 text-left">
                          <h4 className="font-bold text-rose-900 text-sm">
                            {lang === 'hi' ? 'आवेदन अस्वीकृत (Application Rejected)' : 'Application Rejected'}
                          </h4>
                          <p className="text-xs text-rose-800 leading-relaxed">
                            <span className="font-bold">{lang === 'hi' ? 'कारण: ' : 'Reason: '}</span>
                            {item.rejectionReason || item.adminNote || (lang === 'hi' ? 'नियमावली के अनुसार आवश्यक दस्तावेज अपूर्ण हैं।' : 'Required criteria not met.')}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E9B44C]/20 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#382719] text-sm sm:text-base">
                            {item.helpType || item.category || 'सहायता प्रार्थना'}
                          </span>
                          {item.urgency === 'urgent' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700">
                              {lang === 'hi' ? 'अति आवश्यक' : 'Urgent'}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#777777] flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                      <div>{renderStatusBadge(item.status)}</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 py-3 text-xs">
                      <div>
                        <span className="text-[#888888] block">{lang === 'hi' ? 'आवेदक का नाम:' : 'Applicant Name:'}</span>
                        <span className="font-bold text-[#382719]">{item.fullName}</span>
                      </div>
                      <div>
                        <span className="text-[#888888] block">{lang === 'hi' ? 'फ़ोन नंबर:' : 'Phone Number:'}</span>
                        <span className="font-bold text-[#382719]">{item.phone}</span>
                      </div>
                      {item.amountNeeded && (
                        <div>
                          <span className="text-[#888888] block">{lang === 'hi' ? 'अपेक्षित सहायता राशि:' : 'Amount Needed:'}</span>
                          <span className="font-mono font-bold text-primary">₹{Number(item.amountNeeded).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {item.address && (
                        <div className="sm:col-span-2">
                          <span className="text-[#888888] block">{lang === 'hi' ? 'पता / निवास:' : 'Address:'}</span>
                          <span className="font-medium text-[#454545]">{item.address}</span>
                        </div>
                      )}
                    </div>

                    {item.description && (
                      <div className="mt-2 p-3 rounded-xl bg-[#FFF8EF] border border-[#E9B44C]/25 text-xs text-[#454545]">
                        <span className="font-bold text-[#382719] block mb-1">{lang === 'hi' ? 'समस्या का विवरण:' : 'Description:'}</span>
                        <p className="leading-relaxed">{item.description}</p>
                      </div>
                    )}

                    {/* Admin Note Callout (for non-rejected / non-approved special notes) */}
                    {!isApproved && !isRejected && item.adminNote && (
                      <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">{lang === 'hi' ? 'व्यवस्थापक संदेश: ' : 'Admin Note: '}</span>
                          <span>{item.adminNote}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: My Membership */}
        {activeTab === 'memberships' && (
          <div className="space-y-4">
            {memberships.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-3xl bg-white border border-[#E9B44C]/30 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                  <UserPlus className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[#382719] font-hindi-heading">
                  {lang === 'hi' ? 'आपने अभी तक सदस्यता के लिए आवेदन नहीं किया है' : "You haven't applied for membership yet"}
                </h3>
                <p className="text-sm text-[#666666] max-w-md mx-auto mt-1 mb-5">
                  {lang === 'hi'
                    ? 'राष्ट्रीय सनातन संस्कार सेवा संस्थान के अधिकृत सदस्य बनें (वार्षिक शुल्क मात्र ₹200)।'
                    : 'Become an official recognized member of the Trust with membership certificate and ID privileges.'}
                </p>
                <button
                  type="button"
                  onClick={() => setJoinModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs shadow-saffron transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'hi' ? 'सदस्यता आवेदन पत्र भरें' : 'Apply for Membership'}</span>
                </button>
              </div>
            ) : (
              memberships.map((item) => {
                const isApproved = item.status?.toLowerCase() === 'approved';
                const isRejected = item.status?.toLowerCase() === 'rejected';
                const isRemoved = item.status?.toLowerCase() === 'removed';

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl p-5 sm:p-6 bg-white border transition-all shadow-xs ${
                      isApproved ? 'border-emerald-300 ring-1 ring-emerald-200' : isRejected || isRemoved ? 'border-rose-200' : 'border-[#E9B44C]/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E9B44C]/20 pb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#382719] text-sm sm:text-base">
                            {lang === 'hi' ? 'ट्रस्ट सदस्यता आवेदन' : 'Trust Membership Application'}
                          </span>
                          {(item.memberId || userProfile?.memberId) && isApproved && (
                            <MemberBadge memberId={item.memberId || userProfile?.memberId} variant="compact" />
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FFF8EF] border border-[#E9B44C]">
                            {item.category === 'catA' 
                              ? (lang === 'hi' ? 'श्रेणी (क) - सहायता प्रार्थी (निःशुल्क)' : 'Category A - Beneficiary (Free)')
                              : item.category === 'catC' 
                              ? (lang === 'hi' ? 'श्रेणी (ग) - निष्काम कार्यकर्ता' : 'Category C - Active Volunteer') 
                              : (lang === 'hi' ? 'श्रेणी (ख) - साधारण सदस्य / संरक्षक' : 'Category B - General Member')}
                          </span>
                        </div>
                        <span className="text-xs text-[#777777] flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                      <div>{renderStatusBadge(item.status)}</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 py-3 text-xs">
                      <div>
                        <span className="text-[#888888] block">{lang === 'hi' ? 'सदस्य का नाम:' : 'Member Name:'}</span>
                        <span className="font-bold text-[#382719]">{item.fullName}</span>
                      </div>
                      <div>
                        <span className="text-[#888888] block">{lang === 'hi' ? 'फ़ोन नंबर:' : 'Phone:'}</span>
                        <span className="font-bold text-[#382719]">{item.phone}</span>
                      </div>
                      <div>
                        <span className="text-[#888888] block">{lang === 'hi' ? 'वार्षिक सदस्यता शुल्क:' : 'Annual Fee:'}</span>
                        <span className="font-mono font-bold text-primary">
                          {item.category === 'catA' ? (lang === 'hi' ? '₹0 (छूट / निःशुल्क)' : '₹0 (Exempted)') : `₹${item.annualFee ?? 200}/वर्ष`}
                        </span>
                      </div>
                      {(item.paymentId || item.utrNumber) && (
                        <div>
                          <span className="text-[#888888] block">{lang === 'hi' ? 'भुगतान आईडी / UTR:' : 'Payment ID / UTR:'}</span>
                          <span className="font-mono font-bold text-secondary">{item.paymentId || item.utrNumber}</span>
                        </div>
                      )}
                      {item.category === 'catA' && item.helpType && (
                        <div>
                          <span className="text-[#888888] block">{lang === 'hi' ? 'सहायता का प्रकार:' : 'Assistance Type:'}</span>
                          <span className="font-bold text-emerald-800">{item.helpType}</span>
                        </div>
                      )}
                      {item.profession && (
                        <div>
                          <span className="text-[#888888] block">{lang === 'hi' ? 'व्यवसाय / पेशा:' : 'Profession:'}</span>
                          <span className="font-bold text-[#382719] capitalize">{item.profession}</span>
                        </div>
                      )}
                      {item.availability && (
                        <div>
                          <span className="text-[#888888] block">{lang === 'hi' ? 'समय समर्पण:' : 'Time Dedication:'}</span>
                          <span className="font-bold text-secondary capitalize">{item.availability}</span>
                        </div>
                      )}
                      {isApproved && item.receiptNumber && (
                        <div>
                          <span className="text-[#888888] block">{lang === 'hi' ? 'रसीद संख्या:' : 'Receipt Number:'}</span>
                          <span className="font-mono font-bold text-emerald-700">{item.receiptNumber}</span>
                        </div>
                      )}
                      {isApproved && item.category !== 'catA' && (
                        <div>
                          <span className="text-[#888888] block">{lang === 'hi' ? 'सत्यापित शुल्क राशि:' : 'Verified Fee:'}</span>
                          <span className="font-mono font-bold text-emerald-700">₹{item.verifiedAmount || item.claimedAmount || 200}</span>
                        </div>
                      )}
                      {item.address && (
                        <div className="sm:col-span-2">
                          <span className="text-[#888888] block">{lang === 'hi' ? 'स्थानीय पता:' : 'Address:'}</span>
                          <span className="font-medium text-[#454545]">{item.address} {item.district ? `, ${item.district}` : ''}</span>
                        </div>
                      )}
                      {item.category === 'catA' && item.assistanceDescription && (
                        <div className="sm:col-span-3 mt-1 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                          <span className="font-bold block mb-0.5">{lang === 'hi' ? 'समस्या एवं अपेक्षित सहयोग:' : 'Hardship & Requested Support:'}</span>
                          <p>{item.assistanceDescription}</p>
                        </div>
                      )}
                    </div>

                    {/* Pending Notice */}
                    {item.status === 'pending' && (
                      <div className="mt-2 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span>{lang === 'hi' ? 'प्रशासनिक सत्यापन के उपरांत डिजिटल रसीद एवं सदस्य कार्ड उपलब्ध होगा।' : 'Receipt and Member Card available after admin verification.'}</span>
                        </div>
                      </div>
                    )}

                    {/* Approved Actions: Download Receipt & Member Card */}
                    {isApproved && (
                      <div className="mt-3 pt-3 border-t border-emerald-100 flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setViewingReceipt({
                              receiptNumber: item.receiptNumber || 'RSSSST-2026-MEMBER',
                              donorName: item.fullName || userProfile?.fullName,
                              username: item.username || userProfile?.username,
                              memberId: item.memberId || userProfile?.memberId,
                              fatherHusbandName: item.fatherHusbandName || '',
                              address: item.address || item.district || '',
                              block: item.block || 'सदर',
                              district: item.district || 'गोरखपुर',
                              state: item.state || 'उत्तर प्रदेश',
                              purpose: 'membership_fee',
                              verifiedAmount: item.verifiedAmount || item.claimedAmount || 200,
                              claimedAmount: item.claimedAmount || 200,
                              paymentId: item.paymentId || item.utrNumber,
                              approvedAt: item.approvedAt || item.memberSince
                            });
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs shadow-xs transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{lang === 'hi' ? 'शुल्क रसीद देखें / डाउनलोड करें (PDF)' : 'View & Download Fee Receipt (PDF)'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            generateMemberCardPDF({
                              fullName: item.fullName || userProfile?.fullName,
                              username: item.username || userProfile?.username,
                              phone: item.phone || userProfile?.phone,
                              memberId: item.memberId || userProfile?.memberId || memberId,
                              memberSince: item.memberSince || item.approvedAt
                            }, paymentSettings);
                            toast.success(lang === 'hi' ? 'सदस्यता कार्ड डाउनलोड हो गया।' : 'Member Card downloaded!');
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FFF8EF] border border-[#E9B44C]/60 text-[#382719] font-bold text-xs shadow-xs transition-all"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-primary" />
                          <span>{lang === 'hi' ? 'सदस्य कार्ड (ID Card)' : 'Member Card'}</span>
                        </button>
                      </div>
                    )}

                    {/* Rejected Notice with Reason and Re-apply CTA */}
                    {isRejected && (
                      <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">{lang === 'hi' ? 'अस्वीकृति कारण: ' : 'Rejection Reason: '}</span>
                            <span>{item.rejectionReason || item.adminNote || (lang === 'hi' ? 'भुगतान संदर्भ अमान्य पाया गया।' : 'Payment reference could not be verified.')}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setJoinModalOpen(true)}
                          className="px-3 py-1.5 rounded-lg bg-primary hover:bg-secondary text-white font-bold text-xs shadow-xs transition-all whitespace-nowrap"
                        >
                          {lang === 'hi' ? 'नई भुगतान आईडी से पुनः आवेदन करें' : 'Re-apply with new Payment ID'}
                        </button>
                      </div>
                    )}

                    {/* Removed Notice with Reason and Re-apply CTA */}
                    {isRemoved && (
                      <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">{lang === 'hi' ? 'सदस्यता समाप्ति का कारण: ' : 'Removal Reason: '}</span>
                            <span>{item.removalReason || item.adminNote || (lang === 'hi' ? 'प्रशासनिक निर्णय' : 'Administrative decision')}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setJoinModalOpen(true)}
                          className="px-3 py-1.5 rounded-lg bg-primary hover:bg-secondary text-white font-bold text-xs shadow-xs transition-all whitespace-nowrap"
                        >
                          {lang === 'hi' ? 'पुनः सदस्यता आवेदन करें' : 'Apply for Membership Again'}
                        </button>
                      </div>
                    )}

                    {/* Admin Note Callout */}
                    {!isRejected && !isRemoved && item.adminNote && (
                      <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">{lang === 'hi' ? 'व्यवस्थापक संदेश: ' : 'Admin Note: '}</span>
                          <span>{item.adminNote}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 3: My Volunteer Application */}
        {activeTab === 'volunteers' && (
          <div className="space-y-4">
            {volunteers.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-3xl bg-white border border-[#E9B44C]/30 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mx-auto mb-3">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[#382719] font-hindi-heading">
                  {lang === 'hi' ? 'आपने अभी तक स्वयंसेवक के रूप में आवेदन नहीं किया है' : "You haven't applied as a volunteer yet"}
                </h3>
                <p className="text-sm text-[#666666] max-w-md mx-auto mt-1 mb-5">
                  {lang === 'hi'
                    ? 'संस्कार जागरण, श्रमिक कल्याण एवं सामाजिक सेवा कार्यों में निष्काम भाव से योगदान देने हेतु जुड़ें।'
                    : 'Join our volunteer taskforce to organize Vedic awareness camps and humanitarian welfare drives.'}
                </p>
                <button
                  type="button"
                  onClick={() => setVolunteerModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary hover:bg-primary text-white font-bold text-xs shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'hi' ? 'स्वयंसेवक आवेदन करें' : 'Become a Volunteer'}</span>
                </button>
              </div>
            ) : (
              volunteers.map((item) => {
                const isApproved = item.status?.toLowerCase() === 'approved';
                const isRejected = item.status?.toLowerCase() === 'rejected';

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl p-5 sm:p-6 bg-white border transition-all shadow-xs ${
                      isApproved ? 'border-emerald-300 ring-1 ring-emerald-200' : isRejected ? 'border-rose-200' : 'border-[#E9B44C]/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E9B44C]/20 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#382719] text-sm sm:text-base">
                            {lang === 'hi' ? 'सनातन स्वयंसेवक / कार्यकर्ता' : 'Volunteer Application'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF8EF] text-secondary border border-[#E9B44C]">
                            {item.availability === 'full_time' ? 'पूर्णकालिक' : item.availability === 'few_hours_daily' ? 'प्रतिदिन कुछ घंटे' : 'सप्ताहांत (Weekends)'}
                          </span>
                        </div>
                        <span className="text-xs text-[#777777] flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                      <div>{renderStatusBadge(item.status)}</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 py-3 text-xs">
                      <div>
                        <span className="text-[#888888] block">{lang === 'hi' ? 'नाम:' : 'Name:'}</span>
                        <span className="font-bold text-[#382719]">{item.fullName}</span>
                      </div>
                      <div>
                        <span className="text-[#888888] block">{lang === 'hi' ? 'फ़ोन:' : 'Phone:'}</span>
                        <span className="font-bold text-[#382719]">{item.phone}</span>
                      </div>
                      <div>
                        <span className="text-[#888888] block">{lang === 'hi' ? 'ज़िला / स्थान:' : 'City / District:'}</span>
                        <span className="font-bold text-[#382719]">{item.cityOrDistrict || 'गोरखपुर'}</span>
                      </div>
                    </div>

                    {item.experience && (
                      <div className="mt-2 p-3 rounded-xl bg-[#FFF8EF] border border-[#E9B44C]/25 text-xs text-[#454545]">
                        <span className="font-bold text-[#382719] block mb-1">{lang === 'hi' ? 'सेवा अनुभव / रुचि:' : 'Experience / Interests:'}</span>
                        <p>{item.experience}</p>
                      </div>
                    )}

                    {/* Admin Note Callout */}
                    {item.adminNote && (
                      <div className={`mt-3 p-3 rounded-xl text-xs flex items-start gap-2 ${
                        isApproved ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : isRejected ? 'bg-rose-50 text-rose-900 border border-rose-200' : 'bg-amber-50 text-amber-900 border border-amber-200'
                      }`}>
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">{lang === 'hi' ? 'व्यवस्थापक संदेश: ' : 'Admin Note: '}</span>
                          <span>{item.adminNote}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 4: My Donations */}
        {activeTab === 'donations' && (
          <div className="space-y-4">
            {donations.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-3xl bg-white border border-[#E9B44C]/30 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-8 h-8 fill-rose-500 text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-[#382719] font-hindi-heading">
                  {lang === 'hi' ? 'कोई दान या समर्पण रिकॉर्ड नहीं मिला' : 'No donations recorded yet'}
                </h3>
                <p className="text-sm text-[#666666] max-w-md mx-auto mt-1 mb-5">
                  {lang === 'hi'
                    ? 'ट्रस्ट के सेवा प्रकल्पों में स्वेच्छा से समर्पण निधि अर्पित करें एवं डिजिटल रसीद प्राप्त करें।'
                    : 'Contribute to our charitable causes directly via Bank transfer or UPI and receive your receipt.'}
                </p>
                <Link
                  to="/donate"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs shadow-saffron transition-all"
                >
                  <Heart className="w-4 h-4 fill-white" />
                  <span>{lang === 'hi' ? 'दान / समर्पण करें' : 'Donate Now'}</span>
                </Link>
              </div>
            ) : (
              donations.map((item) => {
                const isApproved = item.status?.toLowerCase() === 'approved';
                const isRejected = item.status?.toLowerCase() === 'rejected';

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl p-5 sm:p-6 bg-white border transition-all shadow-xs ${
                      isApproved ? 'border-emerald-300 ring-1 ring-emerald-200' : isRejected ? 'border-rose-200' : 'border-[#E9B44C]/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E9B44C]/20 pb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#382719] text-sm sm:text-base">
                            {item.purposeLabel || (item.purpose === 'membership_fee' ? 'सदस्यता शुल्क' : item.purpose === 'labor_welfare' ? 'श्रमिक कल्याण समर्पण' : 'समर्पण निधि (Donation)')}
                          </span>
                          <span className="font-mono font-black text-primary text-base">
                            ₹{Number(item.verifiedAmount || item.claimedAmount || item.amount || 0).toLocaleString('en-IN')}
                          </span>
                          {isApproved && item.receiptNumber && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {item.receiptNumber}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#777777] flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                      <div>{renderStatusBadge(item.status)}</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 py-3 text-xs">
                      <div>
                        <span className="text-[#888888] block">{lang === 'hi' ? 'दानदाता:' : 'Donor Name:'}</span>
                        <span className="font-bold text-[#382719]">{item.donorName || item.payerName}</span>
                      </div>
                      <div>
                        <span className="text-[#888888] block">{lang === 'hi' ? 'घोषित राशि (Claimed):' : 'Claimed Amount:'}</span>
                        <span className="font-mono font-bold text-[#382719]">₹{Number(item.claimedAmount || item.amount || 0).toLocaleString('en-IN')}</span>
                      </div>
                      {isApproved && (
                        <div>
                          <span className="text-[#888888] block">{lang === 'hi' ? 'सत्यापित राशि (Verified):' : 'Verified Amount:'}</span>
                          <span className="font-mono font-bold text-emerald-700">₹{Number(item.verifiedAmount || item.amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {(item.paymentId || item.utrNumber) && (
                        <div>
                          <span className="text-[#888888] block">{lang === 'hi' ? 'भुगतान आईडी / UTR:' : 'Payment ID / UTR:'}</span>
                          <span className="font-mono font-bold text-secondary">{item.paymentId || item.utrNumber}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-[#888888] block">{lang === 'hi' ? 'माध्यम:' : 'Method:'}</span>
                        <span className="uppercase font-semibold text-[#454545]">{item.paymentMethod || 'UPI'}</span>
                      </div>
                    </div>

                    {/* Pending Notice */}
                    {item.status === 'pending' && (
                      <div className="mt-2 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>{lang === 'hi' ? 'व्यवस्थापक द्वारा सत्यापन के उपरांत आधिकारिक रसीद (PDF) उपलब्ध होगी।' : 'Receipt available after admin approval.'}</span>
                      </div>
                    )}

                    {/* Approved Actions: Download Receipt */}
                    {isApproved && (
                      <div className="mt-3 pt-3 border-t border-emerald-100 flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setViewingReceipt({
                              receiptNumber: item.receiptNumber || 'RSSSST-2026-DONATION',
                              donorName: item.donorName || item.fullName || userProfile?.fullName,
                              phone: item.donorPhone || item.phone || userProfile?.phone,
                              purpose: item.purpose || 'samarpan',
                              verifiedAmount: item.verifiedAmount || item.amount || 200,
                              paymentId: item.paymentId || item.utrNumber,
                              approvedAt: item.approvedAt || item.createdAt
                            });
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs shadow-xs transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{lang === 'hi' ? 'आधिकारिक रसीद देखें / डाउनलोड करें (PDF)' : 'View & Download Receipt (PDF)'}</span>
                        </button>
                      </div>
                    )}

                    {/* Rejected Notice */}
                    {isRejected && (
                      <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">{lang === 'hi' ? 'अस्वीकृति कारण: ' : 'Rejection Reason: '}</span>
                          <span>{item.rejectionReason || item.adminNote || (lang === 'hi' ? 'भुगतान विवरण असत्यापित रहा।' : 'Payment details could not be verified.')}</span>
                        </div>
                      </div>
                    )}

                    {/* Admin Note Callout */}
                    {!isRejected && item.adminNote && (
                      <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">{lang === 'hi' ? 'व्यवस्थापक संदेश: ' : 'Admin Note: '}</span>
                          <span>{item.adminNote}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

      </main>

      {/* Modals Accessible Direct from Dashboard */}
      <HelpRequestModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />

      <JoinTrustModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
      />

      <VolunteerModal
        isOpen={volunteerModalOpen}
        onClose={() => setVolunteerModalOpen(false)}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
      />

      {/* Authentic Traditional Receipt Modal */}
      <OfficialReceiptModal
        isOpen={Boolean(viewingReceipt)}
        onClose={() => setViewingReceipt(null)}
        receipt={viewingReceipt}
      />
    </div>
  );
};

export default UserDashboardPage;
