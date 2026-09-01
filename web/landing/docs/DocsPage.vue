<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-200 dark:bg-gray-900 dark:text-gray-100">
    <PublicHeader active="docs" />

    <main class="w-full px-4 py-8 pb-24 sm:px-6 lg:px-10 lg:py-10 xl:px-12">
      <section class="grid gap-8 py-8 sm:py-12 lg:grid-cols-[1.1fr_.9fr] lg:items-end lg:gap-16 lg:py-16" aria-labelledby="docs-title">
        <div>
          <div class="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
            <span class="h-2 w-2 rounded-full bg-primary-600" />
            Guia do administrador
          </div>
          <h1 id="docs-title" class="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">Seu cofre, seu host.</h1>
          <p class="mt-5 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">Instale, valide e mantenha o Atacte com um roteiro previsível para pessoas e agentes de IA.</p>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900">
              <BookOpenIcon class="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p class="font-semibold">Documentação rápida</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Instalação, operação e segurança.</p>
            </div>
          </div>
          <div class="mt-5 grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
            <a href="#instalacao" class="rounded-lg bg-gray-50 px-2 py-3 font-medium text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Instalar</a>
            <a href="#configuracao" class="rounded-lg bg-gray-50 px-2 py-3 font-medium text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Configurar</a>
            <a href="#validacao" class="rounded-lg bg-gray-50 px-2 py-3 font-medium text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Validar</a>
            <a href="#agentes" class="rounded-lg bg-gray-50 px-2 py-3 font-medium text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Usar IA</a>
          </div>
        </div>
      </section>

      <section id="requisitos" class="border-t border-gray-200 py-12 dark:border-gray-700 sm:py-16">
        <div class="grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
          <div>
            <p class="text-sm font-semibold text-primary-600 dark:text-primary-400">01 · Antes de começar</p>
            <h2 class="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Requisitos simples.</h2>
          </div>
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article v-for="item in requirements" :key="item.title" class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <component :is="item.icon" class="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <h3 class="mt-4 font-semibold">{{ item.title }}</h3>
              <p class="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">{{ item.description }}</p>
            </article>
          </div>
        </div>
      </section>

      <section id="instalacao" class="border-t border-gray-200 py-12 dark:border-gray-700 sm:py-16">
        <p class="text-sm font-semibold text-primary-600 dark:text-primary-400">02 · Instalação</p>
        <div class="mt-2 grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:items-start">
          <div>
            <h2 class="text-3xl font-bold tracking-tight sm:text-4xl">Um comando, quatro serviços.</h2>
            <p class="mt-4 leading-7 text-gray-600 dark:text-gray-400">O instalador cria os segredos ausentes, baixa as imagens publicadas, aplica migrations e preserva o banco e o <code class="font-mono text-primary-700 dark:text-primary-300">.env</code> nas próximas execuções.</p>
          </div>
          <div>
            <pre class="overflow-x-auto rounded-lg border border-gray-700 bg-gray-950 px-5 py-4 font-mono text-sm leading-7 text-green-300 shadow-inner dark:border-gray-600 dark:bg-black dark:text-green-200"><code>curl -fsSL https://atacte.vercel.app/install.sh | sh</code></pre>
            <ol class="mt-5 grid gap-3 text-sm leading-6 text-gray-600 dark:text-gray-400 sm:grid-cols-3">
              <li class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"><strong class="block text-gray-900 dark:text-gray-100">1. Arquivos</strong><code class="font-mono">~/.atacte</code> recebe Compose e segredos.</li>
              <li class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"><strong class="block text-gray-900 dark:text-gray-100">2. Serviços</strong>PostgreSQL, API, manager e updater iniciam.</li>
              <li class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"><strong class="block text-gray-900 dark:text-gray-100">3. Primeiro acesso</strong>Abra <code class="font-mono">localhost:3456</code> e crie o administrador.</li>
            </ol>
            <p class="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-400">O caminho rápido acompanha as imagens <code class="font-mono text-primary-700 dark:text-primary-300">latest</code>. Para fixar uma versão, configure as três imagens com a mesma tag; consulte o <a href="#agentes" class="font-medium text-primary-700 hover:text-primary-600 dark:text-primary-300">guia para agentes</a>.</p>
          </div>
        </div>
      </section>

      <section id="configuracao" class="border-t border-gray-200 py-12 dark:border-gray-700 sm:py-16">
        <p class="text-sm font-semibold text-primary-600 dark:text-primary-400">03 · Configuração</p>
        <div class="mt-2 grid gap-8 lg:grid-cols-[.7fr_1.3fr]">
          <div>
            <h2 class="text-3xl font-bold tracking-tight sm:text-4xl">Local primeiro, HTTPS depois.</h2>
            <p class="mt-4 leading-7 text-gray-600 dark:text-gray-400">A instalação inicial funciona em HTTP local. Antes de publicar o cofre, configure domínio, cookies seguros e confiança no reverse proxy.</p>
            <pre class="mt-5 overflow-x-auto rounded-lg border border-gray-700 bg-gray-950 px-5 py-4 font-mono text-sm leading-7 text-green-300 shadow-inner dark:border-gray-600 dark:bg-black dark:text-green-200"><code>CORS_ORIGIN=https://cofre.exemplo.com
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
TRUST_PROXY=1</code></pre>
          </div>
          <div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div v-for="item in configuration" :key="item.name" class="grid gap-1 border-b border-gray-200 px-5 py-4 last:border-b-0 dark:border-gray-700 sm:grid-cols-[13rem_1fr] sm:gap-4">
              <code class="font-mono text-sm font-semibold text-primary-700 dark:text-primary-300">{{ item.name }}</code>
              <p class="text-sm leading-6 text-gray-600 dark:text-gray-400">{{ item.description }}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="validacao" class="border-t border-gray-200 py-12 dark:border-gray-700 sm:py-16">
        <p class="text-sm font-semibold text-primary-600 dark:text-primary-400">04 · Validação e diagnóstico</p>
        <div class="mt-2 grid gap-8 lg:grid-cols-[.7fr_1.3fr]">
          <div>
            <h2 class="text-3xl font-bold tracking-tight sm:text-4xl">Confirme antes de entregar.</h2>
            <p class="mt-4 leading-7 text-gray-600 dark:text-gray-400">Os quatro containers devem estar em execução e o health check da API precisa responder com sucesso.</p>
          </div>
          <div class="space-y-4">
            <pre class="overflow-x-auto rounded-lg border border-gray-700 bg-gray-950 px-5 py-4 font-mono text-sm leading-7 text-green-300 shadow-inner dark:border-gray-600 dark:bg-black dark:text-green-200"><code>cd ~/.atacte
