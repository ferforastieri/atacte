<template>
  <div class="min-h-screen bg-canvas">
    <AppHeader :show-logo="true" :show-navigation="true" />

    <main class="mx-auto w-full max-w-4xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8 md:pb-10 lg:px-10">
      <section class="mb-6">
        <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-700 dark:text-primary-400">Conta</p>
        <h1 class="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Configurações</h1>
        <p class="mt-1.5 text-sm leading-relaxed text-ink-muted">Segurança, aparência e ações da conta.</p>
      </section>

      <div class="space-y-5">
        <BaseCard>
          <div class="mb-5 flex items-center gap-3">
            <div class="icon-tile"><ShieldCheckIcon class="h-5 w-5" /></div>
            <div>
              <h2 class="section-title">Segurança</h2>
              <p class="text-xs text-ink-muted">Proteja o acesso ao seu cofre.</p>
            </div>
          </div>

          <div class="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 class="text-sm font-medium text-ink">Alterar Senha Master</h3>
              <p class="mt-0.5 text-sm text-ink-muted">Atualize sua senha master.</p>
            </div>
            <BaseButton variant="secondary" class="sm:w-auto" @click="showChangePasswordModal = true">
              Alterar
            </BaseButton>
          </div>
        </BaseCard>

        <BaseCard>
          <div class="mb-5 flex items-center gap-3">
            <div class="icon-tile"><SwatchIcon class="h-5 w-5" /></div>
            <div>
              <h2 class="section-title">Preferências</h2>
              <p class="text-xs text-ink-muted">Escolha como o Atacte aparece para você.</p>
            </div>
          </div>

          <div class="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 class="text-sm font-medium text-ink">Tema</h3>
              <p class="mt-0.5 text-sm text-ink-muted">Claro, escuro ou automático.</p>
            </div>
            <div class="flex items-center gap-2">
              <ThemeToggle />
              <BaseSelect
                v-model="theme"
                class="w-36"
                @update:modelValue="(val) => changeTheme(String(val))"
              >
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
                <option value="auto">Automático</option>
              </BaseSelect>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="border-danger-200 bg-danger-50/40 dark:border-danger-900 dark:bg-danger-900/10">
          <div class="mb-5 flex items-center gap-3">
            <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-danger-100 text-danger-600 dark:bg-danger-900/40 dark:text-danger-300">
              <ExclamationTriangleIcon class="h-5 w-5" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-danger-900 dark:text-danger-300">Zona de Perigo</h2>
              <p class="text-xs text-danger-700 dark:text-danger-400">Ações que não podem ser desfeitas.</p>
            </div>
          </div>

          <div class="flex flex-col gap-3 border-t border-danger-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-danger-900">
            <div>
              <h3 class="text-sm font-medium text-ink">Deletar Conta</h3>
              <p class="mt-0.5 text-sm text-ink-muted">Esta ação não pode ser desfeita. Todos os dados serão perdidos permanentemente.</p>
            </div>
            <BaseButton variant="danger" class="sm:w-auto" @click="showDeleteAccountModal = true">
              Deletar Conta
            </BaseButton>
          </div>
        </BaseCard>
      </div>
    </main>

    <BaseModal
      :show="showChangePasswordModal"
      title="Alterar Senha Master"
      subtitle="Você será desconectado depois da troca."
      :icon="LockClosedIcon"
      size="md"
      :close-on-overlay="!isChangingPassword"
      :close-on-escape="!isChangingPassword"
      :closable="!isChangingPassword"
      @close="closeChangePasswordModal"
    >
      <form class="space-y-4" @submit.prevent="handleChangePassword">
        <div
          v-if="changePasswordFormError"
          class="rounded-xl border border-danger-200 bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700 dark:border-danger-900 dark:bg-danger-900/20 dark:text-danger-300"
          role="alert"
        >
          {{ changePasswordFormError }}
        </div>

        <BaseInput
          v-model="changePasswordForm.currentPassword"
          type="password"
          label="Senha Atual"
          placeholder="Digite sua senha atual"
          autocomplete="current-password"
          required
          :error="changePasswordErrors.currentPassword"
          :left-icon="LockClosedIcon"
          show-password-toggle
        />

        <BaseInput
          v-model="changePasswordForm.newPassword"
          type="password"
          label="Nova Senha"
          placeholder="Digite a nova senha"
          autocomplete="new-password"
          required
          :error="changePasswordErrors.newPassword"
          :left-icon="LockClosedIcon"
          show-password-toggle
        />

        <BaseInput
          v-model="changePasswordForm.confirmPassword"
          type="password"
          label="Confirmar Nova Senha"
          placeholder="Confirme a nova senha"
          autocomplete="new-password"
          required
          :error="changePasswordErrors.confirmPassword"
          :left-icon="LockClosedIcon"
          show-password-toggle
        />
      </form>

      <template #footer>
        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <BaseButton variant="ghost" :disabled="isChangingPassword" @click="closeChangePasswordModal">
            Cancelar
          </BaseButton>
          <BaseButton type="submit" :loading="isChangingPassword" :disabled="isChangingPassword" @click="handleChangePassword">
            Alterar Senha
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <BaseModal
      :show="showDeleteAccountModal"
      title="Deletar Conta"
      subtitle="Todos os dados do cofre serão apagados."
      :icon="ExclamationTriangleIcon"
      size="md"
      :close-on-overlay="!isDeletingAccount"
      :close-on-escape="!isDeletingAccount"
      :closable="!isDeletingAccount"
      @close="closeDeleteAccountModal"
    >
      <form class="space-y-4" @submit.prevent="handleDeleteAccount">
        <div
          v-if="deleteAccountFormError"
          class="rounded-xl border border-danger-200 bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700 dark:border-danger-900 dark:bg-danger-900/20 dark:text-danger-300"
          role="alert"
        >
          {{ deleteAccountFormError }}
        </div>

        <p class="rounded-xl border border-danger-200 bg-danger-50 p-3.5 text-sm leading-relaxed text-danger-700 dark:border-danger-900 dark:bg-danger-900/20 dark:text-danger-300">
          Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente deletados, incluindo senhas, notas e configurações.
        </p>

        <BaseInput
          v-model="deleteAccountForm.password"
          type="password"
          label="Confirme sua senha"
          placeholder="Digite sua senha para confirmar"
          autocomplete="current-password"
          required
          :error="deleteAccountErrors.password"
          :left-icon="LockClosedIcon"
          show-password-toggle
        />
      </form>

      <template #footer>
        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <BaseButton variant="ghost" :disabled="isDeletingAccount" @click="closeDeleteAccountModal">
            Cancelar
          </BaseButton>
          <BaseButton variant="danger" type="submit" :loading="isDeletingAccount" :disabled="isDeletingAccount" @click="handleDeleteAccount">
            Deletar Conta
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ExclamationTriangleIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  SwatchIcon
} from '@heroicons/vue/24/outline'
import {
  AppHeader,
  BaseButton,
  BaseCard,
  BaseInput,
  BaseModal,
  BaseSelect,
  ThemeToggle
} from '@/components/ui'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import authApi from '@/api/auth'
import usersApi from '@/api/users'

