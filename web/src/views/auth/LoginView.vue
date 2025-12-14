<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <Logo :size="48" text-size="text-2xl" class="justify-center mb-4" />
        <h2 class="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
          Entre na sua conta
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Ou
          <router-link to="/register" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
            crie uma nova conta
          </router-link>
        </p>
      </div>

      <BaseCard>
        <form @submit.prevent="handleLogin" class="space-y-6">
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
            placeholder="Digite sua senha master"
            required
            :error="errors.masterPassword"
            :left-icon="LockClosedIcon"
            show-password-toggle
          />

          <div class="flex items-center justify-between">
            <div class="text-sm">
              <router-link to="/forgot-password" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                Esqueceu sua senha?
              </router-link>
            </div>
          </div>

          <BaseButton
            type="submit"
            variant="primary"
            size="md"
            :loading="isLoading"
            class="w-full"
          >
            Entrar
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
import { LockClosedIcon, EnvelopeIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { BaseButton, BaseInput, BaseCard, Logo } from '@/components/ui'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const isLoading = ref(false)
const errors = ref<Record<string, string>>({})

const form = reactive({
  email: '',
  masterPassword: ''
})

const getDeviceName = (): string => {
  const ua = navigator.userAgent.toLowerCase()
  let os = 'Dispositivo Web'
  
  if (ua.includes('win')) {
    os = 'Windows'
  } else if (ua.includes('mac')) {
    os = 'macOS'
  } else if (ua.includes('linux') && !ua.includes('android')) {
    os = 'Linux'
  } else if (ua.includes('android')) {
    os = 'Android'
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS'
  }
  
  let browser = 'Browser'
  if (ua.includes('edg')) {
    browser = 'Edge'
  } else if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome'
  } else if (ua.includes('firefox')) {
    browser = 'Firefox'
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari'
  }
  
  return `${os} - ${browser}`
}

const handleLogin = async () => {
  errors.value = {}
  isLoading.value = true

  try {
    const deviceName = getDeviceName()
    const response = await authStore.login({
      email: form.email,
      masterPassword: form.masterPassword,
      deviceName: deviceName
    })

    if (response?.data?.requiresTrust) {
      const event = new CustomEvent('device-trust-required', {
        detail: {
          sessionId: response.data.sessionId,
          deviceName: deviceName,
          ipAddress: 'Desconhecido'
        }
      })
      window.dispatchEvent(event)
      isLoading.value = false
      return
    }

    if (response?.success && response?.data) {
      if (authStore.isAuthenticated) {
        toast.success('Login realizado com sucesso!')
        router.push('/dashboard')
      } else {
        toast.error('Erro ao autenticar. Tente novamente.')
      }
    } else {
      toast.error(response?.message || 'Erro ao fazer login. Tente novamente.')
    }
  } catch (error: any) {
    if (error.response?.data?.errors) {
      errors.value = error.response.data.errors.reduce((acc: any, err: any) => {
        acc[err.field] = err.message
        return acc
      }, {})
    } else {
      toast.error(error.message || 'Erro ao fazer login')
    }
  } finally {
    isLoading.value = false
  }
}

</script>

