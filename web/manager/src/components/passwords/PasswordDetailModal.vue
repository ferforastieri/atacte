<template>
  <BaseModal :show="show" size="lg" @close="$emit('close')">
    <template #header>
      <div class="flex min-w-0 items-center gap-3">
        <div class="icon-tile h-11 w-11">
          <LockClosedIcon class="h-5 w-5" />
        </div>
        <div class="min-w-0">
          <h3 class="truncate text-lg font-semibold text-ink">{{ password?.name || 'Detalhes da Senha' }}</h3>
          <div class="mt-1 flex flex-wrap items-center gap-1.5">
            <span v-if="password?.isFavorite" class="pill-danger">
              <HeartIcon class="h-3 w-3 fill-current" /> Favorita
            </span>
            <span v-if="password?.totpEnabled" class="pill-info">
              <KeyIcon class="h-3 w-3" /> TOTP
            </span>
            <span v-if="password?.folder" class="pill-neutral">{{ password.folder }}</span>
          </div>
        </div>
      </div>
    </template>

    <div v-if="password" class="space-y-5">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div class="surface-muted p-3.5">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">Nome</p>
          <p class="mt-1 break-words text-sm font-medium text-ink">{{ password.name }}</p>
        </div>

        <div v-if="password.website" class="surface-muted p-3.5">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">Website</p>
          <a
            :href="password.website"
            target="_blank"
            rel="noreferrer"
            class="mt-1 block break-all text-sm font-medium text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
          >
            {{ password.website }}
          </a>
        </div>

        <div v-if="password.username" class="surface-muted p-3.5 sm:col-span-2">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">Usuário</p>
          <div class="mt-1 flex items-center gap-2">
            <p class="min-w-0 flex-1 break-all text-sm font-medium text-ink">{{ password.username }}</p>
            <button
              type="button"
              class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-surface hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50"
              :disabled="isCopyingUsername"
              aria-label="Copiar usuário"
              title="Copiar usuário"
              @click="copyUsername"
            >
              <span
                v-if="isCopyingUsername"
                class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              ></span>
              <ClipboardIcon v-else class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div class="hero-card p-4 sm:p-5">
        <div class="hero-glow"></div>
        <div class="relative">
          <div class="flex items-center justify-between gap-3">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Senha</p>
            <div class="flex items-center gap-1">
              <button
                type="button"
                class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                :title="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                @click="showPassword = !showPassword"
              >
                <EyeSlashIcon v-if="showPassword" class="h-4 w-4" />
                <EyeIcon v-else class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50"
                :disabled="isCopyingPassword"
                @click="copyPassword"
              >
                <span
                  v-if="isCopyingPassword"
                  class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                ></span>
                <ClipboardIcon v-else class="h-3.5 w-3.5" />
                Copiar
              </button>
            </div>
          </div>

          <p class="mono-secret mt-3 min-h-[2rem] text-lg leading-relaxed text-white">
            {{ showPassword ? password.password : '••••••••••••••••' }}
          </p>
        </div>
      </div>

      <div v-if="password.totpEnabled">
        <div class="mb-2 flex items-center justify-between">
          <p class="text-sm font-medium text-ink">Código TOTP</p>
          <span class="pill-info"><KeyIcon class="h-3.5 w-3.5" /> Ativo</span>
        </div>
        <div v-if="isLoadingTotp" class="hero-card p-5">
          <div class="relative space-y-3">
            <div class="skeleton h-3 w-24 bg-white/10"></div>
            <div class="skeleton h-9 w-2/3 bg-white/10"></div>
            <div class="skeleton h-1.5 w-full bg-white/10"></div>
          </div>
        </div>
        <TotpCode
          v-else
          :secret="totpSecret"
          :code="fallbackCode"
          @refresh="refreshTotpCode"
        />
      </div>

      <div v-if="password.notes">
        <p class="text-sm font-medium text-ink">Notas</p>
        <p class="mt-1.5 whitespace-pre-wrap rounded-xl border border-line bg-surface-muted p-3.5 text-sm leading-relaxed text-ink-muted">{{ password.notes }}</p>
      </div>
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

  <EditPasswordModal
    :show="showEditModal"
    :password="password"
    @close="handleEditClose"
    @updated="handleEditUpdated"
  />

  <ConfirmModal
    :show="showDeleteConfirm"
    title="Excluir Senha"
    :message="`Tem certeza que deseja excluir a senha '${password?.name || ''}'? Esta ação não pode ser desfeita.`"
    confirm-text="Excluir"
    :loading="isDeleting"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import {
  ClipboardIcon,
  EyeIcon,
  EyeSlashIcon,
  HeartIcon,
  KeyIcon,
  LockClosedIcon
} from '@heroicons/vue/24/outline'
import { BaseModal, BaseButton, ConfirmModal, TotpCode } from '@/components/ui'
import { type PasswordEntry } from '@/api/passwords'
import { usePasswordsStore } from '@/stores/passwords'
import { copyToClipboard } from '@/utils/clipboard'
import { useToast } from '@/hooks/useToast'
import EditPasswordModal from './EditPasswordModal.vue'

