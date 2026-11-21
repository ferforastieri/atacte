<template>
  <BaseModal :show="show" size="xl" @close="$emit('close')">
    <template #header>
      <div class="flex min-w-0 items-center gap-3">
        <div class="icon-tile h-11 w-11">
          <DocumentTextIcon class="h-5 w-5" />
        </div>
        <div class="min-w-0">
          <h3 class="truncate text-lg font-semibold text-ink">{{ note?.title || 'Detalhes da Nota' }}</h3>
          <div class="mt-1 flex flex-wrap items-center gap-1.5">
            <span v-if="note?.isFavorite" class="pill-warning">
              <StarIcon class="h-3 w-3 fill-current" /> Favorita
            </span>
            <span v-if="note?.folder" class="pill-neutral">{{ note.folder }}</span>
            <span class="pill-neutral">Atualizada em {{ formatDateTime(note?.updatedAt || '') }}</span>
          </div>
        </div>
      </div>
    </template>

    <div v-if="note" class="space-y-4">
      <div class="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
        <span class="inline-flex items-center gap-1.5">
          <FolderIcon class="h-4 w-4 text-ink-subtle" />
          {{ note.folder || 'Sem pasta' }}
        </span>
        <span class="inline-flex items-center gap-1.5">
          <ClockIcon class="h-4 w-4 text-ink-subtle" />
          {{ formatDate(note.updatedAt) }}
        </span>
      </div>

      <article class="rounded-2xl border border-line bg-surface-muted p-5 sm:p-8">
        <h2 class="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{{ note.title }}</h2>
        <div class="mt-4 whitespace-pre-wrap text-base leading-relaxed text-ink">
          {{ note.content }}
        </div>
      </article>
    </div>

    <template #footer>
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <BaseButton variant="danger" :loading="isDeleting" :disabled="isDeleting" @click="handleDelete">
          Excluir
        </BaseButton>
        <div class="flex flex-col-reverse gap-2 sm:flex-row">
          <BaseButton variant="ghost" :disabled="isDeleting" @click="$emit('close')">
            Fechar
          </BaseButton>
          <BaseButton :disabled="isDeleting" @click="handleEdit">
            Editar
          </BaseButton>
        </div>
      </div>
    </template>
  </BaseModal>

  <EditSecureNoteModal
    :show="showEditModal"
    :note="note"
    :folders="folders"
    @close="handleEditClose"
    @updated="handleEditUpdated"
  />

  <ConfirmModal
    :show="showDeleteConfirm"
    title="Excluir Nota"
    :message="`Tem certeza que deseja excluir a nota '${note?.title || ''}'? Esta ação não pode ser desfeita.`"
    confirm-text="Excluir"
    :loading="isDeleting"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  ClockIcon,
  DocumentTextIcon,
  FolderIcon,
  StarIcon
} from '@heroicons/vue/24/outline'
import { BaseModal, BaseButton, ConfirmModal } from '@/components/ui'
import { type SecureNote } from '@/api/secureNotes'
import { useSecureNotesStore } from '@/stores/secureNotes'
import { useToast } from '@/hooks/useToast'
import EditSecureNoteModal from './EditSecureNoteModal.vue'

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
  deleted: []
}>()

const secureNotesStore = useSecureNotesStore()
const toast = useToast()

const isDeleting = ref(false)
const showEditModal = ref(false)
const showDeleteConfirm = ref(false)

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleEdit = () => {
  showEditModal.value = true
}

const handleEditUpdated = () => {
  emit('updated')
}

const handleEditClose = () => {
  showEditModal.value = false
}

const handleDelete = () => {
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!props.note || isDeleting.value) return

  isDeleting.value = true

  try {
    await secureNotesStore.deleteNote(props.note.id)
    emit('deleted')
    emit('close')
  } catch {
    toast.error('Não foi possível excluir a nota.')
  } finally {
    isDeleting.value = false
    showDeleteConfirm.value = false
  }
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
}
</script>
