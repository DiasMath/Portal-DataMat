'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  SqlWorkbenchState,
  Connection,
  QueryTab,
  QueryResult,
  QueryMessage,
  DatabaseSchema,
  SavedQuery,
  QueryHistoryEntry,
} from '@/types/sql-workbench';

const MAX_TABS = 20;
const MAX_HISTORY = 100;
const STORAGE_KEY = 'sql_workbench_state';
const NEW_TAB_LINES = '\n\n\n\n\n\n\n\n\n';

const initialState: SqlWorkbenchState = {
  connections: [],
  activeConnectionId: null,
  activeDatabase: null,
  tabs: [],
  activeTabId: null,
  secondaryTabId: null,
  schemas: {},
  sidebarCollapsed: false,
  sidebarWidth: 320,
  resultsHeight: 400,
  resultsCollapsed: false,
  splitMode: 'none',
  splitSize: 50,
  queryHistory: [],
  highlightEnabled: false,
  isExecuting: false,
  activeExecutionId: null,
};

type Action =
  | { type: 'SET_CONNECTIONS'; payload: Connection[] }
  | { type: 'ADD_CONNECTION'; payload: Connection }
  | { type: 'UPDATE_CONNECTION'; payload: Connection }
  | { type: 'REMOVE_CONNECTION'; payload: string }
  | { type: 'SET_ACTIVE_CONNECTION'; payload: string | null }
  | { type: 'SET_ACTIVE_DATABASE'; payload: string | null }
  | { type: 'SET_TABS'; payload: QueryTab[] }
  | { type: 'ADD_TAB'; payload?: Partial<QueryTab> & { title?: string } }
  | { type: 'UPDATE_TAB'; payload: { id: string; updates: Partial<QueryTab> } }
  | { type: 'REMOVE_TAB'; payload: string }
  | { type: 'SET_ACTIVE_TAB'; payload: string | null }
  | { type: 'SET_SECONDARY_TAB'; payload: string | null }
  | { type: 'SET_SIDEBAR_COLLAPSED'; payload: boolean }
  | { type: 'SET_SIDEBAR_WIDTH'; payload: number }
  | { type: 'SET_RESULTS_HEIGHT'; payload: number }
  | { type: 'SET_RESULTS_COLLAPSED'; payload: boolean }
  | { type: 'SET_SPLIT_MODE'; payload: 'none' | 'horizontal' | 'vertical' }
  | { type: 'SET_SPLIT_SIZE'; payload: number }
  | { type: 'SET_SCHEMA'; payload: { connectionId: string; schema: DatabaseSchema } }
  | { type: 'ADD_TO_HISTORY'; payload: QueryHistoryEntry }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'SET_EXECUTING'; payload: { isExecuting: boolean; activeExecutionId: string | null } }
  | { type: 'TOGGLE_HIGHLIGHT' }
  | { type: 'LOAD_STATE'; payload: Partial<SqlWorkbenchState> };

