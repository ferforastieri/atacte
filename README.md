# Atacte

Gerenciador self-hosted de senhas, códigos TOTP e notas privadas. O Atacte foi pensado para pessoas e pequenas equipes que querem uma interface agradável sem entregar o cofre a um serviço externo: você escolhe o servidor, mantém o PostgreSQL e controla as atualizações.

## O que você pode fazer

- guardar, pesquisar, favoritar e organizar senhas;
- gerar e consultar códigos de autenticação TOTP;
- criar notas privadas e pastas;
- importar e exportar seus dados em JSON;
- revisar sessões conectadas e auditoria;
- usar o mesmo servidor pela web, pelo aplicativo Android/Expo ou pelo desktop;
- receber um aviso no gerenciador quando uma nova versão estiver disponível.

O código é dividido em uma API Express/Prisma, um gerenciador Vue/Tailwind e clientes mobile/desktop. A landing, a documentação e o histórico de releases são publicados separadamente do gerenciador autenticado.

## Instalação rápida (Docker)

Requisitos: Docker Engine com Docker Compose v2, `curl` e um host Linux ou macOS. Para acesso fora da rede local, use HTTPS por meio de Caddy, Nginx ou outro reverse proxy.

```sh
curl -fsSL https://atacte.vercel.app/install.sh | sh
```

O instalador cria `~/.atacte`, baixa o Compose e imagens prontas para sua arquitetura, gera os segredos locais e inicia PostgreSQL, Redis, API e manager. Para HTTPS, configure a origem e o domínio público conforme o guia de segurança. O volume do banco e o arquivo `.env` são preservados ao executar o comando novamente.

Depois, autorize o email da primeira conta com `docker compose exec backend npm run security:allow-registration -- seu@email.com` e abra **http://localhost:3456** para criá-la manualmente. O cadastro exige autorização, expira em 15 minutos e só pode ser concluído uma vez. Se já existir um banco, mantenha o mesmo volume e o `.env` da instalação.

Valide os serviços e a API com:

```sh
cd ~/.atacte
docker compose ps
curl -fsS http://localhost:3457/health
```

Os arquivos da instalação ficam em `~/.atacte`. O PostgreSQL é publicado somente em `127.0.0.1` por padrão. Quando o reverse proxy estiver em outro host ou container, publique o frontend na interface de rede privada e restrinja a porta no firewall:

```env
FRONT_BIND=IP_DA_INTERFACE_PRIVADA
FRONT_PORT=3456
```

Não exponha PostgreSQL nem Redis à internet.

## Instalação assistida por IA

Agentes de IA e ferramentas de automação devem ler [AGENTS.md](AGENTS.md) antes de instalar ou atualizar o projeto. O arquivo separa produção de desenvolvimento, define verificações esperadas e evita sobrescrever `.env`, expor segredos ou remover volumes.

Prompt sugerido:

> Leia o AGENTS.md deste repositório, identifique se o objetivo é produção ou desenvolvimento, execute somente o procedimento correspondente e valide os serviços sem exibir segredos.

O instalador rápido acompanha as imagens `latest`. Para fixar uma release, não use apenas `ATACTE_RELEASE_REF`: registre também `BACKEND_IMAGE` e `FRONT_IMAGE` com a mesma tag no `.env`, conforme o guia para agentes.

## Uso diário

1. Se a instalação estiver vazia, execute no diretório da instalação `docker compose exec backend npm run security:allow-registration -- seu@email.com`. Abra o manager e crie a conta manualmente em até 15 minutos. Contas existentes entram normalmente com email e senha.
2. Cadastre uma senha, nota ou TOTP; use pastas e favoritos para encontrar tudo rapidamente.
3. Em **Sessões**, confira os dispositivos e encerre acessos que você não reconhece.
4. Em **Configurações**, faça exportações somente para um local protegido e apague o arquivo depois de conferi-lo.
5. Web e mobile consultam `GET /api/updates` e mostram um link para a nova release. Atualize manualmente no servidor; a aplicação não controla Docker nem altera o `.env`.

No mobile, **Configurações → Desbloquear com biometria** oferece bloqueio local opcional ao abrir ou retomar o aplicativo, com alternativa pela senha da conta. A opção começa desativada e requer uma nova build nativa; consulte [o guia de implantação](SECURITY_DEPLOYMENT.md).

As configurações da instalação são alteradas pelo `.env` no servidor e aplicadas com `docker compose up -d`. Email continua opcional.

## Atualizar e voltar uma versão

Atualização normal, a partir do host:

```sh
cd ~/.atacte
docker compose pull backend front redis
docker compose up -d --wait postgres redis
docker compose run --rm --no-deps backend ./node_modules/.bin/prisma migrate deploy --schema=src/infrastructure/prisma/schema.prisma
docker compose up -d --no-build --remove-orphans
```

O instalador também pode ser executado novamente para buscar a release configurada. Para voltar, defina `BACKEND_IMAGE` e `FRONT_IMAGE` no `.env` com uma tag conhecida e execute `docker compose pull` e `docker compose up -d`. Valide a API com:

```sh
curl -fsS http://localhost:3457/health
```

O instalador atualiza a instalação existente e aplica migrations sem executar ou exigir backup. O banco existente continua em uso, com o mesmo volume e `.env`. Backup manual é opcional; voltar somente a imagem não reverte migrations.

