import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from './config';
import { formatAuthEmail, TRUST_ADMIN_PIN } from '../context/AuthContext';

// Master Trust Security Setup Key for Initial Administrator Provisioning
// Can only be used during administrative initialization
export const ADMIN_SETUP_SECRET = "RSSSST_GORAKHPUR_ADMIN_2026";

/**
 * Controlled Administrator Account Provisioning Procedure
 * Allows the Trust Executive to create or promote an administrative account
 * using the authorized master secret key.
 */
export const initializeMasterAdmin = async ({
  username,
  password,
  displayName,
  mobile,
  adminPin,
  setupSecret
}) => {
  if (setupSecret !== ADMIN_SETUP_SECRET) {
    throw new Error("अमान्य व्यवस्थापक सेटअप की (Invalid Admin Setup Secret Key).");
  }

  if (adminPin !== TRUST_ADMIN_PIN) {
    throw new Error("अमान्य सुरक्षा पिन (Admin PIN does not match Trust Security Standard).");
  }

  const formattedEmail = formatAuthEmail(username);

  let user;
  try {
    // Attempt login if user already exists
    const userCredential = await signInWithEmailAndPassword(auth, formattedEmail, password);
    user = userCredential.user;
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      // Create user if not present
      const userCredential = await createUserWithEmailAndPassword(auth, formattedEmail, password);
      user = userCredential.user;
    } else {
      throw err;
    }
  }

  // Grant official admin role in Firestore
  const adminProfile = {
    uid: user.uid,
    username: username.trim().toLowerCase(),
    displayName: displayName || "ट्रस्ट व्यवस्थापक (Gorakhpur Head Office)",
    mobile: mobile || "9794590044",
    role: "admin", // Privileged role
    accountStatus: "active",
    adminPinConfigured: true,
    updatedAt: serverTimestamp()
  };

  await setDoc(doc(db, 'users', user.uid), adminProfile, { merge: true });
  return { success: true, uid: user.uid, username: username.trim() };
};
