<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <div class="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-gray-100">
        <ExclamationTriangleIcon class="h-12 w-12 text-gray-400" />
      </div>
      
      <h1 class="mt-6 text-6xl font-bold text-gray-900">404</h1>
      <h2 class="mt-2 text-2xl font-semibold text-gray-700">Página não encontrada</h2>
      
      <p class="mt-4 text-gray-500">
        A página que você está procurando não existe ou foi movida.
      </p>
      
      <div class="mt-8 flex justify-center space-x-4">
        <BaseButton
          variant="primary"
          @click="$router.go(-1)"
        >
          <ArrowLeftIcon class="w-4 h-4 mr-2" />
          Voltar
        </BaseButton>
        
        <BaseButton
          variant="secondary"
          @click="$router.push('/dashboard')"
        >
          <HomeIcon class="w-4 h-4 mr-2" />
          Dashboard
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ExclamationTriangleIcon, ArrowLeftIcon, HomeIcon } from '@heroicons/vue/24/outline'
import { BaseButton } from '@/components/ui'
</script>

