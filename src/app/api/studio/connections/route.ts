import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { encrypt, decrypt, isEncrypted } from '@/lib/crypto';
import { validateMasterAdmin } from '@/lib/auth-helpers';
import type { StudioConnection } from '@/studio/types/connection';

const CONNECTIONS_COLLECTION = 'studio_connections';

function encryptConnection(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data };
  if (result.password && typeof result.password === 'string' && !isEncrypted(result.password)) {
    result.password = encrypt(result.password);
  }
  return result;
}

function decryptConnection(doc: { id: string; data(): Record<string, unknown> | undefined }): StudioConnection {
  const data = doc.data() || {};
  if (data.password && typeof data.password === 'string' && isEncrypted(data.password)) {
    data.password = decrypt(data.password);
  }
  return { id: doc.id, ...data } as StudioConnection;
}

export async function GET(request: NextRequest) {
  const currentUser = await validateMasterAdmin(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  if (!adminDb) {
    return NextResponse.json({ success: true, connections: [] });
  }

  try {
    const snapshot = await adminDb
      .collection(CONNECTIONS_COLLECTION)
      .where('userId', '==', currentUser.uid)
      .get();

    const connections = snapshot.docs.map((doc) => decryptConnection(doc));
    connections.sort((a, b) => {
      const aTime = (a as any).createdAt?.seconds || 0;
      const bTime = (b as any).createdAt?.seconds || 0;
      return bTime - aTime;
    });

    return NextResponse.json({ success: true, connections });
  } catch (err) {
    console.error('Erro ao buscar conexões do Studio:', err);
    return NextResponse.json({ success: true, connections: [] });
  }
}

export async function POST(request: NextRequest) {
  const currentUser = await validateMasterAdmin(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
  }

  try {
    const data = await request.json();
    const connectionData = encryptConnection({
      name: data.name,
      host: data.host,
      port: data.port,
      user: data.user,
      password: data.password,
      database: data.database || null,
      color: data.color || '#6366f1',
      status: 'disconnected',
      userId: currentUser.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const docRef = await adminDb.collection(CONNECTIONS_COLLECTION).add(connectionData);

    return NextResponse.json({
      success: true,
      connection: { id: docRef.id, ...data, status: 'disconnected' },
    });
  } catch (err) {
    console.error('Erro ao criar conexão do Studio:', err);
    return NextResponse.json({ error: 'Erro ao criar conexão' }, { status: 500 });
  }
}