docker compose ps
curl -fsS http://localhost:3457/health
curl -fsS http://localhost:3456/ &gt;/dev/null</code></pre>
            <div class="rounded-lg border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950">
              <p class="text-sm leading-7 text-gray-700 dark:text-gray-300">Se algo falhar, execute <code class="font-mono">docker compose logs --tail=100 postgres backend front updater</code>. Não compartilhe o conteúdo do <code class="font-mono">.env</code>.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="atualizacao" class="border-t border-gray-200 py-12 dark:border-gray-700 sm:py-16">
        <p class="text-sm font-semibold text-primary-600 dark:text-primary-400">05 · Atualização</p>
        <div class="mt-2 grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
          <div>
            <h2 class="text-3xl font-bold tracking-tight sm:text-4xl">Atualize com migrations versionadas.</h2>
            <p class="mt-4 leading-7 text-gray-600 dark:text-gray-400">O updater pode ser acionado pelo manager ou pelo host. Faça backup antes de trocar imagens.</p>
          </div>
          <div>
            <pre class="overflow-x-auto rounded-lg border border-gray-700 bg-gray-950 px-5 py-4 font-mono text-sm leading-7 text-green-300 shadow-inner dark:border-gray-600 dark:bg-black dark:text-green-200"><code>cd ~/.atacte
docker compose pull backend front updater
docker compose up -d --no-build --remove-orphans
curl -fsS http://localhost:3457/health</code></pre>
            <p class="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-400">As migrations usam <code class="font-mono text-primary-700 dark:text-primary-300">prisma migrate deploy</code> e não removem o volume PostgreSQL.</p>
          </div>
        </div>
      </section>

      <section id="backup" class="border-t border-gray-200 py-12 dark:border-gray-700 sm:py-16">
        <p class="text-sm font-semibold text-primary-600 dark:text-primary-400">06 · Continuidade</p>
        <div class="mt-2 grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
          <div>
            <h2 class="text-3xl font-bold tracking-tight sm:text-4xl">Faça backup antes de mudar.</h2>
            <p class="mt-4 leading-7 text-gray-600 dark:text-gray-400">Um dump lógico facilita testar restaurações e migrar para outro host. Guarde-o em mídia criptografada.</p>
          </div>
          <pre class="overflow-x-auto rounded-lg border border-gray-700 bg-gray-950 px-5 py-4 font-mono text-sm leading-7 text-green-300 shadow-inner dark:border-gray-600 dark:bg-black dark:text-green-200"><code>cd ~/.atacte
