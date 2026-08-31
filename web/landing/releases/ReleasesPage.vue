<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-200 dark:bg-gray-900 dark:text-gray-100">
    <PublicHeader active="releases" />

    <main class="w-full px-4 py-8 pb-24 sm:px-6 lg:px-10 lg:py-10 xl:px-12">
      <section class="grid gap-8 py-8 sm:py-12 lg:grid-cols-[1.1fr_.9fr] lg:items-end lg:gap-16 lg:py-16" aria-labelledby="releases-title">
        <div><div class="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300"><span class="h-2 w-2 rounded-full bg-primary-600" />Publicação contínua</div><h1 id="releases-title" class="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">Versões publicadas.</h1><p class="mt-5 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">Imagens Docker, instalador e APK Android acompanham cada release quando disponíveis.</p></div>
        <div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900"><ArrowDownTrayIcon class="h-5 w-5 text-primary-600 dark:text-primary-400" /></div><div><p class="font-semibold">Artefatos do projeto</p><p class="text-sm text-gray-500 dark:text-gray-400">Escolha uma versão e instale.</p></div></div><a href="https://github.com/ferforastieri/atacte/releases" target="_blank" rel="noreferrer" class="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">Abrir no GitHub <ArrowTopRightOnSquareIcon class="ml-2 h-4 w-4" /></a></div>
      </section>

      <section class="border-t border-gray-200 py-12 dark:border-gray-700 sm:py-16" aria-labelledby="history-title"><div class="flex flex-wrap items-end justify-between gap-4"><div><p class="text-sm font-semibold text-primary-600 dark:text-primary-400">Histórico</p><h2 id="history-title" class="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">O que mudou.</h2></div><a href="https://github.com/ferforastieri/atacte/releases" target="_blank" rel="noreferrer" class="text-sm font-medium text-primary-700 hover:text-primary-600 dark:text-primary-300">Ver todas no GitHub <span aria-hidden="true">↗</span></a></div>
        <div v-if="loading" class="mt-8 rounded-lg border border-gray-200 bg-white p-6 text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">Carregando releases...</div>
        <div v-else-if="!releases.length" class="mt-8 rounded-lg border border-gray-200 bg-white p-6 text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">Nenhuma release disponível no momento. Consulte o histórico no GitHub.</div>
        <div v-else class="mt-8 grid gap-4 lg:grid-cols-2"><article v-for="release in releases" :key="release.tag_name" class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"><div class="flex items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400"><span class="rounded-full bg-primary-100 px-2.5 py-1 font-mono font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300">{{ release.tag_name }}</span><time :datetime="release.published_at">{{ formatDate(release.published_at) }}</time></div><h3 class="mt-4 text-lg font-semibold">{{ release.name || release.tag_name }}</h3><p class="mt-2 line-clamp-4 text-sm leading-6 text-gray-600 dark:text-gray-300">{{ (release.body || 'Release publicado automaticamente pela pipeline.').slice(0, 360) }}</p><div class="mt-5 flex flex-wrap gap-4 text-sm font-medium"><a class="text-primary-700 hover:text-primary-600 dark:text-primary-300" :href="release.html_url" target="_blank" rel="noreferrer">Ver release <span aria-hidden="true">↗</span></a><a v-if="release.assets?.some((asset) => asset.name.toLowerCase().endsWith('.apk'))" class="text-primary-700 hover:text-primary-600 dark:text-primary-300" :href="release.assets.find((asset) => asset.name.toLowerCase().endsWith('.apk'))?.browser_download_url">Baixar APK <span aria-hidden="true">↓</span></a></div></article></div>
      </section>
    </main>

        <footer class="border-t border-gray-200 dark:border-gray-700"><div class="flex w-full flex-col gap-3 px-4 py-6 text-sm text-gray-500 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10 xl:px-12"><div class="flex flex-wrap items-center gap-x-2 gap-y-1"><PublicLogo :size="24" /><span>Atacte · seu cofre, suas regras.</span><span aria-label="Direitos autorais">© 2026 Fernando Forastieri · Licença MIT</span></div><nav class="flex items-center gap-4" aria-label="Links do rodapé"><a class="hover:text-primary-600 dark:hover:text-primary-400" href="/">Início</a><a class="hover:text-primary-600 dark:hover:text-primary-400" href="/docs/">Documentação</a><a class="hover:text-primary-600 dark:hover:text-primary-400" href="https://github.com/ferforastieri/atacte" rel="noreferrer">GitHub</a></nav></div></footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PublicHeader from '../PublicHeader.vue'
import PublicLogo from '../PublicLogo.vue'
import { ArrowDownTrayIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'
const releases = ref<Array<{ tag_name: string; name: string; html_url: string; published_at: string; body: string | null; assets?: Array<{ name: string; browser_download_url: string }> }>>([])
const loading = ref(true)
const formatDate = (value: string) => new Date(value).toLocaleDateString('pt-BR')

onMounted(async () => {
  try {
    const response = await fetch('https://api.github.com/repos/ferforastieri/atacte/releases?per_page=30', { headers: { Accept: 'application/vnd.github+json' } })
    if (response.ok) releases.value = await response.json()
  } catch { /* public page remains useful offline */ } finally { loading.value = false }
})
</script>
