<template>
  <div class="min-h-screen bg-canvas">
    <AppHeader :show-logo="true" :show-navigation="true" />

    <main class="mx-auto w-full max-w-[1600px] px-4 pb-24 pt-6 sm:px-6 sm:pt-8 md:pb-10 lg:px-10">
      <section class="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-700 dark:text-primary-400">Cofre</p>
          <h1 class="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Senhas</h1>
          <p class="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-muted">
            Guarde, encontre e copie suas credenciais sem sair do cofre.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <BaseButton
            variant="secondary"
            :loading="isExporting"
            :disabled="isExporting"
            @click="exportPasswords"
          >
            <ArrowDownTrayIcon v-if="!isExporting" class="mr-2 h-4 w-4" />
            Exportar
          </BaseButton>

          <BaseButton variant="secondary" @click="showImportModal = true">
            <ArrowUpTrayIcon class="mr-2 h-4 w-4" />
            Importar
          </BaseButton>

          <BaseButton @click="showCreateModal = true">
            <PlusIcon class="mr-2 h-4 w-4" />
            Nova Senha
          </BaseButton>
        </div>
      </section>

      <section class="mb-5 grid grid-cols-2 gap-3 sm:mb-6 lg:grid-cols-4">
        <div class="surface-card p-4">
          <div class="flex items-center gap-3">
            <div class="icon-tile">
              <LockClosedIcon class="h-5 w-5" />
            </div>
            <div class="min-w-0">
              <p class="text-[11px] leading-tight text-ink-muted">Total de Senhas</p>
              <div v-if="isInitialLoading" class="skeleton mt-1 h-6 w-12"></div>
              <p v-else class="text-xl font-semibold text-ink">{{ passwordsStore.totalCount }}</p>
            </div>
          </div>
        </div>

        <div class="surface-card p-4">
          <div class="flex items-center gap-3">
            <div class="icon-tile">
              <HeartIcon class="h-5 w-5" />
            </div>
            <div class="min-w-0">
              <p class="text-[11px] leading-tight text-ink-muted">Favoritas</p>
              <div v-if="isInitialLoading" class="skeleton mt-1 h-6 w-12"></div>
              <p v-else class="text-xl font-semibold text-ink">{{ passwordsStore.favoriteCount }}</p>
            </div>
          </div>
        </div>

        <div class="surface-card p-4">
          <div class="flex items-center gap-3">
            <div class="icon-tile">
              <FolderIcon class="h-5 w-5" />
            </div>
            <div class="min-w-0">
              <p class="text-[11px] leading-tight text-ink-muted">Pastas</p>
              <div v-if="isInitialLoading" class="skeleton mt-1 h-6 w-12"></div>
              <p v-else class="text-xl font-semibold text-ink">{{ passwordsStore.folders.length }}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          class="surface-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          @click="goToTotpScreen"
        >
          <div class="flex items-center gap-3">
            <div class="icon-tile">
              <KeyIcon class="h-5 w-5" />
            </div>
            <div class="min-w-0">
              <p class="text-[11px] leading-tight text-ink-muted">Com TOTP</p>
              <div v-if="isInitialLoading" class="skeleton mt-1 h-6 w-12"></div>
              <p v-else class="text-xl font-semibold text-ink">{{ totpEnabledCount }}</p>
            </div>
          </div>
        </button>
      </section>

      <section class="surface-card mb-5 p-4 sm:mb-6">
        <div class="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div class="min-w-0 flex-1">
            <SearchInput
              v-model="searchQuery"
              placeholder="Buscar senhas..."
              @search="handleSearch"
            />
          </div>

          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <BaseSelect
              v-model="selectedFolder"
              class="w-full sm:w-48"
              :disabled="isFetching"
              @update:modelValue="handleFolderFilter"
            >
              <option value="">Todas as pastas</option>
              <option v-for="folder in passwordsStore.folders" :key="folder" :value="folder">
                {{ folder }}
              </option>
            </BaseSelect>

            <BaseButton
              variant="ghost"
              :disabled="isFetching"
              :class="{ 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300': showOnlyFavorites }"
              class="sm:w-auto"
              @click="toggleFavorites"
            >
              <HeartIcon class="mr-1.5 h-4 w-4" :class="{ 'fill-current': showOnlyFavorites }" />
              {{ showOnlyFavorites ? 'Todas' : 'Favoritas' }}
            </BaseButton>
          </div>
        </div>
      </section>

      <div v-if="isInitialLoading" class="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SkeletonCard v-for="index in 6" :key="index" show-secret />
      </div>

      <div
        v-else-if="filteredPasswords.length > 0"
        class="grid grid-cols-1 items-start gap-4 transition-opacity duration-200 md:grid-cols-2 xl:grid-cols-3"
        :class="{ 'pointer-events-none opacity-60': isFetching }"
      >
        <BaseCard
          v-for="password in filteredPasswords"
          :key="password.id"
          padding="none"
          hover
          class="group w-full cursor-pointer self-start"
          :class="{ 'ring-2 ring-primary-500 ring-offset-2 ring-offset-canvas': recentlyCreatedId === password.id }"
          @click="viewPassword(password)"
        >
          <div class="flex min-h-[232px] flex-col p-5 sm:p-6">
            <div class="flex items-start gap-4">
              <div class="icon-tile h-11 w-11">
                <LockClosedIcon class="h-5 w-5" />
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="truncate text-lg font-semibold text-ink">{{ password.name }}</h3>
                  <span
                    v-if="recentlyCreatedId === password.id"
                    class="pill bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                  >
                    Nova
                  </span>
                  <HeartIcon v-if="password.isFavorite" class="h-4 w-4 flex-shrink-0 text-danger-500" />
                </div>
                <p v-if="password.website" class="mt-1 truncate text-sm text-ink-muted">{{ password.website }}</p>
                <p v-if="password.username" class="mt-0.5 truncate text-sm text-ink-subtle">{{ password.username }}</p>
              </div>

              <span v-if="password.totpEnabled" class="pill-info flex-shrink-0">
                <KeyIcon class="h-3.5 w-3.5" /> TOTP
              </span>
            </div>

            <div class="mt-4 flex min-h-6 flex-wrap items-center gap-2">
              <span v-if="password.folder" class="pill-neutral">
                <FolderIcon class="h-3.5 w-3.5" /> {{ password.folder }}
              </span>
              <span class="pill-neutral font-mono tracking-[0.2em] text-ink-subtle">••••••••</span>
            </div>

            <div v-if="password.totpEnabled" class="mt-4" @click.stop>
              <TotpCode :secret="totpSecrets[password.id]" />
            </div>

            <div class="mt-auto flex items-center gap-2 border-t border-line pt-4">
              <button
                type="button"
                class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-surface-muted transition-colors hover:bg-danger-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-danger-900/20"
                :class="password.isFavorite ? 'text-danger-500' : 'text-ink-muted'"
                :disabled="favoritePendingId === password.id"
                title="Alternar favorita"
                aria-label="Alternar favorita"
                @click.stop="toggleFavorite(password)"
              >
                <span
                  v-if="favoritePendingId === password.id"
                  class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                ></span>
                <HeartIcon v-else class="h-5 w-5" :class="{ 'fill-current': password.isFavorite }" />
              </button>

              <button
                v-if="password.username"
                type="button"
                class="flex h-10 flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-surface-muted px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-line/60 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50"
                :disabled="copyingUsernameId === password.id"
                title="Copiar usuário"
                @click.stop="copyUsername(password)"
              >
                <span
                  v-if="copyingUsernameId === password.id"
                  class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                ></span>
                <UserIcon v-else class="h-5 w-5" />
                <span class="hidden sm:inline">Usuário</span>
              </button>

              <BaseButton
                class="min-w-0 flex-1"
                :loading="copyingPasswordId === password.id"
                :disabled="copyingPasswordId !== null && copyingPasswordId !== password.id"
                @click.stop="copyPassword(password)"
              >
                <ClipboardIcon v-if="copyingPasswordId !== password.id" class="mr-2 h-4 w-4" />
                <span class="truncate">Copiar senha</span>
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </div>

      <EmptyState
        v-else
        :icon="LockClosedIcon"
        :title="passwordsStore.totalCount === 0 ? 'Nenhuma senha ainda' : 'Nenhuma senha encontrada'"
        :description="passwordsStore.totalCount === 0 ? 'Comece criando sua primeira senha.' : 'Tente ajustar os filtros de busca.'"
      >
        <BaseButton @click="showCreateModal = true">
          <PlusIcon class="mr-2 h-4 w-4" />
          Nova Senha
        </BaseButton>
      </EmptyState>

      <Pagination
        v-if="passwordsStore.pagination.total > passwordsStore.pagination.limit"
        class="mt-6"
        :current-page="passwordsStore.pagination.currentPage"
        :total-pages="totalPages"
        :total="passwordsStore.pagination.total"
        :limit="passwordsStore.pagination.limit"
        :busy="isFetching"
        @previous="previousPage"
        @next="nextPage"
        @go-to-page="goToPage"
      />
    </main>

    <CreatePasswordModal
      :show="showCreateModal"
      @close="showCreateModal = false"
      @created="handlePasswordCreated"
    />

    <ImportPasswordModal
      :show="showImportModal"
      @close="showImportModal = false"
      @imported="refreshPasswords"
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
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ClipboardIcon,
  FolderIcon,
  HeartIcon,
  KeyIcon,
  LockClosedIcon,
  PlusIcon,
  UserIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { usePasswordsStore } from '@/stores/passwords'
