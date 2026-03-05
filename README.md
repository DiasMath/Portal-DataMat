
## Datamat Portal – Visão Geral

Aplicação Next.js para clientes da **Datamat** visualizarem dashboards do **Power BI**, com:

- **Autenticação** via Firebase (cliente + Admin SDK no servidor).
- **Autorização por função** (`user`, `admin`, `master_admin`) armazenada no Firestore.
- **Arquitetura de dashboards por empresa** usando coleções `companies` e `dashboards`.
- **Fluxo seguro de senha**: o usuário sempre define a própria senha via email de redefinição (sem senha temporária compartilhada).

---

## Arquitetura Funcional

### Autenticação e Sessão

- **Firebase Auth (cliente)**
  - Login em `/login` com email e senha.
  - `AuthContext` (`src/contexts/AuthContext.tsx`) monitora o estado (`onAuthStateChanged`) e lê o documento do usuário em `users/{uid}`.

- **Cookie de sessão HTTP-only com expiração de 8 horas**
  - Após login, o `AuthContext` chama `/api/auth/session` para criar um **session cookie** no servidor usando o ID token do Firebase.
  - Esse cookie:
    - É **HTTP-only** (não acessível via JavaScript).
    - Tem duração máxima de **8 horas** (`expiresIn` no Firebase Admin + `maxAge` no cookie).
    - É verificado de forma simples no `middleware.ts` (presença do cookie).
  - Passadas as 8 horas (ou se o cookie for removido), qualquer acesso a rota protegida:
    - É redirecionado para `/login` (páginas).
    - Recebe `401` (APIs).
  - No logout explícito, o cookie é removido pela rota `DELETE /api/auth/session`.

- **Firebase Admin (servidor)**
  - `src/lib/firebase-admin.ts` expõe `adminAuth` e `adminDb`.
  - APIs sensíveis (como criação de usuários e embed do Power BI) validam o token e os claims via helpers em `src/lib/auth-helpers.ts`.

### Modelo de Dados no Firestore

- **Coleção `users`**
  - Campos principais:
    - `uid`: string (igual ao UID do Firebase Auth)
    - `email`: string
    - `displayName`: string (opcional)
    - `companyId`: string ou `null` (empresa à qual o usuário pertence)
    - `role`: `"user" | "admin" | "master_admin"`
    - `authorized`: boolean (define se o usuário pode acessar o portal)
    - `provider`: `"email"`
    - `createdAt`, `updatedAt`, `lastLogin`: `Timestamp`

- **Coleção `companies`**
  - Representa cada **cliente/empresa**.
  - Campos:
    - `name`: string (nome da empresa)
    - `pbiGroupId`: string (Group/Workspace ID do Power BI)
    - `description`: string (opcional)
    - `active`: boolean

- **Coleção `dashboards`**
  - Representa cada **dashboard (report)** associado a uma empresa.
  - Campos:
    - `name`: string
    - `description`: string (opcional)
    - `companyId`: string (ID de `companies`)
    - `pbiReportId`: string (Report ID do Power BI)
    - `active`: boolean
    - `isDefault`: boolean (marca o dashboard padrão da empresa)

### Papéis e Permissões

- **`user`**
  - Acessa apenas `/dashboard`.
  - É automaticamente redirecionado para o **dashboard padrão** da empresa:
    - `companyId` vem de `userData` (AuthContext).
    - O código busca em `dashboards` um documento com `companyId`, `active = true` e `isDefault = true`.
    - Redireciona para `/dashboard/{companyId}/{dashboardId}` para embed do Power BI.

- **`admin`**
  - Mesmo fluxo de visualização de dashboard que `user` (no momento).
  - Pode futuramente ganhar permissões extras (não há painel específico neste momento).

- **`master_admin`**
  - Acessa `/admin` com painel administrativo completo.
  - Acessa `/dashboard` em modo “master”, vendo:
    - Lista de empresas (`companies`) como cards clicáveis.
    - Ao clicar numa empresa, vai para `/dashboard/{companyId}` com a lista de dashboards dessa empresa.
    - Ao clicar num dashboard, vai para `/dashboard/{companyId}/{dashboardId}` com o embed do relatório.

---

## Estrutura de Pastas

