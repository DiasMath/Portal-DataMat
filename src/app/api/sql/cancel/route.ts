import { NextRequest, NextResponse } from 'next/server';
import { validateMasterAdmin } from '@/lib/auth-helpers';
import { cancelExecution } from '@/lib/sql/mysql-pool';

/**
 * Cancela uma query em andamento via `KILL QUERY` no MySQL, rodado numa
 * conexão diferente do pool (a que está executando está ocupada). Só
 * cancela execuções que pertencem ao próprio usuário — ver `cancelExecution`.
 */
export async function POST(request: NextRequest) {
  const currentUser = await validateMasterAdmin(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const { executionId } = await request.json();
  if (!executionId) {
    return NextResponse.json({ success: false, error: 'executionId is required' }, { status: 400 });
  }

  const result = await cancelExecution(executionId, currentUser.uid);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
