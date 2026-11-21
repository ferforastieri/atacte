<template>
  <AuthShell
    title="Recuperar Senha"
    subtitle="Digite seu email para receber um token de recuperação."
    :icon="KeyIcon"
  >
    <form v-if="step === 'request'" class="space-y-5" @submit.prevent="handleSubmit">
      <div
        v-if="formError"
        class="rounded-xl border border-danger-200 bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700 dark:border-danger-900 dark:bg-danger-900/20 dark:text-danger-300"
        role="alert"
      >
        {{ formError }}
      </div>

      <BaseInput
        v-model="form.email"
        type="email"
        label="Email"
        placeholder="seu@email.com"
        autocomplete="email"
        required
        :error="errors.email"
        :left-icon="EnvelopeIcon"
      />

      <div class="space-y-1 rounded-xl border border-line bg-surface-muted px-3.5 py-3 text-sm leading-relaxed text-ink-muted">
        <p>Se o email existir, você receberá um token de recuperação por email.</p>
        <p class="font-medium text-ink">Verifique sua caixa de entrada e spam.</p>
      </div>

      <BaseButton
        type="submit"
        size="lg"
        block
        :loading="isLoading"
        :disabled="isLoading"
      >
        Enviar Token
      </BaseButton>

      <BaseButton
        type="button"
        variant="ghost"
        block
        :disabled="isLoading"
        @click="$router.push('/login')"
      >
        Voltar para Login
      </BaseButton>
    </form>

    <form v-else class="space-y-5" @submit.prevent="handleReset">
      <div
        v-if="formError"
        class="rounded-xl border border-danger-200 bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700 dark:border-danger-900 dark:bg-danger-900/20 dark:text-danger-300"
        role="alert"
      >
        {{ formError }}
      </div>

      <BaseInput
        v-model="form.token"
        type="text"
        label="Token"
        placeholder="Token de recuperação"
        autocomplete="one-time-code"
        required
        :error="errors.token"
        :left-icon="KeyIcon"
      />

      <BaseInput
        v-model="form.newPassword"
        type="password"
        label="Nova Senha"
        placeholder="Mínimo 8 caracteres"
        autocomplete="new-password"
        required
        :error="errors.newPassword"
        :left-icon="LockClosedIcon"
        show-password-toggle
      />

      <BaseInput
        v-model="form.confirmPassword"
        type="password"
        label="Confirmar Senha"
        placeholder="Digite novamente"
        autocomplete="new-password"
        required
        :error="errors.confirmPassword"
        :left-icon="LockClosedIcon"
        show-password-toggle
      />

      <BaseButton
        type="submit"
        size="lg"
        block
        :loading="isLoading"
        :disabled="isLoading"
      >
        Redefinir Senha
      </BaseButton>

      <BaseButton
        type="button"
        variant="ghost"
        block
        :disabled="isLoading"
        @click="step = 'request'"
      >
        Voltar
      </BaseButton>
    </form>
  </AuthShell>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { EnvelopeIcon, KeyIcon, LockClosedIcon } from '@heroicons/vue/24/outline'
import authApi from '@/api/auth'
import { BaseButton, BaseInput } from '@/components/ui'
import AuthShell from '@/components/layout/AuthShell.vue'

const router = useRouter()

const isLoading = ref(false)
const step = ref<'request' | 'reset'>('request')
const formError = ref('')
const errors = ref<Record<string, string>>({})

const form = reactive({
  email: '',
  token: '',
  newPassword: '',
  confirmPassword: ''
})

const handleSubmit = async () => {
  if (isLoading.value) return

  errors.value = {}
  formError.value = ''
  isLoading.value = true

  try {
    const response = await authApi.requestPasswordReset(form.email)
    if (response.success) {
      step.value = 'reset'
    }
  } catch (error: unknown) {
    formError.value = error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Não foi possível enviar o token'
      : 'Não foi possível enviar o token'
  } finally {
    isLoading.value = false
  }
}

const handleReset = async () => {
  if (isLoading.value) return

  errors.value = {}
  formError.value = ''

  if (!form.token) {
    errors.value.token = 'Token é obrigatório'
    return
  }

  if (!form.newPassword) {
    errors.value.newPassword = 'Nova senha é obrigatória'
    return
  }

  if (form.newPassword.length < 8) {
    errors.value.newPassword = 'A senha deve ter pelo menos 8 caracteres'
    return
  }

  if (form.newPassword !== form.confirmPassword) {
    errors.value.confirmPassword = 'As senhas não coincidem'
    return
  }

  isLoading.value = true

  try {
    const response = await authApi.resetPassword(form.token, form.newPassword)
    if (response.success) {
      router.push('/login')
    }
  } catch (error: unknown) {
    formError.value = error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Não foi possível redefinir a senha'
      : 'Não foi possível redefinir a senha'
  } finally {
    isLoading.value = false
  }
}
</script>
