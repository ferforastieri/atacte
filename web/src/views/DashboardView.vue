<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Header -->
    <AppHeader
      :show-logo="true"
      :show-navigation="true"
    />

    <div class="w-full px-3 sm:px-4 lg:px-5 py-8 pb-24 md:pb-8">
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
      <BaseCard class="mb-6" overflow-visible>
        <div class="flex flex-col gap-4" style="position: relative; overflow: visible;">
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
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-5">
        <BaseCard
          v-for="password in filteredPasswords"
          :key="password.id"
          padding="none"
          class="group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          @click="viewPassword(password)"
        >
          <div class="p-5 sm:p-6 min-h-[220px] flex flex-col">
            <div class="flex items-start gap-4">
              <div class="w-11 h-11 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center flex-shrink-0">
                <LockClosedIcon class="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{{ password.name }}</h3>
                  <HeartIcon v-if="password.isFavorite" class="h-5 w-5 text-red-500 flex-shrink-0" />
                </div>
                <p v-if="password.website" class="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">{{ password.website }}</p>
                <p v-if="password.username" class="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{{ password.username }}</p>
              </div>

              <span
                v-if="password.totpEnabled"
                class="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/40 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300"
              >
                <KeyIcon class="h-3.5 w-3.5" /> TOTP
              </span>
            </div>

            <div class="mt-4 min-h-6">
              <span v-if="password.folder" class="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 px-2.5 py-1 text-xs text-gray-600 dark:text-gray-300">
                <FolderIcon class="h-3.5 w-3.5" /> {{ password.folder }}
              </span>
            </div>

            <div class="mt-auto pt-5 flex items-center gap-2 border-t border-gray-100 dark:border-gray-700">
              <button
                @click.stop="toggleFavorite(password)"
                class="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                :class="password.isFavorite ? 'text-red-500' : 'text-gray-500 dark:text-gray-300'"
                title="Alternar favorita"
              >
                <HeartIcon class="h-5 w-5" />
              </button>
              <button
                v-if="password.username"
                @click.stop="copyUsername(password)"
                class="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Copiar usuário"
              >
                <UserIcon class="h-5 w-5" />
              </button>
              <button
                @click.stop="viewPassword(password)"
                class="h-10 px-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Ver
              </button>
              <button
                @click.stop="copyPassword(password)"
                class="h-10 flex-1 min-w-0 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors px-3"
              >
                <ClipboardIcon class="h-5 w-5" />
                <span class="truncate">Copiar senha</span>
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
  DocumentTextIcon,
  UserIcon
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
  }
}

const handleSearchClear = async () => {
  try {
    await passwordsStore.fetchPasswords({ 
      query: '',
      offset: 0
    })
  } catch (error) {
  }
}

const handleFolderFilter = async () => {
  try {
    await passwordsStore.fetchPasswords({ 
      folder: selectedFolder.value,
      offset: 0 
    })
  } catch (error) {
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
  }
}

const viewPassword = (password: PasswordEntry) => {
  selectedPassword.value = password
  showDetailModal.value = true
}

const copyPassword = async (password: PasswordEntry) => {
  const result = await copyToClipboard(password.password)
  if (result.success) {
  } else {
  }
}

const copyUsername = async (password: PasswordEntry) => {
  if (!password.username) return

  const result = await copyToClipboard(password.username)
  if (result.success) {
  } else {
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
    
  } catch (error) {
  }
}

const exportPasswords = async () => {
  try {
    
  } catch (error) {
  }
}

const goToTotpScreen = () => {
  router.push('/totp')
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
    }
  }
  
  if (authStore.isAuthenticated && !passwordsStore.statsLoaded) {
    try {
      await passwordsStore.loadCompleteStats()
    } catch (error) {
    }
  }
})
</script>
