<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Header -->
    <AppHeader
      :show-logo="true"
      :show-back-button="true"
      :show-navigation="true"
      title="Logs de Auditoria"
    />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Filters -->
      <BaseCard class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <BaseInput
            v-model="filters.query"
            type="text"
            placeholder="Buscar logs..."
            left-icon="MagnifyingGlassIcon"
          />
          
          <select v-model="filters.action" class="input-field">
            <option value="">Todas as ações</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="create_password">Criar Senha</option>
            <option value="update_password">Atualizar Senha</option>
            <option value="delete_password">Deletar Senha</option>
          </select>

          <input
            v-model="filters.startDate"
            type="date"
            class="input-field"
          />

          <input
            v-model="filters.endDate"
            type="date"
            class="input-field"
          />
        </div>
      </BaseCard>

      <!-- Logs Table -->
      <BaseCard>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data/Hora
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ação
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalhes
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dispositivo
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="log in filteredLogs"
                :key="log.id"
                class="hover:bg-gray-50"
              >
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                
                <td class="px-6 py-4 text-sm text-gray-900">
                  {{ log.details || '-' }}
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ log.ipAddress || '-' }}
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ log.deviceName || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-if="filteredLogs.length === 0" class="text-center py-12">
          <DocumentTextIcon class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900">Nenhum log encontrado</h3>
          <p class="mt-1 text-sm text-gray-500">
            Tente ajustar os filtros de busca.
          </p>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeftIcon, MagnifyingGlassIcon, DocumentTextIcon } from '@heroicons/vue/24/outline'
import { AppHeader, BaseButton, BaseInput, BaseCard } from '@/components/ui'

interface AuditLog {
  id: string
  action: string
  details?: string
  ipAddress?: string
  deviceName?: string
  createdAt: string
}

const router = useRouter()

const logs = ref<AuditLog[]>([])

const filters = ref({
  query: '',
  action: '',
  startDate: '',
  endDate: ''
})

const filteredLogs = computed(() => {
  let filtered = logs.value

  if (filters.value.query) {
    const query = filters.value.query.toLowerCase()
    filtered = filtered.filter(log =>
      log.action.toLowerCase().includes(query) ||
      log.details?.toLowerCase().includes(query) ||
      log.deviceName?.toLowerCase().includes(query)
    )
  }

  if (filters.value.action) {
    filtered = filtered.filter(log => log.action === filters.value.action)
  }

  if (filters.value.startDate) {
    filtered = filtered.filter(log => log.createdAt >= filters.value.startDate)
  }

  if (filters.value.endDate) {
    filtered = filtered.filter(log => log.createdAt <= filters.value.endDate)
  }

  return filtered
})

const getActionClass = (action: string) => {
  const classes: Record<string, string> = {
    login: 'bg-green-100 text-green-800',
    logout: 'bg-gray-100 text-gray-800',
    create_password: 'bg-blue-100 text-blue-800',
    update_password: 'bg-yellow-100 text-yellow-800',
    delete_password: 'bg-red-100 text-red-800'
  }
  return classes[action] || 'bg-gray-100 text-gray-800'
}

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    login: 'Login',
    logout: 'Logout',
    create_password: 'Criar Senha',
    update_password: 'Atualizar Senha',
    delete_password: 'Deletar Senha'
  }
  return labels[action] || action
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('pt-BR')
}

const fetchLogs = async () => {
  try {
    
    logs.value = []
  } catch (error) {
    console.error('Erro ao buscar logs:', error)
  }
}

onMounted(() => {
  fetchLogs()
})
</script>

