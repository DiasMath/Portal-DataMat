import mysql, { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';

interface PoolConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database?: string;
}

interface PoolEntry {
  pool: Pool;
  connectionId: string;
  config: PoolConfig;
  createdAt: number;
}

const pools = new Map<string, PoolEntry>();
const POOL_LIMIT = 10;
const POOL_TTL = 30 * 60 * 1000;

/**
 * Registro de execuções em andamento, pra permitir cancelar uma query
 * (`KILL QUERY <thread>` no MySQL) a partir de outra requisição — a
 * conexão que está rodando a query está ocupada, então o cancelamento
 * precisa vir de uma conexão diferente do mesmo pool.
 */
interface ActiveExecution {
  connectionId: string;
  mysqlThreadId: number;
  userId: string;
}
const activeExecutions = new Map<string, ActiveExecution>();

export function registerActiveExecution(executionId: string, entry: ActiveExecution): void {
  activeExecutions.set(executionId, entry);
}

export function unregisterActiveExecution(executionId: string): void {
  activeExecutions.delete(executionId);
}

export async function cancelExecution(executionId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  const entry = activeExecutions.get(executionId);
  if (!entry) {
    return { success: false, error: 'Execução não encontrada (pode já ter terminado)' };
  }
  if (entry.userId !== userId) {
    return { success: false, error: 'Acesso negado' };
  }

  const pool = pools.get(entry.connectionId)?.pool;
  if (!pool) {
    return { success: false, error: 'Conexão não encontrada' };
  }

  try {
    await pool.query(`KILL QUERY ${entry.mysqlThreadId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function getPool(connectionId: string): Promise<Pool | null> {
  const entry = pools.get(connectionId);
  if (entry) {
    return entry.pool;
  }

  const config = await loadConfigFromFirestore(connectionId);
  if (config) {
    return await createPool(connectionId, config);
  }

  return null;
}

export async function createPool(
  connectionId: string,
  config: PoolConfig
): Promise<Pool> {
  const existing = pools.get(connectionId);
  if (existing) {
    try {
      await existing.pool.end();
    } catch {}
  }

  if (pools.size >= POOL_LIMIT) {
    const oldest = [...pools.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt)[0];
    await closePool(oldest[0]);
  }

  const pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

  pools.set(connectionId, {
    pool,
    connectionId,
    config,
    createdAt: Date.now(),
  });

  return pool;
}

export async function closePool(connectionId: string): Promise<void> {
  const entry = pools.get(connectionId);
  if (entry) {
    await entry.pool.end();
    pools.delete(connectionId);
  }
}

export async function closeAllPools(): Promise<void> {
  for (const [id] of pools) {
    await closePool(id);
  }
}

export async function testConnection(config: PoolConfig): Promise<{ success: boolean; error?: string }> {
  let connection: PoolConnection | null = null;
  try {
    const tempPool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      connectTimeout: 5000,
    });

    connection = await tempPool.getConnection();
    await connection.ping();
    await tempPool.end();
    return { success: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { success: false, error };
  } finally {
    if (connection) {
      try {
        await connection.release();
      } catch {}
    }
  }
}

async function loadConfigFromFirestore(connectionId: string): Promise<PoolConfig | null> {
  // Delega para o repositório único de conexões (evita duplicar a lógica
  // de leitura/descriptografia que antes vivia só aqui).
  const { loadDecryptedConfig } = await import('@/lib/connections/repository');
  return loadDecryptedConfig(connectionId);
}

setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of pools) {
    if (now - entry.createdAt > POOL_TTL) {
      closePool(id).catch(() => {});
    }
  }
}, 5 * 60 * 1000);
