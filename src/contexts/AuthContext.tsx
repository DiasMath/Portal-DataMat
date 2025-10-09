'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  onAuthStateChanged,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
  signInWithEmailAndPassword,
  User
} from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  role: 'user' | 'admin' | 'master_admin';
  authorized: boolean;
  dashboardLink?: string;
  photoURL?: string;
  provider?: string;
  createdAt?: { seconds: number };
  updatedAt?: { seconds: number };
  lastLogin?: { seconds: number };
  companyId?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  setUserData: React.Dispatch<React.SetStateAction<UserData | null>>;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isMasterAdmin: boolean;
  isAuthorized: boolean;
  companyId?: string;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (user: User) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;
        setUserData(data);
        
        // Atualizar último login
        await updateDoc(doc(db, 'users', user.uid), {
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        // Usuário não existe no Firestore - não autorizado
        setUserData(null);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      setUserData(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await fetchUserData(user);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // O onAuthStateChanged cuidará de buscar os dados do usuário
    } catch (error) {
      console.error('Erro no login com Google:', error);
      throw error;
    }
  };

  const signInWithMicrosoft = async () => {
    try {
      const provider = new OAuthProvider('microsoft.com');
      await signInWithPopup(auth, provider);
      // O onAuthStateChanged cuidará de buscar os dados do usuário
    } catch (error) {
      console.error('Erro no login com Microsoft:', error);
      throw error;
    }
  };

  const signInWithGitHub = async () => {
    try {
      const provider = new OAuthProvider('github.com');
      await signInWithPopup(auth, provider);
      // O onAuthStateChanged cuidará de buscar os dados do usuário
    } catch (error) {
      console.error('Erro no login com GitHub:', error);
      throw error;
    }
  };

  const signInWithEmailPassword = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // O onAuthStateChanged cuidará de buscar os dados do usuário
    } catch (error: unknown) {
      console.error('Erro no login com email/senha:', error);
      
      // Melhor tratamento de erros específicos do Firebase Auth
      let errorMessage = 'Erro no login com email/senha.';
      
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string; message?: string };
        switch (firebaseError.code) {
          case 'auth/invalid-credential':
            errorMessage = 'Email ou senha incorretos. Verifique suas credenciais.';
            break;
          case 'auth/user-not-found':
            errorMessage = 'Usuário não encontrado. Verifique o email informado.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Senha incorreta. Tente novamente.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Email inválido. Verifique o formato do email.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'Esta conta foi desabilitada. Entre em contato com o administrador.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Muitas tentativas de login. Tente novamente mais tarde.';
            break;
          default:
            errorMessage = firebaseError.message || 'Erro desconhecido no login.';
        }
      }
      
      const customError = new Error(errorMessage);
      throw customError;
    }
  };

  const signOut = async () => {
    try {
      // Apenas executa o signOut do Firebase.
      // O listener onAuthStateChanged cuidará de limpar o estado e o cookie de sessão.
      await firebaseSignOut(auth);
      setUser(null);
      setUserData(null);
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  };

  const isAdmin = userData?.role === 'admin' || userData?.role === 'master_admin';
  const isMasterAdmin = userData?.role === 'master_admin';
  const isAuthorized = userData?.authorized === true;

  const value: AuthContextType = {
    user,
    userData,
    setUserData,
    loading,
    signInWithGoogle,
    signInWithMicrosoft,
    signInWithGitHub,
    signInWithEmailPassword,
    signOut,
    isAdmin,
    isMasterAdmin,
    isAuthorized
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};