import {
  AppHeader,
  BaseButton,
  BaseCard,
  BaseSelect,
  EmptyState,
  Pagination,
  SearchInput,
  SkeletonCard,
  TotpCode
} from '@/components/ui'
import { type PasswordEntry } from '@/api/passwords'
import { copyToClipboard } from '@/utils/clipboard'
import { useToast } from '@/hooks/useToast'
import CreatePasswordModal from '@/components/passwords/CreatePasswordModal.vue'
import ImportPasswordModal from '@/components/passwords/ImportPasswordModal.vue'
import PasswordDetailModal from '@/components/passwords/PasswordDetailModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const passwordsStore = usePasswordsStore()
const toast = useToast()

const showCreateModal = ref(false)
const showImportModal = ref(false)
const showDetailModal = ref(false)
const selectedPassword = ref<PasswordEntry | null>(null)
const searchQuery = ref(passwordsStore.searchFilters.query || '')
const selectedFolder = ref(passwordsStore.searchFilters.folder || '')
const showOnlyFavorites = ref(passwordsStore.searchFilters.isFavorite === true)
const isInitialLoading = ref(true)
const isExporting = ref(false)
const copyingPasswordId = ref<string | null>(null)
const copyingUsernameId = ref<string | null>(null)
const favoritePendingId = ref<string | null>(null)
const totpSecrets = ref<Record<string, string>>({})
const recentlyCreatedId = ref<string | null>(null)
let recentlyCreatedTimeout: ReturnType<typeof setTimeout> | null = null

