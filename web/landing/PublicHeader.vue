<template>
  <header class="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur transition-colors duration-200">
    <div class="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 xl:px-12">
      <div class="flex h-16 items-center justify-between gap-3">
        <a :href="base" class="flex flex-shrink-0 items-center" aria-label="Atacte, início">
          <PublicLogo :show-text="true" />
        </a>
        <nav class="flex items-center gap-1 text-sm font-medium" aria-label="Navegação principal">
          <a :href="`${base}#recursos`" :class="linkClass('section')" class="hidden sm:inline-flex">Recursos</a>
          <a :href="`${base}#como-funciona`" :class="linkClass('section')" class="hidden sm:inline-flex">Como funciona</a>
          <a :href="`${base}docs/`" :class="linkClass('docs')">Documentação</a>
          <a :href="`${base}releases/`" :class="linkClass('releases')" class="hidden sm:inline-flex">Releases</a>
          <a :href="`${base}#instalacao`" class="ml-1 hidden items-center justify-center rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:inline-flex">Instalar</a>
          <button type="button" class="ml-1 flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500" :aria-label="isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro'" :title="isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro'" @click="toggleTheme"><SunIcon v-if="isDark" class="h-5 w-5 text-warning-400" /><MoonIcon v-else class="h-5 w-5" /></button>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MoonIcon, SunIcon } from '@heroicons/vue/24/outline'
import PublicLogo from './PublicLogo.vue'

const base = import.meta.env.BASE_URL

const props = withDefaults(defineProps<{ active?: 'docs' | 'releases' | 'landing' }>(), { active: 'landing' })
const isDark = ref(document.documentElement.classList.contains('dark'))
const linkClass = (name: 'section' | 'docs' | 'releases') => props.active === name
  ? 'nav-pill nav-pill-active'
  : 'nav-pill nav-pill-idle'
const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  window.localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}
</script>