function reducer(state: SqlWorkbenchState, action: Action): SqlWorkbenchState {
  switch (action.type) {
    case 'SET_CONNECTIONS':
      return { ...state, connections: action.payload };

    case 'ADD_CONNECTION':
      return { ...state, connections: [...state.connections, action.payload] };

    case 'UPDATE_CONNECTION':
      return {
        ...state,
        connections: state.connections.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };

    case 'REMOVE_CONNECTION':
      return {
        ...state,
        connections: state.connections.filter((c) => c.id !== action.payload),
        activeConnectionId:
          state.activeConnectionId === action.payload ? null : state.activeConnectionId,
      };

    case 'SET_ACTIVE_CONNECTION':
      return { ...state, activeConnectionId: action.payload };

    case 'SET_ACTIVE_DATABASE':
      return { ...state, activeDatabase: action.payload };

    case 'SET_TABS':
      return { ...state, tabs: action.payload };

    case 'ADD_TAB': {
      const newTab: QueryTab = {
        id: uuidv4(),
        title: action.payload?.title || `Query ${state.tabs.length + 1}`,
        sql: action.payload?.sql || NEW_TAB_LINES,
        connectionId: action.payload?.connectionId || state.activeConnectionId || '',
        isDirty: false,
        messages: [],
      };
      const newTabs = [...state.tabs, newTab].slice(-MAX_TABS);
      return { ...state, tabs: newTabs, activeTabId: newTab.id };
    }

    case 'UPDATE_TAB':
      return {
        ...state,
        tabs: state.tabs.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
        ),
      };

    case 'REMOVE_TAB': {
      const newTabs = state.tabs.filter((t) => t.id !== action.payload);
      let newActiveId = state.activeTabId;
      if (state.activeTabId === action.payload) {
        const idx = state.tabs.findIndex((t) => t.id === action.payload);
        newActiveId = newTabs[idx]?.id || newTabs[idx - 1]?.id || null;
      }
      let newSecondaryId = state.secondaryTabId;
      if (state.secondaryTabId === action.payload) newSecondaryId = null;
      return { ...state, tabs: newTabs, activeTabId: newActiveId, secondaryTabId: newSecondaryId };
    }

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTabId: action.payload };

    case 'SET_SECONDARY_TAB':
      return { ...state, secondaryTabId: action.payload };

    case 'SET_SIDEBAR_COLLAPSED':
      return { ...state, sidebarCollapsed: action.payload };

    case 'SET_SIDEBAR_WIDTH':
      return { ...state, sidebarWidth: Math.max(200, Math.min(600, action.payload)) };

    case 'SET_RESULTS_HEIGHT':
      return { ...state, resultsHeight: Math.max(100, Math.min(600, action.payload)) };

    case 'SET_RESULTS_COLLAPSED':
      return { ...state, resultsCollapsed: action.payload };

    case 'SET_SPLIT_MODE':
      return { ...state, splitMode: action.payload };

    case 'SET_SPLIT_SIZE':
      return { ...state, splitSize: Math.max(20, Math.min(80, action.payload)) };

    case 'SET_SCHEMA':
      return {
        ...state,
        schemas: { ...state.schemas, [action.payload.connectionId]: action.payload.schema },
      };

    case 'ADD_TO_HISTORY':
      const newHistory = [action.payload, ...state.queryHistory].slice(0, MAX_HISTORY);
      return { ...state, queryHistory: newHistory };

    case 'CLEAR_HISTORY':
      return { ...state, queryHistory: [] };

    case 'SET_EXECUTING':
      return { ...state, isExecuting: action.payload.isExecuting, activeExecutionId: action.payload.activeExecutionId };

    case 'TOGGLE_HIGHLIGHT':
      return { ...state, highlightEnabled: !state.highlightEnabled };

    case 'LOAD_STATE':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

interface SqlWorkbenchContextType {
  state: SqlWorkbenchState;
  dispatch: React.Dispatch<Action>;
  activeTab: QueryTab | undefined;
  secondaryTab: QueryTab | undefined;
  executeQuery: (sql?: string) => Promise<boolean>;
  cancelQuery: () => Promise<void>;
  formatSql: () => void;
  newTab: (title?: string, sql?: string, connectionId?: string) => void;
  closeTab: (id: string) => void;
  toggleSidebar: () => void;
  toggleResults: () => void;
  enableSplitHorizontal: () => void;
  enableSplitVertical: () => void;
  disableSplit: () => void;
  setSecondaryTab: (tabId: string | null) => void;
  setActiveDatabase: (db: string | null) => void;
  clearHistory: () => void;
  runFromHistory: (historyEntry: QueryHistoryEntry) => void;
  saveQuery: (name?: string) => Promise<string | null>;
  registerEditor: (tabId: string, editor: unknown) => void;
  unregisterEditor: (tabId: string) => void;
  /** Texto selecionado no editor da aba, ou null se não houver seleção (ou aba não registrada). */
  getSelectedSql: (tabId: string) => string | null;
}

const SqlWorkbenchContext = createContext<SqlWorkbenchContextType | null>(null);

