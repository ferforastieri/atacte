<template>
  <BaseModal :show="show" @close="$emit('close')" size="lg">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Nova Senha</h3>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Nome/Title -->
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nome *
        </label>
        <BaseInput
          id="name"
          v-model="form.name"
          type="text"
          placeholder="Ex: Gmail, Facebook, Netflix"
          required
          :error="errors.name"
          :left-icon="TagIcon"
        />
      </div>

      <!-- Website -->
      <div>
        <label for="website" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Website
        </label>
        <BaseInput
          id="website"
          v-model="form.website"
          type="url"
          placeholder="https://exemplo.com"
          :error="errors.website"
          :left-icon="GlobeAltIcon"
        />
      </div>

      <!-- Username/Email -->
      <div>
        <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Username/Email
        </label>
        <BaseInput
          id="username"
          v-model="form.username"
          type="text"
          placeholder="usuario@exemplo.com"
          :error="errors.username"
          :left-icon="UserIcon"
        />
      </div>

      <!-- Senha -->
      <div>
        <div class="flex justify-between items-center mb-1">
          <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Senha *
          </label>
          <button
            type="button"
            @click="showPasswordGenerator = true"
            class="text-sm text-primary-600 hover:text-primary-700"
          >
            Gerar senha
          </button>
        </div>
        <BaseInput
          id="password"
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Digite ou gere uma senha"
          required
          :error="errors.password"
          :left-icon="LockClosedIcon"
        >
          <template #right-icon>
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="text-gray-400 hover:text-gray-600"
            >
              <EyeIcon v-if="showPassword" class="h-5 w-5" />
              <EyeSlashIcon v-else class="h-5 w-5" />
            </button>
          </template>
        </BaseInput>
        
        <!-- Password Strength Indicator -->
        <PasswordStrength v-if="form.password" :password="form.password" class="mt-2" />
      </div>

      <!-- Pasta -->
      <div>
        <label for="folder" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Pasta
        </label>
        <BaseInput
          id="folder"
          v-model="form.folder"
          type="text"
          placeholder="Ex: Trabalho, Pessoal, Bancos"
          :error="errors.folder"
          :left-icon="FolderIcon"
        />
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
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500"
          placeholder="Informações adicionais sobre esta senha..."
          :class="{ 'border-red-300 dark:border-red-600': errors.notes }"
        ></textarea>
        <p v-if="errors.notes" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.notes }}</p>
      </div>

      <!-- TOTP Section -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-md font-medium text-gray-900 dark:text-gray-100">Autenticação de Dois Fatores (TOTP)</h4>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="form.totpEnabled"
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div v-if="form.totpEnabled" class="space-y-4">
          <!-- TOTP Secret -->
          <div>
            <label for="totpSecret" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Chave Secreta TOTP
            </label>
            <BaseInput
              id="totpSecret"
              v-model="form.totpSecret"
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

      <!-- Favorita -->
      <div class="flex items-center">
        <input
          id="isFavorite"
          v-model="form.isFavorite"
          type="checkbox"
          class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
        />
        <label for="isFavorite" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
          Marcar como favorita
        </label>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <BaseButton
          variant="ghost"
          @click="$emit('close')"
          :disabled="isSubmitting"
        >
          Cancelar
        </BaseButton>
        <BaseButton
          variant="primary"
          @click="handleSubmit"
          :loading="isSubmitting"
          :disabled="!isFormValid"
        >
          Salvar
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
import { ref, computed, watch } from 'vue'
import { useToast } from '@/hooks/useToast'
import { EyeIcon, EyeSlashIcon, TagIcon, GlobeAltIcon, UserIcon, LockClosedIcon, FolderIcon, KeyIcon } from '@heroicons/vue/24/outline'
import { BaseModal, BaseInput, BaseButton, PasswordStrength, PasswordGeneratorModal } from '@/components/ui'
import { usePasswordsStore } from '@/stores/passwords'
import type { CreatePasswordRequest } from '@/api/passwords'

interface Props {
  show: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'created'): void
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


const showPassword = ref(false)
const showPasswordGenerator = ref(false)
const isSubmitting = ref(false)


const errors = ref<Record<string, string>>({})


const isFormValid = computed(() => {
  return form.value.name.trim() && form.value.password.trim()
})

const handlePasswordGenerated = (generatedPassword: string) => {
  form.value.password = generatedPassword
  showPassword.value = true
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
  
  if (form.value.totpEnabled && !form.value.totpSecret.trim()) {
    errors.value.totpSecret = 'Chave secreta é obrigatória quando TOTP está habilitado'
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
  
  isSubmitting.value = true
  
  try {
    const passwordData: CreatePasswordRequest = {
      name: form.value.name.trim(),
      password: form.value.password,
      totpEnabled: form.value.totpEnabled,
      isFavorite: form.value.isFavorite
    }
    
    if (form.value.website.trim()) {
      passwordData.website = form.value.website.trim()
    }
    
    if (form.value.username.trim()) {
      passwordData.username = form.value.username.trim()
    }
    
    if (form.value.folder.trim()) {
      passwordData.folder = form.value.folder.trim()
    }
    
    if (form.value.notes.trim()) {
      passwordData.notes = form.value.notes.trim()
    }
    
    if (form.value.totpEnabled && form.value.totpSecret.trim()) {
      passwordData.totpSecret = form.value.totpSecret.trim()
    }
    
    await passwordsStore.createPassword(passwordData)
    
    toast.success('Senha criada com sucesso!')
    emit('created')
    
    
    resetForm()
  } catch (error: unknown) {
    const errorMessage = error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
      : undefined;
    toast.error(errorMessage || 'Erro ao criar senha')
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
  showPassword.value = false
  errors.value = {}
}


watch(() => props.show, (newShow) => {
  if (!newShow) {
    resetForm()
  }
})
</script>

