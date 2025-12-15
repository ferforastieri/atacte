<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <AppHeader
      :show-logo="true"
      :show-navigation="true"
    />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BaseCard class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Gerenciar Usuários
        </h1>

        <div v-if="isLoading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">Carregando usuários...</p>
        </div>

        <div v-else-if="users.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nome
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Último Login
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="user in users" :key="user.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {{ user.email }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {{ user.name || '-' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-semibold rounded-full',
                      user.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    ]"
                  >
                    {{ user.role === 'ADMIN' ? 'Admin' : 'Usuário' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-semibold rounded-full',
                      user.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    ]"
                  >
                    {{ user.isActive ? 'Ativo' : 'Inativo' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ user.lastLogin ? formatDate(user.lastLogin) : 'Nunca' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end gap-2">
                    <BaseButton
                      variant="ghost"
                      size="sm"
                      @click="openEditModal(user)"
                      class="flex items-center gap-1"
                    >
                      <PencilIcon class="h-4 w-4" />
                      Editar
                    </BaseButton>
                    <BaseButton
                      variant="ghost"
                      size="sm"
                      @click="openPasswordModal(user)"
                      class="flex items-center gap-1"
                    >
                      <KeyIcon class="h-4 w-4" />
                      Senha
                    </BaseButton>
                    <BaseButton
                      variant="ghost"
                      size="sm"
                      @click="openDeleteModal(user)"
                      class="flex items-center gap-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <TrashIcon class="h-4 w-4" />
                      Deletar
                    </BaseButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="text-center py-12">
          <UserGroupIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Nenhum usuário encontrado</h3>
        </div>
      </BaseCard>
    </div>

    <BaseModal
      :show="showEditModal"
      title="Editar Usuário"
      @close="closeEditModal"
    >
      <form @submit.prevent="saveUser" class="space-y-4">
        <BaseInput
          v-model="editingUser.email"
          label="Email"
          type="email"
          required
          :left-icon="EnvelopeIcon"
        />

        <BaseInput
          v-model="editingUser.name"
          label="Nome"
          type="text"
          :left-icon="UserIcon"
        />

        <BaseInput
          v-model="editingUser.phoneNumber"
          label="Telefone"
          type="tel"
          :left-icon="PhoneIcon"
        />

        <BaseSelect
          v-model="editingUser.role"
          label="Role"
          required
        >
          <option value="USER">Usuário</option>
          <option value="ADMIN">Admin</option>
        </BaseSelect>

        <BaseInput
          v-model="editingUserPassword"
          label="Nova Senha (opcional)"
          type="password"
          help="Deixe em branco para não alterar a senha"
          :minlength="8"
          :left-icon="LockClosedIcon"
          show-password-toggle
        />

        <div class="flex items-center">
          <input
            id="isActive"
            v-model="editingUser.isActive"
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label for="isActive" class="ml-2 block text-sm text-gray-900 dark:text-gray-100">
            Usuário Ativo
          </label>
        </div>

        <div class="flex justify-end gap-2 pt-4">
          <BaseButton
            variant="ghost"
            @click="closeEditModal"
          >
            Cancelar
          </BaseButton>
          <BaseButton
            variant="primary"
            type="submit"
            :loading="isSaving"
          >
            Salvar
          </BaseButton>
        </div>
      </form>
    </BaseModal>

    <BaseModal
      :show="showPasswordModal"
      title="Alterar Senha"
      @close="closePasswordModal"
    >
      <form @submit.prevent="changePassword" class="space-y-4">
        <BaseInput
          v-model="newPassword"
          label="Nova Senha"
          type="password"
          required
          :minlength="8"
          help="A senha deve ter pelo menos 8 caracteres"
          :left-icon="LockClosedIcon"
          show-password-toggle
        />

        <div class="flex justify-end gap-2 pt-4">
          <BaseButton
            variant="ghost"
            @click="closePasswordModal"
          >
            Cancelar
          </BaseButton>
          <BaseButton
            variant="primary"
            type="submit"
            :loading="isChangingPassword"
          >
            Alterar Senha
          </BaseButton>
        </div>
      </form>
    </BaseModal>

    <ConfirmModal
      :show="showDeleteModal"
      title="Deletar Usuário"
      :message="`Tem certeza que deseja deletar o usuário ${deletingUserEmail}? Esta ação não pode ser desfeita.`"
      confirm-text="Deletar"
      cancel-text="Cancelar"
      :loading="isDeleting"
      @confirm="confirmDeleteUser"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from '@/hooks/useToast'
import { UserGroupIcon, PencilIcon, KeyIcon, EnvelopeIcon, UserIcon, PhoneIcon, LockClosedIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { AppHeader, BaseCard, BaseButton, BaseModal, BaseInput, BaseSelect, ConfirmModal } from '@/components/ui'
import usersApi, { type AdminUser } from '@/api/users'

const toast = useToast()

const users = ref<AdminUser[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const isChangingPassword = ref(false)

const showEditModal = ref(false)
const showPasswordModal = ref(false)
const showDeleteModal = ref(false)
const editingUser = ref<Partial<AdminUser> & { isActive: boolean }>({
  id: '',
  email: '',
  name: '',
  phoneNumber: '',
  role: 'USER',
  isActive: true
})
const selectedUserId = ref<string>('')
const deletingUserId = ref<string>('')
const deletingUserEmail = ref<string>('')
const isDeleting = ref(false)
const newPassword = ref('')
const editingUserPassword = ref('')

const fetchUsers = async () => {
  isLoading.value = true
  try {
    const response = await usersApi.getAllUsers()
    if (response.success && response.data) {
      users.value = response.data
    }
  } catch (error: any) {
    toast.error('Erro ao carregar usuários')
  } finally {
    isLoading.value = false
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
}

const openPasswordModal = (user: AdminUser) => {
  selectedUserId.value = user.id
  newPassword.value = ''
  showPasswordModal.value = true
}

const closePasswordModal = () => {
  showPasswordModal.value = false
  selectedUserId.value = ''
  newPassword.value = ''
}

const saveUser = async () => {
  if (!editingUser.value.id) return

  if (editingUserPassword.value && editingUserPassword.value.length < 8) {
    toast.error('A senha deve ter pelo menos 8 caracteres')
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
    
    toast.success('Usuário atualizado com sucesso')
    closeEditModal()
    await fetchUsers()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Erro ao atualizar usuário')
  } finally {
    isSaving.value = false
  }
}

const changePassword = async () => {
  if (!selectedUserId.value || !newPassword.value) return

  if (newPassword.value.length < 8) {
    toast.error('A senha deve ter pelo menos 8 caracteres')
    return
  }

  isChangingPassword.value = true
  try {
    await usersApi.changeUserPassword(selectedUserId.value, newPassword.value)
    toast.success('Senha alterada com sucesso')
    closePasswordModal()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Erro ao alterar senha')
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
  showDeleteModal.value = false
  deletingUserId.value = ''
  deletingUserEmail.value = ''
}

const confirmDeleteUser = async () => {
  if (!deletingUserId.value) return

  isDeleting.value = true
  try {
    await usersApi.deleteUser(deletingUserId.value)
    toast.success('Usuário deletado com sucesso')
    closeDeleteModal()
    await fetchUsers()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Erro ao deletar usuário')
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

