<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Header -->
    <AppHeader
      :show-logo="true"
      :show-back-button="true"
      :show-navigation="true"
      title="Perfil"
    />

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Profile Info -->
        <div class="lg:col-span-2 space-y-6">
          <BaseCard>
            <div class="space-y-4">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Informações do Perfil</h2>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <p class="text-gray-900 dark:text-white">{{ authStore.userEmail }}</p>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID do Usuário</label>
                  <p class="text-gray-900 dark:text-white font-mono text-sm">{{ authStore.userId }}</p>
                </div>
              </div>
            </div>
          </BaseCard>

          <BaseCard>
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Estatísticas</h3>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">{{ passwordsStore.totalCount }}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Total de Senhas</p>
                </div>
                
                <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ passwordsStore.allFavoritePasswords.length }}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Favoritas</p>
                </div>
                
                <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ totpEnabledCount }}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Com TOTP</p>
                </div>
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <BaseCard>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ações</h3>
            <div class="space-y-2">
              <BaseButton
                variant="primary"
                class="w-full justify-start"
                @click="router.push('/settings')"
              >
                <CogIcon class="w-4 h-4 mr-2" />
                Configurações
              </BaseButton>
              
              <BaseButton
                variant="secondary"
                class="w-full justify-start"
                @click="router.push('/audit')"
              >
                <DocumentTextIcon class="w-4 h-4 mr-2" />
                Logs de Auditoria
              </BaseButton>
              
              <BaseButton
                variant="secondary"
                class="w-full justify-start"
                @click="router.push('/sessions')"
              >
                <ComputerDesktopIcon class="w-4 h-4 mr-2" />
                Sessões Ativas
              </BaseButton>
            </div>
          </BaseCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeftIcon, CogIcon, DocumentTextIcon, ComputerDesktopIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { usePasswordsStore } from '@/stores/passwords'
import { AppHeader, BaseButton, BaseCard } from '@/components/ui'

const router = useRouter()
const authStore = useAuthStore()
const passwordsStore = usePasswordsStore()

const totpEnabledCount = computed(() => {
  return passwordsStore.allTotpEnabledPasswords.length
})

onMounted(async () => {
  await passwordsStore.fetchPasswords()
  if (!passwordsStore.statsLoaded) {
    await passwordsStore.loadCompleteStats()
  }
})
</script>

