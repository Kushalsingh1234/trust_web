import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { submitMembershipWithPaymentId } from '../firebase/membershipService';
import { subscribePaymentSettings, DEFAULT_PAYMENT_SETTINGS } from '../firebase/paymentService';
import MemberBadge from './MemberBadge';
import {
  X,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Heart,
  Users,
  HandHeart,
  Copy,
  Check,
  ArrowRight,
  Globe,
  QrCode,
  Calendar,
  CreditCard,
  Building,
  Info,
  Clock,
  Briefcase,
  Award,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const JoinTrustModal = ({ isOpen, onClose, defaultCategory = 'catB', onOpenLogin }) => {
  const { lang, toggleLanguage } = useLanguage();
  const { currentUser, userProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [paymentSettings, setPaymentSettings] = useState(DEFAULT_PAYMENT_SETTINGS);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Active Category: 'catA' (Destitute/Beneficiary), 'catB' (Patron/General Member), 'catC' (Volunteer Worker)
  const [category, setCategory] = useState(defaultCategory);

  // Form Data with fields tailored for all 3 categories
  const [formData, setFormData] = useState({
    // 1. Common Applicant Fields
    fullName: userProfile?.fullName || userProfile?.displayName || '',
    fatherHusbandName: '',
    villageOrLocality: '',
    postOffice: '',
    district: 'गोरखपुर (Gorakhpur)',
    state: 'उत्तर प्रदेश (UP)',
    pincode: '273016',
    mobile: userProfile?.phone || userProfile?.mobile || '',
    whatsapp: userProfile?.phone || userProfile?.mobile || '',

    // 2. Category A (Beneficiary & Assistance Seeker) Fields
    helpType: 'medical',
    monthlyIncome: '',
    familyMembersCount: '',
    assistanceDescription: '',

    // 3. Category B (Patron & General Member) Fields
    profession: 'business',
    workplace: '',
    focusArea: 'sanskar',

    // 4. Category C (Volunteer Worker) Fields
    availability: 'weekends',
    serviceAreas: ['camps', 'labor'],
    experience: '',

    // Payment fields (for Cat B & Cat C)
    paymentId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    isConsentGiven: true
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState(null);

  // Existing membership tracking to strictly prevent duplicate registrations
  const [existingStatus, setExistingStatus] = useState(null); // 'approved' | 'pending' | null
  const [existingData, setExistingData] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [forceNewApplication, setForceNewApplication] = useState(false);

  // Subscribe to settings/payment in realtime
  useEffect(() => {
    const unsub = subscribePaymentSettings((settings) => {
      setPaymentSettings(settings);
    });
    return () => unsub();
  }, []);

  // When defaultCategory prop changes, sync with state
  useEffect(() => {
    if (defaultCategory) {
      setCategory(defaultCategory);
    }
  }, [defaultCategory]);

  // Protected action: require login
  useEffect(() => {
    if (isOpen && !currentUser) {
      onClose();
      navigate('/login', {
        state: { from: location, message: 'Please sign in to continue' }
      });
    }
    if (!isOpen) {
      setForceNewApplication(false);
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || userProfile.fullName || userProfile.displayName || '',
        mobile: prev.mobile || userProfile.phone || userProfile.mobile || '',
        whatsapp: prev.whatsapp || userProfile.phone || userProfile.mobile || ''
      }));
    }
  }, [userProfile]);

  // Check if current user is already an approved member or has an application pending review
  useEffect(() => {
    let isMounted = true;

    const checkExistingMembership = async () => {
      if (!isOpen || !currentUser) {
        setExistingStatus(null);
        setExistingData(null);
        return;
      }

      // If user profile is actively an approved member
      if (userProfile?.isMember === true) {
        if (isMounted) {
          setExistingStatus('approved');
          setExistingData({
            fullName: userProfile.fullName || currentUser.displayName || 'सत्यापित सदस्य',
            memberId: userProfile.memberId,
            category: userProfile.category || 'catB',
            phone: userProfile.phone || userProfile.mobile,
            status: 'approved'
          });
        }
        return;
      }

      // If not an active member in userProfile, check for currently pending application
      setCheckingExisting(true);
      try {
        const qApps = query(
          collection(db, 'membershipApplications'),
          where('applicantUid', '==', currentUser.uid)
        );
        const snap = await getDocs(qApps);
        if (isMounted && !snap.empty) {
          const apps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          // Note: Any old approved application is disregarded if userProfile.isMember !== true (e.g. member was removed)
          const pending = apps.find(a => a.status === 'pending');
          if (pending) {
            setExistingStatus('pending');
            setExistingData(pending);
          } else {
            setExistingStatus(null);
            setExistingData(null);
          }
        } else if (isMounted) {
          setExistingStatus(null);
          setExistingData(null);
        }
      } catch (err) {
        console.warn("Could not check existing membership application:", err);
      } finally {
        if (isMounted) setCheckingExisting(false);
      }
    };

    checkExistingMembership();
    return () => { isMounted = false; };
  }, [isOpen, currentUser, userProfile]);

  // Strictly active member: only when userProfile.isMember === true
  const isAlreadyMember = Boolean(userProfile?.isMember === true);
  const isPendingMember = Boolean(!isAlreadyMember && !forceNewApplication && existingStatus === 'pending');

  if (!isOpen) return null;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleInputChange = (e) => {
    let { name, value, type, checked } = e.target;
    if (name === 'paymentId') {
      value = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    }
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleServiceAreaToggle = (areaKey) => {
    setFormData(prev => {
      const exists = prev.serviceAreas.includes(areaKey);
      const updated = exists
        ? prev.serviceAreas.filter(k => k !== areaKey)
        : [...prev.serviceAreas, areaKey];
      return { ...prev, serviceAreas: updated };
    });
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) {
      errs.fullName = lang === 'hi' ? 'कृपया पूरा नाम दर्ज करें' : 'Please enter full name';
    }
    if (!formData.fatherHusbandName.trim()) {
      errs.fatherHusbandName = lang === 'hi' ? 'पिता / पति का नाम दर्ज करें' : 'Enter Father/Husband name';
    }
    if (!formData.mobile.trim() || !/^[6-9]\d{9}$/.test(formData.mobile.replace(/\D/g, ''))) {
      errs.mobile = lang === 'hi' ? 'मान्य 10-अंकीय मोबाइल नंबर दर्ज करें' : 'Enter valid 10-digit mobile number';
    }
    if (!formData.villageOrLocality.trim()) {
      errs.villageOrLocality = lang === 'hi' ? 'ग्राम / मोहल्ला / वार्ड दर्ज करें' : 'Enter village/locality';
    }
    if (!formData.district.trim()) {
      errs.district = lang === 'hi' ? 'ज़िला दर्ज करें' : 'Enter district';
    }

    // Category-specific validation rules
    if (category === 'catA') {
      // Category A (Beneficiary): Needs assistance details, NO payment ID
      if (!formData.assistanceDescription.trim()) {
        errs.assistanceDescription = lang === 'hi'
          ? 'कृपया अपनी समस्या एवं अपेक्षित सहयोग का विवरण दर्ज करें'
          : 'Please describe the assistance you need';
      }
    } else {
      // Category B & C: Require Payment ID / UTR (8 to 30 alphanumeric characters)
      const cleanPid = (formData.paymentId || '').trim();
      if (!cleanPid) {
        errs.paymentId = lang === 'hi' 
          ? 'कृपया भुगतान संदर्भ संख्या (Payment ID / UTR) दर्ज करें।' 
          : 'Payment ID / UTR is required.';
      } else if (cleanPid.length < 8 || cleanPid.length > 30) {
        errs.paymentId = lang === 'hi'
          ? 'Payment ID / UTR 8 से 30 अक्षरों या अंकों का होना चाहिए।'
          : 'Payment ID must be 8-30 alphanumeric characters.';
      }
    }

    if (!formData.isConsentGiven) {
      errs.isConsentGiven = lang === 'hi' ? 'कृपया नियम एवं गोपनीयता सहमति स्वीकार करें' : 'Please accept trust terms';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const isCatA = category === 'catA';
      const claimedFee = isCatA ? 0 : (paymentSettings.membershipFee || 200);

      const result = await submitMembershipWithPaymentId({
        fullName: formData.fullName,
        phone: formData.mobile,
        fatherHusbandName: formData.fatherHusbandName,
        address: formData.villageOrLocality,
        district: formData.district,
        state: formData.state,
        pincode: formData.pincode,
        category: category,
        claimedAmount: claimedFee,
        paymentId: isCatA ? null : formData.paymentId,
        paymentDate: isCatA ? null : formData.paymentDate,
        uid: currentUser?.uid || null,
        // Category A fields:
        helpType: formData.helpType,
        monthlyIncome: formData.monthlyIncome,
        familyMembersCount: formData.familyMembersCount,
        assistanceDescription: formData.assistanceDescription,
        // Category B fields:
        profession: formData.profession,
        workplace: formData.workplace,
        focusArea: formData.focusArea,
        // Category C fields:
        availability: formData.availability,
        serviceAreas: formData.serviceAreas,
        experience: formData.experience
      });

      setSubmittedRef(result.paymentId || 'FREE-EXEMPTED');
      toast.success(
        isCatA
          ? (lang === 'hi' ? 'सहायता प्रार्थना एवं सदस्यता आवेदन दर्ज हो गया है।' : 'Beneficiary application submitted successfully.')
          : (lang === 'hi' ? 'Submitted. Your payment will be verified by the admin.' : 'Submitted. Your payment will be verified by the admin.')
      );

      try {
        confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
      } catch {}
    } catch (err) {
      console.error("Submission failed:", err);
      let errorMsg = err.message;
      if (err.message && err.message.includes("already used")) {
        errorMsg = "This Payment ID was already used";
        setErrors(prev => ({ ...prev, paymentId: errorMsg }));
      } else {
        setErrors(prev => ({ ...prev, form: errorMsg }));
      }
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmittedRef(null);
    setForceNewApplication(false);
    onClose();
  };

  const membershipFee = paymentSettings.membershipFee || 200;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="relative bg-white w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-[#E9B44C]/40 my-auto sm:my-8 max-h-[94vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-primary text-white px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-secondary text-white font-bold flex items-center justify-center text-xs sm:text-sm shadow-sm flex-shrink-0">
              {isAlreadyMember ? (
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-200" />
              ) : (
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-black font-hindi-heading truncate">
                {isAlreadyMember
                  ? (lang === 'hi' ? 'ट्रस्ट सदस्यता स्थिति • सक्रिय सदस्य' : 'Membership Status • Verified Member')
                  : isPendingMember
                  ? (lang === 'hi' ? 'ट्रस्ट सदस्यता • सत्यापन प्रक्रियाधीन' : 'Trust Membership • Under Verification')
                  : (lang === 'hi' ? 'वार्षिक सदस्यता आवेदन एवं पंजीकरण' : 'Trust Membership Application')}
              </h2>
              <p className="text-[10px] sm:text-xs text-white/80 truncate">
                {isAlreadyMember
                  ? (lang === 'hi' ? 'आप पहले से ही राष्ट्रीय सनातन संस्कार सेवा संस्थान के पंजीकृत सदस्य हैं' : 'You are already an active verified member')
                  : isPendingMember
                  ? (lang === 'hi' ? 'व्यवस्थापक द्वारा आपके आवेदन का सत्यापन किया जा रहा है' : 'Your application is awaiting admin verification')
                  : category === 'catA'
                  ? (lang === 'hi' ? 'श्रेणी (क) - अभावग्रस्त / सहायता प्रार्थी बंधु (शुल्क: ₹0 छूट)' : 'Category A - Destitute & Beneficiary Member (Fee: ₹0 Free)')
                  : (lang === 'hi' ? `राष्ट्रीय सनातन संस्कार सेवा संस्थान • वार्षिक शुल्क ₹${membershipFee}/-` : `Sanatan Sanskar Seva Sansthan • Annual Fee ₹${membershipFee}/-`)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1 transition-all"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5 text-[#E9B44C]" />
              <span>{lang === 'hi' ? 'English' : 'हिंदी'}</span>
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {isAlreadyMember ? (
            /* Already a Member State: Prevent re-applying */
            <div className="text-center py-6 sm:py-8 space-y-5 max-w-lg mx-auto">
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                  <ShieldCheck className="w-12 h-12" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-1.5 shadow-sm">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              </div>

              <div>
                <span className="inline-block px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                  {lang === 'hi' ? '✓ सक्रिय सत्यापित सदस्य' : '✓ Active Verified Member'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#382719] mt-3 font-hindi-heading">
                  {lang === 'hi'
                    ? 'आप पहले से ही ट्रस्ट के पंजीकृत सदस्य हैं!'
                    : 'You Are Already a Registered Member!'}
                </h3>
                <p className="text-xs sm:text-sm text-[#555555] max-w-md mx-auto mt-2 leading-relaxed">
                  {lang === 'hi'
                    ? 'ट्रस्ट नियमावली के अनुसार, आपकी सदस्यता पहले से सक्रिय है। एक सदस्य पुनः उसी सदस्यता हेतु आवेदन या शुल्क भुगतान नहीं कर सकता।'
                    : 'According to trust rules, your membership is already active. A member cannot re-register or pay again for the same membership.'}
                </p>
              </div>

              {/* Active Member Card Details */}
              <div className="bg-[#FFF8EF] rounded-2xl p-4 sm:p-5 border-2 border-[#E9B44C]/50 text-left shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-[#E9B44C]/30">
                  <span className="text-xs text-[#777777] font-bold">
                    {lang === 'hi' ? 'सदस्य का नाम' : 'Member Name'}
                  </span>
                  <span className="text-sm font-black text-[#382719]">
                    {existingData?.fullName || userProfile?.fullName || currentUser?.displayName || 'पंजीकृत सदस्य'}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-[#E9B44C]/30">
                  <span className="text-xs text-[#777777] font-bold">
                    {lang === 'hi' ? 'सदस्यता क्रमांक' : 'Member ID'}
                  </span>
                  <span className="text-sm font-mono font-black text-primary bg-white px-2.5 py-0.5 rounded-md border border-[#E9B44C]">
                    {existingData?.memberId || userProfile?.memberId || 'TRUST-M-VERIFIED'}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-[#E9B44C]/30">
                  <span className="text-xs text-[#777777] font-bold">
                    {lang === 'hi' ? 'सदस्यता श्रेणी' : 'Category'}
                  </span>
                  <MemberBadge
                    category={existingData?.category || userProfile?.category || 'catB'}
                    variant="inline"
                    showId={false}
                    lang={lang}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#777777] font-bold">
                    {lang === 'hi' ? 'सदस्यता स्थिति' : 'Status'}
                  </span>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    ● {lang === 'hi' ? 'सक्रिय एवं मान्य (Active)' : 'Active & Valid'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/dashboard');
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-secondary text-white font-black text-sm shadow-saffron transition-all transform hover:-translate-y-0.5 active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{lang === 'hi' ? 'मेरा सदस्य डैशबोर्ड खोलें' : 'Open My Dashboard'}</span>
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-[#FFF8EF] text-[#382719] font-bold text-sm border border-[#E9B44C] transition-all"
                >
                  {lang === 'hi' ? 'बंद करें' : 'Close'}
                </button>
              </div>
            </div>
          ) : isPendingMember ? (
            /* Pending Application View */
            <div className="text-center py-6 sm:py-8 space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-400 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
                <Clock className="w-10 h-10 animate-pulse" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                  {lang === 'hi' ? '⏳ आवेदन प्रक्रियाधीन (Pending)' : '⏳ Application Under Review'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#382719] mt-3 font-hindi-heading">
                  {lang === 'hi'
                    ? 'आपका सदस्यता आवेदन पहले से ही सत्यापन हेतु जमा है'
                    : 'Your Application Is Already Under Review'}
                </h3>
                <p className="text-xs sm:text-sm text-[#555555] max-w-md mx-auto mt-2 leading-relaxed">
                  {lang === 'hi'
                    ? 'आपने पहले ही सदस्यता आवेदन एवं Payment ID जमा कर दिया है। ट्रस्ट व्यवस्थापक द्वारा आपके भुगतान का सत्यापन किया जा रहा है। स्वीकृति मिलते ही आपकी सदस्यता स्वतः सक्रिय हो जाएगी।'
                    : 'You have already submitted an application. The administrator is verifying your Payment ID. Once approved, your membership will become active automatically.'}
                </p>
              </div>

              {existingData?.paymentId && (
                <div className="p-3 bg-[#FFF8EF] rounded-xl border border-[#E9B44C]/40 text-xs">
                  <span className="text-[#777777] block">{lang === 'hi' ? 'जमा Payment ID / UTR:' : 'Submitted Payment ID:'}</span>
                  <span className="font-mono font-bold text-primary text-sm">{existingData.paymentId}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/dashboard');
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-secondary text-white font-black text-sm shadow-saffron transition-all"
                >
                  <span>{lang === 'hi' ? 'डैशबोर्ड में स्थिति जांचें' : 'Check Status in Dashboard'}</span>
                  <span>→</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForceNewApplication(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FFF8EF] hover:bg-[#FFEECB] text-[#382719] font-bold text-sm border border-[#E9B44C] transition-all"
                >
                  <UserPlus className="w-4 h-4 text-primary" />
                  <span>{lang === 'hi' ? 'नया सदस्यता आवेदन भरें' : 'Submit New Application'}</span>
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-[#FFF8EF] text-[#382719] font-bold text-sm border border-gray-300 transition-all"
                >
                  {lang === 'hi' ? 'बंद करें' : 'Close'}
                </button>
              </div>
            </div>
          ) : submittedRef ? (
            /* Success View */
            <div className="text-center py-6 sm:py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  {lang === 'hi' ? 'आवेदन सफलतापूर्वक प्रेषित' : 'Submitted Successfully'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#382719] mt-2 font-hindi-heading">
                  {category === 'catA'
                    ? (lang === 'hi' ? 'सहायता प्रार्थना एवं सदस्यता आवेदन दर्ज हो गया है।' : 'Beneficiary & Help Request recorded successfully.')
                    : 'Submitted. Your payment will be verified by the admin.'}
                </h3>
                <p className="text-xs sm:text-sm text-[#454545] max-w-md mx-auto mt-2 leading-relaxed">
                  {category === 'catA'
                    ? (lang === 'hi'
                        ? 'आपका आवेदन समीक्षा हेतु पंजीकृत हो गया है। ट्रस्ट समिति द्वारा सत्यापन के बाद आधिकारिक सहायता व लाभार्थी सदस्य कार्ड जारी किया जाएगा।'
                        : 'Your beneficiary application has been queued for trust committee review. Approved applicants receive verified support and identity card.')
                    : (lang === 'hi'
                        ? 'आपका सदस्यता आवेदन एवं Payment ID दर्ज हो चुका है। ट्रस्ट व्यवस्थापक द्वारा बैंक मिलान कर सत्यापन के बाद आपका "Verified Member" पहचान पत्र जारी किया जाएगा।'
                        : 'Your membership application and Payment ID have been recorded. Once verified by the trust admin, your Verified Member badge and ID card will be activated.')}
                </p>
              </div>

              {category !== 'catA' && (
                <div className="p-4 bg-[#FFF8EF] rounded-2xl border border-[#E9B44C]/40 max-w-sm mx-auto text-xs space-y-1">
                  <span className="text-[#777777] block">{lang === 'hi' ? 'दर्ज Payment ID / UTR:' : 'Submitted Payment ID:'}</span>
                  <span className="font-mono font-black text-primary text-sm sm:text-base tracking-wider break-all">
                    {submittedRef}
                  </span>
                  <span className="text-[11px] text-amber-700 font-bold block mt-1">
                    {lang === 'hi' ? 'स्थिति: समीक्षाधीन (Under Review)' : 'Status: Under Review'}
                  </span>
                </div>
              )}

              <div className="pt-3 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#382719] font-bold text-xs sm:text-sm transition-all"
                >
                  {lang === 'hi' ? 'डैशबोर्ड देखें' : 'View Dashboard'}
                </button>
              </div>
            </div>
          ) : (
            /* Registration Form with Dynamic Sections for All 3 Categories */
            <form onSubmit={handleSubmit} className="space-y-6 text-left">
              
              {/* Category Selector (Bilingual) */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#382719] mb-2">
                  {lang === 'hi' ? 'सदस्यता श्रेणी चुनें (Select Category):' : 'Select Membership Category:'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  
                  {/* Category A Card */}
                  <div
                    onClick={() => setCategory('catA')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      category === 'catA'
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-400'
                        : 'border-[#E9B44C]/30 bg-white hover:border-[#E9B44C]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-[#382719] block font-hindi-heading">
                        {lang === 'hi' ? 'श्रेणी - क (निराश्रित / सहायता)' : 'Category - A (Beneficiary)'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                        {lang === 'hi' ? 'निःशुल्क' : 'Free'}
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-black block">
                      {lang === 'hi' ? 'शुल्क: ₹0 (पूर्ण छूट)' : 'Fee: ₹0 (Exempted)'}
                    </span>
                    <p className="text-[10px] text-[#666666] mt-1 leading-tight">
                      {lang === 'hi'
                        ? 'अभावग्रस्त बंधु जो चिकित्सा, शिक्षा, राशन या विवाह में सहयोग चाहते हैं।'
                        : 'Needy families & laborers seeking healthcare, education or food aid.'}
                    </p>
                  </div>

                  {/* Category B Card */}
                  <div
                    onClick={() => setCategory('catB')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      category === 'catB'
                        ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary/40'
                        : 'border-[#E9B44C]/30 bg-white hover:border-[#E9B44C]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-[#382719] block font-hindi-heading">
                        {lang === 'hi' ? 'श्रेणी - ख (साधारण सदस्य / संरक्षक)' : 'Category - B (Patron Member)'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-primary/10 text-primary">
                        {lang === 'hi' ? 'सदस्य' : 'Patron'}
                      </span>
                    </div>
                    <span className="text-[11px] text-primary font-black block">
                      {lang === 'hi' ? `वार्षिक शुल्क: ₹${membershipFee}/-` : `Annual Fee: ₹${membershipFee}/-`}
                    </span>
                    <p className="text-[10px] text-[#666666] mt-1 leading-tight">
                      {lang === 'hi'
                        ? 'सम्पन्न नागरिक, व्यवसायी जो वार्षिक अंशदान देकर ट्रस्ट से जुड़ना चाहते हैं।'
                        : 'Citizens & patrons supporting trust operations via annual membership.'}
                    </p>
                  </div>

                  {/* Category C Card */}
                  <div
                    onClick={() => setCategory('catC')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      category === 'catC'
                        ? 'border-secondary bg-secondary/5 shadow-xs ring-1 ring-secondary/40'
                        : 'border-[#E9B44C]/30 bg-white hover:border-[#E9B44C]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-[#382719] block font-hindi-heading">
                        {lang === 'hi' ? 'श्रेणी - ग (कार्यकर्ता / स्वयंसेवक)' : 'Category - C (Volunteer Worker)'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-secondary/10 text-secondary">
                        {lang === 'hi' ? 'कार्यकर्ता' : 'Worker'}
                      </span>
                    </div>
                    <span className="text-[11px] text-secondary font-black block">
                      {lang === 'hi' ? `वार्षिक शुल्क: ₹${membershipFee}/-` : `Annual Fee: ₹${membershipFee}/-`}
                    </span>
                    <p className="text-[10px] text-[#666666] mt-1 leading-tight">
                      {lang === 'hi'
                        ? 'धरातल पर समय व शारीरिक श्रम देकर सनातन सेवा शिविरों में सक्रिय रहने वाले।'
                        : 'Ground volunteers offering physical time & seva for public campaigns.'}
                    </p>
                  </div>

                </div>
              </div>

              {/* SECTION 1: Applicant Details (Common to all 3 categories) */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-secondary border-b border-[#E9B44C]/30 pb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>{lang === 'hi' ? '१. आवेदक का व्यक्तिगत विवरण' : '1. Applicant Information'}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'पूरा नाम (Full Name) *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder={lang === 'hi' ? 'उदा. राजेश कुमार मिश्र' : 'e.g. Rajesh Kumar Mishra'}
                      className={`w-full px-3 py-2.5 rounded-xl border ${
                        errors.fullName ? 'border-red-500 bg-red-50/20' : 'border-[#E9B44C]/50'
                      } text-xs focus:outline-none focus:ring-2 focus:ring-primary/40`}
                    />
                    {errors.fullName && <p className="text-[10px] text-red-500 mt-0.5">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'पिता / पति का नाम *' : 'Father / Husband Name *'}
                    </label>
                    <input
                      type="text"
                      name="fatherHusbandName"
                      value={formData.fatherHusbandName}
                      onChange={handleInputChange}
                      placeholder={lang === 'hi' ? 'उदा. श्री बैजनाथ मिश्र' : 'e.g. Shri Baijnath Mishra'}
                      className={`w-full px-3 py-2.5 rounded-xl border ${
                        errors.fatherHusbandName ? 'border-red-500 bg-red-50/20' : 'border-[#E9B44C]/50'
                      } text-xs focus:outline-none focus:ring-2 focus:ring-primary/40`}
                    />
                    {errors.fatherHusbandName && <p className="text-[10px] text-red-500 mt-0.5">{errors.fatherHusbandName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'मोबाइल नंबर (Mobile) *' : 'Mobile Number *'}
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="10-digit mobile number"
                      className={`w-full px-3 py-2.5 rounded-xl border ${
                        errors.mobile ? 'border-red-500 bg-red-50/20' : 'border-[#E9B44C]/50'
                      } text-xs focus:outline-none focus:ring-2 focus:ring-primary/40`}
                    />
                    {errors.mobile && <p className="text-[10px] text-red-500 mt-0.5">{errors.mobile}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'व्हाट्सएप नंबर (WhatsApp)' : 'WhatsApp Number'}
                    </label>
                    <input
                      type="tel"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                      placeholder={lang === 'hi' ? 'यदि मोबाइल नंबर से भिन्न हो' : 'If different from mobile'}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E9B44C]/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'स्थानीय पता / ग्राम / वार्ड *' : 'Address / Locality / Ward *'}
                    </label>
                    <input
                      type="text"
                      name="villageOrLocality"
                      value={formData.villageOrLocality}
                      onChange={handleInputChange}
                      placeholder={lang === 'hi' ? 'मकान नं., मोहल्ला, क्षेत्र' : 'House no, area, locality'}
                      className={`w-full px-3 py-2.5 rounded-xl border ${
                        errors.villageOrLocality ? 'border-red-500 bg-red-50/20' : 'border-[#E9B44C]/50'
                      } text-xs focus:outline-none focus:ring-2 focus:ring-primary/40`}
                    />
                    {errors.villageOrLocality && <p className="text-[10px] text-red-500 mt-0.5">{errors.villageOrLocality}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'ज़िला / स्थान *' : 'District *'}
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E9B44C]/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2 (CATEGORY-SPECIFIC FORM CONTENT) */}

              {/* === CATEGORY A SPECIFIC FORM: Beneficiary / Assistance Seeker === */}
              {category === 'catA' && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 border-b border-emerald-200 pb-1.5 flex items-center gap-1.5">
                    <HandHeart className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'hi' ? '२. अपेक्षित सहायता व पारिवारिक पृष्ठभूमि (शुल्क ₹0 छूट)' : '2. Assistance Requirements & Family Profile (Free)'}</span>
                  </h3>

                  {/* Free Exemption Notice Banner */}
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-900 space-y-0.5">
                      <span className="font-bold block">
                        {lang === 'hi' ? 'निःशुल्क सदस्यता आवेदन (₹0)' : '100% Free Membership Application (₹0)'}
                      </span>
                      <p className="text-[11px] leading-relaxed text-emerald-800">
                        {lang === 'hi'
                          ? 'सनातन संस्कार ट्रस्ट की नियमावली के अनुसार श्रेणी (क) के अभावग्रस्त बंधुओं से कोई शुल्क नहीं लिया जाता है। आवेदन की समीक्षा के बाद ट्रस्ट द्वारा आर्थिक व सामाजिक सहायता दी जाएगी।'
                          : 'As per Trust rules, Category A is completely exempt from fees. No payment ID or UPI transaction is required. Our coordinators will contact you upon review.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#382719] mb-1">
                        {lang === 'hi' ? 'अपेक्षित सहायता का मुख्य प्रकार *' : 'Primary Assistance Needed *'}
                      </label>
                      <select
                        name="helpType"
                        value={formData.helpType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E9B44C]/50 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                      >
                        <option value="medical">{lang === 'hi' ? 'चिकित्सा एवं औषधि सहायता (Medical Treatment)' : 'Medical & Healthcare Aid'}</option>
                        <option value="education">{lang === 'hi' ? 'बाल शिक्षा व छात्रवृत्ति सहयोग (Education & Books)' : 'Child Education & Fee Support'}</option>
                        <option value="marriage">{lang === 'hi' ? 'निर्धन कन्या विवाह सहयोग (Daughter Marriage Aid)' : "Daughter's Marriage Support"}</option>
                        <option value="ration">{lang === 'hi' ? 'राशन एवं दैनिक भरण-पोषण (Food & Ration)' : 'Food, Ration & Survival Support'}</option>
                        <option value="destitute">{lang === 'hi' ? 'वृद्ध / असहाय विधिक व सामाजिक सहायता' : 'Senior Citizen / Destitute Relief'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#382719] mb-1">
                        {lang === 'hi' ? 'मासिक पारिवारिक आय (अनुमानित)' : 'Monthly Household Income (Approx)'}
                      </label>
                      <input
                        type="text"
                        name="monthlyIncome"
                        value={formData.monthlyIncome}
                        onChange={handleInputChange}
                        placeholder={lang === 'hi' ? 'उदा. ₹5,000 से कम / अनिश्चित' : 'e.g. Under ₹5,000 / Unstable'}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E9B44C]/50 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'समस्या एवं अपेक्षित सहयोग का विवरण *' : 'Description of Need & Hardship *'}
                    </label>
                    <textarea
                      name="assistanceDescription"
                      rows="3"
                      value={formData.assistanceDescription}
                      onChange={handleInputChange}
                      placeholder={lang === 'hi'
                        ? 'कृपया संक्षेप में बताएं कि आपको किस प्रकार की सहायता या सहयोग की आवश्यकता है...'
                        : 'Please describe your hardship and the specific assistance you are requesting from the trust...'}
                      className={`w-full px-3 py-2 rounded-xl border ${
                        errors.assistanceDescription ? 'border-red-500 bg-red-50/20' : 'border-[#E9B44C]/50'
                      } text-xs focus:outline-none focus:ring-2 focus:ring-primary/40`}
                    />
                    {errors.assistanceDescription && (
                      <p className="text-[10px] text-red-500 mt-0.5">{errors.assistanceDescription}</p>
                    )}
                  </div>
                </div>
              )}

              {/* === CATEGORY B SPECIFIC FORM: General Member / Patron === */}
              {category === 'catB' && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-secondary border-b border-[#E9B44C]/30 pb-1.5 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-primary" />
                    <span>{lang === 'hi' ? '२. व्यावसायिक व संरक्षक विवरण' : '2. Professional & Patron Profile'}</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#382719] mb-1">
                        {lang === 'hi' ? 'पेशा / व्यवसाय (Profession)' : 'Profession / Occupation'}
                      </label>
                      <select
                        name="profession"
                        value={formData.profession}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E9B44C]/50 text-xs bg-white focus:outline-none"
                      >
                        <option value="business">{lang === 'hi' ? 'व्यवसाय / उद्यमी (Business / Trader)' : 'Business / Trader'}</option>
                        <option value="service">{lang === 'hi' ? 'निजी क्षेत्र सेवा (Private Sector)' : 'Private Sector Employee'}</option>
                        <option value="govt">{lang === 'hi' ? 'शासकीय सेवा (Govt Officer / Employee)' : 'Government Service'}</option>
                        <option value="professional">{lang === 'hi' ? 'अधिवक्ता / चिकित्सक / सीए (Professional)' : 'Lawyer / Doctor / CA'}</option>
                        <option value="farmer">{lang === 'hi' ? 'कृषि / कृषक (Agriculture)' : 'Agriculture / Farmer'}</option>
                        <option value="retired">{lang === 'hi' ? 'सेवानिवृत्त (Retired)' : 'Retired'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#382719] mb-1">
                        {lang === 'hi' ? 'प्रतिष्ठान / विभाग का नाम' : 'Organization / Enterprise Name'}
                      </label>
                      <input
                        type="text"
                        name="workplace"
                        value={formData.workplace}
                        onChange={handleInputChange}
                        placeholder={lang === 'hi' ? 'उदा. मिश्र ट्रेडर्स, गोरखपुर' : 'e.g. Mishra Traders, Gorakhpur'}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E9B44C]/50 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'ट्रस्ट में आपकी विशेष रुचि / सहयोग क्षेत्र' : 'Preferred Focus Seva Area'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      {[
                        { id: 'sanskar', labelHi: 'संस्कार जागरण व वेद प्रचार', labelEn: 'Vedic Awareness' },
                        { id: 'welfare', labelHi: 'श्रमिक कल्याण व कानूनी सहायता', labelEn: 'Labor Welfare' },
                        { id: 'education', labelHi: 'बाल शिक्षा व संस्कारशाला', labelEn: 'Youth Education' }
                      ].map((item) => (
                        <label
                          key={item.id}
                          className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                            formData.focusArea === item.id ? 'border-primary bg-primary/10 font-bold text-primary' : 'border-[#E9B44C]/40 bg-white text-[#555555]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="focusArea"
                            value={item.id}
                            checked={formData.focusArea === item.id}
                            onChange={handleInputChange}
                            className="hidden"
                          />
                          <span>{lang === 'hi' ? item.labelHi : item.labelEn}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* === CATEGORY C SPECIFIC FORM: Volunteer Worker === */}
              {category === 'catC' && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-secondary border-b border-[#E9B44C]/30 pb-1.5 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-primary" />
                    <span>{lang === 'hi' ? '२. स्वयंसेवक समय समर्पण व सेवा क्षेत्र' : '2. Volunteer Availability & Ground Seva Areas'}</span>
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1.5">
                      {lang === 'hi' ? 'समय समर्पण (Time Commitment) *' : 'Available Time Commitment *'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      {[
                        { id: 'full_time', labelHi: 'पूर्णकालिक समर्पित कार्यकर्ता', labelEn: 'Full Time' },
                        { id: 'few_hours_daily', labelHi: 'प्रतिदिन २-३ घंटे', labelEn: 'Daily 2-3 Hours' },
                        { id: 'weekends', labelHi: 'सप्ताहांत एवं अवकाश', labelEn: 'Weekends / Holidays' }
                      ].map((opt) => (
                        <label
                          key={opt.id}
                          className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                            formData.availability === opt.id ? 'border-secondary bg-secondary/10 font-bold text-secondary' : 'border-[#E9B44C]/40 bg-white text-[#555555]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="availability"
                            value={opt.id}
                            checked={formData.availability === opt.id}
                            onChange={handleInputChange}
                            className="hidden"
                          />
                          <span>{lang === 'hi' ? opt.labelHi : opt.labelEn}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1.5">
                      {lang === 'hi' ? 'सेवा क्षेत्र एवं रुचि (Select Areas of Seva):' : 'Areas of Active Seva:'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {[
                        { key: 'camps', labelHi: 'संस्कार जागरण व युवा शिविर', labelEn: 'Vedic Camps & Youth Awakening' },
                        { key: 'health', labelHi: 'चिकित्सा व रक्तदान शिविर', labelEn: 'Health & Blood Donation' },
                        { key: 'labor', labelHi: 'श्रमिक कल्याण व जन-संपर्क', labelEn: 'Labor Outreach & Welfare' },
                        { key: 'events', labelHi: 'कार्यक्रम प्रबंधन व मंच व्यवस्था', labelEn: 'Event Coordination & Pandal' },
                        { key: 'media', labelHi: 'सोशल मीडिया, आईटी व प्रचार', labelEn: 'Digital Media & IT Seva' }
                      ].map((area) => (
                        <div
                          key={area.key}
                          onClick={() => handleServiceAreaToggle(area.key)}
                          className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${
                            formData.serviceAreas.includes(area.key)
                              ? 'border-secondary bg-secondary/5 font-bold text-secondary'
                              : 'border-[#E9B44C]/35 bg-white text-[#555555]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.serviceAreas.includes(area.key)}
                            readOnly
                            className="w-3.5 h-3.5 rounded text-secondary"
                          />
                          <span className="text-[11px]">{lang === 'hi' ? area.labelHi : area.labelEn}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#382719] mb-1">
                      {lang === 'hi' ? 'पूर्व सेवा या सामाजिक अनुभव (वैकल्पिक)' : 'Prior Experience (Optional)'}
                    </label>
                    <input
                      type="text"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      placeholder={lang === 'hi' ? 'उदा. सामाजिक संस्थाओं, संघ या शिविरों में पूर्व योगदान' : 'e.g. Previous work in social/cultural drives'}
                      className="w-full px-3 py-2 rounded-xl border border-[#E9B44C]/50 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* SECTION 3: PAYMENT STEP (ONLY FOR CATEGORY B & C - EXEMPT FOR CATEGORY A) */}
              {category !== 'catA' && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-secondary border-b border-[#E9B44C]/30 pb-1.5 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span>
                      {category === 'catC'
                        ? (lang === 'hi' ? '३. कार्यकर्ता सदस्यता शुल्क भुगतान (UPI / QR Payment)' : '3. Volunteer Fee Payment & Transaction Reference')
                        : (lang === 'hi' ? '३. सदस्यता शुल्क भुगतान (UPI / QR Payment)' : '3. Fee Payment & Transaction Reference')}
                    </span>
                  </h3>

                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FFF8EF] via-white to-[#FFF8EF] border border-[#E9B44C]/50 space-y-4">
                    
                    {/* QR Box with Trust Name & UPI ID */}
                    <div className="flex flex-col sm:flex-row items-center gap-5 border-b border-[#E9B44C]/30 pb-4">
                      <div className="w-36 h-36 p-2 rounded-2xl bg-white border-2 border-dashed border-[#E9B44C] shadow-sm flex items-center justify-center flex-shrink-0">
                        <img
                          src={paymentSettings.qrImageUrl || '/payment-qr.png'}
                          alt="Trust Payment QR Code"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/payment-qr.png';
                          }}
                        />
                      </div>

                      <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Scan & Pay ₹{membershipFee}/-</span>
                        </div>

                        <div>
                          <h4 className="font-black text-[#382719] text-sm truncate font-hindi-heading">
                            {paymentSettings.payeeName || 'Rashtriya Sanatan Sanskar Seva Sansthan (Trust)'}
                          </h4>
                          <p className="text-[11px] text-[#666666]">
                            Official State Bank of India UPI QR Code
                          </p>
                        </div>

                        {/* UPI ID with copy button */}
                        <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#E9B44C]/40 shadow-xs max-w-full">
                          <span className="font-mono text-xs font-bold text-primary truncate">
                            {paymentSettings.upiId || 'rsssst@sbi'}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(paymentSettings.upiId || 'rsssst@sbi')}
                            className="p-1 rounded hover:bg-[#FFF8EF] text-secondary hover:text-primary transition-colors flex-shrink-0"
                            title="Copy UPI ID"
                          >
                            {copiedUpi ? <Check className="w-3.5 h-3.5 text-trust-green" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <p className="text-[11px] text-[#555555] font-semibold italic">
                          "Scan and pay, then enter your Payment ID below"
                        </p>
                      </div>
                    </div>

                    {/* Payment ID Input */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-black text-[#382719] mb-1">
                          Payment ID / UTR / Transaction Reference *
                        </label>
                        <input
                          type="text"
                          name="paymentId"
                          value={formData.paymentId}
                          onChange={handleInputChange}
                          placeholder={lang === 'hi' ? 'उदा. 429381749201' : 'e.g. 429381749201'}
                          className={`w-full px-3.5 py-2.5 rounded-xl border font-mono uppercase text-sm ${
                            errors.paymentId ? 'border-red-500 bg-red-50/30' : 'border-[#E9B44C]/60 bg-white'
                          } focus:outline-none focus:ring-2 focus:ring-primary/40`}
                        />
                        
                        {/* Helper text explaining where to find it */}
                        <div className="flex items-start gap-1.5 mt-1 text-[11px] text-[#666666] leading-relaxed">
                          <Info className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                          <span>
                            {lang === 'hi'
                              ? 'कहाँ मिलेगा: अपने UPI ऐप (GPay / PhonePe / Paytm / BHIM) के भुगतान विवरण में 12-अंकीय UTR या UPI Reference No देखें।'
                              : 'Where to find: Look for the 12-digit UTR or UPI Reference Number in your UPI app payment details screen.'}
                          </span>
                        </div>

                        {errors.paymentId && (
                          <p className="text-xs text-red-600 font-bold mt-1">{errors.paymentId}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#382719] mb-1">
                            {lang === 'hi' ? 'भुगतान दिनांक (Payment Date) - Optional' : 'Payment Date - Optional'}
                          </label>
                          <input
                            type="date"
                            name="paymentDate"
                            value={formData.paymentDate}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 rounded-xl border border-[#E9B44C]/50 text-xs focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center">
                          <div className="text-xs text-[#555555]">
                            <span className="font-bold text-[#382719]">{lang === 'hi' ? 'वार्षिक शुल्क: ' : 'Annual Fee: '}</span>
                            <span className="font-mono text-primary font-bold">₹{membershipFee}/-</span>
                            <span className="text-[11px] block text-[#777777]">
                              {lang === 'hi' ? 'प्रशासक द्वारा सत्यापन उपरांत रसीद उपलब्ध होगी।' : 'Receipt available after admin approval.'}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>
                </div>
              )}

              {/* Consent Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 text-xs text-[#454545] cursor-pointer">
                  <input
                    type="checkbox"
                    name="isConsentGiven"
                    checked={formData.isConsentGiven}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded text-primary border-[#E9B44C] mt-0.5"
                  />
                  <span>
                    {lang === 'hi'
                      ? 'मैं राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट) की नियमावली से सहमत हूँ एवं सत्यनिष्ठा से सनातन सेवा में समर्पित रहने का संकल्प लेता/लेती हूँ।'
                      : 'I agree to the guidelines of Rashtriya Sanatan Sanskar Seva Sansthan (Trust) and affirm to uphold trust values.'}
                  </span>
                </label>
                {errors.isConsentGiven && <p className="text-[10px] text-red-500 mt-0.5">{errors.isConsentGiven}</p>}
                {errors.form && <p className="text-xs text-red-600 font-bold mt-2">{errors.form}</p>}
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E9B44C]/30">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 rounded-xl border border-[#E9B44C]/50 text-[#382719] font-bold text-xs hover:bg-[#FFF8EF] transition-all"
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white font-bold text-xs sm:text-sm shadow-saffron transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <span>
                    {isSubmitting
                      ? (lang === 'hi' ? 'जमा हो रहा है...' : 'Submitting...')
                      : category === 'catA'
                      ? (lang === 'hi' ? 'निःशुल्क सदस्यता व सहायता आवेदन भेजें' : 'Submit Free Beneficiary Application')
                      : (lang === 'hi' ? 'आवेदन एवं Payment ID जमा करें' : 'Submit Membership & Payment ID')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default JoinTrustModal;
