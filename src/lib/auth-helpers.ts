import { NextRequest } from 'next/server';

/**
 * Valida a sessão de um usuário e retorna seus dados
 */
export async function validateSession(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  
  if (!session) {
    return null;
  }
  
  try {
    const { adminAuth, adminDb } = await import('@/lib/firebase-admin');
    
    if (!adminAuth || !adminDb) {
      return null;
    }
    
    const decodedToken = await adminAuth.verifySessionCookie(session, true);
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return null;
    }
    
    const userData = userDoc.data();
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role: userData?.role || 'user',
      authorized: userData?.authorized || false,
      userData: userData
    };
  } catch (error) {
    console.error('Erro ao validar sessão:', error);
    return null;
  }
}

/**
 * Valida se o usuário é um master admin
 */
export async function validateMasterAdmin(request: NextRequest) {
  const user = await validateSession(request);
  
  if (!user || user.role !== 'master_admin') {
    return null;
  }
  
  return user;
}

/**
 * Valida se o usuário é admin ou master admin
 */
export async function validateAdmin(request: NextRequest) {
  const user = await validateSession(request);
  
  if (!user || (user.role !== 'admin' && user.role !== 'master_admin')) {
    return null;
  }
  
  return user;
}

/**
 * Valida se o usuário está autorizado
 */
export async function validateAuthorized(request: NextRequest) {
  const user = await validateSession(request);
  
  if (!user || !user.authorized) {
    return null;
  }
  
  return user;
}
