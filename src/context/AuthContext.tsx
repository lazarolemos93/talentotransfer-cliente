'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { AppUser } from '@/types';
import nookies from 'nookies';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  company_id: number | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  company_id: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [company_id, setCompanyId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log('Firebase user authenticated:', firebaseUser.email);
          try {
            // Obtener el token y guardarlo en cookie
            const token = await firebaseUser.getIdToken();
            nookies.set(undefined, 'session', token, { 
              path: '/',
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax'
            });

            // Verificar el rol en Firestore
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              if (!userData.role || !userData.company_id) {
                console.error('User data missing required fields:', userData);
                setUser(null);
                return;
              }
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role: userData.role,
                company_id: userData.company_id,
                name: userData.name,
                avatar_url: userData.avatar_url,
              });
              
              // Establecer company_id como número
              if (userData.company_id) {
                setCompanyId(Number(userData.company_id));
              }
            }
          } catch (error) {
            console.error('Error getting user data:', error);
            setUser(null);
            setCompanyId(null);
          }
        } else {
          setUser(null);
          setCompanyId(null);
          nookies.destroy(undefined, 'session');
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setCompanyId(null);
      nookies.destroy(undefined, 'session');
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, company_id }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
