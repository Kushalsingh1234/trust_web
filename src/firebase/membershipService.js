import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  onSnapshot,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from './config';

/**
 * Rashtriya Sanatan Sanskar Seva Sansthan (Trust)
 * Central Membership Service & Life-Cycle Management
 * Fully resilient with dual-collection synchronization:
 * Supports both unified ('memberships') and active Firestore ('membershipApplications')
 */

/**
 * Submit Membership Application with Category-specific processing
 * - Category A: Destitute / Beneficiary (Fee ₹0, no payment ID required)
 * - Category B: Patron / General Member (Fee ₹200, requires Payment ID / UTR)
 * - Category C: Active Volunteer Member (Fee ₹200, requires Availability & Skills + Payment ID)
 */
export const submitMembershipWithPaymentId = async ({
  fullName,
  phone,
  fatherHusbandName = '',
  address = '',
  district = 'Gorakhpur',
  state = 'Uttar Pradesh',
  pincode = '273016',
  category = 'catB',
  memberType = 'member', // 'member' | 'volunteer'
  role = 'member',
  claimedAmount = 200,
  paymentId,
  paymentDate,
  uid,
  paymentProofType = 'utr', // 'utr' | 'screenshot'
  paymentScreenshotUrl = null,
  // Category A specific:
  helpType = '',
  monthlyIncome = '',
  familyMembersCount = '',
  assistanceDescription = '',
  // Category B specific:
  profession = '',
  workplace = '',
  focusArea = '',
  // Category C specific:
  availability = '',
  serviceAreas = [],
  experience = ''
}) => {
  const isVolunteerRole = memberType === 'volunteer' || category === 'catC';
  const effectiveCategory = isVolunteerRole ? 'catC' : (category || 'catB');
  const isCatA = effectiveCategory === 'catA';
  const cleanPaymentId = paymentId ? paymentId.trim().toUpperCase() : null;

  // Guard 1: Prevent duplicate application ONLY if applicant is ALREADY active in THIS specific role
  if (uid) {
    try {
      const uSnap = await getDoc(doc(db, 'users', uid));
      if (uSnap.exists()) {
        const uData = uSnap.data();
        if (!isVolunteerRole && uData.isMember === true) {
          throw new Error(
            `आप पहले से ही राष्ट्रीय सनातन संस्कार सेवा संस्थान के सक्रिय सदस्य हैं (सदस्यता क्रमांक: ${uData.memberId || 'सत्यापित'})। (आप स्वयंसेवक हेतु आवेदन कर सकते हैं)`
          );
        } else if (isVolunteerRole && (uData.isVolunteer === true || uData.volunteerStatus === 'approved')) {
          throw new Error(
            `आप पहले से ही राष्ट्रीय सनातन संस्कार सेवा संस्थान के सक्रिय स्वयंसेवक हैं (आईडी: ${uData.volunteerId || uData.memberId || 'सत्यापित'})। (आप ट्रस्ट सदस्यता हेतु आवेदन कर सकते हैं)`
          );
        }
      }
    } catch (err) {
      if (err.message && (err.message.includes("सक्रिय सदस्य") || err.message.includes("सक्रिय स्वयंसेवक"))) throw err;
    }
  }

  // Guard 2: If applicant previously had pending applications OF THIS SAME ROLE, supersede them
  if (uid) {
    try {
      const qPending = query(
        collection(db, 'membershipApplications'),
        where('applicantUid', '==', uid),
        where('status', '==', 'pending')
      );
      const sPending = await getDocs(qPending);
      for (const pDoc of sPending.docs) {
        const pData = pDoc.data();
        const pIsVol = pData.memberType === 'volunteer' || pData.category === 'catC';
        if (pIsVol === isVolunteerRole) {
          await updateDoc(pDoc.ref, {
            status: 'superseded',
            supersededAt: serverTimestamp()
          });
        }
      }
    } catch (err) {}
  }

  // 1. CATEGORY A: Destitute / Beneficiary Member (100% Free, Exempted from Fee)
  if (isCatA || !cleanPaymentId) {
    const membershipData = {
      uid: uid || null,
      applicantUid: uid || null,
      fullName: fullName.trim(),
      phone: phone.trim(),
      mobile: phone.trim(),
      fatherHusbandName: fatherHusbandName.trim(),
      address: address.trim(),
      villageOrLocality: address.trim(),
      district: district.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      category: 'catA',
      annualFee: 0,
      claimedAmount: 0,
      amount: 0,
      paymentId: null,
      paymentDate: null,
      paymentStatus: 'exempted',
      helpType: helpType ? helpType.trim() : 'आर्थिक / पारिवारिक सहायता',
      monthlyIncome: monthlyIncome ? monthlyIncome.trim() : null,
      familyMembersCount: familyMembersCount ? familyMembersCount.trim() : null,
      assistanceDescription: assistanceDescription ? assistanceDescription.trim() : '',
      status: 'pending',
      createdAt: serverTimestamp(),
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Primary: Write to active membershipApplications collection
    const legacyRef = doc(collection(db, 'membershipApplications'));
    await setDoc(legacyRef, membershipData);

    // Secondary: Mirror to memberships collection (graceful fallback)
    try {
      const unifiedRef = doc(db, 'memberships', legacyRef.id);
      await setDoc(unifiedRef, membershipData);
    } catch (e) {
      // Ignore if unified collection permissions are still propagating
    }

    // Update users/{uid} document with active application status
    if (uid) {
      try {
        await setDoc(doc(db, 'users', uid), {
          hasAppliedMembership: true,
          membershipApplicationId: legacyRef.id,
          membershipStatus: 'pending',
          category: 'catA',
          claimedAmount: 0,
          annualFee: 0,
          paymentId: 'EXEMPTED-₹0',
          appliedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.warn("Could not update user profile with membership status:", e);
      }
    }

    // Cache in browser localStorage strictly scoped to user UID
    try {
      if (uid) {
        const userAppKey = `rsssst_my_membership_app_${uid}`;
        const userIdsKey = `rsssst_my_app_ids_${uid}`;
        const saved = JSON.parse(localStorage.getItem(userIdsKey) || '[]');
        if (!saved.includes(legacyRef.id)) saved.unshift(legacyRef.id);
        localStorage.setItem(userIdsKey, JSON.stringify(saved.slice(0, 20)));
        localStorage.setItem(userAppKey, JSON.stringify({
          id: legacyRef.id,
          ...membershipData,
          status: 'pending',
          createdAt: new Date().toISOString()
        }));
      }
      // Purge unscoped cross-user leak keys
      localStorage.removeItem('rsssst_my_membership_app');
      localStorage.removeItem('rsssst_my_app_ids');
      localStorage.removeItem('rsssst_last_app_mobile');
    } catch (e) {}

    return { id: legacyRef.id, paymentId: 'EXEMPTED-₹0' };
  }

  // 2. CATEGORY B & C: Paid Members (Requires Payment ID verification)
  // Check for duplicate payment ID to flag for admin review without crashing application creation
  let isDuplicatePaymentId = false;
  try {
    const qPayments = query(collection(db, 'payments'), where('paymentId', '==', cleanPaymentId));
    const snapPayments = await getDocs(qPayments);
    if (!snapPayments.empty) {
      isDuplicatePaymentId = true;
    }

    const qLegacy = query(collection(db, 'membershipApplications'), where('paymentId', '==', cleanPaymentId));
    const snapLegacy = await getDocs(qLegacy);
    if (!snapLegacy.empty) {
      isDuplicatePaymentId = true;
    }
  } catch (err) {}

  const membershipDocData = {
    uid: uid || null,
    applicantUid: uid || null,
    fullName: fullName.trim(),
    phone: phone.trim(),
    mobile: phone.trim(),
    fatherHusbandName: fatherHusbandName.trim(),
    address: address.trim(),
    villageOrLocality: address.trim(),
    district: district.trim(),
    state: state.trim(),
    pincode: pincode.trim(),
    category: isVolunteerRole ? 'catC' : (category || 'catB'),
    memberType: isVolunteerRole ? 'volunteer' : 'member',
    role: isVolunteerRole ? 'volunteer' : 'member',
    annualFee: Number(claimedAmount) || 200,
    claimedAmount: Number(claimedAmount) || 200,
    amount: Number(claimedAmount) || 200,
    paymentId: cleanPaymentId,
    utrNumber: cleanPaymentId,
    paymentProofType: paymentProofType || 'utr',
    paymentScreenshotUrl: paymentScreenshotUrl || null,
    paymentDate: paymentDate || null,
    paymentStatus: 'pending_verification',
    // Category B
    profession: profession ? profession.trim() : null,
    workplace: workplace ? workplace.trim() : null,
    focusArea: focusArea ? focusArea.trim() : null,
    // Category C
    availability: availability ? availability.trim() : 'weekends',
    serviceAreas: Array.isArray(serviceAreas) ? serviceAreas : [],
    experience: experience ? experience.trim() : null,
    status: 'pending',
    createdAt: serverTimestamp(),
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  // Primary: Save application in membershipApplications
  const newAppRef = doc(collection(db, 'membershipApplications'));
  await setDoc(newAppRef, membershipDocData);

  // If Volunteer role, also mirror into volunteer collections
  if (isVolunteerRole) {
    try {
      const volData = {
        uid: uid || null,
        applicantUid: uid || null,
        membershipApplicationId: newAppRef.id,
        fullName: fullName.trim(),
        mobile: phone.trim(),
        phone: phone.trim(),
        cityOrDistrict: district.trim(),
        availability: availability || 'weekends',
        experience: experience ? experience.trim() : '',
        category: 'catC',
        memberType: 'volunteer',
        role: 'volunteer',
        amount: Number(claimedAmount) || 200,
        paymentId: cleanPaymentId,
        paymentProofType: paymentProofType || 'utr',
        paymentScreenshotUrl: paymentScreenshotUrl || null,
        status: 'pending',
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(doc(db, 'volunteers', newAppRef.id), volData);
      await setDoc(doc(db, 'volunteerApplications', newAppRef.id), volData);
    } catch (vErr) {
      console.warn("Could not mirror to volunteer collections:", vErr);
    }
  }

  // Save payment tracking entry in payments collection
  try {
    const paymentDocRef = doc(collection(db, 'payments'));
    await setDoc(paymentDocRef, {
      payerUid: uid || null,
      uid: uid || null,
      amount: Number(claimedAmount) || 200,
      claimedAmount: Number(claimedAmount) || 200,
      purpose: isVolunteerRole ? 'volunteer_registration' : 'membership_fee',
      paymentId: cleanPaymentId,
      utrNumber: cleanPaymentId,
      paymentProofType: paymentProofType || 'utr',
      paymentScreenshotUrl: paymentScreenshotUrl || null,
      verificationStatus: 'pending_verification',
      status: 'pending',
      payerName: fullName.trim(),
      payerPhone: phone.trim(),
      category: isVolunteerRole ? 'catC' : (category || 'catB'),
      memberType: isVolunteerRole ? 'volunteer' : 'member',
      membershipId: newAppRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    console.warn("Could not write payments record:", e);
  }

  // Also mirror to memberships and paymentIds if permitted
  try {
    const unifiedRef = doc(db, 'memberships', newAppRef.id);
    await setDoc(unifiedRef, membershipDocData);
  } catch (e) {}

  try {
    const paymentIdRef = doc(db, 'paymentIds', cleanPaymentId);
    await setDoc(paymentIdRef, {
      uid: uid || null,
      claimedAmount: Number(claimedAmount) || 200,
      purpose: isVolunteerRole ? 'volunteer_registration' : 'membership_fee',
      entityType: isVolunteerRole ? 'volunteer' : 'membership',
      createdAt: serverTimestamp()
    });
  } catch (e) {}

  // Update users/{uid} document with active application status
  if (uid) {
    try {
      if (isVolunteerRole) {
        await setDoc(doc(db, 'users', uid), {
          hasAppliedVolunteer: true,
          volunteerApplicationId: newAppRef.id,
          volunteerStatus: 'pending',
          role: 'volunteer',
          volunteerPaymentId: cleanPaymentId,
          volunteerProofType: paymentProofType || 'utr',
          volunteerScreenshotUrl: paymentScreenshotUrl || null,
          appliedVolunteerAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        await setDoc(doc(db, 'users', uid), {
          hasAppliedMembership: true,
          membershipApplicationId: newAppRef.id,
          membershipStatus: 'pending',
          category: category || 'catB',
          claimedAmount: Number(claimedAmount) || 200,
          annualFee: Number(claimedAmount) || 200,
          paymentId: cleanPaymentId,
          paymentProofType: paymentProofType || 'utr',
          paymentScreenshotUrl: paymentScreenshotUrl || null,
          appliedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    } catch (e) {
      console.warn("Could not update user profile with membership status:", e);
    }
  }

  // Cache in browser localStorage strictly scoped to user UID
  try {
    if (uid) {
      if (isVolunteerRole) {
        const userVolKey = `rsssst_my_volunteer_app_${uid}`;
        localStorage.setItem(userVolKey, JSON.stringify({
          id: newAppRef.id,
          ...membershipDocData,
          status: 'pending',
          createdAt: new Date().toISOString()
        }));
      } else {
        const userAppKey = `rsssst_my_membership_app_${uid}`;
        const userIdsKey = `rsssst_my_app_ids_${uid}`;
        const saved = JSON.parse(localStorage.getItem(userIdsKey) || '[]');
        if (!saved.includes(newAppRef.id)) saved.unshift(newAppRef.id);
        localStorage.setItem(userIdsKey, JSON.stringify(saved.slice(0, 20)));
        localStorage.setItem(userAppKey, JSON.stringify({
          id: newAppRef.id,
          ...membershipDocData,
          status: 'pending',
          createdAt: new Date().toISOString()
        }));
      }
    }
    // Purge unscoped cross-user leak keys
    localStorage.removeItem('rsssst_my_membership_app');
    localStorage.removeItem('rsssst_my_volunteer_app');
    localStorage.removeItem('rsssst_my_app_ids');
    localStorage.removeItem('rsssst_last_app_mobile');
  } catch (e) {}

  return { id: newAppRef.id, paymentId: cleanPaymentId };
};

/**
 * Admin: Approve Membership
 * - Works with both 'memberships' and 'membershipApplications'
 * - Generates sequential Member ID (TRUST-M-XXXX)
 * - Generates sequential Receipt Number for paid members
 * - Sets users/{uid}.isMember = true
 */
export const approveMembership = async (membershipId, verifiedAmount = 200, adminUid = 'admin') => {
  const currentYear = new Date().getFullYear();

  // 1. Locate membership doc across collections (prioritize deployed 'membershipApplications')
  let targetRef = null;
  let snap = null;
  let isLegacy = true;

  try {
    const legacyRef = doc(db, 'membershipApplications', membershipId);
    const legacySnap = await getDoc(legacyRef);
    if (legacySnap.exists()) {
      targetRef = legacyRef;
      snap = legacySnap;
      isLegacy = true;
    }
  } catch (e) {
    console.warn("Could not read from membershipApplications:", e);
  }

  if (!snap || !snap.exists()) {
    try {
      const unifiedRef = doc(db, 'memberships', membershipId);
      const unifiedSnap = await getDoc(unifiedRef);
      if (unifiedSnap.exists()) {
        targetRef = unifiedRef;
        snap = unifiedSnap;
        isLegacy = false;
      }
    } catch (e) {
      console.warn("Could not read from memberships:", e);
    }
  }

  if (!snap || !snap.exists()) {
    throw new Error("Membership record not found.");
  }

  const memData = snap.data();
  const isCatA = memData.category === 'catA';
  const numVerified = isCatA ? 0 : Number(verifiedAmount);

  if (!isCatA && (isNaN(numVerified) || numVerified < 0)) {
    throw new Error("Please enter a valid numeric verified amount.");
  }

  // 2. Generate sequential Member ID (using systemConfig counters or timestamp)
  let nextMemberSeq = Date.now() % 9000 + 1000;
  try {
    const sysCounterRef = doc(db, 'systemConfig', 'counters');
    const cSnap = await getDoc(sysCounterRef);
    if (cSnap.exists() && cSnap.data().membershipSeq) {
      nextMemberSeq = cSnap.data().membershipSeq + 1;
    }
    await setDoc(sysCounterRef, { membershipSeq: nextMemberSeq }, { merge: true });
  } catch (e) {
    try {
      const memberCounterRef = doc(db, 'counters', 'members');
      const cSnap = await getDoc(memberCounterRef);
      if (cSnap.exists() && cSnap.data().seq) {
        nextMemberSeq = cSnap.data().seq + 1;
      }
      await setDoc(memberCounterRef, { seq: nextMemberSeq }, { merge: true });
    } catch (e2) {}
  }
  const isVolunteerRecord = memData.memberType === 'volunteer' || memData.category === 'catC';
  const memberId = isVolunteerRecord
    ? `TRUST-V-${String(nextMemberSeq).padStart(4, '0')}`
    : `TRUST-M-${String(nextMemberSeq).padStart(4, '0')}`;

  // 3. Generate sequential Receipt Number for paid members
  let receiptNumber = null;
  if (!isCatA && numVerified > 0) {
    let nextReceiptSeq = Date.now() % 8000 + 1001;
    try {
      const sysCounterRef = doc(db, 'systemConfig', 'counters');
      const rSnap = await getDoc(sysCounterRef);
      if (rSnap.exists() && rSnap.data().receiptSeq) {
        nextReceiptSeq = rSnap.data().receiptSeq + 1;
      }
      await setDoc(sysCounterRef, { receiptSeq: nextReceiptSeq, year: currentYear }, { merge: true });
    } catch (e) {
      try {
        const receiptCounterRef = doc(db, 'counters', 'receipts');
        const rSnap = await getDoc(receiptCounterRef);
        if (rSnap.exists() && rSnap.data().seq) {
          nextReceiptSeq = rSnap.data().seq + 1;
        }
        await setDoc(receiptCounterRef, { seq: nextReceiptSeq, year: currentYear }, { merge: true });
      } catch (e2) {}
    }
    receiptNumber = `RCPT-${currentYear}-${String(nextReceiptSeq).padStart(4, '0')}`;
  }

  const approvalPayload = {
    status: 'approved',
    memberId,
    volunteerId: isVolunteerRecord ? memberId : null,
    cardType: isVolunteerRecord ? 'volunteer' : 'member',
    memberType: isVolunteerRecord ? 'volunteer' : 'member',
    memberSince: serverTimestamp(),
    verifiedAmount: numVerified,
    receiptNumber,
    approvedBy: adminUid,
    approvedAt: serverTimestamp(),
    reviewedAt: serverTimestamp(),
    reviewedBy: adminUid,
    updatedAt: serverTimestamp()
  };

  // Update primary document
  let updateSuccess = false;
  if (targetRef) {
    try {
      await updateDoc(targetRef, approvalPayload);
      updateSuccess = true;
    } catch (err) {
      console.warn("Update on primary collection failed:", err);
    }
  }

  // Update mirror collection
  const mirrorCol = isLegacy ? 'memberships' : 'membershipApplications';
  try {
    await updateDoc(doc(db, mirrorCol, membershipId), approvalPayload);
    updateSuccess = true;
  } catch (e) {}

  // If volunteer, also update volunteers & volunteerApplications collection
  if (isVolunteerRecord) {
    try {
      await updateDoc(doc(db, 'volunteers', membershipId), {
        status: 'approved',
        volunteerId: memberId,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (e) {}
    try {
      await updateDoc(doc(db, 'volunteerApplications', membershipId), {
        status: 'approved',
        volunteerId: memberId,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (e) {}
  }

  if (!updateSuccess) {
    throw new Error("Missing or insufficient permissions to update membership application.");
  }

  // 4. Update user profile at users/{uid}
  const targetUid = memData.uid || memData.applicantUid;
  if (targetUid) {
    try {
      const userRef = doc(db, 'users', targetUid);
      if (isVolunteerRecord) {
        await setDoc(userRef, {
          isVolunteer: true,
          volunteerId: memberId,
          volunteerStatus: 'approved',
          volunteerSince: serverTimestamp(),
          role: 'volunteer',
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        await setDoc(userRef, {
          isMember: true,
          memberId,
          memberSince: serverTimestamp(),
          membershipStatus: 'approved',
          category: memData.category || 'catB',
          role: 'member',
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    } catch (e) {
      console.warn("Could not update user profile with membership status:", e);
    }
  }

  // 5. Also create approved record in 'members' collection
  try {
    const validityDate = new Date();
    validityDate.setFullYear(validityDate.getFullYear() + 1);
    await addDoc(collection(db, 'members'), {
      membershipNumber: memberId,
      memberId: memberId,
      volunteerId: isVolunteerRecord ? memberId : null,
      cardType: isVolunteerRecord ? 'volunteer' : 'member',
      memberType: isVolunteerRecord ? 'volunteer' : 'member',
      userUid: targetUid || null,
      uid: targetUid || null,
      applicationId: membershipId,
      fullName: memData.fullName,
      fatherHusbandName: memData.fatherHusbandName || '',
      mobile: memData.phone || memData.mobile || '',
      phone: memData.phone || memData.mobile || '',
      district: memData.district || '',
      state: memData.state || '',
      category: isVolunteerRecord ? 'catC' : (memData.category || 'catB'),
      status: 'active',
      membershipFee: numVerified,
      paymentStatus: isCatA ? 'exempted' : 'verified',
      receiptNumber: receiptNumber || null,
      verifiedAmount: numVerified,
      approvedAt: serverTimestamp(),
      approvedBy: adminUid,
      validUntil: validityDate.toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    console.warn("Could not write to members collection:", e);
  }

  // 6. Create verified payment and receipt record
  if (!isCatA && numVerified > 0 && receiptNumber) {
    const paymentRecord = {
      uid: targetUid || null,
      payerUid: targetUid || null,
      donorName: memData.fullName,
      donorPhone: memData.phone || memData.mobile,
      claimedAmount: memData.claimedAmount || numVerified,
      verifiedAmount: numVerified,
      amount: numVerified,
      purpose: 'membership_fee',
      paymentId: memData.paymentId || memData.utrNumber,
      utrNumber: memData.paymentId || memData.utrNumber,
      status: 'approved',
      verificationStatus: 'verified',
      receiptNumber,
      memberId,
      approvedBy: adminUid,
      approvedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(doc(collection(db, 'payments')), paymentRecord);
    } catch (e) {}
    try {
      await setDoc(doc(collection(db, 'donations')), paymentRecord);
    } catch (e) {}
    try {
      await setDoc(doc(db, 'receipts', receiptNumber), paymentRecord);
    } catch (e) {}
  }

  return { memberId, receiptNumber, verifiedAmount: numVerified };
};

/**
 * Admin: Reject Membership
 */
export const rejectMembership = async (membershipId, reason, adminUid) => {
  const payload = {
    status: 'rejected',
    rejectionReason: reason || 'Payment details could not be verified by trust administration.',
    reviewedBy: adminUid || 'admin',
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    await updateDoc(doc(db, 'membershipApplications', membershipId), payload);
  } catch (e) {}

  try {
    await updateDoc(doc(db, 'memberships', membershipId), payload);
  } catch (e) {}
};

/**
 * Admin: Remove Member
 */
export const removeMember = async (membershipId, uid, reason, adminUid) => {
  const payload = {
    status: 'removed',
    removedAt: serverTimestamp(),
    removedBy: adminUid || 'admin',
    removalReason: reason || 'Membership revoked by trust administration.',
    updatedAt: serverTimestamp()
  };

  let targetUid = uid || null;

  // Resolve applicant UID from application doc if not passed
  if (!targetUid) {
    try {
      const appSnap = await getDoc(doc(db, 'membershipApplications', membershipId));
      if (appSnap.exists()) {
        const d = appSnap.data();
        targetUid = d.applicantUid || d.uid || d.userUid || null;
      }
    } catch (e) {}
  }

  if (!targetUid) {
    try {
      const memSnap = await getDoc(doc(db, 'memberships', membershipId));
      if (memSnap.exists()) {
        const d = memSnap.data();
        targetUid = d.applicantUid || d.uid || d.userUid || null;
      }
    } catch (e) {}
  }

  // Fallback 1: Check members collection
  if (!targetUid) {
    try {
      const mDoc = await getDoc(doc(db, 'members', membershipId));
      if (mDoc.exists()) {
        const d = mDoc.data();
        targetUid = d.uid || d.userUid || null;
      }
    } catch (e) {}
  }

  // Fallback 2: Check users by memberId or phone from application record
  if (!targetUid) {
    try {
      let recordData = null;
      const appSnap = await getDoc(doc(db, 'membershipApplications', membershipId));
      if (appSnap.exists()) {
        recordData = appSnap.data();
      } else {
        const memSnap = await getDoc(doc(db, 'memberships', membershipId));
        if (memSnap.exists()) recordData = memSnap.data();
      }

      if (recordData) {
        if (recordData.memberId) {
          const qM = query(collection(db, 'users'), where('memberId', '==', recordData.memberId));
          const sM = await getDocs(qM);
          if (!sM.empty) targetUid = sM.docs[0].id;
        }
        if (!targetUid && (recordData.mobile || recordData.phone)) {
          const p = (recordData.mobile || recordData.phone).trim();
          const qP = query(collection(db, 'users'), where('phone', '==', p));
          const sP = await getDocs(qP);
          if (!sP.empty) targetUid = sP.docs[0].id;
        }
      }
    } catch (e) {}
  }

  try {
    await updateDoc(doc(db, 'membershipApplications', membershipId), payload);
  } catch (e) {}

  try {
    await updateDoc(doc(db, 'memberships', membershipId), payload);
  } catch (e) {}

  // Update members collection records
  try {
    const qMembers = query(collection(db, 'members'), where('applicationId', '==', membershipId));
    const snap = await getDocs(qMembers);
    for (const d of snap.docs) {
      await updateDoc(d.ref, {
        status: 'removed',
        removedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (e) {}

  // Also clean up any other approved or pending application records for this user
  if (targetUid) {
    try {
      const qUserApps = query(
        collection(db, 'membershipApplications'),
        where('applicantUid', '==', targetUid)
      );
      const sUserApps = await getDocs(qUserApps);
      for (const docItem of sUserApps.docs) {
        if (docItem.id !== membershipId && (docItem.data().status === 'approved' || docItem.data().status === 'pending')) {
          await updateDoc(docItem.ref, payload);
        }
      }
    } catch (e) {}

    try {
      const qUserMems = query(
        collection(db, 'memberships'),
        where('applicantUid', '==', targetUid)
      );
      const sUserMems = await getDocs(qUserMems);
      for (const docItem of sUserMems.docs) {
        if (docItem.id !== membershipId && (docItem.data().status === 'approved' || docItem.data().status === 'pending')) {
          await updateDoc(docItem.ref, payload);
        }
      }
    } catch (e) {}
  }

  // Strictly clear isMember, memberId, and category from users/{targetUid}
  if (targetUid) {
    try {
      const userRef = doc(db, 'users', targetUid);
      await setDoc(userRef, {
        isMember: false,
        memberId: null,
        category: null,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn("Could not update user profile removal:", e);
    }
  }

  return true;
};

/**
 * Realtime listener for members list (approved + removed)
 * Streams and combines documents from both collections seamlessly
 */
export const subscribeMembersList = (callback) => {
  let listUnified = [];
  let listLegacy = [];

  // Emit cached members immediately to prevent 0 on refresh
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('rsssst_cache_membersList');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          callback(parsed);
        }
      }
    } catch (e) {}
  }

  const mergeAndEmit = () => {
    const map = new Map();
    listLegacy.forEach(item => map.set(item.id, item));
    listUnified.forEach(item => map.set(item.id, item));

    const combined = Array.from(map.values()).filter(
      item => item.status === 'approved' || item.status === 'removed'
    );

    combined.sort((a, b) => {
      const tA = a.memberSince?.toMillis ? a.memberSince.toMillis() : (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
      const tB = b.memberSince?.toMillis ? b.memberSince.toMillis() : (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0);
      return tB - tA;
    });

    if (typeof window !== 'undefined' && combined.length > 0) {
      try {
        localStorage.setItem('rsssst_cache_membersList', JSON.stringify(combined));
      } catch (e) {}
    }

    callback(combined);
  };

  const unsubUnified = onSnapshot(collection(db, 'memberships'), (snap) => {
    listUnified = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    mergeAndEmit();
  }, (err) => {
    console.warn("Unified members snapshot note:", err);
    mergeAndEmit();
  });

  const unsubLegacy = onSnapshot(collection(db, 'membershipApplications'), (snap) => {
    listLegacy = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    mergeAndEmit();
  }, (err) => {
    console.warn("Legacy applications snapshot note:", err);
    mergeAndEmit();
  });

  return () => {
    unsubUnified();
    unsubLegacy();
  };
};

/**
 * Admin Action: Issue and dispatch receipt to applicant / donor
 * Allows user to download their official receipt on their dashboard
 */
export const markReceiptSent = async (collectionName, docId, adminUid) => {
  const currentYear = new Date().getFullYear();
  let nextSeq = Date.now() % 8000 + 1001;
  const sysCounterRef = doc(db, 'systemConfig', 'counters');
  try {
    const rSnap = await getDoc(sysCounterRef);
    if (rSnap.exists() && rSnap.data().receiptSeq) {
      nextSeq = rSnap.data().receiptSeq + 1;
    }
    await setDoc(sysCounterRef, { receiptSeq: nextSeq, year: currentYear }, { merge: true });
  } catch (e) {}

  const defaultReceiptNo = `RCPT-${currentYear}-${String(nextSeq).padStart(4, '0')}`;

  const payload = {
    receiptSent: true,
    receiptSentAt: serverTimestamp(),
    receiptSentBy: adminUid || auth.currentUser?.uid || 'admin',
    updatedAt: serverTimestamp()
  };

  // Determine all collections to try
  const targetCols = [collectionName];
  if (collectionName === 'memberships') targetCols.push('membershipApplications');
  else if (collectionName === 'membershipApplications') targetCols.push('memberships');
  else if (collectionName === 'donations') targetCols.push('payments');
  else if (collectionName === 'payments') targetCols.push('donations');

  let updated = false;
  let receiptNumber = null;
  let targetUid = null;

  for (const col of targetCols) {
    try {
      const ref = doc(db, col, docId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        if (!data.receiptNumber && !payload.receiptNumber) {
          payload.receiptNumber = defaultReceiptNo;
        } else if (data.receiptNumber && !payload.receiptNumber) {
          payload.receiptNumber = data.receiptNumber;
        }
        receiptNumber = payload.receiptNumber;
        targetUid = data.uid || data.applicantUid || data.payerUid || targetUid;
        await updateDoc(ref, payload);
        updated = true;
      }
    } catch (err) {
      console.warn(`Update attempt on ${col}/${docId}:`, err);
    }
  }

  // Update target user document if found
  if (targetUid) {
    try {
      const uRef = doc(db, 'users', targetUid);
      await setDoc(uRef, {
        feeReceiptSent: true,
        receiptNumber: receiptNumber || defaultReceiptNo,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {}
  }

  // Also update browser localStorage if current user or applicant matches
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('rsssst_my_membership_app');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.id === docId) {
          parsed.receiptSent = true;
          parsed.receiptNumber = receiptNumber || defaultReceiptNo;
          localStorage.setItem('rsssst_my_membership_app', JSON.stringify(parsed));
        }
      }
    } catch (e) {}
  }

  return { success: true, receiptNumber: receiptNumber || defaultReceiptNo };
};

