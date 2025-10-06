# Configuração do Firebase Admin SDK

## ✨ Nova Funcionalidade: Criação Automática de Usuários

Agora quando o master-admin cria um usuário através da interface `/admin/users`, o sistema automaticamente:

1. **Cria a conta de autenticação no Firebase Auth**
2. **Cria o documento correspondente no Firestore**
3. **Gera uma senha temporária (se não fornecida)**
4. **Envia email de redefinição de senha**

Isso resolve o problema do erro `auth/invalid-credential` que ocorria quando usuários tentavam fazer login com credenciais que existiam apenas no Firestore, mas não no Firebase Auth.

## 🔧 Configuração Necessária

### 1. Obter Chave de Serviço do Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto (`datamat-60194`)
3. Vá em **Project Settings** (ícone de engrenagem)
4. Clique na aba **Service Accounts**
5. Clique em **Generate new private key**
6. Baixe o arquivo JSON

### 2. Configurar Variável de Ambiente

1. Abra o arquivo JSON baixado
2. Copie **todo o conteúdo** (deve ser uma linha única)
3. Cole no arquivo `.env.local` na variável `FIREBASE_SERVICE_ACCOUNT_KEY`

Exemplo:
```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"datamat-60194","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

### 3. Configurar Método de Autenticação Email/Password

No Firebase Console:

1. Vá em **Authentication** → **Sign-in method**
2. Clique em **Email/Password**
3. **Habilite** a primeira opção (Email/Password)
4. **Salve**

## 🚀 Como Funciona

### Para o Master Admin:

1. Acesse `/admin/users`
2. Clique em **"Criar Usuário"**
3. Preencha as informações:
   - **Email** (obrigatório)
   - **Nome de Exibição** (opcional)
   - **Papel** (user/admin/master_admin)
   - **Senha** (opcional - deixe vazio para gerar automaticamente)
   - **Dashboard Link** (opcional)
   - **Usuário autorizado** (checkbox)

4. Clique em **"Criar Usuário"**

### O Sistema Automaticamente:

1. ✅ Cria conta no Firebase Auth
2. ✅ Cria documento no Firestore
3. ✅ Gera senha temporária (se necessário)
4. ✅ Envia email de redefinição de senha
5. ✅ Exibe a senha temporária para o admin compartilhar

### Para o Usuário Criado:

1. **Cenário 1** - Senha fornecida pelo admin:
   - Use email e senha fornecidos pelo admin
   - Acesse o sistema normalmente

2. **Cenário 2** - Senha gerada automaticamente:
   - Use a senha temporária fornecida pelo admin
   - **OU** clique no link do email de redefinição para criar sua própria senha
   - Acesse o sistema normalmente

## 🔒 Segurança

- ✅ Apenas master admins podem criar usuários
- ✅ Senhas temporárias são complexas (12 caracteres com símbolos)
- ✅ Email de redefinição é enviado automaticamente
- ✅ Tokens de autenticação são verificados na API
- ✅ Validação de permissões em cada operação

## 🐛 Solução de Problemas

### Erro: "Firebase Admin não configurado"
- Verifique se a variável `FIREBASE_SERVICE_ACCOUNT_KEY` está configurada
- Certifique-se de que o JSON está em uma única linha
- Verifique se todas as aspas estão escapadas corretamente

### Erro: "auth/invalid-credential" (problema original)
- ✅ **RESOLVIDO!** Agora usuários são criados automaticamente no Firebase Auth

### Email de redefinição não é enviado
- Verifique as configurações de email no Firebase Console
- Configure um domínio de email personalizado se necessário
- O email será enviado do domínio do Firebase por padrão

## 📋 Checklist de Configuração

- [ ] Firebase Admin SDK instalado (`npm install firebase-admin`)
- [ ] Chave de serviço obtida do Firebase Console
- [ ] Variável `FIREBASE_SERVICE_ACCOUNT_KEY` configurada no `.env.local`
- [ ] Método Email/Password habilitado no Firebase Auth
- [ ] Aplicação reiniciada após configuração
- [ ] Teste de criação de usuário realizado

## 🔄 Migração de Usuários Existentes

Se você tem usuários que foram criados apenas no Firestore (método antigo), eles precisarão:

1. **Ser recriados** usando o novo sistema
2. **OU** solicitar redefinição de senha através do Firebase Auth

Recomendamos usar o novo sistema para todos os novos usuários.