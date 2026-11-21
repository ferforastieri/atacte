<template>
  <div class="flex min-h-screen items-center justify-center bg-canvas px-4 py-12">
    <div class="w-full max-w-lg text-center">
      <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-muted text-ink-subtle shadow-card ring-1 ring-line">
        <ExclamationTriangleIcon class="h-10 w-10" />
      </div>

      <p class="mt-8 font-mono text-6xl font-bold tracking-tight text-primary-700 dark:text-primary-400">404</p>
      <h1 class="mt-2 text-2xl font-semibold tracking-tight text-ink">Página não encontrada</h1>
      <p class="mt-2 text-sm leading-relaxed text-ink-muted">
        A página que você está procurando não existe ou foi movida.
      </p>

      <div class="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
        <BaseButton variant="secondary" @click="$router.go(-1)">
          <ArrowLeftIcon class="mr-2 h-4 w-4" />
          Voltar
        </BaseButton>

        <BaseButton @click="$router.push('/dashboard')">
          <HomeIcon class="mr-2 h-4 w-4" />
          Dashboard
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeftIcon, ExclamationTriangleIcon, HomeIcon } from '@heroicons/vue/24/outline'
import { BaseButton } from '@/components/ui'
</script>
