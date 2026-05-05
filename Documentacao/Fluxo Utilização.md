# Portal DATAMAT - Fluxo de Utilização

## Login e Redirect Inicial

### 1. Acesso à Aplicação

O utilizador acessa `https://portal.datamat.com.br` e é redirecionado para `/login`.

### 2. Autenticação

O utilizador insere email e senha. A autenticação é feita via Firebase Auth.

### 3. Carregamento de Dados

Após login bem-sucedido:
1. dados do utilizador são carregados do Firestore (coleção `users`)
2. Atualiza `lastLogin` no Firestore
3. Cria session cookie no servidor

### 4. Redirect Inicial

Dependendo do tipo de utilizador:

| Tipo | Redirect |
|------|----------|
| Admin | `/dashboard` (lista ou direto) |
| User | `/dashboard/{companyId}/{defaultDashboardId}` |

### Redirect com sessionStorage

Para evitar loops de redirect, o sistema usa `sessionStorage`:

```
1. Utilizador faz login
     ↓
2. Sistema verifica defaultDashboardId
     ↓
3. Se tem defaultDashboardId E não redirecionou nesta sessão
     ↓
4. redirect para /dashboard/{companyId}/{defaultDashboardId}
     ↓
5. Marca sessionStorage.setItem('dashboardRedirected', 'true')
```

Isto garante que:
- Apenas redireciona uma vez (no primeiro login após autenticação)
- Clicar em "Dashboard" no menu mostra a lista de dashboards
- Não faz redirect automático em navegações suivantes

### 5. Logout e Limpeza de Sessão

```
1. Utilizador clica "Sair" no menu
     ↓
2. sessionStorage.clear() - Limpa dados da sessão
     ↓
3. Firebase signOut()
     ↓
4. Redirect para /login
```

**Importante:** O `sessionStorage` é limpo para garantir que:
- Próximo login fará redirect para defaultDashboardId
- Não há dadospersistidos entre sessões

---

## Acesso ao Menu Hambúrguer

O menu hamburguer (canto superior direito) mostra opções baseadas nas permissões:

### Itens do Menu

```
├── Painel Administrativo (só admins)
├── Dashboard
├── Recursos
└── Sair
```

### Condições de Exibição

- **Painel Administrativo**: `isAdmin`
- **Dashboard**: Sempre visível
- **Recursos**: Se tem `companyId` ou `canViewResourceList`

---

## Páginas e Fluxos

### 1. Dashboard - Lista de Empresas (/dashboard)

```
Utilizador clica "Dashboard" no menu
        ↓
canViewList = true?
        ├── SIM → Lista de TODAS as empresas
        │
        └── NÃO → Verifica allowedDashboards
                  │
                  ├─ 1 empresa → /dashboard/{empresa}
                  ├─ múltiplas → Lista de empresas específicas
                  └─ nenhuma → /dashboard/{companyId}
```

### 2. Dashboard - Lista de Dashboards (/dashboard/{empresaId})

```
Utilizador entra em /dashboard/{empresaId}
        ↓
Busca dashboards ativos da empresa
        ↓
Mostra cards dos dashboards
        ↓
Utilizador clica em dashboard
        ↓
Abre Power BI Embedded (/dashboard/{empresaId}/{dashboardId})
```

**Botão Voltar**:
- Só aparece se `canViewList = true`

### 3. Recursos - Lista de Empresas (/resources)

Igual ao Dashboard, mas para Recursos.

### 4. Recursos - Lista de Recursos (/resources/{empresaId})

```
Utilizador entra em /resources/{empresaId}
        ↓
Busca recursos ativos da empresa
        ↓
Mostra cards dos recursos
        ↓
Utilizador clica em recurso
        ↓
Abre URL em nova aba (Google Forms/Sheets)
```

**Botão Voltar**:
- Só aparece se `canViewList = true`

---

## Cenários de Uso

### Cenário 1: Utilizador Comum

