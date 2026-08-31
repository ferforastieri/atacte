# Atacte

Gerenciador self-hosted de senhas, códigos TOTP e notas privadas. O Atacte foi pensado para pessoas e pequenas equipes que querem uma interface agradável sem entregar o cofre a um serviço externo: você escolhe o servidor, mantém o PostgreSQL e controla as atualizações.

> O Atacte não é apresentado como zero-knowledge ou criptografia end-to-end. A cifragem histórica deriva uma chave do email por compatibilidade; proteja o banco e leia a seção [Segurança](#segurança) antes de usar dados críticos.

## O que você pode fazer

- guardar, pesquisar, favoritar e organizar senhas;
- gerar e consultar códigos de autenticação TOTP;
- criar notas privadas e pastas;
- importar e exportar seus dados em JSON;
- revisar sessões, dispositivos confiáveis e auditoria;
- usar o mesmo servidor pela web, pelo aplicativo Android/Expo ou pelo desktop;
- receber um aviso no gerenciador quando uma nova versão estiver disponível.

O código é dividido em uma API Express/Prisma, um gerenciador Vue/Tailwind e clientes mobile/desktop. A landing, a documentação e o histórico de releases são publicados separadamente do gerenciador autenticado.

## Instalação rápida (Docker)

Requisitos: Docker Engine com Docker Compose v2, `curl` e um host Linux ou macOS. Para acesso fora da rede local, use HTTPS por meio de Caddy, Nginx ou outro reverse proxy.

```sh
curl -fsSL https://atacte.vercel.app/install.sh | sh
```

O instalador cria `~/.atacte`, baixa o Compose e imagens prontas para sua arquitetura, gera os segredos locais e inicia PostgreSQL, API, manager e updater. Nenhuma variável é necessária na primeira instalação. O volume do banco e o arquivo `.env` são preservados ao executar o comando novamente.

Depois, abra **http://localhost:3456**. Em um banco vazio, o primeiro visitante verá o cadastro inicial; essa conta passa a ser a administradora. Se já existir um banco, faça backup antes de apontar o Compose para ele.

Para instalar uma versão específica:

```sh
ATACTE_RELEASE_REF=v1.2.3 curl -fsSL https://atacte.vercel.app/install.sh | sh
```

Os arquivos da instalação ficam em `~/.atacte`. O PostgreSQL é publicado somente em `127.0.0.1` por padrão. Quando o reverse proxy estiver em outro host ou container, publique a API na interface de rede privada e restrinja a porta no firewall:

```env
BACKEND_BIND=0.0.0.0
BACKEND_PORT=3457
```

Não exponha PostgreSQL nem a porta do updater à internet.

## Uso diário

1. Abra o endereço do seu manager e crie a primeira conta, se a instalação for nova.
2. Cadastre uma senha, nota ou TOTP; use pastas e favoritos para encontrar tudo rapidamente.
3. Em **Sessões**, confira os dispositivos e encerre acessos que você não reconhece.
4. Em **Configurações**, faça exportações somente para um local protegido e apague o arquivo depois de conferi-lo.
5. Quando o aviso de atualização aparecer, um administrador pode iniciar a atualização pelo botão do manager. O updater baixa as imagens e recria os serviços sem apagar o volume do PostgreSQL.

## Atualizar e voltar uma versão

Atualização normal, a partir do host:

```sh
cd ~/.atacte
docker compose pull backend front updater
docker compose up -d --no-build --remove-orphans
```

O instalador também pode ser executado novamente para buscar a release configurada. Para voltar, edite o `ATACTE_RELEASE_REF`/as tags de imagem no Compose para uma versão conhecida e execute `docker compose pull` e `docker compose up -d`. Valide a API com:

```sh
curl -fsS http://localhost:3457/health
```

O updater não executa `prisma migrate`, `db push` ou qualquer alteração automática de schema. Faça um backup antes de qualquer troca de versão.

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
| `BACKEND_BIND` / `BACKEND_PORT` | Interface e porta da API | `0.0.0.0` / `3457` |
| `CORS_ORIGIN` | Origens permitidas, separadas por vírgula | origem local |
| `COOKIE_SECURE` | Exigir HTTPS no cookie de sessão | `false` local, `true` em produção |
| `COOKIE_SAME_SITE` | Política SameSite (`lax`, `strict` ou `none`) | `lax` |
| `COOKIE_DOMAIN` | Domínio explícito do cookie, se necessário | vazio |
| `TRUST_PROXY` | Confiança no reverse proxy para IP/HTTPS | `0` |
| `JWT_EXPIRES_IN` | Duração da sessão | `7d` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Envio de recuperação de senha | vazio |

Mantenha `POSTGRES_PASSWORD`, `JWT_SECRET`, `ENCRYPTION_KEY` e `UPDATER_TOKEN` privados. Não os publique em issues, logs, imagens ou repositórios.

## Clientes

### Web

O manager é o cliente principal e fica no mesmo Compose da API. A landing pública não acessa sua instalação e serve apenas para apresentação, documentação e releases.

### Android (Expo)

Baixe o APK da release mais recente em [Releases](https://github.com/ferforastieri/atacte/releases), quando disponível. Na primeira abertura, informe a URL HTTPS da sua instalação (por exemplo, `https://cofre.exemplo.com`). O job de Android é opcional e aguarda a build remota do EAS para baixar e anexar o APK automaticamente à release; se a Expo estiver sem quota ou sem credencial, backend e web continuam sendo publicados.

### Desktop

O cliente Electron está em `desktop/` e pode ser empacotado para Windows, macOS ou Linux. Ele usa a mesma API e o mesmo login do manager.

## Segurança

As sessões usam cookies `HttpOnly`, `Secure` em HTTPS e proteção CSRF; tokens de sessão não são gravados em `localStorage`. A API aplica CORS por lista explícita de origens, rate limit, validação de entrada e headers de segurança. Use sempre HTTPS para acesso remoto, firewall para as portas internas e backups criptografados.

O schema Prisma não é migrado automaticamente. O rate limit padrão fica na memória do processo e, portanto, não é compartilhado entre múltiplas réplicas.

### Risco criptográfico conhecido

Por compatibilidade com os dados existentes, a chave usada pela cifragem histórica é derivada de `SHA-256(email)` e o resultado necessário fica no banco. Um comprometimento do PostgreSQL pode permitir recuperar dados do cofre. Isso é um risco aceito temporariamente e não equivale a zero-knowledge; uma migração criptográfica específica é necessária antes de fazer essa alegação.

## Desenvolvimento

Cada parte possui seu próprio `package.json` e lockfile. Node.js 18+ e npm são recomendados.

```sh
# API
cd backend
npm ci
npm run db:generate
npm run dev

# Web (outro terminal)
cd web
npm ci
npm run dev

# Verificação e builds
npm run type-check
npm run build:manager
npm run build:landing

# Mobile (opcional)
cd mobile
npm ci
npx expo start
```

Para subir tudo localmente com containers, copie `backend/.env.example` para `backend/.env`, preencha os segredos e execute `docker compose up -d --build`. Os workflows de CI executam testes e builds, mas nunca fazem migração automática do banco.

## Links

- [Landing](https://atacte.vercel.app/)
- [Documentação](https://atacte.vercel.app/docs/)
- [Releases e APK](https://github.com/ferforastieri/atacte/releases)
- [Código-fonte](https://github.com/ferforastieri/atacte)

## Contribuição e licença

Issues e pull requests são bem-vindos. Antes de reportar uma falha de segurança, não inclua dados do cofre nem segredos nos anexos.

Atacte é distribuído sob a licença [MIT](LICENSE).
