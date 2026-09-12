export interface ConnectionGroup {
  id: string;
  name: string;
  /** Suporta aninhamento arbitrário (grupo dentro de grupo). */
  parentId: string | null;
  createdAt?: unknown;
}

export interface DatabaseGroup {
  id: string;
  name: string;
  parentId: string | null;
  /** Grupos de banco são sempre escopados a uma conexão específica. */
  connectionId: string;
  /** Nomes de banco atribuídos diretamente a este grupo (não aos subgrupos). */
  databases: string[];
  createdAt?: unknown;
}
