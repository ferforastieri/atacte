<template>
  <BaseModal :show="show" @close="$emit('close')" size="lg">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Editar Senha</h3>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Nome -->
      <div>
        <BaseInput
          v-model="form.name"
          label="Nome"
          placeholder="Nome da senha"
          required
          :error="errors.name"
          :left-icon="TagIcon"
        />
      </div>

      <!-- Website e Username -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <BaseInput
            v-model="form.website"
            label="Website"
            type="url"
            placeholder="https://exemplo.com"
            :error="errors.website"
            :left-icon="GlobeAltIcon"
          />
        </div>
        
        <div>
          <BaseInput
            v-model="form.username"
            label="Username/Email"
            type="text"
            placeholder="seu@email.com"
            :left-icon="UserIcon"
          />
        </div>
      </div>

      <!-- Senha -->
      <div>
        <BaseInput
          v-model="form.password"
          label="Senha"
          type="password"
          placeholder="Digite a senha"
          required
          :error="errors.password"
          :left-icon="LockClosedIcon"
          showPasswordToggle
        />
        
        <div class="mt-2 flex justify-between">
          <BaseButton
            type="button"
            variant="ghost"
            size="sm"
            @click="showPasswordGenerator = true"
          >
            <KeyIcon class="w-4 h-4 mr-1" />
            Gerar Senha
          </BaseButton>
          
          <div class="text-sm text-gray-500 dark:text-gray-400">
            <PasswordStrength v-if="form.password" :password="form.password" />
          </div>
        </div>
      </div>

      <!-- Pasta e Favorito -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <BaseInput
            v-model="form.folder"
            label="Pasta"
            placeholder="Pasta (opcional)"
            :left-icon="FolderIcon"
          />
        </div>
        
        <div class="flex items-center space-x-2">
          <input
            id="isFavorite"
            v-model="form.isFavorite"
            type="checkbox"
            class="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700"
          />
          <label for="isFavorite" class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Marcar como favorita
          </label>
        </div>
      </div>

      <!-- TOTP -->
      <div class="space-y-4">
        <div class="flex items-center space-x-2">
          <input
            id="totpEnabled"
            v-model="form.totpEnabled"
            type="checkbox"
            class="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700"
          />
          <label for="totpEnabled" class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Habilitar TOTP (2FA)
          </label>
        </div>

        <div v-if="form.totpEnabled" class="space-y-4">
          <!-- TOTP Secret -->
          <div>
            <BaseInput
              v-model="form.totpSecret"
              label="Chave Secreta TOTP"
              type="text"
              placeholder="Digite a chave secreta do app autenticador"
              :error="errors.totpSecret"
              :left-icon="KeyIcon"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Cole a chave secreta do seu app autenticador (Google Authenticator, Authy, etc.)
            </p>
          </div>
        </div>
      </div>

      <!-- Notas -->
      <div>
        <label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notas
        </label>
        <textarea
          id="notes"
          v-model="form.notes"
          rows="3"
          class="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="Notas adicionais (opcional)"
        ></textarea>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <BaseButton variant="ghost" @click="$emit('close')">
          Cancelar
        </BaseButton>
        <BaseButton 
          variant="primary" 
          @click="handleSubmit"
          :loading="isSubmitting"
          :disabled="!isFormValid"
        >
          Salvar Alterações
        </BaseButton>
      </div>
    </template>
  </BaseModal>

  <PasswordGeneratorModal
    :show="showPasswordGenerator"
    :initial-password="form.password"
    @close="showPasswordGenerator = false"
    @password-generated="handlePasswordGenerated"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useToast } from '@/hooks/useToast'
import { KeyIcon, TagIcon, GlobeAltIcon, UserIcon, LockClosedIcon, FolderIcon } from '@heroicons/vue/24/outline'
import { BaseModal, BaseInput, BaseButton, PasswordStrength, PasswordGeneratorModal } from '@/components/ui'
import { type PasswordEntry, type UpdatePasswordRequest } from '@/api/passwords'
import { usePasswordsStore } from '@/stores/passwords'

interface Props {
  show: boolean
  password: PasswordEntry | null
}

interface Emits {
  (e: 'close'): void
  (e: 'updated'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const toast = useToast()
const passwordsStore = usePasswordsStore()


const form = ref({
  name: '',
  website: '',
  username: '',
  password: '',
  folder: '',
  notes: '',
  totpEnabled: false,
  totpSecret: '',
  isFavorite: false
})


const showPasswordGenerator = ref(false)
const isSubmitting = ref(false)


const errors = ref<Record<string, string>>({})


const isFormValid = computed(() => {
  return form.value.name.trim() && form.value.password.trim()
})

const handlePasswordGenerated = (generatedPassword: string) => {
  form.value.password = generatedPassword
}



const validateForm = () => {
  errors.value = {}
  
  if (!form.value.name.trim()) {
    errors.value.name = 'Nome é obrigatório'
  }
  
  if (!form.value.password.trim()) {
    errors.value.password = 'Senha é obrigatória'
  }
  
  if (form.value.website && !isValidUrl(form.value.website)) {
    errors.value.website = 'URL inválida'
  }
  
  return Object.keys(errors.value).length === 0
}

const isValidUrl = (string: string) => {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

const handleSubmit = async () => {
  if (!validateForm()) {
    toast.error('Por favor, corrija os erros no formulário')
    return
  }
  
  if (!props.password?.id) {
    toast.error('Senha não encontrada')
    return
  }
  
  isSubmitting.value = true
  
  try {
    const updateData: UpdatePasswordRequest = {
      id: props.password.id,
      name: form.value.name.trim(),
      password: form.value.password,
      totpEnabled: form.value.totpEnabled,
      isFavorite: form.value.isFavorite
    }
    
    if (form.value.website.trim()) {
      updateData.website = form.value.website.trim()
    }
    
    if (form.value.username.trim()) {
      updateData.username = form.value.username.trim()
    }
    
    if (form.value.folder.trim()) {
      updateData.folder = form.value.folder.trim()
    }
    
    if (form.value.notes.trim()) {
      updateData.notes = form.value.notes.trim()
    }
    
    if (form.value.totpEnabled && form.value.totpSecret.trim()) {
      updateData.totpSecret = form.value.totpSecret.trim()
    }
    
    await passwordsStore.updatePassword(props.password.id, updateData)
    
    toast.success('Senha atualizada com sucesso!')
    emit('updated')
    emit('close')
  } catch (error: unknown) {
    const errorMessage = error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
      : undefined;
    toast.error(errorMessage || 'Erro ao atualizar senha')
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  form.value = {
    name: '',
    website: '',
    username: '',
    password: '',
    folder: '',
    notes: '',
    totpEnabled: false,
    totpSecret: '',
    isFavorite: false
  }
  errors.value = {}
}

const loadPasswordData = () => {
  if (props.password) {
    form.value = {
      name: props.password.name || '',
      website: props.password.website || '',
      username: props.password.username || '',
      password: props.password.password || '',
      folder: props.password.folder || '',
      notes: props.password.notes || '',
      totpEnabled: props.password.totpEnabled || false,
      totpSecret: '', 
      isFavorite: props.password.isFavorite || false
    }
  }
}


watch(() => props.show, (show) => {
  if (show && props.password) {
    loadPasswordData()
  } else if (!show) {
    resetForm()
  }
})


watch(() => props.password, () => {
  if (props.password && props.show) {
    loadPasswordData()
  }
})
</script>
