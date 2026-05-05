# Portal DATAMAT - Documentação

## Visão Geral

O Portal DATAMAT é uma aplicação web que permite aos utilizadores visualizar dashboards do Power BI e recursos (formulários e planilhas Google) das empresas às quais têm acesso.

**Tecnologias:**
- **Frontend**: Next.js 16 com React, TypeScript
- **UI**: Shadcn/UI (Tailwind CSS)
- **Backend**: Firebase (Firestore, Authentication)
- **Integração**: Power BI Embedded

---

## Índice

| # | Arquivo | Descrição |
|---|---------|-----------|
| 1 | [1-visao-geral.md](./1-visao-geral.md) | Visão geral do sistema, tecnologias e estrutura |
| 2 | [2-permissoes.md](./2-permissoes.md) | Sistema de permissões, perfis, estrutura no Firestore |
| 3 | [3-fluxo-utilizacao.md](./3-fluxo-utilizacao.md) | Fluxo de uso, login, menus, redirects, cenários |
| 4 | [4-painel-administrativo.md](./4-painel-administrativo.md) | Como usar o painel admin, criar utilizadores, etc |
| 5 | [5-estrutura-banco-dados.md](./5-estrutura-banco-dados.md) | Esquema do Firestore, tabelas, campos |

---

## Quick Links (URLs)

- **Login**: `/login`
- **Dashboard**: `/dashboard`
- **Recursos**: `/resources`
- **Painel Admin**: `/admin`
- **Criar Utilizador**: `/admin/users`
- **Gestão de Empresas**: `/admin/companies`
- **Gestão de Dashboards**: `/admin/dashboards`
- **Gestão de Recursos**: `/admin/resources`

---

## Glossário

| Termo | Descrição |
|-------|-----------|
| canViewDashboardList | Permissão de ver lista de dashboards de todas as empresas |
| canViewResourceList | Permissão de ver lista de recursos de todas as empresas |
| allowedDashboards | Permissões específicas de dashboards por empresa |
| allowedResources | Permissões específicas de recursos por empresa |
| defaultDashboardId | ID do dashboard padrão do utilizador |
| Admin | Administrador com acesso ao painel |
| Company ID | ID único da empresa no Firestore |
| isDefault | Flag para dashboard padrão |
| PBI Group ID | ID do grupo no Power BI |
| Embedded | Integração Power BI no frontend |
| sessionStorage | Armazenamento de sessão (evita redirect loops) |

---

## Autenticação e Sessão

### Firebase Auth (Cliente)
- Login em `/login` com email e senha
- `AuthContext` monitora o estado e lê o documento do usuário em `users/{uid}`

### Cookie de Sessão
- HTTP-only com expiração de 8 horas
- Criado via `/api/auth/session` após login
- Removido no logout explícito

### Firebase Admin (Servidor)
- APIs sensíveis validam token e permissions via `src/lib/auth-helpers.ts`

---

## Fluxos Importantes

### 1. Login do Usuário

```
1. Usuário acessa /login → email + senha
2. Frontend chama /api/users/check-email
3. Firebase Auth faz signInWithEmailPassword
4. AuthContext cria cookie de sessão
5. Redirect:
   - admin → /admin
   - user → /dashboard (ou defaultDashboardId)
```

### 2. Criação de Usuário (Admin)

```
1. admin vai para /admin/users
2. Preenche: email, nome, empresa, papel, authorized
3. Define permissões de dashboards e recursos
4. Define dashboard padrão (obrigatório)
5. API cria no Firebase Auth + Firestore

### 3. Reset de Senha

- Link "Esqueceu a senha?" em `/login` → `/forgot-password`
- admin pode enviar link via `/admin/users` (edição)
- Requisitos: 6+ caracteres, minúscula, maiúscula, especial

### 4. Visualização de Dashboards

- **user**: Redirect para `/dashboard/{companyId}/{defaultDashboardId}`
- **admin**: Voir lista de dashboards da empresa → embed

---

## Variáveis de Ambiente

Crie `.env.local` na raiz do projeto:

```env
# Firebase (client)
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."

# Firebase Admin (service account em JSON)
FIREBASE_SERVICE_ACCOUNT_KEY="{\"type\":\"service_account\", ...}"

# Power BI / Azure AD
PBI_TENANT_ID="..."
PBI_CLIENT_ID="..."
PBI_CLIENT_SECRET="..."
PBI_AUTHORITY_URL="https://login.microsoftonline.com/"
PBI_SCOPE="https://analysis.windows.net/powerbi/api/.default"
PBI_API_BASE_URL="https://api.powerbi.com/v1.0/myorg/"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **Nota**: `pbiGroupId` e `pbiReportId` são mantidos no Firestore (coleções `companies` e `dashboards`).

---

## Como Rodar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar .env.local
# (preencher variáveis acima)

# 3. Rodar servidor
npm run dev

# 4. Acessar
http://localhost:3000
```

---

## Deploy (CI/CD)

O projeto inclui workflows em `.github/workflows`:

| Workflow | Descrição |
|---------|---------|
| `ci.yml` | Build, lint e testes |
| `cd-development.yml` | Deploy para dev (branch `dev`) |
| `cd-production.yml` | Deploy para produção (branch `prod`) |

**Secrets necessários no GitHub:**
- Firebase: `*_NEXT_PUBLIC_FIREBASE_*`
- Firebase Admin: `FIREBASE_SERVICE_ACCOUNT_KEY`
- Power BI: `PBI_TENANT_ID`, `PBI_CLIENT_ID`, `PBI_CLIENT_SECRET`, etc.

**Processo de deploy:**
1. Build no GitHub (`npm run build`)
2. Empacota `.next`, `public`, `package*.json`
3. Envia para servidor via `scp`
4. Cria/atualiza `.env.production`
5. Instala dependências e reinicia com **PM2**

---

## Como Ler a Documentação

### Para Entender o Sistema em Geral
1. Leia [1-visao-geral.md](./1-visao-geral.md)
2. Leia [2-permissoes.md](./2-permissoes.md)

### Para Configurar Utilizadores
1. Leia [2-permissoes.md](./2-permissoes.md)
2. Leia [4-painel-administrativo.md](./4-painel-administrativo.md)

### Para Desenvolver/Manter
1. Leia [5-estrutura-banco-dados.md](./5-estrutura-banco-dados.md)
2. Veja o código em `src/`

---

## Arquivo Raiz (README.md)

> ⚠️ O arquivo `README.md` na raiz do projeto está **deprecado**. Use esta pasta `Documentacao/` para a documentação atualizada.