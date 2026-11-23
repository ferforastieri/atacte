<template>
  <div class="min-h-screen bg-canvas">
    <AppHeader
      :show-logo="true"
      :show-back-button="true"
      :show-navigation="true"
      :title="password?.name || 'Detalhes da senha'"
    />

    <main v-if="isLoading" class="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10">
      <div class="mb-6 flex items-center justify-between gap-4">
        <div class="space-y-2">
          <div class="skeleton h-3 w-24"></div>
          <div class="skeleton h-7 w-56"></div>
        </div>
        <div class="flex gap-2">
          <div class="skeleton h-10 w-24 rounded-xl"></div>
          <div class="skeleton h-10 w-24 rounded-xl"></div>
        </div>
      </div>
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="space-y-6 lg:col-span-2">
          <div v-for="index in 3" :key="index" class="surface-card space-y-4 p-5 sm:p-6">
            <div class="skeleton h-4 w-40"></div>
            <div class="skeleton h-3 w-full"></div>
            <div class="skeleton h-3 w-4/5"></div>
            <div v-if="index === 2" class="skeleton h-16 w-full rounded-xl"></div>
          </div>
        </div>
        <div class="space-y-6">
          <div v-for="index in 2" :key="index" class="surface-card space-y-3 p-5 sm:p-6">
            <div class="skeleton h-4 w-28"></div>
            <div class="skeleton h-10 w-full rounded-xl"></div>
            <div class="skeleton h-10 w-full rounded-xl"></div>
          </div>
        </div>
      </div>
    </main>

    <main v-else-if="password" class="mx-auto w-full max-w-[1400px] px-4 py-6 pb-24 sm:px-6 sm:py-8 md:pb-10 lg:px-10">
      <section class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-700 dark:text-primary-400">Credencial</p>
          <h1 class="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{{ password.name }}</h1>
          <p class="mt-1.5 text-sm text-ink-muted">
            Atualizada em {{ formatDate(password.updatedAt) }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <BaseButton variant="secondary" :disabled="isRemovingTotp" @click="editPassword">
            <PencilIcon class="mr-2 h-4 w-4" />
            Editar
          </BaseButton>
          <BaseButton variant="danger" :disabled="isDeleting" @click="deletePassword">
            <TrashIcon class="mr-2 h-4 w-4" />
            Deletar
          </BaseButton>
        </div>
      </section>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="space-y-6 lg:col-span-2">
          <BaseCard>
            <div class="mb-5 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="icon-tile">
                  <InformationCircleIcon class="h-5 w-5" />
                </div>
                <h2 class="section-title">Informações Básicas</h2>
              </div>
              <button
                type="button"
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted transition-colors hover:bg-danger-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-danger-900/20"
                :class="password.isFavorite ? 'text-danger-500' : 'text-ink-muted'"
                :disabled="isTogglingFavorite"
                :title="password.isFavorite ? 'Remover das favoritas' : 'Marcar como favorita'"
                :aria-label="password.isFavorite ? 'Remover das favoritas' : 'Marcar como favorita'"
                @click="toggleFavorite"
              >
                <span
                  v-if="isTogglingFavorite"
                  class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                ></span>
                <HeartIcon v-else class="h-5 w-5" :class="{ 'fill-current': password.isFavorite }" />
              </button>
            </div>

            <div class="data-list">
              <div class="data-field">
                <p class="data-field-label">Nome</p>
                <p class="data-field-value font-medium">{{ password.name }}</p>
              </div>

              <div v-if="password.website" class="data-field">
                <p class="data-field-label">Website</p>
                <a
                  :href="password.website"
                  target="_blank"
                  rel="noreferrer"
                  class="mt-1 block break-all text-sm font-medium text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  {{ password.website }}
                </a>
              </div>

              <div v-if="password.username" class="data-field">
                <p class="data-field-label">Usuário</p>
                <div class="mt-1 flex items-center gap-2">
                  <p class="min-w-0 flex-1 break-all text-sm font-medium text-ink">{{ password.username }}</p>
                  <button
                    type="button"
                    class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50"
                    :disabled="copyingField === 'username'"
                    aria-label="Copiar usuário"
                    @click="handleCopyToClipboard(password.username, 'username')"
                  >
                    <span
                      v-if="copyingField === 'username'"
                      class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    ></span>
                    <ClipboardIcon v-else class="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div v-if="password.folder" class="data-field">
                <p class="data-field-label">Pasta</p>
                <p class="data-field-value flex items-center gap-1.5 font-medium">
                  <FolderIcon class="h-4 w-4 text-ink-subtle" />
                  {{ password.folder }}
                </p>
              </div>
            </div>
          </BaseCard>

          <BaseCard>
            <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-3">
                <div class="icon-tile">
                  <LockClosedIcon class="h-5 w-5" />
                </div>
                <h2 class="section-title">Senha</h2>
              </div>

              <div class="flex items-center gap-1.5">
                <BaseButton variant="ghost" size="sm" @click="showPassword = !showPassword">
                  <component :is="showPassword ? EyeSlashIcon : EyeIcon" class="mr-1 h-4 w-4" />
                  {{ showPassword ? 'Ocultar' : 'Mostrar' }}
                </BaseButton>
                <BaseButton
                  variant="subtle"
                  size="sm"
                  :loading="copyingField === 'password'"
                  :disabled="copyingField === 'password'"
                  @click="handleCopyToClipboard(password.password, 'password')"
                >
                  <ClipboardIcon v-if="copyingField !== 'password'" class="mr-1 h-4 w-4" />
                  Copiar
                </BaseButton>
              </div>
            </div>

            <div class="hero-card p-4 sm:p-5">
              <div class="hero-glow"></div>
              <p class="mono-secret relative min-h-[2rem] text-lg leading-relaxed text-white">
                {{ showPassword ? password.password : '••••••••••••••••' }}
              </p>
            </div>
          </BaseCard>

          <BaseCard v-if="password.totpEnabled">
            <div class="mb-4 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="icon-tile">
                  <KeyIcon class="h-5 w-5" />
                </div>
                <div>
                  <h2 class="section-title">Código 2FA</h2>
                  <p class="text-xs text-ink-muted">TOTP ativo nesta credencial</p>
                </div>
              </div>
              <BaseButton
                variant="ghost"
                size="sm"
                :loading="isRemovingTotp"
                :disabled="isRemovingTotp"
                @click="removeTotp"
              >
                <TrashIcon v-if="!isRemovingTotp" class="mr-1 h-4 w-4" />
                Remover TOTP
              </BaseButton>
            </div>

            <div v-if="isLoadingTotp" class="hero-card space-y-3 p-5">
              <div class="skeleton h-3 w-24 bg-white/10"></div>
              <div class="skeleton h-9 w-2/3 bg-white/10"></div>
              <div class="skeleton h-1.5 w-full bg-white/10"></div>
            </div>
            <TotpCode
              v-else
              :secret="totpSecret"
              :code="fallbackTotpCode"
              @refresh="loadTotpSecret"
            />
          </BaseCard>

          <BaseCard v-if="password.customFields && password.customFields.length > 0">
            <div class="mb-4 flex items-center gap-3">
              <div class="icon-tile">
                <SquaresPlusIcon class="h-5 w-5" />
              </div>
              <h2 class="section-title">Campos Personalizados</h2>
            </div>

            <div class="data-list">
              <div
                v-for="field in password.customFields"
                :key="field.id"
                class="data-field flex items-center justify-between gap-3"
              >
                <div class="min-w-0 flex-1">
                  <p class="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">{{ field.fieldName }}</p>
                  <p class="mono-secret mt-1 text-sm text-ink">
                    {{ showPassword || field.fieldType !== 'password' ? field.value : '••••••••••••••••' }}
                  </p>
                </div>

                <button
                  type="button"
                  class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50"
                  :disabled="copyingField === field.id"
                  :aria-label="`Copiar ${field.fieldName}`"
                  @click="handleCopyToClipboard(field.value, field.id)"
                >
                  <span
                    v-if="copyingField === field.id"
                    class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                  ></span>
                  <ClipboardIcon v-else class="h-4 w-4" />
                </button>
              </div>
            </div>
          </BaseCard>

          <BaseCard v-if="password.notes">
            <div class="mb-3 flex items-center gap-3">
              <div class="icon-tile">
                <DocumentTextIcon class="h-5 w-5" />
              </div>
              <h2 class="section-title">Notas</h2>
            </div>
            <p class="whitespace-pre-wrap border-t border-line pt-4 text-sm leading-relaxed text-ink-muted">{{ password.notes }}</p>
          </BaseCard>
        </div>

        <div class="space-y-6">
          <BaseCard>
            <h2 class="section-title mb-4">Ações Rápidas</h2>
            <div class="space-y-2">
              <BaseButton
                block
                class="justify-start"
                :loading="copyingField === 'password'"
                :disabled="copyingField === 'password'"
                @click="handleCopyToClipboard(password.password, 'password')"
              >
                <ClipboardIcon v-if="copyingField !== 'password'" class="mr-2 h-4 w-4" />
                Copiar Senha
              </BaseButton>

              <BaseButton
                v-if="password.username"
                variant="secondary"
                block
                class="justify-start"
                :loading="copyingField === 'username'"
                :disabled="copyingField === 'username'"
                @click="handleCopyToClipboard(password.username, 'username')"
              >
                <UserIcon v-if="copyingField !== 'username'" class="mr-2 h-4 w-4" />
                Copiar Usuário
              </BaseButton>

              <BaseButton
                v-if="password.website"
                variant="secondary"
                block
                class="justify-start"
                @click="openWebsite"
              >
                <GlobeAltIcon class="mr-2 h-4 w-4" />
                Abrir Site
              </BaseButton>
            </div>
          </BaseCard>

          <BaseCard>
            <h2 class="section-title mb-4">Informações</h2>
            <div class="data-list">
              <div class="data-field">
                <p class="data-field-label">Criado</p>
                <p class="data-field-value">{{ formatDate(password.createdAt) }}</p>
              </div>
              <div class="data-field">
                <p class="data-field-label">Atualizado</p>
                <p class="data-field-value">{{ formatDate(password.updatedAt) }}</p>
              </div>
              <div v-if="password.lastUsed" class="data-field">
                <p class="data-field-label">Último uso</p>
                <p class="data-field-value">{{ formatDate(password.lastUsed) }}</p>
              </div>
            </div>
          </BaseCard>
        </div>
      </div>
    </main>

    <main v-else class="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-10">
      <EmptyState
        :icon="LockClosedIcon"
        title="Senha não encontrada"
        description="Ela pode ter sido excluída ou o endereço está incorreto."
      >
        <BaseButton variant="secondary" @click="$router.push('/dashboard')">
          Voltar ao Dashboard
        </BaseButton>
      </EmptyState>
    </main>

    <EditPasswordModal
      :show="showEditModal"
      :password="password"
      @close="showEditModal = false"
      @updated="handlePasswordUpdated"
    />

    <ConfirmModal
      :show="showDeleteModal"
      title="Excluir Senha"
      :message="`Tem certeza que deseja excluir a senha '${password?.name || ''}'? Esta ação não pode ser desfeita.`"
      confirm-text="Excluir"
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ClipboardIcon,
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon,
  FolderIcon,
  GlobeAltIcon,
  HeartIcon,
  InformationCircleIcon,
  KeyIcon,
  LockClosedIcon,
  PencilIcon,
  SquaresPlusIcon,
  TrashIcon,
  UserIcon
} from '@heroicons/vue/24/outline'
import { usePasswordsStore } from '@/stores/passwords'
import {
  AppHeader,
  BaseButton,
  BaseCard,
  ConfirmModal,
  EmptyState,
  TotpCode
} from '@/components/ui'
import { copyToClipboard } from '@/utils/clipboard'
import { useToast } from '@/hooks/useToast'
import EditPasswordModal from '@/components/passwords/EditPasswordModal.vue'

