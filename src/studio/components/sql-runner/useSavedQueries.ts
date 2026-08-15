import { useLocalStorage } from '../../hooks/useLocalStorage';

const SAVED_KEY = 'sql_runner_saved';

export interface SavedQuery {
  id: string;
  name: string;
  sql: string;
  createdAt: number;
}

export function useSavedQueries() {
  const [savedQueries, setSavedQueries] = useLocalStorage<SavedQuery[]>(SAVED_KEY, []);

  const saveQuery = (query: SavedQuery) => {
    setSavedQueries(prev => [query, ...prev]);
  };

  const deleteQuery = (id: string) => {
    setSavedQueries(prev => prev.filter(q => q.id !== id));
  };

  return { savedQueries, saveQuery, deleteQuery } as const;
}
