'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSqlWorkbench } from '@/contexts/SqlWorkbenchContext';
import { Plus, FileCode, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Snippet {
  id: string;
  name: string;
  sql: string;
  createdAt: string;
}

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN',
  'IS', 'NULL', 'AS', 'ON', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
  'GROUP', 'BY', 'ORDER', 'ASC', 'DESC', 'LIMIT', 'OFFSET',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
  'CREATE', 'ALTER', 'DROP', 'TABLE', 'INDEX', 'VIEW',
  'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE',
  'BEGIN', 'COMMIT', 'ROLLBACK', 'TRANSACTION',
  'IF', 'THEN', 'ELSE', 'CASE', 'WHEN',
  'EXPLAIN', 'DESCRIBE', 'SHOW', 'USE',
  'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
  'HAVING', 'UNION', 'ALL', 'CROSS', 'NATURAL',
  'AUTO_INCREMENT', 'DEFAULT', 'NOT', 'NULL',
  'PROCEDURE', 'FUNCTION', 'TRIGGER',
  'GRANT', 'REVOKE', 'LOCK', 'UNLOCK',
  'CALL', 'RETURN', 'RETURNS',
];

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function highlightSql(sql: string): string {
  let result = escapeHtml(sql);

  result = result.replace(/&#039;([^&#0\\]|\\.)*&#039;/g, (m) => `<span style="color:#4EC9B0">${m}</span>`);
  result = result.replace(/&quot;([^&quot;\\]|\\.)*&quot;/g, (m) => `<span style="color:#4EC9B0">${m}</span>`);

  result = result.replace(/--.*$/gm, (m) => `<span style="color:#6A9955;font-style:italic">${m}</span>`);

  result = result.replace(/\/\*[\s\S]*?\*\//g, (m) => `<span style="color:#6A9955;font-style:italic">${m}</span>`);

  result = result.replace(/\b(\d+(\.\d+)?)\b/g, (m) => `<span style="color:#B5CEA8">${m}</span>`);

  const kwRegex = new RegExp(`\\b(${SQL_KEYWORDS.join('|')})\\b`, 'gi');
  result = result.replace(kwRegex, (m) => `<span style="color:#FFB03F;font-weight:bold">${m.toUpperCase()}</span>`);

  return result;
}

export function SnippetsToolbar() {
  const { state, dispatch } = useSqlWorkbench();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [snippetSql, setSnippetSql] = useState('');
  const [loading, setLoading] = useState(false);

  const openAddDialog = () => {
    setSnippetSql(state.tabs.find(t => t.id === state.activeTabId)?.sql || '');
    setShowAddDialog(true);
  };

  const fetchSnippets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sql/snippets?type=snippets');
      const data = await res.json();
      if (data.snippets) setSnippets(data.snippets);
    } catch (err) {
      console.error('Failed to fetch snippets:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSnippets();
  }, []);

  const insertSnippet = (sql: string) => {
    if (state.activeTabId) {
      dispatch({
        type: 'UPDATE_TAB',
        payload: {
          id: state.activeTabId,
          updates: {
            sql: state.tabs.find(t => t.id === state.activeTabId)?.sql
              ? `${state.tabs.find(t => t.id === state.activeTabId)!.sql}\n${sql}`
              : sql,
            isDirty: true,
          },
        },
      });
    }
  };

  const deleteSnippet = async (id: string) => {
    try {
      await fetch(`/api/sql/snippets?id=${id}&type=snippet`, { method: 'DELETE' });
      fetchSnippets();
    } catch (err) {
      console.error('Failed to delete snippet:', err);
    }
  };

  const saveSnippet = async () => {
    if (!newName.trim()) return;
    if (!snippetSql.trim()) return;

    try {
      const res = await fetch('/api/sql/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'snippet',
          data: { name: newName, sql: snippetSql },
        }),
      });
      if (res.ok) {
        setShowAddDialog(false);
        setNewName('');
        setSnippetSql('');
        fetchSnippets();
      }
    } catch (err) {
      console.error('Failed to save snippet:', err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <FileCode className="h-4 w-4" />
          Snippets ({snippets.length})
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={openAddDialog}
            className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
            title="Save current query as snippet"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
            Loading...
          </div>
        ) : snippets.length === 0 ? (
          <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
            No snippets yet
          </div>
        ) : (
          snippets.map((item) => (
            <div
              key={item.id}
              onClick={() => insertSnippet(item.sql)}
              className="group flex items-start gap-2 px-3 py-2 hover:bg-accent cursor-pointer border-b border-border/50 transition-colors"
            >
              <FileCode className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground truncate">{item.name}</div>
                <div
                  className="text-xs truncate font-mono leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: highlightSql(item.sql.length > 80 ? item.sql.substring(0, 80) + '...' : item.sql) }}
                />
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteSnippet(item.id); }}
                className="p-0.5 hover:bg-destructive/20 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
                title="Excluir snippet"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
            </div>
          ))
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Save as Snippet</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Snippet name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-background border-border"
            />
            <div className="relative">
              <div
                className="absolute inset-0 pointer-events-none rounded-md border border-border bg-background px-3 py-2 font-mono text-xs leading-relaxed overflow-hidden whitespace-pre-wrap break-all"
                dangerouslySetInnerHTML={{ __html: highlightSql(snippetSql || '') || '<span style="color:#6a6a7e">SQL query</span>' }}
              />
              <textarea
                placeholder="SQL query"
                value={snippetSql}
                onChange={(e) => setSnippetSql(e.target.value)}
                className="w-full rounded-md border border-border bg-transparent px-3 py-2 font-mono text-xs h-[100px] resize-none focus:outline-none focus:ring-1 focus:ring-ring relative text-transparent caret-[#FFB03F]"
                spellCheck={false}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="border-border">
              Cancel
            </Button>
            <Button onClick={saveSnippet} disabled={!newName.trim() || !snippetSql.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
