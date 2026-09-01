<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-200 dark:bg-gray-900 dark:text-gray-100">
    <PublicHeader />

    <main id="top" class="w-full px-4 py-8 pb-24 sm:px-6 lg:px-10 lg:py-10 xl:px-12">
      <section class="grid items-center gap-10 py-8 sm:py-12 lg:grid-cols-2 lg:gap-16 lg:py-16" aria-labelledby="hero-title">
        <div class="public-reveal">
          <div class="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300"><span class="h-2 w-2 rounded-full bg-primary-600" aria-hidden="true" />Seu servidor. Suas regras.</div>
          <h1 id="hero-title" class="max-w-2xl text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">Senhas seguras, organizadas e sob seu controle.</h1>
          <p class="mt-5 max-w-xl text-lg leading-8 text-gray-600 dark:text-gray-300">Atacte é um gerenciador self-hosted para senhas, TOTP e notas privadas. Uma experiência simples, com os dados na infraestrutura que você escolheu.</p>
          <div class="mt-8 flex flex-wrap gap-3"><a href="#instalacao" class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">Instalar com Docker <span aria-hidden="true">↓</span></a><a href="/docs/" class="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Ler documentação</a></div>
          <div class="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400"><span class="inline-flex items-center gap-2"><LockClosedIcon class="h-4 w-4 text-primary-600" />Cookies HttpOnly</span><span class="inline-flex items-center gap-2"><ServerIcon class="h-4 w-4 text-primary-600" />Docker e PostgreSQL</span><span class="inline-flex items-center gap-2"><ShieldCheckIcon class="h-4 w-4 text-primary-600" />Código aberto</span></div>
        </div>

        <div class="public-reveal" aria-label="Prévia do gerenciador Atacte">
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white shadow-sm"><KeyIcon class="h-5 w-5 opacity-90" /><p class="mt-5 text-2xl font-bold">24</p><p class="text-sm text-blue-100">Senhas</p></div>
            <div class="rounded-lg bg-gradient-to-br from-green-500 to-green-600 p-4 text-white shadow-sm"><HeartIcon class="h-5 w-5 opacity-90" /><p class="mt-5 text-2xl font-bold">8</p><p class="text-sm text-green-100">Favoritas</p></div>
            <div class="rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 p-4 text-white shadow-sm"><DocumentTextIcon class="h-5 w-5 opacity-90" /><p class="mt-5 text-2xl font-bold">12</p><p class="text-sm text-purple-100">Notas seguras</p></div>
            <div class="rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 p-4 text-white shadow-sm"><ShieldCheckIcon class="h-5 w-5 opacity-90" /><p class="mt-5 text-2xl font-bold">6</p><p class="text-sm text-orange-100">TOTP ativos</p></div>
          </div>
          <div class="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5">
            <div class="flex items-center justify-between gap-3"><div class="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"><MagnifyingGlassIcon class="h-4 w-4 shrink-0 text-gray-400" /><span class="truncate text-sm text-gray-500 dark:text-gray-400">Pesquisar senhas...</span></div><span class="hidden rounded-lg bg-primary-100 px-3 py-2 text-xs font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-300 sm:inline">Dashboard</span></div>
            <div class="mt-4 flex items-center gap-3 border-t border-gray-200 pt-4 dark:border-gray-700"><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900"><LockClosedIcon class="h-5 w-5 text-primary-600 dark:text-primary-400" /></div><div class="min-w-0 flex-1"><p class="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">Atacte · Gerenciador</p><p class="truncate text-xs text-gray-500 dark:text-gray-400">usuario@exemplo.com</p></div><span class="hidden rounded bg-blue-100 px-2 py-1 font-mono text-xs font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300 sm:inline">482 190</span><span class="rounded-lg p-2 text-gray-400" aria-hidden="true"><EllipsisVerticalIcon class="h-5 w-5" /></span></div>
          </div>
        </div>
      </section>

      <section id="recursos" class="border-t border-gray-200 py-12 dark:border-gray-700 sm:py-16" aria-labelledby="recursos-title">
        <div class="public-reveal"><p class="text-sm font-semibold text-primary-600 dark:text-primary-400">Tudo no mesmo lugar</p><h2 id="recursos-title" class="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Um gerenciador que acompanha seu dia.</h2><p class="mt-3 max-w-2xl text-gray-600 dark:text-gray-400">A interface do Atacte foi feita para consultar, criar e manter seus dados sem distrações.</p></div>
        <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><article v-for="feature in features" :key="feature.title" class="public-reveal rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"><div :class="['flex h-10 w-10 items-center justify-center rounded-lg', feature.bg]"><component :is="feature.icon" :class="['h-5 w-5', feature.color]" /></div><h3 class="mt-4 font-semibold">{{ feature.title }}</h3><p class="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">{{ feature.description }}</p></article></div>
      </section>

      <section id="como-funciona" class="border-t border-gray-200 py-12 dark:border-gray-700 sm:py-16" aria-labelledby="como-title">
        <div class="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start"><div class="public-reveal"><p class="text-sm font-semibold text-primary-600 dark:text-primary-400">Simples de operar</p><h2 id="como-title" class="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Você decide onde o cofre roda.</h2><p class="mt-4 leading-7 text-gray-600 dark:text-gray-400">O Atacte é publicado como containers e usa PostgreSQL. Não há serviço externo obrigatório para acessar seu gerenciador.</p></div><div class="grid gap-4 sm:grid-cols-3"><article v-for="(step, index) in steps" :key="step.title" class="public-reveal rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"><span class="font-mono text-sm font-semibold text-primary-600 dark:text-primary-400">0{{ index + 1 }}</span><h3 class="mt-5 font-semibold">{{ step.title }}</h3><p class="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">{{ step.description }}</p></article></div></div>
      </section>

      <section id="instalacao" class="public-reveal rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-8" aria-labelledby="instalacao-title"><div class="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><p class="text-sm font-semibold text-primary-600 dark:text-primary-400">Comece em minutos</p><h2 id="instalacao-title" class="mt-2 text-3xl font-bold tracking-tight">Instale no seu servidor.</h2><p class="mt-3 max-w-2xl text-gray-600 dark:text-gray-400">O instalador cria a configuração inicial, preserva os dados e inicia o gerenciador com Docker Compose.</p><div class="mt-5 overflow-x-auto rounded-lg bg-gray-900 px-4 py-3 font-mono text-sm text-green-200"><code>curl -fsSL https://atacte.vercel.app/install.sh | sh</code></div></div><div class="flex flex-wrap gap-3"><a href="/docs/#instalacao" class="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">Instruções completas</a><a href="/releases/" class="inline-flex items-center justify-center rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Ver releases</a></div></div></section>
    </main>

    <footer class="border-t border-gray-200 dark:border-gray-700"><div class="flex w-full flex-col items-center gap-3 px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400 sm:flex-row sm:justify-between sm:px-6 sm:text-left lg:px-10 xl:px-12"><div class="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:justify-start"><PublicLogo :size="24" /><span>Atacte · seu cofre, suas regras.</span><span aria-label="Direitos autorais">© 2026 Fernando Forastieri · Licença MIT</span></div><nav class="flex items-center justify-center gap-4" aria-label="Links do rodapé"><a class="transition-colors hover:text-primary-600 dark:hover:text-primary-400" href="/docs/">Documentação</a><a class="transition-colors hover:text-primary-600 dark:hover:text-primary-400" href="/releases/">Releases</a><a class="transition-colors hover:text-primary-600 dark:hover:text-primary-400" href="https://github.com/ferforastieri/atacte" rel="noreferrer">GitHub</a></nav></div></footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import PublicHeader from './PublicHeader.vue'
