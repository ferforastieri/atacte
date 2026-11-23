<template>
  <div class="min-h-screen bg-canvas">
    <AppHeader :show-logo="true" :show-navigation="true" />

    <main class="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8 md:pb-10 lg:px-10">
      <section class="mb-6">
        <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-700 dark:text-primary-400">Conta</p>
        <h1 class="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Perfil</h1>
        <p class="mt-1.5 text-sm leading-relaxed text-ink-muted">Seus dados de acesso e o resumo do cofre.</p>
      </section>

      <div v-if="isLoading" class="space-y-6">
        <div class="surface-card p-6">
          <div class="flex items-center gap-5">
            <div class="skeleton h-20 w-20 rounded-2xl"></div>
            <div class="flex-1 space-y-3">
              <div class="skeleton h-5 w-48"></div>
              <div class="skeleton h-3.5 w-64"></div>
              <div class="skeleton h-6 w-32 rounded-full"></div>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div v-for="index in 2" :key="index" class="surface-card space-y-3 p-6">
            <div class="skeleton h-4 w-40"></div>
            <div class="skeleton h-3 w-full"></div>
            <div class="skeleton h-3 w-4/5"></div>
            <div class="skeleton h-3 w-2/3"></div>
          </div>
        </div>
      </div>

      <div v-else class="space-y-6">
        <section class="hero-card p-6 sm:p-8">
          <div class="hero-glow h-44 w-44"></div>
          <div class="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <div class="flex-shrink-0">
              <div v-if="authStore.user?.profilePicture" class="h-20 w-20 overflow-hidden rounded-2xl ring-2 ring-primary-500/50">
                <img
                  :src="authStore.user.profilePicture"
                  :alt="authStore.user?.name || authStore.userEmail"
                  class="h-full w-full object-cover"
                />
              </div>
              <div v-else class="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-500/15 text-2xl font-bold text-primary-300 ring-2 ring-primary-500/40">
                {{ userInitials }}
              </div>
            </div>

            <div class="min-w-0 flex-1">
              <h2 class="truncate text-2xl font-semibold text-white">
                {{ authStore.user?.name || authStore.userEmail.split('@')[0] }}
              </h2>
              <p class="mt-1 truncate text-sm text-gray-400">{{ authStore.userEmail }}</p>

              <div class="mt-3 flex flex-wrap gap-2">
                <span class="pill bg-white/10 text-gray-200">
                  {{ authStore.userRole === 'ADMIN' ? 'Administrador' : 'Usuário' }}
                </span>
                <span
                  class="pill"
                  :class="authStore.user?.isActive !== false ? 'bg-primary-500/20 text-primary-300' : 'bg-danger-500/20 text-danger-300'"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="authStore.user?.isActive !== false ? 'bg-primary-400' : 'bg-danger-400'"></span>
                  {{ authStore.user?.isActive !== false ? 'Ativo' : 'Inativo' }}
                </span>
              </div>
            </div>

            <BaseButton variant="dark" class="sm:self-start" @click="$router.push('/settings')">
              <Cog6ToothIcon class="mr-2 h-4 w-4" />
              Configurações
            </BaseButton>
          </div>
        </section>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BaseCard>
            <div class="mb-4 flex items-center gap-3">
              <div class="icon-tile"><UserIcon class="h-5 w-5" /></div>
              <h2 class="section-title">Informações Pessoais</h2>
            </div>

            <div class="data-list">
              <div v-if="authStore.user?.name" class="data-field">
                <p class="data-field-label">Nome</p>
                <p class="data-field-value">{{ authStore.user.name }}</p>
              </div>
              <div class="data-field">
                <p class="data-field-label">Email</p>
                <p class="data-field-value break-all">{{ authStore.userEmail }}</p>
              </div>
              <div v-if="authStore.user?.phoneNumber" class="data-field">
                <p class="data-field-label">Telefone</p>
                <p class="data-field-value">{{ authStore.user.phoneNumber }}</p>
              </div>
              <div class="data-field">
                <p class="data-field-label">ID do Usuário</p>
                <p class="data-field-value break-all font-mono text-xs text-ink-muted">{{ authStore.userId }}</p>
              </div>
            </div>
          </BaseCard>

          <BaseCard>
            <div class="mb-4 flex items-center gap-3">
              <div class="icon-tile"><ClockIcon class="h-5 w-5" /></div>
              <h2 class="section-title">Informações da Conta</h2>
            </div>

            <div class="data-list">
              <div class="data-field">
                <p class="data-field-label">Data de Criação</p>
                <p class="data-field-value">{{ formatDate(authStore.user?.createdAt) }}</p>
              </div>
              <div class="data-field">
                <p class="data-field-label">Última Atualização</p>
                <p class="data-field-value">{{ formatDate(authStore.user?.updatedAt) }}</p>
              </div>
              <div v-if="authStore.user?.lastLogin" class="data-field">
                <p class="data-field-label">Último Login</p>
                <p class="data-field-value">{{ formatDate(authStore.user.lastLogin) }}</p>
              </div>
            </div>
          </BaseCard>
        </div>

        <BaseCard>
          <div class="mb-4 flex items-center gap-3">
            <div class="icon-tile"><ChartBarIcon class="h-5 w-5" /></div>
            <h2 class="section-title">Estatísticas</h2>
          </div>

          <div class="grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div class="px-4 py-4 text-center first:pl-0 last:pr-0">
              <p class="text-3xl font-semibold text-primary-700 dark:text-primary-400">{{ passwordsStore.totalCount }}</p>
              <p class="mt-1 text-xs text-ink-muted">Total de Senhas</p>
            </div>
            <div class="px-4 py-4 text-center first:pl-0 last:pr-0">
              <p class="text-3xl font-semibold text-danger-500">{{ passwordsStore.favoriteCount }}</p>
              <p class="mt-1 text-xs text-ink-muted">Favoritas</p>
            </div>
            <div class="px-4 py-4 text-center first:pl-0 last:pr-0">
              <p class="text-3xl font-semibold text-info-500">{{ totpEnabledCount }}</p>
              <p class="mt-1 text-xs text-ink-muted">Com TOTP</p>
            </div>
          </div>
        </BaseCard>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  ChartBarIcon,
  ClockIcon,
  Cog6ToothIcon,
  UserIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { usePasswordsStore } from '@/stores/passwords'
import { AppHeader, BaseButton, BaseCard } from '@/components/ui'

const authStore = useAuthStore()
const passwordsStore = usePasswordsStore()
const isLoading = ref(true)

const totpEnabledCount = computed(() => passwordsStore.totpCount)

const userInitials = computed(() => {
  if (authStore.user?.name) {
    const names = authStore.user.name.split(' ')
    if (names.length >= 2) {
      return (names[0]![0]! + names[names.length - 1]![0]!).toUpperCase()
    }
    return authStore.user.name.substring(0, 2).toUpperCase()
  }
  return authStore.userEmail.charAt(0).toUpperCase()
})

const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  try {
    await authStore.refreshUser()
    passwordsStore.setSearchFilters({ totpEnabled: undefined })
    await passwordsStore.fetchPasswords()
    if (!passwordsStore.statsLoaded) {
      await passwordsStore.loadCompleteStats()
    }
  } finally {
    isLoading.value = false
  }
})
</script>
