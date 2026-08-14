import type { DataModel } from '../../types/dashboard';

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function generateVendasRows(count: number): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (let i = 1; i <= count; i++) {
    const r1 = seededRandom(i);
    const r2 = seededRandom(i + 1000);
    const r3 = seededRandom(i + 2000);
    const r4 = seededRandom(i + 3000);
    const r5 = seededRandom(i + 4000);
    const r6 = seededRandom(i + 5000);
    const r7 = seededRandom(i + 6000);

    const month = Math.floor(r1 * 12) + 1;
    const day = Math.floor(r2 * 28) + 1;
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');

    const isClienteNull = r3 < 0.05;
    const isProdutoNull = r4 < 0.03;
    const isDataNull = r5 < 0.02;
    const isDataEmpty = !isDataNull && r5 < 0.04;
    const isQtdNull = r6 < 0.05;
    const isValorNull = r7 < 0.03;
    const isCustoNull = r7 < 0.06;
    const isDescNull = r7 < 0.05;

    const quantidade = isQtdNull ? null : Math.floor(r1 * 20) + 1;
    const preco = 50 + r2 * 450;
    const valor = quantidade != null ? Math.round(quantidade * preco * 100) / 100 : null;
    const custoRatio = 0.3 + r3 * 0.4;
    const custo = valor != null ? Math.round(valor * custoRatio * 100) / 100 : null;
    const desconto = isDescNull ? null : Math.floor(r4 * 50);

    rows.push({
      id_venda: i,
      id_cliente: isClienteNull ? null : 101 + Math.floor(r1 * 20),
      id_produto: isProdutoNull ? null : 201 + Math.floor(r2 * 15),
      data_venda: isDataNull ? null : isDataEmpty ? '' : `2024-${mm}-${dd}`,
      quantidade,
      valor_total: isValorNull ? null : valor,
      custo: isCustoNull ? null : custo,
      desconto,
    });
  }
  return rows;
}

const ALL_VENDAS = generateVendasRows(1000);
export const VENDAS_DEFAULT_LIMIT = 100;

