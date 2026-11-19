export const LIVE_API_URL = process.env.LIVE_API_URL || 'http://127.0.0.1:8002';

let verifiedAt = 0;

async function verifyLiveApiVersion() {
  if (Date.now() - verifiedAt < 5_000) return;
  const response = await fetch(`${LIVE_API_URL}/health`, { cache: 'no-store', signal: AbortSignal.timeout(3_000) });
  if (!response.ok || (await response.json()).live_sql_version !== 3) {
    throw new Error('LIVE_API_BACKEND_OUTDATED');
  }
  verifiedAt = Date.now();
}

export function liveApiFailureMessage(error: unknown): string {
  if (error instanceof Error && error.message === 'LIVE_API_BACKEND_OUTDATED') {
    return 'Serviço Live API desatualizado na URL configurada. Use a porta 8002 e reinicie o FastAPI e o Portal.';
  }
  if (error instanceof Error && error.message === 'LIVE_API_INTERNAL_KEY não configurada no Portal') {
    return 'Configure LIVE_API_INTERNAL_KEY no Portal e reinicie o Next.js.';
  }
  return 'Serviço Live API indisponível. Inicie o FastAPI na URL configurada em LIVE_API_URL.';
}

export async function liveApi(path: string, userId: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: unknown) {
  const key = process.env.LIVE_API_INTERNAL_KEY;
  if (!key) throw new Error('LIVE_API_INTERNAL_KEY não configurada no Portal');
  await verifyLiveApiVersion();
  const response = await fetch(`${LIVE_API_URL}${path}`, {
    method,
    headers: {
      'X-Live-API-Key': key,
      'X-Live-User': userId,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  const data = await response.json();
  return { status: response.status, data };
}