const route = useRoute()
const router = useRouter()
const passwordsStore = usePasswordsStore()
const toast = useToast()

const isLoading = ref(true)
const isDeleting = ref(false)
const isTogglingFavorite = ref(false)
const isRemovingTotp = ref(false)
const isLoadingTotp = ref(false)
const showPassword = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const copyingField = ref<string | null>(null)
const totpSecret = ref<string | null>(null)
const fallbackTotpCode = ref<string | null>(null)

const password = computed(() => passwordsStore.currentPassword)

const handleCopyToClipboard = async (text: string, field: string) => {
  if (copyingField.value) return

  copyingField.value = field
  try {
    const result = await copyToClipboard(text)
    if (result.success) {
      toast.success('Copiado para a área de transferência.')
    } else {
      toast.error('Não foi possível copiar.')
    }
  } finally {
    copyingField.value = null
  }
}

const toggleFavorite = async () => {
  if (!password.value || isTogglingFavorite.value) return

  isTogglingFavorite.value = true
  try {
    await passwordsStore.updatePassword(password.value.id, {
      id: password.value.id,
      isFavorite: !password.value.isFavorite
    })
  } catch {
    toast.error('Não foi possível atualizar a favorita.')
  } finally {
    isTogglingFavorite.value = false
  }
}

