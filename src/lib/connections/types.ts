/**
 * Tipo único de conexão, compartilhado entre o SQL Workbench e o Studio.
 *
 * Antes existiam dois tipos quase idênticos (`Connection` em
 * `types/sql-workbench.ts` e `StudioConnection` em `studio/types/connection.ts`)
 * e duas coleções separadas no Firestore (`sql_connections` e
 * `studio_connections`). Esse arquivo é a fonte única de verdade daqui pra
 * frente — os dois tipos antigos agora apenas re-exportam este.
 */
export interface SavedConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  user: string;
  /** Em trânsito (API -> client) isso nunca deveria estar preenchido; ver `stripPassword`. */
  password: string;
  database?: string;
  color?: string;
  favorite?: boolean;
  /** Grupo (pasta) ao qual esta conexão pertence, se houver. */
  groupId?: string | null;
  status: 'connected' | 'disconnected' | 'error';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type NewConnectionInput = Omit<SavedConnection, 'id' | 'status' | 'createdAt' | 'updatedAt'> & {
  status?: SavedConnection['status'];
};

export type ConnectionUpdateInput = Partial<Omit<SavedConnection, 'id' | 'createdAt'>>;
