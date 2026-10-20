import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
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
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminPinVerified, setAdminPinVerified] = useState(() => {
    return (
      typeof window !== 'undefined' && (
        localStorage.getItem('rsssst_admin_pin_verified') === 'true' ||
        sessionStorage.getItem('rsssst_admin_pin_verified') === 'true'
      )
    );
  });

  // Verify Admin PIN for current session
  const verifyPinForSession = async (pin) => {
    if (pin && pin.trim() === TRUST_ADMIN_PIN) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('rsssst_admin_pin_verified', 'true');
        localStorage.setItem('rsssst_admin_pin_verified', 'true');
      }
      setAdminPinVerified(true);
      setIsAdmin(true);

      // If no Firebase Auth user is signed in (e.g. Incognito or direct /admin visit),
      // authenticate an official administrative session so Firestore security rules succeed
      if (!auth.currentUser) {
        try {
          const cred = await signInWithEmailAndPassword(auth, 'admin@trust-app.local', 'TrustAdmin@273016');
          setCurrentUser(cred.user);
          await fetchUserProfile(cred.user.uid);
        } catch (err) {
          if (
            err.code === 'auth/user-not-found' ||
            err.code === 'auth/invalid-credential' ||
            err.code === 'auth/invalid-login-credentials'
          ) {
            try {
              const cred = await createUserWithEmailAndPassword(auth, 'admin@trust-app.local', 'TrustAdmin@273016');
              const adminProf = {
                uid: cred.user.uid,
                username: 'admin',
                fullName: 'व्यवस्थापक (Trust Admin)',
                role: 'admin',
                accountStatus: 'active',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              };
              try {
                await setDoc(doc(db, 'users', cred.user.uid), adminProf, { merge: true });
              } catch (e) {}
              setCurrentUser(cred.user);
              setUserProfile(adminProf);
            } catch (createErr) {
              console.warn("Could not create admin auth user:", createErr);
            }
          }
        }
      } else if (currentUser?.uid) {
        // If user is currently logged in, promote their role in Firestore
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          await setDoc(userRef, { role: 'admin', updatedAt: serverTimestamp() }, { merge: true });
          setUserProfile(prev => ({ ...prev, role: 'admin' }));
        } catch (e) {
          console.warn("Could not promote role in Firestore:", e);
        }
      }
      return true;
    }
    return false;
  };

  // Fetch full user profile from Firestore at users/{uid}
  const fetchUserProfile = async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setUserProfile(data);
        setIsAdmin(data.role === 'admin');
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
        return basicProfile;
      }
    } catch (err) {
      console.warn("Could not fetch user profile from Firestore:", err);
      setUserProfile(null);
      setIsAdmin(false);
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

    setUserProfile(profile);
    setIsAdmin(false);
    return user;
  };

  // Login with Username + Password
  const loginWithUsername = async (identifier, password) => {
    const raw = identifier.trim();
    let authEmail = formatAuthEmail(raw);

    // If identifier is not an email and not containing @, try checking if they entered real email
    if (raw.includes('@') && !raw.endsWith('@trust-app.local')) {
      // Find user by real email if registered
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

    const userCredential = await signInWithEmailAndPassword(auth, authEmail, password);
    const profile = await fetchUserProfile(userCredential.user.uid);
    return { user: userCredential.user, profile };
  };

  // Logout
  const logout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rsssst_admin_pin_verified');
      sessionStorage.removeItem('rsssst_admin_pin_verified');
    }
    setAdminPinVerified(false);
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
    setIsAdmin(false);
  };

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
      setCurrentUser(user);
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (user) {
        await fetchUserProfile(user.uid);
        try {
          profileUnsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setUserProfile(data);
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
        setUserProfile(null);
        if (
          typeof window !== 'undefined' && (
            sessionStorage.getItem('rsssst_admin_pin_verified') === 'true' ||
            localStorage.getItem('rsssst_admin_pin_verified') === 'true'
          )
        ) {
          setIsAdmin(true);
          try {
            signInWithEmailAndPassword(auth, 'admin@trust-app.local', 'TrustAdmin@273016').catch(() => {});
          } catch (e) {}
        } else {
          setIsAdmin(false);
        }
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
        isAdmin: isAdmin || adminPinVerified || userProfile?.role === 'admin',
        adminPinVerified,
        verifyPinForSession,
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
