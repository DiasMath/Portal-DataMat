import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { encrypt, decrypt, isEncrypted } from '@/lib/crypto';
import { validateMasterAdmin } from '@/lib/auth-helpers';
import { getPool } from '@/lib/sql/mysql-pool';
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await validateMasterAdmin(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
  }

  try {
    const { id } = await params;
    const doc = await adminDb.collection(CONNECTIONS_COLLECTION).doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Conexão não encontrada' }, { status: 404 });
    }

    const connection = decryptConnection(doc);
    return NextResponse.json({ success: true, connection });
  } catch (err) {
    console.error('Erro ao buscar conexão do Studio:', err);
    return NextResponse.json({ error: 'Erro ao buscar conexão' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await validateMasterAdmin(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
  }

  try {
    const { id } = await params;
    const data = await request.json();
    const updateData = encryptConnection({
      name: data.name,
      host: data.host,
      port: data.port,
      user: data.user,
      password: data.password,
      database: data.database || null,
      color: data.color,
      updatedAt: new Date(),
    });

    await adminDb.collection(CONNECTIONS_COLLECTION).doc(id).update(updateData);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Erro ao atualizar conexão do Studio:', err);
    return NextResponse.json({ error: 'Erro ao atualizar conexão' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await validateMasterAdmin(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
  }

  try {
    const { id } = await params;
    await adminDb.collection(CONNECTIONS_COLLECTION).doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Erro ao deletar conexão do Studio:', err);
    return NextResponse.json({ error: 'Erro ao deletar conexão' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await validateMasterAdmin(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const pool = await getPool(id);
    if (!pool) {
      return NextResponse.json({ success: false, error: 'Conexão não encontrada' }, { status: 404 });
    }

    const [rows] = await pool.query('SELECT 1 as test');
    return NextResponse.json({ success: true, message: 'Conexão testada com sucesso' });
  } catch (err) {
    console.error('Erro ao testar conexão do Studio:', err);
    return NextResponse.json({ success: false, error: 'Falha ao testar conexão' }, { status: 500 });
  }
}
