<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <AppHeader
      :show-logo="true"
      :show-navigation="true"
    />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <div class="space-y-6">
        <BaseCard>
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div class="flex-shrink-0">
              <div v-if="authStore.user?.profilePicture" class="w-24 h-24 rounded-full overflow-hidden border-4 border-primary-500 dark:border-primary-400 shadow-lg">
                <img 
                  :src="authStore.user.profilePicture" 
                  :alt="authStore.user?.name || authStore.userEmail" 
                  class="w-full h-full object-cover"
                />
              </div>
              <div v-else class="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center border-4 border-primary-500 dark:border-primary-400 shadow-lg">
                <span class="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {{ userInitials }}
                </span>
              </div>
            </div>
            
            <div class="flex-1 min-w-0">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {{ authStore.user?.name || authStore.userEmail.split('@')[0] }}
              </h1>
              <p class="text-gray-600 dark:text-gray-400 mb-3">{{ authStore.userEmail }}</p>
              
              <div class="flex flex-wrap gap-2">
                <span
                  :class="[
                    'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                    authStore.userRole === 'ADMIN'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  ]"
                >
                  {{ authStore.userRole === 'ADMIN' ? 'Administrador' : 'Usuário' }}
                </span>
                
                <span
                  :class="[
                    'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                    authStore.user?.isActive !== false
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  ]"
                >
                  {{ authStore.user?.isActive !== false ? 'Ativo' : 'Inativo' }}
                </span>
              </div>
            </div>
          </div>
        </BaseCard>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BaseCard>
            <div class="space-y-4">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Informações Pessoais</h2>
              
              <div class="space-y-4">
                <div v-if="authStore.user?.name">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                  <p class="text-gray-900 dark:text-white">{{ authStore.user.name }}</p>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <p class="text-gray-900 dark:text-white break-all">{{ authStore.userEmail }}</p>
                </div>
                
                <div v-if="authStore.user?.phoneNumber">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
                  <p class="text-gray-900 dark:text-white">{{ authStore.user.phoneNumber }}</p>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID do Usuário</label>
                  <p class="text-gray-900 dark:text-white font-mono text-sm break-all">{{ authStore.userId }}</p>
                </div>
              </div>
            </div>
          </BaseCard>

          <BaseCard>
            <div class="space-y-4">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Informações da Conta</h2>
              
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Criação</label>
                  <p class="text-gray-900 dark:text-white">{{ formatDate(authStore.user?.createdAt) }}</p>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Última Atualização</label>
                  <p class="text-gray-900 dark:text-white">{{ formatDate(authStore.user?.updatedAt) }}</p>
                </div>
                
                <div v-if="authStore.user?.lastLogin">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Último Login</label>
                  <p class="text-gray-900 dark:text-white">{{ formatDate(authStore.user.lastLogin) }}</p>
                </div>
              </div>
            </div>
          </BaseCard>
        </div>

        <BaseCard>
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Estatísticas</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">{{ passwordsStore.totalCount }}</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">Total de Senhas</p>
              </div>
              
              <div class="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p class="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">{{ passwordsStore.allFavoritePasswords.length }}</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">Favoritas</p>
              </div>
              
              <div class="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p class="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{{ totpEnabledCount }}</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">Com TOTP</p>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePasswordsStore } from '@/stores/passwords'
import { AppHeader, BaseCard } from '@/components/ui'

const authStore = useAuthStore()
const passwordsStore = usePasswordsStore()

const totpEnabledCount = computed(() => {
  return passwordsStore.allTotpEnabledPasswords.length
})

const userInitials = computed(() => {
  if (authStore.user?.name) {
    const names = authStore.user.name.split(' ')
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase()
    }
    return authStore.user.name.substring(0, 2).toUpperCase()
  }
  return authStore.userEmail.charAt(0).toUpperCase()
})

const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  await authStore.refreshUser()
  await passwordsStore.fetchPasswords()
  if (!passwordsStore.statsLoaded) {
    await passwordsStore.loadCompleteStats()
  }
})
</script>