const isFetching = computed(() => passwordsStore.isLoading)
const filteredPasswords = computed(() => passwordsStore.searchResults)
const totpEnabledCount = computed(() => passwordsStore.totpCount)
const totalPages = computed(() => Math.max(1, Math.ceil(passwordsStore.pagination.total / passwordsStore.pagination.limit)))

watch(
  () => filteredPasswords.value.filter(password => password.totpEnabled).map(password => password.id),
  async (passwordIds) => {
    await Promise.all(passwordIds.map(async (passwordId) => {
      if (totpSecrets.value[passwordId]) return
      try {
        const response = await passwordsStore.getTotpSecret(passwordId)
        if (response?.secret) {
          totpSecrets.value[passwordId] = response.secret
        }
      } catch {
        // A card without a readable secret still shows the masked code.
      }
    }))
  },
  { immediate: true }
)

const refreshPasswords = async () => {
  try {
    await passwordsStore.fetchPasswords()
    await passwordsStore.loadCompleteStats()
  } catch {
    toast.error('Não foi possível atualizar a lista de senhas.')
  }
}

const handleSearch = async (query: string) => {
  try {
    await passwordsStore.fetchPasswords({ query, offset: 0 })
  } catch {
    toast.error('Não foi possível buscar as senhas.')
  }
}

const handleFolderFilter = async () => {
  try {
    await passwordsStore.fetchPasswords({ folder: selectedFolder.value, offset: 0 })
  } catch {
    toast.error('Não foi possível filtrar por pasta.')
  }
}

const toggleFavorites = async () => {
  showOnlyFavorites.value = !showOnlyFavorites.value
  try {
    await passwordsStore.fetchPasswords({ isFavorite: showOnlyFavorites.value, offset: 0 })
  } catch {
    toast.error('Não foi possível filtrar as favoritas.')
  }
}

const viewPassword = (password: PasswordEntry) => {
  selectedPassword.value = password
  showDetailModal.value = true
}

const copyPassword = async (password: PasswordEntry) => {
  if (copyingPasswordId.value) return
  copyingPasswordId.value = password.id
  try {
    const result = await copyToClipboard(password.password)
    if (result.success) {
      toast.success('Senha copiada.')
    } else {
      toast.error('Não foi possível copiar a senha.')
    }
  } finally {
    copyingPasswordId.value = null
  }
}

