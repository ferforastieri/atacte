<template>
  <div class="min-h-screen bg-canvas">
    <AppHeader :show-logo="true" :show-navigation="true" />

    <main class="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8 md:pb-10 lg:px-10">
      <section class="mb-6">
        <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-700 dark:text-primary-400">Administração</p>
        <h1 class="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Gerenciar Usuários</h1>
        <p class="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-muted">
          Contas com acesso a este servidor, papéis e status.
        </p>
      </section>

      <BaseCard>
        <div v-if="isLoading" class="p-1">
          <SkeletonTable :rows="5" :columns="6" />
        </div>

        <div v-else-if="users.length > 0">
          <div class="table-shell">
            <table class="min-w-full divide-y divide-line">
              <thead class="table-head">
                <tr>
                  <th class="px-4 py-3">Email</th>
                  <th class="px-4 py-3">Nome</th>
                  <th class="px-4 py-3">Role</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3">Último Login</th>
                  <th class="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-line bg-surface">
                <tr v-for="user in users" :key="user.id" class="table-row">
                  <td class="whitespace-nowrap px-4 py-3.5 text-sm font-medium text-ink">
                    {{ user.email }}
                  </td>
                  <td class="whitespace-nowrap px-4 py-3.5 text-sm text-ink-muted">
                    {{ user.name || '-' }}
                  </td>
                  <td class="whitespace-nowrap px-4 py-3.5">
                    <span :class="user.role === 'ADMIN' ? 'pill-accent' : 'pill-neutral'">
                      {{ user.role === 'ADMIN' ? 'Admin' : 'Usuário' }}
                    </span>
                  </td>
                  <td class="whitespace-nowrap px-4 py-3.5">
                    <span :class="user.isActive ? 'pill-success' : 'pill-danger'">
                      {{ user.isActive ? 'Ativo' : 'Inativo' }}
                    </span>
                  </td>
                  <td class="whitespace-nowrap px-4 py-3.5 text-sm text-ink-muted">
                    {{ user.lastLogin ? formatDate(user.lastLogin) : 'Nunca' }}
                  </td>
                  <td class="whitespace-nowrap px-4 py-3.5 text-right">
                    <div class="flex justify-end gap-1.5">
                      <BaseButton variant="ghost" size="sm" @click="openEditModal(user)">
                        <PencilIcon class="h-4 w-4" />
                        <span class="hidden sm:inline">Editar</span>
                      </BaseButton>
                      <BaseButton variant="ghost" size="sm" @click="openPasswordModal(user)">
                        <KeyIcon class="h-4 w-4" />
                        <span class="hidden sm:inline">Senha</span>
                      </BaseButton>
                      <BaseButton
                        variant="ghost"
                        size="sm"
                        class="text-danger-600 hover:bg-danger-50 hover:text-danger-700 dark:text-danger-400 dark:hover:bg-danger-900/20"
                        @click="openDeleteModal(user)"
                      >
                        <TrashIcon class="h-4 w-4" />
                        <span class="hidden sm:inline">Deletar</span>
                      </BaseButton>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <Pagination
            class="mt-4"
            :current-page="pagination.currentPage"
            :total-pages="pagination.totalPages"
            :total="pagination.total"
            :limit="pagination.limit"
            :busy="isLoading"
            @previous="previousPage"
            @next="nextPage"
            @go-to-page="goToPage"
          />
        </div>

        <EmptyState
          v-else
          :icon="UserGroupIcon"
          title="Nenhum usuário encontrado"
          description="Ainda não há contas cadastradas neste servidor."
        />
      </BaseCard>
    </main>

    <BaseModal
      :show="showEditModal"
      title="Editar Usuário"
      subtitle="Atualize os dados e o acesso desta conta."
      :icon="PencilSquareIcon"
      size="md"
      :close-on-overlay="!isSaving"
      :close-on-escape="!isSaving"
      :closable="!isSaving"
      @close="closeEditModal"
    >
      <form class="space-y-4" @submit.prevent="saveUser">
        <div
          v-if="editFormError"
          class="rounded-xl border border-danger-200 bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700 dark:border-danger-900 dark:bg-danger-900/20 dark:text-danger-300"
          role="alert"
        >
          {{ editFormError }}
        </div>

        <BaseInput
          v-model="editingUser.email"
          type="email"
          label="Email"
          autocomplete="email"
          required
          :error="editErrors.email"
          :left-icon="EnvelopeIcon"
        />

        <BaseInput
          v-model="editingUser.name"
          label="Nome"
          :error="editErrors.name"
          :left-icon="UserIcon"
        />

        <BaseInput
          v-model="editingUser.phoneNumber"
          type="tel"
          label="Telefone"
          :left-icon="PhoneIcon"
        />

        <BaseSelect v-model="editingUser.role" label="Role" required>
          <option value="USER">Usuário</option>
          <option value="ADMIN">Admin</option>
        </BaseSelect>

        <BaseInput
          v-model="editingUserPassword"
          type="password"
          label="Nova Senha (opcional)"
          help="Deixe em branco para não alterar a senha"
          autocomplete="new-password"
          :error="editErrors.password"
          :left-icon="LockClosedIcon"
          show-password-toggle
        />

        <BaseSwitch
          v-model="editingUser.isActive"
          label="Usuário Ativo"
          description="Contas inativas não conseguem entrar."
        />
      </form>

      <template #footer>
        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <BaseButton variant="ghost" :disabled="isSaving" @click="closeEditModal">
            Cancelar
          </BaseButton>
          <BaseButton type="submit" :loading="isSaving" :disabled="isSaving" @click="saveUser">
            Salvar
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <BaseModal
      :show="showPasswordModal"
      title="Alterar Senha"
      subtitle="Defina uma nova senha para esta conta."
      :icon="KeyIcon"
      size="sm"
      :close-on-overlay="!isChangingPassword"
      :close-on-escape="!isChangingPassword"
      :closable="!isChangingPassword"
      @close="closePasswordModal"
    >
      <form class="space-y-4" @submit.prevent="changePassword">
        <div
          v-if="passwordFormError"
          class="rounded-xl border border-danger-200 bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700 dark:border-danger-900 dark:bg-danger-900/20 dark:text-danger-300"
          role="alert"
        >
          {{ passwordFormError }}
        </div>

        <BaseInput
          v-model="newPassword"
          type="password"
          label="Nova Senha"
          required
          help="A senha deve ter pelo menos 8 caracteres"
          autocomplete="new-password"
          :error="passwordErrors.newPassword"
          :left-icon="LockClosedIcon"
          show-password-toggle
        />
      </form>

      <template #footer>
        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <BaseButton variant="ghost" :disabled="isChangingPassword" @click="closePasswordModal">
            Cancelar
          </BaseButton>
          <BaseButton type="submit" :loading="isChangingPassword" :disabled="isChangingPassword" @click="changePassword">
            Alterar Senha
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <ConfirmModal
      :show="showDeleteModal"
      title="Deletar Usuário"
      :message="`Tem certeza que deseja deletar o usuário ${deletingUserEmail}? Esta ação não pode ser desfeita.`"
      confirm-text="Deletar"
      cancel-text="Cancelar"
      variant="danger"
      :loading="isDeleting"
      @confirm="confirmDeleteUser"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  EnvelopeIcon,
  KeyIcon,
  LockClosedIcon,
  PencilIcon,
  PencilSquareIcon,
  PhoneIcon,
  TrashIcon,
  UserGroupIcon,
  UserIcon
} from '@heroicons/vue/24/outline'
import {
  AppHeader,
  BaseButton,
  BaseCard,
  BaseInput,
  BaseModal,
  BaseSelect,
  BaseSwitch,
  ConfirmModal,
  EmptyState,
  Pagination,
  SkeletonTable
} from '@/components/ui'
import usersApi, { type AdminUser } from '@/api/users'
import { useToast } from '@/hooks/useToast'

