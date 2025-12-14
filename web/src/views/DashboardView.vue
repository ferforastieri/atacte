<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Header -->
    <AppHeader
      :show-logo="true"
      :show-navigation="true"
    />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <!-- Stats Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <BaseCard class="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <LockClosedIcon class="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div class="ml-3 sm:ml-4">
              <p class="text-blue-100 text-xs sm:text-sm">Total de Senhas</p>
              <p class="text-lg sm:text-2xl font-bold">{{ passwordsStore.totalCount }}</p>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <HeartIcon class="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div class="ml-3 sm:ml-4">
              <p class="text-green-100 text-xs sm:text-sm">Favoritas</p>
              <p class="text-lg sm:text-2xl font-bold">{{ passwordsStore.allFavoritePasswords.length }}</p>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <FolderIcon class="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div class="ml-3 sm:ml-4">
              <p class="text-purple-100 text-xs sm:text-sm">Pastas</p>
              <p class="text-lg sm:text-2xl font-bold">{{ passwordsStore.folders.length }}</p>
            </div>
          </div>
        </BaseCard>

        <BaseCard 
          class="bg-gradient-to-r from-orange-500 to-orange-600 text-white cursor-pointer hover:from-orange-600 hover:to-orange-700 transition-all"
          @click="goToTotpScreen"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <KeyIcon class="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div class="ml-3 sm:ml-4">
              <p class="text-orange-100 text-xs sm:text-sm">Com TOTP</p>
              <p class="text-lg sm:text-2xl font-bold">{{ totpEnabledCount }}</p>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Quick Actions -->
      <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
        <BaseButton
          variant="primary"
          @click="showCreateModal = true"
          class="w-full sm:w-auto"
        >
          <PlusIcon class="w-4 h-4 mr-2" />
          Nova Senha
        </BaseButton>

        <div class="flex gap-3 sm:gap-4">
          <BaseButton
            variant="secondary"
            @click="showImportModal = true"
            class="flex-1 sm:flex-none"
          >
            <ArrowUpTrayIcon class="w-4 h-4 mr-2" />
            <span class="hidden sm:inline">Importar</span>
            <span class="sm:hidden">Importar</span>
          </BaseButton>

          <BaseButton
            variant="secondary"
            @click="exportPasswords"
            class="flex-1 sm:flex-none"
          >
            <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
            <span class="hidden sm:inline">Exportar</span>
            <span class="sm:hidden">Exportar</span>
          </BaseButton>
        </div>
      </div>

      <!-- Search and Filters -->
      <BaseCard class="mb-6">
        <div class="flex flex-col gap-4">
          <div class="flex-1">
            <SearchInput
              v-model="searchQuery"
              placeholder="Buscar senhas..."
              :debounce-ms="300"
              :min-length="2"
              @search="handleSearch"
              @clear="handleSearchClear"
            />
          </div>
          
          <div class="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <BaseSelect
              v-model="selectedFolder"
              @update:modelValue="handleFolderFilter"
              class="w-full sm:w-48"
            >
              <option value="">Todas as pastas</option>
              <option v-for="folder in passwordsStore.folders" :key="folder" :value="folder">
                {{ folder }}
              </option>
            </BaseSelect>

            <BaseButton
              variant="ghost"
              @click="toggleFavorites"
              :class="{ 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300': showOnlyFavorites }"
              class="w-full sm:w-auto"
            >
              <HeartIcon class="w-4 h-4 mr-1" />
              {{ showOnlyFavorites ? 'Todas' : 'Favoritas' }}
            </BaseButton>
          </div>
        </div>
      </BaseCard>

      <!-- Passwords List -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <BaseCard
          v-for="password in filteredPasswords"
          :key="password.id"
          class="hover:shadow-lg transition-shadow cursor-pointer"
          @click="viewPassword(password)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-2">
                <h3 class="font-semibold text-gray-900 dark:text-gray-100 truncate">{{ password.name }}</h3>
                <div class="flex space-x-1">
                  <HeartIcon
                    v-if="password.isFavorite"
                    class="h-4 w-4 text-red-500 flex-shrink-0"
                  />
                  <KeyIcon
                    v-if="password.totpEnabled"
                    class="h-4 w-4 text-blue-500 flex-shrink-0"
                  />
                </div>
              </div>
              
              <p v-if="password.website" class="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                {{ password.website }}
              </p>
              
              <p v-if="password.username" class="text-sm text-gray-500 dark:text-gray-500 mt-1 truncate">
                @{{ password.username }}
              </p>
              
              <p v-if="password.folder" class="text-xs text-gray-400 dark:text-gray-500 mt-2 truncate">
                📁 {{ password.folder }}
              </p>
            </div>
            
            <div class="flex flex-col space-y-1 ml-2">
              <button
                @click.stop="copyPassword(password)"
                class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                title="Copiar senha"
              >
                <ClipboardIcon class="h-4 w-4" />
              </button>
              
              <button
                @click.stop="toggleFavorite(password)"
                class="text-gray-400 dark:text-gray-500 hover:text-red-500 p-1"
                :class="{ 'text-red-500': password.isFavorite }"
                title="Marcar como favorita"
              >
                <HeartIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Paginação -->
      <div v-if="passwordsStore.pagination.total > passwordsStore.pagination.limit" class="mt-6 sm:mt-8">
        <div class="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 gap-4">
          <div class="text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left">
            Mostrando {{ passwordsStore.pagination.offset + 1 }} a {{ Math.min(passwordsStore.pagination.offset + passwordsStore.pagination.limit, passwordsStore.pagination.total) }} de {{ passwordsStore.pagination.total }} senhas
          </div>
          <div class="flex space-x-2">
            <BaseButton
              variant="ghost"
              @click="passwordsStore.fetchPasswords({ offset: passwordsStore.pagination.offset - passwordsStore.pagination.limit })"
              :disabled="passwordsStore.pagination.offset === 0"
            >
              ← Anterior
            </BaseButton>
            <BaseButton
              variant="ghost"
              @click="passwordsStore.fetchPasswords({ offset: passwordsStore.pagination.offset + passwordsStore.pagination.limit })"
              :disabled="passwordsStore.pagination.offset + passwordsStore.pagination.limit >= passwordsStore.pagination.total"
            >
              Próximo →
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredPasswords.length === 0" class="text-center py-12">
        <LockClosedIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Nenhuma senha encontrada</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ passwordsStore.totalCount === 0 ? 'Comece criando sua primeira senha.' : 'Tente ajustar os filtros de busca.' }}
        </p>
        <div class="mt-6">
          <BaseButton
            variant="primary"
            @click="showCreateModal = true"
          >
            <PlusIcon class="w-4 h-4 mr-2" />
            Nova Senha
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <CreatePasswordModal
      :show="showCreateModal"
      @close="showCreateModal = false"
      @created="handlePasswordCreated"
    />

    <ImportPasswordModal
      :show="showImportModal"
      @close="showImportModal = false"
    />

    <PasswordDetailModal
      :show="showDetailModal"
      :password="selectedPassword"
      @close="showDetailModal = false"
      @updated="handlePasswordUpdated"
      @deleted="handlePasswordDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/hooks/useToast'
