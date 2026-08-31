<template>
  <header class="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm transition-colors duration-200 dark:border-gray-700 dark:bg-gray-800">
    <div class="w-full px-4 sm:px-6 lg:px-10 xl:px-12">
      <div class="flex h-16 items-center justify-between">
        <a href="/" class="flex items-center" aria-label="Atacte, início">
          <PublicLogo :show-text="true" />
        </a>
        <nav class="flex items-center space-x-1 text-sm font-medium" aria-label="Navegação principal">
          <a href="/#recursos" :class="linkClass('section')" class="hidden sm:block">Recursos</a>
          <a href="/#como-funciona" :class="linkClass('section')" class="hidden sm:block">Como funciona</a>
          <a href="/docs/" :class="linkClass('docs')">Documentação</a>
          <a href="/releases/" :class="linkClass('releases')" class="hidden sm:block">Releases</a>
          <a href="/#instalacao" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">Instalar</a>
          <button type="button" class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:hover:bg-gray-700" :aria-label="isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro'" :title="isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro'" @click="toggleTheme"><SunIcon v-if="isDark" class="h-5 w-5 text-yellow-500" /><MoonIcon v-else class="h-5 w-5 text-gray-600 dark:text-gray-300" /></button>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MoonIcon, SunIcon } from '@heroicons/vue/24/outline'
import PublicLogo from './PublicLogo.vue'

const props = withDefaults(defineProps<{ active?: 'docs' | 'releases' | 'landing' }>(), { active: 'landing' })
const isDark = ref(document.documentElement.classList.contains('dark'))
const linkClass = (name: 'section' | 'docs' | 'releases') => props.active === name
  ? 'rounded-lg bg-primary-100 px-3 py-2 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
  : 'rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  window.localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}
</script>
