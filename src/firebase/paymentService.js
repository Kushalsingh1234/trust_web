import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from './config';

/**
 * Rashtriya Sanatan Sanskar Seva Sansthan (Trust)
 * Central Payment & UPI Settings Service
 */

export const DEFAULT_PAYMENT_SETTINGS = {
  qrImageUrl: '/payment-qr.png',
  upiId: 'boim-135883270012@boi',
  payeeName: 'Rashtriya Sanatan Sanskar Seva Sansthan (Trust)',
  membershipFee: 200,
  bankName: 'Bank of India',
  accountNumber: '135820110000012',
  ifsc: 'BKID0001358',
  branch: 'Gorakhpur Main Branch, UP',
  section80G: ''
};

/**
 * Get current payment settings from settings/payment with default fallback
 */
export const getPaymentSettings = async () => {
  try {
    const docRef = doc(db, 'settings', 'payment');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_PAYMENT_SETTINGS, ...snap.data() };
    }
    return DEFAULT_PAYMENT_SETTINGS;
  } catch (err) {
    console.warn("Could not fetch settings/payment, using defaults:", err);
    return DEFAULT_PAYMENT_SETTINGS;
  }
};

/**
 * Realtime listener for settings/payment
 */
export const subscribePaymentSettings = (callback) => {
  const docRef = doc(db, 'settings', 'payment');
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback({ ...DEFAULT_PAYMENT_SETTINGS, ...snap.data() });
    } else {
      callback(DEFAULT_PAYMENT_SETTINGS);
    }
  }, (err) => {
    console.warn("Realtime settings/payment listener warning:", err);
    callback(DEFAULT_PAYMENT_SETTINGS);
  });
};

/**
 * Update payment settings (Admin only)
 */
export const updatePaymentSettings = async (settingsData) => {
  const docRef = doc(db, 'settings', 'payment');
  const payload = {
    qrImageUrl: settingsData.qrImageUrl || DEFAULT_PAYMENT_SETTINGS.qrImageUrl,
    upiId: (settingsData.upiId || DEFAULT_PAYMENT_SETTINGS.upiId).trim(),
    payeeName: (settingsData.payeeName || DEFAULT_PAYMENT_SETTINGS.payeeName).trim(),
    membershipFee: Number(settingsData.membershipFee) || 200,
    bankName: settingsData.bankName || DEFAULT_PAYMENT_SETTINGS.bankName,
    accountNumber: settingsData.accountNumber || DEFAULT_PAYMENT_SETTINGS.accountNumber,
    ifsc: settingsData.ifsc || DEFAULT_PAYMENT_SETTINGS.ifsc,
    branch: settingsData.branch || DEFAULT_PAYMENT_SETTINGS.branch,
    section80G: settingsData.section80G ? settingsData.section80G.trim() : '',
    updatedAt: serverTimestamp()
  };
  await setDoc(docRef, payload, { merge: true });
  return payload;
};

/**
 * Check if a payment ID / UTR is already in use
 */
export const checkPaymentIdUnique = async (paymentId) => {
  if (!paymentId) return false;
  const cleanId = paymentId.trim().toUpperCase();
  const docRef = doc(db, 'paymentIds', cleanId);
  const snap = await getDoc(docRef);
  return !snap.exists();
};

/**
 * Submit Donation with duplicate Payment ID prevention
 * Supports active 'payments' collection and mirrors to 'donations'
 */
