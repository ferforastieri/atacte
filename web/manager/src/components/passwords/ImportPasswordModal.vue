<template>
  <BaseModal :show="show" size="lg" @close="$emit('close')">
    <template #header>
      <div class="flex min-w-0 items-center gap-3">
        <div class="icon-tile h-11 w-11">
          <ArrowUpTrayIcon class="h-5 w-5" />
        </div>
        <div class="min-w-0">
          <h3 class="text-lg font-semibold text-ink">Importar Senhas</h3>
          <p class="mt-0.5 text-xs text-ink-muted">Traga um cofre do Bitwarden em JSON</p>
        </div>
      </div>
    </template>

    <div class="space-y-5">
      <div>
        <p class="field-label mb-2">Selecione o arquivo JSON do Bitwarden</p>
        <div
          class="rounded-2xl border-2 border-dashed border-line bg-surface-muted/50 px-6 py-8 text-center transition-colors hover:border-primary-400"
          @dragover.prevent
          @drop.prevent="handleDrop"
        >
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-ink-subtle shadow-sm ring-1 ring-line">
            <ArrowUpTrayIcon class="h-6 w-6" />
          </div>
          <div class="mt-4 flex flex-wrap items-center justify-center gap-1 text-sm text-ink-muted">
            <label
              for="file-upload"
              class="cursor-pointer rounded-lg font-semibold text-primary-700 transition-colors hover:text-primary-800 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500 dark:text-primary-400"
            >
              Carregar arquivo
              <input
                id="file-upload"
                ref="fileInput"
                name="file-upload"
                type="file"
                class="sr-only"
                accept=".json,application/json"
                :disabled="isImporting"
                @change="handleFileSelect"
              />
            </label>
            <span>ou arraste e solte</span>
          </div>
          <p class="mt-1 text-xs text-ink-subtle">JSON do Bitwarden (até 10 MB)</p>
        </div>
      </div>

      <div v-if="selectedFile" class="flex items-center gap-3 rounded-xl border border-line bg-surface-muted p-3.5">
        <span class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-success-50 text-success-700 dark:bg-success-900/40 dark:text-success-300">
          <DocumentCheckIcon class="h-5 w-5" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-ink">{{ selectedFile.name }}</p>
          <p class="text-xs text-ink-muted">{{ formatFileSize(selectedFile.size) }}</p>
        </div>
      </div>

      <div
        v-if="isImporting"
        class="space-y-2 rounded-xl border border-line bg-surface-muted p-4"
        aria-live="polite"
      >
        <div class="skeleton h-3.5 w-40"></div>
        <div class="skeleton h-3 w-2/3"></div>
      </div>

      <div
        v-if="importResult"
        class="rounded-xl border p-4"
        :class="importResult.success
          ? 'border-success-200 bg-success-50 dark:border-success-900 dark:bg-success-900/20'
          : 'border-danger-200 bg-danger-50 dark:border-danger-900 dark:bg-danger-900/20'"
        role="status"
      >
        <div class="flex gap-3">
          <CheckCircleIcon
            v-if="importResult.success"
            class="h-5 w-5 flex-shrink-0 text-success-700 dark:text-success-300"
          />
          <XCircleIcon
            v-else
            class="h-5 w-5 flex-shrink-0 text-danger-600 dark:text-danger-300"
          />
          <div class="min-w-0">
            <h3
              class="text-sm font-semibold"
              :class="importResult.success ? 'text-success-800 dark:text-success-200' : 'text-danger-800 dark:text-danger-200'"
            >
              {{ importResult.success ? 'Importação concluída!' : 'Erro na importação' }}
            </h3>
            <div
              class="mt-1.5 text-sm"
              :class="importResult.success ? 'text-success-700 dark:text-success-300' : 'text-danger-700 dark:text-danger-300'"
            >
              <p v-if="importResult.success">
                {{ importResult.imported }} senhas importadas com sucesso
                <span v-if="importResult.duplicates > 0">, {{ importResult.duplicates }} duplicatas ignoradas</span>
              </p>
              <div v-else>
                <p>Erros encontrados:</p>
                <ul class="mt-1 list-inside list-disc space-y-0.5">
                  <li v-for="error in importResult.errors" :key="error">{{ error }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <BaseButton variant="ghost" :disabled="isImporting" @click="clearImport">
          Limpar
        </BaseButton>
        <div class="flex flex-col-reverse gap-2 sm:flex-row">
          <BaseButton variant="ghost" :disabled="isImporting" @click="$emit('close')">
            Fechar
          </BaseButton>
          <BaseButton
            :loading="isImporting"
            :disabled="!selectedFile || isImporting"
            @click="importPasswords"
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
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  DocumentCheckIcon,
  XCircleIcon
} from '@heroicons/vue/24/outline'
import { BaseModal, BaseButton } from '@/components/ui'
import { usePasswordsStore } from '@/stores/passwords'

interface Props {
  show: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  close: []
  imported: []
}>()

const passwordsStore = usePasswordsStore()

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const isImporting = ref(false)
const importResult = ref<{
  success: boolean
  imported: number
  errors: string[]
  duplicates: number
} | null>(null)

const validateFile = (file: File) => {
  if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
    return false
  }
  if (file.size > 10 * 1024 * 1024) {
    return false
  }
  return true
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file && validateFile(file)) {
    selectedFile.value = file
    importResult.value = null
  }
}

const handleDrop = (event: DragEvent) => {
  if (isImporting.value) return
  const file = event.dataTransfer?.files?.[0]
  if (file && validateFile(file)) {
    selectedFile.value = file
    importResult.value = null
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const importPasswords = async () => {
  if (!selectedFile.value || isImporting.value) return

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
  } catch {
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

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>
