'use client';

import React, { useState } from 'react';
import { useStudio } from '../../store/StudioContext';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Share2,
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
  const [activeTab, setActiveTab] = useState<RibbonTab>('inicio');

  const handleBack = () => {
    router.push('/dashboard');
  };

  const handleVisualizar = () => {
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

        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
          {state.dashboardName}
        </span>

        {state.isDirty && (
          <span className="text-[10px] text-amber-600 dark:text-amber-400">•</span>
        )}

        <div className="flex-1" />

        <button
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
          title="Salvar (Ctrl+S)"
        >
          <Save size={14} />
          Salvar
        </button>

        <button
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
          title="Compartilhar"
        >
          <Share2 size={14} />
          Compartilhar
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
              <RibbonButton icon={<Database size={16} />} label="Obter dados" soon />
              <RibbonButton icon={<RefreshCw size={16} />} label="Atualizar" soon />
            </RibbonGroup>

            <RibbonDivider />

            <RibbonGroup label="Inserir">
              <RibbonButton
                icon={<Plus size={16} />}
                label="Novo visual"
                accent
                onClick={() => {
                  dispatch({ type: 'ADD_VISUAL', payload: { type: 'bar', x: 50, y: 50 } });
                }}
              />
              <RibbonButton icon={<Type size={16} />} label="Caixa de texto" soon />
              <RibbonButton icon={<Square size={16} />} label="Formas" soon />
              <RibbonButton icon={<Image size={16} />} label="Imagem" soon />
            </RibbonGroup>

            <RibbonDivider />

            <RibbonGroup label="Cálculos">
              <RibbonButton icon={<Filter size={16} />} label="Novo filtro" soon />
              <RibbonButton icon={<Calculator size={16} />} label="Medida" soon />
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
          </>
        )}

        {activeTab === 'inserir' && (
          <>
            <RibbonGroup label="Visualizações">
              <RibbonButton icon={<BarChart3 size={16} />} label="Gráfico de Barras" onClick={() => dispatch({ type: 'ADD_VISUAL', payload: { type: 'bar', x: 50, y: 50 } })} />
              <RibbonButton icon={<BarChart3 size={16} />} label="Gráfico de Linha" onClick={() => dispatch({ type: 'ADD_VISUAL', payload: { type: 'line', x: 50, y: 50 } })} />
              <RibbonButton icon={<BarChart3 size={16} />} label="Gráfico de Pizza" onClick={() => dispatch({ type: 'ADD_VISUAL', payload: { type: 'pie', x: 50, y: 50 } })} />
            </RibbonGroup>

            <RibbonDivider />

            <RibbonGroup label="Elementos">
              <RibbonButton icon={<Type size={16} />} label="Caixa de texto" soon />
              <RibbonButton icon={<Square size={16} />} label="Formas" soon />
              <RibbonButton icon={<Image size={16} />} label="Imagem" soon />
            </RibbonGroup>
          </>
        )}

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
                icon={<Plus size={16} />}
                label="Nova Pasta"
                onClick={() => {
                  const name = prompt('Nome da pasta:');
                  if (name) {
                    dispatch({ type: 'ADD_MEASURE_FOLDER', payload: { name } });
                  }
                }}
              />
            </RibbonGroup>

            <RibbonDivider />

            <RibbonGroup label="Formato">
              <RibbonButton icon={<Settings size={16} />} label="Formatar medida" onClick={() => dispatch({ type: 'OPEN_MEASURE_EDITOR' })} soon={false} />
              <RibbonButton icon={<FileText size={16} />} label="Gerenciar" onClick={() => dispatch({ type: 'OPEN_MEASURE_EDITOR' })} soon={false} />
            </RibbonGroup>
          </>
        )}

        {activeTab === 'modelagem' && (
          <>
            <RibbonGroup label="Cálculos">
              <RibbonButton icon={<Calculator size={16} />} label="Nova Medida" soon />
              <RibbonButton icon={<Calculator size={16} />} label="Nova Coluna" soon />
            </RibbonGroup>

            <RibbonDivider />

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
              <RibbonButton icon={<ZoomOut size={16} />} label="Zoom -" onClick={() => dispatch({ type: 'SET_CANVAS_ZOOM', payload: state.canvasZoom - 0.1 })} />
              <RibbonButton icon={<ZoomIn size={16} />} label="Zoom +" onClick={() => dispatch({ type: 'SET_CANVAS_ZOOM', payload: state.canvasZoom + 0.1 })} />
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
              <RibbonButton icon={<Save size={16} />} label="Salvar" soon />
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
}: {
  icon: React.ReactNode;
  label: string;
  accent?: boolean;
  active?: boolean;
  disabled?: boolean;
  soon?: boolean;
  onClick?: () => void;
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
      <span className="text-[9px] leading-none whitespace-nowrap">{label}</span>
    </button>
  );
}

function RibbonDivider() {
  return <div className="w-px h-10 bg-neutral-200 dark:bg-neutral-700 mx-1 shrink-0" />;
}
