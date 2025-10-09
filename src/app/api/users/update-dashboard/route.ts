import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export async function POST(request: NextRequest) {
   console.log("bati");


  try {
    // Verificar autenticação do usuário
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verificar se o Firebase Admin está configurado
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ 
        error: 'Firebase Admin não configurado. Configure a chave de serviço.' 
      }, { status: 500 });
    }

    // Verificar o token do usuário
    const decodedToken = await adminAuth.verifyIdToken(token);
    const currentUserId = decodedToken.uid;

    // Verificar se o usuário atual é admin
    const currentUserDoc = await adminDb.collection('users').doc(currentUserId).get();
    const currentUserData = currentUserDoc.data();

    if (!currentUserData || currentUserData.role !== 'master_admin') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem criar usuários.' }, { status: 403 });
    }

    // Obter dados da requisição
    const { newDashboardLink } = await request.json();

    if (typeof newDashboardLink !== 'string' || !newDashboardLink.trim()) {
      return NextResponse.json({ error: 'O link do dashboard é inválido' }, { status: 400 });
    }

    // Atualizar documento no Firestore
    const userRef = adminDb.collection('users').doc(currentUserId);
    await userRef.update({
      dashboardLink: newDashboardLink,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, message: 'Link do dashboard atualizado com sucesso' });

  } catch (error: unknown) {
    console.error('Erro ao atualizar o link do dashboard:', error);
    
    let errorMessage = 'Erro interno do servidor';
    let statusCode = 500;

    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string };
      if (firebaseError.code === 'auth/id-token-expired') {
        errorMessage = 'Token de autenticação expirado. Faça login novamente.';
        statusCode = 401;
      } else if (firebaseError.code === 'auth/argument-error') {
        errorMessage = 'Token de autenticação inválido.';
        statusCode = 401;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
