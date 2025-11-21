<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Header -->
    <AppHeader
      :show-logo="true"
      :show-back-button="true"
      :show-navigation="true"
      title="Configurações"
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
              
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div class="flex-1">
                  <h3 class="text-sm font-medium text-gray-900 dark:text-white">Exportar Dados</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Baixe todas as suas senhas em formato JSON</p>
                </div>
                <BaseButton variant="secondary" @click="exportData" class="w-full sm:w-auto">
                  Exportar
                </BaseButton>
              </div>

              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div class="flex-1">
                  <h3 class="text-sm font-medium text-gray-900 dark:text-white">Importar Dados</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Importe senhas de outros aplicativos</p>
                </div>
                <BaseButton variant="secondary" @click="showImportModal = true" class="w-full sm:w-auto">
                  Importar
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
                  <select 
                    v-model="theme" 
                    @change="changeTheme"
                    class="input-field w-32 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="light">Claro</option>
                    <option value="dark">Escuro</option>
                    <option value="auto">Automático</option>
                  </select>
                </div>
              </div>
              
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div class="flex-1">
                  <h3 class="text-sm font-medium text-gray-900 dark:text-white">Idioma</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Idioma da interface</p>
                </div>
                <select 
                  v-model="language" 
                  @change="changeLanguage"
                  class="input-field w-32 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="pt-BR">Português</option>
                  <option value="en-US">English</option>
                </select>
              </div>

              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div class="flex-1">
                  <h3 class="text-sm font-medium text-gray-900 dark:text-white">Auto-lock</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Bloquear automaticamente após inatividade (0 = nunca trancar)</p>
                </div>
                <select 
                  v-model="autoLock" 
                  @change="changeAutoLock"
                  class="input-field w-40 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="5">5 minutos</option>
                  <option value="15">15 minutos</option>
                  <option value="30">30 minutos</option>
                  <option value="60">1 hora</option>
                  <option value="0">Nunca trancar</option>
                </select>
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

    <!-- Modals -->
    <ImportPasswordModal
      :show="showImportModal"
      @close="showImportModal = false"
      @imported="() => { showImportModal = false; toast.success('Dados importados com sucesso!') }"
    />

    <!-- Change Password Modal (placeholder) -->
    <div v-if="showChangePasswordModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Alterar Senha Master</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Esta funcionalidade será implementada em breve.
        </p>
        <div class="flex justify-end space-x-3">
          <BaseButton variant="secondary" @click="showChangePasswordModal = false">
            Fechar
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Delete Account Modal (placeholder) -->
    <div v-if="showDeleteAccountModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h3 class="text-lg font-semibold text-red-900 dark:text-red-300 mb-4">Deletar Conta</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Esta funcionalidade será implementada em breve. Esta ação não pode ser desfeita.
        </p>
        <div class="flex justify-end space-x-3">
          <BaseButton variant="secondary" @click="showDeleteAccountModal = false">
            Cancelar
          </BaseButton>
          <BaseButton variant="danger" disabled>
            Deletar
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/hooks/useToast'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import { AppHeader, BaseButton, BaseCard } from '@/components/ui'
import { useThemeStore } from '@/stores/theme'
import { usePasswordsStore } from '@/stores/passwords'
import { useAuthStore } from '@/stores/auth'
import importExportApi from '@/api/importExport'
import preferencesApi from '@/api/preferences'


import ImportPasswordModal from '@/components/passwords/ImportPasswordModal.vue'

const router = useRouter()
const toast = useToast()
const themeStore = useThemeStore()
const passwordsStore = usePasswordsStore()
const authStore = useAuthStore()

const showChangePasswordModal = ref(false)
const showDeleteAccountModal = ref(false)
const showImportModal = ref(false)


const theme = ref('auto')
const language = ref('pt-BR')
const autoLock = ref('15')


onMounted(async () => {
  await loadSettings()
})

const loadSettings = async () => {
  try {
    
    theme.value = themeStore.isDarkMode ? 'dark' : 'light'
    
    
    const response = await preferencesApi.getPreferences()
    if (response.success && response.data) {
      language.value = response.data.language || 'pt-BR'
      autoLock.value = response.data.autoLock !== undefined ? response.data.autoLock.toString() : '15'
    } else {
      
      const savedLanguage = localStorage.getItem('language')
      const savedAutoLock = localStorage.getItem('autoLock')
      
      if (savedLanguage) {
        language.value = savedLanguage
      }
      
      if (savedAutoLock) {
        autoLock.value = savedAutoLock
      }
    }
  } catch (error) {
    console.error('Erro ao carregar configurações:', error)
    
    const savedLanguage = localStorage.getItem('language')
    const savedAutoLock = localStorage.getItem('autoLock')
    
    if (savedLanguage) {
      language.value = savedLanguage
    }
    
    if (savedAutoLock) {
      autoLock.value = savedAutoLock
    }
  }
}

const changeTheme = () => {
  if (theme.value === 'dark') {
    themeStore.isDarkMode = true
  } else if (theme.value === 'light') {
    themeStore.isDarkMode = false
  } else {
    
    themeStore.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  
  themeStore.applyTheme()
  localStorage.setItem('theme', themeStore.isDarkMode ? 'dark' : 'light')
  toast.success('Tema alterado!')
}

const changeLanguage = async () => {
  try {
    await preferencesApi.upsertPreferences({
      language: language.value
    })
    localStorage.setItem('language', language.value)
    toast.success('Idioma alterado!')
  } catch (error) {
    console.error('Erro ao alterar idioma:', error)
    toast.error('Erro ao alterar idioma')
  }
}

const changeAutoLock = async () => {
  try {
    
    const response = await preferencesApi.upsertPreferences({
      autoLock: parseInt(autoLock.value)
    })
    
    
    localStorage.setItem('autoLock', autoLock.value)
    toast.success('Auto-lock configurado!')
  } catch (error) {
    console.error('Erro ao configurar auto-lock:', error)
    toast.error('Erro ao configurar auto-lock')
  }
}

const exportData = async () => {
  try {
    toast.info('Preparando exportação...')
    
    const result = await passwordsStore.exportToBitwarden()
    
    
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `atacte-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Dados exportados com sucesso!')
  } catch (error) {
    console.error('Erro ao exportar dados:', error)
    toast.error('Erro ao exportar dados')
  }
}
</script>

