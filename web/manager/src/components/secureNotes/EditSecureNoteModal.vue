<template>
  <BaseModal :show="show && note !== null" size="lg" @close="$emit('close')">
    <template #header>
      <div class="flex min-w-0 items-center gap-3">
        <div class="icon-tile h-11 w-11">
          <PencilSquareIcon class="h-5 w-5" />
        </div>
        <div class="min-w-0">
          <h3 class="text-lg font-semibold text-ink">Editar Nota Segura</h3>
          <p class="mt-0.5 truncate text-xs text-ink-muted">{{ note?.title || 'Atualize o conteúdo da nota' }}</p>
        </div>
      </div>
    </template>

    <form class="space-y-5" @submit.prevent="handleSubmit">
      <div
        v-if="formError"
        class="rounded-xl border border-danger-200 bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700 dark:border-danger-900 dark:bg-danger-900/20 dark:text-danger-300"
        role="alert"
      >
        {{ formError }}
      </div>

      <BaseInput
        id="edit-note-title"
        v-model="form.title"
        label="Título"
        placeholder="Digite o título da nota"
        required
        :error="errors.title"
        :left-icon="DocumentTextIcon"
      />

      <BaseTextarea
        id="edit-note-content"
        v-model="form.content"
        label="Conteúdo"
        placeholder="Digite o conteúdo da nota..."
        :rows="12"
        required
        :error="errors.content"
      />

      <BaseInput
        id="edit-note-folder"
        v-model="form.folder"
        label="Pasta"
        placeholder="Ex: Trabalho, Pessoal, Projetos"
        :error="errors.folder"
        :left-icon="FolderIcon"
      />

      <div v-if="folders.length > 0" class="flex flex-wrap gap-2">
        <button
          v-for="folder in folders"
          :key="folder"
          type="button"
          class="rounded-full px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          :class="form.folder === folder
            ? 'bg-primary-700 text-white'
            : 'bg-surface-muted text-ink-muted hover:bg-line/60 hover:text-ink'"
          @click="form.folder = folder"
        >
          {{ folder }}
        </button>
      </div>

      <BaseSwitch
        v-model="form.isFavorite"
        label="Marcar como favorita"
        description="Aparece primeiro quando você filtra por favoritas."
      />
    </form>

    <template #footer>
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <BaseButton variant="ghost" :disabled="isSubmitting" @click="$emit('close')">
          Cancelar
        </BaseButton>
        <BaseButton
          type="submit"
          :loading="isSubmitting"
          :disabled="!isFormValid || isSubmitting"
          @click="handleSubmit"
        >
          Salvar Alterações
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  DocumentTextIcon,
  FolderIcon,
  PencilSquareIcon
} from '@heroicons/vue/24/outline'
import {
  BaseButton,
  BaseInput,
  BaseModal,
  BaseSwitch,
  BaseTextarea
} from '@/components/ui'
import { useSecureNotesStore } from '@/stores/secureNotes'
import type { SecureNote, UpdateSecureNoteRequest } from '@/api/secureNotes'

interface Props {
  show: boolean
  note: SecureNote | null
  folders?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  folders: () => []
})

const emit = defineEmits<{
  close: []
  updated: []
}>()

const secureNotesStore = useSecureNotesStore()

const form = ref({
  title: '',
  content: '',
  folder: '',
  isFavorite: false
})

const errors = ref<Record<string, string>>({})
const formError = ref('')
const isSubmitting = ref(false)

const folders = computed(() => props.folders || secureNotesStore.folders)
const isFormValid = computed(() => Boolean(form.value.title.trim() && form.value.content.trim()))

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

const loadNoteData = () => {
  if (props.note) {
    form.value = {
      title: props.note.title,
      content: props.note.content,
      folder: props.note.folder || '',
      isFavorite: props.note.isFavorite
    }
  }
}

const handleSubmit = async () => {
  if (isSubmitting.value || !validateForm() || !props.note?.id) return

  formError.value = ''
  isSubmitting.value = true

  try {
    const updateData: UpdateSecureNoteRequest = {
      title: form.value.title.trim(),
      content: form.value.content.trim(),
      isFavorite: form.value.isFavorite
    }

    if (form.value.folder.trim()) {
      updateData.folder = form.value.folder.trim()
    }

    await secureNotesStore.updateNote(props.note.id, updateData)

    emit('updated')
    emit('close')
  } catch (error: unknown) {
    formError.value = error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Não foi possível salvar as alterações'
      : 'Não foi possível salvar as alterações'
  } finally {
    isSubmitting.value = false
  }
}

watch(() => props.show, (newShow) => {
  if (newShow && props.note) {
    loadNoteData()
  }
})

watch(() => props.note, () => {
  if (props.note) {
    loadNoteData()
  }
})

onMounted(() => {
  if (props.note) {
    loadNoteData()
  }
})
</script>
