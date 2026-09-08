/**
 * Fonte única dos atalhos de teclado do SQL Workbench.
 *
 * Antes existiam duas cópias divergentes: o `ShortcutSettings.tsx` deixava
 * o usuário "remapear" teclas e salvava no localStorage, mas o handler de
 * verdade em `SqlWorkbench.tsx` tinha as combinações hardcoded e nunca lia
 * essa configuração — customizar um atalho não tinha efeito nenhum. Este
 * módulo é usado pelos dois lados, então uma mudança aqui realmente muda o
 * comportamento.
 */

export type ShortcutAction =
  | 'executeQuery'
  | 'newTab'
  | 'closeTab'
  | 'toggleSidebar'
  | 'toggleResults'
  | 'formatSql'
  | 'saveQuery'
  | 'splitHorizontal'
  | 'splitVertical'
  | 'toggleHighlight';

export const DEFAULT_SHORTCUTS: Record<ShortcutAction, string> = {
  executeQuery: 'Ctrl+Enter',
  // Ctrl+N e Ctrl+W são reservados pelo navegador (nova janela / fechar
  // aba) e não podem ser interceptados via JS em nenhum browser moderno —
  // qualquer app web que "usa" essas combinações na verdade não está
  // fazendo nada, o navegador ignora o preventDefault. Por isso os
  // padrões usam Ctrl+Alt.
  newTab: 'Ctrl+Alt+N',
  closeTab: 'Ctrl+Alt+W',
  toggleSidebar: 'Ctrl+B',
  toggleResults: 'Ctrl+E',
  formatSql: 'Ctrl+Shift+F',
  saveQuery: 'Ctrl+S',
  splitHorizontal: 'Ctrl+Shift+H',
  splitVertical: 'Ctrl+Shift+V',
  toggleHighlight: 'Ctrl+Shift+G',
};

export const SHORTCUT_LABELS: Record<ShortcutAction, string> = {
  executeQuery: 'Executar query',
  newTab: 'Nova aba',
  closeTab: 'Fechar aba',
  toggleSidebar: 'Mostrar/ocultar sidebar',
  toggleResults: 'Mostrar/ocultar resultados',
  formatSql: 'Formatar SQL',
  saveQuery: 'Salvar query',
  splitHorizontal: 'Dividir horizontalmente',
  splitVertical: 'Dividir verticalmente',
  toggleHighlight: 'Destacar duplicados',
};

export const SHORTCUTS_STORAGE_KEY = 'sql_workbench_shortcuts';

export function loadShortcuts(): Record<ShortcutAction, string> {
  if (typeof window === 'undefined') return DEFAULT_SHORTCUTS;
  try {
    const saved = window.localStorage.getItem(SHORTCUTS_STORAGE_KEY);
    if (!saved) return DEFAULT_SHORTCUTS;
    const parsed = JSON.parse(saved);
    return { ...DEFAULT_SHORTCUTS, ...parsed };
  } catch {
    return DEFAULT_SHORTCUTS;
  }
}

export function saveShortcuts(shortcuts: Record<ShortcutAction, string>): void {
  window.localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(shortcuts));
}

/** Normaliza um KeyboardEvent pro mesmo formato de string usado em DEFAULT_SHORTCUTS (ex: "Ctrl+Shift+F"). */
export function eventToShortcutString(e: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean; key: string }): string | null {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');

  const keyName = e.key;
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(keyName)) return null;
  parts.push(keyName.length === 1 ? keyName.toUpperCase() : keyName);

  // Exige pelo menos um modificador — evita capturar uma tecla solta sem querer.
  if (parts.length < 2) return null;
  return parts.join('+');
}

/** Compara um KeyboardEvent contra uma string de atalho salva (ex: "Ctrl+Shift+F"). */
export function matchesShortcut(e: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.split('+');
  const wantsCtrl = parts.includes('Ctrl');
  const wantsShift = parts.includes('Shift');
  const wantsAlt = parts.includes('Alt');
  const keyPart = parts[parts.length - 1];

  const hasCtrl = e.ctrlKey || e.metaKey;
  if (wantsCtrl !== hasCtrl) return false;
  if (wantsShift !== e.shiftKey) return false;
  if (wantsAlt !== e.altKey) return false;

  if (keyPart.length === 1) {
    return e.key.toLowerCase() === keyPart.toLowerCase();
  }
  return e.key === keyPart || e.key.toLowerCase() === keyPart.toLowerCase();
}
