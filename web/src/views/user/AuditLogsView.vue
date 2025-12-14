<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <AppHeader
      :show-logo="true"
      :show-navigation="true"
    />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BaseCard class="mb-6 dark:bg-gray-800 dark:border-gray-700" overflow-visible>
        <div class="flex flex-col md:flex-row gap-4" style="position: relative; overflow: visible;">
          <BaseInput
            v-model="filters.query"
            type="text"
            placeholder="Buscar logs..."
            :left-icon="MagnifyingGlassIcon"
            class="w-full md:w-40"
          />
          
          <BaseSelect
            v-if="authStore.isAdmin"
            v-model="filters.userId"
            placeholder="Todos os usuários"
            class="w-full md:w-48"
          >
            <option value="">Todos os usuários</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.email }}
            </option>
          </BaseSelect>
          
          <BaseSelect
            v-model="filters.action"
            placeholder="Todas as ações"
            class="w-full md:w-48"
          >
            <option value="">Todas as ações</option>
            <option value="LOGIN_SUCCESS">Login</option>
            <option value="LOGIN_FAILED">Login Falhou</option>
            <option value="LOGOUT">Logout</option>
            <option value="PASSWORD_CREATED">Criar Senha</option>
            <option value="PASSWORD_UPDATED">Atualizar Senha</option>
            <option value="PASSWORD_DELETED">Deletar Senha</option>
            <option value="PASSWORD_VIEWED">Visualizar Senha</option>
            <option value="PASSWORD_COPIED">Copiar Senha</option>
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
            class="w-full md:flex-1"
          />

          <DatePicker
            v-model="filters.endDate"
            placeholder="Data final"
            class="w-full md:flex-1"
          />
        </div>
      </BaseCard>

      <BaseCard class="dark:bg-gray-800 dark:border-gray-700">
        <div v-if="isLoading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">Carregando logs...</p>
        </div>

        <div v-else-if="filteredLogs.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Data/Hora
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ação
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Detalhes
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  IP
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User Agent
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="log in filteredLogs"
                :key="log.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {{ formatDateTime(log.createdAt) }}
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getActionClass(log.action)"
                  >
                    {{ getActionLabel(log.action) }}
                  </span>
                </td>
                
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  {{ formatDetails(log.details) }}
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ log.ipAddress || '-' }}
                </td>
                
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                  {{ log.userAgent || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="text-center py-12">
          <DocumentTextIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Nenhum log encontrado</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ logs.length === 0 ? 'Você ainda não possui logs de auditoria.' : 'Tente ajustar os filtros de busca.' }}
          </p>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/hooks/useToast'
import { useAuthStore } from '@/stores/auth'
import { DocumentTextIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { AppHeader, BaseInput, BaseCard, BaseSelect, DatePicker } from '@/components/ui'
import usersApi, { type AuditLog, type AdminUser } from '@/api/users'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const logs = ref<AuditLog[]>([])
const isLoading = ref(false)
const users = ref<AdminUser[]>([])

const getDefaultStartDate = () => {
  const date = new Date()
  date.setDate(date.getDate() - 7)
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

const filteredLogs = computed(() => {
  return logs.value
})

const getActionClass = (action: string) => {
  const classes: Record<string, string> = {
    LOGIN_SUCCESS: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    LOGIN_FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    LOGOUT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    PASSWORD_CREATED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    PASSWORD_UPDATED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    PASSWORD_DELETED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    PASSWORD_VIEWED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    PASSWORD_COPIED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    EXPORT_DATA: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    IMPORT_DATA: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    NOTE_CREATED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    NOTE_UPDATED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    NOTE_DELETED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    PROFILE_UPDATED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    ACCOUNT_DELETED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    SESSION_REVOKED: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    LOCATION_UPDATED: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300'
  }
  return classes[action] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
}

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    LOGIN_SUCCESS: 'Login',
    LOGIN_FAILED: 'Login Falhou',
    LOGOUT: 'Logout',
    PASSWORD_CREATED: 'Criar Senha',
    PASSWORD_UPDATED: 'Atualizar Senha',
    PASSWORD_DELETED: 'Deletar Senha',
    PASSWORD_VIEWED: 'Visualizar Senha',
    PASSWORD_COPIED: 'Copiar Senha',
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

const formatDetails = (details: any) => {
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
    
    const response = await usersApi.getAuditLogs(100, 0, filterParams)
    if (response.success && response.data) {
      logs.value = response.data
    } else {
      logs.value = []
    }
  } catch (error: any) {
    toast.error('Erro ao carregar logs de auditoria')
    logs.value = []
  } finally {
    isLoading.value = false
  }
}

const fetchUsers = async () => {
  if (!authStore.isAdmin) return
  try {
    const response = await usersApi.getAllUsers()
    if (response.success && response.data) {
      users.value = response.data
    }
  } catch (error: any) {
    console.error('Erro ao carregar usuários:', error)
  }
}

watch(
  () => filters.value.action,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      fetchLogs()
    }
  }
)

watch(
  () => filters.value.query,
  () => {
    fetchLogs()
  }
)

watch(
  () => filters.value.startDate,
  () => {
    fetchLogs()
  }
)

watch(
  () => filters.value.endDate,
  () => {
    fetchLogs()
  }
)

watch(
  () => filters.value.userId,
  () => {
    fetchLogs()
  }
)

onMounted(() => {
  fetchUsers()
  fetchLogs()
})
</script>

