<template>
  <div class="min-h-screen overflow-hidden bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
    <header class="mx-auto flex h-[84px] max-w-[1440px] items-center justify-between border-b border-gray-200 bg-white px-[5vw] shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800">
      <a class="flex items-center gap-2 font-bold" href="#top" aria-label="Atacte início">
        <img class="h-[34px] w-[34px] rounded-lg shadow-sm" src="/favicon-web.png" alt="" />
        <span>Atacte<small class="mt-0.5 block text-[8px] font-medium uppercase tracking-[.16em] text-gray-500 dark:text-gray-400">Private vault</small></span>
      </a>
      <nav class="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300" aria-label="Navegação principal">
        <a class="hidden rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 sm:block" href="#recursos">Recursos</a>
        <a class="hidden rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 sm:block" href="#como-funciona">Como funciona</a>
        <a class="hidden rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 md:block" href="/docs/">Documentação</a>
        <a class="hidden rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 md:block" href="/releases/">Releases</a>
        <a class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700" :href="managerUrl">Abrir gerenciador <span>↗</span></a>
      </nav>
    </header>

    <main id="top" class="mx-auto max-w-[1440px] px-[5vw]">
      <section class="relative grid min-h-[calc(100vh-84px)] items-center gap-[5vw] py-[8vh] lg:grid-cols-2">
        <div class="public-reveal relative z-10" aria-labelledby="hero-title">
          <p class="mb-6 text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300"><span class="mr-2 inline-block h-2 w-2 rounded-full bg-primary-600 align-middle" /> Self-hosted · open source · sem ruído</p>
          <h1 id="hero-title" class="max-w-3xl text-5xl font-extrabold leading-[.98] tracking-[-.065em] sm:text-6xl lg:text-8xl">O lugar onde<br /><em class="not-italic text-primary-600 dark:text-primary-400">suas chaves descansam.</em></h1>
          <p class="mt-6 max-w-xl text-base leading-7 text-gray-600 dark:text-gray-300">Atacte reúne senhas, códigos de autenticação e notas privadas em um cofre simples de operar — no seu servidor, sob suas regras.</p>
          <div class="mt-8 mb-14 flex flex-wrap gap-3">
            <a class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2" :href="managerUrl">Abrir gerenciador <span>→</span></a>
            <a class="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600" href="#instalacao">Ver instalação</a>
          </div>
          <div class="grid grid-cols-3 gap-3 border-t border-gray-200 pt-5 dark:border-gray-700">
            <div><strong class="block font-mono text-lg font-semibold text-primary-600 dark:text-primary-400">01</strong><span class="mt-2 block text-xs font-bold">Local</span><small class="mt-1 block text-[10px] leading-4 text-gray-500 dark:text-gray-400">Seus dados ficam na sua infraestrutura.</small></div>
            <div><strong class="block font-mono text-lg font-semibold text-primary-600 dark:text-primary-400">02</strong><span class="mt-2 block text-xs font-bold">Consciente</span><small class="mt-1 block text-[10px] leading-4 text-gray-500 dark:text-gray-400">Sem promessas de segurança que o produto não cumpre.</small></div>
            <div><strong class="block font-mono text-lg font-semibold text-primary-600 dark:text-primary-400">03</strong><span class="mt-2 block text-xs font-bold">Portátil</span><small class="mt-1 block text-[10px] leading-4 text-gray-500 dark:text-gray-400">Docker, web, mobile e desktop.</small></div>
          </div>
        </div>

        <div class="public-reveal relative flex min-h-[390px] items-center justify-center lg:min-h-[500px]" aria-label="Ilustração de um cofre com itens protegidos">
          <div class="absolute h-2/3 w-[96%] rotate-[-24deg] rounded-full border border-blue-500/20" />
          <div class="absolute h-1/2 w-4/5 rotate-[-24deg] rounded-full border border-primary-500/30" />
          <div class="relative w-full max-w-[430px] rotate-2 rounded-lg border border-gray-300 bg-gradient-to-br from-white to-gray-100 p-[18px] shadow-[22px_24px_0_rgba(220,252,231,.8),0_24px_48px_rgba(17,24,39,.14)] dark:border-gray-600 dark:from-gray-700 dark:to-gray-800 dark:shadow-[22px_24px_0_rgba(20,83,45,.8),0_24px_48px_rgba(0,0,0,.3)]">
            <div class="flex justify-between font-mono text-[10px] tracking-widest text-gray-500 dark:text-gray-400"><span>AT—01</span><span>SECURE / LOCAL</span></div>
            <div class="relative my-[18px] grid h-[245px] place-items-center rounded-lg border border-gray-300 bg-gradient-to-br from-white to-gray-200 dark:border-gray-600 dark:from-gray-600 dark:to-gray-800">
              <div class="grid h-[154px] w-[154px] place-items-center rounded-full border-[11px] border-primary-500 bg-transparent shadow-[inset_0_0_0_5px_#bbf7d0,0_0_0_2px_#15803d]"><strong class="text-3xl font-bold text-primary-600 dark:text-primary-400">✦</strong></div>
              <div class="absolute bottom-4 font-mono text-[10px] text-gray-500 dark:text-gray-400"><span class="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-primary-500" /> VAULT READY</div>
            </div>
            <div class="grid grid-cols-[70px_1fr_38px] items-center border-t border-gray-200 px-3 py-3.5 font-mono text-[11px] text-gray-500 dark:border-gray-700 dark:text-gray-400"><span>KEYS</span><b class="font-medium tracking-widest text-gray-900 dark:text-gray-100">••••••••••••</b><i class="text-right not-italic text-primary-600">✓</i></div>
            <div class="grid grid-cols-[70px_1fr_38px] items-center border-t border-gray-200 px-3 py-3.5 font-mono text-[11px] text-gray-500 dark:border-gray-700 dark:text-gray-400"><span>TOTP</span><b class="font-medium tracking-[.25em] text-blue-600">4 8 2 1 9 0</b><i class="text-right not-italic text-primary-600">30s</i></div>
            <div class="mt-1 flex justify-between border-t border-gray-200 pt-4 font-mono text-[9px] tracking-widest text-gray-500 dark:border-gray-700 dark:text-gray-400"><span>PRIVATE BY DESIGN</span><span>EST. 2024</span></div>
          </div>
        </div>
      </section>

      <section id="recursos" class="border-t border-gray-200 py-[120px] dark:border-gray-700">
        <div class="public-reveal max-w-2xl"><p class="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300">01 / O COFRE</p><h2 class="mt-4 text-5xl font-extrabold leading-none tracking-[-.06em] sm:text-6xl lg:text-7xl">O essencial,<br /><em class="not-italic text-primary-600 dark:text-primary-400">bem guardado.</em></h2><p class="mt-6 max-w-xl leading-7 text-gray-500 dark:text-gray-400">Uma interface direta para as coisas que você não pode perder — nem deixar expostas.</p></div>
        <div class="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article class="public-reveal flex min-h-[250px] flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"><span class="text-2xl font-bold text-primary-600">⌘</span><h3 class="mt-8 text-lg font-semibold">Senhas no lugar</h3><p class="mt-3 mb-6 text-sm leading-6 text-gray-500 dark:text-gray-400">Crie, organize, pesquise e importe suas credenciais sem espalhar cópias pela nuvem.</p><small class="mt-auto text-[10px] font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300">01 / CREDENCIAIS</small></article>
          <article class="public-reveal flex min-h-[250px] flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"><span class="text-2xl font-bold text-blue-600">◌</span><h3 class="mt-8 text-lg font-semibold">TOTP junto da senha</h3><p class="mt-3 mb-6 text-sm leading-6 text-gray-500 dark:text-gray-400">Gere códigos de dois fatores no mesmo contexto, sem alternar entre aplicativos.</p><small class="mt-auto text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">02 / AUTENTICAÇÃO</small></article>
          <article class="public-reveal flex min-h-[250px] flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"><span class="text-2xl font-bold text-purple-600">◇</span><h3 class="mt-8 text-lg font-semibold">Notas privadas</h3><p class="mt-3 mb-6 text-sm leading-6 text-gray-500 dark:text-gray-400">Guarde chaves de recuperação, documentos e lembretes que merecem outra camada.</p><small class="mt-auto text-[10px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300">03 / NOTAS</small></article>
          <article class="public-reveal flex min-h-[250px] flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"><span class="text-2xl font-bold text-orange-600">▣</span><h3 class="mt-8 text-lg font-semibold">Controle de acesso</h3><p class="mt-3 mb-6 text-sm leading-6 text-gray-500 dark:text-gray-400">Veja sessões, confie dispositivos e mantenha uma trilha de auditoria compreensível.</p><small class="mt-auto text-[10px] font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-300">04 / SESSÕES</small></article>
        </div>
      </section>

      <section id="como-funciona" class="border-t border-gray-200 py-[120px] dark:border-gray-700"><p class="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300">02 / SEM MÁGICA</p><div class="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-[10vw]"><div class="public-reveal"><p class="text-gray-500 dark:text-gray-400">O Atacte não tenta esconder a infraestrutura.</p><h2 class="mt-5 text-5xl font-extrabold leading-none tracking-[-.06em] sm:text-6xl lg:text-7xl">Você sabe<br />onde ele roda.<br /><em class="not-italic text-primary-600 dark:text-primary-400">Você decide.</em></h2></div><div class="public-reveal max-w-md border-l-4 border-primary-600 pl-7"><span class="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300">O modelo</span><p class="mt-4 leading-7 text-gray-600 dark:text-gray-300">O gerenciador roda com sua API e seu PostgreSQL. A landing é pública; o cofre continua no ambiente que você escolheu.</p><dl class="mt-10"><div class="flex gap-5 border-t border-gray-200 py-4 dark:border-gray-700"><dt class="font-mono text-xs font-semibold text-primary-600">01</dt><dd class="m-0 text-sm">Suba com Docker Compose</dd></div><div class="flex gap-5 border-t border-gray-200 py-4 dark:border-gray-700"><dt class="font-mono text-xs font-semibold text-primary-600">02</dt><dd class="m-0 text-sm">Acesse pela web, mobile ou desktop</dd></div><div class="flex gap-5 border-t border-gray-200 py-4 dark:border-gray-700"><dt class="font-mono text-xs font-semibold text-primary-600">03</dt><dd class="m-0 text-sm">Atualize pela imagem versionada</dd></div></dl></div></div></section>

      <section id="instalacao" class="public-reveal flex flex-col items-start justify-between gap-8 border-t border-gray-200 py-[86px] dark:border-gray-700 lg:flex-row lg:items-end"><div><p class="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300">03 / PRIMEIRO PASSO</p><h2 class="mt-5 text-5xl font-extrabold leading-none tracking-[-.06em] sm:text-6xl lg:text-7xl">Seu cofre começa<br /><em class="not-italic text-primary-600 dark:text-primary-400">no seu servidor.</em></h2><p class="mt-6 max-w-xl leading-7 text-gray-500 dark:text-gray-400">Instale com Docker em um comando. O updater interno avisa quando há uma nova release e preserva o PostgreSQL.</p><pre class="mt-6 max-w-xl overflow-auto rounded-lg border border-gray-700 bg-gray-900 px-4 py-3.5 font-mono text-xs leading-6 text-green-200"><code>curl -fsSL https://atacte.vercel.app/install.sh | sh</code></pre></div><div class="flex flex-wrap gap-3"><a class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2" :href="managerUrl">Abrir o gerenciador <span>→</span></a><a class="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600" href="/docs/">Ler a documentação</a></div></section>
    </main>

    <footer class="mx-auto flex max-w-[1440px] justify-between border-t border-gray-200 px-[5vw] py-6 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400"><span>Atacte / private vault</span><span><a class="text-primary-700 hover:text-primary-600 dark:text-primary-300" href="/docs/">Docs</a> · <a class="text-primary-700 hover:text-primary-600 dark:text-primary-300" href="/releases/">Releases</a> · <a class="text-primary-700 hover:text-primary-600 dark:text-primary-300" :href="managerUrl">Entrar</a></span></footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'

const managerUrl = computed(() => import.meta.env.VITE_MANAGER_URL || '/manager/')

onMounted(() => {
  const nodes = document.querySelectorAll<HTMLElement>('.public-reveal')
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    nodes.forEach((node) => node.classList.add('is-visible'))
    return
  }
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return
    entry.target.classList.add('is-visible')
    observer.unobserve(entry.target)
  }), { threshold: 0.12 })
  nodes.forEach((node) => observer.observe(node))
})
</script>
