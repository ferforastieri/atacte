<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Header -->
    <AppHeader
      :show-logo="true"
      :show-navigation="true"
    />

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div class="space-y-4 sm:space-y-6">
        <!-- Security Settings -->
        <BaseCard class="dark:bg-gray-800 dark:border-gray-700">
          <div class="space-y-4">
            <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Segurança</h2>
            
            <div class="space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div class="flex-1">
                  <h3 class="text-sm font-medium text-gray-900 dark:text-white">Alterar Senha Master</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Atualize sua senha master</p>
                </div>
                <BaseButton variant="secondary" @click="showChangePasswordModal = true" class="w-full sm:w-auto">
                  Alterar
                </BaseButton>
              </div>
              
            </div>
          </div>
        </BaseCard>

        <!-- Preferences -->
        <BaseCard class="dark:bg-gray-800 dark:border-gray-700">
          <div class="space-y-4">
            <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Preferências</h2>
            
            <div class="space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div class="flex-1">
                  <h3 class="text-sm font-medium text-gray-900 dark:text-white">Tema</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Escolha o tema da aplicação</p>
                </div>
                <div class="flex items-center space-x-2">
                  <ThemeToggle />
                  <BaseSelect 
                    v-model="theme" 
                    @update:modelValue="(val) => changeTheme(val as string)"
                    class="w-32"
                  >
                    <option value="light">Claro</option>
                    <option value="dark">Escuro</option>
                    <option value="auto">Automático</option>
                  </BaseSelect>
                </div>
              </div>
              
            </div>
          </div>
        </BaseCard>

        <!-- Danger Zone -->
        <BaseCard class="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <div class="space-y-4">
            <h2 class="text-lg sm:text-xl font-semibold text-red-900 dark:text-red-300">Zona de Perigo</h2>
            
            <div class="space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div class="flex-1">
                  <h3 class="text-sm font-medium text-red-900 dark:text-red-300">Deletar Conta</h3>
                  <p class="text-sm text-red-700 dark:text-red-400">Esta ação não pode ser desfeita. Todos os dados serão perdidos permanentemente.</p>
                </div>
                <BaseButton variant="danger" @click="showDeleteAccountModal = true" class="w-full sm:w-auto">
                  Deletar Conta
                </BaseButton>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Change Password Modal -->
    <div v-if="showChangePasswordModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" @click.self="showChangePasswordModal = false">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Alterar Senha Master</h3>
        
        <form @submit.prevent="handleChangePassword" class="space-y-4">
          <BaseInput
            v-model="changePasswordForm.currentPassword"
            type="password"
            label="Senha Atual"
            placeholder="Digite sua senha atual"
            required
            :error="changePasswordErrors.currentPassword"
            show-password-toggle
          />

          <BaseInput
            v-model="changePasswordForm.newPassword"
            type="password"
            label="Nova Senha"
            placeholder="Digite a nova senha"
            required
            :error="changePasswordErrors.newPassword"
            show-password-toggle
          />

          <BaseInput
            v-model="changePasswordForm.confirmPassword"
            type="password"
            label="Confirmar Nova Senha"
            placeholder="Confirme a nova senha"
            required
            :error="changePasswordErrors.confirmPassword"
            show-password-toggle
          />

          <div class="flex justify-end space-x-3 pt-4">
            <BaseButton variant="secondary" @click="showChangePasswordModal = false" :disabled="isChangingPassword">
              Cancelar
            </BaseButton>
            <BaseButton variant="primary" type="submit" :loading="isChangingPassword">
              Alterar Senha
            </BaseButton>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Account Modal -->
    <div v-if="showDeleteAccountModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" @click.self="showDeleteAccountModal = false">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h3 class="text-lg font-semibold text-red-900 dark:text-red-300 mb-4">Deletar Conta</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente deletados, incluindo senhas, notas e configurações.
        </p>
        
        <form @submit.prevent="handleDeleteAccount" class="space-y-4">
          <BaseInput
            v-model="deleteAccountForm.password"
            type="password"
            label="Confirme sua senha"
            placeholder="Digite sua senha para confirmar"
            required
            :error="deleteAccountErrors.password"
            show-password-toggle
          />

          <div class="flex justify-end space-x-3 pt-4">
            <BaseButton variant="secondary" @click="showDeleteAccountModal = false" :disabled="isDeletingAccount">
              Cancelar
            </BaseButton>
            <BaseButton variant="danger" type="submit" :loading="isDeletingAccount">
              Deletar Conta
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/hooks/useToast'
import { AppHeader, BaseButton, BaseCard, BaseInput, BaseSelect } from '@/components/ui'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import authApi from '@/api/auth'
import usersApi from '@/api/users'

