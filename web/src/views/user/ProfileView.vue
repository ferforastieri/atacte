<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <AppHeader
      :show-logo="true"
      :show-navigation="true"
    />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <div class="space-y-6">
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
              
              <div v-if="authStore.user?.name">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                <p class="text-gray-900 dark:text-white">{{ authStore.user.name }}</p>
              </div>
              
              <div v-if="authStore.user?.phoneNumber">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
                <p class="text-gray-900 dark:text-white">{{ authStore.user.phoneNumber }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    authStore.userRole === 'ADMIN'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  ]"
                >
                  {{ authStore.userRole === 'ADMIN' ? 'Administrador' : 'Usuário' }}
                </span>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    authStore.user?.isActive !== false
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  ]"
                >
                  {{ authStore.user?.isActive !== false ? 'Ativo' : 'Inativo' }}
                </span>
              </div>
              
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

