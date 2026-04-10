'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireMasterAdmin?: boolean;
}

// 8 horas exatas em milissegundos
const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

export const ProtectedRoute = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireMasterAdmin = false,
}: ProtectedRouteProps) => {
  const { user, userData, loading, isAdmin, isMasterAdmin, isAuthorized, signOut } = useAuth();
  const router = useRouter();

  // ==========================================
  // LÓGICA DE EXPIRAÇÃO ABSOLUTA DE 8 HORAS
  // ==========================================
  useEffect(() => {
    // Se a rota não exige auth, ou o usuário não está logado, ignoramos
    if (!requireAuth || !user || !user.metadata.lastSignInTime) return;

    // Converte a string de data do último login para milissegundos
    const lastSignInTime = new Date(user.metadata.lastSignInTime).getTime();
    const now = Date.now();
    const timeElapsed = now - lastSignInTime;
    const timeLeft = EIGHT_HOURS_MS - timeElapsed;

    const forceLogout = async () => {
      await signOut();
      router.push('/login');
    };

    if (timeLeft <= 0) {
      // Já se passaram 8 horas desde o login: derruba na mesma hora
      forceLogout();
    } else {
      // Ainda não deu 8 horas: programa a queda EXATAMENTE para quando o tempo acabar
      const timer = setTimeout(forceLogout, timeLeft);
      
      // Limpa o cronômetro da memória se o usuário mudar de página
      return () => clearTimeout(timer);
    }
  }, [user, requireAuth, signOut, router]);

  // ==========================================
  // LÓGICA DE REDIRECIONAMENTO E PERMISSÕES
  // ==========================================
  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      router.push('/login');
      return;
    }

    if (user && !isAuthorized) {
      router.push('/unauthorized');
      return;
    }

    if (requireMasterAdmin && !isMasterAdmin) {
      router.push('/dashboard');
      return;
    }

    if (requireAdmin && !isAdmin) {
      router.push('/dashboard');
      return;
    }
  }, [
    user,
    userData,
    loading,
    isAuthorized,
    isAdmin,
    isMasterAdmin,
    requireAuth,
    requireAdmin,
    requireMasterAdmin,
    router,
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-text" />
      </div>
    );
  }

  if (!requireAuth) {
    return <>{children}</>;
  }

  if (!user || !isAuthorized) {
    return null;
  }

  if (requireMasterAdmin && !isMasterAdmin) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return null;
  }

  return <>{children}</>;
};