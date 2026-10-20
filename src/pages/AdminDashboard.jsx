import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import TrustLogo from '../components/TrustLogo';
import MemberBadge from '../components/MemberBadge';
import {
  subscribeAllCollection,
  reviewDocument,
  getAllAnnouncementsForAdmin,
  createAnnouncement,
  deleteAnnouncement
} from '../firebase/services';
import {
  approveMembership,
  rejectMembership,
  removeMember,
  subscribeMembersList,
  markReceiptSent,
  ensureAdminAuth
} from '../firebase/membershipService';
import {
  approveDonationPayment,
  rejectDonationPayment,
  subscribePaymentSettings,
  updatePaymentSettings,
  DEFAULT_PAYMENT_SETTINGS
} from '../firebase/paymentService';
import { generateReceiptPDF } from '../firebase/receiptService';
import OfficialReceiptModal from '../components/OfficialReceiptModal';
import {
  ShieldCheck,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  HandHeart,
  UserPlus,
  Users,
  Heart,
  Home,
  LogOut,
  X,
  AlertCircle,
  Check,
  Calendar,
  Phone,
  User,
  Settings,
  QrCode,
  Download,
  Trash2,
  UserX,
  IndianRupee,
  Building,
  Upload,
  ShieldAlert,
  Award,
  Bell,
  Send,
  Copy,
  ExternalLink,
  Mail
} from 'lucide-react';

