<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-10 sm:px-6 lg:px-8">
    <div class="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary-500/10 blur-3xl" aria-hidden="true"></div>
    <div class="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-primary-500/10 blur-3xl" aria-hidden="true"></div>

    <div class="relative grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
      <section class="hidden lg:block">
        <div class="hero-card p-8 xl:p-10">
          <div class="hero-glow h-48 w-48"></div>
          <div class="relative">
            <div class="flex items-center gap-3">
              <Logo :size="40" :show-text="false" />
              <div>
                <p class="text-sm font-semibold text-white">Atacte</p>
                <p class="text-xs text-gray-400">Cofre self-hosted</p>
              </div>
            </div>

            <h2 class="mt-10 max-w-sm text-3xl font-semibold leading-tight text-white xl:text-4xl">
              Suas senhas, notas e códigos em um só lugar.
            </h2>
            <p class="mt-4 max-w-sm text-sm leading-relaxed text-gray-400">
              Você escolhe o servidor, mantém os dados e controla as atualizações.
            </p>

            <ul class="mt-8 space-y-3">
              <li v-for="item in highlights" :key="item" class="flex items-center gap-3 text-sm text-gray-300">
                <span class="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-500/15 text-primary-400">
                  <CheckIcon class="h-4 w-4" />
                </span>
                {{ item }}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section class="mx-auto w-full max-w-md">
        <div class="mb-6 flex items-center justify-center gap-2 lg:hidden">
          <Logo :size="34" :show-text="false" />
          <span class="text-lg font-bold text-ink">Atacte</span>
        </div>

        <div class="surface-card p-5 sm:p-8">
          <div class="mb-6">
            <div v-if="icon" class="icon-tile mb-4 h-11 w-11">
              <component :is="icon" class="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 class="text-2xl font-semibold tracking-tight text-ink">{{ title }}</h1>
            <p v-if="subtitle" class="mt-1.5 text-sm leading-relaxed text-ink-muted">{{ subtitle }}</p>
          </div>

          <slot />
        </div>

        <p class="mt-5 text-center text-xs text-ink-subtle">
          Atacte · gerenciador de senhas self-hosted
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { CheckIcon } from '@heroicons/vue/24/outline'
import Logo from '@/components/ui/Logo.vue'

withDefaults(defineProps<{
  title: string
  subtitle?: string
  icon?: Component
}>(), {
  subtitle: ''
})

const highlights = [
  'Senhas, notas e TOTP no mesmo cofre',
  'Sessões e auditoria sob seu controle',
  'Funciona na web, no desktop e no Android'
]
</script>
