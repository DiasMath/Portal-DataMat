# Portal DATAMAT - Painel Administrativo

## Visão Geral

O painel administrativo (`/admin`) é utilizado para gerir utilizadores, empresas, dashboards e recursos.

## Acesso

Apenas utilizadores com `role: "admin"` ou `role: "master_admin"` podem aceder ao painel.

URL: `https://portal.datamat.com.br/admin`

---

## Página Inicial (/admin)

### Dashboard Administrativo

Mostra:
- **Estatísticas**: Total de utilizadores, empresas, dashboards
- **Atividade Recente**: Log de ações dos últimos utilizadores

### Ferramentas de Administração

| Ferramenta | Descrição |
|------------|-----------|
| Gerenciar Utilizadores | Criar/editar/excluir utilizadores |
| Gerenciar Empresas | Criar/editar empresas |
| Gerenciar Dashboards | Criar/editar dashboards |
| Gerenciar Recursos | Criar/editar recursos |

---

## 1. Gerenciar Utilizadores (/admin/users)

### Lista de Utilizadores

Tabela com colunas:
- Utilizador (nome + email)
- Empresa
- Papel (Master Admin / Admin / User)
- Status (Autorizado / Não Autorizado)
- Último Acesso
- Ações (Editar / Excluir / Redefinir Senha)

### Criar Novo Utilizador

**Campos do formulário:**

| Campo | Obrigatório | Descrição |
|-------|------------|-----------|
| Email | Sim | Email do utilizador |
| Nome de Exibição | Não | NomeShown no sistema |
| Empresa | Não | companyId do utilizador |
| Papel | Sim | user / admin / master_admin |
| Usuário Autorizado | Sim | Pode fazer login |

**Dashboard Padrão (obrigatório):**

| Campo | Obrigatório | Descrição |
|-------|------------|-----------|
| Dashboard Padrão | Sim* | Dashboard inicial do utilizador |
| Texto de ajuda | - | "O usuário será redirecionado para este dashboard ao fazer login" |

*Obrigatório quando: papel ≠ master_admin E não tem acesso total a todas as empresas.

**Permissões de Dashboards:**

- **Checkbox**: "Pode ver TODOS os dashboards de TODAS as empresas"
  - Marcado: `canViewDashboardList = true`, `allowedDashboards = {}`
  - Desmarcado: `canViewDashboardList = false` → Mostra campo de seleção de empresa

- **Lista de empresas** (se acesso total desmarcado):
  - Cada empresa: checkbox para ativar/desativar
  - Se ativos: seleção "Todos" ou "Específicos"
  - Se específicos: checkboxes dos dashboards

**Permissões de Recursos:**

Mesma lógica que dashboards, mas para recursos.

**Permissão de Edição:**

- **Checkbox**: "Pode Criar, Editar e Excluir"
  - Apenas visível para papel "Admin"
  - Se desmarcado, utilizador só pode visualizar

### Editar Utilizador

Mesmo formulário que criar, mas com dados pré-preenchidos.

**Restrições para Master Admin:**
- Nome de exibição (displayName) - **desabilitado**
- Empresa (companyId) - **desabilitado**
- Checkbox "Usuário autorizado" - **não aparece**
- Apenas ação disponível: **Enviar Link para Redefinir Senha**

**Notas:**
- Campo "Role" não editável para Master Admin
- Não pode excluir a si mesmo
- Alterações guardadas no Firestore

### Excluir Utilizador

Botão na coluna "Ações":
- Confirmação
- Remove do Firebase Auth e Firestore

### Enviar Email de redefinição de Senha

Botão na coluna "Ações":
- Envia email para redefinir senha
- Disponível para todos os usuários

---

## 2. Gerenciar Empresas (/admin/companies)

### Lista de Empresas

Tabela com colunas:
- Nome
- PBI Group ID
- Descrição
- Status (Ativo/Inativo)
- Ações

### Criar Nova Empresa

**Campos:**
| Campo | Obrigatório | Descrição |
|-------|------------|-----------|
| Nome | Sim | Nome da empresa |
| PBI Group ID | Sim | ID do grupo no Power BI |
| Descrição | Não | Descrição opcional |
| Ativo | Sim | Empresa ativa |

### Editar/Excluir Empresa

Mesma lógica de criação.

---

## 3. Gerenciar Dashboards (/admin/dashboards)

### Lista de Dashboards

Tabela com colunas:
- Dashboard
- Empresa
- CompanyId
- ReportId
- Status (Ativo)
- Ações

### Criar Novo Dashboard

**Campos:**
| Campo | Obrigatório | Descrição |
|-------|------------|-----------|
| Nome | Sim | Nome do dashboard |
| Empresa | Sim | companyId |
| ReportId | Sim | GUID do report no Power BI |
| Descrição | Não | Descrição opcional |
| Ativo | Sim | Dashboard ativo |
| Padrão | Sim | É o default da empresa |

### Editar/Excluir Dashboard

Mesma lógica de criação.

**Nota:** Se for `isDefault: true`, é aberto automaticamente.

---

## 4. Gerenciar Recursos (/admin/resources)

### Lista de Recursos

Tabela com colunas:
- Recurso
- Tipo
- Empresa
- Status (Ativo)
- Ações

### Criar Novo Recurso

**Campos:**
| Campo | Obrigatório | Descrição |
|-------|------------|-----------|
| Nome | Sim | Nome do recurso |
| Empresa | Sim | companyId |
| Tipo | Sim | form / spreadsheet |
| URL | Sim | URL do Google Form/Sheet |
| Descrição | Não | Descrição opcional |
| Ativo | Sim | Recurso ativo |

**Tipos de Recursos:**
- `form` - Google Forms
- `spreadsheet` - Google Sheets

### Editar/Excluir Recurso

Mesma lógica de criação.

---

## Permissões de Administração

| Ação | Master Admin | Admin (canEdit=true) | User |
|-----|-------------|---------------------|------|
| Ver painel | ✅ | ✅ | ❌ |
| Criar utilizadores | ✅ | ❌ | ❌ |
| Editar utilizadores | ✅ (limitado) | ❌ | ❌ |
| Excluir utilizadores | ✅ | ❌ | ❌ |
| Enviar redefinição de senha | ✅ | ✅ | ❌ |
| Criar empresas | ✅ | ❌ | ❌ |
| Editar empresas | ✅ | ❌ | ❌ |
| Criar dashboards | ✅ | ✅ | ❌ |
| Editar dashboards | ✅ | ✅ | ❌ |
| Criar recursos | ✅ | ✅ | ❌ |
| Editar recursos | ✅ | ✅ | ❌ |

### Restrições ao Editar Master Admin

Ao editar um usuário com papel "master_admin":
- **Campos desabilitados**: Nome de exibição, Empresa
- **Campo oculto**: Usuário autorizado
- **Apenas ação disponível**: Enviar link para redefinir senha

Esta restrição garante que master admins não podem ser bloqueados outer seus dados alteradospor outros admins.

---

## Auditoria

Todas as ações são registadas na coleção `auditLogs`:

```json
{
  "action": "USER_CREATE",
  "actorUid": "admin123",
  "targetType": "user",
  "targetId": "user456",
  "details": { "email": "joao@empresa.com" },
  "createdAt": timestamp
}
```

**Tipos de ação:**
- `USER_CREATE`, `USER_DELETE`, `USER_ROLE_UPDATE`, `USER_AUTHZ_UPDATE`
- `COMPANY_CREATE`, `COMPANY_UPDATE`, `COMPANY_DELETE`
- `DASHBOARD_CREATE`, `DASHBOARD_UPDATE`, `DASHBOARD_DELETE`