import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import TrustLogo from '../components/TrustLogo';

const AuthContext = createContext(null);

// Standard internal auth email generator for username-based accounts
export const formatAuthEmail = (identifier) => {
  if (!identifier) return '';
  const trimmed = identifier.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  // Sanitize: allow letters, numbers, underscores
  const cleanUsername = trimmed.replace(/[^a-z0-9_]/g, '');
  return `${cleanUsername}@trust-app.local`;
};

// Default secure Admin Passkey / PIN for Gorakhpur Trust administration
export const TRUST_ADMIN_PIN = "273016";

export const AuthProvider = ({ children }) => {
  // Restore user & profile immediately from localStorage to prevent flicker and keep session persistent
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('rsssst_auth_user');
        return cached ? JSON.parse(cached) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [userProfile, setUserProfile] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('rsssst_user_profile');
        return cached ? JSON.parse(cached) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [isAdmin, setIsAdmin] = useState(false);

  const [loading, setLoading] = useState(true);
  const [adminPinVerified, setAdminPinVerified] = useState(() => {
    return (
      typeof window !== 'undefined' &&
      sessionStorage.getItem('rsssst_admin_pin_verified') === 'true'
    );
  });

  // Verify Admin PIN for current session (grants access to admin panel only)
  const verifyPinForSession = async (pin) => {
    if (pin && pin.trim() === TRUST_ADMIN_PIN) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('rsssst_admin_pin_verified', 'true');
        localStorage.removeItem('rsssst_admin_pin_verified');
      }
      setAdminPinVerified(true);
      return true;
    }
    return false;
  };

  // Clear admin session passkey verification
  const clearAdminSession = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('rsssst_admin_pin_verified');
      localStorage.removeItem('rsssst_admin_pin_verified');
    }
    setAdminPinVerified(false);
  };

  // Fetch full user profile from Firestore at users/{uid}
  const fetchUserProfile = async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        // Members and registered users are never admin
        if (data.role === 'admin') {
          data.role = 'user';
          try {
            updateDoc(userRef, { role: 'user', updatedAt: serverTimestamp() }).catch(() => {});
          } catch (e) {}
        }
        setUserProfile(data);
        setIsAdmin(false);
        if (typeof window !== 'undefined') {
          localStorage.setItem('rsssst_user_profile', JSON.stringify(data));
        }
        return data;
      } else {
        // Fallback profile if user document does not exist yet
        const basicProfile = {
          uid,
          role: 'user',
          fullName: auth.currentUser?.displayName || 'User',
          username: auth.currentUser?.email?.split('@')[0] || 'user'
        };
        setUserProfile(basicProfile);
        setIsAdmin(false);
        if (typeof window !== 'undefined') {
          localStorage.setItem('rsssst_user_profile', JSON.stringify(basicProfile));
        }
        return basicProfile;
      }
    } catch (err) {
      console.warn("Could not fetch user profile from Firestore:", err);
      // Fallback to cached profile if available in localStorage
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('rsssst_user_profile');
        if (cached) {
          try {
            const data = JSON.parse(cached);
            setUserProfile(data);
            setIsAdmin(data.role === 'admin');
            return data;
          } catch (e) {}
        }
      }
      return null;
    }
  };

  // Check if a username is already taken in Firestore
  const checkUsernameAvailable = async (username) => {
    if (!username) return false;
    const cleanUsername = username.trim().toLowerCase();

    try {
      // 1. Check reservation doc
      const usernameDocRef = doc(db, 'usernames', cleanUsername);
      const usernameSnap = await getDoc(usernameDocRef);
      if (usernameSnap.exists()) {
        return false;
      }

      // 2. Query users collection
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', cleanUsername));
      const querySnap = await getDocs(q);
      return querySnap.empty;
    } catch (err) {
      console.warn("Username availability check warning:", err);
      return true; // Let Firebase Auth email conflict handle it if offline
    }
  };

  // Sign-Up with Username + Password
  const registerWithUsername = async ({ fullName, username, phone, password, email }) => {
    const cleanUsername = username.trim().toLowerCase();
    
    // 1. Enforce unique username check in Firestore
    const isAvailable = await checkUsernameAvailable(cleanUsername);
    if (!isAvailable) {
      const err = new Error("यह यूज़रनेम पहले से किसी अन्य सदस्य द्वारा उपयोग में है। कृपया दूसरा चुनें।");
      err.code = "auth/username-already-in-use";
      throw err;
    }

    // 2. Convert username into internal email: username@trust-app.local
    const internalEmail = `${cleanUsername}@trust-app.local`;

    // Ensure persistent login across browser sessions
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (e) {}

    // 3. Create Auth user with Firebase Email/Password
    const userCredential = await createUserWithEmailAndPassword(auth, internalEmail, password);
    const user = userCredential.user;

    // 4. Store user profile in Firestore at users/{uid} with role: "user"
    const profile = {
      uid: user.uid,
      username: cleanUsername,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email && email.trim() ? email.trim().toLowerCase() : null,
      role: 'user', // strictly 'user' as requested
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'users', user.uid), profile);
      // Also reserve username index
      await setDoc(doc(db, 'usernames', cleanUsername), {
        uid: user.uid,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to write user profile to Firestore:", err);
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('rsssst_auth_user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      }));
      localStorage.setItem('rsssst_user_profile', JSON.stringify(profile));
      localStorage.removeItem('rsssst_admin_pin_verified');
      sessionStorage.removeItem('rsssst_admin_pin_verified');
      localStorage.removeItem('rsssst_my_membership_app');
      localStorage.removeItem('rsssst_my_volunteer_app');
      localStorage.removeItem('rsssst_my_app_ids');
      localStorage.removeItem('rsssst_last_app_mobile');
    }

    setCurrentUser(user);
    setUserProfile(profile);
    setIsAdmin(false);
    setAdminPinVerified(false);
    return user;
  };

  // Login with Username + Password
  const loginWithUsername = async (identifier, password) => {
    const raw = identifier.trim();
    let authEmail = formatAuthEmail(raw);

    // If identifier is not an email and not containing @, try checking if they entered real email
    if (raw.includes('@') && !raw.endsWith('@trust-app.local')) {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', raw.toLowerCase()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const matchedUser = snap.docs[0].data();
          if (matchedUser.username) {
            authEmail = `${matchedUser.username}@trust-app.local`;
          }
        }
      } catch (e) {
        // fallback to standard email
      }
    }

    // Ensure persistent login across browser sessions
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (e) {}

    const userCredential = await signInWithEmailAndPassword(auth, authEmail, password);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rsssst_my_membership_app');
      localStorage.removeItem('rsssst_my_volunteer_app');
      localStorage.setItem('rsssst_auth_user', JSON.stringify({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName
      }));
    }
    setCurrentUser(userCredential.user);
    const profile = await fetchUserProfile(userCredential.user.uid);
    const userIsAdmin = profile?.role === 'admin';
    setIsAdmin(userIsAdmin);
    if (!userIsAdmin) {
      setAdminPinVerified(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('rsssst_admin_pin_verified');
        sessionStorage.removeItem('rsssst_admin_pin_verified');
      }
    }
    return { user: userCredential.user, profile };
  };

  // Logout
  const logout = async () => {
    const prevUid = currentUser?.uid;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rsssst_auth_user');
      localStorage.removeItem('rsssst_user_profile');
      localStorage.removeItem('rsssst_admin_pin_verified');
      sessionStorage.removeItem('rsssst_admin_pin_verified');
      localStorage.removeItem('rsssst_my_membership_app');
      localStorage.removeItem('rsssst_my_volunteer_app');
      localStorage.removeItem('rsssst_my_app_ids');
      localStorage.removeItem('rsssst_last_app_mobile');
      localStorage.removeItem('rsssst_my_payment_ids');
      localStorage.removeItem('rsssst_my_help_ids');
      if (prevUid) {
        localStorage.removeItem(`rsssst_my_membership_app_${prevUid}`);
        localStorage.removeItem(`rsssst_my_volunteer_app_${prevUid}`);
        localStorage.removeItem(`rsssst_my_app_ids_${prevUid}`);
      }
    }
    setAdminPinVerified(false);
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
    setIsAdmin(false);
  };

  // One-time cleanup of legacy un-scoped keys
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rsssst_my_membership_app');
      localStorage.removeItem('rsssst_my_volunteer_app');
      localStorage.removeItem('rsssst_my_app_ids');
      localStorage.removeItem('rsssst_last_app_mobile');
      localStorage.removeItem('rsssst_my_payment_ids');
      localStorage.removeItem('rsssst_my_help_ids');
    }
  }, []);

  // Refresh user data helper
  const refreshUserData = async () => {
    if (currentUser) {
      await fetchUserProfile(currentUser.uid);
    }
  };

  // Listen for auth state changes & realtime user profile sync
  useEffect(() => {
    let profileUnsub = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('rsssst_auth_user', JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
          }));
        }
        if (profileUnsub) {
          profileUnsub();
          profileUnsub = null;
        }

        await fetchUserProfile(user.uid);
        try {
          profileUnsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setUserProfile(data);
              if (typeof window !== 'undefined') {
                localStorage.setItem('rsssst_user_profile', JSON.stringify(data));
              }
              if (data.role === 'admin') {
                setIsAdmin(true);
              }
            }
          }, (err) => {
            console.warn("User profile realtime sync warning:", err);
          });
        } catch (e) {
          console.warn("Could not attach profile listener:", e);
        }
      } else {
        // If not explicit logout, check if session is still in localStorage
        const hasCachedUser = typeof window !== 'undefined' && localStorage.getItem('rsssst_auth_user');
        if (!hasCachedUser) {
          setCurrentUser(null);
          setUserProfile(null);
        }
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => {
      if (profileUnsub) profileUnsub();
      unsubscribe();
    };
  }, []);

  // Loading Screen while Firebase Auth initializes (No UI Flicker)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8EF] flex flex-col items-center justify-center p-4">
        <div className="relative">
          <TrustLogo className="w-20 h-20 animate-pulse" showText={false} lang="hi" />
        </div>
        <p className="mt-4 font-hindi-heading font-black text-sm text-[#382719] tracking-wide animate-pulse">
          सनातन संस्कार सेवा संस्थान...
        </p>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin: adminPinVerified,
        adminPinVerified,
        verifyPinForSession,
        clearAdminSession,
        TRUST_ADMIN_PIN,
        loading,
        registerWithUsername,
        loginWithUsername,
        logout,
        checkUsernameAvailable,
        refreshUserData
      }}
    >
      {children}
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

export default AuthContext;
