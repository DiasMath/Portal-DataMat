'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SqlWorkbenchProvider } from '@/contexts/SqlWorkbenchContext';
import { SqlWorkbench } from '@/components/sql-workbench/SqlWorkbench';

function SqlWorkbenchPage() {
  return (
    <SqlWorkbenchProvider>
      <SqlWorkbench />
    </SqlWorkbenchProvider>
  );
}

export default function ProtectedSqlWorkbenchPage() {
  return (
    <ProtectedRoute requireMasterAdmin>
      <SqlWorkbenchPage />
    </ProtectedRoute>
  );
}