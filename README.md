
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

Este é um projeto Next.js 15 com App Router, TailwindCSS e shadcn/ui.

### Estado Atual

⚠️ **IMPORTANTE**: O Firebase foi completamente removido da aplicação. O sistema de autenticação precisa ser reimplementado do zero.

### O que foi removido:
- Todas as dependências do Firebase (`firebase` e `firebase-admin`)
- Diretório `/src/lib/firebase/` completo
- Contexto de autenticação (`AuthContext`)
- Rotas de API de autenticação (`/src/app/api/auth/`)
- Variáveis de ambiente relacionadas ao Firebase
- Middleware de autenticação baseado no Firebase

### Estrutura Atual

- ✅ `src/app`: Contém as páginas da aplicação
- ✅ `src/components`: Contém os componentes React
- ✅ `src/lib`: Contém funções utilitárias (Firebase removido)
- ✅ `src/hooks`: Contém os hooks React
- ⚠️ Sistema de Autenticação: **PRECISA SER REIMPLEMENTADO**

### Tecnologias

- [Next.js](https://nextjs.org/) v15.5.4
- [TailwindCSS](https://tailwindcss.com/) v4
- [shadcn/ui](https://ui.shadcn.com/)
- [React](https://reactjs.org/) v19

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
   - O arquivo `.env.local` já contém as configurações JWT básicas.
   - Você pode gerar novos segredos se necessário:

   ```env
   # JWT Configuration
   JWT_SECRET="cbb347379e9f772a7c6c2968a4a2dbd8f414fcbd8a0cc90abaad171ea3ca6b6165a21221c4893c11557071567bb5643d5856dc27be15b2772512e72b2af1112e"
   JWT_REFRESH_SECRET="e8f7c3b1a9d5246f8e0c1d7b4a9f3c6e2d5b8a7c4f1e0d3b6a9c2e5f8d1b4a7c0e3f6d9b2a5e8c1f4d7b0a3e6f9c2d5b8a1e4f7c0d3b6a9e2f5c8d1b4a7"
   ```

4. **Rode o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

5. **Acesse a aplicação:**
   Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## TODO: Próximos Passos

Para restaurar a funcionalidade completa da aplicação, será necessário:

1. **Implementar novo sistema de autenticação**
   - Escolher nova solução (NextAuth.js, Supabase, custom JWT, etc.)
   - Criar novas rotas de API para auth
   - Implementar middleware de proteção
   - Criar contexto de autenticação

2. **Implementar banco de dados**
   - Escolher solução de banco (PostgreSQL, MongoDB, Supabase, etc.)
   - Configurar modelos de dados
   - Implementar CRUD operations

3. **Restaurar funcionalidades**
   - Sistema de usuários e roles
   - Proteção de rotas
   - Gerenciamento de sessões

## Deploy na Vercel

1. Crie uma conta na [Vercel](https://vercel.com/).
2. Conecte seu repositório do GitHub, GitLab ou Bitbucket.
3. Adicione as variáveis de ambiente necessárias no painel da Vercel.
4. A Vercel irá detectar automaticamente que é um projeto Next.js e irá fazer o build e deploy.