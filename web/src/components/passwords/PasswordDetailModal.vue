<template>
  <BaseModal :show="show" @close="$emit('close')" size="lg">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ password?.name || 'Detalhes da Senha' }}</h3>
    </template>

    <div v-if="password" class="space-y-6">
      <!-- Informações básicas -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
          <p class="text-sm text-gray-900 dark:text-gray-100">{{ password.name }}</p>
        </div>
        
        <div v-if="password.website">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
          <a :href="password.website" target="_blank" class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
            {{ password.website }}
          </a>
        </div>
        
        <div v-if="password.username">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
          <p class="text-sm text-gray-900 dark:text-gray-100">{{ password.username }}</p>
        </div>
        
        <div v-if="password.folder">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pasta</label>
          <p class="text-sm text-gray-900 dark:text-gray-100">📁 {{ password.folder }}</p>
        </div>
      </div>

      <!-- Senha -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
        <div class="flex items-center space-x-2">
          <BaseInput
            v-model="passwordValue"
            type="password"
            readonly
            showPasswordToggle
            class="flex-1"
            :left-icon="LockClosedIcon"
          />
          <button
            @click="copyPassword"
            class="px-3 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Copiar
          </button>
        </div>
      </div>

      <!-- TOTP -->
      <div v-if="password.totpEnabled">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Código TOTP</label>
        <TotpCode 
          :secret="totpSecret"
          @refresh="refreshTotpCode"
        />
      </div>

      <!-- Notas -->
      <div v-if="password.notes">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
        <p class="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{{ password.notes }}</p>
      </div>

      <!-- Status -->
      <div class="flex items-center space-x-4">
        <div v-if="password.isFavorite" class="flex items-center text-red-500">
          <HeartIcon class="h-4 w-4 mr-1" />
          <span class="text-sm">Favorita</span>
        </div>
        <div v-if="password.totpEnabled" class="flex items-center text-blue-500">
          <KeyIcon class="h-4 w-4 mr-1" />
          <span class="text-sm">TOTP Ativo</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <BaseButton
          variant="danger"
          @click="handleDelete"
          :loading="isDeleting"
        >
          Excluir
        </BaseButton>
        <BaseButton variant="ghost" @click="$emit('close')">
          Fechar
        </BaseButton>
        <BaseButton variant="primary" @click="handleEdit">
          Editar
        </BaseButton>
      </div>
    </template>
  </BaseModal>

  <!-- Modal de Edição -->
  <EditPasswordModal
    :show="showEditModal"
    :password="password"
    @close="handleEditClose"
    @updated="handleEditUpdated"
  />

  <!-- Modal de Confirmação de Exclusão -->
  <ConfirmModal
    :show="showDeleteConfirm"
    title="Excluir Senha"
    :message="`Tem certeza que deseja excluir a senha '${password?.name || ''}'? Esta ação não pode ser desfeita.`"
    confirm-text="Excluir"
    :loading="isDeleting"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useToast } from '@/hooks/useToast'
import { HeartIcon, KeyIcon, LockClosedIcon } from '@heroicons/vue/24/outline'
import { BaseModal, BaseInput, BaseButton, TotpCode, ConfirmModal } from '@/components/ui'
import { type PasswordEntry } from '@/api/passwords'
import { usePasswordsStore } from '@/stores/passwords'
import { copyToClipboard } from '@/utils/clipboard'
import EditPasswordModal from './EditPasswordModal.vue'

interface Props {
  show: boolean
  password: PasswordEntry | null
}

interface Emits {
  (e: 'close'): void
  (e: 'updated'): void
  (e: 'deleted'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const toast = useToast()
const passwordsStore = usePasswordsStore()

const isDeleting = ref(false)
const totpCode = ref<{ code: string; timeRemaining: number; period: number } | null>(null)
const totpSecret = ref<string | null>(null)
let totpTimer: number | null = null
const showEditModal = ref(false)
const passwordValue = ref('')
const showDeleteConfirm = ref(false)

const copyPassword = async () => {
  if (!props.password) return
  
  const result = await copyToClipboard(props.password.password)
  if (result.success) {
    toast.success(result.message)
  } else {
    toast.error(result.message)
  }
}

const handleEdit = () => {
  showEditModal.value = true
}

const handleEditUpdated = () => {
  
  emit('updated')
  toast.success('Senha atualizada com sucesso!')
}

const handleEditClose = () => {
  showEditModal.value = false
}

const handleDelete = () => {
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!props.password) return
  
  isDeleting.value = true
  
  try {
    await passwordsStore.deletePassword(props.password.id)
    toast.success('Senha excluída com sucesso!')
    emit('deleted')
    emit('close')
  } catch (error: unknown) {
    const errorMessage = error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
      : undefined;
    toast.error(errorMessage || 'Erro ao excluir senha')
  } finally {
    isDeleting.value = false
    showDeleteConfirm.value = false
  }
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
}

const loadTotpSecret = async () => {
  if (!props.password?.id || !props.password?.totpEnabled) return
  
  try {
    const secretData = await passwordsStore.getTotpSecret(props.password.id)
    
    if (secretData?.secret) {
      totpSecret.value = secretData.secret
    }
  } catch (error) {
    try {
      const code = await passwordsStore.getTotpCode(props.password.id)
      totpCode.value = code
    } catch (fallbackError) {
    }
  }
}

const refreshTotpCode = async () => {
  await loadTotpSecret()
}


const startTotpTimer = () => {
  
}

const stopTotpTimer = () => {
  
}


watch(() => props.show, async (show) => {
  if (show && props.password?.totpEnabled) {
    await loadTotpSecret()
    startTotpTimer()
  } else {
    stopTotpTimer()
  }
})


watch(() => props.password?.password, (newPassword) => {
  if (newPassword) {
    passwordValue.value = newPassword
  }
}, { immediate: true })

watch(() => props.password?.id, async (id) => {
  if (id && props.password?.totpEnabled) {
    await loadTotpSecret()
    startTotpTimer()
  }
})


onMounted(() => {
  if (props.show && props.password?.totpEnabled) {
    loadTotpSecret()
  }
})


onUnmounted(() => {
  stopTotpTimer()
})
</script>

