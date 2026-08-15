# ModelView — Plano Backend

## Status: 🟡 Parcialmente Implementado

O ModelView tem importação de schema via ImportDialog, mas não persiste o modelo no servidor.

---

## O que foi feito

### 1. ImportDialog (funcional)
- Lista conexões MySQL disponíveis
- Lista tabelas do banco selecionado
- Preview de 10 rows
- Importa schema completo (tabelas, campos, relações)
- Converte MySQL types → FieldSchema types
- Auto-detect relações via foreign keys do MySQL
- Posiciona tabelas em grid layout

### 2. ModelView UI (funcional)
- Canvas SVG com tabelas arrastáveis
- Linhas de relacionamento com cardinalidade
- Zoom/Pan
- Abas de views do modelo
- Toggle de relacionamentos (ativo/inativo)

---

## O que falta

### Fase 1 — Persistência do Modelo

**Problema**: Tudo é in-memory. Se o usuário recarrega a página, o modelo é perdido (volta para MOCK_DATA_MODEL).

**Solução**:
- `GET /api/studio/models/:dashboardId` — buscar modelo salvo
- `PUT /api/studio/models/:dashboardId` — salvar modelo completo
- Integrar com dashboard save/load

### Fase 2 — Operações Individuais

**Problema**: Qualquer mudança ao modelo requer salvar todo o state.

**Solução**:
- `POST /api/studio/models/:id/tables` — adicionar tabela
- `DELETE /api/studio/models/:id/tables/:name` — remover tabela
- `POST /api/studio/models/:id/relationships` — adicionar relação
- `PUT /api/studio/models/:id/relationships/:relId` — atualizar relação
- `DELETE /api/studio/models/:id/relationships/:relId` — remover relação

### Fase 3 — Auto-detect Server-Side

**Problema**: Auto-detect usa heurística frontend (nome com `_id`). Não consulta o banco real.

**Solução**:
- `POST /api/studio/models/:id/detect-relationships`
- Server lê `INFORMATION_SCHEMA.KEY_COLUMN_USAGE` para encontrar FKs
- Retorna relacionamentos candidatos para o usuário confirmar

### Fase 4 — Melhorias de UI

| Feature | Prioridade |
|---------|-----------|
| Auto-layout (organizar tabelas automaticamente) | Média |
| Propriedades de tabela/campo no painel lateral | Média |
| Hierarquias de campos | Baixa |
| Sort by column | Baixa |

---

## API Endpoints Necessários

| Endpoint | Método | Função | Prioridade |
|----------|--------|--------|-----------|
| `/api/studio/models/:dashboardId` | GET | Buscar modelo | **CRÍTICA** |
| `/api/studio/models/:dashboardId` | PUT | Salvar modelo | **CRÍTICA** |
| `/api/studio/models/:id/tables` | POST | Adicionar tabela | Média |
| `/api/studio/models/:id/tables/:name` | DELETE | Remover tabela | Média |
| `/api/studio/models/:id/relationships` | POST | Adicionar relação | Média |
| `/api/studio/models/:id/relationships/:relId` | PUT/DELETE | Atualizar/remover | Média |
| `/api/studio/models/:id/detect-relationships` | POST | Auto-detect FK server-side | Média |

---

## Schema do Banco (Firestore)

```
studio_models/{dashboardId}
├── name: string
├── description: string
├── connectionId: string
├── tables: TableSchema[]
├── relationships: Relationship[]
├── measures: Measure[]
├── measureFolders: MeasureFolder[]
├── calculatedColumns: CalculatedColumn[]
├── calculatedTables: CalculatedTable[]
└── views: ModelViewTab[]
```

---

## Padrões Verificados no Código

### `loadStudioConnection()` — Conexão MySQL

A função está duplicada (não é shared helper) em:
- `src/app/api/studio/preview-table/route.ts`
- `src/app/api/studio/import-schema/route.ts`

```typescript
// Retorno esperado:
{ host: string, port: number, user: string, password: string, database: string } | null

// Dependências:
- adminDb (Firebase Admin SDK)
- decrypt / isEncrypted (@/lib/crypto)
- Collection: 'studio_connections'
```

Para auto-detect FK server-side (Fase 3), esta função será necessária para conectar ao MySQL e ler `INFORMATION_SCHEMA.KEY_COLUMN_USAGE`.
