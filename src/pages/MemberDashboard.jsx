import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import TrustLogo from '../components/TrustLogo';
import DigitalIdCard from '../components/DigitalIdCard';
import OfficialReceiptModal from '../components/OfficialReceiptModal';
import PaymentModal from '../components/PaymentModal';
import {
  getApplicationsForUser,
  getPaymentsForUser,
  getAssistanceRequestsForUser,
  getPublishedAnnouncements
} from '../firebase/services';
import {
  User,
  ShieldCheck,
  CreditCard,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Heart,
  LogOut,
  Calendar,
  Home,
  HandHeart,
  Award,
  Globe
} from 'lucide-react';

export const MemberDashboard = ({ onNavigateHome }) => {
  const { lang, toggleLanguage } = useLanguage();
  const { currentUser, userProfile, memberRecord, logout, refreshUserData } = useAuth();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'card' | 'payments' | 'assistance' | 'announcements'
  const [applications, setApplications] = useState([]);
  const [payments, setPayments] = useState([]);
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      try {
        const uid = currentUser?.uid || null;
        const mobile = userProfile?.mobile || null;
        const [userApps, userPays, userHelp, publicNews] = await Promise.all([
          getApplicationsForUser(uid, mobile),
          getPaymentsForUser(uid, mobile),
          getAssistanceRequestsForUser(uid, mobile),
          getPublishedAnnouncements()
        ]);

        setApplications(userApps);
        setPayments(userPays);
        setAssistanceRequests(userHelp);
        setAnnouncements(publicNews);
      } catch (err) {
        console.error("Failed to load member dashboard records:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [currentUser]);

  const latestApp = applications[0] || null;
  const isApproved = memberRecord && memberRecord.status === 'active';

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#454545] flex flex-col">
      
      {/* Top Navbar - Pinned to Top */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E9B44C]/30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateHome}
              className="flex items-center gap-2 group"
              title="Return to Home"
            >
              <TrustLogo className="w-9 h-9 sm:w-10 sm:h-10" showText={false} lang={lang} />
              <div className="text-left">
                <span className="font-extrabold text-[#382719] text-sm sm:text-base tracking-tight font-hindi-heading block leading-tight">
                  {lang === 'hi' ? 'सनातन संस्कार ट्रस्ट' : 'Sanatan Sanskar Trust'}
                </span>
                <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">
                  {lang === 'hi' ? 'सदस्य पोर्टल' : 'Member Portal'}
                </span>
              </div>
            </button>
          </div>

          {/* User identity, Language toggle & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block text-right">
              <span className="font-bold text-xs sm:text-sm text-[#382719] block">
                {userProfile?.displayName || currentUser?.email}
              </span>
              <span className="text-[10px] font-mono text-[#666666]">
                UID: {currentUser?.uid?.slice(0, 8)}...
              </span>
            </div>

            {/* Language Switcher */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="p-2 sm:px-3 rounded-xl bg-white hover:bg-[#FFF8EF] border border-[#E9B44C]/40 text-[#382719] text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="Toggle Hindi / English"
            >
              <Globe className="w-4 h-4 text-secondary" />
              <span>{lang === 'hi' ? 'English' : 'हिंदी'}</span>
            </button>

            <button
              type="button"
              onClick={onNavigateHome}
              className="p-2 rounded-xl text-[#382719] hover:bg-[#FFF8EF] border border-[#E9B44C]/40 text-xs font-bold flex items-center gap-1.5"
            >
              <Home className="w-4 h-4 text-primary" />
              <span className="hidden md:inline">{lang === 'hi' ? 'मुख्य पृष्ठ' : 'Home'}</span>
            </button>

            <button
              type="button"
              onClick={logout}
              className="p-2 sm:px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{lang === 'hi' ? 'लॉगआउट' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-6 sm:pb-8 flex-1 w-full">
        
        {/* Welcome Strip */}
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#FFF8EF] via-white to-[#FFF8EF] border border-[#E9B44C]/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary text-white">
                {isApproved 
                  ? (lang === 'hi' ? 'स्वीकृत सदस्य' : 'Approved Member')
                  : (lang === 'hi' ? 'आवेदक प्रोफ़ाइल' : 'Applicant Profile')}
              </span>
              {memberRecord?.membershipNumber && (
                <span className="font-mono text-xs font-extrabold text-secondary bg-white px-2 py-0.5 rounded-md border border-[#E9B44C]">
                  {memberRecord.membershipNumber}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#382719] font-hindi-heading">
              {lang === 'hi' ? 'नमस्ते,' : 'Welcome,'} {userProfile?.displayName || (lang === 'hi' ? 'सदस्य' : 'Member')}
            </h1>
            <p className="text-xs sm:text-sm text-[#454545]">
              {lang === 'hi'
                ? 'राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट), गोरखपुर के आधिकारिक सदस्य डैशबोर्ड में आपका स्वागत है।'
                : 'Welcome to your official trust membership dashboard.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">

            <button
              type="button"
              onClick={() => setPaymentModalOpen(true)}
              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-secondary hover:bg-primary text-white font-bold text-xs shadow-sm transition-all"
            >
              <CreditCard className="w-4 h-4" />
              <span>{lang === 'hi' ? 'शुल्क / समर्पण UTR दर्ज करें' : 'Submit Payment UTR'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E9B44C]/30 mb-6 sm:mb-8 overflow-x-auto no-scrollbar gap-1.5 sm:gap-2 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`min-h-[44px] shrink-0 py-2.5 sm:py-3 px-3.5 sm:px-4 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 transition-all flex items-center justify-center ${
              activeTab === 'overview'
                ? 'border-primary text-primary bg-[#FFF8EF]/50 rounded-t-lg'
                : 'border-transparent text-[#666666] hover:text-primary'
            }`}
          >
            {lang === 'hi' ? 'विवरण एवं स्थिति' : 'Overview & Status'}
          </button>

          {isApproved && (
            <button
              type="button"
              onClick={() => setActiveTab('card')}
              className={`min-h-[44px] shrink-0 py-2.5 sm:py-3 px-3.5 sm:px-4 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'card'
                  ? 'border-primary text-primary bg-[#FFF8EF]/50 rounded-t-lg'
                  : 'border-transparent text-[#666666] hover:text-primary'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>{lang === 'hi' ? 'पहचान पत्र (ID Card)' : 'Member ID Card'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`min-h-[44px] shrink-0 py-2.5 sm:py-3 px-3.5 sm:px-4 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'payments'
                ? 'border-primary text-primary bg-[#FFF8EF]/50 rounded-t-lg'
                : 'border-transparent text-[#666666] hover:text-primary'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>{lang === 'hi' ? 'भुगतान एवं रसीदें' : 'Payments & Receipts'}</span>
            {payments.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary/10 text-primary">
                {payments.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assistance')}
            className={`min-h-[44px] shrink-0 py-2.5 sm:py-3 px-3.5 sm:px-4 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'assistance'
                ? 'border-primary text-primary bg-[#FFF8EF]/50 rounded-t-lg'
                : 'border-transparent text-[#666666] hover:text-primary'
            }`}
          >
            <HandHeart className="w-4 h-4" />
            <span>{lang === 'hi' ? 'सहायता अनुरोध स्थिति' : 'Assistance Requests'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('announcements')}
            className={`min-h-[44px] shrink-0 py-2.5 sm:py-3 px-3.5 sm:px-4 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 transition-all flex items-center justify-center ${
              activeTab === 'announcements'
                ? 'border-primary text-primary bg-[#FFF8EF]/50 rounded-t-lg'
                : 'border-transparent text-[#666666] hover:text-primary'
            }`}
          >
            {lang === 'hi' ? 'ट्रस्ट सूचनाएं (Announcements)' : 'Announcements'}
          </button>
        </div>

        {/* Tab 1: Overview & Status */}
        {activeTab === 'overview' && (
          <div className="space-y-6 text-left">
            
            {/* Application Status Card */}
            <div className="p-6 rounded-3xl bg-white border border-[#E9B44C]/35 shadow-card">
              <h2 className="text-base sm:text-lg font-black text-[#382719] mb-4 font-hindi-heading">
                {lang === 'hi' ? 'ट्रस्ट सदस्यता आवेदन स्थिति' : 'Membership Application Status'}
              </h2>

              {latestApp ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 p-4 rounded-2xl bg-[#FFF8EF] border border-[#E9B44C]/40">
                    <div>
                      <span className="text-[10px] text-[#666666] block uppercase tracking-wider">
                        {lang === 'hi' ? 'आवेदन संदर्भ संख्या:' : 'Application Ref:'}
                      </span>
                      <span className="font-mono text-sm font-black text-primary">
                        {latestApp.applicationRef}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#666666] block uppercase tracking-wider">
                        {lang === 'hi' ? 'श्रेणी:' : 'Category:'}
                      </span>
                      <span className="text-xs font-bold text-[#382719]">
                        {latestApp.category === 'catA' 
                          ? (lang === 'hi' ? 'श्रेणी-क (सहायता आकांक्षी)' : 'Category A (Assistance Seeker)') 
                          : latestApp.category === 'catB' 
                          ? (lang === 'hi' ? 'श्रेणी-ख (दानदाता सदस्य)' : 'Category B (Donor / Supporter)') 
                          : (lang === 'hi' ? 'श्रेणी-ग (स्वयंसेवक)' : 'Category C (Volunteer)')}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#666666] block uppercase tracking-wider">
                        {lang === 'hi' ? 'वर्तमान स्थिति:' : 'Status:'}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {latestApp.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{lang === 'hi' ? 'प्रबंधकारिणी समीक्षाधीन (Pending Admin Review)' : 'Pending Admin Review'}</span>
                          </span>
                        )}
                        {latestApp.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-trust-green bg-trust-badge px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{lang === 'hi' ? 'स्वीकृत (Approved Member)' : 'Approved Member'}</span>
                          </span>
                        )}
                        {latestApp.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{lang === 'hi' ? 'अस्वीकृत (Rejected)' : 'Rejected'}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {latestApp.status === 'rejected' && latestApp.rejectionReason && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                      <span className="font-bold block mb-1">
                        {lang === 'hi' ? 'अस्वीकृति का कारण:' : 'Reason for Rejection:'}
                      </span>
                      <p>{latestApp.rejectionReason}</p>
                    </div>
                  )}

                  {latestApp.status === 'pending' && (
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">
                          {lang === 'hi' ? 'प्रबंधकारिणी समीक्षा प्रक्रिया जारी है:' : 'Trust Executive Review in Progress:'}
                        </span>
                        <p>
                          {lang === 'hi'
                            ? 'ट्रस्ट के संविधान के अनुसार सभी आवेदन जांच उपरांत व्यवस्थापक द्वारा स्वीकृत किए जाते हैं। अनुमोदन के पश्चात आपकी विशिष्ट सदस्यता संख्या व डिजिटल पहचान पत्र जारी होगा।'
                            : 'In accordance with the Trust constitution, applications are verified by the executive administration. Upon verification, your official Membership ID and Digital ID Card will be issued.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 space-y-3">
                  <p className="text-xs text-[#666666]">
                    {lang === 'hi' ? 'कोई सक्रिय सदस्यता आवेदन नहीं मिला।' : 'No membership application found.'}
                  </p>
                </div>
              )}
            </div>

            {/* Profile Spec */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-white border border-[#E9B44C]/35 shadow-card space-y-3">
                <h3 className="font-extrabold text-sm sm:text-base text-[#382719] border-b border-[#E9B44C]/25 pb-2 font-hindi-heading">
                  {lang === 'hi' ? 'सदस्य प्रोफ़ाइल विवरण' : 'Member Profile Details'}
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-[#666666]">{lang === 'hi' ? 'नाम:' : 'Name:'}</span>
                    <span className="font-bold text-[#382719]">{userProfile?.displayName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-[#666666]">{lang === 'hi' ? 'यूज़रनेम:' : 'Username:'}</span>
                    <span className="font-mono font-bold text-primary">{userProfile?.username || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-[#666666]">{lang === 'hi' ? 'मोबाइल:' : 'Mobile:'}</span>
                    <span className="font-mono font-bold text-[#382719]">{userProfile?.mobile || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-[#666666]">{lang === 'hi' ? 'खाता स्थिति:' : 'Account Status:'}</span>
                    <span className="text-trust-green font-bold uppercase">{userProfile?.accountStatus || 'Active'}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-[#E9B44C]/35 shadow-card space-y-3">
                <h3 className="font-extrabold text-sm sm:text-base text-[#382719] border-b border-[#E9B44C]/25 pb-2 font-hindi-heading">
                  {lang === 'hi' ? 'सदस्यता शुल्क व वैधता' : 'Membership & Validity'}
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-[#666666]">{lang === 'hi' ? 'वार्षिक सदस्यता शुल्क:' : 'Annual Membership Fee:'}</span>
                    <span className="font-bold text-primary">₹200 / {lang === 'hi' ? 'वर्ष' : 'Year'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-[#666666]">{lang === 'hi' ? 'सदस्यता संख्या:' : 'Membership No:'}</span>
                    <span className="font-mono font-bold text-[#382719]">{memberRecord?.membershipNumber || (lang === 'hi' ? 'स्वीकृति प्रतीक्षारत' : 'Pending Approval')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-[#666666]">{lang === 'hi' ? 'वैधता:' : 'Validity:'}</span>
                    <span className="font-bold text-trust-green">{memberRecord?.validUntil || (lang === 'hi' ? '1 वर्ष' : '1 Year')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-[#666666]">{lang === 'hi' ? 'शुल्क स्थिति:' : 'Fee Status:'}</span>
                    <span className="font-bold text-secondary">
                      {memberRecord?.paymentStatus === 'exempted' 
                        ? (lang === 'hi' ? 'छूट (Exempted)' : 'Exempted (₹0)') 
                        : (lang === 'hi' ? 'बैंक सत्यापन उपरांत' : 'Verified via Bank')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Digital ID Card (Only for approved members) */}
        {activeTab === 'card' && (
          <div>
            {isApproved ? (
              <DigitalIdCard member={memberRecord} />
            ) : (
              <div className="p-8 text-center bg-white rounded-3xl border border-[#E9B44C]/35 shadow-card max-w-md mx-auto space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
                <h3 className="font-bold text-[#382719] text-base">
                  {lang === 'hi' ? 'डिजिटल पहचान पत्र अभी उपलब्ध नहीं है' : 'ID Card Not Available Yet'}
                </h3>
                <p className="text-xs text-[#666666] leading-relaxed">
                  {lang === 'hi'
                    ? 'ट्रस्ट नियमावली के अनुसार डिजिटल पहचान पत्र केवल विधिवत स्वीकृत एवं सक्रिय सदस्यों हेतु जारी किया जाता है।'
                    : 'Digital membership cards are generated strictly for verified, approved members.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Payments & Official Receipts */}
        {activeTab === 'payments' && (
          <div className="space-y-6 text-left">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-[#382719] font-hindi-heading">
                  {lang === 'hi' ? 'आपके द्वारा प्रस्तुत भुगतान एवं रसीदें' : 'Submitted Payments & Receipts'}
                </h2>
                <p className="text-xs text-[#666666]">
                  {lang === 'hi' ? 'बैंक द्वारा UTR सत्यापन उपरांत आधिकारिक डिजिटल रसीद सृजित होती है।' : 'Official receipts are generated upon administrative bank verification.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(true)}
                className="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs shadow-saffron transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'hi' ? 'नया UTR दर्ज करें' : 'Submit UTR'}</span>
              </button>
            </div>

            {payments.length > 0 ? (
              <div className="bg-white rounded-3xl border border-[#E9B44C]/35 shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FFF8EF] border-b border-[#E9B44C]/30 text-[#382719] font-black uppercase text-[10px]">
                      <tr>
                        <th className="p-3.5">{lang === 'hi' ? 'दिनांक' : 'Date'}</th>
                        <th className="p-3.5">{lang === 'hi' ? 'उद्देश्य' : 'Purpose'}</th>
                        <th className="p-3.5">{lang === 'hi' ? 'राशि' : 'Amount'}</th>
                        <th className="p-3.5">{lang === 'hi' ? 'UTR संदर्भ' : 'UTR Ref'}</th>
                        <th className="p-3.5">{lang === 'hi' ? 'सत्यापन स्थिति' : 'Status'}</th>
                        <th className="p-3.5 text-right">{lang === 'hi' ? 'रसीद / कार्रवाई' : 'Receipt / Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {payments.map(p => {
                        const dateStr = p.submittedAt?.toDate
                          ? p.submittedAt.toDate().toLocaleDateString('en-IN')
                          : new Date().toLocaleDateString('en-IN');

                        return (
                          <tr key={p.id} className="hover:bg-[#FFF8EF]/30 transition-colors">
                            <td className="p-3.5 text-[#666666] font-mono">{dateStr}</td>
                            <td className="p-3.5 font-bold text-[#382719]">
                              {p.purpose === 'membership_fee' 
                                ? (lang === 'hi' ? 'वार्षिक सदस्यता शुल्क' : 'Annual Membership Fee') 
                                : (lang === 'hi' ? 'समर्पण निधि / दान' : 'Voluntary Donation')}
                            </td>
                            <td className="p-3.5 font-mono font-black text-primary">₹ {p.amount}</td>
                            <td className="p-3.5 font-mono font-bold text-[#454545]">{p.utrNumber}</td>
                            <td className="p-3.5">
                              {p.verificationStatus === 'verified' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-trust-green bg-trust-badge px-2.5 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{lang === 'hi' ? 'सत्यापित (Verified)' : 'Verified'}</span>
                                </span>
                              )}
                              {p.verificationStatus === 'pending_verification' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                                  <Clock className="w-3 h-3" />
                                  <span>{lang === 'hi' ? 'सत्यापन प्रतीक्षारत (Pending)' : 'Pending Verification'}</span>
                                </span>
                              )}
                              {p.verificationStatus === 'rejected' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full">
                                  <XCircle className="w-3 h-3" />
                                  <span>{lang === 'hi' ? 'अस्वीकृत (Rejected)' : 'Rejected'}</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-right">
                              {p.verificationStatus === 'verified' && p.receiptNumber ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedReceipt({
                                    receiptNumber: p.receiptNumber,
                                    payerName: p.payerName,
                                    payerMobile: p.payerMobile,
                                    amount: p.amount,
                                    purpose: p.purpose,
                                    paymentMethod: p.paymentMethod,
                                    utrNumber: p.utrNumber,
                                    issuedAt: p.verifiedAt
                                  })}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold text-xs transition-all"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>{lang === 'hi' ? 'रसीद देखें' : 'View Receipt'}</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-[#888888]">
                                  {p.verificationStatus === 'pending_verification' 
                                    ? (lang === 'hi' ? 'सत्यापन उपरांत उपलब्ध' : 'Available upon verification') 
                                    : (lang === 'hi' ? 'रसीद अनुपलब्ध' : 'Receipt unavailable')}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-3xl border border-[#E9B44C]/35 shadow-card space-y-3">
                <CreditCard className="w-10 h-10 text-[#E9B44C] mx-auto" />
                <p className="text-xs text-[#666666]">
                  {lang === 'hi' ? 'अभी तक कोई भुगतान रिकॉर्ड उपलब्ध नहीं है।' : 'No payment records submitted yet.'}
                </p>
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'hi' ? 'सदस्यता शुल्क / दान UTR दर्ज करें' : 'Submit UTR Details'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Assistance Requests */}
        {activeTab === 'assistance' && (
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#382719] font-hindi-heading">
                {lang === 'hi' ? 'आपके सहायता अनुरोध (Assistance Tracking)' : 'Your Assistance Requests'}
              </h2>
              <p className="text-xs text-[#666666]">
                {lang === 'hi' ? 'यह जानकारी अत्यंत संवेदनशील है तथा केवल आपके एवं ट्रस्ट व्यवस्थापक के मध्य गोपनीय है।' : 'All assistance records are strictly private.'}
              </p>
            </div>

            {assistanceRequests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assistanceRequests.map(req => (
                  <div key={req.id} className="p-5 rounded-3xl bg-white border border-[#E9B44C]/35 shadow-card space-y-3">
                    <div className="flex items-center justify-between border-b border-[#E9B44C]/25 pb-2">
                      <span className="font-mono text-xs font-black text-primary">{req.trackingId}</span>
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-[#FFF8EF] border border-[#E9B44C] text-secondary">
                        {req.category}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="text-[#382719] font-bold">
                        {lang === 'hi' ? 'अपेक्षित राशि:' : 'Amount Needed:'} <span className="font-mono text-primary font-black">₹ {Number(req.amountNeeded).toLocaleString('en-IN')}</span>
                      </p>
                      <p className="text-[#454545] line-clamp-2">
                        {req.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-[10px] text-[#666666]">{lang === 'hi' ? 'समीक्षा स्थिति:' : 'Review Status:'}</span>
                      <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {req.status === 'submitted' ? (lang === 'hi' ? 'समीक्षाधीन (Under Review)' : 'Under Review') : req.status}
                      </span>
                    </div>

                    {req.adminNotes && (
                      <div className="p-2.5 rounded-xl bg-gray-50 text-[11px] text-[#454545]">
                        <span className="font-bold block">{lang === 'hi' ? 'ट्रस्ट टिप्पणी:' : 'Trust Admin Note:'}</span>
                        <p>{req.adminNotes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-3xl border border-[#E9B44C]/35 shadow-card">
                <HandHeart className="w-10 h-10 text-primary mx-auto mb-2" />
                <p className="text-xs text-[#666666]">
                  {lang === 'hi' ? 'आपने कोई सहायता अनुरोध दर्ज नहीं किया है।' : 'No assistance requests found.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Announcements */}
        {activeTab === 'announcements' && (
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#382719] font-hindi-heading">
                {lang === 'hi' ? 'ट्रस्ट आधिकारिक सूचनाएं एवं संदेश' : 'Official Trust Announcements'}
              </h2>
              <p className="text-xs text-[#666666]">
                {lang === 'hi' ? 'गोरखपुर मुख्यालय एवं प्रबंधकारिणी द्वारा जारी सूचनाएं' : 'Messages from the Gorakhpur Trust Executive Council'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {announcements.map(item => (
                <div key={item.id} className="p-5 rounded-3xl bg-white border border-[#E9B44C]/35 shadow-card space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-secondary bg-[#FFF8EF] px-2.5 py-1 rounded-full w-fit border border-[#E9B44C]/40">
                    <Calendar className="w-3 h-3" />
                    <span>{item.publishedAt?.toDate ? item.publishedAt.toDate().toLocaleDateString('en-IN') : 'Official Notice'}</span>
                  </div>
                  <h3 className="font-black text-[#382719] text-sm sm:text-base font-hindi-heading">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#454545] leading-relaxed">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Modals */}
      <OfficialReceiptModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          refreshUserData();
        }}
      />

    </div>
  );
};

export default MemberDashboard;