docker compose exec -T postgres pg_dump -U atacte -d atacte &gt; atacte-backup.sql
test -s atacte-backup.sql</code></pre>
        </div>
      </section>

      <section id="agentes" class="border-t border-gray-200 py-12 dark:border-gray-700 sm:py-16">
        <p class="text-sm font-semibold text-primary-600 dark:text-primary-400">07 · Instalação assistida</p>
        <div class="mt-2 grid gap-8 lg:grid-cols-[.7fr_1.3fr]">
          <div>
            <h2 class="text-3xl font-bold tracking-tight sm:text-4xl">Um roteiro para agentes de IA.</h2>
            <p class="mt-4 leading-7 text-gray-600 dark:text-gray-400">O arquivo <code class="font-mono text-primary-700 dark:text-primary-300">AGENTS.md</code> contém decisões, limites de segurança, instalação de produção, ambiente de desenvolvimento e critérios de conclusão.</p>
          </div>
          <div class="rounded-lg border border-primary-200 bg-primary-50 p-5 dark:border-primary-900 dark:bg-primary-950">
            <div class="flex gap-3">
              <BookOpenIcon class="mt-1 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" />
              <div>
                <p class="font-semibold">Prompt recomendado</p>
                <p class="mt-2 text-sm leading-7 text-gray-700 dark:text-gray-300">Leia o AGENTS.md deste repositório, identifique se o objetivo é produção ou desenvolvimento, execute somente o procedimento correspondente e valide os serviços sem exibir segredos.</p>
                <a href="https://github.com/ferforastieri/atacte/blob/main/AGENTS.md" target="_blank" rel="noreferrer" class="mt-4 inline-flex rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">Abrir guia para agentes ↗</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="seguranca" class="border-t border-gray-200 py-12 dark:border-gray-700 sm:py-16">
        <p class="text-sm font-semibold text-primary-600 dark:text-primary-400">08 · Segurança</p>
        <div class="mt-2 grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
          <div><h2 class="text-3xl font-bold tracking-tight sm:text-4xl">Proteção operacional.</h2></div>
          <div class="rounded-lg border border-green-200 bg-green-50 p-5 dark:border-green-900 dark:bg-green-950">
            <div class="flex gap-3">
              <ShieldCheckIcon class="h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" />
              <p class="text-sm leading-7 text-gray-700 dark:text-gray-300">Use HTTPS, não exponha PostgreSQL ou updater e faça backups criptografados. As sessões usam cookies HttpOnly e CSRF. Mantenha <code class="font-mono">POSTGRES_PASSWORD</code>, <code class="font-mono">JWT_SECRET</code>, <code class="font-mono">ENCRYPTION_KEY</code> e <code class="font-mono">UPDATER_TOKEN</code> fora do repositório e dos logs.</p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="border-t border-gray-200 dark:border-gray-700">
      <div class="flex w-full flex-col items-center gap-3 px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400 sm:flex-row sm:justify-between sm:px-6 sm:text-left lg:px-10 xl:px-12">
        <div class="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:justify-start">
          <PublicLogo :size="24" />
          <span>Atacte · seu cofre, suas regras.</span>
          <span aria-label="Direitos autorais">© 2026 Fernando Forastieri · Licença MIT</span>
        </div>
        <nav class="flex items-center justify-center gap-4" aria-label="Links do rodapé">
          <a class="hover:text-primary-600 dark:hover:text-primary-400" href="/">Início</a>
          <a class="hover:text-primary-600 dark:hover:text-primary-400" href="/releases/">Releases</a>
          <a class="hover:text-primary-600 dark:hover:text-primary-400" href="https://github.com/ferforastieri/atacte" rel="noreferrer">GitHub</a>
        </nav>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import PublicHeader from '../PublicHeader.vue'
import PublicLogo from '../PublicLogo.vue'
import { BookOpenIcon, CloudIcon, LockClosedIcon, ServerIcon, ShieldCheckIcon } from '@heroicons/vue/24/outline'

const requirements = [
  { title: 'Docker', description: 'Engine ativo e Compose v2 em Linux ou macOS.', icon: CloudIcon },
  { title: 'Acesso', description: 'Usuário autorizado a executar Docker e curl.', icon: BookOpenIcon },
  { title: 'HTTPS', description: 'Domínio, VPN ou reverse proxy para acesso remoto.', icon: LockClosedIcon },
  { title: 'Recursos', description: 'Pelo menos 1 GB de RAM para começar.', icon: ServerIcon }
]

const configuration = [
  { name: 'FRONT_PORT', description: 'Porta HTTP do manager. O padrão é 3456.' },
  { name: 'BACKEND_BIND / BACKEND_PORT', description: 'Interface e porta da API. Restrinja 3457 à rede do reverse proxy.' },
  { name: 'CORS_ORIGIN', description: 'Origem pública permitida, por exemplo https://cofre.exemplo.com.' },
  { name: 'COOKIE_SECURE', description: 'Use true sempre que o acesso ocorrer por HTTPS.' },
  { name: 'TRUST_PROXY', description: 'Use 1 quando houver um reverse proxy confiável na frente do manager.' },
  { name: 'SMTP_*', description: 'Configuração opcional para recuperação de senha por e-mail.' }
]
</script>