const router = useRouter()
const themeStore = useThemeStore()
const authStore = useAuthStore()

const showChangePasswordModal = ref(false)
const showDeleteAccountModal = ref(false)
const isChangingPassword = ref(false)
const isDeletingAccount = ref(false)
const theme = ref('auto')
const changePasswordFormError = ref('')
const deleteAccountFormError = ref('')

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

onMounted(() => {
  theme.value = themeStore.isDarkMode ? 'dark' : 'light'
})

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
}

const closeChangePasswordModal = () => {
  if (isChangingPassword.value) return
  showChangePasswordModal.value = false
  changePasswordErrors.value = {}
  changePasswordFormError.value = ''
}

const closeDeleteAccountModal = () => {
  if (isDeletingAccount.value) return
  showDeleteAccountModal.value = false
  deleteAccountErrors.value = {}
  deleteAccountFormError.value = ''
}

const handleChangePassword = async () => {
  if (isChangingPassword.value) return

  changePasswordErrors.value = {}
  changePasswordFormError.value = ''

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
  } catch (error: unknown) {
    const errorMessage = error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Erro ao alterar senha'
      : error instanceof Error ? error.message : 'Erro ao alterar senha'

    if (errorMessage.includes('incorreta') || errorMessage.includes('atual')) {
      changePasswordErrors.value.currentPassword = errorMessage
    } else {
      changePasswordFormError.value = errorMessage
    }
  } finally {
    isChangingPassword.value = false
  }
}

const handleDeleteAccount = async () => {
  if (isDeletingAccount.value) return

  deleteAccountErrors.value = {}
  deleteAccountFormError.value = ''

  if (!deleteAccountForm.value.password) {
    deleteAccountErrors.value.password = 'Senha é obrigatória'
    return
  }

  isDeletingAccount.value = true

  try {
    await usersApi.deleteAccount(deleteAccountForm.value.password)

    setTimeout(() => {
      authStore.logout()
      router.push('/login')
    }, 2000)
  } catch (error: unknown) {
    const errorMessage = error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Erro ao deletar conta'
      : error instanceof Error ? error.message : 'Erro ao deletar conta'

    if (errorMessage.includes('incorreta') || errorMessage.includes('Senha')) {
      deleteAccountErrors.value.password = errorMessage
    } else {
      deleteAccountFormError.value = errorMessage
    }
  } finally {
    isDeletingAccount.value = false
  }
}
</script>
