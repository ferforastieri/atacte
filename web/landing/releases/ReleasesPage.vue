<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
    <header class="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800 sm:px-6 lg:px-10 xl:px-12"><a class="flex items-center gap-2 font-bold" href="/"><img class="h-8 w-8 rounded-lg" src="/favicon-web.png" alt="" />Atacte</a><nav class="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300"><a class="rounded-lg px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700" href="/docs/">Documentação</a><a class="rounded-lg px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700" href="/releases/">Releases</a></nav></header>
    <main class="mx-auto w-full max-w-[920px] px-4 py-20 sm:px-6 lg:px-10 xl:px-12"><div class="max-w-3xl pb-11"><p class="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300"><span class="mr-2 inline-block h-2 w-2 rounded-full bg-primary-600 align-middle" /> Releases / changelog</p><h1 class="mt-5 text-5xl font-extrabold leading-none tracking-[-.06em] sm:text-7xl">Versões publicadas.</h1><p class="mt-6 text-lg leading-7 text-gray-500 dark:text-gray-400">Imagens Docker, instalador e APK Android acompanham cada release quando disponíveis.</p></div><section class="border-t border-gray-200 py-14 dark:border-gray-700"><p class="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300">Histórico</p><h2 class="mt-4 text-4xl font-extrabold tracking-[-.05em] sm:text-5xl">O que mudou.</h2><p v-if="loading" class="mt-5 text-gray-500 dark:text-gray-400">Carregando releases…</p><p v-else-if="!releases.length" class="mt-5 text-gray-500 dark:text-gray-400">Consulte o histórico diretamente no GitHub.</p><div class="mt-7 grid gap-4"><article v-for="release in releases" :key="release.tag_name" class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"><div class="flex justify-between gap-4 text-xs text-gray-500 dark:text-gray-400"><span class="font-semibold text-primary-700 dark:text-primary-300">{{ release.tag_name }}</span><time :datetime="release.published_at">{{ formatDate(release.published_at) }}</time></div><h3 class="mt-3 text-lg font-semibold">{{ release.name || release.tag_name }}</h3><p class="mt-2 line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-300">{{ (release.body || 'Release publicado automaticamente pela pipeline.').slice(0, 280) }}</p><div class="mt-4 flex gap-5 text-xs font-semibold uppercase tracking-wide"><a class="text-primary-700 hover:text-primary-600 dark:text-primary-300" :href="release.html_url" target="_blank" rel="noreferrer">Ver release ↗</a><a v-if="release.assets?.some((asset) => asset.name.endsWith('.apk'))" class="text-primary-700 hover:text-primary-600 dark:text-primary-300" :href="release.assets.find((asset) => asset.name.endsWith('.apk'))?.browser_download_url">Baixar APK</a></div></article></div></section></main>
    <footer class="mx-auto flex w-full max-w-[1200px] justify-between border-t border-gray-200 px-4 py-6 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400 sm:px-6 lg:px-10 xl:px-12"><span>Atacte / private vault</span><span><a class="text-primary-700 dark:text-primary-300" href="/docs/">Docs</a> · <a class="text-primary-700 dark:text-primary-300" href="/">Início</a></span></footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

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
