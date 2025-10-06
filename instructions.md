# Guia de Configuração Firebase + Next.js (Acesso Controlado)

## 1. Configuração do Firebase Authentication

### 1.1. Habilitar Métodos de Autenticação

No Firebase Console:
1. Vá em **Authentication** → **Sign-in method**
2. Habilite TODOS os provedores que deseja disponibilizar:
   - ✅ Email/Password
   - ✅ Google
   - ✅ Microsoft
   - ✅ GitHub
   - ✅ Outros conforme necessidade

**Importante:** Os usuários usarão esses métodos para fazer login, mas apenas o Master Admin pode criar/autorizar contas.

### 1.2. Regras de Segurança do Firestore (ATUALIZADAS)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Função helper para verificar se é admin
    function isAdmin() {
      return request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'master_admin'];
    }
    
    // Função helper para verificar se é master admin
    function isMasterAdmin() {
      return request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'master_admin';
    }
    
    // Função para verificar se é o próprio usuário
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    // Função para verificar se usuário está autorizado
    function isAuthorizedUser() {
      return request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.authorized == true;
    }
    
    match /users/{userId} {
      // READ: Próprio usuário OU admin
      allow read: if isOwner(userId) || isAdmin();
      
      // CREATE: APENAS master_admin pode criar usuários
      allow create: if isMasterAdmin() && 
        request.resource.data.keys().hasAll(['email', 'role', 'uid', 'authorized']) &&
        request.resource.data.role in ['user', 'admin', 'master_admin'];
      
      // UPDATE: Próprio usuário (apenas campos limitados) OU master_admin (todos os campos)
      allow update: if (isOwner(userId) && 
                       !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'authorized', 'uid'])) ||
                       isMasterAdmin();
      
      // DELETE: APENAS master_admin
      allow delete: if isMasterAdmin();
    }
    
    // Lista de usuários pendentes de aprovação (opcional)
    match /pending_users/{userId} {
      allow read, write: if isMasterAdmin();
    }
  }
}
```

### 1.3. Estrutura do Documento de Usuário

```javascript
{
  uid: "firebase_auth_uid",
  email: "usuario@exemplo.com",
  displayName: "Nome do Usuário",
  role: "user", // user | admin | master_admin
  authorized: true, // CRUCIAL: controla se o usuário pode acessar o sistema
  dashboardLink: "https://app.powerbi.com/view?...",
  photoURL: "https://...", // do provider de autenticação
  provider: "google.com", // ou "password", "microsoft.com", etc.
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastLogin: Timestamp
}
```

## 2. Configuração do Next.js

### 2.1. Instalar Dependências

```bash
npm install firebase
# ou
yarn add firebase
```

### 2.2. Criar Configuração do Firebase

Crie o arquivo `lib/firebase.js`:

```javascript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
```

### 2.3. Variáveis de Ambiente

Crie o arquivo `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
```

## 3. Context de Autenticação (ATUALIZADO)

### 3.1. AuthContext com Verificação de Autorização

Crie `contexts/AuthContext.js`:

```javascript
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider
} from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // Buscar dados do usuário no Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setAuthorized(data.authorized === true);
          
          // Atualizar último login
          await updateDoc(doc(db, 'users', user.uid), {
            lastLogin: serverTimestamp()
          });
        } else {
          // Usuário autenticado mas não autorizado (não existe no Firestore)
          setUserData(null);
          setAuthorized(false);
        }
      } else {
        setUser(null);
        setUserData(null);
        setAuthorized(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Login com Google
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      return result;
    } catch (error) {
      console.error("Erro no login com Google:", error);
      throw error;
    }
  };

  // Login com Microsoft
  const signInWithMicrosoft = async () => {
    const provider = new OAuthProvider('microsoft.com');
    try {
      const result = await signInWithPopup(auth, provider);
      return result;
    } catch (error) {
      console.error("Erro no login com Microsoft:", error);
      throw error;
    }
  };

  // Login com GitHub
  const signInWithGitHub = async () => {
    const provider = new OAuthProvider('github.com');
    try {
      const result = await signInWithPopup(auth, provider);
      return result;
    } catch (error) {
      console.error("Erro no login com GitHub:", error);
      throw error;
    }
  };

  const signOut = async () => {
    setUser(null);
    setUserData(null);
    setAuthorized(false);
    return firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      authorized,
      loading, 
      signInWithGoogle,
      signInWithMicrosoft,
      signInWithGitHub,
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 3.2. Usar o Context no _app.js

```javascript
import { AuthProvider } from '../contexts/AuthContext';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
```

## 4. Componentes e Páginas

### 4.1. Página de Login

Crie `pages/login.js`:

```javascript
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Login() {
  const { 
    user, 
    authorized, 
    loading, 
    signInWithGoogle, 
    signInWithMicrosoft,
    signInWithGitHub 
  } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (authorized) {
        router.push('/dashboard');
      } else {
        router.push('/unauthorized');
      }
    }
  }, [user, authorized, loading]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="login-container">
      <h1>Login</h1>
      <p>Faça login com sua conta autorizada</p>
      
      <button onClick={signInWithGoogle}>
        Entrar com Google
      </button>
      
      <button onClick={signInWithMicrosoft}>
        Entrar com Microsoft
      </button>
      
      <button onClick={signInWithGitHub}>
        Entrar com GitHub
      </button>
    </div>
  );
}
```

### 4.2. Página de Não Autorizado

Crie `pages/unauthorized.js`:

```javascript
import { useAuth } from '../contexts/AuthContext';

export default function Unauthorized() {
  const { user, signOut } = useAuth();

  return (
    <div className="unauthorized-container">
      <h1>Acesso Não Autorizado</h1>
      <p>Sua conta ({user?.email}) ainda não foi autorizada pelo administrador.</p>
      <p>Entre em contato com o administrador do sistema para solicitar acesso.</p>
      <button onClick={signOut}>Sair</button>
    </div>
  );
}
```

### 4.3. Proteção de Rotas (ATUALIZADA)

Crie `components/ProtectedRoute.js`:

```javascript
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user, userData, authorized, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!authorized) {
        router.push('/unauthorized');
      } else if (requiredRole && !['admin', 'master_admin'].includes(userData?.role)) {
        router.push('/dashboard');
      } else if (requiredRole === 'master_admin' && userData?.role !== 'master_admin') {
        router.push('/dashboard');
      }
    }
  }, [user, userData, authorized, loading, requiredRole]);

  if (loading || !user || !authorized) {
    return <div>Carregando...</div>;
  }

  if (requiredRole && userData?.role !== requiredRole && 
      !(requiredRole === 'admin' && userData?.role === 'master_admin')) {
    return null;
  }

  return children;
}
```

### 4.4. Painel Admin - Gerenciar Usuários (NOVO)

Crie `pages/admin/users.js`:

```javascript
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const { userData } = useAuth();

  // Formulário para novo usuário
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    role: 'user',
    dashboardLink: '',
    authorized: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // Atualizar usuário existente
        await updateDoc(doc(db, 'users', editingUser.uid), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        alert('Usuário atualizado com sucesso!');
      } else {
        // Criar novo usuário no Firestore
        // NOTA: O usuário precisará fazer login com um dos providers habilitados
        const userId = `pending_${Date.now()}`; // ID temporário
        await setDoc(doc(db, 'users', userId), {
          ...formData,
          uid: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          provider: 'pending' // Será atualizado no primeiro login
        });
        alert('Usuário pré-cadastrado! Ele poderá fazer login quando usar um dos métodos habilitados com este email.');
      }
      
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      alert('Erro ao salvar usuário: ' + error.message);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) return;
    
    try {
      await deleteDoc(doc(db, 'users', userId));
      alert('Usuário deletado com sucesso!');
      fetchUsers();
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      alert('Erro ao deletar usuário: ' + error.message);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      displayName: user.displayName || '',
      role: user.role,
      dashboardLink: user.dashboardLink || '',
      authorized: user.authorized
    });
    setShowModal(true);
  };

  const toggleAuthorization = async (userId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        authorized: !currentStatus,
        updatedAt: serverTimestamp()
      });
      fetchUsers();
    } catch (error) {
      console.error("Erro ao atualizar autorização:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      displayName: '',
      role: 'user',
      dashboardLink: '',
      authorized: true
    });
    setEditingUser(null);
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <ProtectedRoute requiredRole="master_admin">
      <div className="admin-container">
        <h1>Gerenciar Usuários</h1>
        
        <button onClick={() => setShowModal(true)}>
          + Adicionar Usuário
        </button>

        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Nome</th>
              <th>Role</th>
              <th>Provider</th>
              <th>Autorizado</th>
              <th>Dashboard</th>
              <th>Último Login</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.displayName || '-'}</td>
                <td>{user.role}</td>
                <td>{user.provider || '-'}</td>
                <td>
                  <input 
                    type="checkbox" 
                    checked={user.authorized}
                    onChange={() => toggleAuthorization(user.uid, user.authorized)}
                  />
                </td>
                <td>
                  {user.dashboardLink && (
                    <a href={user.dashboardLink} target="_blank" rel="noopener noreferrer">
                      Ver Dashboard
                    </a>
                  )}
                </td>
                <td>
                  {user.lastLogin ? new Date(user.lastLogin.seconds * 1000).toLocaleString() : '-'}
                </td>
                <td>
                  <button onClick={() => handleEdit(user)}>Editar</button>
                  <button onClick={() => handleDelete(user.uid)}>Deletar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <h2>{editingUser ? 'Editar Usuário' : 'Adicionar Usuário'}</h2>
              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  disabled={editingUser}
                />
                
                <input
                  type="text"
                  placeholder="Nome (opcional)"
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                />
                
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="master_admin">Master Admin</option>
                </select>
                
                <input
                  type="url"
                  placeholder="Link do Dashboard Power BI"
                  value={formData.dashboardLink}
                  onChange={(e) => setFormData({...formData, dashboardLink: e.target.value})}
                />
                
                <label>
                  <input
                    type="checkbox"
                    checked={formData.authorized}
                    onChange={(e) => setFormData({...formData, authorized: e.target.checked})}
                  />
                  Autorizado a acessar o sistema
                </label>
                
                <div className="modal-buttons">
                  <button type="submit">
                    {editingUser ? 'Atualizar' : 'Criar'}
                  </button>
                  <button type="button" onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
```

## 5. Cloud Functions (IMPORTANTE)

### 5.1. Sincronizar Auth com Firestore

Quando um usuário faz login pela primeira vez, precisamos criar/atualizar o documento no Firestore.

Crie `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// Quando usuário faz login pela primeira vez
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  const userRef = db.collection('users').doc(user.uid);
  const userDoc = await userRef.get();
  
  // Se já existe (foi pré-cadastrado pelo admin), apenas atualizar
  if (userDoc.exists()) {
    return userRef.update({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || userDoc.data().displayName,
      photoURL: user.photoURL,
      provider: user.providerData[0]?.providerId || 'unknown',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  
  // Se não existe, criar como NÃO autorizado
  return userRef.set({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    role: 'user',
    authorized: false, // NÃO autorizado por padrão
    provider: user.providerData[0]?.providerId || 'unknown',
    dashboardLink: '',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
});

// Quando usuário é deletado do Auth
exports.onUserDelete = functions.auth.user().onDelete(async (user) => {
  return db.collection('users').doc(user.uid).delete();
});

// Função para vincular usuário pendente com Auth
exports.linkPendingUser = functions.https.onCall(async (data, context) => {
  // Verifica se quem está chamando é master_admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
  }
  
  const callerDoc = await db.collection('users').doc(context.auth.uid).get();
  if (callerDoc.data().role !== 'master_admin') {
    throw new functions.https.HttpsError('permission-denied', 'Apenas master_admin pode executar esta ação');
  }
  
  const { pendingUserId, authUserId } = data;
  
  // Copiar dados do usuário pendente para o usuário autenticado
  const pendingUserDoc = await db.collection('users').doc(pendingUserId).get();
  if (!pendingUserDoc.exists()) {
    throw new functions.https.HttpsError('not-found', 'Usuário pendente não encontrado');
  }
  
  const pendingData = pendingUserDoc.data();
  
  // Atualizar usuário autenticado com os dados do pendente
  await db.collection('users').doc(authUserId).set({
    ...pendingData,
    uid: authUserId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  
  // Deletar usuário pendente
  await db.collection('users').doc(pendingUserId).delete();
  
  return { success: true };
});
```

### 5.2. Deploy das Cloud Functions

```bash
cd functions
npm install
firebase deploy --only functions
```

## 6. Fluxo Completo

### 6.1. Criação de Usuário pelo Master Admin

1. Master Admin acessa `/admin/users`
2. Clica em "Adicionar Usuário"
3. Preenche email, role, dashboard link
4. Usuário é criado no Firestore com `authorized: true`

### 6.2. Primeiro Login do Usuário

1. Usuário acessa `/login`
2. Escolhe método de autenticação (Google, Microsoft, etc.)
3. Faz login
4. Cloud Function verifica se usuário existe no Firestore:
   - **Se existe:** Atualiza dados e permite acesso
   - **Se não existe:** Cria com `authorized: false` → Redireciona para `/unauthorized`

### 6.3. Autorização de Usuário

1. Master Admin vê lista de usuários não autorizados
2. Marca checkbox "Autorizado"
3. Usuário pode fazer logout/login e acessar o sistema

## 7. Estilos CSS (Básico)

Crie `styles/globals.css`:

```css
.login-container, .unauthorized-container, .admin-container {
  max-width: 1200px;
  margin: 50px auto;
  padding: 20px;
}

button {
  padding: 10px 20px;
  margin: 5px;
  cursor: pointer;
  border: none;
  border-radius: 5px;
  background-color: #0070f3;
  color: white;
}

button:hover {
  background-color: #0051cc;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f2f2f2;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
}

.modal-content input,
.modal-content select {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
```

## 8. Checklist de Implementação

### Configuração Inicial
- [ ] Habilitar métodos de autenticação no Firebase Console
- [ ] Configurar variáveis de ambiente (`.env.local`)
- [ ] Atualizar regras do Firestore
- [ ] Criar primeiro Master Admin manualmente no Firestore

### Estrutura do Projeto
- [ ] Instalar dependências (`npm install firebase`)
- [ ] Criar `lib/firebase.js`
- [ ] Criar `contexts/AuthContext.js`
- [ ] Atualizar `pages/_app.js`

### Páginas
- [ ] Criar `pages/login.js`
- [ ] Criar `pages/unauthorized.js`
- [ ] Criar `pages/dashboard.js`
- [ ] Criar `pages/admin/users.js`
- [ ] Criar `components/ProtectedRoute.js`

### Cloud Functions
- [ ] Configurar Firebase Functions
- [ ] Criar função `onUserCreate`
- [ ] Criar função `onUserDelete`
- [ ] Deploy das functions

### Testes
- [ ] Testar login com diferentes providers
- [ ] Testar criação de usuário pelo Master Admin
- [ ] Testar autorização/desautorização
- [ ] Testar proteção de rotas
- [ ] Testar roles (user, admin, master_admin)

## 9. Segurança

### 9.1. Criar Primeiro Master Admin

Crie manualmente no Firestore Console:
```
Collection: users
Document ID: [seu_uid_do_firebase_auth]
{
  uid: "seu_uid",
  email: "seu_email@exemplo.com",
  role: "master_admin",
  authorized: true,
  createdAt: [timestamp],
  updatedAt: [timestamp]
}
```

### 9.2. Boas Práticas

- ✅ Nunca exponha as regras do Firestore publicamente
- ✅ Use HTTPS sempre
- ✅ Monitore logs de autenticação
- ✅ Configure alertas para tentativas de acesso não autorizado
- ✅ Revise periodicamente lista de usuários autorizados
- ✅ Use diferentes dashboards do Power BI para diferentes níveis de acesso

## 10. Próximos Passos

1. ✅ Implementar sistema completo conforme guia
2. 📊 Conectar dashboards específicos do Power BI por usuário
3. 📧 Adicionar notificação por email quando usuário é autorizado
4. 📱 Implementar versão mobile
5. 📈 Adicionar analytics e logs de acesso
6. 🔄 Implementar sistema de refresh de dashboards