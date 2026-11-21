<template>
  <div class="min-h-screen bg-canvas">
    <AppHeader :show-logo="true" :show-back-button="true" :show-navigation="true" />

    <main class="mx-auto w-full max-w-[1600px] px-4 pb-24 pt-6 sm:px-6 sm:pt-8 md:pb-10 lg:px-10">
      <section class="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-700 dark:text-primary-400">Cofre</p>
          <h1 class="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Códigos TOTP</h1>
          <p class="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-muted">
            Códigos de 6 dígitos renovados a cada 30 segundos.
          </p>
        </div>

        <BaseButton variant="secondary" @click="$router.push('/dashboard')">
          <LockClosedIcon class="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </BaseButton>
      </section>

      <section class="mb-5 sm:mb-6">
        <div class="surface-card inline-flex items-center gap-3 p-4">
          <div class="icon-tile"><KeyIcon class="h-5 w-5" /></div>
          <div>
            <p class="text-xs text-ink-muted">Total TOTP</p>
            <div v-if="isInitialLoading" class="skeleton mt-1 h-6 w-10"></div>
            <p v-else class="text-xl font-semibold text-ink">{{ totpPasswords.length }}</p>
          </div>
        </div>
      </section>

      <div v-if="isInitialLoading" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SkeletonCard v-for="index in 6" :key="index" show-secret />
      </div>

      <div v-else-if="totpPasswords.length > 0" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <BaseCard
          v-for="password in totpPasswords"
          :key="password.id"
          hover
          padding="none"
          class="cursor-pointer"
          @click="viewPassword(password)"
        >
          <div class="flex h-full flex-col p-5 sm:p-6">
            <div class="mb-4 flex items-start gap-4">
              <div class="icon-tile h-11 w-11">
                <KeyIcon class="h-5 w-5" />
              </div>
              <div class="min-w-0 flex-1">
                <h2 class="truncate text-lg font-semibold text-ink">{{ password.name }}</h2>
                <p v-if="password.website" class="truncate text-sm text-ink-muted">{{ password.website }}</p>
                <p v-if="password.username" class="truncate text-sm text-ink-subtle">{{ password.username }}</p>
              </div>
            </div>

            <div @click.stop>
              <TotpCode :secret="totpSecrets.get(password.id)" />
            </div>
          </div>
        </BaseCard>
      </div>

      <EmptyState
        v-else
        :icon="KeyIcon"
        title="Nenhum TOTP encontrado"
        description="Adicione TOTP às suas senhas para ver os códigos aqui."
      >
        <BaseButton @click="$router.push('/dashboard')">
          Voltar ao Dashboard
        </BaseButton>
      </EmptyState>
    </main>

    <PasswordDetailModal
      v-if="selectedPassword"
      :show="!!selectedPassword"
      :password="selectedPassword"
      @close="selectedPassword = null"
      @updated="handlePasswordUpdated"
      @deleted="handlePasswordDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { KeyIcon, LockClosedIcon } from '@heroicons/vue/24/outline'
import { usePasswordsStore } from '@/stores/passwords'
import type { PasswordEntry } from '@/api/passwords'
import {
  AppHeader,
  BaseButton,
  BaseCard,
  EmptyState,
  SkeletonCard,
  TotpCode
} from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import PasswordDetailModal from '@/components/passwords/PasswordDetailModal.vue'

const passwordsStore = usePasswordsStore()
const toast = useToast()

const selectedPassword = ref<PasswordEntry | null>(null)
const isInitialLoading = ref(true)
const totpSecrets = ref<Map<string, string>>(new Map())
const refreshInterval = ref<number | null>(null)
const updateTrigger = ref(0)

const totpPasswords = computed(() => {
  return passwordsStore.passwords.filter(p => p.totpEnabled)
})

const loadTotpCodes = async () => {
  await Promise.all(totpPasswords.value.map(async (password) => {
    try {
      const response = await passwordsStore.getTotpSecret(password.id)
      if (response?.secret) {
        totpSecrets.value.set(password.id, response.secret)
      }
    } catch {
      // The card shows the empty code state.
    }
  }))
}

const refreshTotpCodes = async () => {
  try {
    await passwordsStore.fetchPasswords({ totpEnabled: true })
    await loadTotpCodes()
  } catch {
    toast.error('Não foi possível atualizar os códigos TOTP.')
  }
}

const viewPassword = (password: PasswordEntry) => {
  selectedPassword.value = password
}

const handlePasswordUpdated = () => {
  selectedPassword.value = null
  refreshTotpCodes()
}

const handlePasswordDeleted = () => {
  selectedPassword.value = null
  refreshTotpCodes()
}

const startAutoRefresh = () => {
  refreshInterval.value = window.setInterval(() => {
    updateTrigger.value++
  }, 1000)
}

const stopAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

onMounted(async () => {
  try {
    await passwordsStore.fetchPasswords({ totpEnabled: true })
    await loadTotpCodes()
    startAutoRefresh()
  } catch {
    toast.error('Não foi possível carregar os códigos TOTP.')
  } finally {
    isInitialLoading.value = false
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>
