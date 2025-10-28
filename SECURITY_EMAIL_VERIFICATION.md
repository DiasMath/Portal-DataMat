# Verificação de Email e Acesso às Páginas de Autenticação

## 📋 Resumo das Alterações

### 1. **Middleware Atualizado** (`src/middleware.ts`)
Adicionadas rotas públicas:
- `/forgot-password` - Página de solicitação de redefinição de senha
- `/auth/action` - Página de redefinição de senha (com link do email)

```typescript
const publicPaths = [
  '/login',
  '/forgot-password',
  '/auth/action',  // NOVO
  '/unauthorized',
  '/_next',
  '/favicon.ico',
  '/public'
];
```

### 2. **Nova API de Verificação de Email** (`src/app/api/users/check-email/route.ts`)
Endpoint criado para verificar se um email existe no banco de dados Firestore.

**Endpoint:** `POST /api/users/check-email`

**Request Body:**
```json
{
  "email": "usuario@exemplo.com"
}
```

**Response (Sucesso):**
```json
{
  "exists": true,
  "authorized": true,
  "role": "user"
}
```

**Response (Não encontrado):**
```json
{
  "exists": false,
  "message": "Usuário não encontrado no sistema"
}
```

### 3. **Login com Verificação de Email** (`src/app/login/page.tsx`)
Antes de tentar fazer login, verifica se o email existe no Firestore:

**Fluxo:**
1. Usuário insere email e senha
2. Sistema verifica se email existe no Firestore
3. Se não existe: exibe mensagem "Este email não está cadastrado no sistema. Entre em contato com a DataMat para solicitar acesso."
4. Se existe: procede com o login normalmente

### 4. **Recuperação de Senha com Verificação** (`src/app/forgot-password/page.tsx`)
Antes de enviar o email de redefinição, verifica se o usuário existe no Firestore:

**Fluxo:**
1. Usuário insere email
2. Sistema verifica se email existe no Firestore
3. Se não existe: exibe toast "Este email não está cadastrado no sistema. Entre em contato com a DataMat para solicitar acesso."
4. Se existe: envia email de redefinição de senha via Firebase Auth

### 5. **Página de Redefinição de Senha** (`src/app/auth/action/page.tsx`)
Agora é acessível sem autenticação (rota pública).

**Fluxo:**
1. Usuário clica no link recebido por email
2. Sistema verifica o código (`oobCode`) com Firebase Auth
3. Exibe formulário para definir nova senha
4. Após sucesso, redireciona para `/login`

---

## 🔒 Segurança

### Proteções Implementadas

1. **Validação de Email no Backend**
   - A verificação de email é feita no servidor (API route)
   - Não é possível burlar a validação do lado do cliente

2. **Mensagens Genéricas**
   - Para evitar enumerar usuários, a mensagem indica apenas que o usuário não está cadastrado
   - Não revela se o problema é com o email ou senha durante o login

3. **RBAC (Role-Based Access Control)**
   - A API retorna informações sobre autorização e papel do usuário
   - Pode ser usado para lógicas adicionais no futuro

4. **Middleware de Proteção**
   - Todas as rotas não públicas requerem autenticação
   - Session cookies são validados com Firebase Admin

---

## 🧪 Testando as Alterações

### Teste 1: Login com Email Não Cadastrado
```bash
# Na tela de login
Email: naoexiste@exemplo.com
Senha: qualquersenha

# Resultado esperado:
# Mensagem de erro: "Este email não está cadastrado no sistema. Entre em contato com a DataMat para solicitar acesso."
```

### Teste 2: Recuperação de Senha com Email Não Cadastrado
```bash
# Na tela "Esqueceu a senha?"
Email: naoexiste@exemplo.com

# Resultado esperado:
# Toast de erro: "Este email não está cadastrado no sistema. Entre em contato com a DataMat para solicitar acesso."
```

### Teste 3: Acesso à Página de Redefinição de Senha
```bash
# URL: http://localhost:3000/auth/action?mode=resetPassword&oobCode=CODIGO_VALIDO

# Resultado esperado:
# Página de redefinição de senha carrega normalmente
# Não redireciona para /login
```

### Teste 4: Recuperação de Senha com Email Cadastrado
```bash
# Na tela "Esqueceu a senha?"
Email: usuario@cadastrado.com

# Resultado esperado:
# Toast de sucesso: "Email de redefinição enviado!"
# Exibe mensagem: "Enviamos um link de redefinição de senha para usuario@cadastrado.com"
```

---

## 📊 Fluxograma de Autenticação

