'use client';

import React, { useState } from 'react';
import { useStudio } from '../../store/StudioContext';
import { getDataModel } from '../../lib/data-model-utils';
import { TableNode } from './TableNode';
import { MeasureNode } from './MeasureNode';
import { FolderDialog } from '../shared/FolderDialog';
import { Database, PanelRightClose, FolderPlus, Calculator, ChevronDown, ChevronRight, Trash2, Pencil, Plus, Clock } from 'lucide-react';
import { SearchInput } from '../shared/SearchInput';
import type { Measure } from '../../types/dashboard';

export function DataPanel() {
  const { state, dispatch } = useStudio();
  const [searchTerm, setSearchTerm] = useState('');
  const [showMeasures, setShowMeasures] = useState(true);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderDialogParentId, setFolderDialogParentId] = useState<string | undefined>(undefined);

  const dataModel = getDataModel(state.dataModel);
  const measures = dataModel.measures || [];
  const folders = dataModel.measureFolders || [];

  const filteredTables = dataModel.tables.filter(table =>
    table.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.fields.some(f =>
      f.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const filteredMeasures = measures.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.expression.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Separate permanent and temporary measures
  const permanentMeasures = filteredMeasures.filter(m => !m.isTemporary);
  const temporaryMeasures = filteredMeasures.filter(m => m.isTemporary);

  const rootFolders = folders.filter(f => !f.parentId);
  const getFolderMeasures = (folderId: string) => permanentMeasures.filter(m => m.folderId === folderId);
  const getSubFolders = (parentId: string) => folders.filter(f => f.parentId === parentId);

  const handleRenameFolder = (id: string) => {
    if (editFolderName.trim()) {
      dispatch({ type: 'RENAME_MEASURE_FOLDER', payload: { id, name: editFolderName.trim() } });
    }
    setEditingFolderId(null);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <Database size={14} className="text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dados</span>
        </div>
        <button
          onClick={() => dispatch({ type: 'COLLAPSE_DATA_PANEL' })}
          className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Recolher painel"
          aria-label="Recolher painel"
        >
          <PanelRightClose size={14} className="text-muted-foreground" />
        </button>
      </div>

      <div className="px-3 py-2">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Pesquisar tabelas, campos e medidas..."
          className="[&>div>input]:bg-neutral-100 [&>div>input]:dark:bg-neutral-800 [&>div>input]:border-neutral-200 [&>div>input]:dark:border-neutral-700 [&>div>input]:py-1.5"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-1 studio-scrollbar">
        <div className="border-b border-neutral-200 dark:border-neutral-700 pb-1 mb-1">
          <button
            onClick={() => setShowMeasures(!showMeasures)}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            title="Expandir/Recolher"
            aria-label="Expandir/Recolher"
          >
            {showMeasures ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            <Calculator size={10} />
            <span className="flex-1 text-left">Medidas</span>
            <span className="text-muted-foreground/60">{measures.length}</span>
          </button>

          {showMeasures && (
            <div className="ml-2">
              {/* Folders with permanent measures */}
              {rootFolders.map(folder => (
                <FolderSection
                  key={folder.id}
                  folder={folder}
                  measures={getFolderMeasures(folder.id)}
                  subFolders={getSubFolders(folder.id)}
                  folders={folders}
                  getFolderMeasures={getFolderMeasures}
                  getSubFolders={getSubFolders}
                  editingFolderId={editingFolderId}
                  editFolderName={editFolderName}
                  setEditingFolderId={setEditingFolderId}
                  setEditFolderName={setEditFolderName}
                  handleRenameFolder={handleRenameFolder}
                  onAddSubfolder={(parentId) => {
                    setFolderDialogParentId(parentId);
                    setFolderDialogOpen(true);
                  }}
                  dispatch={dispatch}
                />
              ))}

              {/* Unfolded permanent measures */}
              {permanentMeasures.filter(m => !m.folderId).map(measure => (
                <MeasureNode key={measure.id} measure={measure} dispatch={dispatch} />
              ))}

              {/* Temporary measures section */}
              {temporaryMeasures.length > 0 && (
                <div className="mt-2 border-t border-dashed border-violet-500/30 pt-1">
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-medium text-violet-400 uppercase tracking-wider">
                    <Clock size={8} />
                    <span>Temporárias</span>
                    <span className="text-violet-400/60">{temporaryMeasures.length}</span>
                  </div>
                  {temporaryMeasures.map(measure => (
                    <MeasureNode key={measure.id} measure={measure} dispatch={dispatch} />
                  ))}
                </div>
              )}

              {filteredMeasures.length === 0 && rootFolders.length === 0 && (
                <div className="px-3 py-4 text-center text-[10px] text-muted-foreground">
                  Nenhuma medida criada
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tables section */}
        <div className="pt-1">
          <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            <Database size={10} />
            <span className="flex-1">Tabelas</span>
            <span className="text-muted-foreground/60">{filteredTables.length}</span>
          </div>

          {filteredTables.map(table => (
            <TableNode
              key={table.name}
              table={table}
              searchTerm={searchTerm}
            />
          ))}

          {filteredTables.length === 0 && !searchTerm && (
            <div className="px-3 py-6 text-center">
              <Database size={24} className="mx-auto text-muted-foreground/40 mb-2" />
              <div className="text-xs text-muted-foreground">Nenhuma tabela encontrada</div>
              <div className="text-[10px] text-muted-foreground/60 mt-1">Importe dados para comecar</div>
            </div>
          )}
        </div>
      </div>

      <FolderDialog
        open={folderDialogOpen}
        onClose={() => {
          setFolderDialogOpen(false);
          setFolderDialogParentId(undefined);
        }}
        onCreate={(name, parentId) => {
          dispatch({ type: 'ADD_MEASURE_FOLDER', payload: { name, parentId } });
        }}
        folders={folders}
        initialParentId={folderDialogParentId}
      />
    </div>
  );
}

function FolderSection({ folder, measures, subFolders, folders, getFolderMeasures, getSubFolders, editingFolderId, editFolderName, setEditingFolderId, setEditFolderName, handleRenameFolder, onAddSubfolder, dispatch }: {
  folder: { id: string; name: string };
  measures: Measure[];
  subFolders: { id: string; name: string }[];
  folders: { id: string; name: string; parentId?: string }[];
  getFolderMeasures: (id: string) => Measure[];
  getSubFolders: (id: string) => { id: string; name: string }[];
  editingFolderId: string | null;
  editFolderName: string;
  setEditingFolderId: (id: string | null) => void;
  setEditFolderName: (name: string) => void;
  handleRenameFolder: (id: string) => void;
  onAddSubfolder: (parentId: string) => void;
  dispatch: React.Dispatch<import('../../types/state').StudioAction>;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
      <div className="flex items-center gap-1 px-2 py-1 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded group">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-muted-foreground"
          title={isOpen ? 'Recolher secao' : 'Expandir secao'}
          aria-label={isOpen ? 'Recolher secao' : 'Expandir secao'}
        >
          {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        </button>
        <FolderPlus size={10} className="text-amber-500" />
        {editingFolderId === folder.id ? (
          <input
            type="text"
            value={editFolderName}
            onChange={(e) => setEditFolderName(e.target.value)}
            onBlur={() => handleRenameFolder(folder.id)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRenameFolder(folder.id); if (e.key === 'Escape') setEditingFolderId(null); }}
            className="flex-1 text-[10px] bg-transparent border-b border-amber-500 outline-none"
            autoFocus
          />
        ) : (
          <span className="flex-1 text-[10px] text-neutral-700 dark:text-neutral-300 truncate">{folder.name}</span>
        )}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
          <button onClick={() => onAddSubfolder(folder.id)} className="text-muted-foreground hover:text-foreground" title="Nova subpasta" aria-label="Nova subpasta"><Plus size={8} /></button>
          <button onClick={() => { setEditingFolderId(folder.id); setEditFolderName(folder.name); }} className="text-muted-foreground hover:text-foreground" title="Renomear" aria-label="Renomear"><Pencil size={8} /></button>
          <button onClick={() => dispatch({ type: 'REMOVE_MEASURE_FOLDER', payload: folder.id })} className="text-muted-foreground hover:text-red-400" title="Excluir" aria-label="Excluir"><Trash2 size={8} /></button>
        </div>
      </div>
      {isOpen && (
        <div className="ml-3">
          {subFolders.map(sub => (
            <FolderSection
              key={sub.id}
              folder={sub}
              measures={getFolderMeasures(sub.id)}
              subFolders={getSubFolders(sub.id)}
              folders={folders}
              getFolderMeasures={getFolderMeasures}
              getSubFolders={getSubFolders}
              editingFolderId={editingFolderId}
              editFolderName={editFolderName}
              setEditingFolderId={setEditingFolderId}
              setEditFolderName={setEditFolderName}
              handleRenameFolder={handleRenameFolder}
              onAddSubfolder={onAddSubfolder}
              dispatch={dispatch}
            />
          ))}
          {measures.map(m => (
            <MeasureNode key={m.id} measure={m} dispatch={dispatch} />
          ))}
        </div>
      )}
    </div>
  );
}
