<template>
  <AuthShell
    title="Crie sua conta"
    subtitle="O primeiro acesso cria o dono do cofre neste servidor."
    :icon="UserPlusIcon"
  >
    <div v-if="isCheckingSetup" class="space-y-5" aria-label="Carregando formulário">
      <div class="skeleton h-3.5 w-40"></div>
      <div class="skeleton h-11 w-full rounded-xl"></div>
      <div class="skeleton h-11 w-full rounded-xl"></div>
      <div class="skeleton h-11 w-full rounded-xl"></div>
      <div class="skeleton h-11 w-full rounded-xl"></div>
    </div>

    <template v-else>
      <form class="space-y-5" @submit.prevent="handleRegister">
        <div
          v-if="formError"
          class="rounded-xl border border-danger-200 bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700 dark:border-danger-900 dark:bg-danger-900/20 dark:text-danger-300"
          role="alert"
        >
          {{ formError }}
        </div>

        <p class="rounded-xl border border-line bg-surface-muted px-3.5 py-2.5 text-sm leading-relaxed text-ink-muted">
          O responsável pelo servidor deve autorizar previamente seu email para o cadastro inicial.
        </p>

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

        <div class="space-y-2.5">
          <BaseInput
            v-model="form.masterPassword"
            type="password"
            label="Senha Master"
            placeholder="Crie uma senha master forte"
            autocomplete="new-password"
            required
            :error="errors.masterPassword"
            :left-icon="LockClosedIcon"
            show-password-toggle
          />
          <PasswordStrength
            :score="passwordStrength.score"
            :feedback="passwordStrength.feedback"
          />
        </div>

        <BaseInput
          v-model="form.confirmPassword"
          type="password"
          label="Confirmar Senha Master"
          placeholder="Digite a senha novamente"
          autocomplete="new-password"
          required
          :error="errors.confirmPassword"
          :left-icon="LockClosedIcon"
          show-password-toggle
        />

        <label for="terms" class="flex items-start gap-2.5 rounded-xl border border-line px-3.5 py-3 text-sm text-ink-muted">
          <input
            id="terms"
            v-model="form.acceptTerms"
            type="checkbox"
            class="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-line bg-surface accent-primary-600 focus:ring-primary-500"
            required
          />
          <span>
            Eu aceito os
            <a href="#" class="font-medium text-primary-700 hover:text-primary-800 dark:text-primary-400">termos de uso</a>
            e a
            <a href="#" class="font-medium text-primary-700 hover:text-primary-800 dark:text-primary-400">política de privacidade</a>
          </span>
        </label>

        <BaseButton
          type="submit"
          size="lg"
          block
          :loading="isLoading"
          :disabled="!isFormValid || isLoading"
        >
          Criar Conta
        </BaseButton>
      </form>

      <p class="mt-6 text-center text-sm text-ink-muted">
        Ou
        <router-link
          to="/login"
          class="font-medium text-primary-700 transition-colors hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
        >
          faça login na sua conta
        </router-link>
      </p>

      <div class="mt-6 flex items-start gap-3 rounded-xl border border-primary-200 bg-primary-50/70 p-3.5 dark:border-primary-900 dark:bg-primary-900/20">
        <ShieldCheckIcon class="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-700 dark:text-primary-400" />
        <div>
          <h3 class="text-sm font-semibold text-primary-800 dark:text-primary-200">Segurança</h3>
          <p class="mt-0.5 text-xs leading-relaxed text-primary-700 dark:text-primary-300">
            Seus dados são criptografados no armazenamento. A segurança do servidor também protege o seu cofre.
          </p>
        </div>
      </div>
    </template>
  </AuthShell>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { EnvelopeIcon, LockClosedIcon, ShieldCheckIcon, UserPlusIcon } from '@heroicons/vue/24/outline'
import zxcvbn from 'zxcvbn'
import { useAuthStore } from '@/stores/auth'
import authApi from '@/api/auth'
import { BaseButton, BaseInput, PasswordStrength } from '@/components/ui'
import AuthShell from '@/components/layout/AuthShell.vue'

const router = useRouter()
const authStore = useAuthStore()

const isLoading = ref(false)
const isCheckingSetup = ref(true)
const formError = ref('')
const errors = ref<Record<string, string>>({})
const passwordStrength = ref<{ score: number; feedback: { warning: string; suggestions: string[] } }>({
  score: 0,
  feedback: { warning: '', suggestions: [] }
})

const form = reactive({
  email: '',
  masterPassword: '',
  confirmPassword: '',
  acceptTerms: false
})

const isFormValid = computed(() => {
  return Boolean(
    form.email &&
    form.masterPassword &&
    form.confirmPassword &&
    form.acceptTerms &&
    passwordStrength.value.score >= 2 &&
    form.masterPassword === form.confirmPassword
  )
})

onMounted(async () => {
  try {
    const setup = await authApi.setupStatus()
    if (!setup.needsSetup) router.replace('/login')
  } catch {
    // The registration form remains available if the status check is unavailable.
  } finally {
    isCheckingSetup.value = false
  }
})

const validatePassword = () => {
  if (form.masterPassword) {
    const result = zxcvbn(form.masterPassword)
    passwordStrength.value = {
      score: result.score,
      feedback: {
        warning: result.feedback.warning || '',
        suggestions: result.feedback.suggestions || []
      }
    }
  } else {
    passwordStrength.value = { score: 0, feedback: { warning: '', suggestions: [] } }
  }
}

watch(() => form.masterPassword, validatePassword)

const handleRegister = async () => {
  if (isLoading.value) return

  errors.value = {}
  formError.value = ''

  if (form.masterPassword !== form.confirmPassword) {
    errors.value.confirmPassword = 'As senhas não coincidem'
    return
  }

  if (passwordStrength.value.score < 2) {
    errors.value.masterPassword = 'A senha é muito fraca. Use uma senha mais forte.'
    return
  }

  isLoading.value = true

  try {
    await authStore.register({
      email: form.email,
      masterPassword: form.masterPassword
    })

    router.push('/login')
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { errors?: Array<{ field?: string; message?: string }>; message?: string } } }
      if (axiosError.response?.data?.errors) {
        errors.value = axiosError.response.data.errors.reduce((acc: Record<string, string>, err) => {
          if (err.field && err.message) {
            acc[err.field] = err.message
          }
          return acc
        }, {})
      } else {
        formError.value = axiosError.response?.data?.message || (error instanceof Error ? error.message : 'Erro ao criar conta')
      }
    } else {
      formError.value = error instanceof Error ? error.message : 'Erro ao criar conta'
    }
  } finally {
    isLoading.value = false
  }
}
</script>
