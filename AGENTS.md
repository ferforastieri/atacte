# Atacte: guia de instalação para agentes de IA

Este arquivo é o roteiro operacional para agentes que precisam instalar, atualizar ou validar o Atacte. Para uma instalação de uso real, prefira as imagens publicadas. Use a instalação a partir do código-fonte somente quando o objetivo for desenvolvimento.

## Regras de segurança

- Confirme com o usuário se o objetivo é **produção** ou **desenvolvimento** quando isso não estiver explícito.
- Não sobrescreva um `.env` existente e não remova volumes Docker.
- Backup lógico é opcional; não exija nem execute backup automático antes de atualizar. Preserve o volume PostgreSQL e o `.env` existentes.
- Nunca mostre em logs ou respostas os valores de `POSTGRES_PASSWORD`, `JWT_SECRET`, `ENCRYPTION_KEY`.
- Não exponha PostgreSQL (`5435`) nem Redis à internet. Restrinja a porta da API (`3457`) à rede do reverse proxy.
- A primeira conta administrativa precisa ser criada por uma pessoa no navegador; não automatize credenciais do cofre.

## Escolha rápida

| Objetivo | Procedimento |
| --- | --- |
| Executar o Atacte em um servidor | Instalador com Docker, descrito abaixo |
| Alterar ou testar o código | Ambiente de desenvolvimento |
| Atualizar uma instalação | `docker compose pull`, migrations e `docker compose up` |
| Diagnosticar uma instalação | Checklist de validação e logs |

## Instalação de servidor com Docker

### 1. Verifique os requisitos sem alterar o host

```sh
docker info >/dev/null
docker compose version
command -v curl
```

Requisitos: Docker Engine ativo, Docker Compose v2, `curl` e pelo menos 1 GB de RAM. O usuário atual precisa ter permissão para executar Docker.

### 2. Execute o instalador

```sh
curl -fsSL https://atacte.vercel.app/install.sh | sh
```

O instalador:

- cria `~/.atacte` ou o diretório definido em `ATACTE_DIR`;
- preserva `.env` e o volume PostgreSQL existentes;
- gera os segredos ausentes com permissão `0600`;
- baixa as imagens de PostgreSQL, Redis, backend e frontend;
- aplica as migrations versionadas com `prisma migrate deploy`;
- publica o manager em `http://localhost:3456` e a API em `3457`.

Para escolher outro diretório em uma instalação nova:

```sh
curl -fsSL https://atacte.vercel.app/install.sh | env ATACTE_DIR=/opt/atacte sh
```

Não altere o diretório de uma instalação existente sem planejar a migração do volume e do `.env`.

### 3. Valide o resultado

```sh
cd "${ATACTE_DIR:-$HOME/.atacte}"
docker compose ps
curl -fsS http://localhost:3457/health
curl -fsS http://localhost:3456/ >/dev/null
```

Resultado esperado: `postgres`, `redis`, `backend` e `front` em execução; o health check da API deve retornar sucesso. Para a primeira conta, autorize o email informado pela pessoa com `docker compose exec backend npm run security:allow-registration -- EMAIL`; ela deve abrir `http://localhost:3456` e concluir o cadastro no navegador em até 15 minutos. Instalações existentes não precisam dessa autorização.

Se a validação falhar, colete somente logs sem segredos:

```sh
docker compose logs --tail=100 postgres redis backend front
```

Não inclua o conteúdo de `.env` no diagnóstico.

## HTTPS e reverse proxy

Antes de disponibilizar o serviço fora da máquina local, ajuste `~/.atacte/.env`:

```env
CORS_ORIGIN=https://cofre.exemplo.com
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
TRUST_PROXY=1
```

Depois aplique a configuração:

```sh
cd ~/.atacte
docker compose up -d --no-build --remove-orphans
```

O reverse proxy deve encaminhar o domínio público para o frontend na porta `3456`. Mantenha a API `3457` acessível apenas pela rede confiável do proxy e preserve os headers `Host`, `X-Forwarded-For` e `X-Forwarded-Proto`.

