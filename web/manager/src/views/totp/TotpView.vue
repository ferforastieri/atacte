<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <AppHeader
      :show-logo="true"
      :show-back-button="true"
      :show-navigation="true"
    />

    <!-- Main Content -->
    <div class="w-full px-4 sm:px-6 lg:px-10 xl:px-12 py-8">
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

      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
        <BaseCard
          v-for="password in totpPasswords"
          :key="password.id"
          padding="none"
          class="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          @click="viewPassword(password)"
        >
          <div class="p-5 sm:p-6">
            <!-- Header -->
            <div class="flex items-start gap-4 mb-5">
              <div class="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                <KeyIcon class="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {{ password.name }}
                </h3>
                <p v-if="password.website" class="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {{ password.website }}
                </p>
                <p v-if="password.username" class="text-sm text-gray-500 dark:text-gray-500 truncate">
                  @{{ password.username }}
                </p>
              </div>
            </div>

            <!-- TOTP Code -->
            <div class="relative text-center rounded-xl bg-gray-50 dark:bg-gray-900/70 border-2 border-dashed border-gray-300 dark:border-gray-600 px-4 py-5 mb-5">
              <div class="text-4xl font-mono font-bold tracking-[0.18em] text-gray-900 dark:text-gray-100 mb-4">
                {{ formatTotpCode(getTotpCode(password.id)?.code) }}
              </div>
              
              <!-- Progress Bar -->
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div 
                  class="bg-blue-500 h-2.5 rounded-full transition-all duration-1000"
                  :style="{ width: `${getTotpProgress(password.id)}%` }"
                ></div>
              </div>
              
              <!-- Time Remaining -->
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">
                {{ getTotpCode(password.id)?.timeRemaining || 0 }}s restantes
              </p>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
              <BaseButton
                @click.stop="copyTotpCode(password.id)"
                variant="primary"
                size="md"
                class="w-full"
              >
                <ClipboardIcon class="h-5 w-5 mr-2" />
                Copiar
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
import { copyToClipboard } from '@/utils/clipboard'
import { TOTPClient } from '@/utils/totpClient'
import type { PasswordEntry } from '@/api/passwords'


import { AppHeader, BaseCard, BaseButton } from '@/components/ui'
import PasswordDetailModal from '@/components/passwords/PasswordDetailModal.vue'


import {
  ArrowPathIcon,
  KeyIcon,
  ClipboardIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const passwordsStore = usePasswordsStore()


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
    return null
  }
}

const formatTotpCode = (code?: string) => {
  const cleanCode = code?.replace(/\D/g, '').slice(0, 6)
  return cleanCode?.length === 6 ? `${cleanCode.slice(0, 3)} ${cleanCode.slice(3)}` : '--- ---'
}

const getTotpProgress = (passwordId: string) => {
  const code = getTotpCode(passwordId)
  if (!code) return 0
  return Math.max(0, Math.min(100, (code.timeRemaining / code.period) * 100))
}

const refreshTotpCodes = async () => {
  isRefreshing.value = true
  try {
    await passwordsStore.fetchPasswords({ totpEnabled: true })
    await loadTotpCodes()
  } catch (error) {
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
    }
  }
}

const copyTotpCode = async (passwordId: string) => {
  const totpCode = getTotpCode(passwordId)
  const cleanCode = totpCode?.code?.replace(/\D/g, '').slice(0, 6)

  if (cleanCode?.length === 6) {
    const result = await copyToClipboard(cleanCode)
    if (result.success) {
    } else {
    }
  } else {
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
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>
