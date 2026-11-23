<template>
  <div class="min-h-screen bg-canvas">
    <AppHeader :show-logo="true" :show-navigation="true" />

    <main class="mx-auto w-full max-w-[1600px] px-4 pb-24 pt-6 sm:px-6 sm:pt-8 md:pb-10 lg:px-10">
      <section class="mb-6">
        <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-700 dark:text-primary-400">Segurança</p>
        <h1 class="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Auditoria</h1>
        <p class="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-muted">
          Acessos, alterações e eventos do cofre em ordem cronológica.
        </p>
      </section>

      <section class="mb-5 border-b border-line pb-5">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_0.8fr_0.8fr]">
          <BaseInput
            v-model="filters.query"
            type="search"
            placeholder="Buscar logs..."
            :left-icon="MagnifyingGlassIcon"
          />

          <BaseSelect
            v-if="authStore.isAdmin"
            v-model="filters.userId"
            placeholder="Todos os usuários"
          >
            <option value="">Todos os usuários</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.email }}
            </option>
          </BaseSelect>

          <BaseSelect
            v-model="filters.action"
            placeholder="Todas as ações"
          >
            <option value="">Todas as ações</option>
            <option value="LOGIN_SUCCESS">Login</option>
            <option value="LOGIN_FAILED">Login Falhou</option>
            <option value="LOGOUT">Logout</option>
            <option value="PASSWORD_CREATED">Criar Senha</option>
            <option value="PASSWORD_UPDATED">Atualizar Senha</option>
            <option value="PASSWORD_DELETED">Deletar Senha</option>
            <option value="EXPORT_DATA">Exportar Dados</option>
            <option value="IMPORT_DATA">Importar Dados</option>
            <option value="NOTE_CREATED">Criar Nota</option>
            <option value="NOTE_UPDATED">Atualizar Nota</option>
            <option value="NOTE_DELETED">Deletar Nota</option>
            <option value="PROFILE_UPDATED">Atualizar Perfil</option>
            <option value="ACCOUNT_DELETED">Deletar Conta</option>
            <option value="SESSION_REVOKED">Revogar Sessão</option>
            <option value="LOCATION_UPDATED">Atualizar Localização</option>
          </BaseSelect>

          <DatePicker
            v-model="filters.startDate"
            placeholder="Data inicial"
          />

          <DatePicker
            v-model="filters.endDate"
            placeholder="Data final"
          />
        </div>
      </section>

      <BaseCard>
        <div v-if="isInitialLoading" class="p-1">
          <SkeletonTable :rows="6" :columns="5" />
        </div>

        <div v-else-if="logs.length > 0" :class="{ 'pointer-events-none opacity-60': isFetching }">
          <div class="table-shell">
            <table class="min-w-full divide-y divide-line">
              <thead class="table-head">
                <tr>
                  <th class="px-4 py-3">Data/Hora</th>
                  <th class="px-4 py-3">Ação</th>
                  <th class="px-4 py-3">Detalhes</th>
                  <th class="px-4 py-3">IP</th>
                  <th class="px-4 py-3">User Agent</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-line bg-surface">
                <tr v-for="log in logs" :key="log.id" class="table-row">
                  <td class="whitespace-nowrap px-4 py-3.5 text-sm text-ink">
                    {{ formatDateTime(log.createdAt) }}
                  </td>

                  <td class="whitespace-nowrap px-4 py-3.5">
                    <span :class="getActionClass(log.action)">
                      {{ getActionLabel(log.action) }}
                    </span>
                  </td>

                  <td class="max-w-xs px-4 py-3.5 text-sm text-ink-muted">
                    <span class="line-clamp-2 break-all font-mono text-xs">{{ formatDetails(log.details) }}</span>
                  </td>

                  <td class="whitespace-nowrap px-4 py-3.5 text-sm text-ink-muted">
                    {{ log.ipAddress || '-' }}
                  </td>

                  <td class="max-w-xs truncate px-4 py-3.5 text-sm text-ink-muted">
                    {{ log.userAgent || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <Pagination
            class="mt-4"
            :current-page="pagination.currentPage"
            :total-pages="pagination.totalPages"
            :total="pagination.total"
            :limit="pagination.limit"
            :busy="isFetching"
            @previous="previousPage"
            @next="nextPage"
            @go-to-page="goToPage"
          />
        </div>

        <EmptyState
          v-else
          :icon="DocumentTextIcon"
          title="Nenhum log encontrado"
          :description="hasActiveFilters ? 'Tente ajustar os filtros de busca.' : 'Você ainda não possui logs de auditoria.'"
        />
      </BaseCard>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { DocumentTextIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import {
  AppHeader,
  BaseCard,
  BaseInput,
  BaseSelect,
  DatePicker,
  EmptyState,
  Pagination,
  SkeletonTable
} from '@/components/ui'
import { useAuthStore } from '@/stores/auth'
import usersApi, { type AdminUser, type AuditLog } from '@/api/users'
import { useToast } from '@/hooks/useToast'

const authStore = useAuthStore()
const toast = useToast()

const logs = ref<AuditLog[]>([])
const isLoading = ref(true)
const isInitialLoading = ref(true)
const users = ref<AdminUser[]>([])
const requestId = ref(0)
const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  total: 0,
  limit: 10
})

const getDefaultStartDate = () => {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getDefaultEndDate = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const filters = ref({
  query: '',
  userId: '',
  action: '',
  startDate: getDefaultStartDate(),
  endDate: getDefaultEndDate()
})

const isFetching = computed(() => isLoading.value && !isInitialLoading.value)
const hasActiveFilters = computed(() => Boolean(filters.value.query || filters.value.userId || filters.value.action))

const getActionClass = (action: string) => {
  const classes: Record<string, string> = {
    LOGIN_SUCCESS: 'pill-success',
    LOGIN_FAILED: 'pill-danger',
    LOGOUT: 'pill-neutral',
    PASSWORD_CREATED: 'pill-info',
    PASSWORD_UPDATED: 'pill-warning',
    PASSWORD_DELETED: 'pill-danger',
    EXPORT_DATA: 'pill-accent',
    IMPORT_DATA: 'pill-info',
    NOTE_CREATED: 'pill-info',
    NOTE_UPDATED: 'pill-warning',
    NOTE_DELETED: 'pill-danger',
    PROFILE_UPDATED: 'pill-accent',
    ACCOUNT_DELETED: 'pill-danger',
    SESSION_REVOKED: 'pill-warning',
    LOCATION_UPDATED: 'pill-neutral'
  }
  return classes[action] || 'pill-neutral'
}

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    LOGIN_SUCCESS: 'Login',
    LOGIN_FAILED: 'Login Falhou',
    LOGOUT: 'Logout',
    PASSWORD_CREATED: 'Criar Senha',
    PASSWORD_UPDATED: 'Atualizar Senha',
    PASSWORD_DELETED: 'Deletar Senha',
    EXPORT_DATA: 'Exportar Dados',
    IMPORT_DATA: 'Importar Dados',
    NOTE_CREATED: 'Criar Nota',
    NOTE_UPDATED: 'Atualizar Nota',
    NOTE_DELETED: 'Deletar Nota',
    PROFILE_UPDATED: 'Atualizar Perfil',
    ACCOUNT_DELETED: 'Deletar Conta',
    SESSION_REVOKED: 'Revogar Sessão',
    LOCATION_UPDATED: 'Atualizar Localização'
  }
  return labels[action] || action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDetails = (details: unknown) => {
  if (!details) return '-'
  if (typeof details === 'string') return details
  if (typeof details === 'object') {
    try {
      return JSON.stringify(details, null, 2)
    } catch {
      return String(details)
    }
  }
  return String(details)
}

const fetchLogs = async () => {
  const currentRequest = ++requestId.value
  isLoading.value = true

  try {
    const filterParams: {
      query?: string;
      userId?: string;
      action?: string;
      startDate?: string;
      endDate?: string;
    } = {}

    if (filters.value.query) filterParams.query = filters.value.query
    if (filters.value.userId) filterParams.userId = filters.value.userId
    if (filters.value.action) filterParams.action = filters.value.action
    if (filters.value.startDate) filterParams.startDate = filters.value.startDate
    if (filters.value.endDate) filterParams.endDate = filters.value.endDate

    const offset = (pagination.value.currentPage - 1) * pagination.value.limit
    const response = await usersApi.getAuditLogs(pagination.value.limit, offset, filterParams)

    if (currentRequest !== requestId.value) return

    if (response.success && response.data) {
      logs.value = response.data
      if (response.pagination) {
        pagination.value.total = response.pagination.total
        pagination.value.totalPages = Math.max(1, Math.ceil(response.pagination.total / pagination.value.limit))
      }
    } else {
      logs.value = []
      pagination.value.total = 0
      pagination.value.totalPages = 1
    }
  } catch {
    if (currentRequest === requestId.value) {
      logs.value = []
      pagination.value.total = 0
      pagination.value.totalPages = 1
      toast.error('Não foi possível carregar os logs.')
    }
  } finally {
    if (currentRequest === requestId.value) {
      isLoading.value = false
      isInitialLoading.value = false
    }
  }
}

const fetchUsers = async () => {
  if (!authStore.isAdmin) return
  try {
    const response = await usersApi.getAllUsers()
    if (response.success && response.data) {
      users.value = response.data
    }
  } catch {
    // The user filter is optional.
  }
}

const goToPage = (page: number) => {
  pagination.value.currentPage = page
  fetchLogs()
}

const nextPage = () => {
  if (pagination.value.currentPage < pagination.value.totalPages) {
    pagination.value.currentPage++
    fetchLogs()
  }
}

const previousPage = () => {
  if (pagination.value.currentPage > 1) {
    pagination.value.currentPage--
    fetchLogs()
  }
}

watch(
  () => filters.value.action,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      pagination.value.currentPage = 1
      fetchLogs()
    }
  }
)

watch(
  () => filters.value.query,
  () => {
    pagination.value.currentPage = 1
    fetchLogs()
  }
)

watch(
  () => filters.value.startDate,
  () => {
    pagination.value.currentPage = 1
    fetchLogs()
  }
)

watch(
  () => filters.value.endDate,
  () => {
    pagination.value.currentPage = 1
    fetchLogs()
  }
)

watch(
  () => filters.value.userId,
  () => {
    pagination.value.currentPage = 1
    fetchLogs()
  }
)

onMounted(() => {
  fetchUsers()
  fetchLogs()
})
</script>
