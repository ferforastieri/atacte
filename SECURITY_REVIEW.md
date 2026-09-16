# Avaliação de segurança — Atacte

## Estado das correções locais

Os achados abaixo registram a revisão original, anterior às correções. O código atual restringe alterações de perfil, remove a aprovação de dispositivos e autentica por senha, serializa o cadastro inicial, revoga sessões em trocas de senha e valida certificados SMTP. O updater e seus endpoints de configuração/execução foram removidos; web e mobile apenas consultam o aviso de nova versão. Redis armazena limites e cache de atualizações. Email continua opcional.

Builds de backend/web, verificações TypeScript de web/mobile e testes de backend passaram. Testes de integração com PostgreSQL e Redis descartáveis verificaram concorrência, autorização, login por senha, origem e revogação de sessões. A biometria opcional ainda precisa de validação em aparelhos físicos com uma nova build nativa.

A auditoria das dependências de produção de backend/web não reportou vulnerabilidades. A árvore mobile ainda reporta 25 (16 moderadas e 9 altas), ligadas ao ecossistema Expo/Metro; a atualização principal do SDK permanece pendente. A criptografia continua no servidor, com a chave da instalação. Nenhuma atualização foi executada no servidor pessoal.

Consulte [implantação e migração](SECURITY_DEPLOYMENT.md). Conforme solicitado, o instalador não executa nem exige backup; preserva o volume PostgreSQL e o `.env`. A migração invalida sessões e tokens antigos, preservando contas e dados do cofre.

## Cumprimento e pendências

Nem todas as recomendações originais foram implementadas ou verificadas em produção.

| Item | Estado atual |
| --- | --- |
| R1 — Elevação de privilégios pelo perfil | Corrigida no código, com teste de regressão. A revisão dos administradores existentes no servidor ainda está pendente. |
| R2 e R8 — Escrita de configuração e concorrência do updater | Caminhos removidos com o updater, sem socket Docker na aplicação. |
| R3 — Autoaprovação do dispositivo | Fluxo removido. Não foi substituído por MFA: o login usa senha, conforme solicitado. Biometria é bloqueio local opcional. |
| R4 — SMTP | Validação de certificado e TLS exigidos no código. Provedor real não testado. |
| R5 — Revogação após troca de senha | Implementada em transação e testada com PostgreSQL. |
| R6 — Bootstrap | Autorização temporária de email e exclusão mútua implementadas; concorrência testada. |
| R7 — Atualizações e recuperação | Atualizador removido; atualização manual. Backup obrigatório deliberadamente não implementado, por solicitação do usuário. Restauração, validação pós-deploy no servidor e verificação de artefatos no consumo permanecem pendentes; o instalador continua usando tags mutáveis por padrão. |
| Demais correções | Hash e consumo transacional de tokens de recuperação, resposta HTTP genérica na solicitação, Redis por IP/conta, limite bcrypt em bytes, reautenticação por senha e escaping CSV implementados. |

Ainda faltam validação física da biometria; tratamento dos alertas de dependências mobile; verificação do Tunnel/Access, firewall, cookies, headers e cadeia de proxy reais; revisão das contas existentes; e validação das imagens efetivamente implantadas. Nenhuma dessas verificações foi feita no servidor pessoal.

A cobertura de auditoria foi ampliada, mas não equivale a monitoramento operacional completo. A resposta HTTP genérica da recuperação também não garante tempo de resposta indistinguível: o envio SMTP continua síncrono para contas existentes. A criptografia continua no backend; não foi implementada criptografia ponta a ponta.

## Revisão original

Data: 16/09/2026. Revisão: `9bfd6c6bf3e80c53871c3726cb80363df9a640db`.

Contexto: instalação de uso real em servidor pessoal com Cloudflare Tunnel. Esta avaliação analisou o código local do backend, updater, Compose, Nginx, instalador e publicação. Não houve acesso ao servidor, leitura de arquivos `.env`, alteração de configuração de produção, criação de contas reais ou execução de atualizações. A versão implantada, regras do túnel, Cloudflare Access, firewall e imagens efetivamente executadas não foram verificados.

## Resultado

Há uma falha crítica de autorização: uma conta comum pode alterar o próprio papel para administrador pelo endpoint de perfil. Isso dá acesso à administração de contas e aos endpoints que controlam o updater. Há também uma falha de interpolação no updater que permite transferir valores de variáveis protegidas para campos de configuração visíveis ao administrador.

As severidades abaixo são avaliações qualitativas considerando um cofre de senhas. Não significam que houve exploração no servidor.