- **`src/app`**
  - `layout.tsx`: layout raiz, aplica fontes, `AuthProvider`, `ThemeProvider`, `Header` e `Toaster`.
  - `globals.css`: configuração de Tailwind + variáveis de tema.
  - **Rotas principais**:
    - `/login` → `src/app/login/page.tsx`
    - `/dashboard` → `src/app/dashboard/page.tsx`
      - Usuário comum: redireciona para dashboard padrão da empresa.
      - `master_admin`: vê grid de empresas (cards).
    - `/dashboard/[companyId]` → lista dashboards da empresa.
    - `/dashboard/[companyId]/[dashboardId]` → embed do Power BI para aquele dashboard específico.
    - `/admin` → painel administrativo principal.
    - `/admin/users` → gestão de usuários.
    - `/admin/companies` → gestão de empresas.
    - `/admin/dashboards` → gestão de dashboards.
  - **APIs**:
    - `api/users/create` → criação de usuários via Firebase Admin.
    - `api/users/delete` → remoção de usuários.
    - `api/users/check-email` → validação de existência de usuário no login.
    - `api/auth/session` → criação/remoção de cookie de sessão.
    - `api/powerbi/get-embed-info/[companyId]/[dashboardId]` → retorna token de embed e URL para o report específico.

- **`src/components`**
  - `components/ui/*`: componentes de UI baseados em shadcn (Button, Input, Card, Dialog, Table, etc.).
  - `components/layout/Header.tsx`: header fixo com logo e `UserNav`, adaptado para rotas de dashboard.
  - `components/layout/UserNav.tsx`: menu do usuário (avatar, email, role, links para `/dashboard` e `/admin`, e logout).
  - `components/auth/ProtectedRoute.tsx`: HOC de proteção de rota no cliente, baseado em `AuthContext`.
  - `components/theme-provider.tsx`: wrapper em torno de `next-themes`.

- **`src/contexts/AuthContext.tsx`**
  - Centraliza:
    - `user` (Firebase Auth)
    - `userData` (documento em `users`)
    - `isAdmin`, `isMasterAdmin`, `isAuthorized`, `companyId`
    - `signInWithEmailPassword`, `signOut`
  - Também é responsável por:
    - Criar/remover o cookie de sessão via `/api/auth/session`.
    - Atualizar `lastLogin` e `updatedAt` no Firestore.

- **`src/lib`**
  - `firebase.ts`: inicialização do Firebase client (Auth + Firestore).
  - `firebase-admin.ts`: inicialização do Firebase Admin (Auth + Firestore Admin).
  - `auth-helpers.ts`: helpers para validar sessão e roles nas APIs.
  - `utils.ts`: utilidades pontuais (ex.: função `isDev`, etc., se aplicável).

---

## Fluxos Importantes

### 1. Login do Usuário

1. Usuário acessa `/login` e informa **email + senha**.
2. O frontend chama `/api/users/check-email` para garantir que o usuário existe e está cadastrado.
3. Se o email existir, usa `signInWithEmailPassword` (Firebase Auth).
4. O `AuthContext`:
   - Escuta o usuário logado.
   - Busca o documento `users/{uid}` no Firestore.
   - Cria o cookie de sessão via `/api/auth/session`.
5. Redirecionamento:
   - `master_admin` e `admin` vão para `/admin`.
   - `user` vai para `/dashboard` (e de lá para o dashboard padrão da empresa).

### 2. Criação de Usuário (Admin)

1. Em `/admin/users`, um usuário `master_admin` abre o modal **“Novo Usuário”**.
2. Campos:
   - Email (obrigatório)
   - Nome de exibição (opcional)
   - Empresa (companyId) – com `datalist` baseado em `companies`
   - Papel (`user` ou `admin`)
   - Flag “Usuário autorizado”
3. Ao salvar, o frontend chama `POST /api/users/create` com esses dados.
4. A API:
   - Valida que quem chamou é `master_admin`.
   - Cria o usuário no Firebase Auth (sem senha inicial explícita no código).
   - Cria o documento em `users/{uid}` no Firestore.
   - Dispara `generatePasswordResetLink(email)` para que o próprio usuário defina sua senha.
5. O frontend, após sucesso, também tenta enviar `sendPasswordResetEmail` usando o SDK cliente como camada adicional (se falhar, mostra aviso, mas o link gerado pelo Admin já cobre o fluxo).

**Importante:**  
Não existe mais **senha temporária gerada e copiada**. O usuário sempre define a senha diretamente a partir do email de redefinição.

### 3. Reset de Senha

- Na tela de login (`/login`), o link **“Esqueceu a senha?”** leva para `/forgot-password` (rota existente no projeto).
- No painel de usuários (`/admin/users` → modal de edição), o `master_admin` pode clicar em:
  - **“Enviar Link para Redefinir Senha”**  
    - Isso dispara `sendPasswordResetEmail` para o email daquele usuário.