**Perfil:**
```json
{
  "role": "user",
  "companyId": "lojaABC",
  "defaultDashboardId": "vendas",
  "permissions": {
    "canViewDashboardList": false,
    "canViewResourceList": false
  }
}
```

**Fluxo:**
1. Login → Sistema verifica sessionStorage.getItem('dashboardRedirected')
2. Se não redirecionou → Redirect para `/dashboard/lojaJuntos/vendas`
3. sessionStorage.setItem('dashboardRedirected', 'true')
4. Abre Power BI automaticamente
5. Menu → Dashboard → Redirect para default (mesmo comportamento)

### Cenário 2: Administrador de 1 Empresa

**Perfil:**
```json
{
  "role": "admin",
  "companyId": "lojaABC",
  "permissions": {
    "canViewDashboardList": true,
    "canViewResourceList": true,
    "canEdit": true,
    "allowedDashboards": {},
    "allowedResources": {}
  }
}
```

**Fluxo:**
1. Login → Redirect para `/dashboard`
2. Vê lista de TODAS as empresas
3. Clica "Loja ABC" → `/dashboard/lojaABC`
4. Vê lista de dashboards → clica → Power BI

### Cenário 3: Administrador Restrito

**Perfil:**
```json
{
  "role": "admin",
  "permissions": {
    "canViewDashboardList": false,
    "canViewResourceList": false,
    "canEdit": false,
    "allowedDashboards": {
      "lojaABC": ["vendas", "estatisticas"],
      "farmaciaCentral": "all"
    }
  }
}
```

**Fluxo:**
1. Login → Redirect para `/dashboard`
2. Vê lista de 2 empresas
3. Clica "Loja ABC" → SÓ mostra "vendas" e "estatisticas"
4. Clica "Farmácia Central" → mostra TODOS dashboards

**Fluxo:**
1. Login → Redirect para `/admin` (painel administrativo)
2. Pode gerir utilizadores, empresas, dashboards, recursos
3. Menu → Dashboard → Lista de TODAS empresas

---

## Onboarding de Novo Utilizador

### Processo de Criação (Admin)

1. Admin vai para `/admin/users`
2. Clica "Novo Utilizador"
3. Preenche dados:
   - Email (obrigatório)
   - Nome de exibição
   - Empresa (opcional)
   - Papel (User/Admin)
   - Autorizado (sim/não)
4. Define permissões:
   - Dashboards: acesso total ou específico
   - Recursos: acesso total ou específico
5. Cria → Envia email de redefinição de senha

### Primeiro Login

1. Utilizador recebe email com link
2. Define nova senha
3. Redirect para dashboard padrão ou lista

---

## Erros Comuns e Soluções

### 1. "Nenhum dashboard foi configurado"

**Causa:** Utilizador sem `defaultDashboardId` e sem dashboard `isDefault: true`

**Solução:** Admin deve configurar um dashboard padrão ou verificar se existem dashboards ativos.

### 2. "Você não tem permissão"

**Causa:** Utilizador sem permissões corretas

**Solução:** Verificar `canViewDashboardList` e `allowedDashboards` no Firestore.

### 3. Redirect loop (muitas recargas)

**Causa:** Conflito entre permissões

**Solução:** Verificar consistência dos dados no Firestore.

---

## Resumo Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO DE ACESSO                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Login                                                     │
│     ↓                                                       │
│   hasAdmin? ──SIM──→ /admin                                 │
│     ↓                                                        │
│   NO                                                        │
│     ↓                                                       │
│   canViewList? ──SIM──→ Lista empresas                      │
│     ↓                                                        │
│   NO                                                        │
│     ↓                                                       │
│   hasSpecificAccess? ──SIM──→ Lista filtrada               │
│     ↓                                                        │
│   NO                                                        │
│     ↓                                                       │
│   companyId? ──SIM──→ Redirect /{companyId}               │
│     ↓                                                        │
│   NO                                                        │
│     ↓                                                       │
│   ERRO: Sem permissão                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```