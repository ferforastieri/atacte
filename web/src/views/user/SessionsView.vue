<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <AppHeader
      :show-logo="true"
      :show-navigation="true"
    />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-6 flex justify-end">
        <BaseButton
          variant="danger"
          @click="openRevokeAllModal"
          :loading="isRevokingAll"
        >
          <TrashIcon class="w-4 h-4 mr-2" />
          Revogar Todas
        </BaseButton>
      </div>
      <BaseCard class="mb-6 dark:bg-gray-800 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircleIcon class="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 class="text-sm font-medium text-gray-900 dark:text-white">Sessão Atual</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ currentSession?.deviceName || 'Esta é sua sessão atual' }}</p>
            </div>
          </div>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            Ativa
          </span>
        </div>
      </BaseCard>

      <BaseCard class="dark:bg-gray-800 dark:border-gray-700">
        <div v-if="isLoading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">Carregando sessões...</p>
        </div>

        <div v-else-if="sessions.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Dispositivo
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  IP Address
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Criada em
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Última Atividade
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Confiança
                </th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="session in sessions"
                :key="session.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-8 w-8">
                      <div class="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <ComputerDesktopIcon class="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                    </div>
                    <div class="ml-3">
                      <div class="text-sm font-medium text-gray-900 dark:text-white">{{ session.deviceName || 'Dispositivo Desconhecido' }}</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">{{ session.userAgent || '-' }}</div>
                    </div>
                  </div>
                </td>
                
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ session.ipAddress || '-' }}
                </td>
                
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDateTime(session.createdAt) }}
                </td>
                
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDateTime(session.lastUsed) }}
                </td>
                
                <td class="px-4 py-3 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="session.isCurrent ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'"
                  >
                    {{ session.isCurrent ? 'Atual' : 'Ativa' }}
                  </span>
                </td>
                
                <td class="px-4 py-3 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="session.isTrusted ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'"
                  >
                    {{ session.isTrusted ? 'Confiável' : 'Não Confiável' }}
                  </span>
                </td>
                
                <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex items-center justify-end gap-1.5">
                    <BaseButton
                      v-if="session.isTrusted && session.deviceName"
                      variant="ghost"
                      size="sm"
                      @click="openUntrustModal(session.deviceName)"
                      class="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 p-1.5"
                      title="Remover confiança do dispositivo"
                    >
                      <ShieldExclamationIcon class="w-4 h-4" />
                    </BaseButton>
                    <BaseButton
                      v-if="!session.isCurrent"
                      variant="ghost"
                      size="sm"
                      @click="revokeSession(session.id)"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Revogar
                    </BaseButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="text-center py-12">
          <ComputerDesktopIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Nenhuma sessão encontrada</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Você não tem sessões ativas.
          </p>
        </div>
      </BaseCard>
    </div>

    <!-- Untrust Device Confirmation Modal -->
    <ConfirmModal
      :show="showUntrustModal"
      title="Remover Confiança do Dispositivo"
      :message="`Tem certeza que deseja remover a confiança do dispositivo \"${untrustingDeviceName}\"? Na próxima vez que você fizer login neste dispositivo, será necessário confiar novamente.`"
      confirm-text="Remover Confiança"
      cancel-text="Cancelar"
      :loading="isUntrusting"
      @confirm="confirmUntrustDevice"
      @cancel="closeUntrustModal"
    />

    <!-- Revoke All Sessions Confirmation Modal -->
    <ConfirmModal
      :show="showRevokeAllModal"
      title="Revogar Todas as Sessões"
      message="Tem certeza que deseja revogar todas as sessões? Você será deslogado."
      confirm-text="Revogar Todas"
      cancel-text="Cancelar"
      :loading="isRevokingAll"
      @confirm="confirmRevokeAllSessions"
      @cancel="closeRevokeAllModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/hooks/useToast'
import {
  TrashIcon,
  CheckCircleIcon,
  ComputerDesktopIcon,
  ShieldExclamationIcon
} from '@heroicons/vue/24/outline'
import { AppHeader, BaseButton, BaseCard, ConfirmModal } from '@/components/ui'
import authApi, { type Session } from '@/api/auth'

const router = useRouter()
const toast = useToast()

const sessions = ref<Session[]>([])
const isLoading = ref(false)
const isRevokingAll = ref(false)
const showUntrustModal = ref(false)
const showRevokeAllModal = ref(false)
const untrustingDeviceName = ref<string>('')
const isUntrusting = ref(false)

const currentSession = computed(() => {
  return sessions.value.find(s => s.isCurrent)
})

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const revokeSession = async (sessionId: string) => {
  try {
    await authApi.revokeSession(sessionId)
    toast.success('Sessão revogada com sucesso!')
    await fetchSessions()
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Erro ao revogar sessão'
    toast.error(errorMessage)
  }
}

const openUntrustModal = (deviceName: string) => {
  untrustingDeviceName.value = deviceName
  showUntrustModal.value = true
}

const closeUntrustModal = () => {
  showUntrustModal.value = false
  untrustingDeviceName.value = ''
}

const confirmUntrustDevice = async () => {
  if (!untrustingDeviceName.value) return

  isUntrusting.value = true
  try {
    await authApi.untrustDevice(untrustingDeviceName.value)
    toast.success('Confiança removida do dispositivo com sucesso!')
    closeUntrustModal()
    await fetchSessions()
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Erro ao remover confiança do dispositivo'
    toast.error(errorMessage)
  } finally {
    isUntrusting.value = false
  }
}

const openRevokeAllModal = () => {
  showRevokeAllModal.value = true
}

const closeRevokeAllModal = () => {
  showRevokeAllModal.value = false
}

const confirmRevokeAllSessions = async () => {
  isRevokingAll.value = true
  try {
    const sessionsToRevoke = sessions.value.filter(s => !s.isCurrent)
    
    await Promise.all(sessionsToRevoke.map(session => authApi.revokeSession(session.id)))
    
    toast.success('Todas as sessões foram revogadas!')
    closeRevokeAllModal()
    await fetchSessions()
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Erro ao revogar sessões'
    toast.error(errorMessage)
  } finally {
    isRevokingAll.value = false
  }
}

const fetchSessions = async () => {
  isLoading.value = true
  try {
    const response = await authApi.getSessions()
    if (response.success && response.data) {
      sessions.value = response.data
    } else {
      sessions.value = []
    }
  } catch (error: any) {
    toast.error('Erro ao carregar sessões')
    sessions.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchSessions()
})
</script>


