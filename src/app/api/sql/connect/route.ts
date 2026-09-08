import { NextRequest, NextResponse } from 'next/server';
import { createPool, testConnection } from '@/lib/sql/mysql-pool';
import { validateMasterAdmin } from '@/lib/auth-helpers';
import { getConnectionForConnect } from '@/lib/connections/repository';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await validateMasterAdmin(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { connectionId } = body;

    if (!connectionId) {
      return NextResponse.json({ success: false, error: 'connectionId is required' }, { status: 400 });
    }

    let { host, port, user, password, database } = body;

    // Reconectando a uma conexão já salva: o client nunca recebe a senha de
    // volta (ver `stripPassword`), então quando `host`/`user` não vêm no
    // corpo buscamos e descriptografamos a config no servidor. Isso corrige
    // o bug em que reconectar depois de um F5 falhava silenciosamente por
    // falta de senha.
    if (host === undefined || user === undefined) {
      const saved = await getConnectionForConnect(currentUser.uid, connectionId);
      if (!saved) {
        return NextResponse.json(
          { success: false, error: 'Conexão não encontrada. Salve a conexão antes de conectar.' },
          { status: 404 }
        );
      }
      host = saved.host;
      port = saved.port;
      user = saved.user;
      password = saved.password;
      database = database || saved.database;
    }

    if (!host || !port || !user) {
      return NextResponse.json(
        { success: false, error: 'connectionId, host, port, and user are required' },
        { status: 400 }
      );
    }

    const numericPort = Number(port);
    if (isNaN(numericPort)) {
      return NextResponse.json({ success: false, error: `Invalid port: ${port}` }, { status: 400 });
    }

    const testResult = await testConnection({ host, port: numericPort, user, password, database });

    if (!testResult.success) {
      return NextResponse.json({ success: false, error: testResult.error }, { status: 400 });
    }

    await createPool(connectionId, { host, port: numericPort, user, password, database });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
