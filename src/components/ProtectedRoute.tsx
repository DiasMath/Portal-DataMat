'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireMasterAdmin?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireAuth = true,
  requireAdmin = false,
  requireMasterAdmin = false 
}: ProtectedRouteProps) => {
  const { user, userData, loading, isAdmin, isMasterAdmin, isAuthorized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Aguarda carregar

    // Se requer autenticação mas não está logado
    if (requireAuth && !user) {
      router.push('/login');
      return;
    }

    // Se está logado mas não está autorizado
    if (user && !isAuthorized) {
      router.push('/unauthorized');
      return;
    }

    // Se requer ser master admin mas não é
    if (requireMasterAdmin && !isMasterAdmin) {
      router.push('/dashboard');
      return;
    }

    // Se requer ser admin mas não é
    if (requireAdmin && !isAdmin) {
      router.push('/dashboard');
      return;
    }
  }, [user, userData, loading, isAuthorized, isAdmin, isMasterAdmin, requireAuth, requireAdmin, requireMasterAdmin, router]);

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Se não requer autenticação, sempre mostra o conteúdo
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Se requer autenticação mas não está logado, não mostra nada (redirecionará)
  if (!user) {
    return null;
  }

  // Se está logado mas não autorizado, não mostra nada (redirecionará)
  if (!isAuthorized) {
    return null;
  }

  // Se requer master admin mas não é, não mostra nada (redirecionará)
  if (requireMasterAdmin && !isMasterAdmin) {
    return null;
  }

  // Se requer admin mas não é, não mostra nada (redirecionará)
  if (requireAdmin && !isAdmin) {
    return null;
  }

  // Se passou por todas as verificações, mostra o conteúdo
  return <>{children}</>;
};