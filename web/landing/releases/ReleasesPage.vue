<template>
  <div class="landing-shell public-page">
    <header class="site-header"><a class="brand" href="/"><img src="/favicon-web.png" alt="" /><span>ATACTE<small>PRIVATE VAULT</small></span></a><nav><a href="/docs/">Documentação</a><a href="/releases/">Releases</a><a class="header-link" :href="managerUrl">Abrir gerenciador ↗</a></nav></header>
    <main class="docs-content releases-page"><div class="docs-hero"><p class="eyebrow"><span /> RELEASES / CHANGELOG</p><h1>Versões publicadas.</h1><p>Imagens Docker, instalador e APK Android acompanham cada release quando disponíveis.</p></div><section><p class="section-index">HISTÓRICO</p><h2>O que mudou.</h2><p v-if="loading">Carregando releases…</p><p v-else-if="!releases.length">Consulte o histórico diretamente no GitHub.</p><div class="release-list"><article v-for="release in releases" :key="release.tag_name" class="release-card"><div><span class="release-tag">{{ release.tag_name }}</span><time :datetime="release.published_at">{{ formatDate(release.published_at) }}</time></div><h3>{{ release.name || release.tag_name }}</h3><p>{{ (release.body || 'Release publicado automaticamente pela pipeline.').slice(0, 280) }}</p><div class="release-actions"><a :href="release.html_url" target="_blank" rel="noreferrer">Ver release ↗</a><a v-if="release.assets?.some((asset) => asset.name.endsWith('.apk'))" :href="release.assets.find((asset) => asset.name.endsWith('.apk'))?.browser_download_url">Baixar APK</a></div></article></div></section></main><footer class="site-footer"><span>ATACTE / PRIVATE VAULT</span><span><a href="/docs/">DOCS</a> · <a href="/">INÍCIO</a></span></footer>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
const managerUrl = import.meta.env.VITE_MANAGER_URL || '/manager/'
const releases = ref<Array<{ tag_name: string; name: string; html_url: string; published_at: string; body: string | null; assets?: Array<{ name: string; browser_download_url: string }> }>>([])
const loading = ref(true)
const formatDate = (value: string) => new Date(value).toLocaleDateString('pt-BR')
onMounted(async () => { try { const response = await fetch('https://api.github.com/repos/ferforastieri/atacte/releases?per_page=30', { headers: { Accept: 'application/vnd.github+json' } }); if (response.ok) releases.value = await response.json() } catch { /* public page remains useful offline */ } finally { loading.value = false } })
</script>
