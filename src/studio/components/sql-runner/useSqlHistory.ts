import { useLocalStorage } from '../../hooks/useLocalStorage';

const HISTORY_KEY = 'sql_runner_history';
const MAX_HISTORY = 50;

export interface HistoryEntry {
  id: string;
  sql: string;
  timestamp: number;
  executionTime: number;
  rowCount: number;
}

export function useSqlHistory() {
  const [history, setHistory] = useLocalStorage<HistoryEntry[]>(HISTORY_KEY, []);

  const addHistory = (entry: HistoryEntry) => {
    setHistory(prev => [entry, ...prev].slice(0, MAX_HISTORY));
  };

  return { history, setHistory, addHistory } as const;
}
