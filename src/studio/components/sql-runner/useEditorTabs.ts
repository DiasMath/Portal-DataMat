import { useState, useCallback, useRef, useEffect } from 'react';

export interface EditorTab {
  id: string;
  name: string;
  sql: string;
}

interface UseEditorTabsOptions {
  initialTabs: EditorTab[];
  initialActiveTab: string;
  onManualSqlChange?: (sql: string) => void;
}

export function useEditorTabs({ initialTabs, initialActiveTab, onManualSqlChange }: UseEditorTabsOptions) {
  const [editorTabs, setEditorTabs] = useState<EditorTab[]>(
    () => initialTabs.length > 0 ? initialTabs : [{ id: 'tab-1', name: 'Query 1', sql: '' }]
  );
  const [activeEditorTab, setActiveEditorTab] = useState(initialActiveTab || 'tab-1');
  const [renamingTab, setRenamingTab] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingTab && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingTab]);

  const handleNewEditorTab = useCallback(() => {
    const id = `tab-${Date.now()}`;
    const newTab: EditorTab = { id, name: `Query ${editorTabs.length + 1}`, sql: '' };
    setEditorTabs(prev => [...prev, newTab]);
    setActiveEditorTab(id);
    onManualSqlChange?.('');
  }, [editorTabs.length, onManualSqlChange]);

  const handleCloseEditorTab = useCallback((tabId: string) => {
    setEditorTabs(prev => {
      const next = prev.filter(t => t.id !== tabId);
      if (next.length === 0) return prev;
      if (activeEditorTab === tabId) {
        const newActive = next[next.length - 1];
        setActiveEditorTab(newActive.id);
        onManualSqlChange?.(newActive.sql);
      }
      return next;
    });
  }, [activeEditorTab, onManualSqlChange]);

  const handleEditorTabClick = useCallback((tabId: string, currentManualSql: string) => {
    if (renamingTab) return;
    const tab = editorTabs.find(t => t.id === tabId);
    if (!tab) return;
    setEditorTabs(prev => prev.map(t =>
      t.id === activeEditorTab ? { ...t, sql: currentManualSql } : t
    ));
    setActiveEditorTab(tabId);
    onManualSqlChange?.(tab.sql);
  }, [editorTabs, activeEditorTab, renamingTab, onManualSqlChange]);

  const handleStartRename = useCallback((tabId: string) => {
    const tab = editorTabs.find(t => t.id === tabId);
    if (!tab) return;
    setRenamingTab(tabId);
    setRenameValue(tab.name);
  }, [editorTabs]);

  const handleFinishRename = useCallback(() => {
    if (renamingTab && renameValue.trim()) {
      setEditorTabs(prev => prev.map(t =>
        t.id === renamingTab ? { ...t, name: renameValue.trim() } : t
      ));
    }
    setRenamingTab(null);
    setRenameValue('');
  }, [renamingTab, renameValue]);

  const updateActiveTabSql = useCallback((sql: string) => {
    setEditorTabs(prev => prev.map(t =>
      t.id === activeEditorTab ? { ...t, sql } : t
    ));
  }, [activeEditorTab]);

  return {
    editorTabs,
    setEditorTabs,
    activeEditorTab,
    setActiveEditorTab,
    renamingTab,
    setRenamingTab,
    renameValue,
    setRenameValue,
    renameInputRef,
    handleNewEditorTab,
    handleCloseEditorTab,
    handleEditorTabClick,
    handleStartRename,
    handleFinishRename,
    updateActiveTabSql,
  } as const;
}
