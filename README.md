# 🔐 Atacte - Gerenciador de Senhas e Notas Seguras

**Atacte** é um gerenciador de senhas e notas seguras desenvolvido com foco em estudo e aprendizado, projetado para rodar em servidor pessoal. O projeto implementa uma solução completa de gerenciamento de senhas com criptografia robusta, autenticação de dois fatores (2FA/TOTP) e interfaces modernas para web e mobile.

A historia do projeto é simples, comprei uma maquina para rodar um homelab, e o vaultwarden nao me servia tão bem, portanto fiz o meu proprio. Acredito que tenhas varias falhas, mas tentei ao maximo fingir que um dia lançaria ele usando tudo que sei.

## 📋 Índice

- [Características](#-características)
- [Arquitetura](#-arquitetura)
- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [API](#-api)
- [Deployment](#-deployment)
- [Desenvolvimento](#-desenvolvimento)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

## ✨ Características

### 🔒 Segurança
- **Criptografia AES-256** para todas as senhas armazenadas
- **Hash bcrypt** para senha mestra com salt personalizado
- **Autenticação JWT** com refresh tokens
- **Rate limiting** para proteção contra ataques de força bruta
- **Auditoria completa** de todas as ações do usuário
- **Sessões gerenciadas** com controle de dispositivos confiáveis

### 🎯 Funcionalidades

#### 🔐 Gerenciamento de Senhas
- **Gerenciamento de senhas** com categorização e favoritos
- **Geração de senhas seguras** com critérios personalizáveis
- **Autenticação de dois fatores (2FA/TOTP)** integrada
- **Importação/Exportação** de dados em formato JSON
- **Campos customizados** para cada entrada de senha
- **Auto-lock** configurável por inatividade
- **Logs de auditoria** detalhados

#### 📝 Notas Seguras
- **Notas criptografadas** com suporte a conteúdo extenso
- **Organização por pastas** para melhor gerenciamento
- **Sistema de favoritos** para acesso rápido
- **Busca avançada** por título e conteúdo

### 🎨 Interface
- **Design responsivo** com Tailwind CSS
- **Interface moderna** construída com Vue.js 3
- **Componentes reutilizáveis** e acessíveis
- **Feedback visual** para força das senhas
- **Navegação intuitiva** com roteamento SPA

## 🏗️ Arquitetura

O projeto segue uma arquitetura de **3 camadas** com separação clara de responsabilidades, suportando múltiplas interfaces:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│                 │    │ (Node.js +      │    │ (PostgreSQL)    │
│ ┌─────────────┐ │    │  Express)       │    │                 │
│ │   Web App   │ │◄──►│ • API REST      │◄──►│ • Dados         │
│ │ (Vue.js 3)  │ │    │ • Autenticação  │    │ • Criptografia  │
│ └─────────────┘ │    │ • Criptografia  │    │ • Auditoria     │
│ ┌─────────────┐ │    │ • Validação     │    │ • Sessões       │
│ │  Mobile App │ │    │                 │    │                 │
│ │(React Native│ │    │                 │    │                 │
│ │   + Expo)   │ │    │                 │    │                 │
│ └─────────────┘ │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Estrutura do Projeto

```
Atacte/
├── backend/                 # API Backend (Node.js + Express)
│   ├── src/
│   │   ├── controllers/     # Controladores das rotas
│   │   ├── services/        # Lógica de negócio
│   │   ├── repositories/    # Acesso aos dados
│   │   ├── middleware/      # Middlewares (auth, validação)
│   │   ├── utils/          # Utilitários (crypto, audit)
│   │   └── infrastructure/ # Configuração (DB, env)
│   └── package.json
├── web/                    # Frontend Web (Vue.js 3)
│   ├── src/
│   │   ├── components/     # Componentes Vue
│   │   ├── views/         # Páginas da aplicação
│   │   ├── stores/        # Estado global (Pinia)
│   │   ├── api/           # Cliente HTTP
│   │   └── router/        # Roteamento
│   └── package.json
├── mobile/                 # App Mobile (React Native + Expo)
│   ├── src/
│   │   ├── components/     # Componentes React Native
│   │   ├── screens/       # Telas da aplicação
│   │   ├── contexts/      # Contextos (Auth, Theme, Toast)
│   │   ├── services/      # Serviços de API
│   │   ├── hooks/         # Custom hooks
│   │   └── navigation/    # Navegação
│   ├── assets/            # Imagens e recursos
│   └── package.json
├── nginx/                  # Configuração do Nginx
├── docker-compose.yml      # Orquestração de containers em produção
├── Dockerfile.backend      # Imagem da API
├── Dockerfile.front        # Imagem do frontend web
└── .gitea/workflows/       # Pipeline de deploy no Gitea Actions
```

## 🛠️ Tecnologias

### Backend
- **Node.js 18** - Runtime JavaScript
- **Express.js** - Framework web
- **TypeScript** - Tipagem estática
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **crypto-js** - Criptografia AES
- **speakeasy** - Geração TOTP
- **helmet** - Segurança HTTP
- **express-rate-limit** - Rate limiting

### Frontend Web
- **Vue.js 3** - Framework frontend
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Tailwind CSS** - Framework CSS
- **Pinia** - Gerenciamento de estado
- **Vue Router** - Roteamento SPA
- **Axios** - Cliente HTTP
- **@vueuse/core** - Utilitários Vue
- **@headlessui/vue** - Componentes acessíveis

### Frontend Mobile
- **React Native** - Framework mobile
- **Expo** - Plataforma de desenvolvimento
- **TypeScript** - Tipagem estática
- **NativeWind** - Tailwind CSS para React Native
- **React Navigation** - Navegação mobile
- **AsyncStorage** - Armazenamento local
- **Expo SecureStore** - Armazenamento seguro
- **React Native Flash Message** - Mensagens toast
- **Expo Clipboard** - Funcionalidade de copiar/colar

### DevOps
- **Docker** - Containerização
- **Docker Compose** - Orquestração
- **Nginx** - Proxy reverso
- **Supervisor** - Gerenciamento de processos

## 📋 Pré-requisitos

- **Node.js** 18+ 
- **npm** 8+
- **PostgreSQL** 13+
- **Docker** 20+ (opcional)
- **Git**
- **Expo CLI** (para desenvolvimento mobile)
- **Android Studio** / **Xcode** (para build mobile)

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/atacte.git
cd atacte
```

### 2. Configuração do Banco de Dados

```bash
# Instalar PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Criar banco e usuário
sudo -u postgres psql
CREATE DATABASE atacte;
CREATE USER atacte_user WITH PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE atacte TO atacte_user;
\q
```

### 3. Configuração do Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp config.env.example config.env
# Edite o arquivo config.env com suas configurações
```

### 4. Configuração do Frontend Web

```bash
cd ../web

# Instalar dependências
npm install
```

### 5. Configuração do App Mobile

```bash
cd ../mobile

# Instalar dependências
npm install

# Instalar Expo CLI globalmente (se ainda não tiver)
npm install -g @expo/cli

# Verificar se tudo está funcionando
npx expo doctor
```

## ⚙️ Configuração

### Variáveis de Ambiente (Backend)

Crie o arquivo `backend/config.env`:

```env
# Servidor
PORT=3001
NODE_ENV=development

# Banco de Dados
DATABASE_URL=postgresql://atacte_user:sua_senha@localhost:5432/atacte

# JWT
JWT_SECRET=sua_chave_jwt_super_secreta_de_pelo_menos_32_caracteres
JWT_EXPIRES_IN=7d

# Criptografia
ENCRYPTION_KEY=sua_chave_de_32_caracteres_exatos

# Segurança
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3000

# Logs
LOG_LEVEL=info
```

### Configuração do Frontend Web

O frontend web se conecta automaticamente ao backend via proxy configurado no Vite.

### Configuração do App Mobile

O app mobile precisa ser configurado para se conectar ao backend:

1. **Configurar URL do backend** - Configure a variável de ambiente `EXPO_PUBLIC_API_BASE_URL` ou edite `mobile/src/lib/axios.ts`:
   ```typescript
   const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://seu-servidor:3001/api';
   ```

2. **Executar prebuild** - Antes do primeiro build, execute:
   ```bash
   cd mobile
   npx expo prebuild --clean
   ```
   Isso aplica as configurações nativas.

3. **Configurar EAS Build** - Para builds de produção, edite `mobile/eas.json`:
   ```json
   {
     "build": {
       "production": {
         "env": {
           "EXPO_PUBLIC_API_BASE_URL": "https://seu-servidor.com/api"
         }
       }
     }
   }
   ```

## 🎯 Uso

### Desenvolvimento Mobile

Para desenvolvimento do app mobile:

1. **Executar prebuild** (primeira vez):
   ```bash
   cd mobile
   npx expo prebuild --clean
   ```

2. **Iniciar desenvolvimento**:
   ```bash
   npm start
   ```

3. **Testar no dispositivo**:
   - Instale o app **Expo Go** no seu smartphone
   - Escaneie o QR code que aparece no terminal
   - Ou use um emulador Android/iOS

### Desenvolvimento

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend Web
cd web
npm run dev

# Terminal 3 - App Mobile (opcional)
cd mobile
npx expo start
```

- **Web**: http://localhost:3000
- **Mobile**: Use o app Expo Go no seu dispositivo ou emulador

### Produção

```bash
# Build do backend
cd backend
npm run build

# Build do frontend web
cd ../web
npm run build

# Build do app mobile (requer prebuild primeiro)
cd ../mobile
npx expo prebuild --clean
npx eas build --platform android --profile production
# ou para iOS:
# npx eas build --platform ios --profile production

# Iniciar backend
cd ../backend
npm start
```

### Com Docker

```bash
# Construir e executar
docker compose up -d --build

# Ver logs
docker compose logs -f

# Parar
docker compose down
```

## 📡 API

### Autenticação

#### POST `/api/auth/register`
Registrar novo usuário.

```json
{
  "email": "usuario@exemplo.com",
  "masterPassword": "senha_mestra_segura"
}
```

#### POST `/api/auth/login`
Fazer login.

```json
{
  "email": "usuario@exemplo.com", 
  "masterPassword": "senha_mestra_segura",
  "deviceName": "Android - Samsung Galaxy"
}
```

#### POST `/api/auth/trust-device`
Confiar em um dispositivo (requer autenticação).

```json
{
  "sessionId": "id_da_sessao"
}
```

#### GET `/api/auth/me`
Obter informações do usuário autenticado.

#### GET `/api/auth/sessions`
Listar todas as sessões ativas do usuário.

### Senhas

#### GET `/api/passwords`
Listar senhas do usuário.

#### POST `/api/passwords`
Criar nova senha.

```json
{
  "name": "Conta do Gmail",
  "website": "gmail.com",
  "username": "usuario@gmail.com",
  "password": "senha_criptografada",
  "notes": "Conta principal",
  "folder": "Trabalho"
}
```

#### PUT `/api/passwords/:id`
Atualizar senha existente.

#### DELETE `/api/passwords/:id`
Excluir senha.

### Notas Seguras

#### GET `/api/secure-notes`
Listar notas do usuário.

#### POST `/api/secure-notes`
Criar nova nota segura.

#### PUT `/api/secure-notes/:id`
Atualizar nota existente.

#### DELETE `/api/secure-notes/:id`
Excluir nota.

#### GET `/api/secure-notes/folders/list`
Listar pastas disponíveis.

### TOTP/2FA

#### POST `/api/totp/generate`
Gerar QR Code para 2FA.

#### POST `/api/totp/verify`
Verificar código TOTP.

### Importação/Exportação

#### GET `/api/import-export/export`
Exportar dados em JSON.

#### POST `/api/import-export/import`
Importar dados de JSON.

## 🚀 Deployment

### Deploy Automático com Gitea Actions

O deploy local por SSH/rsync foi removido. O fluxo atual é:

1. Faça push para o GitHub.
2. O Gitea sincroniza o repositório.
3. O workflow `.gitea/workflows/deploy.yml` roda no runner do próprio servidor.
4. A pipeline cria o `.env`, faz build das imagens, aplica `prisma db push` e sobe os containers com Docker Compose.

Secrets obrigatórios no repositório do Gitea:

- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `VITE_API_URL`

Secrets opcionais:

- `POSTGRES_DB`, padrão `atacte`
- `POSTGRES_USER`, padrão `atacte`
- `POSTGRES_PORT`, padrão `5435`
- `BACKEND_PORT`, padrão `3457`
- `FRONT_PORT`, padrão `3456`
- `JWT_EXPIRES_IN`, padrão `7d`
- `BCRYPT_ROUNDS`, padrão `12`
- `RATE_LIMIT_WINDOW_MS`, padrão `900000`
- `RATE_LIMIT_MAX_REQUESTS`, padrão `500`
- `CORS_ORIGIN`, padrão `*`
- `LOG_LEVEL`, padrão `info`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `EMAIL_FROM_NAME`, `PASSWORD_RESET_URL`

### Deploy Manual no Servidor

O caminho manual ainda existe só para manutenção emergencial: crie um `.env` na raiz com os mesmos valores dos secrets e rode `docker compose --env-file .env up -d --build`.

O `.env` permanece ignorado pelo Git.

## 💻 Desenvolvimento

### Estrutura de Código

O projeto segue padrões de **Clean Architecture**:

- **Controllers**: Recebem requisições e retornam respostas
- **Services**: Contêm a lógica de negócio
- **Repositories**: Gerenciam acesso aos dados
- **Utils**: Funções utilitárias (crypto, audit, etc.)

### Scripts Disponíveis

```bash
# Backend
npm run dev          # Desenvolvimento com hot reload
npm run build        # Build para produção
npm run start        # Iniciar em produção
npm run test         # Executar testes
npm run db:generate  # Gerar cliente Prisma
npm run db:push      # Sincronizar schema com DB
npm run db:migrate   # Executar migrações
npm run db:studio    # Abrir Prisma Studio

# Frontend Web
npm run dev          # Desenvolvimento com hot reload
npm run build        # Build para produção
npm run preview      # Preview do build
npm run type-check   # Verificar tipos TypeScript
npm run lint         # Linter ESLint

# App Mobile
npm start            # Iniciar Expo dev server
npm run android      # Executar no Android
npm run ios          # Executar no iOS
npm run web          # Executar versão web (Expo)
```

### Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Fernando** - Desenvolvedor

---
