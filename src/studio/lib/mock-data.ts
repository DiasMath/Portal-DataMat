import type { DataModel } from '../types/dashboard';

export const MOCK_DATA_MODEL: DataModel = {
  id: 'mock-model-1',
  name: 'Modelo de Vendas',
  tables: [
    {
      name: 'fato_vendas',
      label: 'Vendas',
      type: 'fact',
      parquetPath: 'clientes/001/comercial/fato_vendas.parquet',
      fields: [
        { name: 'id_venda', type: 'number', isAggregatable: false, label: 'ID Venda' },
        { name: 'id_cliente', type: 'number', isAggregatable: false, label: 'ID Cliente' },
        { name: 'id_produto', type: 'number', isAggregatable: false, label: 'ID Produto' },
        { name: 'data_venda', type: 'date', isAggregatable: false, label: 'Data Venda' },
        { name: 'quantidade', type: 'number', isAggregatable: true, label: 'Quantidade' },
        { name: 'valor_total', type: 'number', isAggregatable: true, label: 'Valor Total' },
        { name: 'custo', type: 'number', isAggregatable: true, label: 'Custo' },
        { name: 'desconto', type: 'number', isAggregatable: true, label: 'Desconto' },
      ],
    },
    {
      name: 'dim_cliente',
      label: 'Clientes',
      type: 'dimension',
      fields: [
        { name: 'id_cliente', type: 'number', isAggregatable: false, label: 'ID Cliente' },
        { name: 'nome', type: 'string', isAggregatable: false, label: 'Nome' },
        { name: 'cidade', type: 'string', isAggregatable: false, label: 'Cidade' },
        { name: 'estado', type: 'string', isAggregatable: false, label: 'Estado' },
        { name: 'segmento', type: 'string', isAggregatable: false, label: 'Segmento' },
        { name: 'data_cadastro', type: 'date', isAggregatable: false, label: 'Data Cadastro' },
      ],
    },
    {
      name: 'dim_produto',
      label: 'Produtos',
      type: 'dimension',
      fields: [
        { name: 'id_produto', type: 'number', isAggregatable: false, label: 'ID Produto' },
        { name: 'nome_produto', type: 'string', isAggregatable: false, label: 'Produto' },
        { name: 'categoria', type: 'string', isAggregatable: false, label: 'Categoria' },
        { name: 'sub_categoria', type: 'string', isAggregatable: false, label: 'Sub-categoria' },
        { name: 'preco_unitario', type: 'number', isAggregatable: true, label: 'Preço Unitário' },
        { name: 'fornecedor', type: 'string', isAggregatable: false, label: 'Fornecedor' },
      ],
    },
    {
      name: 'dim_vendedor',
      label: 'Vendedores',
      type: 'dimension',
      fields: [
        { name: 'id_vendedor', type: 'number', isAggregatable: false, label: 'ID Vendedor' },
        { name: 'nome_vendedor', type: 'string', isAggregatable: false, label: 'Nome' },
        { name: 'equipe', type: 'string', isAggregatable: false, label: 'Equipe' },
        { name: 'regiao', type: 'string', isAggregatable: false, label: 'Região' },
      ],
    },
    {
      name: 'dim_calendario',
      label: 'Calendário',
      type: 'dimension',
      fields: [
        { name: 'data', type: 'date', isAggregatable: false, label: 'Data' },
        { name: 'ano', type: 'number', isAggregatable: false, label: 'Ano' },
        { name: 'mes', type: 'number', isAggregatable: false, label: 'Mês' },
        { name: 'mes_nome', type: 'string', isAggregatable: false, label: 'Nome Mês' },
        { name: 'trimestre', type: 'string', isAggregatable: false, label: 'Trimestre' },
        { name: 'dia_semana', type: 'string', isAggregatable: false, label: 'Dia da Semana' },
      ],
    },
  ],
  relationships: [
    {
      id: 'rel-1',
      fromTable: 'fato_vendas',
      fromField: 'id_cliente',
      toTable: 'dim_cliente',
      toField: 'id_cliente',
      cardinality: 'N:1',
    },
    {
      id: 'rel-2',
      fromTable: 'fato_vendas',
      fromField: 'id_produto',
      toTable: 'dim_produto',
      toField: 'id_produto',
      cardinality: 'N:1',
    },
    {
      id: 'rel-3',
      fromTable: 'fato_vendas',
      fromField: 'data_venda',
      toTable: 'dim_calendario',
      toField: 'data',
      cardinality: 'N:1',
    },
  ],
};

export const MOCK_BAR_CHART_DATA = {
  columns: ['mes_nome', 'soma_valor_total'],
  rows: [
    { mes_nome: 'Janeiro', soma_valor_total: 45200 },
    { mes_nome: 'Fevereiro', soma_valor_total: 52100 },
    { mes_nome: 'Março', soma_valor_total: 48700 },
    { mes_nome: 'Abril', soma_valor_total: 61300 },
    { mes_nome: 'Maio', soma_valor_total: 55800 },
    { mes_nome: 'Junho', soma_valor_total: 67400 },
  ],
  executionTime: 12,
};

export const MOCK_LINE_CHART_DATA = {
  columns: ['mes_nome', 'soma_valor_total'],
  rows: [
    { mes_nome: 'Janeiro', soma_valor_total: 45200 },
    { mes_nome: 'Fevereiro', soma_valor_total: 52100 },
    { mes_nome: 'Março', soma_valor_total: 48700 },
    { mes_nome: 'Abril', soma_valor_total: 61300 },
    { mes_nome: 'Maio', soma_valor_total: 55800 },
    { mes_nome: 'Junho', soma_valor_total: 67400 },
  ],
  executionTime: 10,
};

export const MOCK_PIE_CHART_DATA = {
  columns: ['categoria', 'soma_valor_total'],
  rows: [
    { categoria: 'Eletrônicos', soma_valor_total: 125000 },
    { categoria: 'Roupas', soma_valor_total: 89000 },
    { categoria: 'Alimentos', soma_valor_total: 67000 },
    { categoria: 'Móveis', soma_valor_total: 45000 },
    { categoria: 'Outros', soma_valor_total: 32000 },
  ],
  executionTime: 8,
};

export const MOCK_TABLE_DATA = {
  columns: ['nome', 'cidade', 'segmento', 'soma_valor_total'],
  rows: [
    { nome: 'João Silva', cidade: 'São Paulo', segmento: 'Corporate', soma_valor_total: 12500 },
    { nome: 'Maria Santos', cidade: 'Rio de Janeiro', segmento: 'Enterprise', soma_valor_total: 9800 },
    { nome: 'Pedro Costa', cidade: 'Belo Horizonte', segmento: 'SMB', soma_valor_total: 7600 },
    { nome: 'Ana Oliveira', cidade: 'Curitiba', segmento: 'Corporate', soma_valor_total: 11200 },
    { nome: 'Lucas Ferreira', cidade: 'Porto Alegre', segmento: 'Enterprise', soma_valor_total: 15300 },
  ],
  executionTime: 6,
};

export const MOCK_KPI_DATA = {
  columns: ['valor'],
  rows: [{ valor: 330500 }],
  executionTime: 3,
};

export function getMockDataForVisual(type: string) {
  switch (type) {
    case 'bar':
    case 'line':
    case 'area':
      return MOCK_BAR_CHART_DATA;
    case 'pie':
    case 'donut':
      return MOCK_PIE_CHART_DATA;
    case 'table':
      return MOCK_TABLE_DATA;
    case 'kpi':
    case 'card':
      return MOCK_KPI_DATA;
    default:
      return MOCK_BAR_CHART_DATA;
  }
}
