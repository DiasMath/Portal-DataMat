'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSqlWorkbench } from '@/contexts/SqlWorkbenchContext';
import type { Snippet } from '@/types/sql-workbench';
import { Plus, FileCode, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

const DEFAULT_CATEGORY = 'Geral';

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

/** Agrupa snippets por categoria — mesmo padrão do `TemplatesDropdown` do Studio. */
function groupByCategory(snippets: Snippet[]): Record<string, Snippet[]> {
  const groups: Record<string, Snippet[]> = {};
  for (const snippet of snippets) {
    const category = snippet.category || DEFAULT_CATEGORY;
    if (!groups[category]) groups[category] = [];
    groups[category].push(snippet);
  }
  return groups;
}

export function SnippetsToolbar() {
  const { state, dispatch } = useSqlWorkbench();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [snippetSql, setSnippetSql] = useState('');
  const [loading, setLoading] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const openAddDialog = () => {
    setSnippetSql(state.tabs.find(t => t.id === state.activeTabId)?.sql || '');
    setNewTitle('');
    setNewCategory('');
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

  const grouped = useMemo(() => groupByCategory(snippets), [snippets]);
  const existingCategories = useMemo(
    () => Array.from(new Set(snippets.map((s) => s.category || DEFAULT_CATEGORY))).sort(),
    [snippets]
  );

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category); else next.add(category);
      return next;
    });
  };

  const insertSnippet = (sql: string) => {
    if (state.activeTabId) {
      const currentSql = state.tabs.find(t => t.id === state.activeTabId)?.sql;
      dispatch({
        type: 'UPDATE_TAB',
        payload: {
          id: state.activeTabId,
          updates: {
            sql: currentSql ? `${currentSql}\n${sql}` : sql,
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
    if (!newTitle.trim()) return;
    if (!snippetSql.trim()) return;

    try {
      const res = await fetch('/api/sql/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'snippet',
          data: { title: newTitle, sql: snippetSql, category: newCategory.trim() || DEFAULT_CATEGORY },
        }),
      });
      if (res.ok) {
        setShowAddDialog(false);
        setNewTitle('');
        setNewCategory('');
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
            title="Salvar query atual como snippet"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
            Carregando...
          </div>
        ) : snippets.length === 0 ? (
          <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
            Nenhum snippet ainda
          </div>
        ) : (
          Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([category, items]) => {
            const isCollapsed = collapsedCategories.has(category);
            return (
              <div key={category}>
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center gap-1 px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-accent/30 hover:bg-accent/50 transition-colors"
                >
                  {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {category} ({items.length})
                </button>
                {!isCollapsed && items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => insertSnippet(item.sql)}
                    className="group flex items-start gap-2 px-3 py-2 hover:bg-accent cursor-pointer border-b border-border/50 transition-colors"
                  >
                    <FileCode className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">{item.title}</div>
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
                ))}
              </div>
            );
          })
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Salvar como snippet</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="snippet-title">Nome</Label>
              <Input
                id="snippet-title"
                placeholder="Nome do snippet"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="snippet-category">Categoria</Label>
              <Input
                id="snippet-category"
                list="snippet-categories"
                placeholder={DEFAULT_CATEGORY}
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="bg-background border-border"
              />
              <datalist id="snippet-categories">
                {existingCategories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
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
              Cancelar
            </Button>
            <Button onClick={saveSnippet} disabled={!newTitle.trim() || !snippetSql.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
