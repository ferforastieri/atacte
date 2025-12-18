# 🖥️ Atacte Desktop

Aplicativo desktop do Atacte construído com Electron.

## 📋 Pré-requisitos

- Node.js 18+
- npm 8+
- Backend do Atacte rodando (ou configurar URL remota)

## 🚀 Desenvolvimento

### 1. Instalar dependências

```bash
cd desktop
npm install
```

### 2. Build do frontend web

Antes de rodar o Electron, você precisa compilar o frontend web:

```bash
cd ../web
npm run build
cd ../desktop
```

### 3. Rodar em modo desenvolvimento

```bash
# Terminal 1: Backend
cd ../backend
npm run dev

# Terminal 2: Frontend Web (para desenvolvimento)
cd ../web
npm run dev

# Terminal 3: Electron
cd ../desktop
npm run dev
```

### 4. Rodar em modo produção (usando build estático)

```bash
# Build do frontend web primeiro
cd ../web
npm run build

# Rodar Electron
cd ../desktop
npm start
```

## 📦 Build para Distribuição

### Build para todas as plataformas

```bash
npm run build:all
```

### Build específico por plataforma

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

### Apenas empacotar (sem criar instalador)

```bash
npm run pack
```

Os instaladores serão gerados na pasta `desktop/dist/`.

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na pasta `desktop/`:

```env
BACKEND_URL=http://localhost:3001
NODE_ENV=development
```

### Configurar URL do Backend Remoto

Se você quiser que o app desktop se conecte a um backend remoto:

1. Edite o arquivo `.env`:
```env
BACKEND_URL=https://seu-servidor.com
```

2. Ou configure via variável de ambiente:
```bash
BACKEND_URL=https://seu-servidor.com npm start
```

## 🎨 Ícones

Coloque o ícone na pasta `desktop/build/`:
- `icon.png` - Ícone principal (1024x1024 recomendado)

O electron-builder vai gerar automaticamente os formatos `.ico` (Windows) e `.icns` (macOS) durante o build.

## 📝 Notas

- O aplicativo desktop usa o build estático do frontend web (`web/dist/`)
- Em desenvolvimento, você pode usar o servidor Vite do web (`npm run dev`)
- O Electron se conecta ao backend configurado via `BACKEND_URL`
- Por padrão, tenta conectar em `http://localhost:3001`

## 🔧 Troubleshooting

### Erro: "Cannot find module"

Certifique-se de que executou `npm install` na pasta `desktop/`.

### Erro: "Cannot load index.html"

Certifique-se de que executou `npm run build` na pasta `web/` antes de rodar o Electron em modo produção.

### Backend não conecta

Verifique se:
1. O backend está rodando
2. A URL está correta no `.env` ou variável de ambiente
3. O CORS está configurado no backend para permitir requisições do Electron

