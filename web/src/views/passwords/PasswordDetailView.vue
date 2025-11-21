<template>
  <div v-if="password" class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Header -->
    <AppHeader
      :show-logo="true"
      :show-back-button="true"
      :show-navigation="true"
      :title="password.name"
    />

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Action Buttons -->
      <div class="mb-6 flex justify-end space-x-2">
        <BaseButton
          variant="secondary"
          @click="editPassword"
        >
          <PencilIcon class="w-4 h-4 mr-2" />
          Editar
        </BaseButton>
        
        <BaseButton
          variant="danger"
          @click="deletePassword"
        >
          <TrashIcon class="w-4 h-4 mr-2" />
          Deletar
        </BaseButton>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Info -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Basic Info -->
          <BaseCard>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h2 class="text-xl font-semibold text-gray-900">Informações Básicas</h2>
                <div class="flex items-center space-x-2">
                  <button
                    @click="toggleFavorite"
                    class="p-2 rounded-full hover:bg-gray-100"
                    :class="{ 'text-red-500': password.isFavorite }"
                  >
                    <HeartIcon class="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <p class="text-gray-900">{{ password.name }}</p>
                </div>
                
                <div v-if="password.website">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <a :href="password.website" target="_blank" class="text-primary-600 hover:text-primary-500">
                    {{ password.website }}
                  </a>
                </div>
                
                <div v-if="password.username">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
                  <div class="flex items-center space-x-2">
                    <p class="text-gray-900">{{ password.username }}</p>
                    <button
                      @click="handleCopyToClipboard(password.username)"
                      class="text-gray-400 hover:text-gray-600"
                    >
                      <ClipboardIcon class="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div v-if="password.folder">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Pasta</label>
                  <p class="text-gray-900">📁 {{ password.folder }}</p>
                </div>
              </div>
            </div>
          </BaseCard>

          <!-- Password -->
          <BaseCard>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900">Senha</h3>
                <div class="flex items-center space-x-2">
                  <BaseButton
                    variant="ghost"
                    size="sm"
                    @click="togglePasswordVisibility"
                  >
                    <component :is="showPassword ? EyeSlashIcon : EyeIcon" class="w-4 h-4 mr-1" />
                    {{ showPassword ? 'Ocultar' : 'Mostrar' }}
                  </BaseButton>
                  
                  <BaseButton
                    variant="ghost"
                    size="sm"
                    @click="handleCopyToClipboard(password.password)"
                  >
                    <ClipboardIcon class="w-4 h-4 mr-1" />
                    Copiar
                  </BaseButton>
                </div>
              </div>
              
              <div class="bg-gray-50 rounded-lg p-4">
                <p class="font-mono text-lg" :class="{ 'blur-sm': !showPassword }">
                  {{ showPassword ? password.password : '••••••••••••••••' }}
                </p>
              </div>
            </div>
          </BaseCard>

          <!-- TOTP -->
          <BaseCard v-if="password.totpEnabled">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900">Código 2FA</h3>
                <div class="flex items-center space-x-2">
                  <KeyIcon class="w-5 h-5 text-blue-500" />
                  <span class="text-sm text-blue-600">TOTP Ativo</span>
                </div>
              </div>
              
              <TotpCode
                v-if="password.totpCode"
                :code="password.totpCode.code"
                :time-remaining="password.totpCode.timeRemaining"
                :period="password.totpCode.period"
                @refresh="refreshTotpCode"
              />
              
              <div class="flex space-x-2">
                <BaseButton
                  variant="ghost"
                  size="sm"
                  @click="removeTotp"
                >
                  <TrashIcon class="w-4 h-4 mr-1" />
                  Remover TOTP
                </BaseButton>
              </div>
            </div>
          </BaseCard>

          <!-- Custom Fields -->
          <BaseCard v-if="password.customFields && password.customFields.length > 0">
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900">Campos Personalizados</h3>
              
              <div class="space-y-3">
                <div
                  v-for="field in password.customFields"
                  :key="field.id"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div class="flex-1">
                    <label class="block text-sm font-medium text-gray-700">{{ field.fieldName }}</label>
                    <p class="text-gray-900 font-mono" :class="{ 'blur-sm': !showPassword && field.fieldType === 'password' }">
                      {{ showPassword || field.fieldType !== 'password' ? field.value : '••••••••••••••••' }}
                    </p>
                  </div>
                  
                  <button
                    @click="handleCopyToClipboard(field.value)"
                    class="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    <ClipboardIcon class="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </BaseCard>

          <!-- Notes -->
          <BaseCard v-if="password.notes">
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900">Notas</h3>
              <p class="text-gray-700 whitespace-pre-wrap">{{ password.notes }}</p>
            </div>
          </BaseCard>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Quick Actions -->
          <BaseCard>
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
            <div class="space-y-2">
              <BaseButton
                variant="primary"
                class="w-full justify-start"
                @click="handleCopyToClipboard(password.password)"
              >
                <ClipboardIcon class="w-4 h-4 mr-2" />
                Copiar Senha
              </BaseButton>
              
              <BaseButton
                v-if="password.username"
                variant="secondary"
                class="w-full justify-start"
                @click="handleCopyToClipboard(password.username)"
              >
                <UserIcon class="w-4 h-4 mr-2" />
                Copiar Usuário
              </BaseButton>
              
              <BaseButton
                v-if="password.website"
                variant="secondary"
                class="w-full justify-start"
                @click="openWebsite"
              >
                <GlobeAltIcon class="w-4 h-4 mr-2" />
                Abrir Site
              </BaseButton>
            </div>
          </BaseCard>

          <!-- Metadata -->
          <BaseCard>
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Informações</h3>
            <div class="space-y-3 text-sm">
              <div>
                <span class="text-gray-500">Criado:</span>
                <p class="text-gray-900">{{ formatDate(password.createdAt) }}</p>
              </div>
              
              <div>
                <span class="text-gray-500">Atualizado:</span>
                <p class="text-gray-900">{{ formatDate(password.updatedAt) }}</p>
              </div>
              
              <div v-if="password.lastUsed">
                <span class="text-gray-500">Último uso:</span>
                <p class="text-gray-900">{{ formatDate(password.lastUsed) }}</p>
              </div>
            </div>
          </BaseCard>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <EditPasswordModal
      :show="showEditModal"
      :password="password"
      @close="showEditModal = false"
      @updated="handlePasswordUpdated"
    />

    <DeletePasswordModal
      :show="showDeleteModal"
      :password="password"
      @close="showDeleteModal = false"
      @deleted="handlePasswordDeleted"
    />
  </div>

  <!-- Loading -->
  <div v-else class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="spinner w-12 h-12 mx-auto mb-4"></div>
      <p class="text-gray-600">Carregando senha...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/hooks/useToast'
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  HeartIcon,
  ClipboardIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  UserIcon,
  GlobeAltIcon
} from '@heroicons/vue/24/outline'
import { usePasswordsStore } from '@/stores/passwords'
import { AppHeader, BaseButton, BaseCard, TotpCode } from '@/components/ui'
import { type PasswordEntry } from '@/api/passwords'
import { copyToClipboard } from '@/utils/clipboard'





