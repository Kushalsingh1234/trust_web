import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from './config';

/**
 * Rashtriya Sanatan Sanskar Seva Sansthan (Trust)
 * Central Firestore Database Operations & Business Logic
 */

// Generate standard unique membership number
export const generateMembershipNumber = async () => {
  const currentYear = new Date().getFullYear();
  const counterRef = doc(db, 'systemConfig', 'counters');
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let nextSeq = 1;
      if (counterDoc.exists() && counterDoc.data().membershipSeq) {
        nextSeq = counterDoc.data().membershipSeq + 1;
      }
      transaction.set(counterRef, { membershipSeq: nextSeq }, { merge: true });
      return `RSSSST-MEM-${currentYear}-${String(nextSeq).padStart(4, '0')}`;
    });
    return result;
  } catch (err) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `RSSSST-MEM-${currentYear}-${rand}`;
  }
};

// Generate standard unique official receipt number
export const generateReceiptNumber = async () => {
  const currentYear = new Date().getFullYear();
  const counterRef = doc(db, 'systemConfig', 'counters');
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let nextSeq = 100;
      if (counterDoc.exists() && counterDoc.data().receiptSeq) {
        nextSeq = counterDoc.data().receiptSeq + 1;
      }
      transaction.set(counterRef, { receiptSeq: nextSeq }, { merge: true });
      return `RSSSST-REC-${currentYear}-${String(nextSeq).padStart(4, '0')}`;
    });
    return result;
  } catch (err) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `RSSSST-REC-${currentYear}-${rand}`;
  }
};

// -------------------------------------------------------------
// 1. MEMBERSHIP APPLICATIONS
// -------------------------------------------------------------

