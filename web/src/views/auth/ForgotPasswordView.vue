<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <Logo :size="48" text-size="text-2xl" class="justify-center mb-4" />
        <h2 class="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
          Recuperar Senha
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Digite seu email para receber um token de recuperação
        </p>
      </div>

      <!-- Form -->
      <BaseCard>
        <form @submit.prevent="handleSubmit" class="space-y-6" v-if="step === 'request'">
          <BaseInput
            v-model="form.email"
            type="email"
            label="Email"
            placeholder="seu@email.com"
            required
            :error="errors.email"
            left-icon="EnvelopeIcon"
          />

          <div class="text-sm text-gray-600 dark:text-gray-400 text-center">
            <p>Se o email existir, você receberá um token de recuperação.</p>
            <p v-if="devToken" class="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900 rounded text-xs break-all">
              <strong>Token (dev):</strong> {{ devToken }}
            </p>
          </div>

          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            :loading="isLoading"
            class="w-full"
          >
            Enviar Token
          </BaseButton>

          <BaseButton
            type="button"
            variant="ghost"
            @click="$router.push('/login')"
            class="w-full"
          >
            Voltar para Login
          </BaseButton>
        </form>

        <form @submit.prevent="handleReset" class="space-y-6" v-else>
          <BaseInput
            v-model="form.token"
            type="text"
            label="Token"
            placeholder="Token de recuperação"
            required
            :error="errors.token"
            left-icon="KeyIcon"
          />

          <BaseInput
            v-model="form.newPassword"
            type="password"
            label="Nova Senha"
            placeholder="Mínimo 8 caracteres"
            required
            :error="errors.newPassword"
            left-icon="LockClosedIcon"
            show-password-toggle
          />

          <BaseInput
            v-model="form.confirmPassword"
            type="password"
            label="Confirmar Senha"
            placeholder="Digite novamente"
            required
            :error="errors.confirmPassword"
            left-icon="LockClosedIcon"
            show-password-toggle
          />

          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            :loading="isLoading"
            class="w-full"
          >
            Redefinir Senha
          </BaseButton>

          <BaseButton
            type="button"
            variant="ghost"
            @click="step = 'request'"
            class="w-full"
          >
            Voltar
          </BaseButton>
        </form>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/hooks/useToast'
import { EnvelopeIcon, LockClosedIcon, KeyIcon } from '@heroicons/vue/24/outline'
import authApi from '@/api/auth'
import { BaseButton, BaseInput, BaseCard, Logo } from '@/components/ui'

const router = useRouter()
const toast = useToast()

const isLoading = ref(false)
const step = ref<'request' | 'reset'>('request')
const devToken = ref('')
const errors = ref<Record<string, string>>({})

const form = reactive({
  email: '',
  token: '',
  newPassword: '',
  confirmPassword: ''
})

const handleSubmit = async () => {
  errors.value = {}
  isLoading.value = true

  try {
    const response = await authApi.requestPasswordReset(form.email)
    
    if (response.success) {
      toast.success(response.message || 'Token enviado com sucesso!')
      
      // Em desenvolvimento, mostrar o token
      if (response.data?.token) {
        devToken.value = response.data.token
        form.token = response.data.token
      }
      
      step.value = 'reset'
    } else {
      toast.error(response.message || 'Erro ao solicitar recuperação')
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Erro ao solicitar recuperação')
  } finally {
    isLoading.value = false
  }
}

const handleReset = async () => {
  errors.value = {}

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
      toast.success('Senha redefinida com sucesso!')
      router.push('/login')
    } else {
      toast.error(response.message || 'Erro ao redefinir senha')
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Erro ao redefinir senha')
  } finally {
    isLoading.value = false
  }
}
</script>