const route = useRoute()
const router = useRouter()
const toast = useToast()
const passwordsStore = usePasswordsStore()


const showPassword = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)


const password = computed(() => passwordsStore.currentPassword)


const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handleCopyToClipboard = async (text: string) => {
  const result = await copyToClipboard(text)
  if (result.success) {
    toast.success(result.message)
  } else {
    toast.error(result.message)
  }
}

const toggleFavorite = async () => {
  if (!password.value) return
  
  try {
    await passwordsStore.updatePassword(password.value.id, {
      id: password.value.id,
      isFavorite: !password.value.isFavorite
    })
    toast.success(password.value.isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos')
  } catch (error) {
    toast.error('Erro ao atualizar favorito')
  }
}

const openWebsite = () => {
  if (password.value?.website) {
    window.open(password.value.website, '_blank')
  }
}

const refreshTotpCode = async () => {
  if (!password.value) return
  
  try {
    await passwordsStore.getTotpCode(password.value.id)
  } catch (error) {
    toast.error('Erro ao atualizar código TOTP')
  }
}

const removeTotp = async () => {
  if (!password.value) return
  
  try {
    await passwordsStore.removeTotp(password.value.id)
    toast.success('TOTP removido com sucesso')
  } catch (error) {
    toast.error('Erro ao remover TOTP')
  }
}

const editPassword = () => {
  showEditModal.value = true
}

const deletePassword = () => {
  showDeleteModal.value = true
}

const handlePasswordUpdated = () => {
  showEditModal.value = false
  passwordsStore.fetchPasswordById(route.params.id as string)
}

const handlePasswordDeleted = () => {
  showDeleteModal.value = false
  router.push('/dashboard')
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('pt-BR')
}


onMounted(async () => {
  const passwordId = route.params.id as string
  if (passwordId) {
    await passwordsStore.fetchPasswordById(passwordId)
  }
})
</script>