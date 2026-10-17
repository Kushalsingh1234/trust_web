import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import TrustLogo from '../components/TrustLogo';
import {
  getAllApplicationsForAdmin,
  approveMembershipApplication,
  rejectMembershipApplication,
  getAllPaymentsForAdmin,
  verifyPaymentRecord,
  rejectPaymentRecord,
  getAllAssistanceRequestsForAdmin,
  updateAssistanceRequestStatus,
  getAllVolunteerApplications,
  updateVolunteerStatus,
  getAllAnnouncementsForAdmin,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getDashboardStats
} from '../firebase/services';
import { initializeMasterAdmin } from '../firebase/adminInit';
import {
  ShieldCheck,
  Users,
  CreditCard,
  HandHeart,
  Megaphone,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  RefreshCw,
  LogOut,
  Home,
  AlertTriangle,
  KeyRound,
  FileText,
  Plus,
  Trash2,
  Lock,
  Building,
  Globe
} from 'lucide-react';

export const AdminDashboard = ({ onNavigateHome }) => {
  const { lang, toggleLanguage } = useLanguage();
  const { currentUser, userProfile, isAdmin, adminPinVerified, verifyPinForSession, logout } = useAuth();

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'applications' | 'payments' | 'assistance' | 'volunteers' | 'announcements' | 'setup'

  // Data states
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [payments, setPayments] = useState([]);
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('all');
  const [appCatFilter, setAppCatFilter] = useState('all');

  const [paySearch, setPaySearch] = useState('');
  const [payStatusFilter, setPayStatusFilter] = useState('all');

  // Modals / Detail Views
  const [selectedApp, setSelectedApp] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingAppId, setRejectingAppId] = useState(null);

  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // Announcement Form
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    category: 'general',
    isPublished: true,
    isFeatured: false
  });

  // Master Setup Form
  const [setupForm, setSetupForm] = useState({
    username: 'admin',
    password: '',
    displayName: 'बजरंगी दूबे (व्यवस्थापक)',
    mobile: '9794590044',
    adminPin: '273016',
    setupSecret: ''
  });
  const [setupResult, setSetupResult] = useState('');

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [st, apps, pays, help, vols, news] = await Promise.all([
        getDashboardStats(),
        getAllApplicationsForAdmin(),
        getAllPaymentsForAdmin(),
        getAllAssistanceRequestsForAdmin(),
        getAllVolunteerApplications(),
        getAllAnnouncementsForAdmin()
      ]);

      setStats(st);
      setApplications(apps);
      setPayments(pays);
      setAssistanceRequests(help);
      setVolunteers(vols);
      setAnnouncements(news);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminPinVerified) {
      loadAllAdminData();
    }
  }, [adminPinVerified]);

  // Handle PIN unlock
  const handleUnlockWithPin = (e) => {
    e.preventDefault();
    if (verifyPinForSession(pinInput)) {
      setPinError('');
      loadAllAdminData();
    } else {
      setPinError(lang === 'hi' ? 'अमान्य सुरक्षा पिन (Invalid Admin PIN).' : 'Invalid Admin Security PIN.');
    }
  };

  // Actions
  const handleApproveApp = async (appId) => {
    const confirmMsg = lang === 'hi' 
      ? "क्या आप इस सदस्यता आवेदन को अनुमोदित करना चाहते हैं?" 
      : "Are you sure you want to approve this membership application?";
    if (!window.confirm(confirmMsg)) return;
    setActionInProgress(true);
    try {
      const result = await approveMembershipApplication(appId, currentUser?.uid || 'admin');
      alert(lang === 'hi' 
        ? `सफलतापूर्वक अनुमोदित! सदस्यता संख्या: ${result.membershipNumber}` 
        : `Successfully approved! Membership Number: ${result.membershipNumber}`);
      await loadAllAdminData();
      setSelectedApp(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleRejectApp = async (appId) => {
    if (!rejectionReason.trim()) {
      alert(lang === 'hi' ? "कृपया अस्वीकृति का कारण दर्ज करें।" : "Please enter reason for rejection.");
      return;
    }
    setActionInProgress(true);
    try {
      await rejectMembershipApplication(appId, rejectionReason, currentUser?.uid || 'admin');
      alert(lang === 'hi' ? "आवेदन अस्वीकृत कर दिया गया है।" : "Application rejected.");
      setRejectingAppId(null);
      setRejectionReason('');
      await loadAllAdminData();
      setSelectedApp(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleVerifyPayment = async (paymentId) => {
    const defaultNotes = lang === 'hi' ? "बैंक ऑफ इंडिया खाता बही से मिलान सत्यापित" : "Verified via Bank of India ledger match";
    const promptMsg = lang === 'hi' ? "सत्यापन टिप्पणी (वैकल्पिक बैंक विवरण दर्ज करें):" : "Verification note (bank confirmation reference):";
    const notes = prompt(promptMsg, defaultNotes);
    if (notes === null) return;

    setActionInProgress(true);
    try {
      const result = await verifyPaymentRecord(paymentId, currentUser?.uid || 'admin', notes);
      alert(lang === 'hi' 
        ? `भुगतान सत्यापित! आधिकारिक रसीद संख्या: ${result.receiptNumber}` 
        : `Payment verified! Official Receipt No: ${result.receiptNumber}`);
      await loadAllAdminData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleRejectPayment = async (paymentId) => {
    const defaultReason = lang === 'hi' ? "बैंक खाते में यह UTR प्रविष्टि प्राप्त नहीं हुई" : "Transaction UTR not found in bank ledger";
    const promptMsg = lang === 'hi' ? "अस्वीकृति का कारण (उदा. बैंक में UTR अनुपलब्ध):" : "Reason for rejection:";
    const reason = prompt(promptMsg, defaultReason);
    if (!reason) return;

    setActionInProgress(true);
    try {
      await rejectPaymentRecord(paymentId, currentUser?.uid || 'admin', reason);
      await loadAllAdminData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleUpdateAssistance = async (id, status) => {
    const defaultNotes = lang === 'hi' ? "समीक्षा उपरांत राहत सामग्री / सहयोग प्रेषित" : "Aid dispatched following review";
    const promptMsg = lang === 'hi' ? "ट्रस्ट समीक्षा टिप्पणी दर्ज करें:" : "Enter review notes:";
    const notes = prompt(promptMsg, defaultNotes);
    if (notes === null) return;
    try {
      await updateAssistanceRequestStatus(id, status, notes, currentUser?.uid || 'admin');
      await loadAllAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateVolunteer = async (id, status) => {
    try {
      await updateVolunteerStatus(id, status);
      await loadAllAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) return;
    setActionInProgress(true);
    try {
      await createAnnouncement(
        newAnnouncement, 
        currentUser?.uid || 'admin', 
        userProfile?.displayName || (lang === 'hi' ? 'ट्रस्ट प्रबंधकारिणी' : 'Trust Executive')
      );
      setNewAnnouncement({ title: '', content: '', category: 'general', isPublished: true, isFeatured: false });
      await loadAllAdminData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    const confirmMsg = lang === 'hi' ? "क्या आप इस सूचना को हटाना चाहते हैं?" : "Are you sure you want to delete this notice?";
    if (!window.confirm(confirmMsg)) return;
    try {
      await deleteAnnouncement(id);
      await loadAllAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSetupMasterAdmin = async (e) => {
    e.preventDefault();
    setSetupResult(lang === 'hi' ? 'प्रक्रियाधीन...' : 'Processing...');
    try {
      await initializeMasterAdmin(setupForm);
      setSetupResult(lang === 'hi' 
        ? 'व्यवस्थापक खाता सफलतापूर्वक स्थापित एवं अधिकृत हो गया है!' 
        : 'Admin account provisioned and authorized successfully!');
      await loadAllAdminData();
    } catch (err) {
      setSetupResult(`${lang === 'hi' ? 'त्रुटि:' : 'Error:'} ${err.message}`);
    }
  };

  // If user is not logged in as admin or PIN not verified
  if (!adminPinVerified) {
    return (
      <div className="min-h-screen bg-[#FFF8EF] flex flex-col justify-center items-center p-3 sm:p-4">
        <div className="bg-white max-w-md w-full p-5 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-primary/40 shadow-2xl text-center space-y-5 sm:space-y-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <Lock className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>

          <div>
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-secondary">
              {lang === 'hi' ? 'गोपनीय प्रशासनिक सुरक्षा' : 'Confidential Administrative Security'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#382719] mt-1 font-hindi-heading">
              {lang === 'hi' ? 'ट्रस्ट व्यवस्थापक सुरक्षा पिन' : 'Trust Admin Security PIN'}
            </h1>
            <p className="text-xs text-[#666666] mt-2">
              {lang === 'hi'
                ? 'प्रशासनिक नियंत्रण कक्ष में प्रवेश हेतु अपना 6-अंकीय अधिकृत एडमिन पिन दर्ज करें।'
                : 'Enter your 6-digit authorized Admin PIN to access the administrative control center.'}
            </p>
          </div>

          <form onSubmit={handleUnlockWithPin} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••••"
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#E9B44C] font-mono tracking-widest text-center text-xl font-bold focus:outline-none focus:border-primary shadow-inner"
              />
              {pinError && <p className="text-xs text-red-600 font-bold mt-2">{pinError}</p>}
            </div>

            <button
              type="submit"
              className="min-h-[44px] w-full py-3 rounded-2xl bg-primary hover:bg-secondary text-white font-bold text-sm shadow-saffron transition-all flex items-center justify-center"
            >
              {lang === 'hi' ? 'प्रशासनिक पोर्टल अनलॉक करें' : 'Unlock Administrative Portal'}
            </button>
          </form>

          <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs text-[#666666]">
            <button
              type="button"
              onClick={onNavigateHome}
              className="hover:text-primary underline min-h-[36px] flex items-center"
            >
              {lang === 'hi' ? '← मुख्य वेबसाइट' : '← Home Website'}
            </button>

            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1 text-[#382719] font-bold hover:text-primary min-h-[36px]"
            >
              <Globe className="w-3.5 h-3.5 text-secondary" />
              <span>{lang === 'hi' ? 'English' : 'हिंदी'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('setup')}
              className="text-secondary font-bold hover:underline min-h-[36px] flex items-center"
            >
              {lang === 'hi' ? 'व्यवस्थापक सेटअप' : 'Admin Setup'}
            </button>
          </div>
        </div>

        {/* Master Setup Panel */}
        {activeTab === 'setup' && (
          <div className="mt-8 bg-white max-w-lg w-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#E9B44C]/40 shadow-card text-left space-y-4">
            <h3 className="font-extrabold text-sm text-[#382719] font-hindi-heading">
              {lang === 'hi' ? 'प्रारंभिक व्यवस्थापक खाता स्थापना' : 'Initial Admin Account Provisioning'}
            </h3>
            <p className="text-xs text-[#666666]">
              {lang === 'hi'
                ? 'ट्रस्ट के अधिकृत मास्टर सेटअप सीक्रेट की द्वारा प्राथमिक एडमिन खाता बनाएं अथवा भूमिका प्रदान करें।'
                : 'Provision an authorized master administrator using the security setup secret.'}
            </p>
            <form onSubmit={handleSetupMasterAdmin} className="space-y-3 text-xs">
              <input
                type="text"
                placeholder={lang === 'hi' ? "व्यवस्थापक यूज़रनेम (उदा. admin)" : "Admin Username (e.g. admin)"}
                value={setupForm.username}
                onChange={(e) => setSetupForm(prev => ({ ...prev, username: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-gray-300"
              />
              <input
                type="password"
                placeholder={lang === 'hi' ? "पासवर्ड (कम से कम 6 अक्षर)" : "Password (min 6 chars)"}
                value={setupForm.password}
                onChange={(e) => setSetupForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-gray-300"
              />
              <input
                type="password"
                placeholder={lang === 'hi' ? "मास्टर सेटअप सीक्रेट की (Master Setup Secret)" : "Master Setup Secret Key"}
                value={setupForm.setupSecret}
                onChange={(e) => setSetupForm(prev => ({ ...prev, setupSecret: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-[#E9B44C]"
              />
              <input
                type="password"
                placeholder="Admin PIN (273016)"
                value={setupForm.adminPin}
                onChange={(e) => setSetupForm(prev => ({ ...prev, adminPin: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-gray-300"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-secondary text-white font-bold"
              >
                {lang === 'hi' ? 'मास्टर एडमिन अधिकृत करें' : 'Authorize Master Admin'}
              </button>
              {setupResult && <p className="text-xs font-bold text-primary mt-2">{setupResult}</p>}
            </form>
          </div>
        )}
      </div>
    );
  }

  // Filtered Applications
  const filteredApps = applications.filter(app => {
    const matchesSearch = !appSearch ||
      app.fullName?.toLowerCase().includes(appSearch.toLowerCase()) ||
      app.applicationRef?.toLowerCase().includes(appSearch.toLowerCase()) ||
      app.mobile?.includes(appSearch);
    const matchesStatus = appStatusFilter === 'all' || app.status === appStatusFilter;
    const matchesCat = appCatFilter === 'all' || app.category === appCatFilter;
    return matchesSearch && matchesStatus && matchesCat;
  });

  // Filtered Payments
  const filteredPayments = payments.filter(p => {
    const matchesSearch = !paySearch ||
      p.payerName?.toLowerCase().includes(paySearch.toLowerCase()) ||
      p.utrNumber?.toLowerCase().includes(paySearch.toLowerCase()) ||
      p.payerMobile?.includes(paySearch);
    const matchesStatus = payStatusFilter === 'all' || p.verificationStatus === payStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#454545] flex flex-col">
      
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-[#382719] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onNavigateHome}
              className="flex items-center gap-2 sm:gap-2.5 group min-w-0 text-left"
            >
              <TrustLogo className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" showText={false} lang={lang} />
              <div className="min-w-0">
                <span className="font-black text-white text-xs sm:text-base tracking-tight font-hindi-heading block leading-tight truncate max-w-[170px] sm:max-w-none">
                  {lang === 'hi' ? 'राष्ट्रीय सनातन संस्कार सेवा संस्थान' : 'Rashtriya Sanatan Sanskar Seva Sansthan'}
                </span>
                <span className="text-[9px] sm:text-[10px] text-[#E9B44C] font-bold uppercase tracking-wider block truncate max-w-[170px] sm:max-w-none">
                  {lang === 'hi' ? 'केन्द्रीय प्रशासनिक नियंत्रण कक्ष (ADMIN PANEL)' : 'CENTRAL ADMINISTRATIVE CONTROL PANEL'}
                </span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* Language Switcher */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="p-2 sm:px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all min-h-[38px]"
              title="Toggle Hindi / English"
            >
              <Globe className="w-4 h-4 text-[#E9B44C]" />
              <span>{lang === 'hi' ? 'English' : 'हिंदी'}</span>
            </button>

            <button
              type="button"
              onClick={loadAllAdminData}
              disabled={loading}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all min-h-[38px]"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{lang === 'hi' ? 'ताज़ा करें' : 'Refresh'}</span>
            </button>

            <button
              type="button"
              onClick={onNavigateHome}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 min-h-[38px]"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">{lang === 'hi' ? 'वेबसाइट देखें' : 'View Site'}</span>
            </button>

            <button
              type="button"
              onClick={logout}
              className="p-2 sm:px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 min-h-[38px]"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{lang === 'hi' ? 'लॉगआउट' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 flex-1 w-full">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E9B44C]/40 mb-6 sm:mb-8 overflow-x-auto no-scrollbar gap-1.5 sm:gap-2 pb-1">
          {[
            { id: 'overview', label: lang === 'hi' ? 'सांख्यिकी अवलोकन (Overview)' : 'Overview & Metrics', icon: ShieldCheck },
            { id: 'applications', label: `${lang === 'hi' ? 'सदस्यता आवेदन' : 'Applications'} (${applications.length})`, icon: Users },
            { id: 'payments', label: `${lang === 'hi' ? 'भुगतान सत्यापन' : 'Payments'} (${payments.filter(p => p.verificationStatus === 'pending_verification').length})`, icon: CreditCard },
            { id: 'assistance', label: `${lang === 'hi' ? 'सहायता अनुरोध' : 'Help Requests'} (${assistanceRequests.length})`, icon: HandHeart },
            { id: 'volunteers', label: `${lang === 'hi' ? 'स्वयंसेवक' : 'Volunteers'} (${volunteers.length})`, icon: Users },
            { id: 'announcements', label: `${lang === 'hi' ? 'सूचना प्रबंधन' : 'Notices'} (${announcements.length})`, icon: Megaphone }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[44px] shrink-0 py-2.5 sm:py-3 px-3.5 sm:px-4 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
                  active
                    ? 'border-primary text-primary bg-[#FFF8EF] rounded-t-lg'
                    : 'border-transparent text-[#666666] hover:text-primary'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview Stats */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-8 text-left">
            <div>
              <h2 className="text-xl font-black text-[#382719] font-hindi-heading">
                {lang === 'hi' ? 'ट्रस्ट प्रबंधकारिणी सांख्यिकी' : 'Trust Executive Council Metrics'}
              </h2>
              <p className="text-xs text-[#666666]">
                {lang === 'hi' ? 'क्लाउड फायरस्टोर से सीधे संकलित प्रामाणिक प्रशासनिक आंकड़े' : 'Real-time verified metrics directly aggregated from Cloud Firestore'}
              </p>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              
              <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#E9B44C]/35 shadow-card">
                <span className="text-[10px] text-[#666666] uppercase font-bold block">
                  {lang === 'hi' ? 'कुल सदस्यता आवेदन' : 'Total Applications'}
                </span>
                <span className="text-xl sm:text-3xl font-black text-[#382719] font-mono mt-1 block">
                  {stats.totalApplications}
                </span>
                <span className="text-[11px] text-amber-700 font-bold block mt-1">
                  {lang === 'hi' ? `प्रतीक्षारत: ${stats.pendingApplications}` : `Pending: ${stats.pendingApplications}`}
                </span>
              </div>

              <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#E9B44C]/35 shadow-card">
                <span className="text-[10px] text-[#666666] uppercase font-bold block">
                  {lang === 'hi' ? 'स्वीकृत सक्रिय सदस्य' : 'Approved Members'}
                </span>
                <span className="text-xl sm:text-3xl font-black text-trust-green font-mono mt-1 block">
                  {stats.approvedMembers}
                </span>
                <span className="text-[11px] text-[#666666] font-semibold block mt-1">
                  {lang === 'hi' ? 'आईडी कार्ड धारक' : 'ID Card Holders'}
                </span>
              </div>

              <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#E9B44C]/35 shadow-card">
                <span className="text-[10px] text-[#666666] uppercase font-bold block">
                  {lang === 'hi' ? 'लंबित भुगतान सत्यापन' : 'Pending UTR Verifications'}
                </span>
                <span className="text-xl sm:text-3xl font-black text-secondary font-mono mt-1 block">
                  {stats.pendingPayments}
                </span>
                <span className="text-[11px] text-primary font-bold block mt-1">
                  {lang === 'hi' ? `सत्यापित: ${stats.verifiedPaymentsCount}` : `Verified: ${stats.verifiedPaymentsCount}`}
                </span>
              </div>

              <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#E9B44C]/35 shadow-card">
                <span className="text-[10px] text-[#666666] uppercase font-bold block">
                  {lang === 'hi' ? 'सत्यापित सदस्यता शुल्क' : 'Verified Membership Fees'}
                </span>
                <span className="text-xl sm:text-3xl font-black text-primary font-mono mt-1 block">
                  ₹ {stats.verifiedMembershipFees.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-[#666666] font-semibold block mt-1 truncate">
                  {lang === 'hi' 
                    ? `समर्पण: ₹ ${stats.verifiedVoluntaryContributions.toLocaleString('en-IN')}` 
                    : `Donations: ₹ ${stats.verifiedVoluntaryContributions.toLocaleString('en-IN')}`}
                </span>
              </div>

              <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#E9B44C]/35 shadow-card">
                <span className="text-[10px] text-[#666666] uppercase font-bold block">
                  {lang === 'hi' ? 'लंबित सहायता अनुरोध' : 'Pending Assistance'}
                </span>
                <span className="text-xl sm:text-3xl font-black text-red-700 font-mono mt-1 block">
                  {stats.pendingAssistanceRequests}
                </span>
                <span className="text-[11px] text-[#666666] font-semibold block mt-1 truncate">
                  {lang === 'hi' ? 'चिकित्सा / विवाह / राशन' : 'Medical / Relief / Education'}
                </span>
              </div>

              <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#E9B44C]/35 shadow-card">
                <span className="text-[10px] text-[#666666] uppercase font-bold block">
                  {lang === 'hi' ? 'पंजीकृत स्वयंसेवक' : 'Registered Volunteers'}
                </span>
                <span className="text-xl sm:text-3xl font-black text-secondary font-mono mt-1 block">
                  {stats.volunteerApplicationsCount}
                </span>
                <span className="text-[11px] text-[#666666] font-semibold block mt-1">
                  {lang === 'hi' ? 'क्षेत्रीय कार्यकर्ता' : 'Field Workers'}
                </span>
              </div>

              <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#E9B44C]/35 shadow-card">
                <span className="text-[10px] text-[#666666] uppercase font-bold block">
                  {lang === 'hi' ? 'अस्वीकृत आवेदन' : 'Rejected Applications'}
                </span>
                <span className="text-xl sm:text-3xl font-black text-gray-500 font-mono mt-1 block">
                  {stats.rejectedApplications}
                </span>
                <span className="text-[11px] text-[#666666] font-semibold block mt-1 truncate">
                  {lang === 'hi' ? 'कारण सहित सुरक्षित' : 'Logged with legal reasons'}
                </span>
              </div>

              <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#E9B44C]/35 shadow-card">
                <span className="text-[10px] text-[#666666] uppercase font-bold block">
                  {lang === 'hi' ? 'फायरबेस सुरक्षा स्थिति' : 'Database Status'}
                </span>
                <span className="text-sm sm:text-base font-black text-trust-green mt-1 block">
                  {lang === 'hi' ? 'सुरक्षित एवं सक्रिय' : 'Active & Synced'}
                </span>
                <span className="text-[11px] text-[#666666] font-semibold block mt-1">
                  Cloud Firestore v2
                </span>
              </div>

            </div>

            {/* Quick Actions */}
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#FFF8EF] border border-[#E9B44C]/40 space-y-3 sm:space-y-4">
              <h3 className="font-extrabold text-sm sm:text-base text-[#382719] font-hindi-heading">
                {lang === 'hi' ? 'व्यवस्थापक त्वरित कार्य' : 'Quick Admin Actions'}
              </h3>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => { setActiveTab('applications'); setAppStatusFilter('pending'); }}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:bg-secondary transition-all flex items-center justify-center"
                >
                  {lang === 'hi' ? `लंबित सदस्यता आवेदन जांचें (${stats.pendingApplications})` : `Review Pending Applications (${stats.pendingApplications})`}
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('payments'); setPayStatusFilter('pending_verification'); }}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-secondary text-white font-bold text-xs shadow-sm hover:bg-primary transition-all flex items-center justify-center"
                >
                  {lang === 'hi' ? `लंबित UTR भुगतान सत्यापित करें (${stats.pendingPayments})` : `Verify Pending Payments (${stats.pendingPayments})`}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('announcements')}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white text-[#382719] border border-[#E9B44C] font-bold text-xs hover:bg-[#FFF8EF] transition-all flex items-center justify-center"
                >
                  {lang === 'hi' ? '+ नई ट्रस्ट सूचना प्रकाशित करें' : '+ Publish New Notice'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Applications Review Table */}
        {activeTab === 'applications' && (
          <div className="space-y-6 text-left">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#382719] font-hindi-heading">
                  {lang === 'hi' ? 'सदस्यता आवेदन प्रबंधन' : 'Membership Application Review'}
                </h2>
                <p className="text-xs text-[#666666]">
                  {lang === 'hi' 
                    ? 'आवेदनों की समीक्षा, विशिष्ट सदस्यता संख्या सृजन व अनुमोदन' 
                    : 'Review applications, assign unique membership IDs, and approve or reject.'}
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder={lang === 'hi' ? "नाम, मोबाइल, संदर्भ संख्या..." : "Name, mobile, ref ID..."}
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 rounded-xl border border-[#E9B44C]/50 text-xs w-48 sm:w-60"
                  />
                </div>

                <select
                  value={appStatusFilter}
                  onChange={(e) => setAppStatusFilter(e.target.value)}
                  className="p-1.5 rounded-xl border border-[#E9B44C]/50 text-xs bg-white"
                >
                  <option value="all">{lang === 'hi' ? 'सभी स्थितियां' : 'All Statuses'}</option>
                  <option value="pending">{lang === 'hi' ? 'लंबित (Pending)' : 'Pending'}</option>
                  <option value="approved">{lang === 'hi' ? 'स्वीकृत (Approved)' : 'Approved'}</option>
                  <option value="rejected">{lang === 'hi' ? 'अस्वीकृत (Rejected)' : 'Rejected'}</option>
                </select>

                <select
                  value={appCatFilter}
                  onChange={(e) => setAppCatFilter(e.target.value)}
                  className="p-1.5 rounded-xl border border-[#E9B44C]/50 text-xs bg-white"
                >
                  <option value="all">{lang === 'hi' ? 'सभी श्रेणियां' : 'All Categories'}</option>
                  <option value="catA">{lang === 'hi' ? 'श्रेणी-क (सहायता)' : 'Cat A (Assistance)'}</option>
                  <option value="catB">{lang === 'hi' ? 'श्रेणी-ख (दानदाता)' : 'Cat B (Donors)'}</option>
                  <option value="catC">{lang === 'hi' ? 'श्रेणी-ग (कार्यकर्ता)' : 'Cat C (Volunteers)'}</option>
                </select>
              </div>
            </div>

            {/* Applications Table */}
            <div className="bg-white rounded-3xl border border-[#E9B44C]/35 shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF8EF] border-b border-[#E9B44C]/30 text-[#382719] font-black uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5">{lang === 'hi' ? 'संदर्भ संख्या' : 'Ref ID'}</th>
                      <th className="p-3.5">{lang === 'hi' ? 'आवेदक का नाम' : 'Applicant Name'}</th>
                      <th className="p-3.5">{lang === 'hi' ? 'श्रेणी' : 'Category'}</th>
                      <th className="p-3.5">{lang === 'hi' ? 'स्थान / ज़िला' : 'Location'}</th>
                      <th className="p-3.5">{lang === 'hi' ? 'मोबाइल' : 'Mobile'}</th>
                      <th className="p-3.5">{lang === 'hi' ? 'स्थिति' : 'Status'}</th>
                      <th className="p-3.5 text-right">{lang === 'hi' ? 'कार्य (Actions)' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredApps.map(app => (
                      <tr key={app.id} className="hover:bg-[#FFF8EF]/30 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-primary">{app.applicationRef}</td>
                        <td className="p-3.5 font-extrabold text-[#382719]">{app.fullName}</td>
                        <td className="p-3.5 font-bold">
                          {app.category === 'catA' 
                            ? (lang === 'hi' ? 'श्रेणी-क (निराश्रित)' : 'Cat A (Beneficiary)') 
                            : app.category === 'catB' 
                            ? (lang === 'hi' ? 'श्रेणी-ख (दानदाता)' : 'Cat B (Donor)') 
                            : (lang === 'hi' ? 'श्रेणी-ग (स्वयंसेवक)' : 'Cat C (Volunteer)')}
                        </td>
                        <td className="p-3.5 text-[#454545]">{app.villageOrLocality}, {app.district}</td>
                        <td className="p-3.5 font-mono text-[#454545]">{app.mobile}</td>
                        <td className="p-3.5">
                          {app.status === 'pending' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              {lang === 'hi' ? 'लंबित' : 'Pending'}
                            </span>
                          )}
                          {app.status === 'approved' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                              {lang === 'hi' ? 'स्वीकृत' : 'Approved'} ({app.membershipNumber})
                            </span>
                          )}
                          {app.status === 'rejected' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                              {lang === 'hi' ? 'अस्वीकृत' : 'Rejected'}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedApp(app)}
                            className="p-1 px-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#382719] font-bold text-[11px]"
                          >
                            {lang === 'hi' ? 'विवरण' : 'Details'}
                          </button>

                          {app.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApproveApp(app.id)}
                                disabled={actionInProgress}
                                className="p-1 px-2.5 rounded-lg bg-trust-green hover:bg-green-700 text-white font-bold text-[11px] shadow-sm"
                              >
                                {lang === 'hi' ? 'अनुमोदन' : 'Approve'}
                              </button>
                              <button
                                type="button"
                                onClick={() => { setRejectingAppId(app.id); setSelectedApp(app); }}
                                className="p-1 px-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px]"
                              >
                                {lang === 'hi' ? 'अस्वीकार' : 'Reject'}
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Payment Verification */}
        {activeTab === 'payments' && (
          <div className="space-y-6 text-left">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#382719] font-hindi-heading">
                  {lang === 'hi' ? 'भुगतान एवं UTR सत्यापन प्रबंधन' : 'Payment & UTR Verification Management'}
                </h2>
                <p className="text-xs text-[#666666]">
                  {lang === 'hi' 
                    ? 'बैंक रिकॉर्ड से मिलान उपरांत रसीद सृजन एवं सत्यापन' 
                    : 'Verify bank transactions and issue downloadable official receipts.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={lang === 'hi' ? "UTR, नाम या मोबाइल..." : "UTR, name or mobile..."}
                  value={paySearch}
                  onChange={(e) => setPaySearch(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#E9B44C]/50 text-xs w-48"
                />
                <select
                  value={payStatusFilter}
                  onChange={(e) => setPayStatusFilter(e.target.value)}
                  className="p-1.5 rounded-xl border border-[#E9B44C]/50 text-xs bg-white"
                >
                  <option value="all">{lang === 'hi' ? 'सभी स्थितियां' : 'All Statuses'}</option>
                  <option value="pending_verification">{lang === 'hi' ? 'सत्यापन प्रतीक्षारत' : 'Pending Verification'}</option>
                  <option value="verified">{lang === 'hi' ? 'सत्यापित (Verified)' : 'Verified'}</option>
                  <option value="rejected">{lang === 'hi' ? 'अस्वीकृत (Rejected)' : 'Rejected'}</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#E9B44C]/35 shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF8EF] border-b border-[#E9B44C]/30 text-[#382719] font-black uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5">{lang === 'hi' ? 'दिनांक' : 'Date'}</th>
                      <th className="p-3.5">{lang === 'hi' ? 'भुगतानकर्ता' : 'Payer'}</th>
                      <th className="p-3.5">{lang === 'hi' ? 'उद्देश्य' : 'Purpose'}</th>
                      <th className="p-3.5">{lang === 'hi' ? 'राशि' : 'Amount'}</th>
                      <th className="p-3.5">{lang === 'hi' ? 'प्रस्तुत UTR संदर्भ' : 'Submitted UTR'}</th>
                      <th className="p-3.5">{lang === 'hi' ? 'सत्यापन स्थिति' : 'Status'}</th>
                      <th className="p-3.5 text-right">{lang === 'hi' ? 'कार्य' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPayments.map(p => (
                      <tr key={p.id} className="hover:bg-[#FFF8EF]/30 transition-colors">
                        <td className="p-3.5 text-[#666666] font-mono">
                          {p.submittedAt?.toDate ? p.submittedAt.toDate().toLocaleDateString('en-IN') : 'N/A'}
                        </td>
                        <td className="p-3.5 font-bold text-[#382719]">
                          {p.payerName}
                          <span className="block text-[10px] text-[#666666] font-mono">{p.payerMobile}</span>
                        </td>
                        <td className="p-3.5 text-[#454545]">
                          {p.purpose === 'membership_fee' 
                            ? (lang === 'hi' ? 'वार्षिक शुल्क' : 'Annual Fee') 
                            : (lang === 'hi' ? 'समर्पण निधि' : 'Donation')}
                        </td>
                        <td className="p-3.5 font-mono font-black text-primary">₹ {p.amount}</td>
                        <td className="p-3.5 font-mono font-bold text-[#382719] bg-amber-50/50 p-1 rounded">
                          {p.utrNumber}
                        </td>
                        <td className="p-3.5">
                          {p.verificationStatus === 'pending_verification' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              {lang === 'hi' ? 'सत्यापन प्रतीक्षारत' : 'Pending'}
                            </span>
                          )}
                          {p.verificationStatus === 'verified' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                              {lang === 'hi' ? 'सत्यापित' : 'Verified'} ({p.receiptNumber})
                            </span>
                          )}
                          {p.verificationStatus === 'rejected' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                              {lang === 'hi' ? 'अस्वीकृत' : 'Rejected'}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {p.verificationStatus === 'pending_verification' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleVerifyPayment(p.id)}
                                disabled={actionInProgress}
                                className="p-1 px-3 rounded-lg bg-trust-green hover:bg-green-700 text-white font-bold text-[11px]"
                              >
                                {lang === 'hi' ? 'बैंक मिलान व रसीद जारी करें' : 'Verify & Issue Receipt'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectPayment(p.id)}
                                className="p-1 px-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px]"
                              >
                                {lang === 'hi' ? 'अस्वीकार' : 'Reject'}
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Assistance Requests */}
        {activeTab === 'assistance' && (
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-xl font-black text-[#382719] font-hindi-heading">
                {lang === 'hi' ? 'गोपनीय सहायता अनुरोध' : 'Confidential Assistance Requests'}
              </h2>
              <p className="text-xs text-[#666666]">
                {lang === 'hi' 
                  ? 'निराश्रित एवं आर्थिक रूप से कमज़ोर परिवारों के सहायता आवेदन' 
                  : 'Private assistance requests from economically disadvantaged applicants'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assistanceRequests.map(req => (
                <div key={req.id} className="p-6 rounded-3xl bg-white border border-[#E9B44C]/35 shadow-card space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E9B44C]/25 pb-2">
                    <span className="font-mono text-xs font-black text-primary">{req.trackingId}</span>
                    <span className="text-[10px] font-bold bg-[#FFF8EF] border border-[#E9B44C] px-2.5 py-0.5 rounded-full text-secondary uppercase">
                      {req.category}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <p className="font-bold text-[#382719] text-sm">{req.fullName}</p>
                    <p className="text-[#666666]">{lang === 'hi' ? 'पिता / पति:' : 'Father / Husband:'} {req.fatherHusbandName || 'N/A'}</p>
                    <p className="text-[#666666]">{lang === 'hi' ? 'मोबाइल:' : 'Mobile:'} <span className="font-mono text-[#382719] font-bold">{req.mobile}</span></p>
                    <p className="text-[#666666]">{lang === 'hi' ? 'स्थान:' : 'Location:'} {req.location}, {req.cityDistrict}</p>
                    <p className="font-bold text-primary">
                      {lang === 'hi' ? 'अपेक्षित राशि:' : 'Amount Needed:'} <span className="font-mono text-base">₹ {Number(req.amountNeeded).toLocaleString('en-IN')}</span>
                    </p>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 mt-2">
                      <span className="font-bold text-[#382719] block mb-1">{lang === 'hi' ? 'कारण / आवश्यकता विवरण:' : 'Description of Need:'}</span>
                      <p className="text-[#454545] leading-relaxed">{req.description}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700">
                      {lang === 'hi' ? `स्थिति: ${req.status}` : `Status: ${req.status}`}
                    </span>

                    <div className="space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateAssistance(req.id, 'approved')}
                        className="p-1 px-3 rounded-lg bg-trust-green text-white font-bold text-xs"
                      >
                        {lang === 'hi' ? 'अनुमोदित' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateAssistance(req.id, 'assistance_provided')}
                        className="p-1 px-3 rounded-lg bg-primary text-white font-bold text-xs"
                      >
                        {lang === 'hi' ? 'सहायता प्रदत्त' : 'Dispatched'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateAssistance(req.id, 'rejected')}
                        className="p-1 px-2.5 rounded-lg bg-red-600 text-white font-bold text-xs"
                      >
                        {lang === 'hi' ? 'अस्वीकृत' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Volunteer Applications */}
        {activeTab === 'volunteers' && (
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-xl font-black text-[#382719] font-hindi-heading">
                {lang === 'hi' ? 'सनातन स्वयंसेवक एवं कार्यकर्ता सूची' : 'Volunteer Applications & Availability'}
              </h2>
              <p className="text-xs text-[#666666]">
                {lang === 'hi' ? 'अभियानों एवं शिविरों हेतु पंजीकृत समर्पित स्वयंसेवक' : 'Volunteers registered for cultural and community campaigns'}
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-[#E9B44C]/35 shadow-card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF8EF] border-b border-[#E9B44C]/30 text-[#382719] font-black uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">{lang === 'hi' ? 'नाम' : 'Name'}</th>
                    <th className="p-3.5">{lang === 'hi' ? 'मोबाइल' : 'Mobile'}</th>
                    <th className="p-3.5">{lang === 'hi' ? 'ज़िला' : 'District'}</th>
                    <th className="p-3.5">{lang === 'hi' ? 'उपलब्धता' : 'Availability'}</th>
                    <th className="p-3.5">{lang === 'hi' ? 'पसंदीदा कार्यक्षेत्र' : 'Preferred Areas'}</th>
                    <th className="p-3.5">{lang === 'hi' ? 'स्थिति' : 'Status'}</th>
                    <th className="p-3.5 text-right">{lang === 'hi' ? 'कार्य' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {volunteers.map(v => (
                    <tr key={v.id} className="hover:bg-[#FFF8EF]/30">
                      <td className="p-3.5 font-bold text-[#382719]">{v.fullName}</td>
                      <td className="p-3.5 font-mono text-[#382719]">{v.mobile}</td>
                      <td className="p-3.5 text-[#454545]">{v.cityOrDistrict}</td>
                      <td className="p-3.5 text-[#454545]">{v.availability}</td>
                      <td className="p-3.5 text-[11px] text-[#454545]">
                        {v.preferredAreas?.join(', ') || 'Vedic Camps'}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {v.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateVolunteer(v.id, 'contacted')}
                          className="p-1 px-2.5 rounded-lg bg-secondary text-white font-bold text-[11px]"
                        >
                          {lang === 'hi' ? 'संपर्क हुआ' : 'Contacted'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateVolunteer(v.id, 'approved')}
                          className="p-1 px-2.5 rounded-lg bg-trust-green text-white font-bold text-[11px]"
                        >
                          {lang === 'hi' ? 'स्वीकृत' : 'Approve'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 6: Announcements Management */}
        {activeTab === 'announcements' && (
          <div className="space-y-8 text-left">
            <div>
              <h2 className="text-xl font-black text-[#382719] font-hindi-heading">
                {lang === 'hi' ? 'सार्वजनिक सूचना एवं दैनिक संदेश प्रबंधन' : 'Public Announcements Management'}
              </h2>
              <p className="text-xs text-[#666666]">
                {lang === 'hi' 
                  ? 'वेबसाइट पर प्रदर्शित होने वाली आधिकारिक घोषणाएं एवं समाचार' 
                  : 'Official announcements and notices displayed publicly on the landing page'}
              </p>
            </div>

            {/* Create Announcement Form */}
            <form onSubmit={handleCreateAnnouncement} className="p-6 rounded-3xl bg-white border border-[#E9B44C]/35 shadow-card space-y-4">
              <h3 className="font-extrabold text-sm text-[#382719] font-hindi-heading">
                {lang === 'hi' ? '+ नई सूचना प्रकाशित करें' : '+ Publish New Announcement'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'सूचना शीर्षक *' : 'Notice Title *'}
                  </label>
                  <input
                    type="text"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={lang === 'hi' ? "उदा. निःशुल्क षोडश संस्कार जागरण शिविर • गोरखपुर" : "e.g. Free 16 Vedic Sanskar Camp, Gorakhpur"}
                    className="w-full px-3 py-2 rounded-xl border border-[#E9B44C]/50 text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'सूचना का विवरण एवं संदेश *' : 'Notice Content & Description *'}
                  </label>
                  <textarea
                    rows={3}
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                    placeholder={lang === 'hi' ? "विस्तृत विवरण एवं स्थान..." : "Detailed message and location..."}
                    className="w-full px-3 py-2 rounded-xl border border-[#E9B44C]/50 text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAnnouncement.isPublished}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, isPublished: e.target.checked }))}
                    className="h-4 w-4 rounded text-primary"
                  />
                  <span className="font-bold text-[#382719]">
                    {lang === 'hi' ? 'तुरंत सार्वजनिक रूप से प्रकाशित करें' : 'Publish live immediately'}
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={actionInProgress}
                  className="px-6 py-2 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs shadow-saffron transition-all"
                >
                  {lang === 'hi' ? 'प्रकाशित करें' : 'Publish Notice'}
                </button>
              </div>
            </form>

            {/* List of Announcements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {announcements.map(item => (
                <div key={item.id} className="p-5 rounded-3xl bg-white border border-[#E9B44C]/35 shadow-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {item.isPublished 
                        ? (lang === 'hi' ? 'सार्वजनिक रूप से लाइव' : 'Live on Site') 
                        : (lang === 'hi' ? 'अप्रकाशित ड्राफ्ट' : 'Draft')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteAnnouncement(item.id)}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="font-extrabold text-[#382719] text-sm">{item.title}</h4>
                  <p className="text-xs text-[#454545]">{item.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Detail & Rejection Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-[#E9B44C] space-y-4 text-left my-auto sm:my-8 max-h-[94vh] flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2 flex-shrink-0">
              <h3 className="font-black text-base text-[#382719] font-hindi-heading">
                {lang === 'hi' ? 'आवेदन पूर्ण विवरण' : 'Full Application Details'}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs flex-1 overflow-y-auto">
              <p><strong>{lang === 'hi' ? 'संदर्भ:' : 'Reference:'}</strong> <span className="font-mono text-primary font-bold">{selectedApp.applicationRef}</span></p>
              <p><strong>{lang === 'hi' ? 'नाम:' : 'Name:'}</strong> {selectedApp.fullName}</p>
              <p><strong>{lang === 'hi' ? 'पिता / पति:' : 'Father / Husband:'}</strong> {selectedApp.fatherHusbandName}</p>
              <p><strong>{lang === 'hi' ? 'मोबाइल:' : 'Mobile:'}</strong> {selectedApp.mobile}</p>
              <p><strong>{lang === 'hi' ? 'ग्राम / वार्ड:' : 'Locality:'}</strong> {selectedApp.villageOrLocality}</p>
              <p><strong>{lang === 'hi' ? 'डाकघर:' : 'Post Office:'}</strong> {selectedApp.postOffice || 'N/A'}</p>
              <p><strong>{lang === 'hi' ? 'ज़िला व राज्य:' : 'District & State:'}</strong> {selectedApp.district}, {selectedApp.state}</p>
              <p><strong>{lang === 'hi' ? 'श्रेणी:' : 'Category:'}</strong> {selectedApp.category}</p>
              <p><strong>{lang === 'hi' ? 'स्थिति:' : 'Status:'}</strong> <span className="font-bold uppercase text-amber-700">{selectedApp.status}</span></p>
            </div>

            {rejectingAppId === selectedApp.id ? (
              <div className="pt-3 border-t space-y-2 flex-shrink-0">
                <label className="block text-xs font-bold text-red-700">
                  {lang === 'hi' ? 'अस्वीकृति का वैधानिक कारण:' : 'Mandatory Rejection Reason:'}
                </label>
                <textarea
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={lang === 'hi' ? "उदा. अपूर्ण पता अथवा नियमों के अनुसार पात्रता नहीं पाई गई..." : "e.g. Incomplete address or eligibility criteria..."}
                  className="w-full p-2.5 border rounded-xl text-xs"
                />
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectingAppId(null)}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-bold"
                  >
                    {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectApp(selectedApp.id)}
                    className="min-h-[40px] px-4 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs"
                  >
                    {lang === 'hi' ? 'अस्वीकार करें' : 'Confirm Reject'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="min-h-[40px] px-4 py-1.5 rounded-xl border text-xs font-bold"
                >
                  {lang === 'hi' ? 'बंद करें' : 'Close'}
                </button>
                {selectedApp.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setRejectingAppId(selectedApp.id)}
                      className="min-h-[40px] px-4 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs"
                    >
                      {lang === 'hi' ? 'अस्वीकार करें' : 'Reject'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveApp(selectedApp.id)}
                      className="min-h-[40px] px-5 py-1.5 rounded-xl bg-trust-green text-white font-bold text-xs shadow-sm"
                    >
                      {lang === 'hi' ? 'अनुमोदन करें' : 'Approve'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
