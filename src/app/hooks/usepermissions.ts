import { useAuth } from '@/contexts/AuthContext';

export const usePermissions = () => {
  const { userData } = useAuth();

  const can = {
    // Operações de usuários
    createUsers: userData?.role === 'master_admin',
    editUsers: ['admin', 'master_admin'].includes(userData?.role || ''),
    deleteUsers: userData?.role === 'master_admin',
    viewAllUsers: ['admin', 'master_admin'].includes(userData?.role || ''),
    
    // Operações de empresas
    createCompanies: userData?.role === 'master_admin',
    editCompanies: ['admin', 'master_admin'].includes(userData?.role || ''),
    deleteCompanies: userData?.role === 'master_admin',
    
    // Operações gerais
    editOwnProfile: true,
    accessDashboard: userData?.authorized === true,
    sendPasswordReset: ['admin', 'master_admin'].includes(userData?.role || ''),
  };

  const is = {
    masterAdmin: userData?.role === 'master_admin',
    admin: ['admin', 'master_admin'].includes(userData?.role || ''),
    user: userData?.role === 'user',
    authorized: userData?.authorized === true,
  };

  return { can, is, userData };
};