'use client';

import React, { useState } from 'react';
import { useStudio } from '../../store/StudioContext';
import { useRouter } from 'next/navigation';
import { FolderDialog } from '../shared/FolderDialog';
import { useToast } from '../shared/Toast';
import {
  ArrowLeft,
  Save,
  Eye,
  Clipboard,
  Database,
  RefreshCw,
  Plus,
  Type,
  Square,
  Image,
  Filter,
  Undo2,
  Redo2,
  Calculator,
  Link2,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  FileText,
  BarChart3,
  LineChart,
  PieChart,
  Settings,
  Lock,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Rows3,
  Columns3,
  Layers,
  Table,
  Timer,
} from 'lucide-react';

type RibbonTab = 'arquivo' | 'inicio' | 'inserir' | 'medidas' | 'modelagem' | 'exibicao' | 'ajuda';

const RIBBON_TABS: { key: RibbonTab; label: string }[] = [
  { key: 'arquivo', label: 'Arquivo' },
  { key: 'inicio', label: 'Início' },
  { key: 'inserir', label: 'Inserir' },
  { key: 'medidas', label: 'Medidas' },
  { key: 'modelagem', label: 'Modelagem' },
  { key: 'exibicao', label: 'Exibição' },
  { key: 'ajuda', label: 'Ajuda' },
];

