<template>
  <Teleport to="body">
    <Transition name="update-toast">
      <aside
        v-if="visible"
        class="update-toast fixed bottom-4 right-4 z-[10000] w-[380px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition-colors duration-200 dark:border-gray-700 dark:bg-gray-800 sm:bottom-6 sm:right-6"
        role="status"
        aria-live="polite"
      >
        <div
          class="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b to-transparent"
          :class="failed ? 'from-red-500/10' : succeeded ? 'from-green-500/10' : 'from-primary-500/10'"
          aria-hidden="true"
        ></div>

        <div class="relative flex gap-3 p-4 pr-10">
          <div class="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40">
            <Logo :size="28" :show-text="false" />
            <span
              class="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-white shadow-sm ring-2 ring-white dark:ring-gray-800"
              :class="badgeClass"
            >
              <component :is="badgeIcon" class="h-3 w-3" :class="{ 'animate-spin-slow': updating }" />
            </span>
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <strong class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ title }}</strong>
              <span
                v-if="latestVersion"
                class="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              >
                v{{ latestVersion }}
              </span>
            </div>

            <div v-if="currentVersion && latestVersion" class="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span class="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                v{{ currentVersion }}
              </span>
              <ArrowRightIcon class="h-3 w-3 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              <span class="rounded-md bg-primary-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                v{{ latestVersion }}
              </span>
            </div>

            <p
              class="mt-1.5 text-xs leading-relaxed"
              :class="failed ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'"
            >
              {{ description }}
            </p>

            <div v-if="updating" class="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <span class="update-progress block h-full w-1/3 rounded-full bg-primary-500 dark:bg-primary-400"></span>
            </div>
          </div>

          <button
            v-if="dismissible"
            type="button"
            class="absolute right-3 top-3 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Dispensar aviso de atualização"
            @click="dismiss"
          >
            <XMarkIcon class="h-4 w-4" />
          </button>
        </div>

        <div class="relative flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/70 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800/80">
          <span class="flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
            <span class="h-1.5 w-1.5 flex-shrink-0 rounded-full" :class="statusDotClass"></span>
            <span class="truncate">{{ statusLabel }}</span>
          </span>

          <div class="flex flex-shrink-0 items-center gap-2">
            <a
              v-if="showReleaseLink"
              :href="releaseUrl || '#'"
              target="_blank"
              rel="noopener noreferrer"
              class="rounded-lg px-2 py-1 text-[11px] font-semibold text-primary-700 transition-colors hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-900/30"
            >
              Ver release
            </a>
            <button
              v-if="failed"
              type="button"
              class="rounded-lg bg-primary-600 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              @click="retry"
            >
              Tentar novamente
            </button>
            <button
              v-if="dismissible"
              type="button"
              class="rounded-lg px-2 py-1 text-[11px] font-semibold text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-gray-300 dark:hover:bg-gray-700"
              @click="dismiss"
            >
              Depois
            </button>
          </div>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowUpTrayIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import systemApi, { type UpdateInfo } from '@/api/system'
import { Logo } from '@/components/ui'

type Phase = 'idle' | 'updating' | 'success' | 'error'

const POLL_INTERVAL = 30 * 60 * 1000
const UPDATE_POLL_INTERVAL = 2 * 1000
const UPDATE_TIMEOUT = 5 * 60 * 1000
const DISMISS_KEY = 'atacte-dismissed-update'

const info = ref<UpdateInfo | null>(null)
const phase = ref<Phase>('idle')
const errorMessage = ref('')
const dismissedVersion = ref<string | null>(sessionStorage.getItem(DISMISS_KEY))
const attemptedVersion = ref<string | null>(null)

let timer: ReturnType<typeof setTimeout> | undefined
let disposed = false
let ticking = false
let finishing = false
let startedAt = 0
let startingVersion = ''

const currentVersion = computed(() => info.value?.currentVersion ?? '')
const latestVersion = computed(() => info.value?.latestVersion ?? '')
const releaseUrl = computed(() => info.value?.releaseUrl ?? '')
const updating = computed(() => phase.value === 'updating')
const succeeded = computed(() => phase.value === 'success')
const failed = computed(() => phase.value === 'error')
const dismissible = computed(() => !updating.value && !succeeded.value)
const manualUpdate = computed(() => !info.value?.supported || !info.value?.autoUpdate)
const showReleaseLink = computed(() => Boolean(releaseUrl.value) && (failed.value || manualUpdate.value))

const visible = computed(() => {
  if (phase.value === 'updating' || phase.value === 'success' || phase.value === 'error') return true
  const current = info.value
  return Boolean(
    current?.updateAvailable
    && current.latestVersion
    && dismissedVersion.value !== current.latestVersion,
  )
})

const title = computed(() => {
  if (succeeded.value) return 'Atacte atualizado'
  if (failed.value) return 'Falha na atualização'
  if (updating.value) return 'Atualizando o servidor'
  return 'Nova versão disponível'
})

const description = computed(() => {
  if (succeeded.value) return 'Tudo certo. Recarregando a interface com a nova versão...'
  if (failed.value) return errorMessage.value || 'Não foi possível concluir a atualização.'
  if (updating.value) return 'Baixando a nova versão e reiniciando os serviços com segurança.'
  if (!info.value?.supported) return 'Este servidor não tem a atualização automática instalada. Verifique a release e atualize manualmente.'
  if (!info.value?.autoUpdate) return 'A atualização automática está desativada neste servidor. Verifique a release e atualize manualmente.'
  return 'Preparando a atualização automática...'
})

const statusLabel = computed(() => {
  if (succeeded.value) return 'Atualização concluída'
  if (failed.value) return 'Atualização interrompida'
  if (updating.value) return 'Atualização automática em andamento'
  if (manualUpdate.value) return 'Ação manual necessária'
  return 'Atualização automática'
})

