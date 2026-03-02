import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

const isDev = process.env.NODE_ENV !== 'production';

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'Token de autenticação não fornecido' },
        { status: 400 }
      );
    }

    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Firebase Admin não está configurado' },
        { status: 500 }
      );
    }

    // Verificar o ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (isDev) {
      console.log('[session] Token verificado para UID:', decodedToken.uid);
    }

    // Criar session cookie com expiração de 14 dias
    const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 dias em ms
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    if (isDev) {
      console.log('[session] Session cookie criado com sucesso');
    }

    // Definir o cookie
    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn / 1000, // em segundos
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({ 
      success: true,
      message: 'Session cookie criado com sucesso' 
    });

  } catch (error) {
    console.error('[session] Erro ao criar session cookie:', error);
    return NextResponse.json(
      { error: 'Erro ao criar sessão' },
      { status: 500 }
    );
  }
}

// DELETE para logout
export async function DELETE() {
  try {
    if (isDev) {
      console.log('[session] Removendo session cookie');
    }
    const cookieStore = await cookies();
    cookieStore.delete('session');
    
    return NextResponse.json({ 
      success: true,
      message: 'Session removida com sucesso' 
    });
  } catch (error) {
    console.error('[session] Erro ao remover session:', error);
    return NextResponse.json(
      { error: 'Erro ao remover sessão' },
      { status: 500 }
    );
  }
}
