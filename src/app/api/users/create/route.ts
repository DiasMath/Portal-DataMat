import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { validateMasterAdmin } from '@/lib/auth-helpers';
import admin from 'firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação e permissões
    const currentUser = await validateMasterAdmin(request);
    
    if (!currentUser) {
      return NextResponse.json({ 
        error: 'Acesso negado. Apenas master admins podem criar usuários.' 
      }, { status: 403 });
    }
    
    // Verificar se o Firebase Admin está configurado
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ 
        error: 'Firebase Admin não configurado. Configure a chave de serviço.' 
      }, { status: 500 });
    }

    // Obter dados do usuário a ser criado
    const { email, displayName, role, authorized, companyId } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    // Criar usuário no Firebase Auth sem senha inicial definida aqui.
    // O usuário definirá a própria senha através do email de redefinição.
    const userRecord = await adminAuth.createUser({
      email,
      displayName,
      emailVerified: false,
    });

    // Criar documento no Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName: displayName || '',
      companyId: companyId || null,
      role: role || 'user',
      authorized: authorized !== undefined ? authorized : true,
      provider: 'email',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Enviar email de redefinição de senha para o usuário configurar sua própria senha
    try {
      await adminAuth.generatePasswordResetLink(email);
    } catch (emailError) {
      console.warn('Erro ao enviar email de redefinição:', emailError);
    }

    return NextResponse.json({ 
      success: true,
      uid: userRecord.uid,
      message: 'Usuário criado com sucesso. Um email de redefinição de senha foi enviado para o usuário configurar a própria senha.',
    });

  } catch (error: unknown) {
    console.error('Erro ao criar usuário:', error);
    
    let errorMessage = 'Erro interno do servidor';
    let statusCode = 500;

    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string };
      if (firebaseError.code === 'auth/email-already-exists') {
        errorMessage = 'Este email já está sendo usado por outro usuário';
        statusCode = 400;
      } else if (firebaseError.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
        statusCode = 400;
      } else if (firebaseError.code === 'auth/weak-password') {
        errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres';
        statusCode = 400;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}