import {
  LockClosedIcon,
  ArrowPathIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  HeartIcon,
  FolderIcon,
  KeyIcon,
  ClipboardIcon,
  DocumentTextIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { usePasswordsStore } from '@/stores/passwords'
import { BaseButton, BaseCard, SearchInput, AppHeader, BaseSelect } from '@/components/ui'
import { type PasswordEntry } from '@/api/passwords'
import { copyToClipboard } from '@/utils/clipboard'


import CreatePasswordModal from '@/components/passwords/CreatePasswordModal.vue'
import ImportPasswordModal from '@/components/passwords/ImportPasswordModal.vue'
import PasswordDetailModal from '@/components/passwords/PasswordDetailModal.vue'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const passwordsStore = usePasswordsStore()


const showCreateModal = ref(false)
const showImportModal = ref(false)
const showDetailModal = ref(false)
const selectedPassword = ref<PasswordEntry | null>(null)
const searchQuery = ref('')
const selectedFolder = ref('')
const showOnlyFavorites = ref(false)
const isRefreshing = ref(false)


const totpEnabledCount = computed(() => {
  return passwordsStore.allTotpEnabledPasswords.length
})


const filteredPasswords = computed(() => passwordsStore.searchResults)


const refreshPasswords = async () => {
  isRefreshing.value = true
  try {
    await passwordsStore.fetchPasswords()
    await passwordsStore.loadCompleteStats() 
    
  } catch (error) {
    toast.error('Erro ao atualizar senhas')
  } finally {
    isRefreshing.value = false
  }
}


const handleSearch = async (query: string) => {
  try {
    await passwordsStore.fetchPasswords({ 
      query: query,
      offset: 0 
    })
  } catch (error) {
    toast.error('Erro ao buscar senhas')
  }
}

const handleSearchClear = async () => {
  try {
    await passwordsStore.fetchPasswords({ 
      query: '',
      offset: 0
    })
  } catch (error) {
    toast.error('Erro ao limpar busca')
  }
}

const handleFolderFilter = async () => {
  try {
    await passwordsStore.fetchPasswords({ 
      folder: selectedFolder.value,
      offset: 0 
    })
  } catch (error) {
    toast.error('Erro ao filtrar senhas')
  }
}

const toggleFavorites = async () => {
  showOnlyFavorites.value = !showOnlyFavorites.value
  try {
    await passwordsStore.fetchPasswords({ 
      isFavorite: showOnlyFavorites.value,
      offset: 0 
    })
  } catch (error) {
    toast.error('Erro ao filtrar favoritos')
  }
}

const viewPassword = (password: PasswordEntry) => {
  selectedPassword.value = password
  showDetailModal.value = true
}

const copyPassword = async (password: PasswordEntry) => {
  const result = await copyToClipboard(password.password)
  if (result.success) {
    toast.success(result.message)
  } else {
    toast.error(result.message)
  }
}

const toggleFavorite = async (password: PasswordEntry) => {
  try {
    const newFavoriteStatus = !password.isFavorite
    await passwordsStore.updatePassword(password.id, {
      id: password.id,
      isFavorite: newFavoriteStatus
    })
    
    
    const index = passwordsStore.passwords.findIndex(p => p.id === password.id)
    if (index !== -1) {
      passwordsStore.passwords[index].isFavorite = newFavoriteStatus
    }
    
    
    if (passwordsStore.statsLoaded) {
      await passwordsStore.loadCompleteStats()
    }
    
    toast.success(newFavoriteStatus ? 'Adicionado aos favoritos' : 'Removido dos favoritos')
  } catch (error) {
    console.error('Erro ao atualizar favorito:', error)
    toast.error('Erro ao atualizar favorito')
  }
}

const exportPasswords = async () => {
  try {
    
    toast.success('Exportação iniciada!')
  } catch (error) {
    toast.error('Erro ao exportar senhas')
  }
}

const goToTotpScreen = () => {
  router.push('/totp')
}

const goToLocation = () => {
  router.push('/location')
}

const goToSecureNotes = () => {
  router.push('/secure-notes')
}

const handlePasswordCreated = () => {
  showCreateModal.value = false
  refreshPasswords()
}

const handlePasswordUpdated = () => {
  showDetailModal.value = false
  refreshPasswords()
}

const handlePasswordDeleted = () => {
  showDetailModal.value = false
  refreshPasswords()
}




onMounted(async () => {
  
  if (passwordsStore.passwords.length === 0 && authStore.isAuthenticated) {
    try {
      await passwordsStore.fetchPasswords()
      await passwordsStore.fetchFolders()
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    }
  }
  
  if (authStore.isAuthenticated && !passwordsStore.statsLoaded) {
    try {
      await passwordsStore.loadCompleteStats()
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }
})
</script>
