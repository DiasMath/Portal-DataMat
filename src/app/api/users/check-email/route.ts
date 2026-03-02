import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const isDev = process.env.NODE_ENV !== 'production';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      if (isDev) {
        console.log('[check-email] Email não fornecido');
      }
      return NextResponse.json(
        { error: 'Email é obrigatório', exists: false },
        { status: 400 }
      );
    }

    if (isDev) {
      console.log('[check-email] Verificando email:', email);
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin não está configurado', exists: false },
        { status: 500 }
      );
    }

    // Buscar usuário no Firestore pelo email
    const usersRef = adminDb.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (snapshot.empty) {
      if (isDev) {
        console.log('[check-email] Usuário não encontrado:', email);
      }
      return NextResponse.json(
        { exists: false, message: 'Usuário não encontrado no sistema' },
        { status: 404 }
      );
    }

    const userData = snapshot.docs[0].data();
    if (isDev) {
      console.log('[check-email] Usuário encontrado:', email, 'authorized:', userData?.authorized);
    }

    return NextResponse.json({
      exists: true,
      authorized: userData?.authorized || false,
      role: userData?.role || 'user'
    });

  } catch (error) {
    console.error('[check-email] Erro ao verificar email:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar email', exists: false },
      { status: 500 }
    );
  }
}
