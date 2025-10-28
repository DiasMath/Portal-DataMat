import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { validateMasterAdmin } from '@/lib/auth-helpers';
import admin from 'firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação e permissões
    const currentUser = await validateMasterAdmin(request);
    
    if (!currentUser) {
      return NextResponse.json({ 
        error: 'Acesso negado. Apenas master admins podem atualizar dashboards.' 
      }, { status: 403 });
    }
    
    // Verificar se o Firebase Admin está configurado
    if (!adminDb) {
      return NextResponse.json({ 
        error: 'Firebase Admin não configurado. Configure a chave de serviço.' 
      }, { status: 500 });
    }

    // Obter dados da requisição
    const { newDashboardLink } = await request.json();

    if (typeof newDashboardLink !== 'string' || !newDashboardLink.trim()) {
      return NextResponse.json({ error: 'O link do dashboard é inválido' }, { status: 400 });
    }

    // Atualizar documento no Firestore
    const userRef = adminDb.collection('users').doc(currentUser.uid);
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
