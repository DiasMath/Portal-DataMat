'use client';

import React, { useState, useMemo } from 'react';
import { useStudio } from '../../store/StudioContext';
import { MOCK_DATA_MODEL } from '../../lib/mock-data';
import { Table, Search, ChevronDown, ChevronRight, Hash, Type, Calendar, ToggleLeft } from 'lucide-react';
import type { TableSchema } from '../../types/dashboard';

const MOCK_TABLE_ROWS: Record<string, Record<string, unknown>[]> = {
  fato_vendas: [
    { id_venda: 1, id_cliente: 101, id_produto: 201, data_venda: '2024-01-15', quantidade: 5, valor_total: 1250.00, custo: 875.00, desconto: 125.00 },
    { id_venda: 2, id_cliente: 102, id_produto: 202, data_venda: '2024-01-16', quantidade: 3, valor_total: 890.00, custo: 623.00, desconto: 89.00 },
    { id_venda: 3, id_cliente: 103, id_produto: 201, data_venda: '2024-01-17', quantidade: 8, valor_total: 2100.00, custo: 1470.00, desconto: 210.00 },
    { id_venda: 4, id_cliente: 101, id_produto: 203, data_venda: '2024-01-18', quantidade: 2, valor_total: 450.00, custo: 315.00, desconto: 45.00 },
    { id_venda: 5, id_cliente: 104, id_produto: 202, data_venda: '2024-01-19', quantidade: 6, valor_total: 1680.00, custo: 1176.00, desconto: 168.00 },
    { id_venda: 6, id_cliente: 105, id_produto: 204, data_venda: '2024-01-20', quantidade: 4, valor_total: 920.00, custo: 644.00, desconto: 92.00 },
    { id_venda: 7, id_cliente: 102, id_produto: 201, data_venda: '2024-01-21', quantidade: 7, valor_total: 1890.00, custo: 1323.00, desconto: 189.00 },
    { id_venda: 8, id_cliente: 106, id_produto: 205, data_venda: '2024-01-22', quantidade: 1, valor_total: 320.00, custo: 224.00, desconto: 32.00 },
    { id_venda: 9, id_cliente: 103, id_produto: 203, data_venda: '2024-01-23', quantidade: 10, valor_total: 2750.00, custo: 1925.00, desconto: 275.00 },
    { id_venda: 10, id_cliente: 107, id_produto: 202, data_venda: '2024-01-24', quantidade: 3, valor_total: 780.00, custo: 546.00, desconto: 78.00 },
  ],
  dim_cliente: [
    { id_cliente: 101, nome: 'João Silva', cidade: 'São Paulo', estado: 'SP', segmento: 'Corporate', data_cadastro: '2023-06-15' },
    { id_cliente: 102, nome: 'Maria Santos', cidade: 'Rio de Janeiro', estado: 'RJ', segmento: 'Enterprise', data_cadastro: '2023-07-20' },
    { id_cliente: 103, nome: 'Pedro Costa', cidade: 'Belo Horizonte', estado: 'MG', segmento: 'SMB', data_cadastro: '2023-08-10' },
    { id_cliente: 104, nome: 'Ana Oliveira', cidade: 'Curitiba', estado: 'PR', segmento: 'Corporate', data_cadastro: '2023-09-05' },
    { id_cliente: 105, nome: 'Lucas Ferreira', cidade: 'Porto Alegre', estado: 'RS', segmento: 'Enterprise', data_cadastro: '2023-10-12' },
    { id_cliente: 106, nome: 'Juliana Lima', cidade: 'Salvador', estado: 'BA', segmento: 'SMB', data_cadastro: '2023-11-01' },
    { id_cliente: 107, nome: 'Roberto Almeida', cidade: 'Brasília', estado: 'DF', segmento: 'Corporate', data_cadastro: '2023-12-08' },
  ],
  dim_produto: [
    { id_produto: 201, nome_produto: 'Notebook Pro', categoria: 'Eletrônicos', sub_categoria: 'Computadores', preco_unitario: 4500.00, fornecedor: 'TechCorp' },
    { id_produto: 202, nome_produto: 'Mouse Wireless', categoria: 'Eletrônicos', sub_categoria: 'Periféricos', preco_unitario: 89.90, fornecedor: 'PerifTech' },
    { id_produto: 203, nome_produto: 'Cadeira Ergonômica', categoria: 'Móveis', sub_categoria: 'Cadeiras', preco_unitario: 1200.00, fornecedor: 'MóveisPlus' },
    { id_produto: 204, nome_produto: 'Monitor 27"', categoria: 'Eletrônicos', sub_categoria: 'Monitores', preco_unitario: 1800.00, fornecedor: 'TechCorp' },
    { id_produto: 205, nome_produto: 'Teclado Mecânico', categoria: 'Eletrônicos', sub_categoria: 'Periféricos', preco_unitario: 320.00, fornecedor: 'PerifTech' },
  ],
  dim_vendedor: [
    { id_vendedor: 301, nome_vendedor: 'Carlos Mendes', equipe: 'Comercial SP', regiao: 'Sudeste' },
    { id_vendedor: 302, nome_vendedor: 'Fernanda Rocha', equipe: 'Comercial RJ', regiao: 'Sudeste' },
    { id_vendedor: 303, nome_vendedor: 'Marcos Souza', equipe: 'Comercial MG', regiao: 'Sudeste' },
    { id_vendedor: 304, nome_vendedor: 'Patricia Dias', equipe: 'Comercial PR', regiao: 'Sul' },
    { id_vendedor: 305, nome_vendedor: 'Ricardo Nunes', equipe: 'Comercial RS', regiao: 'Sul' },
  ],
  dim_calendario: [
    { data: '2024-01-01', ano: 2024, mes: 1, mes_nome: 'Janeiro', trimestre: 'T1', dia_semana: 'Segunda' },
    { data: '2024-02-01', ano: 2024, mes: 2, mes_nome: 'Fevereiro', trimestre: 'T1', dia_semana: 'Quinta' },
    { data: '2024-03-01', ano: 2024, mes: 3, mes_nome: 'Março', trimestre: 'T1', dia_semana: 'Sexta' },
    { data: '2024-04-01', ano: 2024, mes: 4, mes_nome: 'Abril', trimestre: 'T2', dia_semana: 'Segunda' },
    { data: '2024-05-01', ano: 2024, mes: 5, mes_nome: 'Maio', trimestre: 'T2', dia_semana: 'Quarta' },
    { data: '2024-06-01', ano: 2024, mes: 6, mes_nome: 'Junho', trimestre: 'T2', dia_semana: 'Sábado' },
  ],
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  number: <Hash size={10} className="text-amber-500" />,
  string: <Type size={10} className="text-green-500" />,
  date: <Calendar size={10} className="text-purple-500" />,
  boolean: <ToggleLeft size={10} className="text-orange-500" />,
};

