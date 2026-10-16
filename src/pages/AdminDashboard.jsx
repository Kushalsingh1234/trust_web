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
  Building
} from 'lucide-react';

export const AdminDashboard = ({ onNavigateHome }) => {
  const { lang } = useLanguage();
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
    if (!window.confirm("क्या आप इस सदस्यता आवेदन को अनुमोदित करना चाहते हैं?")) return;
    setActionInProgress(true);
    try {
      const result = await approveMembershipApplication(appId, currentUser?.uid || 'admin');
      setActionMsg(`सफलतापूर्वक अनुमोदित! सदस्यता संख्या: ${result.membershipNumber}`);
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
      alert("कृपया अस्वीकृति का कारण दर्ज करें।");
      return;
    }
    setActionInProgress(true);
    try {
      await rejectMembershipApplication(appId, rejectionReason, currentUser?.uid || 'admin');
      setActionMsg("आवेदन अस्वीकृत कर दिया गया है।");
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
    const notes = prompt("सत्यापन टिप्पणी (वैकल्पिक बैंक विवरण दर्ज करें):", "Verified via Bank of India ledger match");
    if (notes === null) return;

    setActionInProgress(true);
    try {
      const result = await verifyPaymentRecord(paymentId, currentUser?.uid || 'admin', notes);
      alert(`भुगतान सत्यापित! आधिकारिक रसीद संख्या: ${result.receiptNumber}`);
      await loadAllAdminData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleRejectPayment = async (paymentId) => {
    const reason = prompt("अस्वीकृति का कारण (उदा. बैंक में UTR अनुपलब्ध):", "बैंक खाते में यह UTR प्रविष्टि प्राप्त नहीं हुई");
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
    const notes = prompt("ट्रस्ट समीक्षा टिप्पणी दर्ज करें:", "समीक्षा उपरांत राहत सामग्री / सहयोग प्रेषित");
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
      await createAnnouncement(newAnnouncement, currentUser?.uid || 'admin', userProfile?.displayName || 'ट्रस्ट प्रबंधकारिणी');
      setNewAnnouncement({ title: '', content: '', category: 'general', isPublished: true, isFeatured: false });
      await loadAllAdminData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("क्या आप इस सूचना को हटाना चाहते हैं?")) return;
    try {
      await deleteAnnouncement(id);
      await loadAllAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSetupMasterAdmin = async (e) => {
    e.preventDefault();
    setSetupResult('प्रक्रियाधीन...');
    try {
      await initializeMasterAdmin(setupForm);
      setSetupResult('व्यवस्थापक खाता सफलतापूर्वक स्थापित एवं अधिकृत हो गया है!');
      await loadAllAdminData();
    } catch (err) {
      setSetupResult(`त्रुटि: ${err.message}`);
    }
  };

  // If user is not logged in as admin or PIN not verified
  if (!adminPinVerified) {
    return (
      <div className="min-h-screen bg-[#FFF8EF] flex flex-col justify-center items-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-3xl border-2 border-primary/40 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-wider text-secondary">
              गोपनीय प्रशासनिक सुरक्षा
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#382719] mt-1 font-hindi-heading">
              ट्रस्ट व्यवस्थापक सुरक्षा पिन
            </h1>
            <p className="text-xs text-[#666666] mt-2">
              प्रशासनिक नियंत्रण कक्ष में प्रवेश हेतु अपना 6-अंकीय अधिकृत एडमिन पिन दर्ज करें।
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
              className="w-full py-3 rounded-2xl bg-primary hover:bg-secondary text-white font-bold text-sm shadow-saffron transition-all"
            >
              प्रशासनिक पोर्टल अनलॉक करें
            </button>
          </form>

          <div className="pt-2 border-t border-gray-100 flex justify-between text-xs text-[#666666]">
            <button
              type="button"
              onClick={onNavigateHome}
              className="hover:text-primary underline"
            >
              ← मुख्य वेबसाइट
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('setup')}
              className="text-secondary font-bold hover:underline"
            >
              व्यवस्थापक सेटअप टूल
            </button>
          </div>
        </div>

        {/* Master Setup Panel (if needed for initial trust setup) */}
        {activeTab === 'setup' && (
          <div className="mt-8 bg-white max-w-lg w-full p-6 rounded-3xl border border-[#E9B44C]/40 shadow-card text-left space-y-4">
            <h3 className="font-extrabold text-sm text-[#382719] font-hindi-heading">
              प्रारंभिक व्यवस्थापक खाता स्थापना (Initial Admin Provisioning)
            </h3>
            <p className="text-xs text-[#666666]">
              ट्रस्ट के अधिकृत मास्टर सेटअप सीक्रेट की द्वारा प्राथमिक एडमिन खाता बनाएं अथवा भूमिका प्रदान करें।
            </p>
            <form onSubmit={handleSetupMasterAdmin} className="space-y-3 text-xs">
              <input
                type="text"
                placeholder="व्यवस्थापक यूज़रनेम (उदा. admin)"
                value={setupForm.username}
                onChange={(e) => setSetupForm(prev => ({ ...prev, username: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-gray-300"
              />
              <input
                type="password"
                placeholder="पासवर्ड (कम से कम 6 अक्षर)"
                value={setupForm.password}
                onChange={(e) => setSetupForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-gray-300"
              />
              <input
                type="password"
                placeholder="मास्टर सेटअप सीक्रेट की (Master Setup Secret)"
                value={setupForm.setupSecret}
                onChange={(e) => setSetupForm(prev => ({ ...prev, setupSecret: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-[#E9B44C]"
              />
              <input
                type="password"
                placeholder="एडमिन पिन (273016)"
                value={setupForm.adminPin}
                onChange={(e) => setSetupForm(prev => ({ ...prev, adminPin: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-gray-300"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-secondary text-white font-bold"
              >
                मास्टर एडमिन अधिकृत करें
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateHome}
              className="flex items-center gap-2.5 group"
            >
              <TrustLogo className="w-9 h-9 sm:w-10 sm:h-10" showText={false} lang={lang} />
              <div className="text-left">
                <span className="font-black text-white text-sm sm:text-base tracking-tight font-hindi-heading block leading-tight">
                  राष्ट्रीय सनातन संस्कार सेवा संस्थान
                </span>
                <span className="text-[10px] text-[#E9B44C] font-bold uppercase tracking-wider">
                  केन्द्रीय प्रशासनिक नियंत्रण कक्ष (ADMIN PANEL)
                </span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadAllAdminData}
              disabled={loading}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">ताज़ा करें</span>
            </button>

            <button
              type="button"
              onClick={onNavigateHome}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">वेबसाइट देखें</span>
            </button>

            <button
              type="button"
              onClick={logout}
              className="p-2 sm:px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">लॉगआउट</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E9B44C]/40 mb-8 overflow-x-auto gap-2">
          {[
            { id: 'overview', label: 'सांख्यिकी अवलोकन (Overview)', icon: ShieldCheck },
            { id: 'applications', label: `सदस्यता आवेदन (${applications.length})`, icon: Users },
            { id: 'payments', label: `भुगतान सत्यापन (${payments.filter(p => p.verificationStatus === 'pending_verification').length})`, icon: CreditCard },
            { id: 'assistance', label: `सहायता अनुरोध (${assistanceRequests.length})`, icon: HandHeart },
            { id: 'volunteers', label: `स्वयंसेवक (${volunteers.length})`, icon: Users },
            { id: 'announcements', label: `सूचना प्रबंधन (${announcements.length})`, icon: Megaphone }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 flex items-center gap-2 transition-all ${
                  active
                    ? 'border-primary text-primary bg-[#FFF8EF]'
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
                ट्रस्ट प्रबंधकारिणी सांख्यिकी (Real-time Trust Metrics)
              </h2>
              <p className="text-xs text-[#666666]">
                क्लाउड फायरस्टोर से सीधे संकलित प्रामाणिक प्रशासनिक आंकड़े
              </p>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              
              <div className="p-5 rounded-3xl bg-white border border-[#E9B44C]/35 shadow-card">
                <span className="text-[10px] text-[#666666] uppercase font-bold block">कुल सदस्यता आवेदन</span>
                <span className="text-2xl sm:text-3xl font-black text-[#382719] font-mono mt-1 block">
                  {stats.totalApplications}
                </span>
                <span className="text-[11px] text-amber-700 font-bold block mt-1">
                  प्रतीक्षारत: {stats.pendingApplications}
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-[#E9B44C]/35 shadow-card">
                <span className="text-[10px] text-[#666666] uppercase font-bold block">स्वीकृत सक्रिय सदस्य</span>
                <span className="text-2xl sm:text-3xl font-black text-trust-green font-mono mt-1 block">
                  {stats.approvedMembers}
                </span>
                <span className="text-[11px] text-[#666666] font-semibold block mt-1">
                  आईडी कार्ड धारक
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-[#E9B44C]/35 shadow-card">
                <span className="text-[10px] text-[#666666] uppercase font-bold block">लंबित भुगतान सत्यापन</span>
                <span className="text-2xl sm:text-3xl font-black text-secondary font-mono mt-1 block">
                  {stats.pendingPayments}
                </span>
                <span className="text-[11px] text-primary font-bold block mt-1">
                  सत्यापित: {stats.verifiedPaymentsCount}
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-[#E9B44C]/35 shadow-card">
                <span className="text-[10px] text-[#666666] uppercase font-bold block">सत्यापित सदस्यता शुल्क</span>
                <span className="text-2xl sm:text-3xl font-black text-primary font-mono mt-1 block">
                  ₹ {stats.verifiedMembershipFees.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-[#666666] font-semibold block mt-1">
                  समर्पण: ₹ {stats.verifiedVoluntaryContributions.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-[#E9B44C]/35 shadow-card">
                <span className="text-[10px] text-[#666666] uppercase font-bold block">लंबित सहायता अनुरोध</span>
                <span className="text-2xl sm:text-3xl font-black text-red-700 font-mono mt-1 block">
                  {stats.pendingAssistanceRequests}
                </span>
                <span className="text-[11px] text-[#666666] font-semibold block mt-1">
                  चिकित्सा / विवाह / राशन
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-[#E9B44C]/35 shadow-card">
                <span className="text-[10px] text-[#666666] uppercase font-bold block">पंजीकृत स्वयंसेवक</span>
                <span className="text-2xl sm:text-3xl font-black text-secondary font-mono mt-1 block">
                  {stats.volunteerApplicationsCount}
                </span>
                <span className="text-[11px] text-[#666666] font-semibold block mt-1">
                  क्षेत्रीय कार्यकर्ता
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-[#E9B44C]/35 shadow-card">
                <span className="text-[10px] text-[#666666] uppercase font-bold block">अस्वीकृत आवेदन</span>
                <span className="text-2xl sm:text-3xl font-black text-gray-500 font-mono mt-1 block">
                  {stats.rejectedApplications}
                </span>
                <span className="text-[11px] text-[#666666] font-semibold block mt-1">
                  कारण सहित रिकॉर्ड सुरक्षित
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-[#E9B44C]/35 shadow-card">
                <span className="text-[10px] text-[#666666] uppercase font-bold block">फायरबेस सुरक्षा स्थिति</span>
                <span className="text-base font-black text-trust-green mt-1 block">
                  सुरक्षित एवं सक्रिय
                </span>
                <span className="text-[11px] text-[#666666] font-semibold block mt-1">
                  Firestore Rules v2 Active
                </span>
              </div>

            </div>

            {/* Quick Actions */}
            <div className="p-6 rounded-3xl bg-[#FFF8EF] border border-[#E9B44C]/40 space-y-4">
              <h3 className="font-extrabold text-sm sm:text-base text-[#382719] font-hindi-heading">
                व्यवस्थापक त्वरित कार्य (Quick Actions)
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => { setActiveTab('applications'); setAppStatusFilter('pending'); }}
                  className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:bg-secondary transition-all"
                >
                  लंबित सदस्यता आवेदन जांचें ({stats.pendingApplications})
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('payments'); setPayStatusFilter('pending_verification'); }}
                  className="px-4 py-2.5 rounded-xl bg-secondary text-white font-bold text-xs shadow-sm hover:bg-primary transition-all"
                >
                  लंबित UTR भुगतान सत्यापित करें ({stats.pendingPayments})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('announcements')}
                  className="px-4 py-2.5 rounded-xl bg-white text-[#382719] border border-[#E9B44C] font-bold text-xs hover:bg-[#FFF8EF] transition-all"
                >
                  + नई ट्रस्ट सूचना प्रकाशित करें
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
                  सदस्यता आवेदन प्रबंधन
                </h2>
                <p className="text-xs text-[#666666]">
                  आवेदनों की समीक्षा, विशिष्ट सदस्यता संख्या सृजन व अनुमोदन
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="नाम, मोबाइल, संदर्भ संख्या..."
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
                  <option value="all">सभी स्थितियां</option>
                  <option value="pending">लंबित (Pending)</option>
                  <option value="approved">स्वीकृत (Approved)</option>
                  <option value="rejected">अस्वीकृत (Rejected)</option>
                </select>

                <select
                  value={appCatFilter}
                  onChange={(e) => setAppCatFilter(e.target.value)}
                  className="p-1.5 rounded-xl border border-[#E9B44C]/50 text-xs bg-white"
                >
                  <option value="all">सभी श्रेणियां</option>
                  <option value="catA">श्रेणी-क (सहायता)</option>
                  <option value="catB">श्रेणी-ख (दानदाता)</option>
                  <option value="catC">श्रेणी-ग (कार्यकर्ता)</option>
                </select>
              </div>
            </div>

            {/* Applications Table */}
            <div className="bg-white rounded-3xl border border-[#E9B44C]/35 shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF8EF] border-b border-[#E9B44C]/30 text-[#382719] font-black uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5">संदर्भ संख्या</th>
                      <th className="p-3.5">आवेदक का नाम</th>
                      <th className="p-3.5">श्रेणी</th>
                      <th className="p-3.5">स्थान / ज़िला</th>
                      <th className="p-3.5">मोबाइल</th>
                      <th className="p-3.5">स्थिति</th>
                      <th className="p-3.5 text-right">कार्य (Actions)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredApps.map(app => (
                      <tr key={app.id} className="hover:bg-[#FFF8EF]/30 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-primary">{app.applicationRef}</td>
                        <td className="p-3.5 font-extrabold text-[#382719]">{app.fullName}</td>
                        <td className="p-3.5 font-bold">
                          {app.category === 'catA' ? 'श्रेणी-क (निराश्रित)' : app.category === 'catB' ? 'श्रेणी-ख (दानदाता)' : 'श्रेणी-ग (स्वयंसेवक)'}
                        </td>
                        <td className="p-3.5 text-[#454545]">{app.villageOrLocality}, {app.district}</td>
                        <td className="p-3.5 font-mono text-[#454545]">{app.mobile}</td>
                        <td className="p-3.5">
                          {app.status === 'pending' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              लंबित
                            </span>
                          )}
                          {app.status === 'approved' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                              स्वीकृत ({app.membershipNumber})
                            </span>
                          )}
                          {app.status === 'rejected' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                              अस्वीकृत
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedApp(app)}
                            className="p-1 px-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#382719] font-bold text-[11px]"
                          >
                            विवरण
                          </button>

                          {app.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApproveApp(app.id)}
                                disabled={actionInProgress}
                                className="p-1 px-2.5 rounded-lg bg-trust-green hover:bg-green-700 text-white font-bold text-[11px] shadow-sm"
                              >
                                अनुमोदन
                              </button>
                              <button
                                type="button"
                                onClick={() => { setRejectingAppId(app.id); setSelectedApp(app); }}
                                className="p-1 px-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px]"
                              >
                                अस्वीकार
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
                  भुगतान एवं UTR सत्यापन प्रबंधन
                </h2>
                <p className="text-xs text-[#666666]">
                  बैंक रिकॉर्ड से मिलान उपरांत रसीद सृजन एवं सत्यापन
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="UTR, नाम या मोबाइल..."
                  value={paySearch}
                  onChange={(e) => setPaySearch(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#E9B44C]/50 text-xs w-48"
                />
                <select
                  value={payStatusFilter}
                  onChange={(e) => setPayStatusFilter(e.target.value)}
                  className="p-1.5 rounded-xl border border-[#E9B44C]/50 text-xs bg-white"
                >
                  <option value="all">सभी स्थितियां</option>
                  <option value="pending_verification">सत्यापन प्रतीक्षारत</option>
                  <option value="verified">सत्यापित (Verified)</option>
                  <option value="rejected">अस्वीकृत (Rejected)</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#E9B44C]/35 shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF8EF] border-b border-[#E9B44C]/30 text-[#382719] font-black uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5">दिनांक</th>
                      <th className="p-3.5">भुगतानकर्ता</th>
                      <th className="p-3.5">उद्देश्य</th>
                      <th className="p-3.5">राशि</th>
                      <th className="p-3.5">प्रस्तुत UTR संदर्भ</th>
                      <th className="p-3.5">सत्यापन स्थिति</th>
                      <th className="p-3.5 text-right">कार्य</th>
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
                          {p.purpose === 'membership_fee' ? 'वार्षिक शुल्क' : 'समर्पण निधि'}
                        </td>
                        <td className="p-3.5 font-mono font-black text-primary">₹ {p.amount}</td>
                        <td className="p-3.5 font-mono font-bold text-[#382719] bg-amber-50/50 p-1 rounded">
                          {p.utrNumber}
                        </td>
                        <td className="p-3.5">
                          {p.verificationStatus === 'pending_verification' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              सत्यापन प्रतीक्षारत
                            </span>
                          )}
                          {p.verificationStatus === 'verified' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                              सत्यापित ({p.receiptNumber})
                            </span>
                          )}
                          {p.verificationStatus === 'rejected' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                              अस्वीकृत
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
                                बैंक मिलान व रसीद जारी करें
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectPayment(p.id)}
                                className="p-1 px-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px]"
                              >
                                अस्वीकार
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
                गोपनीय सहायता अनुरोध (Assistance Beneficiary Management)
              </h2>
              <p className="text-xs text-[#666666]">
                निराश्रित एवं आर्थिक रूप से कमज़ोर परिवारों के सहायता आवेदन
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
                    <p className="text-[#666666]">पिता / पति: {req.fatherHusbandName || 'N/A'}</p>
                    <p className="text-[#666666]">मोबाइल: <span className="font-mono text-[#382719] font-bold">{req.mobile}</span></p>
                    <p className="text-[#666666]">स्थान: {req.location}, {req.cityDistrict}</p>
                    <p className="font-bold text-primary">
                      अपेक्षित राशि: <span className="font-mono text-base">₹ {Number(req.amountNeeded).toLocaleString('en-IN')}</span>
                    </p>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 mt-2">
                      <span className="font-bold text-[#382719] block mb-1">कारण / आवश्यकता विवरण:</span>
                      <p className="text-[#454545] leading-relaxed">{req.description}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700">
                      स्थिति: {req.status}
                    </span>

                    <div className="space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateAssistance(req.id, 'approved')}
                        className="p-1 px-3 rounded-lg bg-trust-green text-white font-bold text-xs"
                      >
                        अनुमोदित
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateAssistance(req.id, 'assistance_provided')}
                        className="p-1 px-3 rounded-lg bg-primary text-white font-bold text-xs"
                      >
                        सहायता प्रदत्त
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateAssistance(req.id, 'rejected')}
                        className="p-1 px-2.5 rounded-lg bg-red-600 text-white font-bold text-xs"
                      >
                        अस्वीकृत
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
                सनातन स्वयंसेवक एवं कार्यकर्ता सूची
              </h2>
              <p className="text-xs text-[#666666]">
                अभियानों एवं शिविरों हेतु पंजीकृत समर्पित स्वयंसेवक
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-[#E9B44C]/35 shadow-card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF8EF] border-b border-[#E9B44C]/30 text-[#382719] font-black uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">नाम</th>
                    <th className="p-3.5">मोबाइल</th>
                    <th className="p-3.5">ज़िला</th>
                    <th className="p-3.5">उपलब्धता</th>
                    <th className="p-3.5">पसंदीदा कार्यक्षेत्र</th>
                    <th className="p-3.5">स्थिति</th>
                    <th className="p-3.5 text-right">कार्य</th>
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
                          संपर्क हुआ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateVolunteer(v.id, 'approved')}
                          className="p-1 px-2.5 rounded-lg bg-trust-green text-white font-bold text-[11px]"
                        >
                          स्वीकृत
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
                सार्वजनिक सूचना एवं दैनिक संदेश प्रबंधन
              </h2>
              <p className="text-xs text-[#666666]">
                वेबसाइट पर प्रदर्शित होने वाली आधिकारिक घोषणाएं एवं समाचार
              </p>
            </div>

            {/* Create Announcement Form */}
            <form onSubmit={handleCreateAnnouncement} className="p-6 rounded-3xl bg-white border border-[#E9B44C]/35 shadow-card space-y-4">
              <h3 className="font-extrabold text-sm text-[#382719] font-hindi-heading">
                + नई सूचना प्रकाशित करें
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#382719] mb-1">सूचना शीर्षक *</label>
                  <input
                    type="text"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="उदा. निःशुल्क षोडश संस्कार जागरण शिविर • गोरखपुर"
                    className="w-full px-3 py-2 rounded-xl border border-[#E9B44C]/50 text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#382719] mb-1">सूचना का विवरण एवं संदेश *</label>
                  <textarea
                    rows={3}
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="विस्तृत विवरण एवं स्थान..."
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
                  <span className="font-bold text-[#382719]">तुरंत सार्वजनिक रूप से प्रकाशित करें</span>
                </label>

                <button
                  type="submit"
                  disabled={actionInProgress}
                  className="px-6 py-2 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs shadow-saffron transition-all"
                >
                  प्रकाशित करें
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
                      {item.isPublished ? 'सार्वजनिक रूप से लाइव' : 'अप्रकाशित ड्राफ्ट'}
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-[#E9B44C] space-y-4 text-left">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-black text-base text-[#382719] font-hindi-heading">
                आवेदन पूर्ण विवरण
              </h3>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p><strong>संदर्भ:</strong> <span className="font-mono text-primary font-bold">{selectedApp.applicationRef}</span></p>
              <p><strong>नाम:</strong> {selectedApp.fullName}</p>
              <p><strong>पिता / पति:</strong> {selectedApp.fatherHusbandName}</p>
              <p><strong>मोबाइल:</strong> {selectedApp.mobile}</p>
              <p><strong>ग्राम / वार्ड:</strong> {selectedApp.villageOrLocality}</p>
              <p><strong>डाकघर:</strong> {selectedApp.postOffice || 'N/A'}</p>
              <p><strong>ज़िला व राज्य:</strong> {selectedApp.district}, {selectedApp.state}</p>
              <p><strong>श्रेणी:</strong> {selectedApp.category}</p>
              <p><strong>स्थिति:</strong> <span className="font-bold uppercase text-amber-700">{selectedApp.status}</span></p>
            </div>

            {rejectingAppId === selectedApp.id ? (
              <div className="pt-3 border-t space-y-2">
                <label className="block text-xs font-bold text-red-700">अस्वीकृति का वैधानिक कारण:</label>
                <textarea
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="उदा. अपूर्ण पता अथवा नियमों के अनुसार पात्रता नहीं पाई गई..."
                  className="w-full p-2 border rounded-xl text-xs"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectingAppId(null)}
                    className="px-3 py-1.5 rounded-lg border text-xs"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectApp(selectedApp.id)}
                    className="px-4 py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs"
                  >
                    अस्वीकार करें
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-1.5 rounded-lg border text-xs"
                >
                  बंद करें
                </button>
                {selectedApp.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setRejectingAppId(selectedApp.id)}
                      className="px-4 py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs"
                    >
                      अस्वीकार करें
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveApp(selectedApp.id)}
                      className="px-5 py-1.5 rounded-lg bg-trust-green text-white font-bold text-xs shadow-sm"
                    >
                      अनुमोदन करें
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