export const submitMembershipApplication = async (data, applicantUid) => {
  const colRef = collection(db, 'membershipApplications');
  const now = new Date();
  const uniqueRefId = `RSSSST-APP-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const applicationDoc = {
    applicationRef: uniqueRefId,
    applicantUid: applicantUid || null,
    fullName: data.fullName.trim(),
    fatherHusbandName: data.fatherHusbandName ? data.fatherHusbandName.trim() : '',
    villageOrLocality: data.villageOrLocality.trim(),
    postOffice: data.postOffice ? data.postOffice.trim() : '',
    district: data.district.trim(),
    state: data.state.trim(),
    pincode: data.pincode ? data.pincode.trim() : '',
    mobile: data.mobile.trim(),
    whatsapp: data.whatsapp ? data.whatsapp.trim() : data.mobile.trim(),
    category: data.category, // 'catA' (Assistance Seeker), 'catB' (Donor), 'catC' (Volunteer)
    categoryDetails: data.categoryDetails || {},
    annualFee: data.category === 'catA' ? 0 : 200,
    voluntaryAmount: Number(data.voluntaryAmount) || 0,
    status: 'pending', // always pending initially
    submittedAt: serverTimestamp(),
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null
  };

  const docRef = await addDoc(colRef, applicationDoc);

  // Save reference in browser localStorage so member dashboard can load it even if submitted before account creation
  try {
    const saved = JSON.parse(localStorage.getItem('rsssst_my_app_ids') || '[]');
    saved.unshift(docRef.id);
    localStorage.setItem('rsssst_my_app_ids', JSON.stringify(saved.slice(0, 20)));
    localStorage.setItem('rsssst_last_app_mobile', data.mobile.trim());
  } catch {}

  return { id: docRef.id, applicationRef: uniqueRefId, ...applicationDoc };
};

export const getApplicationsForUser = async (userUid, userMobile) => {
  const colRef = collection(db, 'membershipApplications');
  const resultsMap = new Map();

  // 1. Search by applicant UID if logged in
  if (userUid) {
    try {
      const q = query(colRef, where('applicantUid', '==', userUid));
      const snap = await getDocs(q);
      snap.docs.forEach(d => resultsMap.set(d.id, { id: d.id, ...d.data() }));
    } catch (e) {
      console.warn("UID query failed:", e);
    }
  }

  // 2. Search by mobile number (bridges applications submitted before creating an account!)
  const searchMobile = userMobile || (typeof window !== 'undefined' ? localStorage.getItem('rsssst_last_app_mobile') : null);
  if (searchMobile) {
    try {
      const qMob = query(colRef, where('mobile', '==', searchMobile.trim()));
      const snapMob = await getDocs(qMob);
      snapMob.docs.forEach(d => resultsMap.set(d.id, { id: d.id, ...d.data() }));
    } catch (e) {
      console.warn("Mobile query failed:", e);
    }
  }

  // 3. Fallback: Check local saved IDs from this device
  try {
    const localIds = JSON.parse(localStorage.getItem('rsssst_my_app_ids') || '[]');
    for (const appId of localIds) {
      if (!resultsMap.has(appId)) {
        try {
          const docSnap = await getDoc(doc(db, 'membershipApplications', appId));
          if (docSnap.exists()) {
            resultsMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
          }
        } catch {}
      }
    }
  } catch {}

  const list = Array.from(resultsMap.values());
  return list.sort((a, b) => {
    const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : 0;
    const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : 0;
    return timeB - timeA;
  });
};

export const getAllApplicationsForAdmin = async () => {
  const colRef = collection(db, 'membershipApplications');
  try {
    const snap = await getDocs(colRef);
    const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return list.sort((a, b) => {
      const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : 0;
      const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : 0;
      return timeB - timeA;
    });
  } catch (err) {
    console.error("Admin fetch applications error:", err);
    return [];
  }
};

export const approveMembershipApplication = async (appId, adminUid) => {
  const appRef = doc(db, 'membershipApplications', appId);
  const appSnap = await getDoc(appRef);

  if (!appSnap.exists()) {
    throw new Error("आवेदन प्राप्त नहीं हुआ (Application not found).");
  }

  const appData = appSnap.data();
  if (appData.status === 'approved') {
    throw new Error("यह आवेदन पहले से ही स्वीकृत है (Already approved).");
  }

  // Generate unique membership number
  const membershipNo = await generateMembershipNumber();
  const validityDate = new Date();
  validityDate.setFullYear(validityDate.getFullYear() + 1);

  const memberData = {
    membershipNumber: membershipNo,
    userUid: appData.applicantUid || null,
    applicationId: appId,
    fullName: appData.fullName,
    fatherHusbandName: appData.fatherHusbandName,
    mobile: appData.mobile,
    district: appData.district,
    state: appData.state,
    category: appData.category,
    status: 'active',
    membershipFee: appData.annualFee,
    paymentStatus: appData.category === 'catA' ? 'exempted' : 'verified_or_pending',
    approvedAt: serverTimestamp(),
    approvedBy: adminUid,
    validUntil: validityDate.toISOString().split('T')[0]
  };

  // Create member record in members collection
  await addDoc(collection(db, 'members'), memberData);

  // Update application status
  await updateDoc(appRef, {
    status: 'approved',
    membershipNumber: membershipNo,
    reviewedAt: serverTimestamp(),
    reviewedBy: adminUid
  });

  return { membershipNumber: membershipNo };
};

export const rejectMembershipApplication = async (appId, reason, adminUid) => {
  const appRef = doc(db, 'membershipApplications', appId);
  await updateDoc(appRef, {
    status: 'rejected',
    rejectionReason: reason || 'ट्रस्ट नियमावली के अनुसार आवश्यक शर्तें पूर्ण नहीं हैं।',
    reviewedAt: serverTimestamp(),
    reviewedBy: adminUid
  });
};

// -------------------------------------------------------------
// 2. PAYMENTS & TRANSACTIONS
// -------------------------------------------------------------

export const submitPaymentRecord = async (paymentData, userUid) => {
  const colRef = collection(db, 'payments');
  const docData = {
    payerUid: userUid || null,
    payerName: paymentData.payerName.trim(),
    payerMobile: paymentData.payerMobile.trim(),
    purpose: paymentData.purpose, // 'membership_fee' | 'voluntary_contribution' | 'samarpan'
    amount: Number(paymentData.amount),
    paymentMethod: paymentData.paymentMethod || 'upi', // 'upi' | 'bank_transfer'
    utrNumber: paymentData.utrNumber.trim().toUpperCase(),
    notes: paymentData.notes || '',
    verificationStatus: 'pending_verification', // strictly pending
    submittedAt: serverTimestamp(),
    verifiedAt: null,
    verifiedBy: null,
    receiptNumber: null
  };

  const ref = await addDoc(colRef, docData);

  try {
    const saved = JSON.parse(localStorage.getItem('rsssst_my_payment_ids') || '[]');
    saved.unshift(ref.id);
    localStorage.setItem('rsssst_my_payment_ids', JSON.stringify(saved.slice(0, 20)));
  } catch {}

  return { id: ref.id, ...docData };
};

export const getPaymentsForUser = async (userUid, userMobile) => {
  const colRef = collection(db, 'payments');
  const resultsMap = new Map();

  if (userUid) {
    try {
      const q = query(colRef, where('payerUid', '==', userUid));
      const snap = await getDocs(q);
      snap.docs.forEach(d => resultsMap.set(d.id, { id: d.id, ...d.data() }));
    } catch {}
  }

  const searchMobile = userMobile || (typeof window !== 'undefined' ? localStorage.getItem('rsssst_last_app_mobile') : null);
  if (searchMobile) {
    try {
      const qMob = query(colRef, where('payerMobile', '==', searchMobile.trim()));
      const snapMob = await getDocs(qMob);
      snapMob.docs.forEach(d => resultsMap.set(d.id, { id: d.id, ...d.data() }));
    } catch {}
  }

  try {
    const localIds = JSON.parse(localStorage.getItem('rsssst_my_payment_ids') || '[]');
    for (const pid of localIds) {
      if (!resultsMap.has(pid)) {
        try {
          const docSnap = await getDoc(doc(db, 'payments', pid));
          if (docSnap.exists()) resultsMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
        } catch {}
      }
    }
  } catch {}

  const list = Array.from(resultsMap.values());
  return list.sort((a, b) => {
    const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : 0;
    const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : 0;
    return timeB - timeA;
  });
};

export const getAllPaymentsForAdmin = async () => {
  const colRef = collection(db, 'payments');
  try {
    const snap = await getDocs(colRef);
    const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return list.sort((a, b) => {
      const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : 0;
      const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : 0;
      return timeB - timeA;
    });
  } catch {
    return [];
  }
};

export const verifyPaymentRecord = async (paymentId, adminUid, adminNotes = '') => {
  const payRef = doc(db, 'payments', paymentId);
  const paySnap = await getDoc(payRef);

  if (!paySnap.exists()) {
    throw new Error("भुगतान रिकॉर्ड प्राप्त नहीं हुआ (Payment not found).");
  }

  const payData = paySnap.data();
  if (payData.verificationStatus === 'verified') {
    throw new Error("यह भुगतान पहले ही सत्यापित हो चुका है (Already verified).");
  }

  const receiptNo = await generateReceiptNumber();

  // Create receipt record
  const receiptData = {
    receiptNumber: receiptNo,
    paymentId: paymentId,
    payerUid: payData.payerUid || null,
    payerName: payData.payerName,
    payerMobile: payData.payerMobile,
    amount: payData.amount,
    purpose: payData.purpose,
    paymentMethod: payData.paymentMethod,
    utrNumber: payData.utrNumber,
    issuedAt: serverTimestamp(),
    issuedBy: adminUid,
    trustName: 'Rashtriya Sanatan Sanskar Seva Sansthan (Trust)',
    trustRegOffice: 'Gorakhpur, Uttar Pradesh'
  };

  await addDoc(collection(db, 'receipts'), receiptData);

  // Update payment status
  await updateDoc(payRef, {
    verificationStatus: 'verified',
    verifiedAt: serverTimestamp(),
    verifiedBy: adminUid,
    receiptNumber: receiptNo,
    adminNotes: adminNotes
  });

  return { receiptNumber: receiptNo };
};

export const rejectPaymentRecord = async (paymentId, adminUid, reason = '') => {
  const payRef = doc(db, 'payments', paymentId);
  await updateDoc(payRef, {
    verificationStatus: 'rejected',
    verifiedAt: serverTimestamp(),
    verifiedBy: adminUid,
    adminNotes: reason || 'बैंक मिलान में यह UTR/लेनदेन उपलब्ध नहीं पाया गया।'
  });
};

// -------------------------------------------------------------
// 3. ASSISTANCE REQUESTS (PRIVATE BENEFICIARY PORTAL)
// -------------------------------------------------------------

export const submitAssistanceRequest = async (requestData, applicantUid) => {
  const colRef = collection(db, 'assistanceRequests');
  const now = new Date();
  const trackingId = `RSSSST-HELP-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const data = {
    trackingId: trackingId,
    applicantUid: applicantUid || null,
    fullName: requestData.fullName.trim(),
    fatherHusbandName: requestData.fatherHusbandName ? requestData.fatherHusbandName.trim() : '',
    mobile: requestData.mobile.trim(),
    whatsapp: requestData.whatsapp ? requestData.whatsapp.trim() : requestData.mobile.trim(),
    location: requestData.location.trim(),
    cityDistrict: requestData.cityDistrict.trim(),
    state: requestData.state.trim(),
    pincode: requestData.pincode ? requestData.pincode.trim() : '',
    category: requestData.category,
    amountNeeded: Number(requestData.amountNeeded),
    urgency: requestData.urgency || 'urgent',
    description: requestData.description.trim(),
    bankOrUpi: requestData.bankOrUpi ? requestData.bankOrUpi.trim() : '',
    status: 'submitted',
    submittedAt: serverTimestamp(),
    reviewedAt: null,
    adminNotes: null
  };

  const docRef = await addDoc(colRef, data);

  try {
    const saved = JSON.parse(localStorage.getItem('rsssst_my_help_ids') || '[]');
    saved.unshift(docRef.id);
    localStorage.setItem('rsssst_my_help_ids', JSON.stringify(saved.slice(0, 20)));
  } catch {}

  return { id: docRef.id, trackingId: trackingId, ...data };
};

