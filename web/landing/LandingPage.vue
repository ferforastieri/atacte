<template>
  <div class="min-h-screen bg-canvas text-ink transition-colors duration-200">
    <PublicHeader />

    <main id="top" class="mx-auto w-full max-w-[1600px] px-4 py-8 pb-24 sm:px-6 lg:px-10 lg:py-10 xl:px-12">
      <section class="grid items-center gap-10 py-8 sm:py-12 lg:grid-cols-2 lg:gap-16 lg:py-16" aria-labelledby="hero-title">
        <div class="public-reveal">
          <div class="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"><span class="h-2 w-2 rounded-full bg-primary-500" aria-hidden="true" />Seu servidor. Suas regras.</div>
          <h1 id="hero-title" class="max-w-2xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-6xl">Senhas seguras, organizadas e sob seu controle.</h1>
          <p class="mt-5 max-w-xl text-lg leading-8 text-ink-muted">Atacte é um gerenciador self-hosted para senhas, TOTP e notas privadas. Uma experiência simples, com os dados na infraestrutura que você escolheu.</p>
          <div class="mt-8 flex flex-wrap gap-3"><a href="#instalacao" class="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas">Instalar com Docker <span aria-hidden="true">↓</span></a><a :href="`${base}docs/`" class="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas">Ler documentação</a></div>
          <div class="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted"><span class="inline-flex items-center gap-2"><LockClosedIcon class="h-4 w-4 text-primary-700 dark:text-primary-400" />Cookies HttpOnly</span><span class="inline-flex items-center gap-2"><ServerIcon class="h-4 w-4 text-primary-700 dark:text-primary-400" />Docker e PostgreSQL</span><span class="inline-flex items-center gap-2"><ShieldCheckIcon class="h-4 w-4 text-primary-700 dark:text-primary-400" />Código aberto</span></div>
        </div>

        <div class="public-reveal" aria-label="Prévia do gerenciador Atacte">
          <div class="grid grid-cols-2 gap-3">
            <div class="surface-card p-4"><div class="flex items-center gap-3"><div class="icon-tile"><KeyIcon class="h-5 w-5" /></div><div class="min-w-0"><p class="text-[11px] leading-tight text-ink-muted">Senhas</p><p class="text-xl font-semibold text-ink">24</p></div></div></div>
            <div class="surface-card p-4"><div class="flex items-center gap-3"><div class="icon-tile"><HeartIcon class="h-5 w-5" /></div><div class="min-w-0"><p class="text-[11px] leading-tight text-ink-muted">Favoritas</p><p class="text-xl font-semibold text-ink">8</p></div></div></div>
            <div class="surface-card p-4"><div class="flex items-center gap-3"><div class="icon-tile"><DocumentTextIcon class="h-5 w-5" /></div><div class="min-w-0"><p class="text-[11px] leading-tight text-ink-muted">Notas seguras</p><p class="text-xl font-semibold text-ink">12</p></div></div></div>
            <div class="surface-card p-4"><div class="flex items-center gap-3"><div class="icon-tile"><ShieldCheckIcon class="h-5 w-5" /></div><div class="min-w-0"><p class="text-[11px] leading-tight text-ink-muted">TOTP ativos</p><p class="text-xl font-semibold text-ink">6</p></div></div></div>
          </div>
          <div class="surface-card mt-4 p-4 sm:p-5">
            <div class="flex items-center justify-between gap-3"><div class="surface-muted flex min-w-0 flex-1 items-center gap-2 px-3 py-2"><MagnifyingGlassIcon class="h-4 w-4 shrink-0 text-ink-subtle" /><span class="truncate text-sm text-ink-subtle">Pesquisar senhas...</span></div><span class="hidden rounded-full bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 sm:inline">Dashboard</span></div>
            <div class="mt-4 flex items-center gap-3 border-t border-line pt-4"><div class="icon-tile"><LockClosedIcon class="h-5 w-5" /></div><div class="min-w-0 flex-1"><p class="truncate text-sm font-semibold text-ink">Atacte · Gerenciador</p><p class="truncate text-xs text-ink-muted">usuario@exemplo.com</p></div><span class="hidden rounded-full px-2 py-1 font-mono text-xs font-semibold sm:inline-flex pill-info">482 190</span><span class="rounded-lg p-2 text-ink-subtle" aria-hidden="true"><EllipsisVerticalIcon class="h-5 w-5" /></span></div>
          </div>
        </div>
      </section>

      <section id="recursos" class="border-t border-line py-12 sm:py-16" aria-labelledby="recursos-title">
        <div class="public-reveal"><p class="text-sm font-semibold text-primary-700 dark:text-primary-400">Tudo no mesmo lugar</p><h2 id="recursos-title" class="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Um gerenciador que acompanha seu dia.</h2><p class="mt-3 max-w-2xl text-ink-muted">A interface do Atacte foi feita para consultar, criar e manter seus dados sem distrações.</p></div>
        <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><article v-for="feature in features" :key="feature.title" class="public-reveal surface-card p-5 transition-shadow hover:shadow-pop"><div class="icon-tile"><component :is="feature.icon" class="h-5 w-5" /></div><h3 class="mt-4 font-semibold text-ink">{{ feature.title }}</h3><p class="mt-2 text-sm leading-6 text-ink-muted">{{ feature.description }}</p></article></div>
      </section>

      <section id="como-funciona" class="border-t border-line py-12 sm:py-16" aria-labelledby="como-title">
        <div class="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start"><div class="public-reveal"><p class="text-sm font-semibold text-primary-700 dark:text-primary-400">Simples de operar</p><h2 id="como-title" class="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Você decide onde o cofre roda.</h2><p class="mt-4 leading-7 text-ink-muted">O Atacte é publicado como containers e usa PostgreSQL. Não há serviço externo obrigatório para acessar seu gerenciador.</p></div><div class="grid gap-4 sm:grid-cols-3"><article v-for="(step, index) in steps" :key="step.title" class="public-reveal surface-card p-5"><span class="font-mono text-sm font-semibold text-primary-700 dark:text-primary-400">0{{ index + 1 }}</span><h3 class="mt-5 font-semibold text-ink">{{ step.title }}</h3><p class="mt-2 text-sm leading-6 text-ink-muted">{{ step.description }}</p></article></div></div>
      </section>

      <section id="instalacao" class="public-reveal surface-card p-6 sm:p-8" aria-labelledby="instalacao-title"><div class="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div class="min-w-0"><p class="text-sm font-semibold text-primary-700 dark:text-primary-400">Comece em minutos</p><h2 id="instalacao-title" class="mt-2 text-3xl font-semibold tracking-tight text-ink">Instale no seu servidor.</h2><p class="mt-3 max-w-2xl text-ink-muted">O instalador cria a configuração inicial, preserva os dados e inicia o gerenciador com Docker Compose.</p><div class="hero-card mt-5 overflow-x-auto px-4 py-3 font-mono text-sm text-primary-200"><code>curl -fsSL https://ferforastieri.github.io/atacte/install.sh | sh</code></div></div><div class="flex min-w-0 flex-wrap gap-3"><a :href="`${base}docs/#instalacao`" class="inline-flex items-center justify-center rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas">Instruções completas</a><a :href="`${base}releases/`" class="inline-flex items-center justify-center rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas">Ver releases</a></div></div></section>
    </main>

    <footer class="border-t border-line"><div class="mx-auto flex w-full max-w-[1600px] flex-col items-center gap-3 px-4 py-6 text-center text-sm text-ink-muted sm:flex-row sm:justify-between sm:px-6 sm:text-left lg:px-10 xl:px-12"><div class="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:justify-start"><PublicLogo :size="24" /><span>Atacte · seu cofre, suas regras.</span><span aria-label="Direitos autorais">© 2026 Fernando Forastieri · Licença MIT</span></div><nav class="flex items-center justify-center gap-4" aria-label="Links do rodapé"><a class="transition-colors hover:text-primary-700 dark:hover:text-primary-400" :href="`${base}docs/`">Documentação</a><a class="transition-colors hover:text-primary-700 dark:hover:text-primary-400" :href="`${base}releases/`">Releases</a><a class="transition-colors hover:text-primary-700 dark:hover:text-primary-400" href="https://github.com/ferforastieri/atacte" rel="noreferrer">GitHub</a></nav></div></footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import PublicHeader from './PublicHeader.vue'
import PublicLogo from './PublicLogo.vue'

const base = import.meta.env.BASE_URL
import { DocumentTextIcon, EllipsisVerticalIcon, HeartIcon, KeyIcon, LockClosedIcon, MagnifyingGlassIcon, ServerIcon, ShieldCheckIcon } from '@heroicons/vue/24/outline'

const features = [
  { title: 'Senhas organizadas', description: 'Crie, pesquise, favorite e importe credenciais em poucos cliques.', icon: KeyIcon },
  { title: 'TOTP integrado', description: 'Gere códigos de dois fatores junto da conta que você está acessando.', icon: ShieldCheckIcon },
  { title: 'Notas privadas', description: 'Guarde chaves de recuperação, documentos e lembretes com organização.', icon: DocumentTextIcon },
  { title: 'Sessões sob controle', description: 'Revise dispositivos, encerre sessões e acompanhe a atividade da conta.', icon: ServerIcon }
]
const steps = [
  { title: 'Instale', description: 'Um comando baixa a configuração e sobe os containers.' },
  { title: 'Organize', description: 'Acesse o manager pela web, mobile ou desktop.' },
  { title: 'Atualize', description: 'Web e mobile avisam sobre novas releases. Atualize manualmente no servidor.' }
]

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