interface Props {
  show: boolean
  password: PasswordEntry | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  updated: []
  deleted: []
}>()

const passwordsStore = usePasswordsStore()
const toast = useToast()

const isDeleting = ref(false)
const isCopyingPassword = ref(false)
const isCopyingUsername = ref(false)
const isLoadingTotp = ref(false)
const showPassword = ref(false)
const totpSecret = ref<string | null>(null)
const fallbackCode = ref<string | null>(null)
const showEditModal = ref(false)
const showDeleteConfirm = ref(false)

const copyPassword = async () => {
  if (!props.password || isCopyingPassword.value) return

  isCopyingPassword.value = true
  try {
    const result = await copyToClipboard(props.password.password)
    if (result.success) {
      toast.success('Senha copiada.')
    } else {
      toast.error('Não foi possível copiar a senha.')
    }
  } finally {
    isCopyingPassword.value = false
  }
}

const copyUsername = async () => {
  if (!props.password?.username || isCopyingUsername.value) return

  isCopyingUsername.value = true
  try {
    const result = await copyToClipboard(props.password.username)
    if (result.success) {
      toast.success('Usuário copiado.')
    } else {
      toast.error('Não foi possível copiar o usuário.')
    }
  } finally {
    isCopyingUsername.value = false
  }
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
  if (!props.password || isDeleting.value) return

  isDeleting.value = true

  try {
    await passwordsStore.deletePassword(props.password.id)
    emit('deleted')
    emit('close')
  } catch {
    toast.error('Não foi possível excluir a senha.')
  } finally {
    isDeleting.value = false
    showDeleteConfirm.value = false
  }
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
}

const loadTotpSecret = async () => {
  if (!props.password?.id || !props.password?.totpEnabled) return

  isLoadingTotp.value = true
  try {
    const secretData = await passwordsStore.getTotpSecret(props.password.id)
    if (secretData?.secret) {
      totpSecret.value = secretData.secret
    }
  } catch {
    try {
      const code = await passwordsStore.getTotpCode(props.password.id)
      fallbackCode.value = code?.code || null
    } catch {
      // The code area stays in the empty state.
    }
  } finally {
    isLoadingTotp.value = false
  }
}

const refreshTotpCode = async () => {
  await loadTotpSecret()
}

watch(() => props.show, async (show) => {
  if (show && props.password?.totpEnabled) {
    await loadTotpSecret()
  }
})

watch(() => props.password?.password, (newPassword) => {
  if (newPassword) {
    showPassword.value = false
  }
}, { immediate: true })

watch(() => props.password?.id, async (id) => {
  if (id && props.password?.totpEnabled) {
    await loadTotpSecret()
  }
})

onMounted(() => {
  if (props.show && props.password?.totpEnabled) {
    loadTotpSecret()
  }
})

onUnmounted(() => {
  totpSecret.value = null
  fallbackCode.value = null
})
</script>
