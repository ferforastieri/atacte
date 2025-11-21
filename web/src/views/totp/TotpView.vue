<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <AppHeader
      :show-logo="true"
      :show-back-button="true"
      :show-navigation="true"
      title="Códigos TOTP"
    />

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Stats -->
      <div class="mb-6">
        <BaseCard class="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <KeyIcon class="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div class="ml-3 sm:ml-4">
              <p class="text-blue-100 text-xs sm:text-sm">Total TOTP</p>
              <p class="text-lg sm:text-2xl font-bold">{{ totpPasswords.length }}</p>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- TOTP List -->
      <div v-if="totpPasswords.length === 0" class="text-center py-12">
        <KeyIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          Nenhum TOTP encontrado
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Adicione TOTP às suas senhas para ver os códigos aqui.
        </p>
        <div class="mt-6">
          <BaseButton @click="$router.push('/dashboard')" variant="primary">
            Voltar ao Dashboard
          </BaseButton>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <BaseCard
          v-for="password in totpPasswords"
          :key="password.id"
          class="hover:shadow-lg transition-shadow"
        >
          <div class="p-4">
            <!-- Header -->
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {{ password.name }}
                </h3>
                <p v-if="password.website" class="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {{ password.website }}
                </p>
                <p v-if="password.username" class="text-sm text-gray-500 dark:text-gray-500 truncate">
                  @{{ password.username }}
                </p>
              </div>
              <KeyIcon class="h-5 w-5 text-blue-500 flex-shrink-0" />
            </div>

            <!-- TOTP Code -->
            <div class="text-center mb-4">
              <div class="text-2xl font-mono font-bold text-gray-900 dark:text-gray-100 mb-2">
                {{ getTotpCode(password.id)?.code || '--- ---' }}
              </div>
              
              <!-- Progress Bar -->
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  class="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                  :style="{ width: `${getTotpCode(password.id)?.timeRemaining || 0}%` }"
                ></div>
              </div>
              
              <!-- Time Remaining -->
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ getTotpCode(password.id)?.timeRemaining || 0 }}s restantes
              </p>
            </div>

            <!-- Actions -->
            <div class="flex space-x-2">
              <BaseButton
                @click="copyTotpCode(password.id)"
                variant="ghost"
                size="sm"
                class="flex-1"
              >
                <ClipboardIcon class="h-4 w-4 mr-1" />
                Copiar
              </BaseButton>
              
              <BaseButton
                @click="viewPassword(password)"
                variant="ghost"
                size="sm"
                class="flex-1"
              >
                <EyeIcon class="h-4 w-4 mr-1" />
                Ver
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Password Detail Modal -->
    <PasswordDetailModal
      v-if="selectedPassword"
      :show="!!selectedPassword"
      :password="selectedPassword"
      @close="selectedPassword = null"
      @updated="handlePasswordUpdated"
      @deleted="handlePasswordDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePasswordsStore } from '@/stores/passwords'
import { useToast } from '@/hooks/useToast'
import { copyToClipboard } from '@/utils/clipboard'
import { TOTPClient } from '@/utils/totpClient'
import type { PasswordEntry } from '@/api/passwords'


import { AppHeader, BaseCard, BaseButton } from '@/components/ui'
import PasswordDetailModal from '@/components/passwords/PasswordDetailModal.vue'


import {
  ArrowPathIcon,
  KeyIcon,
  ClipboardIcon,
  EyeIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const passwordsStore = usePasswordsStore()
const toast = useToast()


const selectedPassword = ref<PasswordEntry | null>(null)
const isRefreshing = ref(false)
const totpSecrets = ref<Map<string, string>>(new Map()) 
const totpCodes = ref<Map<string, any>>(new Map()) 
const refreshInterval = ref<number | null>(null)
const updateTrigger = ref(0) 


const totpPasswords = computed(() => {
  return passwordsStore.passwords.filter(p => p.totpEnabled)
})


const getTotpCode = (passwordId: string) => {
  
  updateTrigger.value
  
  const secret = totpSecrets.value.get(passwordId)
  if (!secret) return null
  
  try {
    
    const codeData = TOTPClient.generateCurrentCode(secret)
    return codeData
  } catch (error) {
    console.error('Erro ao gerar código TOTP:', error)
    return null
  }
}

const refreshTotpCodes = async () => {
  isRefreshing.value = true
  try {
    await passwordsStore.fetchPasswords({ totpEnabled: true })
    await loadTotpCodes()
    toast.success('Códigos TOTP atualizados')
  } catch (error) {
    toast.error('Erro ao atualizar códigos TOTP')
  } finally {
    isRefreshing.value = false
  }
}

const loadTotpCodes = async () => {
  
  for (const password of totpPasswords.value) {
    try {
      
      const response = await passwordsStore.getTotpSecret(password.id)
      if (response?.secret) {
        totpSecrets.value.set(password.id, response.secret)
      }
    } catch (error) {
      console.error(`Erro ao carregar secret TOTP para ${password.name}:`, error)
    }
  }
}

const copyTotpCode = async (passwordId: string) => {
  const totpCode = getTotpCode(passwordId)
  if (totpCode?.code) {
    const result = await copyToClipboard(totpCode.code)
    if (result.success) {
      toast.success('Código TOTP copiado!')
    } else {
      toast.error(result.message)
    }
  }
}

const viewPassword = (password: PasswordEntry) => {
  selectedPassword.value = password
}

const handlePasswordUpdated = () => {
  selectedPassword.value = null
  refreshTotpCodes()
}

const handlePasswordDeleted = () => {
  selectedPassword.value = null
  refreshTotpCodes()
}


const startAutoRefresh = () => {
  
  refreshInterval.value = window.setInterval(() => {
    
    updateTrigger.value++
  }, 1000)
}

const stopAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}


onMounted(async () => {
  try {
    await passwordsStore.fetchPasswords({ totpEnabled: true })
    await loadTotpCodes()
    startAutoRefresh()
  } catch (error) {
    console.error('Erro ao carregar TOTPs:', error)
    toast.error('Erro ao carregar códigos TOTP')
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>
