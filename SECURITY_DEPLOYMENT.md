# Implantação das correções de segurança

## O que mudou

- Perfil aceita somente nome, telefone e imagem; campos internos não chegam ao Prisma.
- Login usa email e senha da conta. A aprovação e a classificação de dispositivos confiáveis foram removidas; a lista de sessões permite revisar e encerrar acessos.
- Rate limit por IP (com agrupamento IPv6) e por conta, cache da consulta de releases usam Redis. PostgreSQL persiste usuários, sessões e auditoria.
- Trocas de senha revogam sessões e tokens de recuperação em transação. Tokens de recuperação são armazenados como hash; email continua opcional, com validação TLS.
- Exportação, alterações administrativas exigem confirmação recente. Não há atualização remota, escrita de configuração ou acesso ao socket Docker.
- Web/mobile exibem somente o aviso retornado por `GET /api/updates`, com link para a release. O aviso refere-se à versão do servidor.
- Mobile oferece bloqueio biométrico opcional ao abrir/retomar o aplicativo. A senha da conta pode ser confirmada no servidor para desbloquear.

A criptografia do cofre continua no backend com a chave da instalação. Transformá-la em criptografia ponta a ponta exige outro projeto e uma migração dos dados; esta alteração não muda nem substitui a chave existente.

## Antes de atualizar uma instalação existente

1. Preserve o `.env` e o volume PostgreSQL existentes, incluindo a mesma chave de criptografia. Backup manual é opcional.
2. Prepare o Compose desta versão: PostgreSQL, Redis, backend e frontend. Redis usa rede interna, AOF e limite de memória sem expulsão de chaves. Não publique a porta Redis.
3. Configure `CORS_ORIGIN` com a origem pública exata, `COOKIE_SECURE=true` para HTTPS.
4. Backend e frontend agora publicam em loopback por padrão. Se cloudflared estiver em outra máquina/container, configure `FRONT_BIND` com a interface confiável e firewall correspondente ou conecte o túnel à rede do frontend. Não abra a API ou banco à internet. `TRUST_PROXY` deve corresponder à cadeia real, nunca ser aumentado sem verificar os headers recebidos.
5. Faça pull, inicie PostgreSQL/Redis, execute `prisma migrate deploy` e recrie os serviços com `--remove-orphans`. Isso remove o container antigo de atualização sem remover volumes. Não use `down -v`. Entradas antigas de configuração do atualizador não são mais usadas e podem ser removidas manualmente do `.env`.

A migração apaga sessões antigas, registros de confiança por fingerprint e tokens antigos de recuperação. **Todas as pessoas precisarão entrar novamente.** Senhas, notas e contas não são apagadas.

O instalador não executa nem exige backup. Ele inicia os serviços necessários e aplica as migrations no banco existente, preservando o volume e o `.env`.

## Primeira conta, sem envio de email nem códigos

Somente em uma instalação ainda vazia:

```sh
cd ~/.atacte
docker compose exec backend npm run security:allow-registration -- seu@email.com
```

O email é autorizado por 15 minutos. A pessoa abre o endereço público e cria a conta manualmente. O registro é atômico e não reabre se todas as contas forem removidas. Contas existentes continuam entrando com a mesma senha, sem autorização adicional.

## Biometria simples no mobile

Em **Configurações → Desbloquear com biometria**, ative a opção e confirme a biometria cadastrada no celular. A opção começa desativada e é salva neste aparelho para a conta. Quando ativada, o aplicativo bloqueia ao abrir ou sair do primeiro plano. O usuário pode desbloquear com biometria forte ou confirmar a senha da conta no servidor. A senha não é salva pelo bloqueio biométrico.

A biometria protege o acesso local à interface, não funciona como segundo fator no backend. Não há passkeys, associação de domínio, certificados Android ou configuração de Team ID. A web usa email e senha normalmente.

É necessária uma **nova build nativa** para incluir o módulo de biometria e a permissão Face ID; atualizar somente JavaScript não basta. O runtime mobile é 4.0.0. Valide ativação/desativação, abertura, retorno do background, cancelamento, ausência de biometria, senha incorreta e sessão expirada em aparelhos reais. O teste TypeScript não comprova o comportamento de Face ID ou impressão digital.

## Desenvolvimento e testes

Use Node.js 24. Para Node fora do Compose, disponibilize PostgreSQL e Redis dedicados em loopback e configure `DATABASE_URL`/`REDIS_URL`, preservando `.env` existente. Use HTTPS no servidor acessado pelo mobile.

```sh
npm --prefix backend run db:generate
npm --prefix backend run build
npm --prefix backend test
npm --prefix web run type-check
npm --prefix web run build
(cd mobile && npx tsc --noEmit)
```

O teste `security.integration.test.ts` exige `ATACTE_INTEGRATION=1`, banco descartável chamado `atacte_test` e Redis dedicado. Ele apaga usuários desse banco de teste. CI provisiona serviços isolados, aplica migrations e executa `npm --prefix backend run test:integration`. Os testes verificam login por senha, isolamento entre contas, revogação, bootstrap concorrente e contadores Redis.
