# Portal DATAMAT - Visão Geral do Sistema

## Introdução

O Portal DATAMAT é uma aplicação web que permite aos utilizadores visualizar dashboards do Power BI e recursos (formulários e planilhas Google) das empresas às quais têm acesso.

## Tecnologias

- **Frontend**: Next.js 16 com React, TypeScript
- **UI**: Shadcn/UI (Tailwind CSS)
- **Backend**: Firebase (Firestore, Authentication)
- **Integração**: Power BI Embedded

---

## Arquitetura Funcional

### Autenticação e Sessão

#### Firebase Auth (Cliente)
- Login em `/login` com email e senha
- `AuthContext` (`src/contexts/AuthContext.tsx`) monitora o estado (`onAuthStateChanged`) e lê o documento do usuário em `users/{uid}`

#### Cookie de Sessão HTTP-only
- Expira em **8 horas** (`expiresIn` no Firebase Admin + `maxAge` no cookie)
- Criado após login via `/api/auth/session`
- Removido no logout explícito via `DELETE /api/auth/session`

#### Firebase Admin (Servidor)
- `src/lib/firebase-admin.ts` expõe `adminAuth` e `adminDb`
- APIs sensíveis validam token e permissions via `src/lib/auth-helpers.ts`

### Estrutura de Pastas

```
src/
├── app/                    # Next.js App Router
│   ├── login/             # Página de login
│   ├── dashboard/        # Páginas de dashboards
│   │   └── [companyId]/
│   │       └── [dashboardId]/
│   ├── resources/        # Páginas de recursos
│   ├── admin/          # Painel administrativo
│   └── api/           # API Routes
├── components/
│   ├── layout/          # Header, UserNav, LayoutClient
│   ├── ui/            # Componentes shadcn
│   └── auth/          # ProtectedRoute
├── contexts/            # AuthContext
└── lib/               # firebase, firebase-admin, auth-helpers
```

---

## Utilizadores do Sistema

### Tipos de Utilizadores

| Tipo | Descrição | Acesso |
|------|-----------|---------|
| **Admin** | Administrador da empresa | Dashboards/recursos da sua empresa |
| **User** | Utilizador normal | Apenas dashboard padrão |

### Fluxo de Login

```
1. Utilizador acessa /login
2. Autenticação via Firebase Auth
3. Dados do utilizador carregados do Firestore (tabela users)
4. Se tem defaultDashboardId → Redirect para /dashboard/{companyId}/{defaultDashboardId}
5. sessionStorage marca redirect para evitar loops
```

**Nota**: O sessionStorage é limpo no logout para garantir que o próximo login redirecione corretamente.

### Fluxo de Logout

```
1. Utilizador clica "Sair"
2. sessionStorage.clear()
3. Firebase signOut()
4. Redirect para /login
```

---

## Papéis e Permissões

### Objeto Permissions (Firestore)

```typescript
interface UserPermissions {
  canViewDashboardList: boolean;    // Pode ver TODOS os dashboards
  canViewResourceList: boolean;    // Pode ver TODOS os recursos
  canEdit: boolean;              // Pode criar/editar (apenas admins)
  allowedDashboards: {             // Acesso específico por empresa
    [companyId: string]: "all" | string[];
  };
  allowedResources: {
    [companyId: string]: "all" | string[];
  };
}
```

### defaultDashboardId

Cada utilizador pode ter um `defaultDashboardId` configurado:
- Campo está no formulário de criação/edição de utilizadores
- Usuário é redirecionado automaticamente após login
- Campo está no formulário de criação/edição de utilizadores

### Cenários de Permissão

| Papel | pode ver lista | Dashboard Padrão |
|-------|------------|--------------|
| Admin | ✅ ou ❌ | ✅ |
| User | ❌ | ✅ |

---

## Fluxos de Redirect

### Dashboard (/dashboard)

```
Usuário clica "Dashboard" no menu
        ↓
canViewDashboardList = true?
        ├─ SIM → Lista de TODAS as empresas
        │
        └─ NÃO → Verifica allowedDashboards
                    │
                    ├─ 0 empresas → usa companyId do utilizador
                    │               ↓
                    │           redirect /dashboard/{companyId}
                    │
                    ├─ 1 empresa → redirect /dashboard/{empresaÚnica}
                    │
                    └─ múltiplas → Lista de empresas específicas
```

### Recursos (/resources)

Igual ao dashboard, mas para `canViewResourceList`.

---

## Quick Links

| Recurso | URL |
|---------|-----|
| Login | `/login` |
| Dashboard | `/dashboard` |
| Recursos | `/resources` |
| Admin | `/admin` |
| Gestão Utilizadores | `/admin/users` |
| Gestão Empresas | `/admin/companies` |
| Gestão Dashboards | `/admin/dashboards` |
| Gestão Recursos | `/admin/resources` |

---

## Glossário

| Termo | Descrição |
|-------|-----------|
| canViewDashboardList | Pode ver lista de todas as empresas (dashboards) |
| canViewResourceList | Pode ver lista de todas as empresas (recursos) |
| defaultDashboardId | Dashboard padrão do utilizador |
| sessionStorage | Armazenamento para evitar redirect loops |
| isDefault | Flag para dashboard padrão da empresa |
| pbiGroupId | ID do grupo no Power BI |
| pbiReportId | ID do relatório no Power BI |