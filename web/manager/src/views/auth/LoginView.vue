<template>
  <AuthShell
    title="Entre na sua conta"
    subtitle="Abra seu cofre com email e senha master."
    :icon="LockClosedIcon"
  >
    <div v-if="isCheckingSetup" class="space-y-5" aria-label="Carregando formulário">
      <div class="space-y-2">
        <div class="skeleton h-3.5 w-16"></div>
        <div class="skeleton h-11 w-full rounded-xl"></div>
      </div>
      <div class="space-y-2">
        <div class="skeleton h-3.5 w-24"></div>
        <div class="skeleton h-11 w-full rounded-xl"></div>
      </div>
      <div class="skeleton h-3.5 w-40"></div>
      <div class="skeleton h-11 w-full rounded-xl"></div>
    </div>

    <template v-else>
      <form class="space-y-5" @submit.prevent="handleLogin">
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

        <BaseInput
          v-model="form.masterPassword"
          type="password"
          label="Senha Master"
          placeholder="Digite sua senha master"
          autocomplete="current-password"
          required
          :error="errors.masterPassword"
          :left-icon="LockClosedIcon"
          show-password-toggle
        />

        <div class="flex justify-end">
          <router-link
            to="/forgot-password"
            class="rounded text-sm font-medium text-primary-700 transition-colors hover:text-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Esqueceu sua senha?
          </router-link>
        </div>

        <BaseButton
          type="submit"
          size="lg"
          block
          :loading="isLoading"
          :disabled="isLoading"
        >
          Entrar
        </BaseButton>
      </form>

      <p class="mt-6 text-center text-sm text-ink-muted">
        Ou
        <router-link
          to="/register"
          class="font-medium text-primary-700 transition-colors hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
        >
          crie uma nova conta
        </router-link>
      </p>
    </template>
  </AuthShell>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import authApi from '@/api/auth'
import { BaseButton, BaseInput } from '@/components/ui'
import AuthShell from '@/components/layout/AuthShell.vue'
import { getDeviceName } from '@/utils/deviceName'

const router = useRouter()
const authStore = useAuthStore()

const isLoading = ref(false)
const isCheckingSetup = ref(true)
const formError = ref('')
const errors = ref<Record<string, string>>({})

const form = reactive({
  email: '',
  masterPassword: ''
})

onMounted(async () => {
  try {
    const setup = await authApi.setupStatus()
    if (setup.needsSetup) router.replace('/register')
  } catch {
    // The normal login error handles an unavailable API.
  } finally {
    isCheckingSetup.value = false
  }
})

const handleLogin = async () => {
  if (isLoading.value) return

  errors.value = {}
  formError.value = ''
  isLoading.value = true

  try {
    const deviceName = getDeviceName()
    const response = await authStore.login({
      email: form.email,
      masterPassword: form.masterPassword,
      deviceName
    })

    if (response?.success && response?.data && authStore.isAuthenticated) {
      router.push('/dashboard')
    }
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
        formError.value = axiosError.response?.data?.message || (error instanceof Error ? error.message : 'Erro ao fazer login')
      }
    } else {
      formError.value = error instanceof Error ? error.message : 'Erro ao fazer login'
    }
  } finally {
    isLoading.value = false
  }
}
</script>
