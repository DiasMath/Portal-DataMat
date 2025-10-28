import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Rotas públicas que não precisam de autenticação
  const publicPaths = [
    '/login',
    '/forgot-password',
    '/auth/action',
    '/unauthorized',
    '/api/auth/session',
    '/api/users/check-email',
    '/_next',
    '/favicon.ico',
    '/public'
  ];
  
  const { pathname } = request.nextUrl;
  
  console.log('[Middleware] Verificando rota:', pathname);
  
  // Permite acesso a rotas públicas
  if (publicPaths.some(path => pathname.startsWith(path))) {
    console.log('[Middleware] Rota pública, permitindo acesso');
    return NextResponse.next();
  }
  
  // Validação SIMPLES de sessão - apenas verifica se existe
  const session = request.cookies.get('session')?.value;
  
  console.log('[Middleware] Session cookie:', session ? 'EXISTS' : 'NOT FOUND');
  
  if (!session) {
    console.log('[Middleware] Sem session cookie, redirecionando para login');
    
    // Se for API, retorna 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Não autenticado. Token de sessão necessário.' }, 
        { status: 401 }
      );
    }
    
    // Se for página, redireciona para login
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Cookie existe, permite acesso
  // A validação REAL será feita em cada rota protegida conforme necessário
  console.log('[Middleware] Session cookie encontrado, permitindo acesso');
  
  const response = NextResponse.next();
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};