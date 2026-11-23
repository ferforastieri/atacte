<template>
  <div class="min-h-screen bg-canvas">
    <AppHeader :show-logo="true" :show-navigation="true" />

    <main class="mx-auto w-full max-w-[1600px] px-4 pb-24 pt-6 sm:px-6 sm:pt-8 md:pb-10 lg:px-10">
      <section class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-700 dark:text-primary-400">Segurança</p>
          <h1 class="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Sessões</h1>
          <p class="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-muted">
            Dispositivos com acesso ao seu cofre. Encerre o que você não reconhece.
          </p>
        </div>

        <BaseButton
          variant="danger"
          :loading="isRevokingAll"
          :disabled="isRevokingAll || sessions.length === 0"
          @click="openRevokeAllModal"
        >
          <TrashIcon v-if="!isRevokingAll" class="mr-2 h-4 w-4" />
          Revogar Todas
        </BaseButton>
      </section>

      <div class="mb-5">
        <div v-if="isLoading" class="hero-card p-5">
          <div class="relative flex items-center gap-3">
            <div class="skeleton h-11 w-11 rounded-xl bg-white/10"></div>
            <div class="space-y-2">
              <div class="skeleton h-3.5 w-28 bg-white/10"></div>
              <div class="skeleton h-3 w-44 bg-white/10"></div>
            </div>
          </div>
        </div>
        <div v-else class="hero-card p-5">
          <div class="hero-glow"></div>
          <div class="relative flex items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-3">
              <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-300 ring-1 ring-primary-500/30">
                <CheckCircleIcon class="h-5 w-5" />
              </div>
              <div class="min-w-0">
                <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Sessão Atual</p>
                <p class="mt-0.5 truncate text-sm font-medium text-white">{{ currentSession?.deviceName || 'Esta é sua sessão atual' }}</p>
              </div>
            </div>
            <span class="pill bg-primary-500/20 text-primary-300">
              <span class="h-1.5 w-1.5 rounded-full bg-primary-400"></span>
              Ativa
            </span>
          </div>
        </div>
      </div>

      <BaseCard>
        <div v-if="isLoading" class="p-1">
          <SkeletonTable :rows="5" :columns="6" />
        </div>

        <div v-else-if="sessions.length > 0">
          <div class="table-shell">
            <table class="w-full min-w-[760px] table-fixed divide-y divide-line">
              <colgroup>
                <col class="w-[30%]" />
                <col class="w-[13%]" />
                <col class="w-[16%]" />
                <col class="w-[17%]" />
                <col class="w-[10%]" />
                <col class="w-[14%]" />
              </colgroup>
              <thead class="table-head">
                <tr>
                  <th class="px-4 py-3">Dispositivo</th>
                  <th class="px-4 py-3">IP Address</th>
                  <th class="px-4 py-3">Criada em</th>
                  <th class="px-4 py-3">Última Atividade</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-line bg-surface">
                <tr v-for="session in sessions" :key="session.id" class="table-row">
                  <td class="whitespace-nowrap px-4 py-3">
                    <div class="flex items-center gap-3">
                      <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-surface-muted text-ink-subtle">
                        <ComputerDesktopIcon class="h-4 w-4" />
                      </div>
                      <div class="min-w-0">
                        <p class="text-sm font-medium text-ink">{{ session.deviceName || 'Dispositivo Desconhecido' }}</p>
                        <p class="truncate text-xs text-ink-muted">{{ session.userAgent || '-' }}</p>
                      </div>
                    </div>
                  </td>

                  <td class="whitespace-nowrap px-4 py-3 text-sm text-ink-muted">
                    {{ session.ipAddress || '-' }}
                  </td>

                  <td class="whitespace-nowrap px-4 py-3 text-sm text-ink-muted">
                    {{ formatDateTime(session.createdAt) }}
                  </td>

                  <td class="whitespace-nowrap px-4 py-3 text-sm text-ink-muted">
                    {{ formatDateTime(session.lastUsed) }}
                  </td>

                  <td class="whitespace-nowrap px-4 py-3">
                    <span :class="session.isCurrent ? 'pill-success' : 'pill-neutral'">
                      {{ session.isCurrent ? 'Atual' : 'Ativa' }}
                    </span>
                  </td>

                  <td class="whitespace-nowrap px-4 py-3 text-right">
                    <BaseButton
                      v-if="!session.isCurrent"
                      variant="ghost"
                      size="sm"
                      class="text-danger-600 hover:bg-danger-50 hover:text-danger-700 dark:text-danger-400 dark:hover:bg-danger-900/20"
                      :loading="revokingId === session.id"
                      :disabled="revokingId !== null"
                      @click="revokeSession(session.id)"
                    >
                      Revogar
                    </BaseButton>
                    <span v-else class="text-xs text-ink-subtle">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <Pagination
            v-if="sessions.length > 0"
            class="mt-4"
            :current-page="pagination.currentPage"
            :total-pages="pagination.totalPages"
            :total="pagination.total"
            :limit="pagination.limit"
            :busy="isLoading"
            @previous="previousPage"
            @next="nextPage"
            @go-to-page="goToPage"
          />
        </div>

        <EmptyState
          v-else
          :icon="ComputerDesktopIcon"
          title="Nenhuma sessão encontrada"
          description="Você não tem sessões ativas."
        />
      </BaseCard>
    </main>

    <ConfirmModal
      :show="showRevokeAllModal"
      title="Revogar Todas as Sessões"
      message="Tem certeza que deseja revogar todas as sessões? Você será deslogado."
      confirm-text="Revogar Todas"
      cancel-text="Cancelar"
      variant="danger"
      :loading="isRevokingAll"
      @confirm="confirmRevokeAllSessions"
      @cancel="closeRevokeAllModal"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  CheckCircleIcon,
  ComputerDesktopIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'
