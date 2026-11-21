<template>
  <BaseModal :show="show" size="lg" @close="$emit('close')">
    <template #header>
      <div class="flex min-w-0 items-center gap-3">
        <div class="icon-tile h-11 w-11">
          <LockClosedIcon class="h-5 w-5" />
        </div>
        <div class="min-w-0">
          <h3 class="text-lg font-semibold text-ink">Nova Senha</h3>
          <p class="mt-0.5 text-xs text-ink-muted">Guarde uma credencial nova no cofre</p>
        </div>
      </div>
    </template>

    <form class="space-y-6" @submit.prevent="handleSubmit">
      <div
        v-if="formError"
        class="rounded-xl border border-danger-200 bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700 dark:border-danger-900 dark:bg-danger-900/20 dark:text-danger-300"
        role="alert"
      >
        {{ formError }}
      </div>

      <section class="space-y-4">
        <h4 class="section-title">Informações</h4>

        <BaseInput
          id="password-name"
          v-model="form.name"
          label="Nome"
          placeholder="Ex: Gmail, Facebook, Netflix"
          required
          :error="errors.name"
          :left-icon="TagIcon"
        />

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <BaseInput
            id="password-website"
            v-model="form.website"
            type="url"
            label="Website"
            placeholder="https://exemplo.com"
            :error="errors.website"
            :left-icon="GlobeAltIcon"
          />
          <BaseInput
            id="password-username"
            v-model="form.username"
            label="Username/Email"
            placeholder="usuario@exemplo.com"
            autocomplete="username"
            :error="errors.username"
            :left-icon="UserIcon"
          />
        </div>

        <BaseInput
          id="password-folder"
          v-model="form.folder"
          label="Pasta"
          placeholder="Ex: Trabalho, Pessoal, Bancos"
          :error="errors.folder"
          :left-icon="FolderIcon"
        />
      </section>

      <section class="space-y-3 border-t border-line pt-6">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h4 class="section-title">Credencial</h4>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:bg-primary-900/40 dark:text-primary-300 dark:hover:bg-primary-900/60"
            @click="showPasswordGenerator = true"
          >
            <SparklesIcon class="h-3.5 w-3.5" />
            Gerar senha
          </button>
        </div>

        <BaseInput
          id="password-value"
          v-model="form.password"
          type="password"
          label="Senha"
          placeholder="Digite ou gere uma senha"
          autocomplete="new-password"
          required
          :error="errors.password"
          :left-icon="LockClosedIcon"
          show-password-toggle
        />

        <PasswordStrength
          v-if="passwordStrength"
          :score="passwordStrength.score"
          :feedback="passwordStrength.feedback"
        />
      </section>

      <section class="space-y-4 border-t border-line pt-6">
        <h4 class="section-title">Organização</h4>

        <BaseTextarea
          id="password-notes"
          v-model="form.notes"
          label="Notas"
          placeholder="Informações adicionais sobre esta senha..."
          :rows="3"
          :error="errors.notes"
        />

        <BaseSwitch
          v-model="form.isFavorite"
          label="Marcar como favorita"
          description="Aparece primeiro quando você filtra por favoritas."
        />
      </section>

      <section class="space-y-4 border-t border-line pt-6">
        <div>
          <h4 class="section-title">Autenticação de Dois Fatores (TOTP)</h4>
          <p class="mt-1 text-xs text-ink-muted">Gere códigos de 6 dígitos junto com esta credencial.</p>
        </div>

        <BaseSwitch
          v-model="form.totpEnabled"
          label="Ativar TOTP"
          description="Você pode adicionar a chave secreta agora."
        />

        <div v-if="form.totpEnabled">
          <BaseInput
            id="password-totp"
            v-model="form.totpSecret"
            type="text"
            label="Chave Secreta TOTP"
            placeholder="Digite a chave secreta do app autenticador"
            :error="errors.totpSecret"
            :left-icon="KeyIcon"
          />
          <p class="mt-1.5 field-hint">
            Cole a chave secreta do seu app autenticador (Google Authenticator, Authy, etc.)
          </p>
        </div>
      </section>
    </form>

    <template #footer>
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <BaseButton variant="ghost" :disabled="isSubmitting" @click="$emit('close')">
          Cancelar
        </BaseButton>
        <BaseButton
          :loading="isSubmitting"
          :disabled="!isFormValid || isSubmitting"
          @click="handleSubmit"
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
import { computed, ref, watch } from 'vue'
import {
  FolderIcon,
  GlobeAltIcon,
  KeyIcon,
  LockClosedIcon,
  SparklesIcon,
  TagIcon,
  UserIcon
} from '@heroicons/vue/24/outline'
import zxcvbn from 'zxcvbn'
import {
  BaseButton,
  BaseInput,
  BaseModal,
  BaseSwitch,
  BaseTextarea,
  PasswordGeneratorModal,
  PasswordStrength
} from '@/components/ui'
import { usePasswordsStore } from '@/stores/passwords'
import type { CreatePasswordRequest, PasswordEntry } from '@/api/passwords'

interface Props {
  show: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  created: [password: PasswordEntry]
}>()

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
const formError = ref('')
const errors = ref<Record<string, string>>({})

const isFormValid = computed(() => {
  return Boolean(form.value.name.trim() && form.value.password.trim())
})

const passwordStrength = computed(() => {
  if (!form.value.password) return null

  const result = zxcvbn(form.value.password)
  return {
    score: result.score,
    feedback: {
      warning: result.feedback.warning || '',
      suggestions: result.feedback.suggestions || []
    }
  }
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

  if (form.value.totpEnabled && !form.value.totpSecret.trim()) {
    errors.value.totpSecret = 'Chave secreta é obrigatória quando TOTP está habilitado'
  }

  return Object.keys(errors.value).length === 0
}

const isValidUrl = (string: string) => {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}

const handleSubmit = async () => {
  if (isSubmitting.value || !validateForm()) return

  formError.value = ''
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

    const createdPassword = await passwordsStore.createPassword(passwordData)

    emit('created', createdPassword)
    resetForm()
  } catch (error: unknown) {
    formError.value = error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Não foi possível criar a senha'
      : 'Não foi possível criar a senha'
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
  formError.value = ''
}

watch(() => props.show, (newShow) => {
  if (!newShow) {
    resetForm()
  }
})
</script>
