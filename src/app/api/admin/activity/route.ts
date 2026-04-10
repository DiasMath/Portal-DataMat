import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { validateMasterAdmin } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await validateMasterAdmin(request);
    
    if (!currentUser) {
      return NextResponse.json({ 
        error: 'Acesso negado' 
      }, { status: 403 });
    }

    if (!adminDb) {
      return NextResponse.json({ 
        error: 'Firebase Admin não configurado' 
      }, { status: 500 });
    }

    // Buscar auditLogs
    const auditSnapshot = await adminDb.collection('auditLogs')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    if (auditSnapshot.empty) {
      return NextResponse.json({ logs: [] });
    }

    // Pegar todos os IDs de usuários que precisamos buscar
    const userIds = new Set<string>();
    const targetIds = new Set<string>();
    
    auditSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.actorUid) userIds.add(data.actorUid);
      if (data.targetId && data.action?.includes('USER')) targetIds.add(data.targetId);
    });

    // Buscar usuários que realizaron ações
    const usersMap: Record<string, { displayName?: string; email?: string }> = {};
    if (userIds.size > 0) {
      const usersSnapshot = await adminDb.collection('users')
        .where('uid', 'in', Array.from(userIds))
        .get();
      
      usersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        usersMap[data.uid] = {
          displayName: data.displayName,
          email: data.email
        };
      });
    }

    // Buscar empresas criadas
    const companiesMap: Record<string, string> = {};
    const companiesSnapshot = await adminDb.collection('companies').get();
    companiesSnapshot.docs.forEach(doc => {
      companiesMap[doc.id] = doc.data().name;
    });

    // Buscar dashboards criados
    const dashboardsMap: Record<string, string> = {};
    const dashboardsSnapshot = await adminDb.collection('dashboards').get();
    dashboardsSnapshot.docs.forEach(doc => {
      dashboardsMap[doc.id] = doc.data().name;
    });

    // Montar logs com informações detalhadas
    const logs = auditSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Nome de quem realizou a ação
      const actorInfo = usersMap[data.actorUid] || {};
      const actorName = actorInfo.displayName || actorInfo.email || 'Usuário desconhecido';
      
      // Nome do alvo com base no tipo
      let targetName = '';
      if (data.action?.includes('USER') && data.targetId) {
        // Se for ação de usuário, tentar pegar dos detalhes
        targetName = data.details?.email || data.targetId;
      } else if (data.action?.includes('COMPANY') && data.targetId) {
        targetName = companiesMap[data.targetId] || data.targetId;
      } else if (data.action?.includes('DASHBOARD') && data.targetId) {
        targetName = dashboardsMap[data.targetId] || data.targetId;
      }

      return {
        id: doc.id,
        action: data.action,
        actorUid: data.actorUid,
        actorName: actorName,
        targetType: data.targetType,
        targetId: data.targetId,
        targetName: targetName,
        details: data.details,
        createdAt: data.createdAt ? {
          seconds: data.createdAt._seconds || data.createdAt.seconds || Math.floor(Date.now() / 1000)
        } : { seconds: Math.floor(Date.now() / 1000) }
      };
    });

    return NextResponse.json({ logs });

  } catch (error) {
    console.error('Erro ao buscar atividade recente:', error);
    return NextResponse.json({ 
      error: 'Erro ao buscar atividades' 
    }, { status: 500 });
  }
}