
## Getting Started

First, run the development server:

```bash
npm install
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

## Sobre o Projeto

Este é um projeto Next.js com App Router, TailwindCSS, shadcn/ui e integração com Firebase e Power BI.

### Estado Atual

- ✅ **Autenticação**: baseada em **Firebase Auth** (cliente) + **Firebase Admin** (servidor), com cookie de sessão HTTP-only.
- ✅ **Base de dados**: **Firestore**, coleção `users` com informações de acesso (role, authorized, dashboardLink, etc.).
- ✅ **Portal de dashboards**: incorporação de relatórios **Power BI** via API protegida (`/api/powerbi/get-embed-info`) e `powerbi-client-react`.
- ✅ **Proteção de rotas**: componente `ProtectedRoute` no cliente e validações adicionais nas rotas de API.
- ✅ **Painel administrativo**: gestão de usuários (criação, remoção, reset de senha, link de dashboard) em `/admin` e `/admin/users`.

### Estrutura Atual

- ✅ `src/app`: páginas e rotas (App Router)
- ✅ `src/components`: componentes de UI (shadcn/ui, header, navegação do usuário, etc.)
- ✅ `src/lib`: utilitários (`firebase`, `firebase-admin`, helpers de auth, etc.)
- ✅ `src/contexts`: contextos globais (principalmente `AuthContext`)
- ✅ `src/app/api`: rotas de API (auth, usuários, Power BI)

### Tecnologias

- [Next.js](https://nextjs.org/) v16.1.6
- [TailwindCSS](https://tailwindcss.com/) v4
- [shadcn/ui](https://ui.shadcn.com/)
- [React](https://reactjs.org/) v19
- [Firebase](https://firebase.google.com/) (Auth + Firestore + Admin)
- [Power BI](https://powerbi.microsoft.com/) via `powerbi-client-react` e `@azure/msal-node`

## Como Rodar Localmente

1. **Clone o repositório:**
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd <NOME_DO_DIRETORIO>
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as Variáveis de Ambiente:**
- Defina as chaves do Firebase e do Power BI no arquivo `.env.local` (nunca faça commit de valores sensíveis).

   ```env
   # Firebase (exemplo – use os valores do seu projeto)
   NEXT_PUBLIC_FIREBASE_API_KEY="..."
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
   NEXT_PUBLIC_FIREBASE_APP_ID="..."

   # Firebase Admin (service account em JSON)
   FIREBASE_SERVICE_ACCOUNT_KEY="{ \"type\": \"service_account\", ... }"

   # Power BI / Azure AD
   PBI_TENANT_ID="..."
   PBI_CLIENT_ID="..."
   PBI_CLIENT_SECRET="..."
   PBI_GROUP_ID="..."
   PBI_REPORT_ID="..."
   PBI_AUTHORITY_URL="https://login.microsoftonline.com/"
   PBI_SCOPE="https://analysis.windows.net/powerbi/api/.default"
   PBI_API_BASE_URL="https://api.powerbi.com/v1.0/myorg/"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Rode o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

5. **Acesse a aplicação:**
   Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## TODO: Próximos Passos

Sugestões de melhorias para o futuro:

1. **Melhorar observabilidade**
   - Centralizar logs em um logger único (e desativar logs verbosos em produção).
   - Adicionar métricas básicas para chamadas ao Power BI e falhas de login.

2. **Evoluir o sistema de permissões**
   - Consolidar a lógica de roles/authorized em um único lugar (contexto + helpers).
   - Padronizar checks de permissão nas rotas de API.

3. **Hardening de segurança**
   - Validar e documentar melhor o fluxo de sessão (cookie + Firebase Admin).
   - Revisar políticas de CORS, cookies e headers de segurança antes de deploy em produção.

## Deploy na Vercel

1. Crie uma conta na [Vercel](https://vercel.com/).
2. Conecte seu repositório do GitHub, GitLab ou Bitbucket.
3. Adicione as variáveis de ambiente necessárias no painel da Vercel.
4. A Vercel irá detectar automaticamente que é um projeto Next.js e irá fazer o build e deploy.