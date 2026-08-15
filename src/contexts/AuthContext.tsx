"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  User,
} from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const isDev = process.env.NODE_ENV !== "production";

export interface UserPermissions {
  canViewDashboardList: boolean;
  canViewResourceList: boolean;
  canEdit: boolean;
  allowedDashboards: {
    [companyId: string]: "all" | string[];
  };
  allowedResources: {
    [companyId: string]: "all" | string[];
  };
}

interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  role: "user" | "admin" | "master_admin";
  authorized: boolean;
  photoURL?: string;
  provider?: string;
  createdAt?: { seconds: number };
  updatedAt?: { seconds: number };
  lastLogin?: { seconds: number };
  companyId?: string;
  defaultDashboardId?: string;
  permissions?: UserPermissions;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  setUserData: React.Dispatch<React.SetStateAction<UserData | null>>;
  loading: boolean;
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
  
  // useRef para não causar re-renderizações (loops) invisíveis
  const sessionCookieCreated = useRef(false);

  const fetchUserData = async (user: User) => {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;
        setUserData(data);

        // Atualizar último login
        await updateDoc(doc(db, "users", user.uid), {
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        // Usuário não existe no Firestore - não autorizado
        setUserData(null);
      }
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
      setUserData(null);
    }
  };

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Ativar o loading IMEDIATAMENTE antes de processar qualquer coisa 
      // para evitar o "piscar" da tela de não autorizado
      setLoading(true);

      if (isDev) {
        console.log("[AuthContext] Auth state changed:", {
          user: !!user,
          sessionCookieCreated: sessionCookieCreated.current,
        });
      }

      setUser(user);
      
      if (user) {
        // Espera puxar as regras do Firestore (role, authorized, etc)
        await fetchUserData(user);

        // Criar session cookie no servidor APENAS UMA VEZ
        if (!sessionCookieCreated.current) {
          try {
            if (isDev) {
              console.log("[AuthContext] Criando session cookie...");
            }
            const idToken = await user.getIdToken();
            const response = await fetch("/api/auth/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken }),
            });

            if (response.ok) {
              if (isDev) {
                console.log("[AuthContext] Session cookie criado com sucesso");
              }
              sessionCookieCreated.current = true;
            } else {
              console.error(
                "[AuthContext] Falha ao criar session cookie:",
                await response.text()
              );
            }
          } catch (error) {
            console.error("[AuthContext] Erro ao criar session cookie:", error);
          }
        }
      } else {
        setUserData(null);

        // Remover session cookie no logout
        if (sessionCookieCreated.current) {
          try {
            if (isDev) {
              console.log("[AuthContext] Removendo session cookie...");
            }
            await fetch("/api/auth/session", { method: "DELETE" });
            if (isDev) {
              console.log("[AuthContext] Session cookie removido");
            }
            sessionCookieCreated.current = false;
          } catch (error) {
            console.error(
              "[AuthContext] Erro ao remover session cookie:",
              error
            );
          }
        }
      }
      
      // Só desativa o loading DEPOIS que tudo (Firebase e Cookie) já resolveu
      setLoading(false);
    });

    // Array de dependências vazio para o hook rodar apenas na montagem
    return unsubscribe;
  }, []); 

  const signInWithEmailPassword = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: unknown) {
      console.error("Erro no login com email/senha:", error);

      let errorMessage = "Erro no login com email/senha.";

      if (error && typeof error === "object" && "code" in error) {
        const firebaseError = error as { code: string; message?: string };
        switch (firebaseError.code) {
          case "auth/invalid-credential":
            errorMessage =
              "Email ou senha incorretos. Verifique suas credenciais.";
            break;
          case "auth/user-not-found":
            errorMessage =
              "Usuário não encontrado. Verifique o email informado.";
            break;
          case "auth/wrong-password":
            errorMessage = "Senha incorreta. Tente novamente.";
            break;
          case "auth/invalid-email":
            errorMessage = "Email inválido. Verifique o formato do email.";
            break;
          case "auth/user-disabled":
            errorMessage =
              "Esta conta foi desabilitada. Entre em contato com o administrador.";
            break;
          case "auth/too-many-requests":
            errorMessage =
              "Muitas tentativas de login. Tente novamente mais tarde.";
            break;
          default:
            errorMessage =
              firebaseError.message || "Erro desconhecido no login.";
        }
      }

      const customError = new Error(errorMessage);
      throw customError;
    }
  };

  const signOut = async () => {
    try {
      sessionStorage.clear();
      await firebaseSignOut(auth);
      setUser(null);
      setUserData(null);
    } catch (error) {
      console.error("Erro no logout:", error);
      throw error;
    }
  };

  const isAdmin =
    userData?.role === "admin" || userData?.role === "master_admin";
  const isMasterAdmin = userData?.role === "master_admin";
  const isAuthorized = userData?.authorized === true;

  const value: AuthContextType = {
    user,
    userData,
    setUserData,
    loading,
    signInWithEmailPassword,
    signOut,
    isAdmin,
    isMasterAdmin,
    isAuthorized,
    companyId: userData?.companyId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};