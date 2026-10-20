import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

// Format username to standard internal auth domain (avoids exposing emails or needing Google sign-in)
export const formatAuthEmail = (identifier) => {
  if (!identifier) return '';
  const trimmed = identifier.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  // Remove non-alphanumeric except underscores and dashes
  const cleanUsername = trimmed.replace(/[^a-z0-9_-]/g, '');
  return `${cleanUsername}@rsssst.trust`;
};

// Default secure Admin PIN (can also be checked against trust master record)
export const TRUST_ADMIN_PIN = "273016"; // Gorakhpur Trust PIN

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [memberRecord, setMemberRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPinVerified, setAdminPinVerified] = useState(() => {
    return localStorage.getItem('rsssst_admin_pin_verified') === 'true' ||
           sessionStorage.getItem('rsssst_admin_pin_verified') === 'true';
  });

  // Fetch full user profile & member record from Firestore
  const fetchUserData = async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setUserProfile(data);
        setIsAdmin(data.role === 'admin');

        // Check if user is an approved member in 'members' collection
        const membersRef = collection(db, 'members');
        const q = query(membersRef, where('userUid', '==', uid));
        const memberSnap = await getDocs(q);
        if (!memberSnap.empty) {
          setMemberRecord({ id: memberSnap.docs[0].id, ...memberSnap.docs[0].data() });
        } else {
          setMemberRecord(null);
        }
      } else {
        setUserProfile(null);
        setIsAdmin(false);
        setMemberRecord(null);
      }
    } catch (err) {
      console.warn("Could not fetch user profile from Firestore:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserData(user.uid);
      } else {
        setUserProfile(null);
        setIsAdmin(false);
        setMemberRecord(null);
        setAdminPinVerified(false);
        localStorage.removeItem('rsssst_admin_pin_verified');
        sessionStorage.removeItem('rsssst_admin_pin_verified');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Username & Password Registration
  const registerWithUsername = async (username, password, extraData = {}) => {
    const formattedEmail = formatAuthEmail(username);
    const userCredential = await createUserWithEmailAndPassword(auth, formattedEmail, password);
    const user = userCredential.user;

    const profile = {
      uid: user.uid,
      username: username.trim().toLowerCase(),
      displayName: extraData.fullName || username.trim(),
      mobile: extraData.mobile || '',
      role: 'member', // ordinary registrations are strictly members
      accountStatus: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, 'users', user.uid), profile);
    setUserProfile(profile);
    return user;
  };

  // Username & Password Login
  const loginWithUsername = async (identifier, password) => {
    const formattedEmail = formatAuthEmail(identifier);
    const userCredential = await signInWithEmailAndPassword(auth, formattedEmail, password);
    await fetchUserData(userCredential.user.uid);
    return userCredential.user;
  };

  // Secure Admin Login requiring Username, Password, and PIN
  const loginAdmin = async (identifier, password, pin) => {
    const user = await loginWithUsername(identifier, password);
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists() || userSnap.data().role !== 'admin') {
      await signOut(auth);
      throw new Error("अनधिकृत पहुंच: यह खाता ट्रस्ट व्यवस्थापक (Admin) नहीं है।");
    }

    if (pin.trim() !== TRUST_ADMIN_PIN) {
      await signOut(auth);
      throw new Error("अमान्य सुरक्षा पिन (Invalid Security PIN). कृपया सही एडमिन पिन दर्ज करें।");
    }

    setAdminPinVerified(true);
    localStorage.setItem('rsssst_admin_pin_verified', 'true');
    sessionStorage.setItem('rsssst_admin_pin_verified', 'true');
    return user;
  };

  const verifyPinForSession = (pin) => {
    if (pin.trim() === TRUST_ADMIN_PIN) {
      setAdminPinVerified(true);
      localStorage.setItem('rsssst_admin_pin_verified', 'true');
      sessionStorage.setItem('rsssst_admin_pin_verified', 'true');
      return true;
    }
    return false;
  };

  const logout = async () => {
    setAdminPinVerified(false);
    localStorage.removeItem('rsssst_admin_pin_verified');
    sessionStorage.removeItem('rsssst_admin_pin_verified');
    await signOut(auth);
  };

  const resetPassword = async (identifier) => {
    const formattedEmail = formatAuthEmail(identifier);
    return sendPasswordResetEmail(auth, formattedEmail);
  };

  // Refresh user data helper (called after profile updates or admin approvals)
  const refreshUserData = async () => {
    if (currentUser) {
      await fetchUserData(currentUser.uid);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        memberRecord,
        isAdmin,
        adminPinVerified,
        loading,
        registerWithUsername,
        loginWithUsername,
        loginAdmin,
        verifyPinForSession,
        logout,
        resetPassword,
        refreshUserData
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