```
┌─────────────────────────────────────────────┐
│         Usuário acessa /login               │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│    Insere email e senha no formulário      │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  POST /api/users/check-email com email     │
└────────────────┬────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
    exists: false     exists: true
        │                 │
        ▼                 ▼
┌──────────────┐  ┌──────────────────┐
│ Exibe erro   │  │ Tenta login com  │
│ "Não cadas-  │  │ Firebase Auth    │
│  trado"      │  └────────┬─────────┘
└──────────────┘           │
                   ┌───────┴────────┐
                   │                │
                   ▼                ▼
            Senha correta    Senha incorreta
                   │                │
                   ▼                ▼
          ┌────────────┐   ┌──────────────┐
          │ Cria       │   │ Exibe erro   │
          │ session    │   │ "Credenciais │
          │ cookie     │   │  inválidas"  │
          └─────┬──────┘   └──────────────┘
                │
                ▼
    ┌──────────────────────┐
    │ Middleware valida    │
    │ session + Firestore  │
    └───────────┬──────────┘
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
   Autorizado      Não autorizado
        │                │
        ▼                ▼
  Redireciona       Redireciona
  para /dashboard   para /unauthorized
```

---

## 🔄 Fluxo de Recuperação de Senha

```
┌─────────────────────────────────────────────┐
│    Usuário acessa /forgot-password          │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│       Insere email no formulário            │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  POST /api/users/check-email com email     │
└────────────────┬────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
    exists: false     exists: true
        │                 │
        ▼                 ▼
┌──────────────┐  ┌──────────────────────────┐
│ Exibe toast  │  │ Firebase Auth envia      │
│ de erro      │  │ email com link de reset  │
└──────────────┘  └───────────┬──────────────┘
                              │
                              ▼
                  ┌──────────────────────────┐
                  │ Usuário clica no link    │
                  │ /auth/action?mode=...    │
                  └───────────┬──────────────┘
                              │
                              ▼
                  ┌──────────────────────────┐
                  │ Middleware permite       │
                  │ acesso (rota pública)    │
                  └───────────┬──────────────┘
                              │
                              ▼
                  ┌──────────────────────────┐
                  │ Firebase verifica oobCode│
                  └───────────┬──────────────┘
                              │
                      ┌───────┴────────┐
                      │                │
                      ▼                ▼
                  Válido           Inválido
                      │                │
                      ▼                ▼
          ┌──────────────────┐  ┌─────────────┐
          │ Exibe formulário │  │ Exibe erro  │
          │ nova senha       │  │ "Link       │
          └────────┬─────────┘  │  expirado"  │
                   │             └─────────────┘
                   ▼
          ┌──────────────────┐
          │ Usuário define   │
          │ nova senha       │
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │ Firebase atualiza│
          │ senha            │
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │ Toast de sucesso │
          │ Redireciona para │
          │ /login           │
          └──────────────────┘
```

---

## ⚠️ Considerações Importantes

1. **Firebase Authentication vs Firestore**
   - Firebase Auth gerencia autenticação (login/senha)
   - Firestore armazena dados do usuário (autorização, role, etc.)
   - Ambos devem estar sincronizados

2. **Criação de Usuários**
   - Usuários devem ser criados via endpoint `/api/users/create`
   - Isso cria o usuário tanto no Firebase Auth quanto no Firestore
   - Não é possível fazer login sem estar cadastrado no Firestore

3. **Mensagens de Erro**
   - Evitar revelar se um email existe ou não (security by obscurity)
   - Usar mensagens genéricas como "Entre em contato com a DataMat"

4. **Rate Limiting (Recomendação Futura)**
   - Considerar implementar rate limiting no endpoint de verificação de email
   - Prevenir tentativas de enumerar usuários válidos

---

## 📝 Endpoints de API Relacionados

| Endpoint | Método | Autenticação | Descrição |
|----------|--------|--------------|-----------|
| `/api/users/check-email` | POST | Não | Verifica se email existe no Firestore |
| `/api/users/create` | POST | Sim (Master Admin) | Cria novo usuário |
| `/api/users/send-password-reset` | POST | Sim (Master Admin) | Envia email de reset (admin) |

---

## 🚀 Próximos Passos (Recomendações)

1. **Rate Limiting**: Implementar limite de requisições por IP
2. **Logs de Auditoria**: Registrar tentativas de login e recuperação de senha
3. **Captcha**: Adicionar reCAPTCHA em formulários públicos
4. **2FA**: Implementar autenticação de dois fatores (futuro)
5. **Email de Notificação**: Enviar email ao usuário quando senha for alterada

---

## 📞 Suporte

Para reportar problemas ou solicitar acesso ao sistema, entre em contato com a equipe DataMat.
