<template>
  <aside v-if="available" class="mx-4 mt-4 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-cyan-950 shadow-sm dark:border-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-100" role="status" aria-live="polite">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><p class="text-sm font-semibold">Atualização disponível</p><p class="text-xs opacity-80">A versão {{ latestVersion }} está publicada. Seus dados permanecem no volume PostgreSQL.</p></div>
      <div class="flex flex-wrap gap-2"><a :href="releaseUrl" target="_blank" rel="noreferrer" class="rounded-lg border border-current px-3 py-2 text-xs font-semibold">Ver release</a><button v-if="authStore.isAdmin" type="button" class="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60" :disabled="updating" @click="startUpdate">{{ updating ? 'Atualizando…' : 'Atualizar agora' }}</button><button type="button" class="rounded-lg px-2 py-2 text-xs opacity-70 hover:opacity-100" @click="dismiss">Agora não</button></div>
    </div>
    <p v-if="message" class="mt-2 text-xs">{{ message }}</p>
  </aside>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import systemApi from '@/api/system'
import { env } from '@/config/environment'

const authStore = useAuthStore()
const available = ref(false)
const updating = ref(false)
const message = ref('')
const latestVersion = ref('')
const releaseUrl = `https://github.com/${env.githubRepository}/releases/latest`
function isPublished(value: unknown): value is string { return typeof value === 'string' && /^[a-zA-Z0-9._-]{7,64}$/.test(value) && value !== 'development' }
function dismiss() { available.value = false; try { sessionStorage.setItem('atacte-dismissed-update', latestVersion.value) } catch { /* optional */ } }
async function check() {
  try {
    const current = await systemApi.version()
    if (!isPublished(current)) return
    const response = await fetch(`https://api.github.com/repos/${env.githubRepository}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' })
    if (!response.ok) return
    const release = await response.json() as { target_commitish?: unknown; tag_name?: unknown; draft?: boolean; prerelease?: boolean }
    const latest = isPublished(release.target_commitish) ? release.target_commitish : (isPublished(release.tag_name) ? release.tag_name : null)
    if (!latest || latest === current || release.draft || release.prerelease) return
    latestVersion.value = latest
    try { if (sessionStorage.getItem('atacte-dismissed-update') === latest) return } catch { /* optional */ }
    available.value = true
  } catch { /* update checks must never break the manager */ }
}
async function startUpdate() {
  updating.value = true; message.value = ''
  try { await systemApi.update(); message.value = 'Atualização iniciada. O serviço será reiniciado; recarregando em alguns segundos.'; window.setTimeout(() => window.location.reload(), 8000) } catch { message.value = 'Não foi possível iniciar agora. Verifique o updater e tente novamente.'; updating.value = false }
}
onMounted(() => { void check(); window.setInterval(() => void check(), 30 * 60 * 1000) })
</script>
