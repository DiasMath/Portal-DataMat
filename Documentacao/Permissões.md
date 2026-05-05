# Portal DATAMAT - Sistema de Permissões

## Visão Geral

O sistema de permissões do Portal DATAMAT é baseado em dois conceitos principais:

1. **Permissão de Lista** (`canViewDashboardList`, `canViewResourceList`) - Define se o utilizador pode ver a lista de todas as empresas
2. **Acesso por Empresa** (`allowedDashboards`, `allowedResources`) - Define quais dashboards/recursos o utilizador pode ver por empresa

## Estrutura de Permissões (Firestore)

A tabela `users` no Firestore contém o objeto `permissions` com a seguinte estrutura:

```typescript
interface UserPermissions {
  canViewDashboardList: boolean;    // Pode ver a lista de TODAS as empresas (dashboards)
  canViewResourceList: boolean;   // Pode ver a lista de TODAS as empresas (recursos)
  canEdit: boolean;             // Pode criar/editar/excluir (apenas admins)
  allowedDashboards: {
    [companyId: string]: "all" | string[]  // Acesso a empresas específicas
  };
  allowedResources: {
    [companyId: string]: "all" | string[]  // Acesso a empresas específicas
  };
}
```

## Cenários de Permissão

### 1. Administrador com Acesso Total a 1 Empresa

```json
{
  "role": "admin",
  "companyId": "empresaABC",
  "permissions": {
    "canViewDashboardList": true,
    "canViewResourceList": true,
    "canEdit": true,
    "allowedDashboards": {},
    "allowedResources": {}
  }
}
```

**Comportamento:**
- Vê lista de TODAS as empresas
- Pode aceder a TODOS os dashboards/recursos
- Vê o botão "Voltar"

### 3. Administrador com Acesso Específico a 1 Empresa (Todos dashboards)

```json
{
  "role": "admin",
  "permissions": {
    "canViewDashboardList": false,
    "canViewResourceList": false,
    "canEdit": false,
    "allowedDashboards": {
      "empresaABC": "all"
    },
    "allowedResources": {
      "empresaABC": "all"
    }
  }
}
```

**Comportamento:**
- Redirect direto para `/dashboard/empresaABC` (sem lista de empresas)
- Vê lista de dashboards dessa empresa
- Não vê o botão "Voltar"

### 4. Administrador com Acesso a Múltiplas Empresas (Sem acesso total)

```json
{
  "role": "admin",
  "permissions": {
    "canViewDashboardList": false,
    "canViewResourceList": false,
    "canEdit": false,
    "allowedDashboards": {
      "empresaABC": "all",
      "empresaXYZ": "all"
    },
    "allowedResources": {
      "empresaABC": "all"
    }
  }
}
```

**Comportamento:**
- redirect direto para `/dashboard` → mostra lista de empresas (empresaABC, empresaXYZ)
- Não vê o botão "Voltar" (não pode ver lista de todas)
- Quando clica em empresa → mostra dashboards dessa empresa

### 5. Administrador com Acesso a Dashboards Específicos

```json
{
  "role": "admin",
  "permissions": {
    "canViewDashboardList": false,
    "canViewResourceList": false,
    "canEdit": false,
    "allowedDashboards": {
      "empresaABC": ["dashboard1", "dashboard3"]
    }
  }
}
```

**Comportamento:**
- Redirect para `/dashboard/empresaABC`
- Só mostra dashboards "dashboard1" e "dashboard3" dessa empresa
- Não mostra os outros dashboards

### 6. Utilizador Normal (User Comum)

```json
{
  "role": "user",
  "companyId": "empresaABC",
  "defaultDashboardId": "dashboard1",
  "permissions": {
    "canViewDashboardList": false,
    "canViewResourceList": false,
    "canEdit": false,
    "allowedDashboards": {},
    "allowedResources": {}
  }
}
```

**Comportamento:**
- Redirect automático para `/dashboard/empresaABC/dashboard1` (default)

---

## Fluxo de Redirect (dashboard/page.tsx)

```
1. Utilizador clica em "Dashboard" no menu
   ↓
2. Verifica canViewDashboardList?
   ├─ TRUE → MasterAdminCompaniesView (lista TODAS empresas)
   │
   └─ FALSE → Verifica allowedDashboards
               │
               ├─ 0 empresas → Usa companyId do utilizador
               │               ↓
               │           redirect para /dashboard/{companyId}
               │
               ├─ 1 empresa → redirect para /dashboard/{empresaUnica}
               │
               └─ múltiplas empresas → MasterAdminCompaniesView (lista filtrada)
```

