import { NextRequest } from 'next/server';
import { createHash } from 'crypto';

/**
 * Cache curto de sessão validada — evita bater no Firebase Auth (com
 * checagem de revogação, que é uma chamada de rede) + Firestore em toda
 * única requisição da API. Isso é praticamente todo o Portal (admin,
 * dashboards, SQL Workbench, Studio), então o ganho aparece em qualquer
 * tela, mas fica mais visível no SQL Workbench por causa do volume de
 * chamadas (executar query, carregar schema, listar conexões...).
 *
 * TTL curto (60s) — não é "nunca mais revalida", é "não revalida a cada
 * poucos milissegundos enquanto o usuário está ativo".
 */
const SESSION_CACHE_TTL_MS = 60 * 1000;
const sessionCache = new Map<string, { user: SessionUser; expiresAt: number }>();

interface SessionUser {
  uid: string;
  email: string;
  role: string;
  authorized: boolean;
  userData: Record<string, unknown> | undefined;
}

function hashSessionCookie(session: string): string {
  return createHash('sha256').update(session).digest('hex');
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of sessionCache) {
    if (entry.expiresAt < now) sessionCache.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Valida a sessão de um usuário e retorna seus dados
 */
export async function validateSession(request: NextRequest) {
  const session = request.cookies.get('session')?.value;

  if (!session) {
    return null;
  }

  const cacheKey = hashSessionCookie(session);
  const cached = sessionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user;
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
    
    const user: SessionUser = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role: userData?.role || 'user',
      authorized: userData?.authorized || false,
      userData: userData
    };

    sessionCache.set(cacheKey, { user, expiresAt: Date.now() + SESSION_CACHE_TTL_MS });
    return user;
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