export const submitDonationWithPaymentId = async ({
  donorName,
  donorPhone,
  claimedAmount,
  purpose,
  paymentId,
  paymentDate,
  uid,
  paymentProofType = 'utr',
  paymentScreenshotUrl = null
}) => {
  const cleanPaymentId = paymentId ? paymentId.trim().toUpperCase() : (paymentScreenshotUrl ? `PROOF-${Date.now()}` : 'UPI-DONATION');

  // Duplicate check across payments if paymentId is given
  if (paymentId) {
    try {
      const qPayments = query(collection(db, 'payments'), where('paymentId', '==', cleanPaymentId));
      const snap = await getDocs(qPayments);
      if (!snap.empty) {
        const err = new Error("This Payment ID was already used");
        err.code = "payment-id-duplicate";
        throw err;
      }
    } catch (err) {
      if (err.code === 'payment-id-duplicate') throw err;
    }
  }

  const donationData = {
    uid: uid || null,
    payerUid: uid || null,
    donorName: donorName.trim(),
    donorPhone: donorPhone.trim(),
    claimedAmount: Number(claimedAmount),
    amount: Number(claimedAmount),
    purpose: purpose || 'samarpan',
    paymentId: cleanPaymentId,
    utrNumber: cleanPaymentId,
    paymentProofType: paymentProofType || 'utr',
    paymentScreenshotUrl: paymentScreenshotUrl || null,
    paymentMethod: 'UPI',
    paymentDate: paymentDate || null,
    status: 'pending',
    verificationStatus: 'pending_verification',
    adminNote: '',
    createdAt: serverTimestamp(),
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  // Primary: save to payments collection
  const newPaymentRef = doc(collection(db, 'payments'));
  await setDoc(newPaymentRef, donationData);

  // Secondary: mirror to donations and paymentIds
  try {
    const donationRef = doc(db, 'donations', newPaymentRef.id);
    await setDoc(donationRef, donationData);
  } catch (e) {}

  try {
    const paymentIdRef = doc(db, 'paymentIds', cleanPaymentId);
    await setDoc(paymentIdRef, {
      uid: uid || null,
      claimedAmount: Number(claimedAmount),
      purpose: purpose || 'samarpan',
      entityType: 'donation',
      createdAt: serverTimestamp()
    });
  } catch (e) {}

  return { id: newPaymentRef.id, paymentId: cleanPaymentId };
};

/**
 * Admin: Approve Donation and issue sequential Receipt Number
 */
export const approveDonationPayment = async (donationId, verifiedAmount, adminNote, adminUid) => {
  const numVerified = Number(verifiedAmount);
  if (isNaN(numVerified) || numVerified <= 0) {
    throw new Error("Please enter a valid positive numeric verified amount.");
  }

  const currentYear = new Date().getFullYear();
  let nextSeq = Date.now() % 8000 + 1001;

  try {
    const counterRef = doc(db, 'counters', 'receipts');
    const counterSnap = await getDoc(counterRef);
    if (counterSnap.exists() && counterSnap.data().seq) {
      nextSeq = counterSnap.data().seq + 1;
    }
    await setDoc(counterRef, { seq: nextSeq, year: currentYear }, { merge: true });
  } catch (e) {}

  const receiptNumber = `RCPT-${currentYear}-${String(nextSeq).padStart(4, '0')}`;

  const approvalPayload = {
    status: 'approved',
    verificationStatus: 'verified',
    verifiedAmount: numVerified,
    amount: numVerified,
    receiptNumber,
    approvedBy: adminUid || 'admin',
    approvedAt: serverTimestamp(),
    adminNote: adminNote ? adminNote.trim() : '',
    updatedAt: serverTimestamp()
  };

  // Update in payments
  try {
    await updateDoc(doc(db, 'payments', donationId), approvalPayload);
  } catch (e) {}

  // Update in donations
  try {
    await updateDoc(doc(db, 'donations', donationId), approvalPayload);
  } catch (e) {}

  // Create receipt record in receipts
  try {
    await setDoc(doc(db, 'receipts', receiptNumber), {
      ...approvalPayload,
      receiptNumber,
      donationId,
      createdAt: serverTimestamp()
    });
  } catch (e) {}

  return { receiptNumber, verifiedAmount: numVerified };
};

/**
 * Admin: Reject Donation
 */
export const rejectDonationPayment = async (donationId, reason, adminUid) => {
  const payload = {
    status: 'rejected',
    verificationStatus: 'rejected',
    rejectionReason: reason || 'UTR or payment could not be matched with trust bank statement.',
    reviewedBy: adminUid || 'admin',
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    await updateDoc(doc(db, 'payments', donationId), payload);
  } catch (e) {}

  try {
    await updateDoc(doc(db, 'donations', donationId), payload);
  } catch (e) {}
};