| ID | Severidade | Achado | Evidência |
| --- | --- | --- | --- |
| R1 | Crítica | Alteração de papel e outros campos internos pelo perfil | Fluxo HTTP reproduzido com persistência simulada |
| R2 | Alta | Configuração do updater permite interpolar variáveis do `.env` | Função real + Docker Compose reproduzidos com marcador sintético |
| R3 | Alta | Sessão não confiável aprova o próprio dispositivo | Fluxo HTTP reproduzido com persistência simulada |
| R4 | Alta | SMTP desabilita validação do certificado TLS | Código confirmado; interceptação não executada |
| R5 | Alta | Troca de senha administrativa mantém sessões anteriores | Fluxo HTTP reproduzido com persistência simulada |
| R6 | Alta, condicional | Bootstrap público sem exclusão mútua | Corrida reproduzida no serviço com persistência simulada |
| R7 | Média | Atualização automática sem backup e sem atualizar o próprio updater | Código confirmado |
| R8 | Média | Configurações/reinícios concorrentes sem serialização | Código confirmado; estresse não executado |

## R1 — Campos extras do perfil chegam diretamente ao Prisma

Referências: [controller](backend/src/controllers/users/userController.ts#L194), [serviço](backend/src/services/users/userService.ts#L121), [repositório](backend/src/repositories/users/userRepository.ts#L31).

`PATCH /api/users/profile` valida alguns campos conhecidos, mas encaminha todo o `req.body` ao serviço. O serviço encaminha o objeto ao repositório, que usa `...data` na operação `prisma.user.update`. Interfaces TypeScript não removem campos em execução.

Uma sessão de usuário comum pode enviar `{"role":"ADMIN"}`. O middleware consulta novamente o usuário no banco a cada requisição; o papel promovido passa a valer imediatamente. A mesma falha permite tentar modificar email e hash da senha sem apresentar a senha atual, entre outros campos aceitos pelo modelo. Operações relacionais do Prisma também devem ser bloqueadas pela correção; não foram exercitadas nesta avaliação.

Teste: o endpoint retornou 200; o Prisma simulado recebeu `role: ADMIN`; uma requisição posterior a `GET /api/config`, protegida por `requireAdmin`, retornou 200. Controller, serviço, repositório e autenticação eram os reais; apenas a camada Prisma foi substituída por dados em memória.

Impacto: administração indevida, alteração da senha de outras contas e acesso às funções do updater. A falha exige uma conta/sessão válida; o cadastro público de uma instalação já inicializada não é livre.

Correção: construir explicitamente o objeto com `name`, `phoneNumber` e `profilePicture`, rejeitar propriedades desconhecidas e manter operações administrativas separadas também no serviço/repositório. Testar que `role`, `email`, hashes, IDs e relações não podem ser alterados pelo perfil. Após corrigir, revisar papéis administrativos e revogar sessões existentes conforme a investigação.

## R2 — Interpolação de segredos pelo updater

Referências: [validação e gravação](updater/main.go#L89), [concatenação no arquivo](updater/main.go#L119), [exposição da configuração](backend/src/controllers/system/systemController.ts#L20).

A validação bloqueia CR/LF e limita tamanho, mas `writeEnv` grava `CHAVE=valor` sem serialização segura. Docker Compose interpreta referências `${VAR}` em valores não delimitados. Um administrador pode colocar uma referência a uma variável protegida em `EMAIL_FROM_NAME`; após o reinício, o backend recebe o valor expandido, e `GET /api/config` devolve esse campo sem mascará-lo. Isso contorna a intenção de manter segredos fora da interface administrativa.

Teste: em diretório temporário, a função original `writeEnv` gravou uma referência a `ATACTE_AUDIT_MARKER`; `docker compose config --format json` confirmou a expansão do marcador. Não houve uso de segredos reais nem criação de containers. A leitura posterior pelo backend foi estabelecida pelo fluxo do código, sem reiniciar uma instalação.

Impacto: divulgação de valores protegidos disponíveis à interpolação, inclusive material criptográfico e credenciais de infraestrutura. R1 permite que uma conta comum alcance esse caminho administrativo. A divulgação da chave global aumenta o impacto de uma eventual obtenção dos ciphertexts; ela, isoladamente, não fornece uma cópia do banco.

Correção: usar serialização de `.env` que preserve valores literais, incluindo `$`, aspas, barras e comentários; validar tipo, formato e faixa de cada configuração; conferir a configuração resultante antes de aplicá-la. Não confundir isso com execução de comandos shell: o updater usa `exec.Command` com argumentos separados, e não foi identificada execução arbitrária de shell por esse caminho.

O comportamento de interpolação e valores literais está descrito na [documentação do Docker](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/).

## R3 — Confirmação de dispositivo não constitui uma segunda verificação

Referências: [exceção no middleware](backend/src/middleware/auth.ts#L106), [aprovação](backend/src/services/auth/authService.ts#L257).

O login cria uma sessão não confiável. Essa sessão pode acessar `/api/auth/trust-device`, e o serviço exige apenas que a sessão indicada pertença ao usuário autenticado. Não há aprovação por dispositivo já confiável, desafio por email, TOTP de login ou WebAuthn. Uma pessoa com a senha ou com uma sessão ainda não confiável pode aprovar a própria sessão.

Teste: uma sessão simulada com `isTrusted: false` passou pelo middleware real e recebeu 200 ao aprovar a si mesma. Depois, conseguiu acessar o endpoint de perfil.

Correção: se a confirmação deve ser uma barreira de segurança, exigir prova independente e de uso único. Para o primeiro dispositivo, criar um fluxo explícito de estabelecimento de confiança. Os TOTP guardados junto às senhas são códigos de serviços terceiros; não implementam MFA do login do Atacte.

Há outro defeito na remoção da confiança: [o serviço passa `deviceName`](backend/src/services/auth/authService.ts#L281) para um [repositório que filtra por `deviceFingerprint`](backend/src/repositories/auth/userRepository.ts#L161). Normalmente o registro confiável não é removido e um login futuro com o mesmo fingerprint volta a ser aceito como confiável. Corrigir a identificação e invalidar as sessões correspondentes.

## R4 — Certificados SMTP não são verificados

Referência: [configuração TLS do email](backend/src/services/email/emailService.ts#L38).

`tls.rejectUnauthorized: false` aceita certificados inválidos. Um atacante capaz de interceptar a conexão de saída pode se passar pelo servidor SMTP, capturar credenciais SMTP e observar mensagens de recuperação de senha. O Cloudflare Tunnel de entrada não protege essa conexão de saída.

Correção: habilitar a verificação padrão de certificados e configurar uma CA confiável caso o SMTP seja privado. Exigir TLS para autenticação e envio de recuperação, conforme o provedor. O risco depende de SMTP habilitado e de posição de interceptação; não houve teste de interceptação.

## R5 — Troca administrativa de senha não encerra sessões

Referência: [changeUserPasswordByAdmin](backend/src/services/users/userService.ts#L391).

A operação atualiza o hash e grava auditoria, mas não exclui sessões nem invalida dispositivos confiáveis ou tokens pendentes de recuperação. O middleware valida o JWT e a existência da sessão; não vincula a sessão à versão atual da senha.

Teste: a operação administrativa retornou 200 e atualizou o hash, sem qualquer chamada de exclusão de sessões no Prisma simulado. Uma sessão previamente roubada continua válida até expiração/revogação.

Correção: alterar a senha e revogar todas as sessões em uma transação; invalidar tokens de recuperação pendentes e definir uma política de revogação dos dispositivos confiáveis. Aplicar a mesma política consistente às demais formas de troca de senha.

## R6 — Cadastro inicial depende de contagem sem operação atômica

Referência: [register](backend/src/services/auth/authService.ts#L54).

A consulta `countUsers`, o bcrypt e a criação do administrador são operações separadas. Duas requisições com emails diferentes podem observar zero usuários e criar duas contas ADMIN. A janela de hashing aumenta a oportunidade da corrida.

Teste: duas chamadas concorrentes ao serviço real, com persistência simulada inicialmente vazia, retornaram duas contas administrativas. Não foi executado teste com PostgreSQL real.

Além da corrida, qualquer visitante que alcançar uma instalação vazia pode tentar reivindicar a primeira conta. A exposição já inicializada não reabre esse cadastro, salvo se todos os usuários forem removidos.

Correção: estado explícito de instalação, bootstrap restrito à pessoa responsável e exclusão mútua no banco, por exemplo transação com lock adequado. A primeira conta deve continuar sendo criada manualmente no navegador, com o serviço restrito durante essa etapa.

## R7 — Atualizações não garantem recuperação nem atualização do updater

Referências: [sequência de atualização](updater/main.go#L175), [instalador](web/public/install.sh#L70), [imagens padrão](docker-compose.yml#L28).

`run()` baixa backend/frontend, aplica migrations e substitui esses serviços. Não executa backup lógico, não valida a recuperação do banco e não atualiza o próprio updater. O instalador também permite atualizar sem realizar backup automaticamente. Isso exige disciplina manual mesmo quando existe um botão de atualização.

Impacto: uma migração problemática pode deixar a instalação sem recuperação recente; correções do updater não chegam pelo próprio botão. As tags padrão `latest` são mutáveis e o updater não verifica assinaturas ou aprovação de uma release específica. Não foi constatada adulteração de imagens.

Correção: exigir backup bem-sucedido e verificável antes das migrations, registrar a revisão aplicada, verificar saúde após o deploy e planejar restauração compatível com mudanças no banco. Usar releases/digests aprovados e implementar manutenção explícita do updater por um mecanismo externo. Um rollback somente da imagem não desfaz migrations.

## R8 — Configuração concorre com configuração e atualização

Referências: [mutex apenas na atualização](updater/main.go#L52), [config](updater/main.go#L75), [restart](updater/main.go#L150).

O mutex impede duas atualizações simultâneas, mas não abrange `/v1/config`. Duas gravações podem ler a mesma versão de `.env` e uma sobrescrever alterações da outra. Cada chamada também inicia um novo `docker compose up`. Renomear o arquivo temporário evita arquivo parcialmente escrito, mas não resolve atualizações perdidas.

Não há deadline dos subprocessos: o timeout HTTP não cancela o comando Docker em segundo plano. Erros de Compose/migrations são gravados com `CombinedOutput` integral, sem redação de conteúdo sensível. Não houve observação de segredo real em logs.

Correção: uma única fila/lock para configurações e atualizações, validação antes da gravação, prazo de execução, estado consultável e logs com redação. Evitar processos de reinício ilimitados e concorrentes.

## Limites arquiteturais importantes

O cofre usa AES-256-GCM com IV aleatório e tag de autenticação, o que é positivo. Porém, a criptografia ocorre no backend com uma chave global da instalação. O backend recebe e devolve senhas em texto claro e consegue descriptografar os cofres. Isso é criptografia em repouso, não criptografia ponta a ponta/zero knowledge. Um comprometimento do backend, ou banco mais chave, compromete a confidencialidade dos cofres. Trocar diretamente a chave no `.env` sem migrar os dados torna os dados anteriores ilegíveis.

O updater tem o socket Docker e acesso de escrita ao diretório da instalação ([Compose](docker-compose.yml#L116)). Uma execução arbitrária de código dentro dele pode comprometer o host quando o daemon Docker é privilegiado. `read_only`, `cap_drop` e `no-new-privileges` são defesas úteis, mas não restringem o que o daemon pode fazer por solicitação do socket. Não foi demonstrada execução arbitrária de código no updater nesta revisão. Considerar separar a atualização do processo exposto à aplicação, com operações e artefatos estritamente autorizados.

## Cloudflare Tunnel e exposição do servidor

O Compose publica por padrão backend em `0.0.0.0:3457` e frontend em todas as interfaces na porta `3456`. PostgreSQL está corretamente limitado a `127.0.0.1:5435`; o updater não publica porta no host. Backend, frontend, banco e updater compartilham a mesma rede Docker.

Estar atrás de um túnel não restringe automaticamente acesso pela LAN ou por portas encaminhadas ao host. É necessário verificar as rotas reais; esta avaliação não confirmou que as portas estão acessíveis pela internet.

Cloudflare Tunnel publica o serviço, enquanto Cloudflare Access acrescenta a camada de autenticação anterior à aplicação. Para uso pessoal, restringir o acesso às identidades autorizadas com MFA é uma mitigação prioritária enquanto as falhas são corrigidas. Ver [Cloudflare Access para aplicações próprias](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/).

Verificações pendentes na instalação:

1. Confirmar o destino do Tunnel. Se `cloudflared` estiver no host, preferir acesso ao frontend em loopback e limitar as portas publicadas a loopback. Se estiver em container ou outra máquina, usar rede dedicada/interface confiável apropriada. Não aplicar bind de loopback sem conferir essa topologia.
2. Confirmar Access cobrindo todo o hostname, inclusive `/api`, e ausência de caminhos diretos que evitem a política.
3. Validar `COOKIE_SECURE=true`, domínio/origens corretos e cabeçalhos encaminhados. O instalador inicialmente grava `COOKIE_SECURE=false` para HTTP local.
4. Ajustar confiança no proxy à cadeia real. No caminho Cloudflare → cloudflared → Nginx → backend, `TRUST_PROXY=0` vê o Nginx e `1` pode identificar o cloudflared, agrupando visitantes no mesmo limite de tentativas. Um número excessivo combinado com caminhos diretos pode confiar em IPs fornecidos pelo cliente. Não aumentar o valor sem verificar a cadeia.
5. Verificar firewall e publicação Docker efetiva para `3456`, `3457` e `5435`, sem expor o updater.
6. Conferir backup recente e restauração, versão das imagens, permissões do diretório de instalação e acesso ao socket Docker.

O código usa `X-Forwarded-Proto` diretamente para comparar origens ([server](backend/src/server.ts#L14), [CSRF](backend/src/middleware/csrf.ts#L8)), independentemente da confiança de proxy configurada. Normalizar os headers no proxy confiável. Não foi demonstrado bypass completo de CSRF: o middleware também exige token no cookie e no header.

## Outros pontos para o próximo ciclo

- Tokens de recuperação são aleatórios, expiram em uma hora e são persistidos em texto claro. Guardar apenas hash. Consumo do token, troca de senha e revogação não são uma transação única; o token pode ser utilizado em requisições concorrentes antes de ser marcado como usado.
- Recuperação permite distinguir email inexistente por status HTTP: o serviço lança erro para email desconhecido e o controller devolve 400; sucesso devolve 200. Uniformizar resposta e revisar diferenças de tempo no login.
- Limites de tentativas são por IP e em memória. Falta proteção complementar por conta e persistência compartilhada; proxies e clientes IPv6 precisam de testes específicos.
- Senhas mestras aceitam mais que os 72 bytes efetivamente usados pelo bcrypt. Definir política explícita em bytes ou migrar com cuidado para KDF adequado; não alterar hashes de contas existentes silenciosamente.
- Exportações em texto claro, mudanças de configuração e atualização não exigem autenticação recente. Adicionar confirmação forte para operações de alto impacto; priorizar corrigir R1 antes disso.
- CSV é montado por concatenação sem escaping completo de aspas ou neutralização de fórmulas. Tratar conteúdo importado como não confiável ao exportar para planilhas.
- Login, recuperação e funções do sistema não têm a mesma cobertura de auditoria dos registros do cofre; ampliar eventos úteis sem registrar credenciais.

## Dependências e validações executadas

- `npm --prefix backend test`: 7 testes aprovados. Cobrem health, versão, CORS e emissão/rejeição básica de CSRF; não cobriam os fluxos de autorização encontrados.
- `npm --prefix backend run build`: aprovado.
- `go test ./...` no updater: aprovado, mas o pacote não possui testes próprios.
- Testes temporários de segurança: aprovação da própria sessão; promoção de papel com acesso subsequente a rota administrativa; troca administrativa sem revogação; corrida no bootstrap. Usaram rotas/serviços reais e Prisma simulado, sem banco real.
- Teste temporário Go: `writeEnv` original + parser real do Docker Compose confirmaram interpolação indevida com marcador sintético.
- Compose: validação `config --quiet` aprovada sobre cópia temporária, com valores sintéticos e sem ler `.env` real.
- `npm --prefix backend audit --omit=dev`: quatro pacotes classificados como moderados (`express`, `body-parser`, `qs`, `nodemailer`), zero altos/críticos reportados pelo scanner. Os quatro pacotes não representam quatro falhas independentes; Express e body-parser aparecem também por dependerem de qs.

O aviso de Nodemailer depende de uso específico da API legada `resolveContent`, não identificado no fluxo de email revisado. Os avisos de qs também precisam de avaliação de alcançabilidade das opções de parsing. São achados de dependências, não provas de exploração remota do Atacte. Referências: [Nodemailer](https://github.com/advisories/GHSA-8m3c-c648-2xjj), [qs isBuffer](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g), [qs array-limit](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx).

Os checks locais usaram Node 24.18.0, Go 1.26.5 e Compose 2.40.3, diferentes das imagens declaradas (Node 20 / Go 1.24 no build). Não houve scanner das imagens implantadas, govulncheck do binário em produção, pentest externo ou teste integrado com PostgreSQL.

## Ordem de tratamento

1. Restringir acesso externo por Access/rede e conferir ausência de caminhos diretos; confirmar primeiro a topologia do Tunnel.
2. Corrigir R1 e R2 e adicionar regressões de autorização/serialização antes de implantar.
3. Corrigir SMTP, revogação de sessões e confiança de dispositivos; revisar contas, papéis e sessões existentes.
4. Implementar backup/recuperação, serialização e manutenção do updater; corrigir bootstrap e dependências.
5. Validar no servidor a revisão implantada, headers, isolamento, políticas do Access e recuperação do backup.

Não foram aplicadas correções nem alterações na instalação. O único arquivo adicionado ao projeto por esta avaliação é este relatório.
