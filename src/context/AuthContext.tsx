'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { AppUser, Company } from '@/types';
import nookies from 'nookies';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface StartVerificationResponse {
  success: boolean;
  transactionId: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  companies: Company[];
  updateUserProfile: (data: Partial<AppUser>) => Promise<void>;
  verifyPhone: () => Promise<StartVerificationResponse>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  verifyCurrentPassword: (password: string) => Promise<boolean>;
  updateCompany: (companyId: string, data: Partial<Company>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  companies: [],
  updateUserProfile: async () => {},
  verifyPhone: async () => ({ success: false, transactionId: '' }),
  changePassword: async () => {},
  verifyCurrentPassword: async () => { return false; },
  updateCompany: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const router = useRouter();

  const fetchCompanies = async (companyIds: { id: string, role: string }[]) => {
    try {
      console.log("=== fetchCompanies START ===");
      console.log("Input companyIds:", JSON.stringify(companyIds, null, 2));
      const ids = companyIds.map(c => c.id);
      console.log("Extracted IDs:", ids);
      
      const companiesRef = collection(db, 'companies');
      console.log("Created companies reference");
      
      // Fetch each company document by its ID
      const companiesData: Company[] = [];
      for (const companyId of ids) {
        console.log(`Fetching company with ID: ${companyId}`);
        const companyDoc = await getDoc(doc(db, 'companies', companyId));
        if (companyDoc.exists()) {
          const data = companyDoc.data();
          console.log(`Found company:`, data);
          companiesData.push({
            ...data,
            id: companyDoc.id
          } as Company);
        } else {
          console.log(`No company found with ID: ${companyId}`);
        }
      }
      
      console.log("Final companies data:", JSON.stringify(companiesData, null, 2));
      console.log("=== fetchCompanies END ===");
      return companiesData;
    } catch (error) {
      console.error("=== fetchCompanies ERROR ===");
      console.error("Error details:", error);
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      return [];
    }
  };

  useEffect(() => {
    console.log("=== AuthProvider useEffect START ===");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        console.log("Auth state changed. User:", firebaseUser?.email);
        
        if (firebaseUser) {
          // Set the session token
          console.log("Getting ID token...");
          const token = await firebaseUser.getIdToken();
          nookies.set(undefined, 'session', token, { 
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
          });
          console.log("Session token set");

          console.log("Getting user document for:", firebaseUser.uid);
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            console.log("User document found:", userDoc.id);
            console.log("User data:", JSON.stringify(userDoc.data(), null, 2));
            
            const userData = userDoc.data();
            const userInfo: AppUser = {
              uid: firebaseUser.uid,
              clientId: userData.clientId || '',
              company_id: userData.company_id || [],
              contact: userData.contact || '',
              createdAt: userData.createdAt || new Date().toISOString(),
              email: firebaseUser.email || '',
              name: userData.name || '',
              role: userData.role || 'client',
            };
            
            console.log("Processed user info:", JSON.stringify(userInfo, null, 2));
            setUser(userInfo);
            
            if (userInfo.company_id && userInfo.company_id.length > 0) {
              console.log("Found company_id in user data:", JSON.stringify(userInfo.company_id, null, 2));
              const companiesData = await fetchCompanies(userInfo.company_id);
              console.log("Setting companies:", JSON.stringify(companiesData, null, 2));
              setCompanies(companiesData);
            } else {
              console.log("No company_id found in user data");
            }
          } else {
            console.log("No user document found for:", firebaseUser.uid);
          }
        } else {
          console.log("No user signed in");
          setUser(null);
          setCompanies([]);
        }
      } catch (error) {
        console.error("=== Auth Effect ERROR ===");
        console.error("Error details:", error);
        if (error instanceof Error) {
          console.error("Error name:", error.name);
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }
        setUser(null);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      console.log("=== Cleanup: Unsubscribing from auth state ===");
      unsubscribe();
    };
  }, []);

  const updateUserProfile = async (data: Partial<AppUser>) => {
    if (!user?.uid) throw new Error('No user authenticated');
    
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, data);
    
    // Update local state
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  const verifyPhone = async (): Promise<StartVerificationResponse> => {
    return { success: false, transactionId: '' };
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    // Implementar cambio de contraseña
    console.log('Cambiando contraseña');
  };

  const verifyCurrentPassword = async (password: string): Promise<boolean> => {
    console.log('🔐 Iniciando verifyCurrentPassword');
    if (!user?.email) {
      console.error('❌ No hay usuario autenticado');
      throw new Error('No hay usuario autenticado');
    }

    try {
      console.log('📧 Creando credencial para:', user.email);
      const credential = EmailAuthProvider.credential(user.email, password);
      console.log('🔄 Reautenticando usuario...');
      await reauthenticateWithCredential(auth.currentUser!, credential);
      console.log('✅ Contraseña verificada correctamente');
      return true;
    } catch (error: any) {
      console.log('❌ Error en verifyCurrentPassword:', error.code, error.message);
      
      // Firebase auth error codes: https://firebase.google.com/docs/auth/admin/errors
      let errorMessage: string;
      switch (error.code) {
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
        case 'auth/invalid-password':
          errorMessage = 'La contraseña es incorrecta';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos fallidos. Por favor, inténtalo más tarde';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Tu cuenta ha sido deshabilitada';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Usuario no encontrado';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El correo electrónico no es válido';
          break;
        default:
          console.error('Código de error no manejado:', error.code);
          errorMessage = 'Error al verificar la contraseña';
      }
      
      const newError = new Error(errorMessage);
      newError.name = 'AuthError';
      throw newError;
    }
  };

  const updateCompany = async (companyId: string, data: Partial<Company>) => {
    if (!user?.uid) throw new Error('No user authenticated');
    
    // Verificar si el usuario es admin de la empresa
    const userCompanyRole = user.company_id.find(c => c.id === companyId);
    if (!userCompanyRole || userCompanyRole.role !== 'admin') {
      throw new Error('No tienes permisos para editar esta empresa');
    }

    const companyRef = doc(db, 'companies', companyId);
    await updateDoc(companyRef, data);
    
    // Actualizar el estado local de las empresas
    setCompanies(prevCompanies => 
      prevCompanies.map(company => 
        company.id === companyId 
          ? { ...company, ...data }
          : company
      )
    );
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setCompanies([]);
      nookies.destroy(undefined, 'session');
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      logout,
      companies,
      updateUserProfile,
      verifyPhone,
      changePassword,
      verifyCurrentPassword,
      updateCompany
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