## Fluxo de Redirect (resources/page.tsx)

```
1. Utilizador clica em "Recursos" no menu
   ↓
2. Verifica canViewResourceList?
   ├─ TRUE → MasterAdminResourcesView (lista TODAS empresas)
   │
   └─ FALSE → Verifica allowedResources
               │
               ├─ 0 empresas → Usa companyId do utilizador
               │               ↓
               │           redirect para /resources/{companyId}
               │
               ├─ 1 empresa → redirect para /resources/{empresaUnica}
               │
               └─ múltiplas empresas → MasterAdminResourcesView (lista filtrada)
```

## Botão "Voltar"

O botão "Voltar" só aparece quando o utilizador pode ver a lista de empresas (`canViewList = true`):

- **Admin com canViewList = true**: Vê botão "Voltar"
- **Admin com canViewList = false**: Não vê botão "Voltar"

---

## Configuração de Dashboard Padrão

O utilizador pode ter um `defaultDashboardId` definido no Firestore:

```json
{
  "uid": "user123",
  "email": "joao@empresa.com",
  "companyId": "empresaABC",
  "defaultDashboardId": "vendasMensais",
  "role": "user"
}
```

Quando o utilizador faz login:
1. Se tem `defaultDashboardId` → Redirect para `/dashboard/{companyId}/{defaultDashboardId}`

---

## Criação/Edição de Utilizadores (Painel Admin)

No formulário de criação/edição de utilizadores (`/admin/users`), existem duas sessões principais:

### 1. Sessões Dashboards

- **Checkbox**: "Pode ver TODOS os dashboards de TODAS as empresas"
  - Se marcado → `canViewDashboardList = true`, `allowedDashboards = {}`
  - Se desmarcado → `canViewDashboardList = false` → Mostra campo de seleção de empresa

- **Campo Dashboard Padrão** (obrigatório quando não tem acesso total):
  - Obrigatório para usuários normais (role=user ou admin com canViewDashboardList=false)
  - Usuário é redirecionado para este dashboard ao fazer login
  - Campo só aparece após selecionar uma empresa

- **Lista de empresas** (se não tem acesso total):
  - Permite selecionar quais empresas o utilizador pode ver
  - Para cada empresa: "all" ou lista de dashboards específicos

### 2. Sessões Recursos

- **Checkbox**: "Pode ver TODOS os recursos de TODAS as empresas"
  - Se marcado → `canViewResourceList = true`, `allowedResources = {}`
  - Se desmarcado → `canViewResourceList = false` → Mostra lista de empresas

- **Lista de empresas** (se não tem acesso total):
  - Permite selecionar quais empresas o utilizador pode ver
  - Para cada empresa: "all" ou lista de recursos específicos

---

## Validações no Frontend (Criação/Edição de Utilizadores)

O formulário de criação/edição de utilizadores valida os seguintes campos antes de enviar:

### Validation Rules

1. **Dashboard Padrão é obrigatório** quando:
   - Não tem permissão "Pode ver todos os dashboards"
   - Tem uma empresa selecionada

### Exemplos de Validação

```json
// ✅ VÁLIDO - usuário normal com dashboard padrão
{
  "role": "user",
  "companyId": "empresaABC",
  "defaultDashboardId": "vendas",
  "permissions": {
    "canViewDashboardList": false
  }
}

// ✅ VÁLIDO - admin com acesso total
{
  "role": "admin",
  "companyId": "empresaABC",
  "permissions": {
    "canViewDashboardList": true
  }
}

// ❌ INVÁLIDO - precisa de defaultDashboardId
{
  "role": "user",
  "companyId": "empresaABC",
  "defaultDashboardId": "",  // VAZIO!
  "permissions": {
    "canViewDashboardId": false
  }
}
```

**Mensagem de erro:** "Selecione um Dashboard Padrão para este usuário."

---

## Validações no Backend

A API de criação de utilizadores (`/api/users/create`) força regras de segurança:

```typescript
// Se canViewDashboardList = true E allowedDashboards = {} → Acesso total
const hasFullDashboardAccess = permissions?.canViewDashboardList === true && 
  (!permissions?.allowedDashboards || Object.keys(permissions.allowedDashboards).length === 0);
```

Isto garante que:
- `canViewDashboardList = true` + `allowedDashboards = {}` = Acesso total
- `canViewDashboardList = false` + `allowedDashboards = {}` = Redirect para empresa própria