export function SqlWorkbenchProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  // Instâncias do Monaco Editor por aba — registradas pelo QueryEditor no
  // mount. Usado só pra ler a seleção atual (ex: "Executar" no toolbar
  // rodando só o trecho selecionado); nunca guardamos isso no state React
  // porque não precisa (nem deveria) causar re-render.
  const editorInstancesRef = useRef<Map<string, any>>(new Map());

  const registerEditor = useCallback((tabId: string, editor: unknown) => {
    editorInstancesRef.current.set(tabId, editor);
  }, []);

  const unregisterEditor = useCallback((tabId: string) => {
    editorInstancesRef.current.delete(tabId);
  }, []);

  const getSelectedSql = useCallback((tabId: string): string | null => {
    const editor = editorInstancesRef.current.get(tabId);
    if (!editor) return null;
    const selection = editor.getSelection?.();
    if (!selection || selection.isEmpty?.()) return null;
    const model = editor.getModel?.();
    const text = model?.getValueInRange?.(selection);
    return text && text.trim() ? text : null;
  }, []);

  // Persistência entre sessões: preferências de UI, abas abertas (sem os
  // resultados — só o texto da query, pra não inflar o localStorage nem
  // arriscar erro de serialização com valores exóticos do MySQL) e o
  // histórico de execuções. Antes disso, um F5 apagava toda query não
  // salva e o histórico da sessão.
  //
  // As duas checagens de "criar aba em branco se não houver nenhuma" e
  // "restaurar abas salvas" foram unificadas num único effect: separadas,
  // ambas liam o mesmo `state.tabs.length === 0` da renderização inicial e
  // corriam o risco de disparar as duas, deixando uma aba em branco extra
  // além das abas restauradas.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    let restoredTabs: QueryTab[] = [];
    let restoredActiveTabId: string | null = null;
    let restoredSecondaryTabId: string | null = null;
    let restoredHistory: QueryHistoryEntry[] | null = null;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const { connections: _connections, tabs: savedTabs, queryHistory: savedHistory, ...uiPrefs } = parsed;
        dispatch({ type: 'LOAD_STATE', payload: uiPrefs });

        if (Array.isArray(savedTabs) && savedTabs.length > 0) {
          restoredTabs = savedTabs.map((t: Partial<QueryTab>) => ({
            id: t.id || uuidv4(),
            title: t.title || 'Query',
            sql: t.sql || '',
            connectionId: t.connectionId || '',
            isDirty: false,
            messages: [],
          }));
          const savedActiveId = parsed.activeTabId as string | undefined;
          restoredActiveTabId = restoredTabs.find((t) => t.id === savedActiveId)?.id || restoredTabs[0].id;
          const savedSecondaryId = parsed.secondaryTabId as string | undefined;
          restoredSecondaryTabId = restoredTabs.find((t) => t.id === savedSecondaryId)?.id || null;
        }

        if (Array.isArray(savedHistory)) {
          restoredHistory = savedHistory.map((h: QueryHistoryEntry) => ({
            ...h,
            timestamp: new Date(h.timestamp),
          }));
        }
      } catch { /* ignore */ }
    }

    if (restoredTabs.length > 0) {
      dispatch({ type: 'SET_TABS', payload: restoredTabs });
      dispatch({ type: 'SET_ACTIVE_TAB', payload: restoredActiveTabId });
      dispatch({ type: 'SET_SECONDARY_TAB', payload: restoredSecondaryTabId });
    } else {
      dispatch({ type: 'ADD_TAB' });
    }

    if (restoredHistory) {
      dispatch({ type: 'LOAD_STATE', payload: { queryHistory: restoredHistory } });
    }
  }, []);

  useEffect(() => {
    const toSave = {
      sidebarCollapsed: state.sidebarCollapsed,
      sidebarWidth: state.sidebarWidth,
      resultsHeight: state.resultsHeight,
      splitMode: state.splitMode,
      splitSize: state.splitSize,
      activeTabId: state.activeTabId,
      secondaryTabId: state.secondaryTabId,
      // Persistimos só o essencial de cada aba — sem `results`/`messages`,
      // que são recriados na próxima execução e podem ficar grandes.
      tabs: state.tabs.map((t) => ({
        id: t.id,
        title: t.title,
        sql: t.sql,
        connectionId: t.connectionId,
      })),
      queryHistory: state.queryHistory,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // Se estourar a cota do localStorage (histórico muito grande, por
      // exemplo), preferimos silenciar a falhar a sessão inteira.
    }
  }, [state.sidebarCollapsed, state.sidebarWidth, state.resultsHeight, state.splitMode, state.splitSize, state.activeTabId, state.secondaryTabId, state.tabs, state.queryHistory]);

  const executeQuery = useCallback(async (sql?: string) => {
    const s = stateRef.current;
    const activeTab = s.tabs.find((t) => t.id === s.activeTabId);
    const querySql = sql || activeTab?.sql;
    const connectionId = activeTab?.connectionId || s.activeConnectionId;
    const database = s.activeDatabase;

    if (!querySql || !connectionId) return false;

    const executionId = uuidv4();
    dispatch({ type: 'SET_EXECUTING', payload: { isExecuting: true, activeExecutionId: executionId } });

    const startTime = performance.now();
    let success = false;
    let errorMsg = '';
    let rowCount: number | undefined;
    let data: Record<string, unknown> = {};

    try {
      const res = await fetch('/api/sql/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId, sql: querySql, database, executionId }),
      });

      data = await res.json();
      const executionTime = performance.now() - startTime;

      if (data.success) {
        success = true;
        rowCount = (data.rows as unknown[])?.length ?? (data.affectedRows as number) ?? 0;
        const result: QueryResult = {
          columns: (data.columns as string[]) || [],
          rows: (data.rows as Record<string, unknown>[]) || [],
          affectedRows: data.affectedRows as number | undefined,
          executionTime,
          type: data.type as QueryResult['type'],
          message: data.message as string,
          autoLimited: data.autoLimited as boolean | undefined,
          sourceSql: querySql,
        };

        const tabMessages = (data.messages as Array<{ type: string; text: string }>)?.map((m) => ({
          type: m.type as 'success' | 'error',
          text: m.text,
          executionTime,
        })) || [{ type: 'success' as const, text: (data.message as string) || `${(data.rows as unknown[])?.length || 0} row(s) returned`, executionTime }];

        dispatch({
          type: 'UPDATE_TAB',
          payload: {
            id: s.activeTabId!,
            updates: { results: result, isDirty: false, messages: tabMessages },
          },
        });
      } else {
        throw new Error((data.error as string) || 'Query failed');
      }
    } catch (err) {
      success = false;
      errorMsg = err instanceof Error ? err.message : String(err);
      const executionTime = performance.now() - startTime;

      const errorTabMessages = (data.messages as Array<{ type: string; text: string }>)?.map((m) => ({
        type: m.type as 'success' | 'error',
        text: m.text,
        executionTime,
      })) || [{ type: 'error' as const, text: errorMsg, executionTime }];

      dispatch({
        type: 'UPDATE_TAB',
        payload: {
          id: s.activeTabId!,
          updates: { messages: errorTabMessages },
        },
      });
    }

    dispatch({
      type: 'ADD_TO_HISTORY',
      payload: {
        id: uuidv4(),
        sql: querySql,
        connectionId,
        timestamp: new Date(),
        success,
        executionTime: performance.now() - startTime,
        rowCount,
        error: success ? undefined : errorMsg,
      },
    });

    dispatch({ type: 'SET_EXECUTING', payload: { isExecuting: false, activeExecutionId: null } });

    return success;
  }, []);

  const cancelQuery = useCallback(async () => {
    const executionId = stateRef.current.activeExecutionId;
    if (!executionId) return;
    try {
      await fetch('/api/sql/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executionId }),
      });
      // Não precisamos tratar o resultado aqui: o `KILL QUERY` faz o
      // `conn.query()` da execução original lançar erro, que já é
      // capturado e resolvido normalmente pelo próprio `executeQuery` —
      // isso só dispara o cancelamento, quem limpa o estado é o fluxo
      // normal de erro/finally de lá.
    } catch {
      // Silencioso — se falhar, a query segue seu curso normal.
    }
  }, []);

  const formatSql = useCallback(() => {
    const s = stateRef.current;
    const tab = s.tabs.find((t) => t.id === s.activeTabId);
    if (!tab?.sql?.trim()) return;
    import('sql-formatter').then(({ format }) => {
      try {
        const formatted = format(tab.sql, {
          language: 'mysql',
          keywordCase: 'preserve',
          indentStyle: 'standard',
          tabWidth: 2,
        });
        dispatch({
          type: 'UPDATE_TAB',
          payload: { id: s.activeTabId!, updates: { sql: formatted } },
        });
      } catch (err) {
        console.error('Format SQL error:', err);
      }
    });
  }, []);

  const newTab = useCallback((title?: string, sql?: string, connectionId?: string) => {
    dispatch({
      type: 'ADD_TAB',
      payload: { title, sql, connectionId },
    });
  }, []);

  const closeTab = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TAB', payload: id });
  }, []);

  const setActiveDatabase = useCallback((db: string | null) => {
    dispatch({ type: 'SET_ACTIVE_DATABASE', payload: db });
  }, []);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: !stateRef.current.sidebarCollapsed });
  }, []);

  const toggleResults = useCallback(() => {
    dispatch({ type: 'SET_RESULTS_COLLAPSED', payload: !stateRef.current.resultsCollapsed });
  }, []);

  const enableSplitHorizontal = useCallback(() => {
    const s = stateRef.current;
    dispatch({ type: 'SET_SPLIT_MODE', payload: 'horizontal' });
    if (s.tabs.length > 1 && !s.secondaryTabId) {
      const availableTabs = s.tabs.filter(t => t.id !== s.activeTabId);
      if (availableTabs.length > 0) {
        dispatch({ type: 'SET_SECONDARY_TAB', payload: availableTabs[0].id });
      }
    }
  }, []);

  const enableSplitVertical = useCallback(() => {
    const s = stateRef.current;
    dispatch({ type: 'SET_SPLIT_MODE', payload: 'vertical' });
    if (s.tabs.length > 1 && !s.secondaryTabId) {
      const availableTabs = s.tabs.filter(t => t.id !== s.activeTabId);
      if (availableTabs.length > 0) {
        dispatch({ type: 'SET_SECONDARY_TAB', payload: availableTabs[0].id });
      }
    }
  }, []);

  const disableSplit = useCallback(() => {
    dispatch({ type: 'SET_SPLIT_MODE', payload: 'none' });
  }, []);

  const setSecondaryTab = useCallback((tabId: string | null) => {
    dispatch({ type: 'SET_SECONDARY_TAB', payload: tabId });
  }, []);

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
  }, []);

  const runFromHistory = useCallback((historyEntry: QueryHistoryEntry) => {
    const s = stateRef.current;
    if (s.activeTabId) {
      dispatch({
        type: 'UPDATE_TAB',
        payload: { id: s.activeTabId, updates: { sql: historyEntry.sql, isDirty: true } },
      });
    }
  }, []);

  const activeTab = state.tabs.find((t) => t.id === state.activeTabId);
  const secondaryTab = state.tabs.find((t) => t.id === state.secondaryTabId);

  return (
    <SqlWorkbenchContext.Provider
      value={{
        state,
        dispatch,
        activeTab,
        secondaryTab,
        executeQuery,
        formatSql,
        saveQuery: useCallback(async (name?: string) => {
          const s = stateRef.current;
          const tab = s.tabs.find((t) => t.id === s.activeTabId);
          if (!tab?.sql) return null;
          const queryName = name || `Query ${new Date().toLocaleString()}`;
          try {
            const res = await fetch('/api/sql/snippets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'savedQuery', data: { name: queryName, sql: tab.sql, connectionId: tab.connectionId } }),
            });
            const result = await res.json();
            return result.id || null;
          } catch { return null; }
        }, []),
        newTab,
        closeTab,
        toggleSidebar,
        toggleResults,
        enableSplitHorizontal,
        enableSplitVertical,
        disableSplit,
        setSecondaryTab,
        setActiveDatabase,
        clearHistory,
        runFromHistory,
        registerEditor,
        unregisterEditor,
        getSelectedSql,
        cancelQuery,
      }}
    >
      {children}
    </SqlWorkbenchContext.Provider>
  );
}

export function useSqlWorkbench() {
  const ctx = useContext(SqlWorkbenchContext);
  if (!ctx) throw new Error('useSqlWorkbench must be used within SqlWorkbenchProvider');
  return ctx;
}
