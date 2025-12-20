<template>
  <BaseModal :show="show" @close="$emit('close')" size="lg">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Nova Nota Segura</h3>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Título -->
      <div>
        <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Título *
        </label>
        <BaseInput
          id="title"
          v-model="form.title"
          type="text"
          placeholder="Digite o título da nota"
          required
          :error="errors.title"
          :left-icon="DocumentTextIcon"
        />
      </div>

      <!-- Conteúdo -->
      <div>
        <label for="content" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Conteúdo *
        </label>
        <textarea
          id="content"
          v-model="form.content"
          rows="12"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500 resize-y min-h-[300px]"
          placeholder="Digite o conteúdo da nota..."
          required
          :class="{ 'border-red-300 dark:border-red-600': errors.content }"
        ></textarea>
        <p v-if="errors.content" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.content }}</p>
      </div>

      <!-- Pasta -->
      <div>
        <label for="folder" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Pasta
        </label>
        <BaseInput
          id="folder"
          v-model="form.folder"
          type="text"
          placeholder="Ex: Trabalho, Pessoal, Projetos"
          :error="errors.folder"
          :left-icon="FolderIcon"
        />
        <div v-if="folders.length > 0" class="mt-2 flex flex-wrap gap-2">
          <button
            v-for="folder in folders"
            :key="folder"
            type="button"
            @click="form.folder = folder"
            class="px-3 py-1 text-sm rounded-full transition-colors"
            :class="form.folder === folder
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'"
          >
            {{ folder }}
          </button>
        </div>
      </div>

      <!-- Favorito -->
      <div class="flex items-center justify-between">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Marcar como favorito
        </label>
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            v-model="form.isFavorite"
            class="sr-only peer"
          />
          <div class="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
        </label>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <BaseButton
          type="button"
          variant="ghost"
          @click="$emit('close')"
          :disabled="isSubmitting"
        >
          Cancelar
        </BaseButton>
        <BaseButton
          type="submit"
          variant="primary"
          :loading="isSubmitting"
        >
          Criar Nota
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { BaseModal, BaseInput, BaseButton } from '@/components/ui'
import { useSecureNotesStore } from '@/stores/secureNotes'
import type { CreateSecureNoteRequest } from '@/api/secureNotes'
import { useToast } from '@/hooks/useToast'
import { DocumentTextIcon, FolderIcon } from '@heroicons/vue/24/outline'

interface Props {
  show: boolean
  folders?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  folders: () => []
})

const emit = defineEmits<{
  close: []
  created: []
}>()

const secureNotesStore = useSecureNotesStore()
const toast = useToast()

const form = ref({
  title: '',
  content: '',
  folder: '',
  isFavorite: false
})

const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)

const folders = computed(() => props.folders || secureNotesStore.folders)

const validateForm = () => {
  errors.value = {}
  
  if (!form.value.title.trim()) {
    errors.value.title = 'Título é obrigatório'
  }
  
  if (!form.value.content.trim()) {
    errors.value.content = 'Conteúdo é obrigatório'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) {
    toast.error('Por favor, corrija os erros no formulário')
    return
  }
  
  isSubmitting.value = true
  
  try {
    const noteData: CreateSecureNoteRequest = {
      title: form.value.title.trim(),
      content: form.value.content.trim(),
      isFavorite: form.value.isFavorite
    }
    
    if (form.value.folder.trim()) {
      noteData.folder = form.value.folder.trim()
    }
    
    await secureNotesStore.createNote(noteData)
    
    toast.success('Nota criada com sucesso!')
    emit('created')
    
    resetForm()
  } catch (error: unknown) {
    const errorMessage = error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
      : undefined;
    toast.error(errorMessage || 'Erro ao criar nota')
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  form.value = {
    title: '',
    content: '',
    folder: '',
    isFavorite: false
  }
  errors.value = {}
}

watch(() => props.show, (newShow) => {
  if (!newShow) {
    resetForm()
  }
})
</script>