**Política de senha:**

- Na tela de redefinição (`/auth/action?mode=resetPassword&...`), o backend exige que a nova senha:
  - Tenha **pelo menos 6 caracteres**.
  - Contenha **letra minúscula**, **letra maiúscula** e **caractere especial**.
  - As senhas precisam coincidir (campo de confirmação).

### 4. Visualização de Dashboards

- **Usuário comum / admin**
  - Vai para `/dashboard`.
  - O código obtém `companyId` do `AuthContext`.
  - Busca em `dashboards` o dashboard padrão `isDefault = true` e `active = true`.
  - Redireciona para `/dashboard/{companyId}/{dashboardId}`.

- **Master admin**
  - `/dashboard` mostra grid de empresas (`companies`).
  - `/dashboard/{companyId}` mostra lista de dashboards daquela empresa.
  - `/dashboard/{companyId}/{dashboardId}` embeda o Power BI via chamada a:
    - `GET /api/powerbi/get-embed-info/{companyId}/{dashboardId}`

### 5. Gestão de Empresas e Dashboards

- `/admin/companies`
  - Lista com `Table` dos documentos em `companies`.
  - Modal para criar/editar empresas (incluindo `pbiGroupId` / groupId do Power BI).
  - Ações de ativar/desativar e excluir com dialogs de confirmação customizados.

- `/admin/dashboards`
  - Lista com `Table` dos dashboards.
  - Formulário para criar novos dashboards:
    - Seleciona `companyId` via `datalist` (com nomes de `companies`).
    - Informa `pbiReportId` (Report ID do Power BI).
    - Marca se é o `dashboard padrão` (`isDefault`).
  - Edição, ativação/desativação e exclusão com dialogs de confirmação.

---

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz com, no mínimo:

```env
# Firebase (client)
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."

# Firebase Admin (service account em JSON em linha única)
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

> Obs.: Os IDs de **grupo** (`pbiGroupId`) e **relatório** (`pbiReportId`) agora são mantidos no Firestore (coleções `companies` e `dashboards`), e não mais fixos em variáveis de ambiente.

---

## Como Rodar Localmente

1. **Clonar o repositório**

   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd <NOME_DO_DIRETORIO>
   ```

2. **Instalar dependências**

   ```bash
   npm install
   ```

3. **Configurar `.env.local`**

   - Preencha as variáveis de Firebase e Power BI descritas acima.

4. **Rodar o servidor de desenvolvimento**

   ```bash
   npm run dev
   ```

5. **Acessar a aplicação**

   - Navegue até `http://localhost:3000`.

---

## Deploy (CI/CD)

O projeto já inclui workflows de GitHub Actions em `.github/workflows`:

- `ci.yml` – build, lint e (opcionalmente) testes.
- `cd-development.yml` – deploy automatizado para ambiente de desenvolvimento (branch `dev`).
- `cd-production.yml` – deploy automatizado para produção (branch `prod`).

Os workflows assumem que as variáveis sensíveis estão configuradas como **GitHub Actions Secrets**:

- Firebase client: `*_NEXT_PUBLIC_FIREBASE_*`
- Firebase Admin: `FIREBASE_SERVICE_ACCOUNT_KEY`
- Power BI: `PBI_TENANT_ID`, `PBI_CLIENT_ID`, `PBI_CLIENT_SECRET`, `PBI_AUTHORITY_URL`, `PBI_SCOPE`, `PBI_API_BASE_URL`

O processo de deploy remoto:

- Faz build no GitHub (`npm run build`).
- Empacota `.next`, `public`, `package*.json`.
- Envia para o servidor via `scp`.
- Cria/atualiza `.env.production` no servidor.
- Instala dependências (se necessário) e reinicia o app com **PM2**.

---

## Resumo do Fluxo de Senha (estado atual)

- Nenhum lugar do código gera ou expõe **senha temporária**.
- O fluxo oficial é sempre:
  1. `master_admin` cria o usuário em `/admin/users`.
  2. A API cria o usuário no Firebase Auth e envia **um email de redefinição de senha**.
  3. O usuário recebe o email, acessa o link do Firebase e **define a própria senha**.
  4. Depois disso, faz login normal em `/login`.

Isso simplifica a segurança e evita que senhas passem por canais inseguros (WhatsApp, email em texto, etc.).