const copyUsername = async (password: PasswordEntry) => {
  if (!password.username || copyingUsernameId.value) return
  copyingUsernameId.value = password.id
  try {
    const result = await copyToClipboard(password.username)
    if (result.success) {
      toast.success('Usuário copiado.')
    } else {
      toast.error('Não foi possível copiar o usuário.')
    }
  } finally {
    copyingUsernameId.value = null
  }
}

const toggleFavorite = async (password: PasswordEntry) => {
  if (favoritePendingId.value) return
  favoritePendingId.value = password.id
  try {
    const newFavoriteStatus = !password.isFavorite
    await passwordsStore.updatePassword(password.id, {
      id: password.id,
      isFavorite: newFavoriteStatus
    })

    const index = passwordsStore.passwords.findIndex(p => p.id === password.id)
    if (index !== -1) {
      passwordsStore.passwords[index]!.isFavorite = newFavoriteStatus
    }

    if (passwordsStore.statsLoaded) {
      await passwordsStore.loadCompleteStats()
    }
    if (showOnlyFavorites.value) {
      await passwordsStore.fetchPasswords()
    }
  } catch {
    toast.error('Não foi possível atualizar a favorita.')
  } finally {
    favoritePendingId.value = null
  }
}

const exportPasswords = async () => {
  if (isExporting.value) return
  isExporting.value = true
  try {
    await passwordsStore.exportToBitwarden()
    toast.success('Exportação gerada. Guarde o arquivo em local protegido.')
  } catch {
    toast.error('Não foi possível exportar as senhas.')
  } finally {
    isExporting.value = false
  }
}

const goToTotpScreen = () => {
  router.push('/totp')
}

const handlePasswordCreated = async (createdPassword: PasswordEntry) => {
  showCreateModal.value = false

  searchQuery.value = ''
  selectedFolder.value = ''
  showOnlyFavorites.value = false
  passwordsStore.clearSearch()

  try {
    await passwordsStore.fetchPasswords()

    const index = passwordsStore.passwords.findIndex(p => p.id === createdPassword.id)
    if (index !== -1) {
      const [entry] = passwordsStore.passwords.splice(index, 1)
      if (entry) {
        passwordsStore.passwords.unshift(entry)
      }
    } else {
      passwordsStore.passwords.unshift(createdPassword)
    }

    await passwordsStore.loadCompleteStats()
  } catch {
    toast.error('A senha foi criada, mas a lista não atualizou.')
  }

  recentlyCreatedId.value = createdPassword.id
  if (recentlyCreatedTimeout) {
    clearTimeout(recentlyCreatedTimeout)
  }
  recentlyCreatedTimeout = setTimeout(() => {
    recentlyCreatedId.value = null
  }, 8000)

  window.scrollTo({ top: 0, behavior: 'smooth' })
  toast.success(`A senha "${createdPassword.name}" foi criada e está no topo da lista.`)
}

const handlePasswordUpdated = () => {
  showDetailModal.value = false
  refreshPasswords()
}

const handlePasswordDeleted = () => {
  showDetailModal.value = false
  refreshPasswords()
}

const goToPage = (page: number) => {
  passwordsStore.fetchPasswords({ offset: (page - 1) * passwordsStore.pagination.limit })
}

const nextPage = () => {
  if (passwordsStore.pagination.currentPage < totalPages.value) {
    goToPage(passwordsStore.pagination.currentPage + 1)
  }
}

const previousPage = () => {
  if (passwordsStore.pagination.currentPage > 1) {
    goToPage(passwordsStore.pagination.currentPage - 1)
  }
}

onMounted(async () => {
  try {
    if (authStore.isAuthenticated) {
      // The TOTP screen reuses the same store with a totpEnabled filter.
      passwordsStore.setSearchFilters({ totpEnabled: undefined })
      await Promise.all([
        passwordsStore.fetchPasswords({
          query: searchQuery.value,
          folder: selectedFolder.value,
          isFavorite: showOnlyFavorites.value || undefined,
          offset: 0
        }),
        passwordsStore.fetchFolders(),
        passwordsStore.statsLoaded ? Promise.resolve() : passwordsStore.loadCompleteStats()
      ])
    }
  } catch {
    toast.error('Não foi possível carregar as senhas.')
  } finally {
    isInitialLoading.value = false
  }
})

onUnmounted(() => {
  if (recentlyCreatedTimeout) {
    clearTimeout(recentlyCreatedTimeout)
  }
})
</script>
