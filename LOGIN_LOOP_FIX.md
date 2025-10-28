# Correção do Loop Infinito no Login

## 🐛 Problema Identificado

O usuário conseguia fazer login no Firebase Auth, mas ficava preso em um **loop infinito** na página de login.

### Causa Raiz

**Faltava a criação do session cookie no servidor!**

#### Como funciona a autenticação:

1. **Cliente (Navegador):** Firebase Auth faz login → recebe ID Token
2. **Servidor (Middleware):** Verifica session cookie → valida acesso

**O problema:**
- ✅ Usuário fazia login no Firebase Auth (cliente)
- ❌ **Session cookie NÃO era criado** (servidor)
- ❌ Middleware redirecionava para `/login` por falta do cookie
- ❌ **Loop infinito:** login → sem cookie → redireciona → login...

```
┌─────────────────────────────────────────────────┐
│  Usuário faz login no Firebase Auth (cliente)  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│   AuthContext detecta usuário autenticado      │
│   Tenta redirecionar para /dashboard           │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│   Middleware intercepta requisição             │
│   ❌ NÃO ENCONTRA session cookie               │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│   Redireciona de volta para /login             │
└────────────────┬────────────────────────────────┘
                 │
                 └─────► LOOP INFINITO! ◄─────────┘
```

---

## ✅ Solução Implementada

### 1. Criado endpoint de API para gerenciar session cookies

**Arquivo:** `src/app/api/auth/session/route.ts`

```typescript
// POST - Criar session cookie
export async function POST(request: Request) {
  const { idToken } = await request.json();
  
  // Verificar ID token
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  
  // Criar session cookie (14 dias de validade)
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { 
    expiresIn: 60 * 60 * 24 * 14 * 1000 
  });
  
  // Definir cookie HTTP-only
  cookies().set('session', sessionCookie, {
    maxAge: 14 * 24 * 60 * 60,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });
}

// DELETE - Remover session cookie (logout)
export async function DELETE() {
  cookies().delete('session');
}
```

### 2. Atualizado AuthContext para criar session cookie após login

**Arquivo:** `src/contexts/AuthContext.tsx`

```typescript
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Buscar dados do Firestore
      await fetchUserData(user);
      
      // 🔥 NOVO: Criar session cookie no servidor
      const idToken = await user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        body: JSON.stringify({ idToken })
      });
    } else {
      // 🔥 NOVO: Remover session cookie no logout
      await fetch('/api/auth/session', { method: 'DELETE' });
    }
  });
}, []);
```

---

## 🔄 Fluxo Corrigido

```
┌─────────────────────────────────────────────────┐
│  1. Usuário faz login no Firebase Auth         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  2. onAuthStateChanged detecta autenticação     │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  3. Busca dados do usuário no Firestore        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  4. 🆕 Pega ID Token do Firebase Auth           │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  5. 🆕 POST /api/auth/session                   │
│     - Verifica ID Token                         │
│     - Cria session cookie (14 dias)             │
│     - Define cookie HTTP-only                   │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  6. Página tenta redirecionar para /dashboard  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  7. Middleware intercepta requisição           │
│     ✅ ENCONTRA session cookie                 │
│     ✅ Verifica e valida cookie                │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  8. ✅ Permite acesso ao /dashboard             │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Arquivos Modificados

### 1. `src/app/api/auth/session/route.ts` ⭐ **NOVO**
- Endpoint para criar session cookie (POST)
- Endpoint para remover session cookie (DELETE)
- Validação de ID token com Firebase Admin
- Logs de debug

### 2. `src/contexts/AuthContext.tsx`
- Adicionada criação de session cookie após login
- Adicionada remoção de session cookie após logout
- Logs de debug

---

## 🧪 Testando a Correção

### Teste 1: Login com Email/Senha
```bash
1. Acesse http://localhost:3000/login
2. Digite email e senha válidos
3. Clique em "Entrar"

Resultado esperado:
✅ Login bem-sucedido
✅ Session cookie criado
✅ Redirecionado para /dashboard (ou /admin se for admin)
✅ SEM loop infinito!
```

### Teste 2: Verificar Session Cookie
```bash
1. Faça login
2. Abra DevTools (F12)
3. Vá em Application → Cookies → http://localhost:3000
4. Procure pelo cookie "session"

Resultado esperado:
✅ Cookie "session" existe
✅ HttpOnly: true
✅ Secure: true (em produção)
✅ MaxAge: 1209600 (14 dias)
```

### Teste 3: Logout
```bash
1. Faça login
2. Clique em "Sair" ou "Logout"