const openWebsite = () => {
  if (password.value?.website) {
    window.open(password.value.website, '_blank')
  }
}

const loadTotpSecret = async () => {
  if (!password.value?.id || !password.value.totpEnabled) return

  isLoadingTotp.value = true
  try {
    const response = await passwordsStore.getTotpSecret(password.value.id)
    if (response?.secret) {
      totpSecret.value = response.secret
    } else {
      fallbackTotpCode.value = null
    }
  } catch {
    try {
      const code = await passwordsStore.getTotpCode(password.value.id)
      fallbackTotpCode.value = code?.code || null
    } catch {
      // The code area stays in the empty state.
    }
  } finally {
    isLoadingTotp.value = false
  }
}

const removeTotp = async () => {
  if (!password.value || isRemovingTotp.value) return

  isRemovingTotp.value = true
  try {
    await passwordsStore.removeTotp(password.value.id)
    totpSecret.value = null
    fallbackTotpCode.value = null
  } catch {
    toast.error('Não foi possível remover o TOTP.')
  } finally {
    isRemovingTotp.value = false
  }
}

const editPassword = () => {
  showEditModal.value = true
}

const deletePassword = () => {
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!password.value || isDeleting.value) return

  isDeleting.value = true
  try {
    await passwordsStore.deletePassword(password.value.id)
    showDeleteModal.value = false
    router.push('/dashboard')
  } catch {
    toast.error('Não foi possível excluir a senha.')
  } finally {
    isDeleting.value = false
  }
}

const handlePasswordUpdated = async () => {
  showEditModal.value = false
  await loadPassword()
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('pt-BR')
}

const loadPassword = async () => {
  const passwordId = route.params.id as string
  if (!passwordId) {
    isLoading.value = false
    return
  }

  isLoading.value = true
  passwordsStore.clearCurrentPassword()
  try {
    await passwordsStore.fetchPasswordById(passwordId)
    await loadTotpSecret()
  } catch {
    toast.error('Não foi possível carregar a senha.')
  } finally {
    isLoading.value = false
  }
}

watch(() => route.params.id, loadPassword)

onMounted(loadPassword)
</script>
