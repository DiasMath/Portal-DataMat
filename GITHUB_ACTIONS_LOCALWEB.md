# Guia Completo: CI/CD com GitHub Actions para LocalWeb

## 📋 Índice
1. [Workflows Criados](#workflows-criados)
2. [Configuração no GitHub](#configuração-no-github)
3. [Configuração no LocalWeb](#configuração-no-localweb)
4. [Secrets Necessários](#secrets-necessários)
5. [Métodos de Deploy](#métodos-de-deploy)
6. [Troubleshooting](#troubleshooting)

---

## 🔄 Workflows Criados

### 1. **CI - Build and Test** (`ci.yml`)
- **Quando executa**: Em push ou PR para `main` ou `develop`
- **O que faz**: 
  - Instala dependências
  - Executa linter
  - Faz build do projeto
  - Salva artefatos de build

### 2. **CD - Deploy to LocalWeb via SSH** (`cd-localweb.yml`)
- **Quando executa**: Em push para `main` ou manualmente
- **O que faz**:
  - Build completo
  - Deploy via SSH
  - Usa PM2 para gerenciar o processo
  - Reinicia automaticamente

### 3. **CD - Deploy to LocalWeb via FTP** (`cd-localweb-ftp.yml`)
- **Quando executa**: Manualmente ou push para `production`
- **O que faz**:
  - Build e upload via FTP
  - Alternativa quando SSH não está disponível

---

## ⚙️ Configuração no GitHub

### Passo 1: Adicionar Secrets
Vá em: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

#### Secrets do Firebase (obrigatórios):
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_ADMIN_PRIVATE_KEY
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PROJECT_ID
```

#### Secret JWT:
```
JWT_SECRET=seu_jwt_secret_aqui
```

#### Secrets do LocalWeb - Opção SSH:
```
LOCALWEB_HOST=seu-servidor.localweb.com.br
LOCALWEB_USERNAME=seu_usuario
LOCALWEB_PASSWORD=sua_senha
LOCALWEB_PORT=22
LOCALWEB_PROJECT_PATH=/home/usuario/analise-frontend
```

#### Secrets do LocalWeb - Opção FTP:
```
LOCALWEB_FTP_HOST=ftp.seu-servidor.com.br
LOCALWEB_FTP_USERNAME=seu_usuario_ftp
LOCALWEB_FTP_PASSWORD=sua_senha_ftp
LOCALWEB_FTP_PORT=21
LOCALWEB_FTP_PATH=/public_html/
```

### Passo 2: Habilitar Workflows
1. Vá em `Actions` no seu repositório
2. Confirme que deseja habilitar workflows
3. Os workflows aparecerão automaticamente

---

## 🖥️ Configuração no LocalWeb

### Método 1: Deploy via SSH (Recomendado)

#### Pré-requisitos no servidor:
```bash
# 1. Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Instalar PM2 globalmente
sudo npm install -g pm2

# 3. Clonar o repositório
cd /home/seu-usuario
git clone https://github.com/seu-usuario/analise-frontend.git
cd analise-frontend

# 4. Instalar dependências
npm install

# 5. Criar arquivo .env.local com suas variáveis
nano .env.local

# 6. Fazer build inicial
npm run build

# 7. Configurar PM2
pm2 start npm --name "analise-frontend" -- start
pm2 save
pm2 startup
```

#### Arquivo .env.local no servidor:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
FIREBASE_ADMIN_PRIVATE_KEY="sua_private_key"
FIREBASE_ADMIN_CLIENT_EMAIL=seu_client_email
FIREBASE_ADMIN_PROJECT_ID=seu_admin_project_id
JWT_SECRET=seu_jwt_secret
```

#### Configurar SSH Key (opcional, mais seguro):
```bash
# No seu computador local:
ssh-keygen -t ed25519 -C "github-actions"
cat ~/.ssh/id_ed25519.pub

# No servidor LocalWeb:
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
# Cole a chave pública aqui

# No GitHub, adicione o secret:
# LOCALWEB_SSH_KEY = conteúdo do arquivo ~/.ssh/id_ed25519 (chave privada)
```

### Método 2: Deploy via FTP

#### Configuração mínima:
1. Tenha acesso FTP ao seu servidor
2. Configure os secrets FTP no GitHub
3. O workflow fará upload dos arquivos necessários
4. Configure o servidor web (Nginx/Apache) para servir a aplicação

#### Exemplo Nginx:
```nginx
server {
    listen 80;
    server_name seu-dominio.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔐 Secrets Necessários (Resumo)

### Essenciais (todos os métodos):
- ✅ Todas as variáveis do Firebase
- ✅ JWT_SECRET

### Para SSH Deploy:
- ✅ LOCALWEB_HOST
- ✅ LOCALWEB_USERNAME
- ✅ LOCALWEB_PASSWORD ou LOCALWEB_SSH_KEY
- ✅ LOCALWEB_PROJECT_PATH

### Para FTP Deploy:
- ✅ LOCALWEB_FTP_HOST
- ✅ LOCALWEB_FTP_USERNAME
- ✅ LOCALWEB_FTP_PASSWORD
- ✅ LOCALWEB_FTP_PATH

---

## 🚀 Como Usar

### Deploy Automático:
1. Faça commit no branch `main` → Deploy SSH automático
2. Faça commit no branch `production` → Deploy FTP automático

### Deploy Manual:
1. Vá em `Actions` no GitHub
2. Selecione o workflow desejado
3. Clique em `Run workflow`
4. Escolha o branch
5. Clique em `Run workflow`

---

## 🔍 Troubleshooting

### Erro de build:
```bash
# Verifique se todos os secrets estão configurados
# Rode localmente para testar:
npm ci
npm run build
```

### Erro de conexão SSH:
```bash
# Teste a conexão manualmente:
ssh usuario@servidor -p 22

# Verifique firewall do servidor:
sudo ufw status
sudo ufw allow 22
```

### Erro de permissão:
```bash
# No servidor, dê permissões corretas:
sudo chown -R seu-usuario:seu-usuario /home/seu-usuario/analise-frontend
chmod -R 755 /home/seu-usuario/analise-frontend
```

### PM2 não está rodando:
```bash
# No servidor:
pm2 list
pm2 restart analise-frontend
pm2 logs analise-frontend
```

### Erro de FTP:
- Verifique credenciais
- Confirme que FTP está habilitado no LocalWeb
- Teste com cliente FTP (FileZilla) primeiro

---

## 📊 Monitoramento

### Verificar logs do PM2:
```bash
pm2 logs analise-frontend
pm2 monit
```

### Verificar status do deploy:
- Acesse a aba `Actions` no GitHub
- Veja o status de cada workflow
- Clique nos jobs para ver logs detalhados

---

## 🎯 Próximos Passos

1. ✅ Configure todos os secrets no GitHub
2. ✅ Prepare o servidor LocalWeb
3. ✅ Faça um push para testar
4. ✅ Monitore o primeiro deploy
5. ✅ Configure domínio customizado (se aplicável)

---

## 📞 Suporte LocalWeb

Se tiver problemas com a configuração do servidor:
- Acesse o painel da LocalWeb
- Abra um ticket de suporte
- Solicite: acesso SSH, Node.js 20, PM2

---

## 💡 Dicas

- Use deploy SSH para produção (mais rápido e confiável)
- Use deploy FTP como fallback
- Teste sempre em branch `develop` antes de `main`
- Mantenha os secrets atualizados
- Faça backup antes de mudanças críticas
