import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';
import { UserProfile, RoleType } from '../types';
import { TRANSLATIONS } from '../config/categories';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  language: 'en' | 'bn';
  setLanguage: (lang: 'en' | 'bn') => void;
  t: typeof TRANSLATIONS.en;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    pass: string,
    fullName: string,
    username: string,
    roles?: RoleType[]
  ) => Promise<void>;
  signOutUser: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguageState] = useState<'en' | 'bn'>('en');

  // Load language preference from local storage or profile
  const setLanguage = async (lang: 'en' | 'bn') => {
    setLanguageState(lang);
    localStorage.setItem('findx_language', lang);
    if (user && profile) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { preferredLanguage: lang });
        setProfile((prev) => (prev ? { ...prev, preferredLanguage: lang } : null));
      } catch (e) {
        console.error('Error saving language preference:', e);
      }
    }
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('findx_language') as 'en' | 'bn';
    if (savedLang === 'en' || savedLang === 'bn') {
      setLanguageState(savedLang);
    }
  }, []);

  const fetchOrCreateProfile = async (firebaseUser: User, extra?: { fullName?: string; username?: string; roles?: RoleType[] }): Promise<UserProfile> => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      if (data.preferredLanguage) {
        setLanguageState(data.preferredLanguage);
      }
      return data;
    }

    // Default username generation from email/name
    const generatedUsername =
      extra?.username ||
      (firebaseUser.email
        ? firebaseUser.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()
        : `user_${firebaseUser.uid.slice(0, 6)}`);

    const newProfile: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      username: generatedUsername,
      fullName: extra?.fullName || firebaseUser.displayName || 'FindX User',
      bio: '',
      photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${generatedUsername}`,
      coverURL: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80',
      location: 'Dhaka, Bangladesh',
      roles: extra?.roles && extra.roles.length > 0 ? extra.roles : ['personal'],
      verifications: {
        emailVerified: firebaseUser.emailVerified || false,
        phoneVerified: false,
        businessVerified: false,
        identityVerified: false,
        professionalVerified: false,
      },
      privacy: {
        showPhone: true,
        showEmail: false,
        showLocation: true,
        allowMessages: true,
        allowFollowers: true,
      },
      followersCount: 0,
      followingCount: 0,
      isAdmin: firebaseUser.email === 'admin@findx.com' || firebaseUser.email === 'jackrbaltzell@gmail.com',
      preferredLanguage: language,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(userRef, newProfile);
    return newProfile;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userProf = await fetchOrCreateProfile(currentUser);
          setProfile(userProf);
        } catch (err) {
          console.error('Failed to load user profile from Firestore:', err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userProf = await fetchOrCreateProfile(result.user);
      setProfile(userProf);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      const userProf = await fetchOrCreateProfile(result.user);
      setProfile(userProf);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    fullName: string,
    username: string,
    roles?: RoleType[]
  ) => {
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      const userProf = await fetchOrCreateProfile(result.user, { fullName, username, roles });
      setProfile(userProf);
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const updated = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await updateDoc(userRef, updated);
    setProfile((prev) => (prev ? { ...prev, ...updated } : null));
  };

  const t = TRANSLATIONS[language];
  const isAdmin = Boolean(profile?.isAdmin);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        language,
        setLanguage,
        t,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOutUser,
        updateProfileData,
        isAdmin,
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