## Atualização e backup

Se desejar um backup manual, execute:

```sh
cd ~/.atacte
docker compose exec -T postgres pg_dump -U atacte -d atacte > atacte-backup.sql
```

Se optar pelo backup, confirme que o arquivo existe e não está vazio. A atualização independe desse passo:

```sh
docker compose pull backend front redis
docker compose up -d --wait postgres redis
docker compose run --rm --no-deps backend ./node_modules/.bin/prisma migrate deploy --schema=src/infrastructure/prisma/schema.prisma
docker compose up -d --no-build --remove-orphans
curl -fsS http://localhost:3457/health
```

O instalador também pode ser executado novamente. Ele preserva o `.env` e o volume do banco.

### Fixar uma release

`ATACTE_RELEASE_REF` escolhe a revisão do `docker-compose.yml`; ele não fixa sozinho as imagens. Para manter uma versão, grave no `.env` as duas tags correspondentes:

```env
BACKEND_IMAGE=ghcr.io/ferforastieri/atacte-backend:vX.Y.Z
FRONT_IMAGE=ghcr.io/ferforastieri/atacte-frontend:vX.Y.Z
```

Substitua `vX.Y.Z` por uma tag existente na página de releases. Não invente uma tag. Depois execute `docker compose pull` e `docker compose up -d --no-build --remove-orphans`.

## Ambiente de desenvolvimento

Requisitos: Node.js 24, npm, Docker Compose v2 e Redis.

### 1. Instale as dependências

```sh
npm --prefix backend ci
npm --prefix backend run db:generate
npm --prefix web ci
npm --prefix mobile ci
```

### 2. Suba o PostgreSQL local

Use uma senha exclusiva para desenvolvimento e não reutilize segredos de produção:

```sh
POSTGRES_PASSWORD=atacte-local-development docker compose up -d postgres
```

### 3. Configure o backend

Se `backend/.env` ainda não existir, copie `backend/.env.example` e ajuste pelo menos:

```env
NODE_ENV=development
DATABASE_URL=postgresql://atacte:atacte-local-development@localhost:5435/atacte?sslmode=disable
JWT_SECRET=gere_uma_chave_local_com_32_ou_mais_caracteres
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef
CORS_ORIGIN=http://localhost:3000
COOKIE_SECURE=false
```

O arquivo é ignorado pelo Git. Não substitua um `backend/.env` que já exista.

### 4. Aplique migrations e inicie API e web

```sh
npm --prefix backend run db:migrate:deploy
npm --prefix backend run dev
```

Em outro terminal:

```sh
npm --prefix web run dev
```

O manager fica em `http://localhost:3000` e encaminha `/api` para `http://localhost:3001`.

Para o aplicativo mobile, em outro terminal:

```sh
npm --prefix mobile start
```

## Verificações antes de concluir

Execute apenas os grupos relacionados às mudanças, ou todos para uma validação completa:

```sh
npm --prefix backend run db:generate
npm --prefix backend run build
npm --prefix backend test
npm --prefix web run type-check
npm --prefix web run build
(cd mobile && npx tsc --noEmit)
docker compose config --quiet
```

Ao finalizar, relate o modo usado, o endereço de acesso, os checks executados e qualquer etapa manual restante. Nunca inclua segredos na resposta.

## Autenticação e Redis

Use [SECURITY_DEPLOYMENT.md](SECURITY_DEPLOYMENT.md) para a autorização inicial por email. A pessoa cria a conta no navegador; o agente não automatiza credenciais do cofre. A autorização no servidor é temporária e não exige envio de email nem código.

O Compose atual não inclui atualizador nem socket Docker. Atualizações são manuais, com backup opcional. Redis não publica porta e usa rede interna. Para desenvolvimento fora dos containers, execute uma instância Redis dedicada em loopback e configure `REDIS_URL`.

A migração de segurança encerra sessões antigas. O login usa email e senha; a biometria é uma opção local no aplicativo mobile.