export function DataView() {
  const { state } = useStudio();
  const dataModel = state.dataModel || MOCK_DATA_MODEL;
  const [selectedTableName, setSelectedTableName] = useState<string | null>(null);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set(['fato_vendas']));
  const [searchTerm, setSearchTerm] = useState('');

  const selectedTable = dataModel.tables.find(t => t.name === selectedTableName);

  const toggleExpand = (tableName: string) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      if (next.has(tableName)) {
        next.delete(tableName);
      } else {
        next.add(tableName);
      }
      return next;
    });
  };

  const filteredTables = dataModel.tables.filter(t =>
    t.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex bg-neutral-900 overflow-hidden">
      <div className="w-56 shrink-0 border-r border-neutral-700 bg-neutral-900 flex flex-col">
        <div className="px-3 py-2 border-b border-neutral-700">
          <div className="flex items-center gap-2 mb-2">
            <Table size={14} className="text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">TABELAS</span>
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar tabelas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-6 pr-2 py-1 text-xs bg-neutral-800 rounded border border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {filteredTables.map(table => {
            const isExpanded = expandedTables.has(table.name);
            const isSelected = selectedTableName === table.name;
            const rows = MOCK_TABLE_ROWS[table.name] || [];

            return (
              <div key={table.name}>
                <button
                  onClick={() => {
                    setSelectedTableName(table.name);
                    toggleExpand(table.name);
                  }}
                  className={`w-full flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors
                    ${isSelected
                      ? 'bg-amber-600/20 text-amber-400'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300'
                    }
                  `}
                >
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <Table size={12} className={table.type === 'fact' ? 'text-amber-500' : 'text-amber-300'} />
                  <span className="font-medium truncate">{table.label}</span>
                  <span className="ml-auto text-[9px] text-muted-foreground">{rows.length}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedTable ? (
          <>
            <div className="px-4 py-2 border-b border-neutral-700 flex items-center gap-2">
              <Table size={14} className={selectedTable.type === 'fact' ? 'text-amber-500' : 'text-amber-300'} />
              <span className="text-sm font-medium text-neutral-300">{selectedTable.label}</span>
              <span className="text-[10px] text-muted-foreground bg-neutral-800 px-1.5 py-0.5 rounded">
                {selectedTable.fields.length} colunas
              </span>
              <span className="text-[10px] text-muted-foreground bg-neutral-800 px-1.5 py-0.5 rounded">
                {(MOCK_TABLE_ROWS[selectedTable.name] || []).length} linhas
              </span>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-neutral-800 border-b border-neutral-700">
                  <tr>
                    {selectedTable.fields.map(field => (
                      <th
                        key={field.name}
                        className="px-3 py-2 text-left font-medium text-neutral-400 whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1.5">
                          {TYPE_ICONS[field.type]}
                          <span>{field.label || field.name}</span>
                          {field.isAggregatable && (
                            <span className="text-[8px] text-amber-400 bg-amber-400/10 px-1 rounded">#</span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(MOCK_TABLE_ROWS[selectedTable.name] || []).map((row, i) => (
                    <tr key={i} className="border-b border-neutral-800 hover:bg-neutral-800/50">
                      {selectedTable.fields.map(field => (
                        <td key={field.name} className="px-3 py-1.5 text-neutral-300 whitespace-nowrap">
                          {String(row[field.name] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Table size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Selecione uma tabela para visualizar os dados</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