export const AdminDashboard = ({ onNavigateHome }) => {
  const { lang, toggleLanguage } = useLanguage();
  const { currentUser, userProfile, isAdmin, logout, refreshUserData } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Active Tab: 'helpRequests' | 'memberships' | 'members' | 'volunteers' | 'donations' | 'paymentSettings'
  const [activeTab, setActiveTab] = useState('helpRequests');

  // Realtime datasets
  const [helpRequests, setHelpRequests] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [membersList, setMembersList] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [paymentSettings, setPaymentSettings] = useState(DEFAULT_PAYMENT_SETTINGS);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // for general tabs
  const [memberFilter, setMemberFilter] = useState('active'); // 'active' | 'removed' | 'all'
  const [memberCategorySection, setMemberCategorySection] = useState('all'); // 'all' | 'catA' | 'catB' | 'catC'

  // Modal / Row Action States
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'view' | 'approve' | 'reject' | 'removeMember'
  const [verifiedAmountInput, setVerifiedAmountInput] = useState('');
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [removeReasonInput, setRemoveReasonInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  // Announcements & Notices State
  const [announcements, setAnnouncements] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    category: 'general'
  });
  const [isPublishingNotice, setIsPublishingNotice] = useState(false);

  // Payment Settings Form State
  const [settingsForm, setSettingsForm] = useState(DEFAULT_PAYMENT_SETTINGS);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const loadAnnouncements = async () => {
    try {
      const data = await getAllAnnouncementsForAdmin();
      setAnnouncements(data);
    } catch (e) {
      console.warn("Could not load announcements:", e);
    }
  };

  const handleSendReceipt = async (item, colName = activeTab) => {
    try {
      setIsProcessing(true);
      const res = await markReceiptSent(colName, item.id, currentUser?.uid || 'admin');
      toast.success(
        lang === 'hi'
          ? `रसीद जारी कर दी गई है! (रसीद संख्या: ${res.receiptNumber})। अब सदस्य इसे डाउनलोड कर सकते हैं।`
          : `Receipt dispatched (No: ${res.receiptNumber})! Member can now download it.`
      );
    } catch (err) {
      toast.error('Failed to send receipt: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
      toast.error(lang === 'hi' ? 'कृपया शीर्षक व विवरण दर्ज करें' : 'Title and content required');
      return;
    }

    setIsPublishingNotice(true);
    try {
      await createAnnouncement({
        title: announcementForm.title.trim(),
        content: announcementForm.content.trim(),
        category: announcementForm.category,
        isPublished: true
      }, currentUser?.uid || 'admin', 'ट्रस्ट प्रबंधकारिणी');

      toast.success(lang === 'hi' ? 'सूचना सफलतापूर्वक प्रकाशित हुई!' : 'Notice published successfully!');
      setAnnouncementForm({ title: '', content: '', category: 'general' });
      await loadAnnouncements();
    } catch (err) {
      toast.error('Failed to publish notice: ' + err.message);
    } finally {
      setIsPublishingNotice(false);
    }
  };

  const handleDeleteNotice = async (id) => {
    if (!window.confirm(lang === 'hi' ? 'क्या आप इस सूचना को हटाना चाहते हैं?' : 'Delete this notice?')) return;
    try {
      await deleteAnnouncement(id);
      toast.info(lang === 'hi' ? 'सूचना हटा दी गई।' : 'Notice deleted.');
      await loadAnnouncements();
    } catch (err) {
      toast.error('Failed to delete: ' + err.message);
    }
  };

  // Realtime subscriptions
  useEffect(() => {
    ensureAdminAuth().catch(console.warn);
    const unsubHelp = subscribeAllCollection('helpRequests', (data) => setHelpRequests(data));
    const unsubMem = subscribeAllCollection('memberships', (data) => setMemberships(data));
    const unsubVol = subscribeAllCollection('volunteers', (data) => setVolunteers(data));
    const unsubDon = subscribeAllCollection('donations', (data) => setDonations(data));
    const unsubMembers = subscribeMembersList((data) => setMembersList(data));
    const unsubSettings = subscribePaymentSettings((settings) => {
      setPaymentSettings(settings);
      setSettingsForm(settings);
    });
    loadAnnouncements();

    return () => {
      unsubHelp();
      unsubMem();
      unsubVol();
      unsubDon();
      unsubMembers();
      unsubSettings();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.info(lang === 'hi' ? 'लॉगआउट सफल' : 'Logged out');
      navigate('/');
    } catch (err) {
      toast.error('Logout error: ' + err.message);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'हाल ही में';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'हाल ही में';
    }
  };

  // Open Actions
  const handleOpenView = (item) => {
    setSelectedItem(item);
    setModalMode('view');
  };

  const handleOpenApprove = (item) => {
    setSelectedItem(item);
    if (activeTab === 'memberships') {
      const isCatA = item.category === 'catA';
      setVerifiedAmountInput(isCatA ? '0' : String(item.claimedAmount || paymentSettings.membershipFee || 200));
    } else if (activeTab === 'donations') {
      setVerifiedAmountInput(String(item.claimedAmount || item.amount || ''));
    }
    setAdminNoteInput(item.adminNote || '');
    setModalMode('approve');
  };

  const handleOpenReject = (item) => {
    setSelectedItem(item);
    setRejectReasonInput(item.rejectionReason || '');
    setModalMode('reject');
  };

  const handleOpenRemoveMember = (item) => {
    setSelectedItem(item);
    setRemoveReasonInput('');
    setModalMode('removeMember');
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setModalMode(null);
    setVerifiedAmountInput('');
    setAdminNoteInput('');
    setRejectReasonInput('');
    setRemoveReasonInput('');
  };

  // Execute Review / Approval Actions
  const handleConfirmAction = async () => {
    if (!selectedItem || !modalMode) return;

    setIsProcessing(true);
    try {
      if (modalMode === 'approve') {
        if (activeTab === 'memberships') {
          const isCatA = selectedItem.category === 'catA';
          const num = isCatA ? 0 : Number(verifiedAmountInput);
          if (!isCatA && (isNaN(num) || num <= 0)) {
            toast.error("Please enter a valid numeric verified amount.");
            setIsProcessing(false);
            return;
          }

          const res = await approveMembership(selectedItem.id, num, currentUser?.uid || 'admin');
          toast.success(
            isCatA
              ? `Beneficiary Member Approved! Member ID: ${res.memberId}`
              : `Membership Approved! Generated Member ID: ${res.memberId} & Receipt: ${res.receiptNumber || 'N/A'}`
          );
        } else if (activeTab === 'donations') {
          const num = Number(verifiedAmountInput);
          if (isNaN(num) || num <= 0) {
            toast.error("Please enter a valid numeric verified amount.");
            setIsProcessing(false);
            return;
          }

          const res = await approveDonationPayment(selectedItem.id, num, adminNoteInput, currentUser?.uid || 'admin');
          toast.success(`Donation Approved! Verified Amount ₹${res.verifiedAmount} • Receipt: ${res.receiptNumber}`);
        } else {
          // Standard Review (helpRequests / volunteers)
          await reviewDocument(
            activeTab,
            selectedItem.id,
            { status: 'approved', adminNote: adminNoteInput.trim() },
            currentUser?.uid || 'admin'
          );
          toast.success('Approved successfully.');
        }
      } else if (modalMode === 'reject') {
        if (!rejectReasonInput.trim()) {
          toast.error("Please provide a rejection reason.");
          setIsProcessing(false);
          return;
        }

        if (activeTab === 'memberships') {
          await rejectMembership(selectedItem.id, rejectReasonInput.trim(), currentUser?.uid || 'admin');
        } else if (activeTab === 'donations') {
          await rejectDonationPayment(selectedItem.id, rejectReasonInput.trim(), currentUser?.uid || 'admin');
        } else {
          await reviewDocument(
            activeTab,
            selectedItem.id,
            { status: 'rejected', reason: rejectReasonInput.trim() },
            currentUser?.uid || 'admin'
          );
        }
        toast.info('Record rejected.');
      } else if (modalMode === 'removeMember') {
        if (!removeReasonInput.trim()) {
          toast.error("Please provide a reason for membership removal.");
          setIsProcessing(false);
          return;
        }

        const targetUid = selectedItem.uid || selectedItem.applicantUid || selectedItem.userUid;
        await removeMember(selectedItem.id, targetUid, removeReasonInput.trim(), currentUser?.uid || 'admin');
        if (refreshUserData && (!targetUid || targetUid === currentUser?.uid)) {
          await refreshUserData();
        }
        toast.success(`Member ${selectedItem.memberId || ''} removed successfully.`);
      }

      handleCloseModal();
    } catch (err) {
      console.error("Admin action failed:", err);
      toast.error('Error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-download / View Receipt PDF
  const handleDownloadReceipt = (record) => {
    setViewingReceipt({
      receiptNumber: record.receiptNumber || `RSSSST-2026-${record.id?.slice(0, 4).toUpperCase() || '2864'}`,
      date: record.approvedAt || record.createdAt,
      donorName: record.donorName || record.fullName || 'Contributor',
      username: record.username || '',
      memberId: record.memberId || '',
      phone: record.donorPhone || record.phone || '',
      fatherHusbandName: record.fatherHusbandName || '',
      address: record.address || record.location || '',
      block: record.block || 'सदर',
      district: record.district || 'गोरखपुर',
      state: record.state || 'उत्तर प्रदेश',
      paymentId: record.paymentId || record.utrNumber || 'UPI-REF',
      purpose: record.purpose || (activeTab === 'members' || activeTab === 'memberships' ? 'membership_fee' : 'samarpan'),
      amount: record.verifiedAmount || record.claimedAmount || record.amount || 200,
      verifiedAmount: record.verifiedAmount || record.claimedAmount || record.amount || 200
    });
  };

  // Save Payment Settings
  const handleSavePaymentSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await updatePaymentSettings(settingsForm);
      toast.success('Payment settings updated successfully in Firestore!');
    } catch (err) {
      toast.error('Failed to save settings: ' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handle QR image file upload (base64)
  const handleQrFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error('Image size must be less than 1MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSettingsForm(prev => ({ ...prev, qrImageUrl: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  // Filtering for active tabs
  const getDisplayData = () => {
    if (activeTab === 'members') {
      return membersList.filter(m => {
        if (memberFilter === 'active' && m.status !== 'approved') return false;
        if (memberFilter === 'removed' && m.status !== 'removed') return false;

        // Category Section Filter ('all' | 'catA' | 'catB' | 'catC')
        if (memberCategorySection === 'catA' && m.category !== 'catA') return false;
        if (memberCategorySection === 'catB' && (m.category !== 'catB' && m.category !== undefined && m.category !== null && m.category !== '')) return false;
        if (memberCategorySection === 'catC' && m.category !== 'catC') return false;

        if (!searchQuery.trim()) return true;

        const q = searchQuery.toLowerCase();
        const name = (m.fullName || '').toLowerCase();
        const mid = (m.memberId || '').toLowerCase();
        const phone = (m.phone || '').toLowerCase();
        const pid = (m.paymentId || '').toLowerCase();
        const assist = (m.helpType || m.assistanceDescription || '').toLowerCase();
        const prof = (m.profession || m.workplace || '').toLowerCase();
        const avail = (m.availability || '').toLowerCase();
        return name.includes(q) || mid.includes(q) || phone.includes(q) || pid.includes(q) || assist.includes(q) || prof.includes(q) || avail.includes(q);
      });
    }

    let list = [];
    if (activeTab === 'helpRequests') list = helpRequests;
    else if (activeTab === 'memberships') list = memberships;
    else if (activeTab === 'volunteers') list = volunteers;
    else if (activeTab === 'donations') list = donations;

    return list.filter(item => {
      const statusMatch = statusFilter === 'all' || (item.status || 'pending').toLowerCase() === statusFilter.toLowerCase();
      if (!statusMatch) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const name = (item.fullName || item.donorName || '').toLowerCase();
      const phone = (item.phone || item.donorPhone || '').toLowerCase();
      const pid = (item.paymentId || item.utrNumber || item.id || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || pid.includes(q);
    });
  };

  const currentDisplayData = getDisplayData();
  const totalActiveMembers = membersList.filter(m => m.status === 'approved').length;
  const activeMembers = membersList.filter(m => memberFilter === 'all' || (memberFilter === 'active' ? m.status === 'approved' : m.status === 'removed'));
  const catACount = activeMembers.filter(m => m.category === 'catA').length;
  const catBCount = activeMembers.filter(m => m.category === 'catB' || !m.category).length;
  const catCCount = activeMembers.filter(m => m.category === 'catC').length;

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#454545] flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#382719] text-white shadow-md border-b border-[#E9B44C]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TrustLogo className="w-9 h-9" showText={false} lang={lang} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight font-hindi-heading">
                  सनातन संस्कार ट्रस्ट
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-primary text-white">
                  व्यवस्थापक पोर्टल (Admin)
                </span>
              </div>
              <span className="text-[11px] text-[#E9B44C] font-mono">
                Admin UID: {currentUser?.uid?.slice(0, 10)}...
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/dashboard"
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
            >
              {lang === 'hi' ? 'उपयोगकर्ता डैशबोर्ड' : 'User View'}
            </Link>

            <Link
              to="/about"
              className="p-2 rounded-xl text-white/80 hover:bg-white/10 text-xs font-bold flex items-center gap-1"
              title="About / Public Site"
            >
              <Home className="w-4 h-4 text-[#E9B44C]" />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'लॉगआउट' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* Metric Badges Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-[#E9B44C]/30 shadow-xs">
            <span className="text-xs text-[#777777] font-bold block mb-1">
              {lang === 'hi' ? 'सत्यापित ट्रस्ट सदस्य' : 'Active Members'}
            </span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-[#382719] font-mono">{totalActiveMembers}</span>
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
          </div>

          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-300 shadow-xs">
            <span className="text-xs text-amber-800 font-bold block mb-1">
              लंबित सदस्यता आवेदन
            </span>
            <span className="text-2xl font-black text-amber-700 font-mono">
              {memberships.filter(m => (m.status || 'pending').toLowerCase() === 'pending').length}
            </span>
          </div>

          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-300 shadow-xs">
            <span className="text-xs text-emerald-800 font-bold block mb-1">
              लंबित दान एवं समर्पण
            </span>
            <span className="text-2xl font-black text-emerald-700 font-mono">
              {donations.filter(d => (d.status || 'pending').toLowerCase() === 'pending').length}
            </span>
          </div>

          <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-300 shadow-xs">
            <span className="text-xs text-rose-800 font-bold block mb-1">
              सहायता प्रार्थनाएं (Help)
            </span>
            <span className="text-2xl font-black text-rose-700 font-mono">
              {helpRequests.filter(h => (h.status || 'pending').toLowerCase() === 'pending').length}
            </span>
          </div>
        </div>

        {/* 6 Core Tabs Navigation */}
        <div className="flex border-b border-[#E9B44C]/30 overflow-x-auto no-scrollbar gap-1.5 sm:gap-2 pb-1">
          <button
            type="button"
            onClick={() => { setActiveTab('helpRequests'); setSearchQuery(''); setStatusFilter('all'); }}
            className={`min-h-[44px] shrink-0 py-2.5 px-4 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'helpRequests'
                ? 'border-primary text-primary bg-[#FFF8EF] rounded-t-xl font-black'
                : 'border-transparent text-[#666666] hover:text-primary'
            }`}
          >
            <HandHeart className="w-4 h-4" />
            <span>Help Requests</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-mono font-bold">
              {helpRequests.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('memberships'); setSearchQuery(''); setStatusFilter('all'); }}
            className={`min-h-[44px] shrink-0 py-2.5 px-4 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'memberships'
                ? 'border-primary text-primary bg-[#FFF8EF] rounded-t-xl font-black'
                : 'border-transparent text-[#666666] hover:text-primary'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Memberships</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-mono font-bold">
              {memberships.length}
            </span>
          </button>

          {/* New Tab: Members */}
          <button
            type="button"
            onClick={() => { setActiveTab('members'); setSearchQuery(''); }}
            className={`min-h-[44px] shrink-0 py-2.5 px-4 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'members'
                ? 'border-primary text-primary bg-[#FFF8EF] rounded-t-xl font-black'
                : 'border-transparent text-[#666666] hover:text-primary'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Members ({totalActiveMembers})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('volunteers'); setSearchQuery(''); setStatusFilter('all'); }}
            className={`min-h-[44px] shrink-0 py-2.5 px-4 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'volunteers'
                ? 'border-primary text-primary bg-[#FFF8EF] rounded-t-xl font-black'
                : 'border-transparent text-[#666666] hover:text-primary'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Volunteers</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-mono font-bold">
              {volunteers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('donations'); setSearchQuery(''); setStatusFilter('all'); }}
            className={`min-h-[44px] shrink-0 py-2.5 px-4 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'donations'
                ? 'border-primary text-primary bg-[#FFF8EF] rounded-t-xl font-black'
                : 'border-transparent text-[#666666] hover:text-primary'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Donations</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-mono font-bold">
              {donations.length}
            </span>
          </button>

          {/* Tab: Announcements & Notices */}
          <button
            type="button"
            onClick={() => { setActiveTab('announcements'); setSearchQuery(''); }}
            className={`min-h-[44px] shrink-0 py-2.5 px-4 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'announcements'
                ? 'border-primary text-primary bg-[#FFF8EF] rounded-t-xl font-black'
                : 'border-transparent text-[#666666] hover:text-primary'
            }`}
          >
            <Bell className="w-4 h-4 text-primary" />
            <span>{lang === 'hi' ? 'सूचनाएं व संदेश' : 'Notices & Updates'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-mono font-bold">
              {announcements.length}
            </span>
          </button>

          {/* New Tab: Payment Settings */}
          <button
            type="button"
            onClick={() => setActiveTab('paymentSettings')}
            className={`min-h-[44px] shrink-0 py-2.5 px-4 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'paymentSettings'
                ? 'border-primary text-primary bg-[#FFF8EF] rounded-t-xl font-black'
                : 'border-transparent text-[#666666] hover:text-primary'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Payment Settings</span>
          </button>
        </div>

        {/* Tab 6: Payment Settings Panel */}
        {activeTab === 'paymentSettings' ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9B44C]/35 shadow-card max-w-4xl space-y-6">
            <div className="flex items-center gap-3 border-b border-[#E9B44C]/30 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-[#382719] font-hindi-heading">
                  Trust Payment & QR Code Settings
                </h3>
                <p className="text-xs text-[#666666]">
                  Configure official QR image, UPI ID, payee name, and membership fee displayed to all members.
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePaymentSettings} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* QR Preview & Upload Box */}
                <div className="md:col-span-4 p-4 rounded-2xl bg-[#FFF8EF] border border-[#E9B44C]/40 text-center space-y-3">
                  <span className="text-xs font-bold text-[#382719] block">
                    Current Payment QR Code
                  </span>
                  
                  <div className="w-40 h-40 mx-auto p-2 rounded-xl bg-white border border-[#E9B44C] flex items-center justify-center overflow-hidden shadow-xs">
                    <img
                      src={settingsForm.qrImageUrl || '/payment-qr.png'}
                      alt="Payment QR"
                      className="w-full h-full object-contain"
                      onError={(e) => { e.target.onerror = null; e.target.src = '/payment-qr.png'; }}
                    />
                  </div>

                  <div>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E9B44C] text-xs font-bold text-[#382719] hover:bg-primary hover:text-white cursor-pointer transition-all shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload New QR Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrFileUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-[#777777] block mt-1">PNG / JPG (max 1MB)</span>
                  </div>
                </div>

                {/* Settings Input Fields */}
                <div className="md:col-span-8 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      Payee / Trust Official Display Name *
                    </label>
                    <input
                      type="text"
                      value={settingsForm.payeeName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, payeeName: e.target.value })}
                      placeholder="e.g. Rashtriya Sanatan Sanskar Seva Sansthan (Trust)"
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E9B44C]/50 text-xs focus:ring-2 focus:ring-primary/40 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#382719] mb-1">
                        Trust UPI ID *
                      </label>
                      <input
                        type="text"
                        value={settingsForm.upiId}
                        onChange={(e) => setSettingsForm({ ...settingsForm, upiId: e.target.value })}
                        placeholder="e.g. boim-135883270012@boi"
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E9B44C]/50 text-xs font-mono font-bold focus:ring-2 focus:ring-primary/40 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#382719] mb-1">
                        Annual Membership Fee (INR) *
                      </label>
                      <input
                        type="number"
                        value={settingsForm.membershipFee}
                        onChange={(e) => setSettingsForm({ ...settingsForm, membershipFee: Number(e.target.value) })}
                        placeholder="200"
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E9B44C]/50 text-xs font-mono font-bold focus:ring-2 focus:ring-primary/40 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#382719] mb-1">
                        Bank Account Number
                      </label>
                      <input
                        type="text"
                        value={settingsForm.accountNumber}
                        onChange={(e) => setSettingsForm({ ...settingsForm, accountNumber: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E9B44C]/50 text-xs font-mono focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#382719] mb-1">
                        Bank IFSC Code
                      </label>
                      <input
                        type="text"
                        value={settingsForm.ifsc}
                        onChange={(e) => setSettingsForm({ ...settingsForm, ifsc: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E9B44C]/50 text-xs font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      80G Tax Exemption Registration Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.section80G || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, section80G: e.target.value })}
                      placeholder="e.g. AAATR1234EF20261 (Printed on official receipts if present)"
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E9B44C]/50 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="px-6 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs sm:text-sm shadow-saffron transition-all disabled:opacity-50"
                    >
                      {isSavingSettings ? 'Saving Settings...' : 'Save Payment Settings'}
                    </button>
                  </div>
                </div>

              </div>
            </form>
          </div>
        ) : activeTab === 'announcements' ? (
          /* Tab: Announcements & Notices Panel */
          <div className="space-y-6">
            {/* Create Announcement Box */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E9B44C]/35 shadow-card max-w-4xl text-left space-y-4">
              <div className="flex items-center gap-2.5 border-b border-[#E9B44C]/30 pb-3">
                <Bell className="w-5 h-5 text-primary" />
                <h3 className="font-black text-base sm:text-lg text-[#382719] font-hindi-heading">
                  {lang === 'hi' ? 'नई सार्वजनिक सूचना / संदेश प्रकाशित करें' : 'Publish New Notice / Update'}
                </h3>
              </div>

              <form onSubmit={handleCreateNotice} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'सूचना का शीर्षक *' : 'Notice Title *'}
                    </label>
                    <input
                      type="text"
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                      placeholder={lang === 'hi' ? 'उदा. आगामी वैदिक संस्कार शिविर 25 अक्टूबर' : 'e.g. Upcoming Vedic Sanskar Camp 25th Oct'}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'श्रेणी (Category)' : 'Category'}
                    </label>
                    <select
                      value={announcementForm.category}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="general">सामान्य सूचना (General)</option>
                      <option value="urgent">अति महत्वपूर्ण (Urgent)</option>
                      <option value="event">धार्मिक/सेवा कार्यक्रम (Event)</option>
                      <option value="sanskar">संस्कार शिविर (Sanskar)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {lang === 'hi' ? 'सूचना का विस्तृत विवरण *' : 'Notice Detailed Content *'}
                  </label>
                  <textarea
                    rows={4}
                    value={announcementForm.content}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                    placeholder={lang === 'hi' ? 'सूचना का पूरा विवरण लिखें जो सदस्य व स्वयंसेवक डैशबोर्ड पर दिखेगा...' : 'Write the complete announcement content visible on Member & Volunteer Dashboards...'}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isPublishingNotice}
                    className="px-6 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs sm:text-sm shadow-saffron transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isPublishingNotice ? (lang === 'hi' ? 'प्रकाशित हो रहा है...' : 'Publishing...') : (lang === 'hi' ? 'डैशबोर्ड पर प्रकाशित करें' : 'Publish to Dashboards')}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Announcements List */}
            <div className="max-w-4xl space-y-3 text-left">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#666666]">
                {lang === 'hi' ? `प्रकाशित सूचनाएं (${announcements.length})` : `Published Notices (${announcements.length})`}
              </h4>

              {announcements.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl border border-gray-200 text-center text-xs text-gray-500">
                  {lang === 'hi' ? 'अभी कोई सूचना प्रकाशित नहीं है।' : 'No notices published yet.'}
                </div>
              ) : (
                announcements.map((ann) => (
                  <div key={ann.id} className="p-4 sm:p-5 bg-white rounded-2xl border border-[#E9B44C]/35 shadow-xs flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary">
                          {ann.category || 'General'}
                        </span>
                        <span className="text-[11px] text-gray-500 font-mono">
                          {formatDate(ann.publishedAt || ann.createdAt)}
                        </span>
                      </div>
                      <h5 className="font-extrabold text-sm sm:text-base text-[#382719]">
                        {ann.title}
                      </h5>
                      <p className="text-xs text-[#555555] whitespace-pre-wrap leading-relaxed">
                        {ann.content}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteNotice(ann.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all flex-shrink-0"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Table Views (Help Requests, Memberships, Members, Volunteers, Donations) */
          <>
            {/* When activeTab is 'members': Three Dedicated Sections for All 3 Member Types */}
            {activeTab === 'members' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-hindi-heading font-black text-sm sm:text-base text-[#382719] flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span>सदस्यता श्रेणी अनुभाग (Three Membership Categories)</span>
                    </h3>
                    <p className="text-[11px] text-[#666666]">
                      प्रत्येक श्रेणी के सदस्यों का पृथक विवरण, सहायता/व्यवसाय प्रोफाइल एवं कार्ड प्रबंधन
                    </p>
                  </div>

                  {/* All Categories Toggle Pill */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setMemberCategorySection('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        memberCategorySection === 'all'
                          ? 'bg-[#382719] text-white shadow-xs'
                          : 'bg-[#FFF8EF] text-[#666666] hover:text-[#382719] border border-[#E9B44C]/40'
                      }`}
                    >
                      सभी श्रेणियां (All {activeMembers.length})
                    </button>
                  </div>
                </div>

                {/* 3 Interactive Category Section Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Section 1: Category A */}
                  <button
                    type="button"
                    onClick={() => setMemberCategorySection('catA')}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                      memberCategorySection === 'catA'
                        ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-50 to-white border-emerald-500 shadow-md ring-2 ring-emerald-400/40'
                        : 'bg-white hover:bg-emerald-50/50 border-[#E9B44C]/30 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                          <Heart className="w-4 h-4 fill-white/20" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            श्रेणी - क • निःशुल्क (₹0)
                          </span>
                          <h4 className="font-extrabold text-xs sm:text-sm text-[#382719] mt-0.5 font-hindi-heading">
                            निराश्रित / सहायता लाभार्थी
                          </h4>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-black ${
                        memberCategorySection === 'catA' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {catACount}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#666666] mt-2 line-clamp-1">
                      चिकित्सा, राशन, शिक्षा एवं पारिवारिक सहायता प्राप्त सदस्य (शुल्क: ₹0)
                    </p>
                  </button>

                  {/* Section 2: Category B */}
                  <button
                    type="button"
                    onClick={() => setMemberCategorySection('catB')}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                      memberCategorySection === 'catB'
                        ? 'bg-gradient-to-br from-[#E87516]/10 via-[#FFF8EF] to-white border-[#E87516] shadow-md ring-2 ring-[#E87516]/40'
                        : 'bg-white hover:bg-[#FFF8EF]/50 border-[#E9B44C]/30 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#E87516] text-white flex items-center justify-center shadow-xs">
                          <Award className="w-4 h-4 fill-white/20" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#B85A09] bg-[#FFF8EF] border border-[#E9B44C]/60 px-1.5 py-0.5 rounded">
                            श्रेणी - ख • ₹200/वर्ष
                          </span>
                          <h4 className="font-extrabold text-xs sm:text-sm text-[#382719] mt-0.5 font-hindi-heading">
                            साधारण / संरक्षक सदस्य
                          </h4>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-black ${
                        memberCategorySection === 'catB' ? 'bg-[#E87516] text-white' : 'bg-[#FFF8EF] text-[#B85A09] border border-[#E9B44C]'
                      }`}>
                        {catBCount}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#666666] mt-2 line-clamp-1">
                      संस्कार संवर्धन, प्रचार एवं वार्षिक संरक्षक सहयोगदाता (शुल्क: ₹200)
                    </p>
                  </button>

                  {/* Section 3: Category C */}
                  <button
                    type="button"
                    onClick={() => setMemberCategorySection('catC')}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                      memberCategorySection === 'catC'
                        ? 'bg-gradient-to-br from-blue-500/10 via-blue-50 to-white border-blue-500 shadow-md ring-2 ring-blue-400/40'
                        : 'bg-white hover:bg-blue-50/50 border-[#E9B44C]/30 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                          <Users className="w-4 h-4 fill-white/20" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                            श्रेणी - ग • सेवा संकल्प
                          </span>
                          <h4 className="font-extrabold text-xs sm:text-sm text-[#382719] mt-0.5 font-hindi-heading">
                            समर्पित कार्यकर्ता / स्वयंसेवक
                          </h4>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-black ${
                        memberCategorySection === 'catC' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {catCCount}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#666666] mt-2 line-clamp-1">
                      जमीनी शिविर, रक्तदान, श्रमिक सहायता एवं कार्यक्रम प्रबंधन स्वयंसेवक
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-[#E9B44C]/30 shadow-xs">
              
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'members'
                      ? 'Search by Member ID (TRUST-M-...), Name, Phone, or Payment ID...'
                      : 'Search by Name, Phone, Payment ID / UTR...'
                  }
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E9B44C]/40 bg-[#FFF8EF]/30 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
                />
              </div>

              {/* Status Filter for general tabs vs member filter */}
              {activeTab === 'members' ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMemberFilter('active')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      memberFilter === 'active' ? 'bg-emerald-600 text-white' : 'bg-[#FFF8EF] text-[#666666]'
                    }`}
                  >
                    Active Members ({totalActiveMembers})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberFilter('removed')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      memberFilter === 'removed' ? 'bg-rose-600 text-white' : 'bg-[#FFF8EF] text-[#666666]'
                    }`}
                  >
                    Removed ({membersList.filter(m => m.status === 'removed').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      memberFilter === 'all' ? 'bg-primary text-white' : 'bg-[#FFF8EF] text-[#666666]'
                    }`}
                  >
                    All History
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'pending', label: 'Pending' },
                    { id: 'approved', label: 'Approved' },
                    { id: 'rejected', label: 'Rejected' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setStatusFilter(f.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        statusFilter === f.id
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-[#FFF8EF] text-[#666666] hover:text-[#382719] border border-[#E9B44C]/40'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl border border-[#E9B44C]/30 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#FFF8EF] border-b border-[#E9B44C]/30 text-[#382719] font-black uppercase text-[11px] tracking-wider">
                      {activeTab === 'members' ? (
                        <>
                          <th className="py-3 px-4">Member ID & Status</th>
                          <th className="py-3 px-4">Member Name</th>
                          <th className="py-3 px-4">Phone & Location</th>
                          <th className="py-3 px-4">
                            {memberCategorySection === 'catA' ? 'Assistance Needed & Hardship' :
                             memberCategorySection === 'catB' ? 'Profession & Workplace' :
                             memberCategorySection === 'catC' ? 'Availability & Seva Wings' :
                             'Category & Details'}
                          </th>
                          <th className="py-3 px-4">
                            {memberCategorySection === 'catA' ? 'Approved Date' : 'Payment ID / Fee'}
                          </th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </>
                      ) : (
                        <>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Applicant / Donor</th>
                          <th className="py-3 px-4">Phone</th>
                          <th className="py-3 px-4">
                            {activeTab === 'donations' || activeTab === 'memberships'
                              ? 'Payment ID & Claimed Amt'
                              : 'Details / Purpose'}
                          </th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9B44C]/20">
                    {currentDisplayData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[#888888]">
                          No records found matching filters.
                        </td>
                      </tr>
                    ) : (
                      currentDisplayData.map((item) => {
                        const status = (item.status || 'pending').toLowerCase();
                        const name = item.fullName || item.donorName || item.payerName || 'Unknown';
                        const phone = item.phone || item.donorPhone || item.payerMobile || '—';

                        if (activeTab === 'members') {
                          const isRemoved = item.status === 'removed';
                          return (
                            <tr key={item.id} className="hover:bg-[#FFFDF9] transition-colors">
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="space-y-1">
                                  <span className="font-mono text-xs font-black text-[#382719] block">
                                    {item.memberId || 'N/A'}
                                  </span>
                                  {isRemoved ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 inline-block">
                                      Revoked Member
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-block">
                                      Active Member
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3.5 px-4 font-bold text-[#382719]">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {/* Badge directly in front of name! */}
                                  <MemberBadge
                                    category={item.category || 'catB'}
                                    memberId={item.memberId}
                                    variant="inline"
                                    lang={lang}
                                  />
                                  <span className="font-black text-sm">{name}</span>
                                </div>
                                <div className="text-[10px] font-mono text-secondary mt-0.5">
                                  {item.username ? `@${item.username}` : (item.uid ? `UID: ${item.uid.slice(0, 8)}...` : '')}
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-mono text-xs text-[#454545]">{phone}</div>
                                <div className="text-[11px] text-[#777777] line-clamp-1">
                                  {[item.district, item.state].filter(Boolean).join(', ') || 'Gorakhpur'}
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                {item.category === 'catA' ? (
                                  <div className="space-y-0.5">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 inline-block">
                                      {item.helpType || 'पारिवारिक सहायता'}
                                    </span>
                                    {item.monthlyIncome && (
                                      <div className="text-[11px] text-[#666666]">आय: {item.monthlyIncome}</div>
                                    )}
                                    {item.assistanceDescription && (
                                      <p className="text-[10px] text-[#777777] italic line-clamp-1">
                                        "{item.assistanceDescription}"
                                      </p>
                                    )}
                                  </div>
                                ) : item.category === 'catC' ? (
                                  <div className="space-y-0.5">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800 inline-block">
                                      {item.availability || 'Weekends'}
                                    </span>
                                    {item.serviceAreas && item.serviceAreas.length > 0 && (
                                      <div className="text-[10px] text-[#555555] font-medium line-clamp-1">
                                        विंग्स: {item.serviceAreas.join(', ')}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-0.5">
                                    {item.profession && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-[#B85A09] inline-block">
                                        {item.profession}
                                      </span>
                                    )}
                                    {item.workplace && (
                                      <div className="text-[11px] text-[#666666] line-clamp-1">{item.workplace}</div>
                                    )}
                                    {item.focusArea && (
                                      <div className="text-[10px] text-[#777777]">{item.focusArea}</div>
                                    )}
                                  </div>
                                )}
                              </td>

                              <td className="py-3.5 px-4 whitespace-nowrap">
                                {item.category === 'catA' ? (
                                  <div className="space-y-0.5 text-xs">
                                    <span className="text-[11px] font-bold text-emerald-700 block">निःशुल्क (₹0)</span>
                                    <span className="text-[10px] text-[#777777] block">
                                      {formatDate(item.memberSince || item.approvedAt || item.createdAt)}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="space-y-0.5">
                                    <span className="font-mono text-xs text-primary font-bold block">
                                      {item.paymentId || 'N/A'}
                                    </span>
                                    <span className="text-[10px] text-[#777777] block">
                                      शुल्क: ₹{item.verifiedAmount || item.annualFee || 200}/-
                                    </span>
                                  </div>
                                )}
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                                  {item.receiptSent ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800" title="Receipt Dispatched">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>रसीद भेजी गई</span>
                                    </span>
                                  ) : (
                                    item.status === 'approved' && item.category !== 'catA' && (
                                      <button
                                        type="button"
                                        onClick={() => handleSendReceipt(item, 'membershipApplications')}
                                        disabled={isProcessing}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary hover:bg-secondary text-white text-[11px] font-bold shadow-xs transition-all"
                                        title="Send Receipt to Member"
                                      >
                                        <Send className="w-3 h-3" />
                                        <span>रसीद भेजें</span>
                                      </button>
                                    )
                                  )}

                                  {item.receiptNumber && (
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadReceipt(item)}
                                      className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition-all"
                                      title="Download Receipt PDF"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                  )}

                                  {!isRemoved && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenRemoveMember(item)}
                                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 transition-all"
                                      title="Remove Member"
                                    >
                                      <UserX className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        // Standard Table Row for memberships, donations, helpRequests, volunteers
                        return (
                          <tr key={item.id} className="hover:bg-[#FFFDF9] transition-colors">
                            <td className="py-3.5 px-4 whitespace-nowrap text-[#666666] text-xs">
                              {formatDate(item.createdAt || item.submittedAt)}
                            </td>

                            <td className="py-3.5 px-4 font-bold text-[#382719]">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {activeTab === 'memberships' && (
                                  <MemberBadge
                                    category={item.category || 'catB'}
                                    variant="inline"
                                    lang={lang}
                                  />
                                )}
                                <span>{name}</span>
                              </div>
                              {item.uid && (
                                <span className="text-[10px] text-[#888888] font-mono">
                                  UID: {item.uid.slice(0, 8)}...
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 font-mono text-[#454545]">
                              {phone}
                            </td>

                            <td className="py-3.5 px-4">
                              {activeTab === 'memberships' && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {item.category === 'catA' ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                                        Cat A (निराश्रित/सहायता)
                                      </span>
                                    ) : item.category === 'catC' ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-secondary/10 text-secondary">
                                        Cat C (कार्यकर्ता)
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-primary/10 text-primary">
                                        Cat B (साधारण सदस्य)
                                      </span>
                                    )}
                                    {item.category === 'catA' ? (
                                      <span className="text-[10px] font-bold text-emerald-700">Fee: ₹0 (Exempted)</span>
                                    ) : (
                                      <span className="text-[10px] font-mono font-bold text-[#454545]">₹{item.claimedAmount || 200}</span>
                                    )}
                                  </div>

                                  {item.category === 'catA' ? (
                                    <div className="text-[11px] text-[#555555]">
                                      <span className="font-semibold text-primary">{item.helpType || 'सहायता प्रार्थी'}</span>
                                      {item.assistanceDescription && (
                                        <p className="text-[10px] text-[#777777] line-clamp-1 italic mt-0.5">"{item.assistanceDescription}"</p>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-[11px] text-[#555555]">
                                      <span className="font-mono text-xs font-bold text-primary">PID: {item.paymentId || 'N/A'}</span>
                                      {item.verifiedAmount && (
                                        <span className="text-emerald-700 font-bold ml-1.5">
                                          (Verified: ₹{item.verifiedAmount})
                                        </span>
                                      )}
                                      {item.profession && (
                                        <span className="text-[10px] text-[#777777] block capitalize">Profession: {item.profession}</span>
                                      )}
                                      {item.availability && (
                                        <span className="text-[10px] text-[#777777] block capitalize">Time: {item.availability}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              {activeTab === 'donations' && (
                                <div className="space-y-0.5">
                                  <div className="font-mono text-xs font-black text-primary">
                                    PID: {item.paymentId || item.utrNumber || 'N/A'}
                                  </div>
                                  <div className="text-[11px] text-[#555555]">
                                    Claimed: ₹{item.claimedAmount || item.amount || 0}
                                    {item.verifiedAmount && (
                                      <span className="text-emerald-700 font-bold ml-1.5">
                                        (Verified: ₹{item.verifiedAmount})
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-[#888888] uppercase block">
                                    {item.purpose || 'General Samarpan'}
                                  </span>
                                </div>
                              )}

                              {activeTab === 'helpRequests' && (
                                <div className="space-y-0.5">
                                  <span className="font-bold text-primary">{item.helpType || item.category}</span>
                                  {item.amountNeeded && (
                                    <span className="font-mono text-xs font-bold text-[#382719] block">
                                      Needed: ₹{Number(item.amountNeeded).toLocaleString('en-IN')}
                                    </span>
                                  )}
                                </div>
                              )}

                              {activeTab === 'volunteers' && (
                                <div className="space-y-0.5">
                                  <span className="font-semibold text-[#454545]">{item.cityOrDistrict || 'Gorakhpur'}</span>
                                  <span className="text-[10px] text-[#777777] block">
                                    {item.availability === 'full_time' ? 'Full Time' : 'Weekends'}
                                  </span>
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              {status === 'approved' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Approved</span>
                                </span>
                              )}
                              {status === 'rejected' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  <span>Rejected</span>
                                </span>
                              )}
                              {status === 'pending' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Pending</span>
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleOpenView(item)}
                                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#382719] transition-all"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {status === 'approved' && (activeTab === 'memberships' || activeTab === 'donations') && (
                                  item.receiptSent ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800" title="Receipt Dispatched">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>रसीद भेजी गई</span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleSendReceipt(item, activeTab)}
                                      disabled={isProcessing}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary hover:bg-secondary text-white text-[11px] font-bold shadow-xs transition-all"
                                      title="Send Receipt to User"
                                    >
                                      <Send className="w-3 h-3" />
                                      <span>रसीद भेजें</span>
                                    </button>
                                  )
                                )}

                                {status === 'approved' && item.receiptNumber && (
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadReceipt(item)}
                                    className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition-all"
                                    title="View & Download Receipt PDF"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleOpenApprove(item)}
                                  disabled={status === 'approved'}
                                  className={`p-1.5 rounded-lg transition-all ${
                                    status === 'approved'
                                      ? 'opacity-40 cursor-not-allowed bg-emerald-100 text-emerald-400'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300'
                                  }`}
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenReject(item)}
                                  disabled={status === 'rejected'}
                                  className={`p-1.5 rounded-lg transition-all ${
                                    status === 'rejected'
                                      ? 'opacity-40 cursor-not-allowed bg-rose-100 text-rose-400'
                                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300'
                                  }`}
                                  title="Reject"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </main>

      {/* ACTION MODAL (Approve / Reject / Remove / View) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-[#E9B44C]/40 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className={`px-5 py-4 flex items-center justify-between text-white ${
              modalMode === 'approve'
                ? 'bg-emerald-700'
                : modalMode === 'removeMember' || modalMode === 'reject'
                ? 'bg-rose-700'
                : 'bg-primary'
            }`}>
              <div className="flex items-center gap-2">
                {modalMode === 'approve' && <CheckCircle2 className="w-5 h-5" />}
                {modalMode === 'reject' && <XCircle className="w-5 h-5" />}
                {modalMode === 'removeMember' && <UserX className="w-5 h-5" />}
                {modalMode === 'view' && <Eye className="w-5 h-5" />}
                <h3 className="font-black text-sm sm:text-base font-hindi-heading">
                  {modalMode === 'approve' && (activeTab === 'memberships' ? 'Approve Membership & Issue Member ID' : 'Approve Donation & Enter Verified Amount')}
                  {modalMode === 'reject' && 'Reject Record (Provide Reason)'}
                  {modalMode === 'removeMember' && 'Remove Member & Revoke Badge'}
                  {modalMode === 'view' && 'Full Record Inspection'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1 rounded-full hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-left">
              
              {/* Record Summary Box */}
              <div className="p-4 rounded-2xl bg-[#FFF8EF] border border-[#E9B44C]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#888888] font-bold">Applicant / Contributor:</span>
                  <div className="flex items-center gap-1.5">
                    {selectedItem.category && (
                      <MemberBadge
                        category={selectedItem.category}
                        memberId={selectedItem.memberId}
                        variant="inline"
                        lang={lang}
                      />
                    )}
                    <span className="font-bold text-[#382719]">
                      {selectedItem.fullName || selectedItem.donorName || selectedItem.payerName}
                    </span>
                  </div>
                </div>

                {selectedItem.username && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#888888] font-bold">Username:</span>
                    <span className="font-mono font-bold text-secondary">@{selectedItem.username}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[#888888] font-bold">Phone Number:</span>
                  <span className="font-mono font-bold text-primary">
                    {selectedItem.phone || selectedItem.donorPhone || selectedItem.payerMobile || selectedItem.mobile}
                  </span>
                </div>

                {selectedItem.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#888888] font-bold">Email:</span>
                    <span className="font-mono text-xs text-[#555555]">{selectedItem.email}</span>
                  </div>
                )}

                {selectedItem.address && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#888888] font-bold">Address / City:</span>
                    <span className="text-xs text-[#454545] text-right max-w-[60%]">
                      {[selectedItem.address, selectedItem.block, selectedItem.district, selectedItem.state].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}

                {/* Payment Proof Section: Screenshot OR UTR */}
                {(selectedItem.paymentScreenshotUrl || selectedItem.paymentId || selectedItem.utrNumber) && (
                  <div className="p-3 bg-white rounded-xl border border-[#E9B44C]/40 space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#382719] flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-primary" />
                        <span>भुगतान प्रमाण (Payment Proof)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary">
                        {selectedItem.paymentProofType === 'screenshot' || selectedItem.paymentScreenshotUrl ? 'Screenshot' : 'UTR Number'}
                      </span>
                    </div>

                    {(selectedItem.paymentId || selectedItem.utrNumber) && (
                      <div className="flex items-center justify-between bg-[#FFF8EF] p-2 rounded-lg font-mono">
                        <span className="text-xs text-[#666666] font-bold">UTR / Ref No:</span>
                        <span className="text-xs font-black text-primary tracking-wider">
                          {selectedItem.paymentId || selectedItem.utrNumber}
                        </span>
                      </div>
                    )}

                    {selectedItem.paymentScreenshotUrl && (
                      <div className="space-y-1.5 pt-1">
                        <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 max-h-56 flex items-center justify-center p-1">
                          <img
                            src={selectedItem.paymentScreenshotUrl}
                            alt="Payment Screenshot Proof"
                            className="max-h-52 w-auto object-contain rounded-lg"
                          />
                        </div>
                        <div className="text-right">
                          <a
                            href={selectedItem.paymentScreenshotUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-bold"
                          >
                            <span>पूर्ण आकार में स्क्रीनशॉट देखें (View Full Image)</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Help Seeker Specific Details & Bank Info */}
                {(selectedItem.helpType || selectedItem.bankAccount || selectedItem.amountNeeded || activeTab === 'helpRequests') && (
                  <div className="p-3.5 bg-white rounded-xl border border-primary/20 space-y-2.5 mt-2">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                      <span className="font-black text-xs text-[#382719]">सहायता प्रार्थी विवरण (Help Details)</span>
                      {selectedItem.urgency && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          selectedItem.urgency === 'urgent' || selectedItem.urgency === 'emergency' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {selectedItem.urgency}
                        </span>
                      )}
                    </div>

                    {selectedItem.description && (
                      <div className="text-xs text-[#555555] bg-gray-50 p-2 rounded-lg">
                        <span className="font-bold text-[#382719] block mb-0.5">समस्या / आवश्यकता:</span>
                        <p className="whitespace-pre-line">{selectedItem.description}</p>
                      </div>
                    )}

                    {selectedItem.amountNeeded && (
                      <div className="flex items-center justify-between font-mono text-xs">
                        <span className="font-bold text-[#666666]">आवश्यक राशि:</span>
                        <span className="font-black text-primary text-sm">₹{Number(selectedItem.amountNeeded).toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    {/* Bank Details */}
                    <div className="bg-[#FFF8EF] p-2.5 rounded-lg border border-[#E9B44C]/30 space-y-1 text-xs">
                      <span className="font-bold text-secondary block text-[11px] uppercase tracking-wider">बैंक खाता विवरण (Bank Details)</span>
                      <div className="flex justify-between">
                        <span className="text-[#666666]">खाता संख्या (A/C):</span>
                        <span className="font-mono font-bold text-[#382719]">{selectedItem.bankAccount || selectedItem.accountNumber || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666666]">IFSC कोड:</span>
                        <span className="font-mono font-bold text-[#382719]">{selectedItem.ifsc || 'N/A'}</span>
                      </div>
                      {selectedItem.accountHolderName && (
                        <div className="flex justify-between">
                          <span className="text-[#666666]">खाताधारक का नाम:</span>
                          <span className="font-bold text-[#382719]">{selectedItem.accountHolderName}</span>
                        </div>
                      )}
                      {(selectedItem.bankName || selectedItem.upiId) && (
                        <div className="flex justify-between">
                          <span className="text-[#666666]">बैंक / UPI ID:</span>
                          <span className="font-mono text-[#382719]">{selectedItem.bankName || selectedItem.upiId}</span>
                        </div>
                      )}
                    </div>

                    {/* Direct Contact Links */}
                    <div className="pt-1.5 flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-[#666666]">संपर्क करें:</span>
                      {(selectedItem.mobile || selectedItem.phone) && (
                        <a
                          href={`tel:${selectedItem.mobile || selectedItem.phone}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      )}
                      {(selectedItem.whatsapp || selectedItem.mobile || selectedItem.phone) && (
                        <a
                          href={`https://wa.me/91${(selectedItem.whatsapp || selectedItem.mobile || selectedItem.phone).replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-all"
                        >
                          <span>WhatsApp</span>
                        </a>
                      )}
                      {selectedItem.email && (
                        <a
                          href={`mailto:${selectedItem.email}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Email</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[#888888] font-bold">User Claimed Amount:</span>
                  <span className="font-mono font-bold text-[#382719]">
                    ₹{selectedItem.claimedAmount || selectedItem.amount || 200}/-
                  </span>
                </div>

                {selectedItem.memberId && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#888888] font-bold">Member ID:</span>
                    <span className="font-mono font-black text-emerald-700">{selectedItem.memberId}</span>
                  </div>
                )}

                {selectedItem.receiptNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#888888] font-bold">Receipt Number:</span>
                    <span className="font-mono font-bold text-primary">{selectedItem.receiptNumber}</span>
                  </div>
                )}
              </div>

              {/* View Mode: Send Receipt Action if Approved */}
              {modalMode === 'view' && selectedItem.status === 'approved' && (activeTab === 'memberships' || activeTab === 'donations' || activeTab === 'members') && (
                <div className="p-3.5 rounded-2xl bg-white border border-[#E9B44C]/40 flex items-center justify-between gap-3 shadow-xs">
                  <div>
                    <span className="font-bold text-xs text-[#382719] block">
                      {selectedItem.receiptSent ? 'रसीद प्रेषित है (Receipt Sent ✓)' : 'रसीद अभी सदस्य को नहीं भेजी गई है'}
                    </span>
                    <span className="text-[11px] text-[#777777]">
                      {selectedItem.receiptSent
                        ? 'सदस्य अपने डैशबोर्ड से रसीद डाउनलोड कर सकते हैं।'
                        : 'रसीद भेजने के बाद ही सदस्य इसे अपने डैशबोर्ड से डाउनलोड कर सकेंगे।'}
                    </span>
                  </div>

                  {selectedItem.receiptSent ? (
                    <button
                      type="button"
                      onClick={() => handleDownloadReceipt(selectedItem)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs inline-flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>रसीद देखें</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendReceipt(selectedItem, activeTab === 'members' ? 'membershipApplications' : activeTab)}
                      disabled={isProcessing}
                      className="px-4 py-2 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-bold shadow-xs inline-flex items-center gap-1.5 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>रसीद भेजें (Send Receipt)</span>
                    </button>
                  )}
                </div>
              )}

              {/* Approve Form Inputs */}
              {modalMode === 'approve' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs leading-relaxed">
                    <strong>Transaction Action: </strong>
                    {activeTab === 'memberships'
                      ? 'Approving generates a unique sequential Member ID (e.g. TRUST-M-0001), marks users/{uid}.isMember = true, and generates an official fee receipt.'
                      : 'Approving saves the admin-entered verified amount and generates a unique receipt number from counters/receipts.'}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#382719] mb-1">
                      Verified Amount Received (INR ₹) *
                    </label>
                    <input
                      type="number"
                      value={verifiedAmountInput}
                      onChange={(e) => setVerifiedAmountInput(e.target.value)}
                      placeholder="e.g. 200 or 501"
                      className="w-full p-3 rounded-xl border-2 border-emerald-500 font-mono font-black text-base focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      required
                    />
                    <span className="text-[11px] text-[#666666] block mt-1">
                      The official receipt will ALWAYS reflect this verified amount, not what the donor claimed.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      Admin Note (Optional):
                    </label>
                    <textarea
                      rows={2}
                      value={adminNoteInput}
                      onChange={(e) => setAdminNoteInput(e.target.value)}
                      placeholder="e.g. Bank of India UTR verified successfully."
                      className="w-full p-2.5 rounded-xl border border-[#E9B44C]/50 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Reject Form Inputs */}
              {modalMode === 'reject' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    Please provide a clear reason. The user will see this on their dashboard and can re-apply with a valid Payment ID.
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-rose-900 mb-1">
                      Reason for Rejection *
                    </label>
                    <textarea
                      rows={3}
                      value={rejectReasonInput}
                      onChange={(e) => setRejectReasonInput(e.target.value)}
                      placeholder="e.g. UTR number not found in Bank of India statement or invalid amount."
                      className="w-full p-3 rounded-xl border border-rose-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Remove Member Form */}
              {modalMode === 'removeMember' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs leading-relaxed flex items-start gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Are you sure you want to remove this member?</p>
                      <p className="mt-1">
                        Their membership status will be set to "removed", their Verified Member badge will be revoked from their dashboard immediately, but history will be preserved.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-rose-900 mb-1">
                      Reason for Removal (Shown to User) *
                    </label>
                    <textarea
                      rows={3}
                      value={removeReasonInput}
                      onChange={(e) => setRemoveReasonInput(e.target.value)}
                      placeholder="e.g. Membership term expired, or revoked due to trust conduct policy."
                      className="w-full p-3 rounded-xl border border-rose-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Modal Actions */}
            <div className="px-5 py-4 bg-[#FFF8EF] border-t border-[#E9B44C]/30 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-xl border border-[#E9B44C]/50 text-[#382719] font-bold text-xs hover:bg-white transition-all"
              >
                Close
              </button>

              {modalMode === 'approve' && (
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isProcessing ? 'Processing Transaction...' : 'Confirm & Approve'}
                </button>
              )}

              {modalMode === 'reject' && (
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isProcessing ? 'Processing...' : 'Confirm Reject'}
                </button>
              )}

              {modalMode === 'removeMember' && (
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isProcessing ? 'Revoking...' : 'Confirm Remove Member'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Authentic Traditional Receipt Modal */}
      <OfficialReceiptModal
        isOpen={Boolean(viewingReceipt)}
        onClose={() => setViewingReceipt(null)}
        receipt={viewingReceipt}
      />

    </div>
  );
};

export default AdminDashboard;
