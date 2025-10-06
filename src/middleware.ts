import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Rotas públicas que não precisam de autenticação
  const publicPaths = [
    '/login',
    '/_next',
    '/favicon.ico',
    '/public'
  ];
  
  const { pathname } = request.nextUrl;
  
  // Permite acesso a rotas públicas
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // TODO: Implementar nova lógica de autenticação
  // Por enquanto, permite acesso a todas as rotas
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};