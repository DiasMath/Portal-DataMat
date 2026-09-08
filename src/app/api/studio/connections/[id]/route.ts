import { NextRequest, NextResponse } from 'next/server';
import { validateMasterAdmin } from '@/lib/auth-helpers';
import { getConnection, updateConnection, deleteConnection, stripPassword } from '@/lib/connections/repository';
import { getPool } from '@/lib/sql/mysql-pool';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await validateMasterAdmin(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const { id } = await params;
  // getConnection já confere que a conexão pertence a currentUser.uid —
  // antes esta rota só checava `doc.exists`, permitindo que qualquer
  // master admin lesse a conexão de outro usuário se soubesse o ID.
  const connection = await getConnection(currentUser.uid, id);
  if (!connection) {
    return NextResponse.json({ error: 'Conexão não encontrada' }, { status: 404 });
  }

  return NextResponse.json({ success: true, connection: stripPassword(connection) });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await validateMasterAdmin(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const data = await request.json();
    delete data.id;

    const success = await updateConnection(currentUser.uid, id, data);
    if (!success) {
      return NextResponse.json({ error: 'Conexão não encontrada' }, { status: 404 });
    }

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

  const { id } = await params;
  const success = await deleteConnection(currentUser.uid, id);
  if (!success) {
    return NextResponse.json({ error: 'Conexão não encontrada' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

/**
 * Testa uma conexão já salva (usado pelo botão "Testar" na tela de edição).
 */
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
    const owned = await getConnection(currentUser.uid, id);
    if (!owned) {
      return NextResponse.json({ success: false, error: 'Conexão não encontrada' }, { status: 404 });
    }

    const pool = await getPool(id);
    if (!pool) {
      return NextResponse.json({ success: false, error: 'Conexão não encontrada' }, { status: 404 });
    }

    await pool.query('SELECT 1 as test');
    return NextResponse.json({ success: true, message: 'Conexão testada com sucesso' });
  } catch (err) {
    console.error('Erro ao testar conexão do Studio:', err);
    return NextResponse.json({ success: false, error: 'Falha ao testar conexão' }, { status: 500 });
  }
}