export const MOCK_TABLE_ROWS: Record<string, Record<string, unknown>[]> = {
  fato_vendas: ALL_VENDAS,
  dim_cliente: [
    { id_cliente: 101, nome: 'João Silva', cidade: 'São Paulo', estado: 'SP', segmento: 'Corporate', data_cadastro: '2023-01-10' },
    { id_cliente: 102, nome: 'Maria Santos', cidade: 'Rio de Janeiro', estado: 'RJ', segmento: 'Enterprise', data_cadastro: '2023-02-15' },
    { id_cliente: 103, nome: 'Pedro Costa', cidade: 'Belo Horizonte', estado: 'MG', segmento: 'SMB', data_cadastro: '2023-03-20' },
    { id_cliente: 104, nome: 'Ana Oliveira', cidade: 'Curitiba', estado: 'PR', segmento: 'Corporate', data_cadastro: '2023-04-05' },
    { id_cliente: 105, nome: 'Lucas Ferreira', cidade: 'Porto Alegre', estado: 'RS', segmento: 'Enterprise', data_cadastro: '2023-05-12' },
    { id_cliente: 106, nome: 'Juliana Lima', cidade: 'Salvador', estado: 'BA', segmento: 'SMB', data_cadastro: '2023-06-18' },
    { id_cliente: 107, nome: 'Fernando Alves', cidade: 'Brasília', estado: 'DF', segmento: 'Corporate', data_cadastro: '2023-07-22' },
  ],
  dim_produto: [
    { id_produto: 201, nome_produto: 'Notebook Dell', categoria: 'Eletrônicos', sub_categoria: 'Computadores', preco_unitario: 4500.00, fornecedor: 'Dell' },
    { id_produto: 202, nome_produto: 'Mouse Logitech', categoria: 'Eletrônicos', sub_categoria: 'Periféricos', preco_unitario: 89.90, fornecedor: 'Logitech' },
    { id_produto: 203, nome_produto: 'Cadeira Ergonômica', categoria: 'Móveis', sub_categoria: 'Cadeiras', preco_unitario: 1200.00, fornecedor: 'Herman Miller' },
    { id_produto: 204, nome_produto: 'Monitor Samsung', categoria: 'Eletrônicos', sub_categoria: 'Monitores', preco_unitario: 1800.00, fornecedor: 'Samsung' },
    { id_produto: 205, nome_produto: 'Teclado Mecânico', categoria: 'Eletrônicos', sub_categoria: 'Periféricos', preco_unitario: 350.00, fornecedor: 'Keychron' },
    { id_produto: 206, nome_produto: 'Webcam HD', categoria: 'Eletrônicos', sub_categoria: 'Periféricos', preco_unitario: 180.00, fornecedor: 'Logitech' },
    { id_produto: 207, nome_produto: 'Headset Gamer', categoria: 'Eletrônicos', sub_categoria: 'Áudio', preco_unitario: 299.90, fornecedor: 'HyperX' },
    { id_produto: 208, nome_produto: 'Mesa Escritório', categoria: 'Móveis', sub_categories: 'Mesas', preco_unitario: 890.00, fornecedor: 'IKEA' },
  ],
  dim_vendedor: [
    { id_vendedor: 301, nome_vendedor: 'Carlos Vendas', equipe: 'Comercial SP', regiao: 'Sudeste' },
    { id_vendedor: 302, nome_vendedor: 'Patricia Vendas', equipe: 'Comercial RJ', regiao: 'Sudeste' },
    { id_vendedor: 303, nome_vendedor: 'Roberto Vendas', equipe: 'Comercial Sul', regiao: 'Sul' },
    { id_vendedor: 304, nome_vendedor: 'Fernanda Vendas', equipe: 'Comercial Nordeste', regiao: 'Nordeste' },
  ],
  dim_calendario: [
    { data: '2024-01-01', ano: 2024, mes: 1, mes_nome: 'Janeiro', trimestre: 'Q1', dia_semana: 'Segunda' },
    { data: '2024-02-01', ano: 2024, mes: 2, mes_nome: 'Fevereiro', trimestre: 'Q1', dia_semana: 'Quinta' },
    { data: '2024-03-01', ano: 2024, mes: 3, mes_nome: 'Março', trimestre: 'Q1', dia_semana: 'Sexta' },
    { data: '2024-04-01', ano: 2024, mes: 4, mes_nome: 'Abril', trimestre: 'Q2', dia_semana: 'Segunda' },
    { data: '2024-05-01', ano: 2024, mes: 5, mes_nome: 'Maio', trimestre: 'Q2', dia_semana: 'Quarta' },
    { data: '2024-06-01', ano: 2024, mes: 6, mes_nome: 'Junho', trimestre: 'Q2', dia_semana: 'Sexta' },
  ],
};

export const MOCK_DATA_MODEL: DataModel = {
  id: 'mock-model-1',
  name: 'Modelo de Vendas',
  tables: [
    {
      name: 'fato_vendas',
      label: 'Vendas',
      type: 'fact',
      position: { x: 400, y: 80 },
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
      position: { x: 100, y: 50 },
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
      position: { x: 700, y: 50 },
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
      position: { x: 100, y: 350 },
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
      position: { x: 700, y: 350 },
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
      active: true,
    },
    {
      id: 'rel-2',
      fromTable: 'fato_vendas',
      fromField: 'id_produto',
      toTable: 'dim_produto',
      toField: 'id_produto',
      cardinality: 'N:1',
      active: true,
    },
    {
      id: 'rel-3',
      fromTable: 'fato_vendas',
      fromField: 'data_venda',
      toTable: 'dim_calendario',
      toField: 'data',
      cardinality: 'N:1',
      active: true,
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