const toast = useToast()

const users = ref<AdminUser[]>([])
const isLoading = ref(true)
const isSaving = ref(false)
const isChangingPassword = ref(false)
const isDeleting = ref(false)
const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  total: 0,
  limit: 10
})

const showEditModal = ref(false)
const showPasswordModal = ref(false)
const showDeleteModal = ref(false)
const editFormError = ref('')
const passwordFormError = ref('')
const editErrors = ref<Record<string, string>>({})
const passwordErrors = ref<Record<string, string>>({})

type EditableUser = {
  id: string
  email: string
  name: string
  phoneNumber: string
  role: 'USER' | 'ADMIN'
  isActive: boolean
}

const editingUser = ref<EditableUser>({
  id: '',
  email: '',
  name: '',
  phoneNumber: '',
  role: 'USER',
  isActive: true
})
const selectedUserId = ref('')
const deletingUserId = ref('')
const deletingUserEmail = ref('')
const newPassword = ref('')
const editingUserPassword = ref('')

const fetchUsers = async () => {
  isLoading.value = true
  try {
    const offset = (pagination.value.currentPage - 1) * pagination.value.limit
    const response = await usersApi.getAllUsers(pagination.value.limit, offset)
    if (response.success && response.data) {
      users.value = response.data
      if (response.pagination) {
        pagination.value.total = response.pagination.total
        pagination.value.totalPages = Math.max(1, Math.ceil(response.pagination.total / pagination.value.limit))
      }
    }
  } catch {
    toast.error('Não foi possível carregar os usuários.')
  } finally {
    isLoading.value = false
  }
}