const router = useRouter()
const toast = useToast()
const themeStore = useThemeStore()
const authStore = useAuthStore()

const showChangePasswordModal = ref(false)
const showDeleteAccountModal = ref(false)
const isChangingPassword = ref(false)
const isDeletingAccount = ref(false)

const theme = ref('auto')

const changePasswordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const changePasswordErrors = ref<Record<string, string>>({})

const deleteAccountForm = ref({
  password: ''
})

const deleteAccountErrors = ref<Record<string, string>>({})


onMounted(async () => {
  await loadSettings()
})

const loadSettings = async () => {
  try {
    theme.value = themeStore.isDarkMode ? 'dark' : 'light'
  } catch (error) {
    console.error('Erro ao carregar configurações:', error)
  }
}

const changeTheme = (value?: string) => {
  const themeValue = value || theme.value
  if (themeValue === 'dark') {
    themeStore.isDarkMode = true
  } else if (themeValue === 'light') {
    themeStore.isDarkMode = false
  } else {
    
    themeStore.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  
  themeStore.applyTheme()
  localStorage.setItem('theme', themeStore.isDarkMode ? 'dark' : 'light')
  toast.success('Tema alterado!')
}

const handleChangePassword = async () => {
  changePasswordErrors.value = {}

  if (!changePasswordForm.value.currentPassword) {
    changePasswordErrors.value.currentPassword = 'Senha atual é obrigatória'
    return
  }

  if (!changePasswordForm.value.newPassword) {
    changePasswordErrors.value.newPassword = 'Nova senha é obrigatória'
    return
  }

  if (changePasswordForm.value.newPassword.length < 8) {
    changePasswordErrors.value.newPassword = 'A senha deve ter pelo menos 8 caracteres'
    return
  }

  if (changePasswordForm.value.newPassword !== changePasswordForm.value.confirmPassword) {
    changePasswordErrors.value.confirmPassword = 'As senhas não coincidem'
    return
  }

  isChangingPassword.value = true

  try {
    await authApi.changePassword(
      changePasswordForm.value.currentPassword,
      changePasswordForm.value.newPassword
    )

    toast.success('Senha alterada com sucesso! Você será deslogado.')
    
    changePasswordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    showChangePasswordModal.value = false

    setTimeout(() => {
      authStore.logout()
      router.push('/login')
    }, 2000)
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Erro ao alterar senha'
    
    if (errorMessage.includes('incorreta') || errorMessage.includes('atual')) {
      changePasswordErrors.value.currentPassword = errorMessage
    } else {
      toast.error(errorMessage)
    }
  } finally {
    isChangingPassword.value = false
  }
}

const handleDeleteAccount = async () => {
  deleteAccountErrors.value = {}

  if (!deleteAccountForm.value.password) {
    deleteAccountErrors.value.password = 'Senha é obrigatória'
    return
  }

  isDeletingAccount.value = true

  try {
    await usersApi.deleteAccount(deleteAccountForm.value.password)

    toast.success('Conta deletada com sucesso')
    
    setTimeout(() => {
      authStore.logout()
      router.push('/login')
    }, 2000)
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Erro ao deletar conta'
    
    if (errorMessage.includes('incorreta') || errorMessage.includes('Senha')) {
      deleteAccountErrors.value.password = errorMessage
    } else {
      toast.error(errorMessage)
    }
  } finally {
    isDeletingAccount.value = false
  }
}

</script>