import {
  AppHeader,
  BaseButton,
  BaseCard,
  ConfirmModal,
  EmptyState,
  Pagination,
  SkeletonTable
} from '@/components/ui'
import authApi, { type Session } from '@/api/auth'
import { useToast } from '@/hooks/useToast'

const toast = useToast()

const sessions = ref<Session[]>([])
const isLoading = ref(true)
const isRevokingAll = ref(false)
const revokingId = ref<string | null>(null)
const showRevokeAllModal = ref(false)
const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  total: 0,
  limit: 10
})

const currentSession = computed(() => sessions.value.find(s => s.isCurrent))

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const revokeSession = async (sessionId: string) => {
  if (revokingId.value) return

  revokingId.value = sessionId
  try {
    await authApi.revokeSession(sessionId)
    await fetchSessions()
  } catch {
    toast.error('Não foi possível revogar a sessão.')
  } finally {
    revokingId.value = null
  }
}

const openRevokeAllModal = () => {
  showRevokeAllModal.value = true
}

const closeRevokeAllModal = () => {
  showRevokeAllModal.value = false
}

const confirmRevokeAllSessions = async () => {
  if (isRevokingAll.value) return

  isRevokingAll.value = true
  try {
    const sessionsToRevoke = sessions.value.filter(s => !s.isCurrent)
    await Promise.all(sessionsToRevoke.map(session => authApi.revokeSession(session.id)))

    closeRevokeAllModal()
    await fetchSessions()
  } catch {
    toast.error('Não foi possível revogar todas as sessões.')
  } finally {
    isRevokingAll.value = false
  }
}

const fetchSessions = async () => {
  isLoading.value = true
  try {
    const offset = (pagination.value.currentPage - 1) * pagination.value.limit
    const response = await authApi.getSessions(pagination.value.limit, offset)
    if (response.success && response.data) {
      sessions.value = response.data
      if (response.pagination) {
        pagination.value.total = response.pagination.total
        pagination.value.totalPages = Math.ceil(response.pagination.total / pagination.value.limit)
      }
    } else {
      sessions.value = []
      pagination.value.total = 0
      pagination.value.totalPages = 1
    }
  } catch {
    sessions.value = []
    pagination.value.total = 0
    pagination.value.totalPages = 1
    toast.error('Não foi possível carregar as sessões.')
  } finally {
    isLoading.value = false
  }
}

const goToPage = (page: number) => {
  pagination.value.currentPage = page
  fetchSessions()
}

const nextPage = () => {
  if (pagination.value.currentPage < pagination.value.totalPages) {
    pagination.value.currentPage++
    fetchSessions()
  }
}

const previousPage = () => {
  if (pagination.value.currentPage > 1) {
    pagination.value.currentPage--
    fetchSessions()
  }
}

onMounted(() => {
  fetchSessions()
})
</script>