export function RibbonToolbar() {
  const { state, dispatch, canUndo, canRedo } = useStudio();
  const router = useRouter();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<RibbonTab>('inicio');
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);

  const handleBack = () => {
    router.push('/dashboard');
  };

  const handleSave = () => {
    const dashboardData = {
      title: state.dashboardName,
      description: state.dashboardDescription,
      pages: state.pages,
      dataModel: state.dataModel,
      globalFilters: state.globalFilters,
    };
    dispatch({ type: 'SET_SAVING', payload: true });
    dispatch({ type: 'SAVE_DASHBOARD' });
    fetch('/api/studio/dashboards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dashboardId: state.dashboardId || `dashboard-${Date.now()}`, data: dashboardData }),
    }).then((res) => {
      if (!res.ok) throw new Error('Save failed');
      dispatch({ type: 'SET_SAVING', payload: false });
      dispatch({ type: 'MARK_CLEAN' });
      dispatch({ type: 'SET_LAST_SAVED_AT', payload: new Date().toISOString() });
      addToast('Dashboard salvo com sucesso!', 'success');
    }).catch(() => {
      dispatch({ type: 'SET_SAVING', payload: false });
      addToast('Erro ao salvar dashboard', 'error');
    });
  };

  const handleVisualizar = () => {
    dispatch({ type: 'SAVE_VIEWER_STATE' });
    const dashboardId = state.dashboardId || 'new';
    window.open(`/studio/${dashboardId}/viewer`, '_blank');
  };

  const activePage = state.pages.find(p => p.id === state.activePageId);
  const hasAnyLocked = activePage?.visuals.some(v => v.locked) ?? false;
  const selectedCount = state.selectedVisualIds.length;

  return (
    <div className="shrink-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 select-none">
      <div className="h-9 flex items-center px-2 gap-2 border-b border-neutral-100 dark:border-neutral-800">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Portal</span>
        </button>

        <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700" />

        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 font-[family-name:var(--font-orbitron)]">
            DATA<span className="text-amber-500">STUDIO</span>
          </span>
        </div>

        <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700" />

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {state.dashboardName}
          </span>
          {state.isSaving && (
            <span className="text-[10px] text-amber-500">Salvando...</span>
          )}
          {!state.isSaving && state.lastSavedAt && !state.isDirty && (
            <span className="text-[10px] text-green-500">
              Salvo às {new Date(state.lastSavedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {!state.isSaving && state.isDirty && (
            <span className="text-[10px] text-amber-500">●</span>
          )}
        </div>

        <div className="flex-1" />

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
          title="Salvar (Ctrl+S)"
        >
          <Save size={14} />
          Salvar
        </button>

        <button
          onClick={handleVisualizar}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
          title="Visualizar (abre em nova aba)"
        >
          <Eye size={14} />
          Visualizar
        </button>
      </div>

      <div className="flex items-center h-8 px-1 gap-0 border-b border-neutral-100 dark:border-neutral-800">
        {RIBBON_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1 text-xs font-medium transition-colors rounded-t
              ${activeTab === tab.key
                ? 'bg-neutral-100 dark:bg-neutral-800 text-amber-600 dark:text-amber-400 border-b-2 border-amber-500'
                : 'text-muted-foreground hover:text-foreground hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="h-14 flex items-center px-3 gap-1 overflow-x-auto">
        {activeTab === 'inicio' && (
          <>
            <RibbonGroup label="Área de transferência">
              <RibbonButton
                icon={<Clipboard size={16} />}
                label="Colar"
                disabled={!state.clipboard}
                onClick={() => dispatch({ type: 'PASTE_VISUAL' })}
              />
            </RibbonGroup>

            <RibbonDivider />

            <RibbonGroup label="Dados">
              <RibbonButton icon={<Database size={16} />} label="Obter dados" onClick={() => dispatch({ type: 'OPEN_IMPORT_DIALOG' })} />
              <RibbonButton icon={<RefreshCw size={16} />} label="Atualizar" soon />
            </RibbonGroup>

            <RibbonDivider />

            <RibbonGroup label="Alinhar">
              <RibbonButton
                icon={<AlignStartHorizontal size={16} />}
                label="Esquerda"
                disabled={selectedCount < 2}
                onClick={() => dispatch({ type: 'ALIGN_VISUALS', payload: 'left' })}
              />
              <RibbonButton
                icon={<AlignCenterHorizontal size={16} />}
                label="Centro H"
                disabled={selectedCount < 2}
                onClick={() => dispatch({ type: 'ALIGN_VISUALS', payload: 'center-h' })}
              />
              <RibbonButton
                icon={<AlignEndHorizontal size={16} />}
                label="Direita"
                disabled={selectedCount < 2}
                onClick={() => dispatch({ type: 'ALIGN_VISUALS', payload: 'right' })}
              />
              <RibbonButton
                icon={<AlignStartVertical size={16} />}
                label="Topo"
                disabled={selectedCount < 2}
                onClick={() => dispatch({ type: 'ALIGN_VISUALS', payload: 'top' })}
              />
              <RibbonButton
                icon={<AlignCenterVertical size={16} />}
                label="Centro V"
                disabled={selectedCount < 2}
                onClick={() => dispatch({ type: 'ALIGN_VISUALS', payload: 'center-v' })}
              />
              <RibbonButton
                icon={<AlignEndVertical size={16} />}
                label="Base"
                disabled={selectedCount < 2}
                onClick={() => dispatch({ type: 'ALIGN_VISUALS', payload: 'bottom' })}
              />
            </RibbonGroup>

            <RibbonDivider />

            <RibbonGroup label="Distribuir">
              <RibbonButton
                icon={<Columns3 size={16} />}
                label="Horizontal"
                disabled={selectedCount < 3}
                onClick={() => dispatch({ type: 'DISTRIBUTE_VISUALS', payload: 'horizontal' })}
              />
              <RibbonButton
                icon={<Rows3 size={16} />}
                label="Vertical"
                disabled={selectedCount < 3}
                onClick={() => dispatch({ type: 'DISTRIBUTE_VISUALS', payload: 'vertical' })}
              />
            </RibbonGroup>

            <RibbonDivider />

            <RibbonGroup label="Histórico">
              <RibbonButton
                icon={<Undo2 size={16} />}
                label="Desfazer"
                disabled={!canUndo}
                onClick={() => dispatch({ type: 'UNDO' })}
              />
              <RibbonButton
                icon={<Redo2 size={16} />}
                label="Refazer"
                disabled={!canRedo}
                onClick={() => dispatch({ type: 'REDO' })}
              />
            </RibbonGroup>

            <RibbonDivider />

            <RibbonGroup label="Segurança">
              <RibbonButton icon={<Lock size={16} />} label="Gerenciar Funções" soon />
              <RibbonButton icon={<Lock size={16} />} label="RLS" soon />
            </RibbonGroup>
          </>
        )}

        {activeTab === 'inserir' && (() => {
          const visualCount = activePage?.visuals.length ?? 0;
          const nextX = 50 + (visualCount % 4) * 350;
          const nextY = 50 + Math.floor(visualCount / 4) * 300;
          return (
            <>
              <RibbonGroup label="Visualizações">
                <RibbonButton icon={<BarChart3 size={16} />} label="Barras" onClick={() => dispatch({ type: 'ADD_VISUAL', payload: { type: 'bar', x: nextX, y: nextY } })} />
                <RibbonButton icon={<LineChart size={16} />} label="Linha" onClick={() => dispatch({ type: 'ADD_VISUAL', payload: { type: 'line', x: nextX, y: nextY } })} />
                <RibbonButton icon={<PieChart size={16} />} label="Pizza" onClick={() => dispatch({ type: 'ADD_VISUAL', payload: { type: 'pie', x: nextX, y: nextY } })} />
              </RibbonGroup>

              <RibbonDivider />

              <RibbonGroup label="Elementos">
                <RibbonButton icon={<Type size={16} />} label="Caixa de texto" onClick={() => dispatch({ type: 'ADD_TEXT_BOX', payload: { x: nextX, y: nextY } })} />
                <RibbonButton icon={<Square size={16} />} label="Formas" soon />
                <RibbonButton icon={<Image size={16} />} label="Imagem" soon />
              </RibbonGroup>

              <RibbonDivider />

              <RibbonGroup label="Cálculos">
                <RibbonButton icon={<Filter size={16} />} label="Novo filtro" onClick={() => dispatch({ type: 'EXPAND_FILTERS_PANEL' })} />
                <RibbonButton icon={<Calculator size={16} />} label="Medida" onClick={() => dispatch({ type: 'OPEN_MEASURE_EDITOR' })} />
                <RibbonButton icon={<Table size={16} />} label="Coluna Calculada" onClick={() => dispatch({ type: 'OPEN_CALCULATED_COLUMN_EDITOR' })} />
                <RibbonButton icon={<Database size={16} />} label="Tabela Calculada" onClick={() => dispatch({ type: 'OPEN_CALCULATED_TABLE_EDITOR' })} />
              </RibbonGroup>
            </>
          );
        })()}

        {activeTab === 'medidas' && (
          <>
            <RibbonGroup label="Medidas">
              <RibbonButton
                icon={<Calculator size={16} />}
                label="Nova Medida"
                accent
                onClick={() => dispatch({ type: 'OPEN_MEASURE_EDITOR' })}
              />
              <RibbonButton
                icon={<Timer size={16} />}
                label="Medida Temporária"
                onClick={() => dispatch({ type: 'OPEN_MEASURE_EDITOR', isTemporary: true })}
              />
              <RibbonButton
                icon={<Plus size={16} />}
                label="Nova Pasta"
                onClick={() => setFolderDialogOpen(true)}
              />
            </RibbonGroup>

            <RibbonDivider />

            {state.selectedMeasureId && (
              <>
                <RibbonGroup label="Formatação da Medida">
                  <RibbonButton
                    icon={<Settings size={16} />}
                    label="Abrir Editor"
                    onClick={() => dispatch({ type: 'OPEN_MEASURE_EDITOR', payload: state.selectedMeasureId })}
                  />
                </RibbonGroup>

                <RibbonDivider />
              </>
            )}

            <RibbonGroup label="Formato">
              <RibbonButton
                icon={<Settings size={16} />}
                label="Formatar medida"
                disabled={!state.dataModel?.measures?.length}
                onClick={() => dispatch({ type: 'OPEN_MEASURE_EDITOR', payload: state.dataModel?.measures?.[0]?.id ?? null })}
              />
            </RibbonGroup>
          </>
        )}

        {activeTab === 'modelagem' && (
          <>
            <RibbonGroup label="Relacionamentos">
              <RibbonButton icon={<Link2 size={16} />} label="Gerenciar" onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'model' })} />
            </RibbonGroup>
          </>
        )}

        {activeTab === 'exibicao' && (
          <>
            <RibbonGroup label="Mostrar">
              <RibbonButton
                icon={<Grid3X3 size={16} />}
                label="Grade"
                active={state.showGrid}
                onClick={() => dispatch({ type: 'TOGGLE_GRID' })}
              />
              <RibbonButton
                icon={<Layers size={16} />}
                label="Camadas"
                active={state.selectionPaneVisible}
                onClick={() => dispatch({ type: 'TOGGLE_SELECTION_PANE' })}
              />
            </RibbonGroup>

            <RibbonDivider />

            <RibbonGroup label="Zoom">
              <RibbonButton icon={<ZoomOut size={16} />} label="Zoom -" onClick={() => dispatch({ type: 'SET_CANVAS_ZOOM', payload: Math.max(0.1, state.canvasZoom - 0.1) })} />
              <RibbonButton icon={<ZoomIn size={16} />} label="Zoom +" onClick={() => dispatch({ type: 'SET_CANVAS_ZOOM', payload: Math.min(3, state.canvasZoom + 0.1) })} />
            </RibbonGroup>

            <RibbonDivider />

            <RibbonGroup label="Proteção">
              <RibbonButton
                icon={<Lock size={16} />}
                label="Bloquear todos"
                active={hasAnyLocked}
                onClick={() => dispatch({ type: 'TOGGLE_LOCK_ALL' })}
              />
            </RibbonGroup>
          </>
        )}

        {activeTab === 'arquivo' && (
          <>
            <RibbonGroup label="Arquivo">
              <RibbonButton icon={<FileText size={16} />} label="Novo" soon />
              <RibbonButton icon={<Save size={16} />} label="Salvar" onClick={handleSave} />
              <RibbonButton icon={<Database size={16} />} label="Importar" soon />
            </RibbonGroup>
          </>
        )}

        {activeTab === 'ajuda' && (
          <>
            <RibbonGroup label="Ajuda">
              <RibbonButton icon={<HelpCircle size={16} />} label="Documentação" soon />
              <RibbonButton icon={<Settings size={16} />} label="Configurações" soon />
            </RibbonGroup>
          </>
        )}
      </div>

      <FolderDialog
        open={folderDialogOpen}
        onClose={() => setFolderDialogOpen(false)}
        onCreate={(name, parentId) => {
          dispatch({ type: 'ADD_MEASURE_FOLDER', payload: { name, parentId } });
        }}
        folders={state.dataModel?.measureFolders || []}
      />
    </div>
  );
}

function RibbonGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-1">
      <div className="flex items-center gap-0.5">
        {children}
      </div>
      <span className="text-[9px] text-muted-foreground leading-none mt-0.5">{label}</span>
    </div>
  );
}

function RibbonButton({
  icon,
  label,
  accent,
  active,
  disabled,
  soon,
  onClick,
  iconOnly,
}: {
  icon: React.ReactNode;
  label: string;
  accent?: boolean;
  active?: boolean;
  disabled?: boolean;
  soon?: boolean;
  onClick?: () => void;
  iconOnly?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || soon}
      className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded transition-colors min-w-[48px]
        ${disabled || soon ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        ${accent ? 'bg-amber-500 text-white hover:bg-amber-600' : ''}
        ${active && !accent ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : ''}
        ${!accent && !active ? 'text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-foreground' : ''}
      `}
      title={soon ? `${label} (em breve)` : label}
    >
      {icon}
      {!iconOnly && <span className="text-[9px] leading-none whitespace-nowrap">{label}</span>}
    </button>
  );
}

function RibbonDivider() {
  return <div className="w-px h-10 bg-neutral-200 dark:bg-neutral-700 mx-1 shrink-0" />;
}
