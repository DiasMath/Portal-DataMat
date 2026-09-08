import { NextRequest, NextResponse } from 'next/server';
import { validateMasterAdmin } from '@/lib/auth-helpers';
import { listConnections, createConnection, stripPassword } from '@/lib/connections/repository';

/**
 * O Studio agora usa o mesmo repositório de conexões do SQL Workbench
 * (`@/lib/connections/repository`, coleção `sql_connections`). Antes essa
 * rota falava direto com uma coleção separada (`studio_connections`) com
 * sua própria cópia da lógica de encrypt/decrypt — e sem checar o dono do
 * documento em GET/PUT/DELETE. Conexões criadas em qualquer uma das duas
 * telas agora aparecem nas duas.
 */
export async function GET(request: NextRequest) {
  const currentUser = await validateMasterAdmin(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const connections = await listConnections(currentUser.uid);
  return NextResponse.json({ success: true, connections: connections.map(stripPassword) });
}

export async function POST(request: NextRequest) {
  const currentUser = await validateMasterAdmin(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  try {
    const data = await request.json();

    if (!data.name || !data.host || !data.user) {
      return NextResponse.json({ error: 'name, host e user são obrigatórios' }, { status: 400 });
    }

    const id = await createConnection(currentUser.uid, {
      name: data.name,
      host: data.host,
      port: data.port,
      user: data.user,
      password: data.password,
      database: data.database || undefined,
      color: data.color || '#6366f1',
      status: 'disconnected',
    });

    return NextResponse.json({
      success: true,
      connection: { id, ...data, status: 'disconnected' },
    });
  } catch (err) {
    console.error('Erro ao criar conexão do Studio:', err);
    return NextResponse.json({ error: 'Erro ao criar conexão' }, { status: 500 });
  }
}
