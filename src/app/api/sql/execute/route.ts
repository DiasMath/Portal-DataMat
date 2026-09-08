import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/sql/executor';
import { validateMasterAdmin } from '@/lib/auth-helpers';

const MAX_SQL_SIZE = 100 * 1024;
const MAX_STATEMENTS = 50;

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW = 60 * 1000;
const RATE_MAX = 30;

function checkRateLimit(uid: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(uid);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(uid, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_MAX) return false;
  entry.count++;
  return true;
}

function sanitizeError(msg: string): string {
  return msg
    .replace(/Host ['"].*?['"]/g, 'Host [redacted]')
    .replace(/user '.*?'/g, 'user [redacted]')
    .replace(/for user '.*?'/g, 'for user [redacted]')
    .replace(/Access denied for user '.*?'/g, 'Access denied')
    .replace(/Can't connect to MySQL server on '.*?'/g, 'Cannot connect to database server')
    .replace(/Table '.*?'\./g, 'Table [redacted].')
    .replace(/Database '.*?'/g, 'Database [redacted]');
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await validateMasterAdmin(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    if (!checkRateLimit(currentUser.uid)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit. Aguarde 1 minuto.' },
        { status: 429 }
      );
    }

    const { connectionId, sql, database, executionId } = await request.json();

    if (!connectionId || !sql) {
      return NextResponse.json(
        { success: false, error: 'connectionId and sql are required' },
        { status: 400 }
      );
    }

    if (typeof sql !== 'string' || sql.length > MAX_SQL_SIZE) {
      return NextResponse.json(
        { success: false, error: `Query excede o limite de ${MAX_SQL_SIZE / 1024}KB` },
        { status: 400 }
      );
    }

    const stmtCount = sql.split(';').filter(s => s.trim()).length;
    if (stmtCount > MAX_STATEMENTS) {
      return NextResponse.json(
        { success: false, error: `Máximo de ${MAX_STATEMENTS} statements por execução` },
        { status: 400 }
      );
    }

    const result = await executeQuery(connectionId, sql, database || undefined, executionId, currentUser.uid);

    return NextResponse.json({
      success: result.success,
      ...(result.success ? result.result : {}),
      error: result.error ? sanitizeError(result.error) : undefined,
      messages: result.messages?.map(m => ({
        ...m,
        text: m.type === 'error' ? sanitizeError(m.text) : m.text,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Erro interno ao executar query' },
      { status: 500 }
    );
  }
}