const statusDotClass = computed(() => {
  if (succeeded.value) return 'bg-green-500'
  if (failed.value) return 'bg-red-500'
  if (updating.value) return 'bg-primary-500 animate-pulse'
  if (manualUpdate.value) return 'bg-amber-500'
  return 'bg-primary-500'
})

const badgeClass = computed(() => {
  if (succeeded.value) return 'bg-green-500'
  if (failed.value) return 'bg-red-500'
  if (updating.value) return 'bg-primary-600'
  if (manualUpdate.value) return 'bg-amber-500'
  return 'bg-primary-600'
})

const badgeIcon = computed(() => {
  if (succeeded.value) return CheckIcon
  if (failed.value) return ExclamationTriangleIcon
  if (updating.value) return ArrowPathIcon
  if (manualUpdate.value) return ArrowUpTrayIcon
  return ArrowUpTrayIcon
})

function schedule(delay: number) {
  if (disposed) return
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => { void tick() }, delay)
}

async function tick() {
  if (disposed || ticking) return
  ticking = true
  try {
    await check()
  } finally {
    ticking = false
  }
  schedule(phase.value === 'updating' ? UPDATE_POLL_INTERVAL : POLL_INTERVAL)
}

function fail(message: string) {
  phase.value = 'error'
  errorMessage.value = message
}

async function finish() {
  if (finishing) return
  finishing = true
  phase.value = 'success'
  await new Promise((resolve) => setTimeout(resolve, 900))
  if (!disposed) window.location.reload()
}

function startUpdate(): void {
  const current = info.value
  if (!current?.latestVersion || !current.supported || !current.autoUpdate || phase.value === 'updating') return

  attemptedVersion.value = current.latestVersion
  startingVersion = current.currentVersion
  startedAt = Date.now()
  errorMessage.value = ''
  phase.value = 'updating'

  void systemApi.applyUpdate()
    .then((result) => {
      if (result.status === 'current') {
        void finish()
      }
    })
    .catch((error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status
      // Another client already requested the same update: attach to it.
      if (status === 409) return

      if (status === 503 && info.value) {
        info.value = { ...info.value, supported: false, autoUpdate: false }
        phase.value = 'idle'
        return
      }

      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      fail(typeof message === 'string' && message ? message : 'Não foi possível iniciar a atualização.')
    })
}

async function check() {
  if (disposed) return
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return

  try {
    const next = await systemApi.updates()
    if (disposed) return

    const state = next.state
    const stateIsRelevant = Boolean(
      state
      && (
        !state.version
        || !next.latestVersion
        || state.version === next.latestVersion
        || state.version === attemptedVersion.value
      ),
    )

    if (stateIsRelevant && state?.status === 'success') {
      if (phase.value === 'updating' || (phase.value === 'error' && startedAt > 0)) {
        info.value = next
        await finish()
        return
      }
      // A success state that still reports an update means the release did not
      // replace the running images (for example pinned tags). Do not start a
      // reload loop; show the release link instead.
      info.value = next.updateAvailable ? { ...next, autoUpdate: false } : next
      return
    }

    if (stateIsRelevant && state?.status === 'error') {
      info.value = next
      if (phase.value === 'updating' || (phase.value === 'idle' && next.updateAvailable)) {
        fail('A atualização não foi concluída. Confira o log no servidor e tente novamente.')
      }
      return
    }

    info.value = next

    if (next.busy) {
      if (phase.value === 'idle' && next.supported && next.updateAvailable) {
        startingVersion = next.currentVersion
        startedAt = Date.now()
        phase.value = 'updating'
      } else if (phase.value === 'updating' && Date.now() - startedAt > UPDATE_TIMEOUT) {
        fail('A atualização não terminou a tempo. Verifique o servidor e tente novamente.')
      }
      return
    }

    if (phase.value === 'updating') {
      if (startingVersion && next.currentVersion && next.currentVersion !== startingVersion) {
        await finish()
        return
      }
      if (Date.now() - startedAt > UPDATE_TIMEOUT) {
        fail('A atualização não terminou a tempo. Verifique o servidor e tente novamente.')
      }
      return
    }

    if (phase.value !== 'idle' || !next.updateAvailable || !next.latestVersion) return
    if (!next.supported || !next.autoUpdate) return
    if (dismissedVersion.value === next.latestVersion) return
    if (attemptedVersion.value === next.latestVersion) return

    startUpdate()
  } catch {
    // The server goes offline while the updater restarts it. Keep polling.
    if (phase.value === 'updating' && Date.now() - startedAt > UPDATE_TIMEOUT) {
      fail('A atualização não terminou a tempo. Verifique o servidor e tente novamente.')
    }
  }
}

function dismiss() {
  if (latestVersion.value) {
    dismissedVersion.value = latestVersion.value
    sessionStorage.setItem(DISMISS_KEY, latestVersion.value)
  }
  info.value = null
  phase.value = 'idle'
  errorMessage.value = ''
}

function retry() {
  phase.value = 'idle'
  errorMessage.value = ''
  startUpdate()
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    if (timer) clearTimeout(timer)
    void tick()
  }
}

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChange)
  void tick()
})

onUnmounted(() => {
  disposed = true
  if (timer) clearTimeout(timer)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<style scoped>
.update-progress {
  animation: update-progress 1.4s ease-in-out infinite;
}

@keyframes update-progress {
  0% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(420%);
  }
}

.animate-spin-slow {
  animation: spin 1.2s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.update-toast-enter-active,
.update-toast-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.update-toast-enter-from,
.update-toast-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

@media (max-width: 640px) {
  .update-toast {
    left: 12px;
    right: 12px;
    bottom: 12px;
    width: auto;
  }
}
</style>