import PublicLogo from './PublicLogo.vue'
import { DocumentTextIcon, EllipsisVerticalIcon, HeartIcon, KeyIcon, LockClosedIcon, MagnifyingGlassIcon, ServerIcon, ShieldCheckIcon } from '@heroicons/vue/24/outline'

const features = [
  { title: 'Senhas organizadas', description: 'Crie, pesquise, favorite e importe credenciais em poucos cliques.', icon: KeyIcon, bg: 'bg-blue-100 dark:bg-blue-900', color: 'text-blue-600 dark:text-blue-300' },
  { title: 'TOTP integrado', description: 'Gere códigos de dois fatores junto da conta que você está acessando.', icon: ShieldCheckIcon, bg: 'bg-green-100 dark:bg-green-900', color: 'text-green-600 dark:text-green-300' },
  { title: 'Notas privadas', description: 'Guarde chaves de recuperação, documentos e lembretes com organização.', icon: DocumentTextIcon, bg: 'bg-purple-100 dark:bg-purple-900', color: 'text-purple-600 dark:text-purple-300' },
  { title: 'Sessões sob controle', description: 'Revise dispositivos, encerre sessões e acompanhe a atividade da conta.', icon: ServerIcon, bg: 'bg-orange-100 dark:bg-orange-900', color: 'text-orange-600 dark:text-orange-300' }
]
const steps = [
  { title: 'Instale', description: 'Um comando baixa a configuração e sobe os containers.' },
  { title: 'Organize', description: 'Acesse o manager pela web, mobile ou desktop.' },
  { title: 'Atualize', description: 'O updater avisa sobre releases e mantém seu volume.' }
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
