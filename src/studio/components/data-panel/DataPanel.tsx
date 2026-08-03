'use client';

import React, { useState } from 'react';
import { useStudio } from '../../store/StudioContext';
import { MOCK_DATA_MODEL } from '../../lib/mock-data';
import { TableNode } from './TableNode';
import { MeasureNode } from './MeasureNode';
import { Database, Search, PanelRightClose, FolderPlus, Calculator, ChevronDown, ChevronRight, Trash2, Pencil } from 'lucide-react';
import type { Measure } from '../../types/dashboard';

export function DataPanel() {
  const { state, dispatch } = useStudio();
  const [searchTerm, setSearchTerm] = useState('');
  const [showMeasures, setShowMeasures] = useState(true);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');

  const dataModel = state.dataModel || MOCK_DATA_MODEL;
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

  const rootFolders = folders.filter(f => !f.parentId);
  const getFolderMeasures = (folderId: string) => filteredMeasures.filter(m => m.folderId === folderId);
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
        >
          <PanelRightClose size={14} className="text-muted-foreground" />
        </button>
      </div>

      <div className="px-3 py-2">
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar tabelas, campos e medidas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-2 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1 studio-scrollbar">
        <div className="border-b border-neutral-200 dark:border-neutral-700 pb-1 mb-1">
          <button
            onClick={() => setShowMeasures(!showMeasures)}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
          >
            {showMeasures ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            <Calculator size={10} />
            <span className="flex-1 text-left">Medidas</span>
            <span className="text-muted-foreground/60">{measures.length}</span>
          </button>

          {showMeasures && (
            <div className="ml-2">
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
                  dispatch={dispatch}
                />
              ))}

              {filteredMeasures.filter(m => !m.folderId).map(measure => (
                <MeasureNode key={measure.id} measure={measure} dispatch={dispatch} />
              ))}

              {filteredMeasures.length === 0 && rootFolders.length === 0 && (
                <div className="px-3 py-4 text-center text-[10px] text-muted-foreground">
                  Nenhuma medida criada
                </div>
              )}
            </div>
          )}
        </div>

        {filteredTables.map(table => (
          <TableNode
            key={table.name}
            table={table}
            searchTerm={searchTerm}
          />
        ))}

        {filteredTables.length === 0 && !searchTerm && (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            Nenhuma tabela encontrada
          </div>
        )}
      </div>
    </div>
  );
}

function FolderSection({ folder, measures, subFolders, folders, getFolderMeasures, getSubFolders, editingFolderId, editFolderName, setEditingFolderId, setEditFolderName, handleRenameFolder, dispatch }: {
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
  dispatch: React.Dispatch<import('../../types/state').StudioAction>;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
      <div className="flex items-center gap-1 px-2 py-1 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded group">
        <button onClick={() => setIsOpen(!isOpen)} className="text-muted-foreground">
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
          <button onClick={() => { setEditingFolderId(folder.id); setEditFolderName(folder.name); }} className="text-muted-foreground hover:text-foreground"><Pencil size={8} /></button>
          <button onClick={() => dispatch({ type: 'REMOVE_MEASURE_FOLDER', payload: folder.id })} className="text-muted-foreground hover:text-red-400"><Trash2 size={8} /></button>
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
