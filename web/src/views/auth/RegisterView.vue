<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
          <UserPlusIcon class="h-8 w-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 class="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
          Crie sua conta
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Ou
          <router-link to="/login" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
            faça login na sua conta
          </router-link>
        </p>
      </div>

      <BaseCard>
        <form @submit.prevent="handleRegister" class="space-y-6">
          <BaseInput
            v-model="form.email"
            type="email"
            label="Email"
            placeholder="seu@email.com"
            required
            :error="errors.email"
            :left-icon="EnvelopeIcon"
          />

          <BaseInput
            v-model="form.masterPassword"
            type="password"
            label="Senha Master"
            placeholder="Crie uma senha master forte"
            required
            :error="errors.masterPassword"
            :left-icon="LockClosedIcon"
            show-password-toggle
            @input="validatePassword"
          />

          <PasswordStrength
            :score="passwordStrength.score"
            :feedback="passwordStrength.feedback"
          />

          <BaseInput
            v-model="form.confirmPassword"
            type="password"
            label="Confirmar Senha Master"
            placeholder="Digite a senha novamente"
            required
            :error="errors.confirmPassword"
            :left-icon="LockClosedIcon"
            show-password-toggle
          />

          <div class="flex items-start">
            <input
              id="terms"
              v-model="form.acceptTerms"
              type="checkbox"
              class="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              required
            />
            <label for="terms" class="ml-2 block text-sm text-gray-900 dark:text-gray-100">
              Eu aceito os
              <a href="#" class="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">termos de uso</a>
              e
              <a href="#" class="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">política de privacidade</a>
            </label>
          </div>

          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            :loading="isLoading"
            :disabled="!isFormValid"
            class="w-full"
          >
            Criar Conta
          </BaseButton>
        </form>
      </BaseCard>

      <BaseCard variant="outlined" class="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <div class="text-center">
          <ShieldCheckIcon class="mx-auto h-8 w-8 text-green-600 dark:text-green-400" />
          <h3 class="mt-2 text-sm font-medium text-green-800 dark:text-green-200">Segurança</h3>
          <p class="mt-1 text-sm text-green-600 dark:text-green-300">
            Suas senhas são criptografadas e apenas você tem acesso a elas.
          </p>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/hooks/useToast'
import { UserPlusIcon, EnvelopeIcon, LockClosedIcon, ShieldCheckIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { BaseButton, BaseInput, BaseCard, PasswordStrength } from '@/components/ui'
import zxcvbn from 'zxcvbn'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const isLoading = ref(false)
const errors = ref<Record<string, string>>({})
const passwordStrength = ref<{ score: number; feedback: { warning: string; suggestions: string[] } }>({ score: 0, feedback: { warning: '', suggestions: [] } })

const form = reactive({
  email: '',
  masterPassword: '',
  confirmPassword: '',
  acceptTerms: false
})

const isFormValid = computed(() => {
  return (
    form.email &&
    form.masterPassword &&
    form.confirmPassword &&
    form.acceptTerms &&
    passwordStrength.value.score >= 2 &&
    form.masterPassword === form.confirmPassword
  )
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

const handleRegister = async () => {
  errors.value = {}
  
  
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

    toast.success('Conta criada com sucesso! Agora você pode fazer login.')
    router.push('/login')
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { errors?: Array<{ field?: string; message?: string }> } } };
      if (axiosError.response?.data?.errors) {
        errors.value = axiosError.response.data.errors.reduce((acc: Record<string, string>, err) => {
          if (err.field && err.message) {
            acc[err.field] = err.message;
          }
          return acc;
        }, {});
      } else {
        const errorMessage = axiosError.response?.data && typeof axiosError.response.data === 'object' && 'message' in axiosError.response.data
          ? String(axiosError.response.data.message)
          : error instanceof Error ? error.message : 'Erro ao criar conta';
        toast.error(errorMessage);
      }
    } else {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar conta';
      toast.error(errorMessage);
    }
  } finally {
    isLoading.value = false
  }
}
</script>

