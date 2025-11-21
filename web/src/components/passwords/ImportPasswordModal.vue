<template>
  <BaseModal :show="show" @close="$emit('close')" size="lg">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Importar Senhas</h3>
    </template>

    <div class="space-y-6">
      <!-- Upload de arquivo -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Selecione o arquivo JSON do Bitwarden
        </label>
        <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
          <div class="space-y-1 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <div class="flex text-sm text-gray-600 dark:text-gray-400">
              <label for="file-upload" class="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                <span>Carregar arquivo</span>
                <input 
                  id="file-upload" 
                  name="file-upload" 
                  type="file" 
                  class="sr-only" 
                  accept=".json"
                  @change="handleFileSelect"
                  :disabled="isImporting"
                />
              </label>
              <p class="pl-1">ou arraste e solte</p>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              JSON do Bitwarden (até 10MB)
            </p>
          </div>
        </div>
      </div>

      <!-- Arquivo selecionado -->
      <div v-if="selectedFile" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div class="flex items-center">
          <svg class="h-5 w-5 text-green-500 dark:text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ selectedFile.name }}</span>
          <span class="ml-2 text-xs text-gray-500 dark:text-gray-400">({{ formatFileSize(selectedFile.size) }})</span>
        </div>
      </div>

      <!-- Resultado da importação -->
      <div v-if="importResult" class="rounded-lg p-4" :class="importResult.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg v-if="importResult.success" class="h-5 w-5 text-green-400 dark:text-green-300" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <svg v-else class="h-5 w-5 text-red-400 dark:text-red-300" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium" :class="importResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'">
              {{ importResult.success ? 'Importação concluída!' : 'Erro na importação' }}
            </h3>
            <div class="mt-2 text-sm" :class="importResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'">
              <p v-if="importResult.success">
                {{ importResult.imported }} senhas importadas com sucesso
                <span v-if="importResult.duplicates > 0">, {{ importResult.duplicates }} duplicatas ignoradas</span>
              </p>
              <div v-else>
                <p>Erros encontrados:</p>
                <ul class="list-disc list-inside mt-1">
                  <li v-for="error in importResult.errors" :key="error">{{ error }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between">
        <BaseButton 
          variant="ghost" 
          @click="clearImport"
          :disabled="isImporting"
        >
          Limpar
        </BaseButton>
        <div class="flex space-x-3">
          <BaseButton 
            variant="ghost" 
            @click="$emit('close')"
            :disabled="isImporting"
          >
            Fechar
          </BaseButton>
          <BaseButton 
            variant="primary" 
            @click="importPasswords"
            :disabled="!selectedFile || isImporting"
            :loading="isImporting"
          >
            {{ isImporting ? 'Importando...' : 'Importar' }}
          </BaseButton>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { BaseModal, BaseButton } from '@/components/ui'
import { usePasswordsStore } from '@/stores/passwords'

interface Props {
  show: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'imported'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const passwordsStore = usePasswordsStore()


const selectedFile = ref<File | null>(null)
const isImporting = ref(false)
const importResult = ref<{
  success: boolean
  imported: number
  errors: string[]
  duplicates: number
} | null>(null)


const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      alert('Por favor, selecione um arquivo JSON válido.')
      return
    }
    
    
    if (file.size > 10 * 1024 * 1024) {
      alert('O arquivo é muito grande. Máximo de 10MB permitido.')
      return
    }
    
    selectedFile.value = file
    importResult.value = null
  }
}


const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}


const importPasswords = async () => {
  if (!selectedFile.value) return
  
  isImporting.value = true
  importResult.value = null
  
  try {
    
    const fileContent = await selectedFile.value.text()
    const jsonData = JSON.parse(fileContent)
    
    
    const result = await passwordsStore.importPasswords(jsonData)
    
    
    const importResultData = {
      ...result,
      success: result.errors.length === 0 || result.imported > 0
    }
    
    importResult.value = importResultData
    
    if (importResultData.success && result.imported > 0) {
      emit('imported')
    }
    
  } catch (error) {
    console.error('Erro na importação:', error)
    importResult.value = {
      success: false,
      imported: 0,
      errors: ['Erro ao processar o arquivo JSON. Verifique se o arquivo está no formato correto.'],
      duplicates: 0
    }
  } finally {
    isImporting.value = false
  }
}


const clearImport = () => {
  selectedFile.value = null
  importResult.value = null
  
  
  const fileInput = document.getElementById('file-upload') as HTMLInputElement
  if (fileInput) {
    fileInput.value = ''
  }
}
</script>

