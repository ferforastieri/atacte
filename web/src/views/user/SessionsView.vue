<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Header -->
    <AppHeader
      :show-logo="true"
      :show-back-button="true"
      :show-navigation="true"
      title="Sessões Ativas"
    />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Action Button -->
      <div class="mb-6 flex justify-end">
        <BaseButton
          variant="danger"
          @click="revokeAllSessions"
          :loading="isRevokingAll"
        >
          <TrashIcon class="w-4 h-4 mr-2" />
          Revogar Todas
        </BaseButton>
      </div>
      <!-- Current Session Info -->
      <BaseCard class="mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircleIcon class="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 class="text-sm font-medium text-gray-900">Sessão Atual</h3>
              <p class="text-sm text-gray-500">Esta é sua sessão atual</p>
            </div>
          </div>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Ativa
          </span>
        </div>
      </BaseCard>

      <!-- Sessions List -->
      <BaseCard>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dispositivo
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Localização
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Atividade
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="session in sessions"
                :key="session.id"
                class="hover:bg-gray-50"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <ComputerDesktopIcon class="h-5 w-5 text-gray-600" />
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{{ session.deviceName }}</div>
                      <div class="text-sm text-gray-500">{{ session.userAgent }}</div>
                    </div>
                  </div>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ session.location || '-' }}
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDateTime(session.lastActivity) }}
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="session.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                  >
                    {{ session.isActive ? 'Ativa' : 'Inativa' }}
                  </span>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    v-if="!session.isActive"
                    @click="revokeSession(session.id)"
                    class="text-red-600 hover:text-red-900"
                  >
                    Revogar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-if="sessions.length === 0" class="text-center py-12">
          <ComputerDesktopIcon class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900">Nenhuma sessão encontrada</h3>
          <p class="mt-1 text-sm text-gray-500">
            Você não tem sessões ativas.
          </p>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/hooks/useToast'
import {
  ArrowLeftIcon,
  TrashIcon,
  CheckCircleIcon,
  ComputerDesktopIcon
} from '@heroicons/vue/24/outline'
import { AppHeader, BaseButton, BaseCard } from '@/components/ui'

interface Session {
  id: string
  deviceName: string
  userAgent: string
  location?: string
  lastActivity: string
  isActive: boolean
}

const router = useRouter()
const toast = useToast()

const sessions = ref<Session[]>([])
const isRevokingAll = ref(false)

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('pt-BR')
}

const revokeSession = async (sessionId: string) => {
  try {
    
    toast.success('Sessão revogada com sucesso!')
    await fetchSessions()
  } catch (error) {
    toast.error('Erro ao revogar sessão')
  }
}

const revokeAllSessions = async () => {
  isRevokingAll.value = true
  try {
    
    toast.success('Todas as sessões foram revogadas!')
    await fetchSessions()
  } catch (error) {
    toast.error('Erro ao revogar sessões')
  } finally {
    isRevokingAll.value = false
  }
}

const fetchSessions = async () => {
  try {
    
    sessions.value = []
  } catch (error) {
    console.error('Erro ao buscar sessões:', error)
  }
}

onMounted(() => {
  fetchSessions()
})
</script>