Resultado esperado:
✅ Usuário deslogado
✅ Session cookie removido
✅ Redirecionado para /login
```

---

## 📊 Logs de Debug

### Console do Navegador (F12):
```javascript
[AuthContext] Session cookie criado
[Login] Verificando email: usuario@teste.com
[Login] Resposta da verificação: 200 { exists: true }
[Login] Tentando fazer login com Firebase Auth
[Login] Login bem-sucedido
```

### Terminal do Servidor:
```bash
[session] Criando session cookie para token: eyJhbGciOiJSUzI1NiIs...
[session] Token verificado para UID: abc123xyz
[session] Session cookie criado com sucesso
[check-email] Verificando email: usuario@teste.com
[check-email] Usuário encontrado: usuario@teste.com authorized: true
```

---

## 🔒 Segurança

### Propriedades do Session Cookie:

```typescript
{
  httpOnly: true,     // ✅ Não acessível via JavaScript (XSS protection)
  secure: true,       // ✅ Apenas HTTPS em produção
  sameSite: 'lax',    // ✅ CSRF protection
  maxAge: 1209600,    // ✅ 14 dias
  path: '/',          // ✅ Disponível em todas as rotas
}
```

### Por que é seguro?

1. **HttpOnly:** JavaScript não pode acessar o cookie (protege contra XSS)
2. **Secure:** Em produção, só funciona via HTTPS
3. **SameSite:** Protege contra CSRF attacks
4. **Server-side validation:** Middleware valida no servidor, não no cliente
5. **Firebase Admin SDK:** Validação criptográfica do token

---

## ❓ Perguntas Frequentes

### Q: Por que não usar apenas Firebase Auth client-side?
**R:** O middleware do Next.js roda no **servidor**, onde não há acesso ao Firebase Auth client-side. Precisamos de um session cookie para validação server-side.

### Q: O session cookie expira?
**R:** Sim, após 14 dias. O usuário precisará fazer login novamente.

### Q: E se o session cookie for roubado?
**R:** 
- ✅ Cookie é HTTP-only (JavaScript não pode acessar)
- ✅ Cookie é Secure (apenas HTTPS em produção)
- ✅ SameSite protege contra CSRF
- ✅ Firebase Admin SDK valida criptograficamente o cookie

### Q: Posso mudar a duração do cookie?
**R:** Sim, altere `expiresIn` em `src/app/api/auth/session/route.ts`:

```typescript
// 7 dias
const expiresIn = 60 * 60 * 24 * 7 * 1000;

// 30 dias
const expiresIn = 60 * 60 * 24 * 30 * 1000;
```

### Q: O que acontece se o Firebase Admin não estiver configurado?
**R:** O endpoint retornará erro 500 e o login não funcionará. Certifique-se de ter as variáveis de ambiente configuradas.

---

## 🎯 Próximos Passos

1. ✅ **Teste o login** com um usuário válido
2. ✅ **Verifique os logs** no console do navegador (F12)
3. ✅ **Verifique os logs** no terminal do servidor
4. ✅ **Confirme o cookie** em DevTools → Application → Cookies
5. ✅ **Teste o logout** para ver se o cookie é removido

---

## 💡 Lições Aprendidas

1. **Firebase Auth ≠ Session Cookie**
   - Firebase Auth é client-side
   - Session Cookie é server-side
   - Ambos são necessários para autenticação full-stack

2. **Next.js Middleware roda no servidor**
   - Não tem acesso ao localStorage
   - Não tem acesso ao Firebase Auth client-side
   - Precisa de cookies ou headers

3. **ID Token vs Session Cookie**
   - ID Token: curta duração (1 hora), usado para criar session cookie
   - Session Cookie: longa duração (14 dias), usado pelo middleware

4. **onAuthStateChanged é o lugar perfeito**
   - Detecta login/logout automaticamente
   - Executa após qualquer mudança no estado de autenticação
   - Lugar ideal para sincronizar client-side ↔ server-side

---

## 📞 Suporte

Se o problema persistir:

1. ✅ Verifique se Firebase Admin está configurado
2. ✅ Verifique os logs do navegador (F12)
3. ✅ Verifique os logs do servidor (terminal)
4. ✅ Verifique se o cookie "session" foi criado (DevTools)
5. ✅ Envie os logs para análise

---

## 📚 Referências

- [Firebase Admin Auth](https://firebase.google.com/docs/auth/admin)
- [Firebase Session Cookies](https://firebase.google.com/docs/auth/admin/manage-cookies)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
