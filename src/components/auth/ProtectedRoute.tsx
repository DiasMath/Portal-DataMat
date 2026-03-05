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

export const ProtectedRoute = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireMasterAdmin = false,
}: ProtectedRouteProps) => {
  const { user, userData, loading, isAdmin, isMasterAdmin, isAuthorized } = useAuth();
  const router = useRouter();

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
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-gray-900" />
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