export const getAssistanceRequestsForUser = async (userUid, userMobile) => {
  const colRef = collection(db, 'assistanceRequests');
  const resultsMap = new Map();

  if (userUid) {
    try {
      const q = query(colRef, where('applicantUid', '==', userUid));
      const snap = await getDocs(q);
      snap.docs.forEach(d => resultsMap.set(d.id, { id: d.id, ...d.data() }));
    } catch {}
  }

  const searchMobile = userMobile || (typeof window !== 'undefined' ? localStorage.getItem('rsssst_last_app_mobile') : null);
  if (searchMobile) {
    try {
      const qMob = query(colRef, where('mobile', '==', searchMobile.trim()));
      const snapMob = await getDocs(qMob);
      snapMob.docs.forEach(d => resultsMap.set(d.id, { id: d.id, ...d.data() }));
    } catch {}
  }

  try {
    const localIds = JSON.parse(localStorage.getItem('rsssst_my_help_ids') || '[]');
    for (const hid of localIds) {
      if (!resultsMap.has(hid)) {
        try {
          const docSnap = await getDoc(doc(db, 'assistanceRequests', hid));
          if (docSnap.exists()) resultsMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
        } catch {}
      }
    }
  } catch {}

  const list = Array.from(resultsMap.values());
  return list.sort((a, b) => {
    const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : 0;
    const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : 0;
    return timeB - timeA;
  });
};

