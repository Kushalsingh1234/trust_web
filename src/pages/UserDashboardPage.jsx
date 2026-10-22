import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import TrustLogo from '../components/TrustLogo';
import HelpRequestModal from '../components/HelpRequestModal';
import VolunteerModal from '../components/VolunteerModal';
import MemberBadge from '../components/MemberBadge';
import DigitalIdCard from '../components/DigitalIdCard';
import OfficialReceiptModal from '../components/OfficialReceiptModal';
import JoinTrustModal from '../components/JoinTrustModal';
import { getPaymentSettings, submitDonationWithPaymentId } from '../firebase/paymentService';
import { subscribeUserCollection, getPublishedAnnouncements } from '../firebase/services';
import { uploadImageToCloudinary } from '../utils/cloudinaryService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  User,
  Phone,
  Mail,
  Shield,
  ShieldCheck,
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
  BadgeCheck,
  Camera,
  Upload,
  Bell,
  QrCode,
  X,
  Send,
  Building,
  Copy,
  Check,
  MessageSquare,
  Share2,
  Image as ImageIcon,
  Eye
} from 'lucide-react';

export const UserDashboardPage = () => {
  const { lang, toggleLanguage } = useLanguage();
  const { currentUser, userProfile, logout, isAdmin, refreshUserData } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Active Tab: 'helpRequests' | 'memberships' | 'volunteers' | 'donations'
  const [activeTab, setActiveTab] = useState('memberships');

  // Realtime Data from onSnapshot
  const [helpRequests, setHelpRequests] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [loading, setLoading] = useState(true);

  // Modals state
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinModalType, setJoinModalType] = useState('member'); // 'member' | 'volunteer'
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [volunteerModalOpen, setVolunteerModalOpen] = useState(false);
  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [viewingCard, setViewingCard] = useState(null); // DigitalIdCard data
  const [selectedNoticeModal, setSelectedNoticeModal] = useState(null);

  const handleOpenJoinModal = (type = 'member') => {
    setJoinModalType(type);
    setJoinModalOpen(true);
  };

  // Photo upload state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Donate More state
  const [donateAmount, setDonateAmount] = useState('500');
  const [customDonateAmount, setCustomDonateAmount] = useState('');
  const [donateProofType, setDonateProofType] = useState('utr'); // 'utr' | 'screenshot'
  const [donateUtr, setDonateUtr] = useState('');
  const [donateScreenshotFile, setDonateScreenshotFile] = useState(null);
  const [donateScreenshotPreview, setDonateScreenshotPreview] = useState(null);
  const [isSubmittingDonation, setIsSubmittingDonation] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Payment settings state
  const [paymentSettings, setPaymentSettings] = useState(null);

  // Load payment settings and announcements
  useEffect(() => {
    getPaymentSettings().then((settings) => {
      setPaymentSettings(settings);
    }).catch(console.error);

    getPublishedAnnouncements().then((data) => {
      setAnnouncements(data || []);
    }).catch(console.error);
  }, []);

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
      // Auto-switch to memberships if user has an application
      if (data.length > 0) setActiveTab('memberships');
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
    if (!timestamp) return lang === 'hi' ? 'हाल ही में' : 'Recent';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
      return date.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return lang === 'hi' ? 'हाल ही में' : 'Recent';
    }
  };

  // Profile Picture Upload Handler
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(lang === 'hi' ? 'फ़ाइल 5MB से छोटी होनी चाहिए।' : 'Image size must be less than 5MB.');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const res = await uploadImageToCloudinary(file, 'trust_profiles');
      const photoURL = typeof res === 'string' ? res : (res?.secure_url || res?.url);

      // Update Firestore users/{uid}
      if (currentUser?.uid) {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, { photoURL });

        // If approved membership exists, mirror photoURL there
        if (approvedMembership?.id) {
          try {
            await updateDoc(doc(db, 'membershipApplications', approvedMembership.id), { photoURL });
            await updateDoc(doc(db, 'memberships', approvedMembership.id), { photoURL });
          } catch (e) {}
        }
      }

      toast.success(lang === 'hi' ? 'प्रोफ़ाइल फ़ोटो सफलतापूर्वक अपडेट हुई!' : 'Profile photo updated successfully!');
      if (refreshUserData) await refreshUserData();
    } catch (err) {
      console.error("Photo upload error:", err);
      toast.error('Failed to upload photo: ' + err.message);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Submit Donate More from Dashboard
  const handleSubmitDonation = async (e) => {
    e.preventDefault();
    const finalAmount = customDonateAmount ? Number(customDonateAmount) : Number(donateAmount);
    if (!finalAmount || finalAmount <= 0) {
      toast.error(lang === 'hi' ? 'कृपया मान्य दान राशि चुनें' : 'Please select a valid donation amount');
      return;
    }

    if (donateProofType === 'utr' && !donateUtr.trim()) {
      toast.error(lang === 'hi' ? 'कृपया बैंक UTR / ट्रांजैक्शन संख्या दर्ज करें' : 'Please enter Bank UTR / Transaction number');
      return;
    }

    if (donateProofType === 'screenshot' && !donateScreenshotFile) {
      toast.error(lang === 'hi' ? 'कृपया भुगतान का स्क्रीनशॉट अपलोड करें' : 'Please upload payment screenshot');
      return;
    }

    setIsSubmittingDonation(true);
    try {
      let uploadedScreenshotUrl = null;
      if (donateProofType === 'screenshot' && donateScreenshotFile) {
        const uploadRes = await uploadImageToCloudinary(donateScreenshotFile, 'trust_donations');
        uploadedScreenshotUrl = typeof uploadRes === 'string' ? uploadRes : (uploadRes?.secure_url || uploadRes?.url);
      }

      await submitDonationWithPaymentId({
        donorName: userProfile?.fullName || currentUser?.displayName || 'Trust Contributor',
        donorPhone: userProfile?.phone || '',
        claimedAmount: finalAmount,
        purpose: 'samarpan',
        paymentId: donateProofType === 'utr' ? donateUtr.trim() : null,
        uid: currentUser?.uid,
        paymentProofType: donateProofType,
        paymentScreenshotUrl: uploadedScreenshotUrl
      });

      toast.success(
        lang === 'hi'
          ? 'समर्पण सफलतापूर्वक दर्ज हुआ! व्यवस्थापक द्वारा सत्यापन व रसीद प्रेषण के उपरांत रसीद डाउनलोड कर सकेंगे।'
          : 'Donation submitted! Receipt will be available once verified and sent by admin.'
      );

      setDonateModalOpen(false);
      setDonateUtr('');
      setDonateScreenshotFile(null);
      setDonateScreenshotPreview(null);
      setCustomDonateAmount('');
      setActiveTab('donations');
    } catch (err) {
      console.error("Donation submit failed:", err);
      toast.error('Donation submission failed: ' + err.message);
    } finally {
      setIsSubmittingDonation(false);
    }
  };

  // Compute effective memberships (seamlessly combines Firestore realtime with user profile & local cache)
  // Reset local lists when currentUser changes to avoid cross-user bleed
  useEffect(() => {
    setHelpRequests([]);
    setMemberships([]);
    setVolunteers([]);
    setDonations([]);
  }, [currentUser?.uid]);

  // Compute effective memberships (strictly general/patron members, not volunteer records)
  const effectiveMemberships = React.useMemo(() => {
    // Strictly isolate to current logged-in user
    const userOwnedMemberships = memberships.filter((m) => {
      if (!currentUser?.uid) return false;
      const isOwner = m.uid === currentUser.uid || m.applicantUid === currentUser.uid;
      const isVolunteerRecord = m.memberType === 'volunteer' || m.role === 'volunteer' || m.category === 'catC';
      return isOwner && !isVolunteerRecord;
    });

    if (userOwnedMemberships.length > 0) return userOwnedMemberships;

    // Check if userProfile indicates an active or pending membership
    if (userProfile?.isMember || userProfile?.memberId || userProfile?.hasAppliedMembership || userProfile?.membershipApplicationId || userProfile?.membershipStatus) {
      if (userProfile?.role !== 'volunteer' || userProfile?.isMember) {
        return [{
          id: userProfile.membershipApplicationId || userProfile.memberId || 'MEM-APP-ACTIVE',
          fullName: userProfile.fullName || 'सदस्य',
          phone: userProfile.phone || '',
          category: userProfile.category || userProfile.membershipCategory || 'catB',
          claimedAmount: userProfile.claimedAmount || 200,
          annualFee: userProfile.annualFee || userProfile.claimedAmount || 200,
          paymentId: userProfile.paymentId || 'SUBMITTED',
          paymentProofType: userProfile.paymentProofType || 'utr',
          paymentScreenshotUrl: userProfile.paymentScreenshotUrl || null,
          status: userProfile.membershipStatus || (userProfile.isMember ? 'approved' : 'pending'),
          receiptNumber: userProfile.receiptNumber || null,
          receiptSent: Boolean(userProfile.feeReceiptSent),
          memberId: userProfile.memberId || null,
          createdAt: userProfile.memberSince || userProfile.appliedAt || new Date()
        }];
      }
    }

    // Check localStorage cache from recent submission strictly for THIS user
    if (typeof window !== 'undefined' && currentUser?.uid) {
      try {
        const userScopedKey = `rsssst_my_membership_app_${currentUser.uid}`;
        const cached = localStorage.getItem(userScopedKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && (parsed.uid === currentUser.uid || parsed.applicantUid === currentUser.uid)) {
            if (parsed.memberType !== 'volunteer' && parsed.category !== 'catC') {
              return [parsed];
            }
          }
        }
      } catch (e) {}
    }

    return [];
  }, [memberships, userProfile, currentUser?.uid]);

  // Compute effective volunteers (from volunteers collection and volunteer tagged applications)
  const effectiveVolunteers = React.useMemo(() => {
    const userOwnedVolunteers = volunteers.filter((v) => {
      if (!currentUser?.uid) return false;
      return v.uid === currentUser.uid || v.applicantUid === currentUser.uid;
    });

    // Also include volunteer-tagged applications from memberships collection
    const volunteerFromMemberships = memberships.filter((m) => {
      if (!currentUser?.uid) return false;
      const isOwner = m.uid === currentUser.uid || m.applicantUid === currentUser.uid;
      return isOwner && (m.memberType === 'volunteer' || m.role === 'volunteer' || m.category === 'catC');
    });

    const combined = [...userOwnedVolunteers];
    for (const vm of volunteerFromMemberships) {
      if (!combined.some(c => c.id === vm.id)) {
        combined.push({
          ...vm,
          cardType: 'volunteer'
        });
      }
    }
    if (combined.length > 0) return combined;

    if (userProfile?.hasAppliedVolunteer || userProfile?.volunteerApplicationId || userProfile?.role === 'volunteer' || userProfile?.isVolunteer) {
      return [{
        id: userProfile.volunteerApplicationId || 'VOL-APP-ACTIVE',
        fullName: userProfile.fullName || 'सनातन स्वयंसेवक',
        phone: userProfile.phone || '',
        cityOrDistrict: userProfile.cityOrDistrict || 'गोरखपुर',
        availability: 'weekends',
        status: userProfile.volunteerStatus || (userProfile.isVolunteer ? 'approved' : 'pending'),
        cardType: 'volunteer',
        role: 'volunteer',
        createdAt: userProfile.appliedVolunteerAt || userProfile.appliedAt || new Date()
      }];
    }

    if (typeof window !== 'undefined' && currentUser?.uid) {
      try {
        const userScopedKey = `rsssst_my_volunteer_app_${currentUser.uid}`;
        const cached = localStorage.getItem(userScopedKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && (parsed.uid === currentUser.uid || parsed.applicantUid === currentUser.uid)) {
            return [{ ...parsed, cardType: 'volunteer' }];
          }
        }
      } catch (e) {}
    }

    return [];
  }, [volunteers, memberships, userProfile, currentUser?.uid]);

  // Compute effective donations (strictly deduplicated by canonical transaction/receipt key)
  const effectiveDonations = React.useMemo(() => {
    if (!donations || donations.length === 0) return [];
    const map = new Map();
    for (const item of donations) {
      const cleanPaymentId = (item.paymentId || item.utrNumber || '').trim().toUpperCase();
      const cleanReceipt = (item.receiptNumber || '').trim().toUpperCase();
      const memId = (item.membershipId || item.membershipApplicationId || '').trim();
      const canonKey = cleanReceipt || cleanPaymentId || memId || item.id;

      if (!map.has(canonKey)) {
        map.set(canonKey, item);
      } else {
        const existing = map.get(canonKey);
        if (item.status === 'approved' && existing.status !== 'approved') {
          map.set(canonKey, { ...existing, ...item });
        } else if (item.receiptNumber && !existing.receiptNumber) {
          map.set(canonKey, { ...existing, ...item });
        } else {
          map.set(canonKey, { ...item, ...existing });
        }
      }
    }
    return Array.from(map.values());
  }, [donations]);

  // Compute membership status
  const approvedMembership = effectiveMemberships.find((m) => m.status?.toLowerCase() === 'approved');
  const removedMembership = effectiveMemberships.find((m) => m.status?.toLowerCase() === 'removed');
  const isMember = Boolean(userProfile?.isMember === true || approvedMembership);
  const memberId = isMember ? (userProfile?.memberId || approvedMembership?.memberId || '') : '';
  const memberSince = isMember ? (userProfile?.memberSince || approvedMembership?.memberSince || approvedMembership?.approvedAt) : null;

  // Compute volunteer status
  const approvedVolunteer = effectiveVolunteers.find((v) => v.status?.toLowerCase() === 'approved');
  const isVolunteer = Boolean(userProfile?.isVolunteer === true || userProfile?.role === 'volunteer' || approvedVolunteer || effectiveVolunteers.length > 0);
  const volunteerId = isVolunteer ? (userProfile?.volunteerId || approvedVolunteer?.volunteerId || approvedVolunteer?.memberId || '') : '';

  // Cross-application status booleans
  const hasMemberApplication = Boolean(effectiveMemberships.length > 0 || isMember);
  const hasVolunteerApplication = Boolean(effectiveVolunteers.length > 0 || approvedVolunteer || userProfile?.hasAppliedVolunteer);

  // Filter notices for current user role
  const visibleNotices = React.useMemo(() => {
    return (announcements || []).filter((notice) => {
      const audience = notice.targetAudience || 'both';
      if (audience === 'both') return true;
      if (audience === 'members' && (isMember || hasMemberApplication)) return true;
      if (audience === 'volunteers' && (isVolunteer || hasVolunteerApplication)) return true;
      return false;
    });
  }, [announcements, isMember, isVolunteer, hasMemberApplication, hasVolunteerApplication]);

  const handleShareNoticeOnWhatsApp = (notice) => {
    const title = notice.title || 'आधिकारिक सूचना';
    const content = notice.content || '';
    const imgPart = notice.imageUrl ? `\n\n🖼️ पोस्टर देखें:\n${notice.imageUrl}` : '';
    const text = `📢 *राष्ट्रीय सनातन संस्कार सेवा संस्थान*\n📌 *${title}*\n\n${content}${imgPart}\n\n🌐 आधिकारिक वेबसाइट:\nhttps://rashtriyasanatantrust.in\n#SanatanTrust #OfficialNotice`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Status Badge Component
  const renderStatusBadge = (status) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'approved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{lang === 'hi' ? 'आवेदन स्वीकृत है ✅' : 'Application Approved ✅'}</span>
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
          <span>{lang === 'hi' ? 'सदस्यता निरस्त' : 'Membership Removed'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-300">
        <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin-slow" />
        <span>{lang === 'hi' ? 'समीक्षाधीन' : 'Under Review'}</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#454545] flex flex-col">
      {/* Top Navigation Bar - Pinned to Top */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FFF8EF]/95 backdrop-blur-md border-b border-[#E9B44C]/30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <TrustLogo className="w-9 h-9" showText={false} lang={lang} />
            <div>
              <span className="font-extrabold text-[#382719] text-sm sm:text-base tracking-tight font-hindi-heading block leading-tight">
                {lang === 'hi' ? 'सनातन संस्कार ट्रस्ट' : 'Sanatan Sanskar Trust'}
              </span>
              <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">
                {isVolunteer && !isMember
                  ? (lang === 'hi' ? 'स्वयंसेवक डैशबोर्ड' : 'Volunteer Dashboard')
                  : (lang === 'hi' ? 'सदस्य डैशबोर्ड' : 'Member Dashboard')}
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8 sm:pt-24 sm:pb-10 flex-1 w-full space-y-6">
        
        {/* Removed Membership Notification Banner */}
        {removedMembership && !userProfile?.isMember && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border border-rose-300 text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs animate-in fade-in">
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
          </div>
        )}

        {/* Profile Summary Card with Photo Upload */}
        <div className="rounded-3xl bg-gradient-to-br from-[#FFF8EF] via-white to-[#FFF8EF] border border-[#E9B44C]/40 p-5 sm:p-7 shadow-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl -z-10 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            {/* User Identity Details & Avatar with Cloudinary Photo Upload */}
            <div className="flex items-start sm:items-center gap-4">
              <div className="relative group w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center font-black text-2xl shadow-saffron border-2 border-white overflow-hidden">
                  {userProfile?.photoURL ? (
                    <img
                      src={userProfile.photoURL}
                      alt={userProfile.fullName || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{(userProfile?.fullName || userProfile?.username || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>

                {/* Profile Pic Upload Icon */}
                <label
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary hover:bg-secondary text-white cursor-pointer shadow-md transition-all hover:scale-110"
                  title={lang === 'hi' ? 'प्रोफ़ाइल फ़ोटो बदलें' : 'Upload Profile Picture'}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhoto}
                    className="hidden"
                  />
                </label>

                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center text-white text-[10px] font-bold">
                    <span>अपलोड...</span>
                  </div>
                )}
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
                    {userProfile?.fullName || (lang === 'hi' ? 'सदस्य' : 'Member')}
                  </h1>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {hasMemberApplication && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isMember
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {isMember
                          ? (lang === 'hi' ? '🛡️ सत्यापित सदस्य' : '🛡️ Verified Member')
                          : (lang === 'hi' ? '🛡️ सदस्य आवेदक' : '🛡️ Member Applicant')}
                      </span>
                    )}

                    {hasVolunteerApplication && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        approvedVolunteer || userProfile?.isVolunteer
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}>
                        {approvedVolunteer || userProfile?.isVolunteer
                          ? (lang === 'hi' ? '🤝 सनातन स्वयंसेवक' : '🤝 Sanatan Volunteer')
                          : (lang === 'hi' ? '🤝 स्वयंसेवक आवेदक' : '🤝 Volunteer Applicant')}
                      </span>
                    )}

                    {!hasMemberApplication && !hasVolunteerApplication && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                        {lang === 'hi' ? 'पंजीकृत उपयोगकर्ता' : 'Registered User'}
                      </span>
                    )}
                  </div>
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

                  {memberSince && (
                    <div className="flex items-center gap-1 text-[#454545]">
                      <Calendar className="w-3.5 h-3.5 text-secondary" />
                      <span>{lang === 'hi' ? 'सदस्यता तिथि: ' : 'Member Since: '}{formatDate(memberSince)}</span>
                    </div>
                  )}
                </div>

                {/* Member / Volunteer Card Action & Cross-Application Buttons */}
                <div className="pt-1.5 flex flex-wrap items-center gap-2">
                  {/* Digital Member ID Card Button */}
                  {isMember && (
                    <button
                      type="button"
                      onClick={() => setViewingCard({
                        ...(approvedMembership || {}),
                        fullName: userProfile?.fullName || approvedMembership?.fullName,
                        photoURL: userProfile?.photoURL,
                        memberId: memberId || approvedMembership?.memberId,
                        membershipNumber: memberId || approvedMembership?.memberId,
                        status: 'approved',
                        cardType: 'member'
                      })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-bold shadow-xs transition-all hover:scale-102"
                      title="View Digital Member Card"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? 'सदस्य पहचान पत्र' : 'Member ID Card'}</span>
                    </button>
                  )}

                  {/* Digital Volunteer ID Card Button */}
                  {(approvedVolunteer || (isVolunteer && userProfile?.isVolunteer)) && (
                    <button
                      type="button"
                      onClick={() => setViewingCard({
                        ...(approvedVolunteer || {}),
                        fullName: userProfile?.fullName || approvedVolunteer?.fullName,
                        photoURL: userProfile?.photoURL,
                        phone: userProfile?.phone || approvedVolunteer?.phone,
                        status: 'approved',
                        cardType: 'volunteer'
                      })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all hover:scale-102"
                      title="View Digital Volunteer Card"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? 'स्वयंसेवक पहचान पत्र' : 'Volunteer ID Card'}</span>
                    </button>
                  )}

                  {/* Member applying to also become a Volunteer */}
                  {!hasVolunteerApplication && (
                    <button
                      type="button"
                      onClick={() => handleOpenJoinModal('volunteer')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all hover:scale-102 cursor-pointer"
                      title={lang === 'hi' ? 'सनातन स्वयंसेवक के रूप में भी जुड़ें' : 'Also apply as a Volunteer'}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? '🤝 स्वयंसेवक भी बनें' : '🤝 Also Join as Volunteer'}</span>
                    </button>
                  )}

                  {/* Volunteer applying to also become a Member */}
                  {!hasMemberApplication && (
                    <button
                      type="button"
                      onClick={() => handleOpenJoinModal('member')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-bold shadow-xs transition-all hover:scale-102 cursor-pointer"
                      title={lang === 'hi' ? 'ट्रस्ट सदस्यता हेतु आवेदन करें' : 'Also apply as a Member'}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? '🛡️ ट्रस्ट सदस्य भी बनें' : '🛡️ Also Join as Member'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setDonateModalOpen(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white font-bold text-xs shadow-saffron transition-all"
              >
                <Heart className="w-4 h-4 fill-white" />
                <span>{lang === 'hi' ? 'दान / समर्पण करें' : 'Donate More'}</span>
              </button>

              <button
                type="button"
                onClick={() => setHelpModalOpen(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all"
              >
                <HandHeart className="w-4 h-4" />
                <span>{lang === 'hi' ? 'सहायता प्रार्थना' : 'Request Help'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notices & Announcements Feed from Trust Admin */}
        {visibleNotices.length > 0 && (
          <div className="rounded-2xl bg-white border border-[#E9B44C]/35 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E9B44C]/30 pb-2.5">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary animate-bounce-subtle" />
                <div>
                  <h3 className="font-black text-sm sm:text-base text-[#382719] font-hindi-heading">
                    {lang === 'hi' ? 'ट्रस्ट की आधिकारिक सूचनाएं एवं महत्वपूर्ण संदेश' : 'Official Trust Notices & Updates'}
                  </h3>
                  <p className="text-[11px] text-[#777777]">
                    {lang === 'hi' ? 'व्यवस्थापक द्वारा सदस्यों एवं स्वयंसेवकों के लिए जारी नवीनतम अपडेट' : 'Latest updates from Trust Admin for members & volunteers'}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-primary/10 text-primary border border-primary/20">
                {visibleNotices.length} {lang === 'hi' ? 'सूचनाएं' : 'Notices'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleNotices.map((notice) => {
                const audience = notice.targetAudience || 'both';
                return (
                  <div
                    key={notice.id}
                    className="p-4 rounded-2xl bg-gradient-to-br from-[#FFFDF9] via-white to-[#FFF8EF]/40 border border-[#E9B44C]/35 space-y-3 shadow-2xs hover:shadow-xs transition-all relative flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      {/* Optional Notice Image Poster */}
                      {notice.imageUrl && (
                        <div
                          onClick={() => setSelectedNoticeModal(notice)}
                          className="relative rounded-xl overflow-hidden border border-[#E9B44C]/30 bg-black/5 aspect-video max-h-48 cursor-pointer group shadow-2xs"
                          title={lang === 'hi' ? 'पूर्ण आकार में पोस्टर देखें' : 'Click to view full image'}
                        >
                          <img
                            src={notice.imageUrl}
                            alt={notice.title}
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2.5 text-white text-[11px] font-bold">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              <span>{lang === 'hi' ? 'बड़ा देखें' : 'View Full Image'}</span>
                            </span>
                            <span className="text-[10px] bg-black/50 px-2 py-0.5 rounded">पोस्टर</span>
                          </div>
                        </div>
                      )}

                      {/* Header tags: Target Audience + Category + Date */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Audience Badge */}
                          {audience === 'members' && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                              🛡️ केवल सदस्य
                            </span>
                          )}
                          {audience === 'volunteers' && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                              🤝 केवल स्वयंसेवक
                            </span>
                          )}
                          {audience === 'both' && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                              👥 सभी सदस्य एवं स्वयंसेवक
                            </span>
                          )}

                          {/* Category Badge */}
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            notice.category === 'urgent'
                              ? 'bg-rose-600 text-white'
                              : notice.category === 'event'
                              ? 'bg-blue-600 text-white'
                              : 'bg-primary text-white'
                          }`}>
                            {notice.category === 'urgent' ? 'अति महत्वपूर्ण' : notice.category === 'event' ? 'कार्यक्रम' : 'सामान्य सूचना'}
                          </span>
                        </div>

                        <span className="text-[10px] text-[#777777] font-medium">
                          {formatDate(notice.publishedAt || notice.createdAt)}
                        </span>
                      </div>

                      {/* Notice Title */}
                      <h4 className="font-extrabold text-sm sm:text-base text-[#382719] leading-snug font-hindi-heading">
                        {notice.title}
                      </h4>

                      {/* Notice Content */}
                      <p className="text-xs text-[#555555] whitespace-pre-line leading-relaxed line-clamp-3">
                        {notice.content}
                      </p>
                    </div>

                    {/* Action Footer: WhatsApp Share & View Modal */}
                    <div className="pt-2 border-t border-[#E9B44C]/20 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedNoticeModal(notice)}
                        className="text-[11px] font-bold text-primary hover:text-secondary flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{lang === 'hi' ? 'विस्तार से पढ़ें' : 'Read Full Notice'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShareNoticeOnWhatsApp(notice)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-all hover:scale-102 cursor-pointer"
                        title={lang === 'hi' ? 'व्हाट्सएप पर शेयर करें' : 'Share on WhatsApp'}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{lang === 'hi' ? 'व्हाट्सएप पर शेयर' : 'WhatsApp Share'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4 Core Tabs Navigation */}
        <div className="flex border-b border-[#E9B44C]/30 overflow-x-auto no-scrollbar gap-1.5 sm:gap-2 pb-1">
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
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-mono font-bold">
              {effectiveMemberships.length}
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
            <span>{lang === 'hi' ? 'मेरी स्वयंसेवक सेवा' : 'Volunteer Dashboard'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-mono font-bold">
              {effectiveVolunteers.length}
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
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-mono font-bold">
              {effectiveDonations.length}
            </span>
          </button>

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
            <span>{lang === 'hi' ? 'मेरी सहायता प्रार्थनाएं' : 'Help Requests'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-mono font-bold">
              {helpRequests.length}
            </span>
          </button>
        </div>

        {/* Tab 1: My Membership */}
        {activeTab === 'memberships' && (
          <div className="space-y-4">
            {effectiveMemberships.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-3xl bg-white border border-[#E9B44C]/30 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[#382719] font-hindi-heading">
                  {lang === 'hi' ? 'कोई सक्रिय सदस्यता आवेदन नहीं मिला' : "No active membership application"}
                </h3>
                <p className="text-sm text-[#666666] max-w-md mx-auto mt-1 mb-5">
                  {lang === 'hi'
                    ? 'राष्ट्रीय सनातन संस्कार सेवा संस्थान के अधिकृत सदस्य बनें और डिजिटल सदस्य पहचान पत्र प्राप्त करें।'
                    : 'Join as an official member of the Trust and receive your official Digital Member ID card.'}
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenJoinModal('member')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{lang === 'hi' ? '🛡️ ट्रस्ट सदस्यता हेतु आवेदन करें' : 'Apply for Trust Membership'}</span>
                </button>
              </div>
            ) : (
              effectiveMemberships.map((item) => {
                const isApproved = item.status?.toLowerCase() === 'approved';
                const isRejected = item.status?.toLowerCase() === 'rejected';
                const isRemoved = item.status?.toLowerCase() === 'removed';
                const canDownloadReceipt = Boolean(item.receiptSent || userProfile?.feeReceiptSent);

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
                          {item.category === 'catA' ? (lang === 'hi' ? '₹0 (छूट / निःशुल्क)' : '₹0 (Exempted)') : (lang === 'hi' ? `₹${item.annualFee ?? 200}/वर्ष` : `₹${item.annualFee ?? 200}/year`)}
                        </span>
                      </div>

                      {/* Payment Proof details */}
                      {(item.paymentId || item.utrNumber) && (
                        <div>
                          <span className="text-[#888888] block">{lang === 'hi' ? 'भुगतान आईडी / UTR:' : 'Payment ID / UTR:'}</span>
                          <span className="font-mono font-bold text-secondary">{item.paymentId || item.utrNumber}</span>
                        </div>
                      )}

                      {item.paymentScreenshotUrl && (
                        <div>
                          <span className="text-[#888888] block">{lang === 'hi' ? 'भुगतान स्क्रीनशॉट:' : 'Payment Screenshot:'}</span>
                          <a
                            href={item.paymentScreenshotUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline font-bold text-xs mt-0.5"
                          >
                            <span>स्क्रीनशॉट देखें</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                      {isApproved && item.receiptNumber && (
                        <div>
                          <span className="text-[#888888] block">{lang === 'hi' ? 'रसीद संख्या:' : 'Receipt Number:'}</span>
                          <span className="font-mono font-bold text-emerald-700">{item.receiptNumber}</span>
                        </div>
                      )}

                      {item.address && (
                        <div className="sm:col-span-2">
                          <span className="text-[#888888] block">{lang === 'hi' ? 'स्थानीय पता:' : 'Address:'}</span>
                          <span className="font-medium text-[#454545]">{item.address} {item.district ? `, ${item.district}` : ''}</span>
                        </div>
                      )}
                    </div>

                    {/* Pending Notice */}
                    {item.status === 'pending' && (
                      <div className="mt-2 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span>
                            {lang === 'hi'
                              ? 'आपका आवेदन व्यवस्थापक की समीक्षाधीन है। स्वीकृति उपरांत आपका सदस्य कार्ड एवं शुल्क रसीद उपलब्ध होगी।'
                              : 'Your application is under review. Member card and receipt will be available after admin approval.'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Approved Actions: Download Receipt (ONLY AFTER ADMIN SENDS) & Member Card */}
                    {isApproved && (
                      <div className="mt-3 pt-3 border-t border-emerald-100 flex flex-wrap items-center gap-2.5">
                        {item.category === 'catA' || item.claimedAmount === 0 || item.paymentId === 'CROSS_APPROVED_FREE' || item.paymentStatus === 'exempted' ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{lang === 'hi' ? 'निःशुल्क पंजीकरण छूट (₹0) • रसीद आवश्यक नहीं' : 'Free Cross-Registration (₹0) • No Receipt Needed'}</span>
                          </div>
                        ) : canDownloadReceipt ? (
                          <button
                            type="button"
                            onClick={() => {
                              setViewingReceipt({
                                receiptNumber: item.receiptNumber || 'RSSSST-2026-MEMBER',
                                donorName: item.fullName || userProfile?.fullName,
                                phone: item.mobile || item.phone || item.donorPhone || userProfile?.mobile || userProfile?.phone || '',
                                mobile: item.mobile || item.phone || item.donorPhone || userProfile?.mobile || userProfile?.phone || '',
                                donorPhone: item.mobile || item.phone || item.donorPhone || userProfile?.mobile || userProfile?.phone || '',
                                username: item.username || userProfile?.username,
                                memberId: item.memberId || userProfile?.memberId,
                                fatherHusbandName: item.fatherHusbandName || userProfile?.fatherHusbandName || '',
                                address: item.address || item.district || userProfile?.address || '',
                                block: item.block || 'सदर',
                                district: item.district || userProfile?.district || 'गोरखपुर',
                                state: item.state || userProfile?.state || 'उत्तर प्रदेश',
                                purpose: 'membership_fee',
                                verifiedAmount: item.verifiedAmount || item.claimedAmount || 200,
                                claimedAmount: item.claimedAmount || 200,
                                paymentId: item.paymentId || item.utrNumber,
                                approvedAt: item.approvedAt || item.memberSince
                              });
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{lang === 'hi' ? 'शुल्क रसीद डाउनलोड करें' : 'Download Fee Receipt'}</span>
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>{lang === 'hi' ? 'शुल्क रसीद व्यवस्थापक द्वारा समीक्षा उपरांत भेजी जाएगी।' : 'Fee receipt will be available once sent by admin.'}</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setViewingCard({
                            ...item,
                            fullName: item.fullName || userProfile?.fullName,
                            photoURL: userProfile?.photoURL,
                            memberId: item.memberId || userProfile?.memberId || memberId,
                            membershipNumber: item.memberId || userProfile?.memberId || memberId,
                            status: 'approved',
                            cardType: 'member'
                          })}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FFF8EF] border border-[#E9B44C]/60 text-[#382719] font-bold text-xs shadow-xs transition-all"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-primary" />
                          <span>{lang === 'hi' ? 'सदस्य पहचान पत्र देखें' : 'View Member ID Card'}</span>
                        </button>
                      </div>
                    )}

                    {/* Rejected Notice */}
                    {isRejected && (
                      <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">{lang === 'hi' ? 'अस्वीकृति कारण: ' : 'Rejection Reason: '}</span>
                            <span>{item.rejectionReason || item.adminNote || (lang === 'hi' ? 'भुगतान संदर्भ अमान्य पाया गया।' : 'Payment reference could not be verified.')}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Cross-apply: Member can apply as Volunteer */}
            {!hasVolunteerApplication && effectiveMemberships.length > 0 && (
              <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#382719] font-hindi-heading">
                      {lang === 'hi' ? '🤝 क्या आप सनातन स्वयंसेवक भी बनना चाहते हैं?' : '🤝 Also want to apply as a Sanatan Volunteer?'}
                    </h4>
                    <p className="text-xs text-[#666666]">
                      {lang === 'hi'
                        ? 'संस्कार जागरण शिविरों, सहायता अभियानों एवं कार्यक्रमों में स्वयंसेवक के रूप में सक्रिय भूमिका निभाएं।'
                        : 'Participate actively in Vedic awareness camps, welfare drives and public events as a volunteer.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenJoinModal('volunteer')}
                  className="shrink-0 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? '🤝 स्वयंसेवक भी बनें' : 'Apply as Volunteer'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Volunteer Dashboard */}
        {activeTab === 'volunteers' && (
          <div className="space-y-4">
            {effectiveVolunteers.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-3xl bg-white border border-[#E9B44C]/30 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[#382719] font-hindi-heading">
                  {lang === 'hi' ? 'आपने अभी तक स्वयंसेवक के रूप में आवेदन नहीं किया है' : "You haven't applied as a volunteer yet"}
                </h3>
                <p className="text-sm text-[#666666] max-w-md mx-auto mt-1 mb-5">
                  {lang === 'hi'
                    ? 'संस्कार जागरण, वैदिक शिविर एवं सेवा कार्यों में निष्काम भाव से योगदान देने हेतु सनातन स्वयंसेवक के रूप में जुड़ें।'
                    : 'Join our volunteer taskforce to organize Vedic awareness camps and humanitarian welfare drives.'}
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenJoinModal('volunteer')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>{lang === 'hi' ? '🤝 सनातन स्वयंसेवक बनें' : 'Become a Volunteer'}</span>
                </button>
              </div>
            ) : (
              effectiveVolunteers.map((item) => {
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
                            {lang === 'hi' ? 'सनातन स्वयंसेवक सेवा आवेदन' : 'Volunteer Application'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF8EF] text-secondary border border-[#E9B44C]">
                            {item.availability === 'full_time' ? 'पूर्णकालिक' : item.availability === 'few_hours_daily' ? 'प्रतिदिन कुछ घंटे' : (lang === 'hi' ? 'सप्ताहांत' : 'Weekends')}
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

                    {/* Approved Volunteer Action */}
                    {isApproved && (
                      <div className="mt-3 pt-3 border-t border-emerald-100 flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setViewingCard({
                            ...item,
                            fullName: item.fullName || userProfile?.fullName,
                            photoURL: userProfile?.photoURL,
                            phone: userProfile?.phone || item.phone,
                            status: 'approved',
                            cardType: 'volunteer'
                          })}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{lang === 'hi' ? 'स्वयंसेवक पहचान पत्र देखें' : 'View Volunteer ID Card'}</span>
                        </button>

                        {/* Volunteer Fee Receipt or Exemption */}
                        {item.claimedAmount === 0 || item.paymentId === 'CROSS_APPROVED_FREE' || item.paymentStatus === 'exempted' ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{lang === 'hi' ? 'निःशुल्क पंजीकरण छूट (₹0) • रसीद आवश्यक नहीं' : 'Free Cross-Registration (₹0) • No Receipt Needed'}</span>
                          </div>
                        ) : Boolean(item.receiptSent || userProfile?.feeReceiptSent) ? (
                          <button
                            type="button"
                            onClick={() => {
                              setViewingReceipt({
                                receiptNumber: item.receiptNumber || 'RSSSST-2026-VOLUNTEER',
                                donorName: item.fullName || userProfile?.fullName,
                                phone: item.mobile || item.phone || item.donorPhone || userProfile?.mobile || userProfile?.phone || '',
                                mobile: item.mobile || item.phone || item.donorPhone || userProfile?.mobile || userProfile?.phone || '',
                                donorPhone: item.mobile || item.phone || item.donorPhone || userProfile?.mobile || userProfile?.phone || '',
                                username: item.username || userProfile?.username,
                                memberId: item.volunteerId || item.memberId || userProfile?.volunteerId,
                                address: item.address || item.cityOrDistrict || userProfile?.address || '',
                                district: item.cityOrDistrict || userProfile?.district || 'गोरखपुर',
                                state: 'उत्तर प्रदेश',
                                purpose: 'volunteer_registration',
                                verifiedAmount: item.verifiedAmount || item.amount || 200,
                                claimedAmount: item.claimedAmount || item.amount || 200,
                                paymentId: item.paymentId || 'VERIFIED',
                                approvedAt: item.approvedAt || item.createdAt
                              });
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs shadow-xs transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{lang === 'hi' ? 'शुल्क रसीद डाउनलोड करें' : 'Download Fee Receipt'}</span>
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>{lang === 'hi' ? 'शुल्क रसीद व्यवस्थापक द्वारा समीक्षा उपरांत भेजी जाएगी।' : 'Fee receipt will be available once sent by admin.'}</span>
                          </div>
                        )}
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

            {/* Cross-apply: Volunteer can apply as Member */}
            {!hasMemberApplication && effectiveVolunteers.length > 0 && (
              <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#382719] font-hindi-heading">
                      {lang === 'hi' ? '🛡️ क्या आप ट्रस्ट के अधिकृत सदस्य भी बनना चाहते हैं?' : '🛡️ Would you also like to become a Trust Member?'}
                    </h4>
                    <p className="text-xs text-[#666666]">
                      {lang === 'hi'
                        ? 'ट्रस्ट के आधिकारिक सदस्य बनें और संस्था का डिजिटल सदस्य पहचान पत्र प्राप्त करें।'
                        : 'Join as an official member of the Trust and receive your official Digital Member ID.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenJoinModal('member')}
                  className="shrink-0 px-4 py-2 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? '🛡️ ट्रस्ट सदस्य भी बनें' : 'Apply as Member'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: My Donations & Samarpan */}
        {activeTab === 'donations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#E9B44C]/30 shadow-xs">
              <div>
                <h3 className="font-black text-sm sm:text-base text-[#382719] font-hindi-heading">
                  {lang === 'hi' ? 'ट्रस्ट सेवा प्रकल्पों हेतु समर्पण' : 'Charitable Contributions & Donations'}
                </h3>
                <p className="text-xs text-[#666666]">
                  {lang === 'hi' ? 'अपने डैशबोर्ड से सीधे समर्पण करें एवं व्यवस्थापक द्वारा अनुमोदित आधिकारिक रसीद प्राप्त करें।' : 'Contribute directly from your dashboard and download official receipts.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDonateModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white font-bold text-xs shadow-saffron transition-all inline-flex items-center gap-1.5 shrink-0"
              >
                <Heart className="w-3.5 h-3.5 fill-white" />
                <span>{lang === 'hi' ? 'और दान करें' : 'Donate More'}</span>
              </button>
            </div>

            {effectiveDonations.length === 0 ? (
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
                <button
                  type="button"
                  onClick={() => setDonateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs shadow-saffron transition-all"
                >
                  <Heart className="w-4 h-4 fill-white" />
                  <span>{lang === 'hi' ? 'दान / समर्पण करें' : 'Donate Now'}</span>
                </button>
              </div>
            ) : (
              effectiveDonations.map((item) => {
                const isApproved = item.status?.toLowerCase() === 'approved';
                const isRejected = item.status?.toLowerCase() === 'rejected';
                const canDownloadReceipt = Boolean(
                  item.receiptSent ||
                  userProfile?.feeReceiptSent ||
                  (item.receiptNumber && userProfile?.feeReceiptSent) ||
                  (item.receiptNumber && userProfile?.receiptNumber && item.receiptNumber === userProfile?.receiptNumber)
                );

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
                            {item.purposeLabel || (item.purpose === 'membership_fee' ? 'सदस्यता शुल्क' : (lang === 'hi' ? 'समर्पण निधि' : 'Donation'))}
                          </span>
                          <span className="font-mono font-black text-primary text-base">
                            ₹{Number(item.verifiedAmount || item.claimedAmount || item.amount || 0).toLocaleString('en-IN')}
                          </span>
                          {isApproved && (item.receiptNumber || userProfile?.receiptNumber) && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {item.receiptNumber || userProfile?.receiptNumber}
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
                        <span className="text-[#888888] block">{lang === 'hi' ? 'घोषित राशि:' : 'Claimed Amount:'}</span>
                        <span className="font-mono font-bold text-[#382719]">₹{Number(item.claimedAmount || item.amount || 0).toLocaleString('en-IN')}</span>
                      </div>
                      {isApproved && (
                        <div>
                          <span className="text-[#888888] block">{lang === 'hi' ? 'सत्यापित राशि:' : 'Verified Amount:'}</span>
                          <span className="font-mono font-bold text-emerald-700">₹{Number(item.verifiedAmount || item.amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {(item.paymentId || item.utrNumber) && (
                        <div>
                          <span className="text-[#888888] block">{lang === 'hi' ? 'भुगतान आईडी / UTR:' : 'Payment ID / UTR:'}</span>
                          <span className="font-mono font-bold text-secondary">{item.paymentId || item.utrNumber}</span>
                        </div>
                      )}
                      {item.paymentScreenshotUrl && (
                        <div>
                          <span className="text-[#888888] block">{lang === 'hi' ? 'भुगतान स्क्रीनशॉट:' : 'Payment Screenshot:'}</span>
                          <a
                            href={item.paymentScreenshotUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline font-bold text-xs mt-0.5"
                          >
                            <span>स्क्रीनशॉट देखें</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Pending Notice */}
                    {item.status === 'pending' && (
                      <div className="mt-2 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>{lang === 'hi' ? 'व्यवस्थापक द्वारा सत्यापन एवं रसीद प्रेषण के उपरांत आधिकारिक रसीद उपलब्ध होगी।' : 'Receipt available after admin approval and receipt dispatch.'}</span>
                      </div>
                    )}

                    {/* Approved Actions: Download Receipt (GATED BY receiptSent) */}
                    {isApproved && (
                      <div className="mt-3 pt-3 border-t border-emerald-100 flex flex-wrap items-center gap-2.5">
                        {canDownloadReceipt ? (
                          <button
                            type="button"
                            onClick={() => {
                              setViewingReceipt({
                                receiptNumber: item.receiptNumber || userProfile?.receiptNumber || 'RSSSST-2026-DONATION',
                                donorName: item.donorName || item.fullName || userProfile?.fullName,
                                username: item.username || userProfile?.username,
                                memberId: item.memberId || userProfile?.memberId,
                                phone: item.donorPhone || item.phone || item.mobile || userProfile?.phone || userProfile?.mobile || '',
                                mobile: item.donorPhone || item.phone || item.mobile || userProfile?.phone || userProfile?.mobile || '',
                                donorPhone: item.donorPhone || item.phone || item.mobile || userProfile?.phone || userProfile?.mobile || '',
                                fatherHusbandName: item.fatherHusbandName || userProfile?.fatherHusbandName || '',
                                address: item.address || userProfile?.address || '',
                                district: item.district || userProfile?.district || 'गोरखपुर',
                                state: item.state || userProfile?.state || 'उत्तर प्रदेश',
                                purpose: item.purpose || 'membership_fee',
                                verifiedAmount: item.verifiedAmount || item.amount || 200,
                                paymentId: item.paymentId || item.utrNumber,
                                approvedAt: item.approvedAt || item.createdAt
                              });
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{lang === 'hi' ? 'आधिकारिक रसीद डाउनलोड करें' : 'Download Receipt'}</span>
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>{lang === 'hi' ? 'दान रसीद व्यवस्थापक द्वारा समीक्षा उपरांत भेजी जाएगी।' : 'Donation receipt will be available once sent by admin.'}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 4: My Help Requests */}
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
                      isApproved ? 'border-emerald-300 ring-1 ring-emerald-200' : isRejected ? 'border-rose-200' : 'border-[#E9B44C]/40'
                    }`}
                  >
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
                        <span className="font-bold text-[#382719]">{item.phone || item.mobile}</span>
                      </div>
                      {item.amountNeeded && (
                        <div>
                          <span className="text-[#888888] block">{lang === 'hi' ? 'अपेक्षित सहायता राशि:' : 'Amount Needed:'}</span>
                          <span className="font-mono font-bold text-primary">₹{Number(item.amountNeeded).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </div>

                    {item.description && (
                      <div className="mt-2 p-3 rounded-xl bg-[#FFF8EF] border border-[#E9B44C]/25 text-xs text-[#454545]">
                        <span className="font-bold text-[#382719] block mb-1">{lang === 'hi' ? 'समस्या का विवरण:' : 'Description:'}</span>
                        <p className="leading-relaxed">{item.description}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

      </main>

      {/* DONATE MORE MODAL (Directly on Dashboard) */}
      {donateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#E9B44C]/40 overflow-hidden my-auto max-h-[94vh] flex flex-col text-left">
            <div className="px-5 py-4 bg-gradient-to-r from-primary to-secondary text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 fill-white" />
                <h3 className="font-black text-sm sm:text-base font-hindi-heading">
                  {lang === 'hi' ? 'ट्रस्ट सेवा प्रकल्पों हेतु समर्पण / दान' : 'Contribute Donation to Trust'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDonateModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDonation} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {/* Payment Details Strip */}
              <div className="p-4 rounded-2xl bg-[#FFF8EF] border border-[#E9B44C]/40 text-center space-y-3">
                <span className="text-xs font-bold text-[#382719] block">
                  {lang === 'hi' ? 'आधिकारिक QR कोड या बैंक विवरण पर भुगतान करें' : 'Scan QR or Pay via Bank Transfer'}
                </span>

                <div className="w-36 h-36 mx-auto p-2 rounded-xl bg-white border border-[#E9B44C] flex items-center justify-center shadow-xs">
                  <img
                    src={paymentSettings?.qrImageUrl || '/payment-qr.png'}
                    alt="Payment QR"
                    className="w-full h-full object-contain"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/payment-qr.png'; }}
                  />
                </div>

                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary bg-white px-3 py-1 rounded-lg border border-[#E9B44C]/40">
                    {paymentSettings?.upiId || 'boim-135883270012@boi'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(paymentSettings?.upiId || 'boim-135883270012@boi');
                      setCopiedUpi(true);
                      setTimeout(() => setCopiedUpi(false), 2000);
                    }}
                    className="p-1.5 rounded-lg bg-white border border-[#E9B44C]/40 hover:bg-primary hover:text-white transition-all text-xs"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="text-[11px] text-[#555555] bg-white p-2 rounded-xl border border-[#E9B44C]/30 text-left space-y-0.5 font-mono">
                  <div><strong>Bank:</strong> Bank of India (बैंक ऑफ इंडिया)</div>
                  <div><strong>A/C No:</strong> 135820110000012</div>
                  <div><strong>IFSC:</strong> BKID0001358</div>
                  <div><strong>A/C Holder:</strong> Rashtriya Sanatan Sanskar Seva Sansthan (Trust)</div>
                </div>
              </div>

              {/* Amount Selection */}
              <div>
                <label className="block text-xs font-bold text-[#382719] mb-1.5">
                  {lang === 'hi' ? 'समर्पण राशि (INR ₹) *' : 'Donation Amount (INR ₹) *'}
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {['100', '250', '500', '1100'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => { setDonateAmount(amt); setCustomDonateAmount(''); }}
                      className={`py-2 rounded-xl font-mono font-bold text-xs transition-all ${
                        donateAmount === amt && !customDonateAmount
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-[#FFF8EF] text-[#382719] border border-[#E9B44C]/40 hover:bg-[#FFF8EF]/80'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={customDonateAmount}
                  onChange={(e) => setCustomDonateAmount(e.target.value)}
                  placeholder={lang === 'hi' ? 'अथवा अन्य राशि दर्ज करें (उदा. 2100)' : 'Or enter custom amount (e.g. 2100)'}
                  className="w-full px-3 py-2 rounded-xl border border-[#E9B44C]/50 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Payment Proof Selection: UTR OR Screenshot */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#382719]">
                  {lang === 'hi' ? 'भुगतान प्रमाण का विकल्प चुनें *' : 'Select Payment Proof Option *'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDonateProofType('utr')}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-center ${
                      donateProofType === 'utr'
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-white text-[#382719] border-[#E9B44C]/50 hover:bg-[#FFF8EF]'
                    }`}
                  >
                    1. UTR / Ref Number
                  </button>
                  <button
                    type="button"
                    onClick={() => setDonateProofType('screenshot')}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-center ${
                      donateProofType === 'screenshot'
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-white text-[#382719] border-[#E9B44C]/50 hover:bg-[#FFF8EF]'
                    }`}
                  >
                    2. Upload Screenshot
                  </button>
                </div>

                {donateProofType === 'utr' ? (
                  <div className="pt-1">
                    <input
                      type="text"
                      value={donateUtr}
                      onChange={(e) => setDonateUtr(e.target.value)}
                      placeholder={lang === 'hi' ? '12 अंकों का UTR / Transaction Ref दर्ज करें' : 'Enter 12-digit UTR / Ref Number'}
                      className="w-full p-2.5 rounded-xl border border-[#E9B44C]/60 text-xs font-mono font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                ) : (
                  <div className="pt-1">
                    <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-[#E9B44C] rounded-xl bg-[#FFF8EF]/40 hover:bg-[#FFF8EF] cursor-pointer transition-all">
                      <Upload className="w-5 h-5 text-primary mb-1" />
                      <span className="text-xs font-bold text-[#382719]">
                        {donateScreenshotFile ? donateScreenshotFile.name : (lang === 'hi' ? 'भुगतान का स्क्रीनशॉट चुनें' : 'Choose Payment Screenshot')}
                      </span>
                      <span className="text-[10px] text-[#777777]">PNG, JPG (Max 5MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setDonateScreenshotFile(file);
                            setDonateScreenshotPreview(URL.createObjectURL(file));
                          }
                        }}
                        className="hidden"
                      />
                    </label>

                    {donateScreenshotPreview && (
                      <div className="mt-2 text-center">
                        <img
                          src={donateScreenshotPreview}
                          alt="Screenshot Preview"
                          className="max-h-32 mx-auto rounded-lg border border-[#E9B44C]"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDonateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-[#666666] hover:bg-gray-100 transition-all"
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDonation}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white font-bold text-xs shadow-saffron transition-all disabled:opacity-50"
                >
                  {isSubmittingDonation
                    ? (lang === 'hi' ? 'समर्पण दर्ज हो रहा है...' : 'Submitting Donation...')
                    : (lang === 'hi' ? 'समर्पण जमा करें' : 'Submit Donation')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIGITAL MEMBER / VOLUNTEER ID CARD MODAL */}
      {viewingCard && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#E9B44C]/50 overflow-hidden my-auto max-h-[96vh] flex flex-col">
            <div className="px-5 py-3.5 bg-primary text-white flex items-center justify-between">
              <span className="font-black text-sm">
                {viewingCard.cardType === 'volunteer'
                  ? (lang === 'hi' ? 'स्वयंसेवक पहचान पत्र' : 'Volunteer ID Card')
                  : (lang === 'hi' ? 'सदस्यता पहचान पत्र' : 'Member ID Card')}
              </span>
              <button
                type="button"
                onClick={() => setViewingCard(null)}
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto">
              <DigitalIdCard
                member={{
                  ...viewingCard,
                  status: 'approved',
                  photoURL: userProfile?.photoURL || viewingCard.photoURL
                }}
                onClose={() => setViewingCard(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modals Accessible Direct from Dashboard */}
      <HelpRequestModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />


      <VolunteerModal
        isOpen={volunteerModalOpen}
        onClose={() => setVolunteerModalOpen(false)}
      />

      {/* Trust Joining Modal for Member or Volunteer Registration */}
      <JoinTrustModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        initialType={joinModalType}
      />

      {/* Authentic Traditional Receipt Modal (Only available once sent by admin) */}
      <OfficialReceiptModal
        isOpen={Boolean(viewingReceipt)}
        onClose={() => setViewingReceipt(null)}
        receipt={viewingReceipt}
      />

      {/* Detailed Notice Lightbox / Modal */}
      {selectedNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E9B44C]/40 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-[#FFF8EF] via-white to-[#FFF8EF] border-b border-[#E9B44C]/30 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                  selectedNoticeModal.category === 'urgent'
                    ? 'bg-rose-600 text-white'
                    : selectedNoticeModal.category === 'event'
                    ? 'bg-blue-600 text-white'
                    : 'bg-primary text-white'
                }`}>
                  {selectedNoticeModal.category === 'urgent' ? 'अति महत्वपूर्ण' : selectedNoticeModal.category === 'event' ? 'कार्यक्रम' : 'आधिकारिक सूचना'}
                </span>
                <span className="text-[10px] font-bold text-[#666666]">
                  {formatDate(selectedNoticeModal.publishedAt || selectedNoticeModal.createdAt)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNoticeModal(null)}
                className="p-1 rounded-full text-[#666666] hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              {/* Image Banner */}
              {selectedNoticeModal.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-[#E9B44C]/30 bg-black/5 max-h-80 shadow-xs">
                  <img
                    src={selectedNoticeModal.imageUrl}
                    alt={selectedNoticeModal.title}
                    className="w-full h-auto max-h-80 object-contain mx-auto"
                  />
                </div>
              )}

              {/* Title */}
              <h2 className="text-lg sm:text-xl font-black text-[#382719] font-hindi-heading leading-snug">
                {selectedNoticeModal.title}
              </h2>

              {/* Detailed Content */}
              <div className="p-4 rounded-2xl bg-[#FFF8EF]/50 border border-[#E9B44C]/25 text-sm sm:text-base text-[#382719] leading-relaxed whitespace-pre-wrap font-serif">
                {selectedNoticeModal.content}
              </div>

              {/* Trust Footer Note */}
              <div className="pt-2 text-xs text-[#777777] border-t border-[#E9B44C]/20 flex items-center justify-between">
                <span>राष्ट्रीय सनातन संस्कार सेवा संस्थान</span>
                <span>गोरखपुर (उ.प्र.)</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-3.5 bg-[#FFF8EF] border-t border-[#E9B44C]/30 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleShareNoticeOnWhatsApp(selectedNoticeModal)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-102 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{lang === 'hi' ? 'व्हाट्सएप पर शेयर करें' : 'Share on WhatsApp'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedNoticeModal(null)}
                className="px-4 py-2 rounded-xl border border-[#E9B44C]/50 text-[#382719] font-bold text-xs hover:bg-white transition-all cursor-pointer"
              >
                {lang === 'hi' ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboardPage;
