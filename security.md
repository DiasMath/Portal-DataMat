# Relatório de Segurança e Recomendações para a Aplicação

Este documento detalha a arquitetura de segurança atual da aplicação, focando na proteção de rotas de frontend e endpoints de API. Ele analisa os mecanismos existentes e fornece um plano de ação para fortalecer a segurança.

## Sumário

1.  **Proteção no Frontend (Client-Side)**: Análise do `ProtectedRoute.tsx`.
2.  **Proteção no Backend (Server-Side)**: Análise do `middleware.ts`.
3.  **Estratégia de Segurança Unificada**: Como as duas camadas devem operar juntas.
4.  **Plano de Ação**: Passos concretos para implementação.

---

### 1. Proteção no Frontend: `src/components/ProtectedRoute.tsx`

O componente `ProtectedRoute` é o principal mecanismo de segurança no lado do cliente.

#### Como Funciona:

-   **Baseado em Contexto**: Utiliza o `useAuth()` hook para obter o estado de autenticação do usuário (`user`), seus dados (`userData`), e seus níveis de permissão (`isAdmin`, `isMasterAdmin`, `isAuthorized`).
-   **Redirecionamento**: Com base nas props recebidas (`requireAuth`, `requireAdmin`, `requireMasterAdmin`), o componente verifica se o usuário atende aos requisitos da rota.
    -   Se um usuário não autenticado tenta acessar uma página protegida, ele é redirecionado para `/login`.
    -   Se um usuário autenticado não tem a permissão necessária (e.g., não é `isMasterAdmin`), ele é redirecionado para o `/dashboard`.
    -   Se o usuário está logado mas sua conta foi desativada (`!isAuthorized`), ele é enviado para a página `/unauthorized`.
-   **Experiência do Usuário (UX)**: Enquanto a verificação está em andamento (`loading`), um spinner é exibido, evitando que o conteúdo da página seja "piscado" na tela antes do redirecionamento.

#### Limitações:

-   **Segurança de UI, não de Dados**: `ProtectedRoute` opera exclusivamente no navegador. Ele é excelente para controlar a experiência do usuário e o que é renderizado na tela, mas **não protege os endpoints da API**. Um usuário mal-intencionado pode ignorar a interface do usuário e tentar fazer chamadas diretas para a API (e.g., usando `curl` ou Postman).
-   **Dependência**: Sua eficácia depende inteiramente da corretude e segurança do `AuthContext`.

**Conclusão**: É uma camada de UX essencial, mas não deve ser considerada a principal barreira de segurança da aplicação.

---

### 2. Proteção no Backend: `src/middleware.ts`

O middleware do Next.js é a camada de segurança mais importante, pois é executado no servidor antes que a requisição chegue às páginas ou aos endpoints da API.

#### Estado Atual:

-   **Lista de Exceções**: O middleware define uma lista `publicPaths` que permite o acesso irrestrito a rotas essenciais como `/login`, `/public`, e os assets do Next.js.
-   **Lógica Incompleta**: Atualmente, após verificar as rotas públicas, o middleware executa `NextResponse.next()` para **todas as outras requisições**.
    ```typescript
    // TODO: Implementar nova lógica de autenticação
    // Por enquanto, permite acesso a todas as rotas
    return NextResponse.next();
    ```
-   **Vulnerabilidade Crítica**: Isso significa que **nenhuma rota de API ou página protegida está de fato segura no lado do servidor**. Qualquer pessoa pode acessar qualquer endpoint se souber a URL, contornando completamente as proteções do `ProtectedRoute`.

#### Recomendações para Implementação:

O `middleware.ts` deve ser o principal "porteiro" da aplicação.

1.  **Verificação de Sessão**: Para cada requisição que não seja pública, o middleware deve extrair o cookie de sessão (e.g., `session`).
2.  **Validação do Token**: O token do cookie deve ser validado usando o Firebase Admin SDK (`adminAuth.verifySessionCookie`). Esta operação verifica a autenticidade e a validade do token.
    -   Se o cookie não existir ou for inválido, o usuário não está autenticado.
3.  **Tratamento de Acesso Negado**:
    -   **Para Páginas**: Se a requisição for para uma página (e.g., `/dashboard`) e o usuário não estiver autenticado, o middleware deve redirecioná-lo para a página de login: `return NextResponse.redirect(new URL('/login', request.url))`.
    -   **Para APIs**: Se a requisição for para um endpoint de API (e.g., `/api/users/delete`) e o usuário não estiver autenticado, o middleware deve retornar uma resposta de erro `401 Unauthorized` ou `403 Forbidden`, e não um redirecionamento: `return new NextResponse(JSON.stringify({ error: 'Acesso não autorizado' }), { status: 401 })`.
4.  **Controle de Acesso Baseado em Função (RBAC)**:
    -   Após validar o token, o `decodedToken` conterá o `uid` do usuário.
    -   O middleware deve usar o `uid` para buscar os dados do usuário no Firestore (`adminDb.collection('users').doc(uid).get()`) para obter sua função (`role`).
    -   Com a função em mãos, o middleware pode proteger rotas de admin. Se uma requisição para `/admin` vier de um usuário que não é `admin` ou `master_admin`, o acesso deve ser negado (redirecionamento para páginas, erro 403 para APIs).

---

### 3. Estratégia de Segurança Unificada

As duas camadas devem trabalhar em conjunto para criar uma segurança robusta e uma boa experiência de usuário.

-   **`middleware.ts` (O Guarda)**: É a primeira e mais forte linha de defesa. Ele garante que nenhuma requisição não autorizada chegue ao seu destino no servidor. Ele é o responsável pela **segurança real**.
-   **`ProtectedRoute.tsx` (O Guia)**: Ele reage ao estado de autenticação (que é um reflexo do que o servidor validou) para guiar o usuário pela interface de forma fluida. Ele é o responsável pela **experiência de usuário segura**.
-   **Defesa em Profundidade**: Mesmo com o middleware, os endpoints da API (como visto em `api/users/delete/route.ts`) devem, como uma boa prática, revalidar as permissões do chamador. Isso cria uma redundância de segurança (defesa em profundidade), garantindo que, mesmo que o middleware falhe ou seja mal configurado, o endpoint ainda se protege.

---

### 4. Plano de Ação

Para garantir a segurança da aplicação, os seguintes passos devem ser tomados:

1.  **Implementar a Lógica de Autenticação no `middleware.ts`**:
    -   Adicionar a lógica para ler o cookie de sessão.
    -   Integrar o Firebase Admin SDK para validar o cookie.
    -   Implementar redirecionamentos para páginas e respostas de erro 401/403 para APIs em caso de falha na autenticação.

2.  **Implementar RBAC no `middleware.ts`**:
    -   Após a autenticação, buscar a função (`role`) do usuário no Firestore.
    -   Criar uma lógica que mapeie rotas (e.g., `/admin/**`) a funções específicas (`admin`, `master_admin`).
    -   Negar acesso se o usuário não tiver a permissão necessária.

3.  **Manter o `ProtectedRoute.tsx`**: Nenhuma alteração crítica é necessária aqui. Ele funcionará corretamente assim que o `AuthContext` refletir o estado de autenticação validado pelo servidor.

4.  **Revisar Todos os Endpoints de API**: Garantir que cada endpoint sensível contenha sua própria lógica de validação de permissão como uma camada final de segurança.