export const getAllAssistanceRequestsForAdmin = async () => {
  const colRef = collection(db, 'assistanceRequests');
  try {
    const snap = await getDocs(colRef);
    const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return list.sort((a, b) => {
      const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : 0;
      const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : 0;
      return timeB - timeA;
    });
  } catch {
    return [];
  }
};

export const updateAssistanceRequestStatus = async (requestId, status, adminNotes, adminUid) => {
  const ref = doc(db, 'assistanceRequests', requestId);
  await updateDoc(ref, {
    status: status,
    adminNotes: adminNotes || '',
    reviewedAt: serverTimestamp(),
    reviewedBy: adminUid
  });
};

// -------------------------------------------------------------
// 4. VOLUNTEER APPLICATIONS
// -------------------------------------------------------------

export const submitVolunteerApplication = async (data, userUid) => {
  const colRef = collection(db, 'volunteerApplications');
  const docData = {
    applicantUid: userUid || null,
    fullName: data.fullName.trim(),
    mobile: data.mobile.trim(),
    email: data.email ? data.email.trim() : '',
    preferredAreas: data.preferredAreas || [],
    availability: data.availability || 'weekends',
    experience: data.experience ? data.experience.trim() : '',
    cityOrDistrict: data.cityOrDistrict.trim(),
    status: 'pending',
    submittedAt: serverTimestamp()
  };

  const docRef = await addDoc(colRef, docData);
  return { id: docRef.id, ...docData };
};

export const getAllVolunteerApplications = async () => {
  const colRef = collection(db, 'volunteerApplications');
  try {
    const snap = await getDocs(colRef);
    const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return list.sort((a, b) => {
      const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : 0;
      const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : 0;
      return timeB - timeA;
    });
  } catch {
    return [];
  }
};

