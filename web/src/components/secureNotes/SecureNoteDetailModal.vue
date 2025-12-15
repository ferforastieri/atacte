<template>
  <BaseModal :show="show" @close="$emit('close')" size="xl">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-3">
          <DocumentTextIcon class="h-6 w-6 text-primary-600 dark:text-primary-400" />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ note?.title || 'Detalhes da Nota' }}</h3>
          <StarIcon
            v-if="note?.isFavorite"
            class="h-5 w-5 text-yellow-500 fill-current"
          />
        </div>
      </div>
    </template>

    <div v-if="note" class="space-y-6">
      <!-- Book-like Reading View -->
      <div class="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-8 shadow-inner border-2 border-amber-200 dark:border-amber-800">
        <div class="max-w-3xl mx-auto">
          <!-- Book Header -->
          <div class="text-left mb-8 pb-6 border-b-2 border-amber-300 dark:border-amber-700">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{{ note.title }}</h1>
            <div class="flex items-center justify-start gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span v-if="note.folder" class="flex items-center gap-1">
                <FolderIcon class="h-4 w-4" />
                {{ note.folder }}
              </span>
              <span class="flex items-center gap-1">
                <ClockIcon class="h-4 w-4" />
                {{ formatDate(note.updatedAt) }}
              </span>
            </div>
          </div>

          <!-- Book Content -->
          <div class="prose prose-lg dark:prose-invert max-w-none">
            <div class="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-serif text-base">
              {{ note.content }}
            </div>
          </div>
        </div>
      </div>

      <!-- Metadata -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pasta</label>
          <p class="text-sm text-gray-900 dark:text-gray-100">{{ note.folder || 'Sem pasta' }}</p>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Última atualização</label>
          <p class="text-sm text-gray-900 dark:text-gray-100">{{ formatDateTime(note.updatedAt) }}</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <div>
          <BaseButton
            variant="danger"
            @click="handleDelete"
            :loading="isDeleting"
          >
            Excluir
          </BaseButton>
        </div>
        <div class="flex space-x-3">
          <BaseButton variant="ghost" @click="$emit('close')">
            Fechar
          </BaseButton>
          <BaseButton variant="primary" @click="handleEdit">
            Editar
          </BaseButton>
        </div>
      </div>
    </template>
  </BaseModal>

  <!-- Modal de Edição -->
  <EditSecureNoteModal
    :show="showEditModal"
    :note="note"
    :folders="folders"
    @close="handleEditClose"
    @updated="handleEditUpdated"
  />

  <!-- Modal de Confirmação de Exclusão -->
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
import { useToast } from '@/hooks/useToast'
import { DocumentTextIcon, StarIcon, FolderIcon, ClockIcon } from '@heroicons/vue/24/outline'
import { BaseModal, BaseButton, ConfirmModal } from '@/components/ui'
import { type SecureNote } from '@/api/secureNotes'
import { useSecureNotesStore } from '@/stores/secureNotes'
import EditSecureNoteModal from './EditSecureNoteModal.vue'

interface Props {
  show: boolean
  note: SecureNote | null
  folders?: string[]
}

interface Emits {
  (e: 'close'): void
  (e: 'updated'): void
  (e: 'deleted'): void
}

const props = withDefaults(defineProps<Props>(), {
  folders: () => []
})

const emit = defineEmits<Emits>()
const toast = useToast()
const secureNotesStore = useSecureNotesStore()

const isDeleting = ref(false)
const showEditModal = ref(false)
const showDeleteConfirm = ref(false)

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('pt-BR', {
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
  toast.success('Nota atualizada com sucesso!')
}

const handleEditClose = () => {
  showEditModal.value = false
}

const handleDelete = () => {
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!props.note) return
  
  isDeleting.value = true
  
  try {
    await secureNotesStore.deleteNote(props.note.id)
    toast.success('Nota excluída com sucesso!')
    emit('deleted')
    emit('close')
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Erro ao excluir nota')
  } finally {
    isDeleting.value = false
    showDeleteConfirm.value = false
  }
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
}
</script>

<style scoped>
.prose {
  @apply text-gray-800 dark:text-gray-200;
}

.prose p {
  @apply mb-4;
}

.prose h1, .prose h2, .prose h3 {
  @apply text-gray-900 dark:text-gray-100;
}
</style>

