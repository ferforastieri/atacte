<template>
  <button
    type="button"
    class="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    :title="themeStore.isDarkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro'"
    :aria-label="themeStore.isDarkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro'"
    @click="themeStore.toggleTheme"
  >
    <SunIcon v-if="themeStore.isDarkMode" class="h-5 w-5 text-warning-400" />
    <MoonIcon v-else class="h-5 w-5" />
  </button>
</template>

<script setup lang="ts">
import { MoonIcon, SunIcon } from '@heroicons/vue/24/outline'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
</script>
