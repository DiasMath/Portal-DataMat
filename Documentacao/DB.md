# Portal DATAMAT - Estrutura do Banco de Dados (Firestore)

## Visão Geral

O Portal DATAMAT utiliza o Firebase Firestore como banco de dados principal. Abaixo está a estrutura completa das coleções.

---

## Coleções

### 1. `users`

Armazena dados dos utilizadores.

```typescript
interface User {
  uid: string;                    // ID único (Firebase Auth)
  email: string;                  // Email do utilizador
  displayName?: string;            // Nome de exibição
  companyId?: string;             // ID da empresa associada
  role: "user" | "admin";
  authorized: boolean;          // Pode fazer login
  provider: string;              // "email" (sempre email)
  createdAt: timestamp;
  updatedAt: timestamp;
  lastLogin?: timestamp;
  defaultDashboardId?: string;   // Dashboard padrão
  permissions: {
    canViewDashboardList: boolean;
    canViewResourceList: boolean;
    canEdit: boolean;
    allowedDashboards: {
      [companyId: string]: "all" | string[];
    };
    allowedResources: {
      [companyId: string]: "all" | string[];
    };
  };
}
```

**Exemplo:**
```json
{
  "uid": "abc123xyz",
  "email": "joao@lojajuntos.pt",
  "displayName": "João Silva",
  "companyId": "lojaABC",
  "role": "admin",
  "authorized": true,
  "provider": "email",
  "createdAt": { "seconds": 1700000000 },
  "updatedAt": { "seconds": 1700000000 },
  "lastLogin": { "seconds": 1701000000 },
  "defaultDashboardId": "vendasMensais",
  "permissions": {
    "canViewDashboardList": true,
    "canViewResourceList": true,
    "canEdit": true,
    "allowedDashboards": {},
    "allowedResources": {}
  }
}
```

---

### 2. `companies`

Armazena dados das empresas/clientes.

```typescript
interface Company {
  id: string;                    // ID único
  name: string;                  // Nome da empresa
  pbiGroupId: string;           // ID do grupo no Power BI
  description?: string;          // Descrição opcional
  active: boolean;              // Empresa ativa
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

**Exemplo:**
```json
{
  "id": "lojaABC",
  "name": "Loja ABC",
  "pbiGroupId": "abc123-def456-ghi789",
  "description": "Loja de materiais de construção",
  "active": true,
  "createdAt": { "seconds": 1700000000 },
  "updatedAt": { "seconds": 1700000000 }
}
```

---

### 3. `dashboards`

Armazena configurações dos dashboards Power BI.

```typescript
interface Dashboard {
  id: string;                    // ID único
  companyId: string;             // ID da empresa
  name: string;                  // Nome do dashboard
  description?: string;          // Descrição opcional
  pbiReportId: string;          // GUID do report no Power BI
  active: boolean;              // Dashboard ativo
  isDefault: boolean;           // É o default da empresa
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

**Exemplo:**
```json
{
  "id": "vendasMensais",
  "companyId": "lojaABC",
  "name": "Vendas Mensais",
  "description": "Dashboard de vendas mensais",
  "pbiReportId": "report-abc-123",
  "active": true,
  "isDefault": true,
  "createdAt": { "seconds": 1700000000 },
  "updatedAt": { "seconds": 1700000000 }
}
```

---

### 4. `resources`

Armazena configurações dos recursos (Google Forms/Sheets).

```typescript
interface Resource {
  id: string;                    // ID único
  companyId: string;             // ID da empresa
  name: string;                  // Nome do recurso
  description?: string;          // Descrição opcional
  url: string;                  // URL do Google Form/Sheet
  type: "form" | "spreadsheet"; // Tipo de recurso
  active: boolean;              // Recurso ativo
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

**Exemplo:**
```json
{
  "id": "formulario feedback",
  "companyId": "lojaABC",
  "name": "Formulário de Feedback",
  "description": "Formulário para clientes enviarem feedback",
  "url": "https://docs.google.com/forms/d/abc123",
  "type": "form",
  "active": true,
  "createdAt": { "seconds": 1700000000 },
  "updatedAt": { "seconds": 1700000000 }
}
```

---

### 5. `auditLogs` (Opcional)

Armazena logs de auditoria de ações dos administradores.

```typescript
interface AuditLog {
  id: string;                    // ID único
  action: string;                // Tipo de ação
  actorUid: string;              // UID do utilizador que fez a ação
  actorEmail?: string;           // Email (para display)
  targetType: string;           // "user" | "company" | "dashboard" | "resource"
  targetId?: string;           // ID do alvo
  targetName?: string;         // Nome do alvo (para display)
  details?: Record<string, any>; // Detalhes adicionais
  createdAt: timestamp;
}
```

**Exemplo:**
```json
{
  "id": "log123",
  "action": "USER_CREATE",
  "actorUid": "admin123",
  "actorEmail": "admin@datamat.com",
  "targetType": "user",
  "targetId": "user456",
  "targetName": "Novo Utilizador",
  "details": { "email": "novo@empresa.com" },
  "createdAt": { "seconds": 1700000000 }
}
```

---

## Índices Recomendados

Para melhor desempenho, criar índices compostos:

| Coleção | Campos | Ordenação |
|---------|--------|------------|
| users | companyId | asc |
| dashboards | companyId | asc, active | asc, desc |
| resources | companyId | asc, active | asc |
| auditLogs | createdAt | desc |

---

## Integração Power BI

O Power BI utiliza o `pbiGroupId` da empresa para carregardashboards:

1. Frontend busca `dashboards` da empresa no Firestore
2. Envia `pbiReportId` para API `/api/dashboard/{id}`
3. API usa `pbiGroupId` para gerar embed token4. Retorna token para frontend
5. Power BI Embedded renderiza o report

**Nota:** O `pbiGroupId` é configurado na coleção `companies` e nunca muda.