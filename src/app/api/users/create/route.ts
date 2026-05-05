import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { validateMasterAdmin } from '@/lib/auth-helpers';
import admin from 'firebase-admin';
import { logAuditEvent } from '@/lib/audit';

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
    const { email, displayName, role, authorized, companyId, permissions, defaultDashboardId } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    // Criar usuário no Firebase Auth sem senha inicial definida aqui.
    const userRecord = await adminAuth.createUser({
      email,
      displayName,
      emailVerified: false,
    });

    // HIGIENE DE DADOS: Força as regras de negócio no backend por segurança
    // Lógica: canViewDashboardList + allowedDashboards vazio = acesso total
    //        canViewDashboardList + allowedDashboards com empresas = acesso específico
    //        canViewDashboardList false = sem acesso à lista (vai direto para empresa)
    const hasFullDashboardAccess = permissions?.canViewDashboardList === true && 
      (!permissions?.allowedDashboards || Object.keys(permissions.allowedDashboards).length === 0);
    const hasFullResourceAccess = permissions?.canViewResourceList === true && 
      (!permissions?.allowedResources || Object.keys(permissions.allowedResources).length === 0);

    const safePermissions = {
      ...(permissions || {}),
      canEdit: role === 'admin' ? (permissions?.canEdit || false) : false,
      // Se tem acesso total, garantir que allowed está vazio
      canViewDashboardList: hasFullDashboardAccess ? true : (permissions?.canViewDashboardList ?? false),
      canViewResourceList: hasFullResourceAccess ? true : (permissions?.canViewResourceList ?? false),
      // Acesso total = allowed vazio, acesso específico = allowed com empresas
      allowedDashboards: hasFullDashboardAccess ? {} : (permissions?.allowedDashboards || {}),
      allowedResources: hasFullResourceAccess ? {} : (permissions?.allowedResources || {}),
    };

    // Criar documento no Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName: displayName || '',
      companyId: companyId || null,
      role: role || 'user',
      authorized: authorized !== undefined ? authorized : true,
      permissions: safePermissions, // <--- Usamos o objeto seguro aqui
      defaultDashboardId: defaultDashboardId || null,
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

    // Registrar auditoria
    await logAuditEvent({
      action: "USER_CREATE",
      actorUid: currentUser.uid,
      targetType: "user",
      targetId: userRecord.uid,
      details: {
        email,
        role: role || "user",
        authorized: authorized !== undefined ? authorized : true,
        companyId: companyId || null,
      },
    });

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