export const updateVolunteerStatus = async (appId, status) => {
  const ref = doc(db, 'volunteerApplications', appId);
  await updateDoc(ref, { status, reviewedAt: serverTimestamp() });
};

// -------------------------------------------------------------
// 5. ANNOUNCEMENTS & FIELD MESSAGES
// -------------------------------------------------------------

export const getPublishedAnnouncements = async () => {
  const colRef = collection(db, 'announcements');
  try {
    const snap = await getDocs(colRef);
    const list = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(a => a.isPublished === true);
    return list.sort((a, b) => {
      const timeA = a.publishedAt?.toMillis ? a.publishedAt.toMillis() : 0;
      const timeB = b.publishedAt?.toMillis ? b.publishedAt.toMillis() : 0;
      return timeB - timeA;
    });
  } catch {
    return [];
  }
};

export const getAllAnnouncementsForAdmin = async () => {
  const colRef = collection(db, 'announcements');
  try {
    const snap = await getDocs(colRef);
    const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return list.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
  } catch {
    return [];
  }
};

export const createAnnouncement = async (data, adminUid, authorName = 'Trust Executive') => {
  const colRef = collection(db, 'announcements');
  const now = serverTimestamp();
  const docData = {
    title: data.title.trim(),
    content: data.content.trim(),
    category: data.category || 'general',
    isPublished: data.isPublished !== undefined ? data.isPublished : true,
    isFeatured: data.isFeatured || false,
    authorName: authorName,
    authorUid: adminUid,
    publishedAt: now,
    createdAt: now,
    updatedAt: now
  };

  const docRef = await addDoc(colRef, docData);
  return { id: docRef.id, ...docData };
};

export const updateAnnouncement = async (id, data) => {
  const ref = doc(db, 'announcements', id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const deleteAnnouncement = async (id) => {
  const ref = doc(db, 'announcements', id);
  await deleteDoc(ref);
};

// -------------------------------------------------------------
// 6. DASHBOARD STATISTICS
// -------------------------------------------------------------

export const getDashboardStats = async () => {
  try {
    const [appsSnap, membersSnap, paymentsSnap, helpSnap, volSnap] = await Promise.all([
      getDocs(collection(db, 'membershipApplications')),
      getDocs(collection(db, 'members')),
      getDocs(collection(db, 'payments')),
      getDocs(collection(db, 'assistanceRequests')),
      getDocs(collection(db, 'volunteerApplications'))
    ]);

    const apps = appsSnap.docs.map(d => d.data());
    const payments = paymentsSnap.docs.map(d => d.data());
    const helpRequests = helpSnap.docs.map(d => d.data());

    const totalApplications = apps.length;
    const pendingApplications = apps.filter(a => a.status === 'pending').length;
    const approvedMembers = membersSnap.docs.length;
    const rejectedApplications = apps.filter(a => a.status === 'rejected').length;

    const pendingPayments = payments.filter(p => p.verificationStatus === 'pending_verification').length;
    const verifiedPayments = payments.filter(p => p.verificationStatus === 'verified');
    
    const verifiedMembershipFees = verifiedPayments
      .filter(p => p.purpose === 'membership_fee')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const verifiedVoluntaryContributions = verifiedPayments
      .filter(p => p.purpose !== 'membership_fee')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const pendingAssistanceRequests = helpRequests.filter(h => h.status === 'submitted' || h.status === 'under_review').length;
    const volunteerApplicationsCount = volSnap.docs.length;

    return {
      totalApplications,
      pendingApplications,
      approvedMembers,
      rejectedApplications,
      pendingPayments,
      verifiedPaymentsCount: verifiedPayments.length,
      verifiedMembershipFees,
      verifiedVoluntaryContributions,
      pendingAssistanceRequests,
      volunteerApplicationsCount
    };
  } catch (err) {
    console.error("Error computing dashboard stats:", err);
    return {
      totalApplications: 0,
      pendingApplications: 0,
      approvedMembers: 0,
      rejectedApplications: 0,
      pendingPayments: 0,
      verifiedPaymentsCount: 0,
      verifiedMembershipFees: 0,
      verifiedVoluntaryContributions: 0,
      pendingAssistanceRequests: 0,
      volunteerApplicationsCount: 0
    };
  }
};
