import { NextRequest, NextResponse } from 'next/server';
import { validateMasterAdmin } from '@/lib/auth-helpers';
import { liveApi, liveApiFailureMessage } from '@/lib/sql/live-api';

const allowed = /^(?:sources(?:\/[0-9a-f]{32}(?:\/(?:execute|sync|endpoints|session))?)?|openapi\/preview|executions\/[0-9a-f]{32}(?:\/cancel)?)$/;

async function forward(request: NextRequest, method: 'GET' | 'POST' | 'DELETE', path: string[]) {
  const user = await validateMasterAdmin(request);
  if (!user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  const joined = path.join('/');
  if (!allowed.test(joined)) return NextResponse.json({ error: 'Rota inválida' }, { status: 404 });
  try {
    const body = method === 'POST' ? await request.json() : undefined;
    const result = await liveApi(`/v1/${joined}`, user.uid, method, body);
    return NextResponse.json(result.data, { status: result.status });
  } catch (error) {
    return NextResponse.json({ error: liveApiFailureMessage(error) }, { status: 502 });
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forward(request, 'GET', (await context.params).path);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forward(request, 'POST', (await context.params).path);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forward(request, 'DELETE', (await context.params).path);
}
