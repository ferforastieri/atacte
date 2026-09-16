# Revisão de desempenho e inicialização — 16/09/2026

Revisão local dos fluxos de autenticação, acesso ao banco, listagens, pastas, contadores, edição de senhas, inicialização web/mobile, geração de credenciais e abertura de links no desktop. Não é uma certificação de auditoria integral nem uma medição de latência no servidor pessoal.

## Alterações

- Sete repositórios passaram a compartilhar o cliente Prisma existente, eliminando pools independentes.
- Autenticação não consulta preferências que não usa. A sessão e o estado da conta continuam sendo verificados a cada requisição; a gravação de última atividade ocorre no máximo aproximadamente uma vez por minuto por sessão.
- Índices adicionados para consultas por proprietário, token de sessão, ordenação de senhas/notas, atividade, auditoria e relação de campos extras. A migration preserva os dados; a criação dos índices pode bloquear escritas enquanto é aplicada.
- Listagens de pastas agora agrupam somente o campo folder no banco; não carregam os conteúdos do cofre.
- Contadores de favoritos/TOTP passaram de duas listagens de senhas para uma consulta HTTP de contagens agregadas, sem transportar segredos e sem truncamento por paginação.
- Edição de campos extras usa nested write atômico. Não apaga e recria cada campo por chamadas sequenciais nem consulta novamente o resultado.
- Web aguarda validação inicial da sessão antes da navegação. Eliminada a busca global duplicada de senhas/pastas e o atraso artificial de 100 ms. Logout limpa os stores e invalida respostas pendentes.
- Mobile reutiliza o usuário do contexto, compartilha solicitação concorrente de CSRF e ignora respostas antigas de pesquisa na lista de senhas.
- Remontagem do navegador por mudança da foto de perfil removida. Animações dos skeletons são interrompidas ao desmontar.
- Geradores mobile de senha, frases e segredos TOTP usam aleatoriedade criptográfica com rejection sampling, substituindo Math.random.
- Endpoint de geração de senhas foi colocado antes da rota dinâmica de IDs, com limite de comprimento para evitar trabalho ilimitado.
- Desktop permite abrir externamente apenas links HTTP/HTTPS sem credenciais. Falhas de importação não devolvem mensagens internas do banco.

## Splash mobile

Fundo nativo e fundo inicial da raiz em #111827. Plugin expo-splash-screen configurado explicitamente. A splash permanece até o tema salvo ser carregado e o layout inicial estar montado. Durante validação da sessão e carregamento da preferência biométrica, é apresentado o skeleton da página de senhas. O bloqueio biométrico continua precedendo o conteúdo protegido.

É necessário gerar uma nova build nativa. Exportar o bundle Android não comprova a aparência nem o comportamento em aparelho. Validar abertura fria/quente, tema claro/escuro, rede lenta/offline, conta desconectada e biometria habilitada. Referência: https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/

## Validação e limites

Builds backend/web, TypeScript web/mobile, testes backend, migrations SQL e integração PostgreSQL/Redis em instâncias descartáveis passaram. Integração cobre contadores, pastas, rollback da edição de campos extras, limite de geração, atividade de sessão e os fluxos anteriores de segurança. Exportação Android pelo Metro/Hermes passou; não equivale a build APK nem teste físico.

Não foi medido ganho percentual: as reduções descritas são estruturais, confirmadas pelo código e testes. Permanecem candidatos a outro ciclo: bundle web grande, importações sequenciais, exportações em memória, buscas contains/offset em grandes cofres, estatísticas de perfil, temporizadores TOTP e alertas de dependências mobile. A ausência de MFA, criptografia no backend e validações pendentes de produção continuam registradas em SECURITY_REVIEW.md.