## Backup e restauração

O banco fica no volume Docker `atacte_postgres_data` (o nome pode variar conforme o projeto). Um dump lógico é portátil e recomendado:

```sh
cd ~/.atacte
docker compose exec -T postgres pg_dump -U atacte -d atacte > atacte-backup.sql
```

Guarde o dump em mídia criptografada. Para restaurar, pare a API/manager, confirme o banco de destino e importe o arquivo com `psql`; não substitua o volume sem antes fazer uma cópia. Consulte a [documentação de backup](https://atacte.vercel.app/docs/#backup) para o procedimento completo.

## Configuração opcional

Os valores abaixo ficam em `~/.atacte/.env` e só precisam ser alterados quando você publicar o serviço ou integrar um proxy. O instalador já gera os segredos obrigatórios.

| Variável | Finalidade | Padrão |
| --- | --- | --- |
| `FRONT_PORT` | Porta HTTP do manager | `3456` |
| `BACKEND_BIND` / `BACKEND_PORT` | Interface e porta da API | `127.0.0.1` / `3457` |
| `CORS_ORIGIN` | Origens permitidas, separadas por vírgula | origem local |
| `COOKIE_SECURE` | Exigir HTTPS no cookie de sessão | `false` local, `true` em produção |
| `COOKIE_SAME_SITE` | Política SameSite (`lax`, `strict` ou `none`) | `lax` |
| `COOKIE_DOMAIN` | Domínio explícito do cookie, se necessário | vazio |
| `TRUST_PROXY` | Confiança no reverse proxy para IP/HTTPS | `0` |
| `JWT_EXPIRES_IN` | Duração da sessão | `7d` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Envio de recuperação de senha | vazio |

Mantenha `POSTGRES_PASSWORD`, `JWT_SECRET`, `ENCRYPTION_KEY` privados. Não os publique em issues, logs, imagens ou repositórios.

## Clientes

### Web

O manager é o cliente principal e fica no mesmo Compose da API. A landing pública não acessa sua instalação e serve apenas para apresentação, documentação e releases.

### Android (Expo)

Baixe o APK da release mais recente em [Releases](https://github.com/ferforastieri/atacte/releases), quando disponível. Na primeira abertura, informe a URL HTTPS da sua instalação (por exemplo, `https://cofre.exemplo.com`). O job de Android é opcional e aguarda a build remota do EAS para baixar e anexar o APK automaticamente à release; se a Expo estiver sem quota ou sem credencial, backend e web continuam sendo publicados.

### Desktop

O cliente Electron está em `desktop/` e pode ser empacotado para Windows, macOS ou Linux. Ele usa a mesma API e o mesmo login do manager.

## Segurança

As sessões usam cookies `HttpOnly`, `Secure` em HTTPS e proteção CSRF; tokens de sessão não são gravados em `localStorage`. A API aplica CORS por lista explícita de origens, rate limit, validação de entrada e headers de segurança. Use HTTPS para acesso remoto e firewall para as portas internas. Backups são opcionais; se os fizer, mantenha-os criptografados.

O rate limit e o cache de atualizações ficam no Redis, compartilhados entre réplicas e sem liberação de acesso se Redis estiver indisponível. A chave de criptografia permanece no backend: o cofre tem criptografia em repouso, não é zero knowledge. Consulte [SECURITY_DEPLOYMENT.md](SECURITY_DEPLOYMENT.md) para autenticação, biometria e migração segura.

## Desenvolvimento

Cada parte possui seu próprio `package.json` e lockfile. Use Node.js 24, npm e Redis.

```sh
# Dependências e Prisma
npm --prefix backend ci
npm --prefix backend run db:generate
npm --prefix web ci

# API (um terminal)
npm --prefix backend run dev

# Web (outro terminal)
npm --prefix web run dev

# Mobile (opcional, outro terminal)
npm --prefix mobile ci
npm --prefix mobile start

# Verificação do web
npm --prefix web run type-check
npm --prefix web run build
```

Para desenvolvimento com os processos Node locais, suba PostgreSQL e uma instância Redis local dedicada, copie `backend/.env.example` para `backend/.env`, use a porta publicada `5435` na `DATABASE_URL` e aplique `npm --prefix backend run db:migrate:deploy`. Não sobrescreva um `.env` existente.

Para construir toda a aplicação com Compose, crie um `.env` na raiz com `POSTGRES_PASSWORD`, `JWT_SECRET`, `ENCRYPTION_KEY` antes de executar `docker compose up -d --build`. O roteiro completo e os comandos de validação estão em [AGENTS.md](AGENTS.md). Os workflows de CI executam testes e builds, mas nunca fazem migração automática do banco.

## Links

- [Landing](https://atacte.vercel.app/)
- [Documentação](https://atacte.vercel.app/docs/)
- [Releases e APK](https://github.com/ferforastieri/atacte/releases)
- [Código-fonte](https://github.com/ferforastieri/atacte)
- [Guia para agentes de IA](AGENTS.md)

## Contribuição e licença

Issues e pull requests são bem-vindos. Antes de reportar uma falha de segurança, não inclua dados do cofre nem segredos nos anexos.

Atacte é distribuído sob a licença [MIT](LICENSE).