const goToPage = (page: number) => {
  pagination.value.currentPage = page
  fetchUsers()
}

const nextPage = () => {
  if (pagination.value.currentPage < pagination.value.totalPages) {
    pagination.value.currentPage++
    fetchUsers()
  }
}

const previousPage = () => {
  if (pagination.value.currentPage > 1) {
    pagination.value.currentPage--
    fetchUsers()
  }
}

const openEditModal = (user: AdminUser) => {
  editingUser.value = {
    id: user.id,
    email: user.email,
    name: user.name || '',
    phoneNumber: user.phoneNumber || '',
    role: user.role,
    isActive: user.isActive
  }
  editingUserPassword.value = ''
  editErrors.value = {}
  editFormError.value = ''
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editingUser.value = {
    id: '',
    email: '',
    name: '',
    phoneNumber: '',
    role: 'USER',
    isActive: true
  }
  editingUserPassword.value = ''
  editErrors.value = {}
  editFormError.value = ''
}

const openPasswordModal = (user: AdminUser) => {
  selectedUserId.value = user.id
  newPassword.value = ''
  passwordErrors.value = {}
  passwordFormError.value = ''
  showPasswordModal.value = true
}

const closePasswordModal = () => {
  showPasswordModal.value = false
  selectedUserId.value = ''
  newPassword.value = ''
  passwordErrors.value = {}
  passwordFormError.value = ''
}

const saveUser = async () => {
  if (!editingUser.value.id || isSaving.value) return

  editErrors.value = {}
  editFormError.value = ''

  if (!editingUser.value.email.trim()) {
    editErrors.value.email = 'Email é obrigatório'
    return
  }

  if (editingUserPassword.value && editingUserPassword.value.length < 8) {
    editErrors.value.password = 'A senha deve ter pelo menos 8 caracteres'
    return
  }

  isSaving.value = true
  try {
    await usersApi.updateUser(editingUser.value.id, {
      email: editingUser.value.email,
      name: editingUser.value.name,
      phoneNumber: editingUser.value.phoneNumber,
      role: editingUser.value.role,
      isActive: editingUser.value.isActive
    })

    if (editingUserPassword.value) {
      await usersApi.changeUserPassword(editingUser.value.id, editingUserPassword.value)
    }

    closeEditModal()
    await fetchUsers()
  } catch (error: unknown) {
    editFormError.value = error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Não foi possível salvar o usuário'
      : 'Não foi possível salvar o usuário'
  } finally {
    isSaving.value = false
  }
}

const changePassword = async () => {
  if (!selectedUserId.value || !newPassword.value || isChangingPassword.value) return

  passwordErrors.value = {}
  passwordFormError.value = ''

  if (newPassword.value.length < 8) {
    passwordErrors.value.newPassword = 'A senha deve ter pelo menos 8 caracteres'
    return
  }

  isChangingPassword.value = true
  try {
    await usersApi.changeUserPassword(selectedUserId.value, newPassword.value)
    closePasswordModal()
    toast.success('Senha do usuário alterada.')
  } catch (error: unknown) {
    passwordFormError.value = error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Não foi possível alterar a senha'
      : 'Não foi possível alterar a senha'
  } finally {
    isChangingPassword.value = false
  }
}

const openDeleteModal = (user: AdminUser) => {
  deletingUserId.value = user.id
  deletingUserEmail.value = user.email
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  if (isDeleting.value) return
  showDeleteModal.value = false
  deletingUserId.value = ''
  deletingUserEmail.value = ''
}

const confirmDeleteUser = async () => {
  if (!deletingUserId.value || isDeleting.value) return

  isDeleting.value = true
  try {
    await usersApi.deleteUser(deletingUserId.value)
    closeDeleteModal()
    await fetchUsers()
    toast.success('Usuário deletado.')
  } catch {
    toast.error('Não foi possível deletar o usuário.')
  } finally {
    isDeleting.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchUsers()
})
</script>
