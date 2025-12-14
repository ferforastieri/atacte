<template>
  <BaseModal :show="show" @close="handleClose" size="md" :close-on-overlay="false" :close-on-escape="false">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
          <ShieldExclamationIcon class="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Dispositivo Não Confiável</h3>
      </div>
    </template>

    <div class="space-y-4">
      <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        Este dispositivo não está na lista de dispositivos confiáveis. Para sua segurança, você precisa confirmar se deseja confiar neste dispositivo.
      </p>

      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600 dark:text-gray-400">Dispositivo:</span>
          <span class="text-sm font-medium text-gray-900 dark:text-gray-100 text-right">{{ deviceName || 'Desconhecido' }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600 dark:text-gray-400">IP:</span>
          <span class="text-sm font-medium text-gray-900 dark:text-gray-100 text-right">{{ ipAddress || 'Desconhecido' }}</span>
        </div>
      </div>

      <div class="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <InformationCircleIcon class="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p class="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
          Ao confiar este dispositivo, você poderá acessar sua conta normalmente. Você pode revogar a confiança a qualquer momento nas configurações.
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end space-x-3 w-full">
        <BaseButton variant="ghost" @click="handleClose" :disabled="isLoading">
          Cancelar
        </BaseButton>
        <BaseButton variant="primary" @click="handleTrust" :loading="isLoading">
          Confiar neste Dispositivo
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ShieldExclamationIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'
import { BaseModal, BaseButton } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import authApi from '@/api/auth'

interface Props {
  show: boolean
  sessionId: string
  deviceName?: string
  ipAddress?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'trusted'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const toast = useToast()

const isLoading = ref(false)

const handleTrust = async () => {
  isLoading.value = true
  try {
    const response = await authApi.trustDevice(props.sessionId)
    if (response.success) {
      toast.success('Dispositivo confiado com sucesso!')
      emit('trusted')
      emit('close')
    } else {
      toast.error(response.message || 'Erro ao confiar dispositivo')
    }
  } catch (error: any) {
    console.error('Erro ao confiar dispositivo:', error)
    const errorMessage = error.response?.data?.message || error.message || 'Erro ao confiar dispositivo'
    toast.error(errorMessage)
  } finally {
    isLoading.value = false
  }
}

const handleClose = () => {
  if (!isLoading.value) {
    emit('close')
  }
}
</script>

