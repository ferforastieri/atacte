<template>
  <header
    :class="[
      'sticky z-40 border-b border-line bg-surface/90 backdrop-blur transition-colors duration-200',
      isElectron ? 'top-8' : 'top-0'
    ]"
  >
    <div class="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10">
      <div class="flex h-16 items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-2">
          <button
            v-if="showNavigation"
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 md:hidden"
            aria-label="Abrir menu de navegação"
            :aria-expanded="mobileMenuOpen"
            @click="mobileMenuOpen = true"
          >
            <Bars3Icon class="h-5 w-5" />
          </button>

          <router-link
            v-if="showBackButton"
            :to="backRoute"
            class="flex h-9 w-9 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Voltar"
          >
            <ArrowLeftIcon class="h-5 w-5" />
          </router-link>

          <router-link v-if="showLogo" to="/dashboard" class="flex flex-shrink-0 items-center">
            <Logo :size="32" :show-text="false" />
          </router-link>

          <h1 v-if="title" class="truncate text-base font-semibold text-ink sm:text-lg">
            {{ title }}
          </h1>
        </div>

        <nav v-if="showNavigation" class="hidden flex-1 items-center justify-center gap-1 md:flex" aria-label="Navegação principal">
          <router-link
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="nav-pill"
            :class="isActive(item.to) ? 'nav-pill-active' : 'nav-pill-idle'"
            :aria-current="isActive(item.to) ? 'page' : undefined"
          >
            <component :is="item.icon" class="h-4 w-4" aria-hidden="true" />
            <span>{{ item.label }}</span>
          </router-link>
        </nav>

        <div class="flex flex-shrink-0 items-center gap-2">
          <ThemeToggle />

          <a
            :href="env.androidApkUrl"
            target="_blank"
            rel="noreferrer"
            class="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:px-3"
            aria-label="Baixar APK Android"
            title="Baixar APK Android"
          >
            <ArrowDownTrayIcon class="h-4 w-4" />
            <span class="hidden lg:inline">APK</span>
          </a>

          <div ref="userMenuRef" class="relative min-w-0">
            <button
              type="button"
              class="flex items-center gap-1 rounded-xl p-1 text-sm transition-colors hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              :aria-expanded="showUserMenu"
              aria-haspopup="menu"
              aria-label="Abrir menu da conta"
              @click="showUserMenu = !showUserMenu"
            >
              <div v-if="authStore.user?.profilePicture" class="h-8 w-8 overflow-hidden rounded-xl ring-2 ring-primary-500/30">
                <img :src="authStore.user.profilePicture" :alt="userEmail" class="h-full w-full object-cover" />
              </div>
              <div v-else class="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/40">
                <span class="text-xs font-bold text-primary-700 dark:text-primary-300">
                  {{ userInitials }}
                </span>
              </div>
              <ChevronDownIcon class="hidden h-4 w-4 text-ink-subtle sm:block" />
            </button>

            <Transition name="fade">
              <div
                v-if="showUserMenu"
                class="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-surface py-1.5 shadow-pop"
                role="menu"
              >
                <div class="border-b border-line px-4 py-2.5">
                  <p class="truncate text-xs font-medium text-ink">{{ authStore.user?.name || 'Minha conta' }}</p>
                  <p class="truncate text-[11px] text-ink-muted">{{ userEmail }}</p>
                </div>
                <router-link
                  to="/profile"
                  class="flex items-center gap-2 px-4 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
                  role="menuitem"
                  @click="showUserMenu = false"
                >
                  <UserIcon class="h-4 w-4" /> Perfil
                </router-link>
                <router-link
                  to="/settings"
                  class="flex items-center gap-2 px-4 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
                  role="menuitem"
                  @click="showUserMenu = false"
                >
                  <Cog6ToothIcon class="h-4 w-4" /> Configurações
                </router-link>
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-danger-600 transition-colors hover:bg-danger-50 disabled:opacity-60 dark:text-danger-400 dark:hover:bg-danger-900/20"
                  role="menuitem"
                  :disabled="isLoggingOut"
                  @click="handleLogout"
                >
                  <span
                    v-if="isLoggingOut"
                    class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden="true"
                  ></span>
                  <ArrowRightOnRectangleIcon v-else class="h-4 w-4" />
                  {{ isLoggingOut ? 'Saindo...' : 'Sair' }}
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>

    <Transition name="mobile-menu">
      <div
        v-if="mobileMenuOpen && showNavigation"
        class="fixed inset-0 z-50 md:hidden"
        @click="mobileMenuOpen = false"
      >
        <div class="fixed inset-0 bg-gray-950/70 backdrop-blur-sm" aria-hidden="true"></div>

        <div
          class="fixed inset-y-0 left-0 flex w-[86vw] max-w-xs flex-col border-r border-line bg-surface shadow-pop"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
          @click.stop
        >
          <div class="flex items-center justify-between border-b border-line px-4 py-4">
            <router-link to="/dashboard" class="flex items-center gap-2" @click="mobileMenuOpen = false">
              <Logo :size="30" :show-text="false" />
              <span class="text-sm font-semibold text-ink">Atacte</span>
            </router-link>
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
              aria-label="Fechar menu de navegação"
              @click="mobileMenuOpen = false"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>

          <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Navegação principal">
            <router-link
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
              :class="isActive(item.to) ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300' : 'text-ink-muted hover:bg-surface-muted hover:text-ink'"
              @click="mobileMenuOpen = false"
            >
              <component :is="item.icon" class="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span>{{ item.label }}</span>
            </router-link>

            <div class="my-2 border-t border-line"></div>

            <router-link
              to="/profile"
              class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
              @click="mobileMenuOpen = false"
            >
              <UserIcon class="h-5 w-5 flex-shrink-0" />
              <span>Perfil</span>
            </router-link>
            <router-link
              to="/settings"
              class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
              @click="mobileMenuOpen = false"
            >
              <Cog6ToothIcon class="h-5 w-5 flex-shrink-0" />
              <span>Configurações</span>
            </router-link>
          </nav>

          <div class="border-t border-line p-3">
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-danger-600 transition-colors hover:bg-danger-50 disabled:opacity-60 dark:text-danger-400 dark:hover:bg-danger-900/20"
              :disabled="isLoggingOut"
              @click="handleLogout"
            >
              <span
                v-if="isLoggingOut"
                class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden="true"
              ></span>
              <ArrowRightOnRectangleIcon v-else class="h-4 w-4" />
              {{ isLoggingOut ? 'Saindo...' : 'Sair' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ComputerDesktopIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { env } from '@/config/environment'
import Logo from '../ui/Logo.vue'
import ThemeToggle from '../ui/ThemeToggle.vue'

withDefaults(defineProps<{
  showLogo?: boolean
  showBackButton?: boolean
  backRoute?: string
  title?: string
  showNavigation?: boolean
}>(), {
  showLogo: true,
  showBackButton: false,
  backRoute: '/dashboard',
  title: '',
  showNavigation: false
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const showUserMenu = ref(false)
const mobileMenuOpen = ref(false)
const isLoggingOut = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

const isElectron = computed(() => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  const ua = navigator.userAgent.toLowerCase()
  if (!ua.includes('electron/')) return false
  const electronAPI = (window as Window & { electronAPI?: {
    minimizeWindow?: () => void;
    maximizeWindow?: () => void;
    closeWindow?: () => void;
  } }).electronAPI
  if (!electronAPI) return false
  return typeof electronAPI.minimizeWindow === 'function' &&
         typeof electronAPI.maximizeWindow === 'function' &&
         typeof electronAPI.closeWindow === 'function'
})

const navItems = computed(() => {
  const items = [
    { to: '/dashboard', label: 'Senhas', icon: LockClosedIcon, adminOnly: false },
    { to: '/secure-notes', label: 'Notas', icon: ClipboardDocumentListIcon, adminOnly: false },
    { to: '/audit', label: 'Auditoria', icon: ShieldCheckIcon, adminOnly: true },
    { to: '/sessions', label: 'Sessões', icon: ComputerDesktopIcon, adminOnly: true },
    { to: '/admin/users', label: 'Usuários', icon: UserGroupIcon, adminOnly: true }
  ]
  return items.filter(item => !item.adminOnly || authStore.isAdmin)
})

const userEmail = computed(() => authStore.userEmail || '')
const userInitials = computed(() => {
  const name = authStore.user?.name || authStore.userEmail || ''
  if (name.includes('@')) {
    return name.charAt(0).toUpperCase()
  }
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
  }
  return name.charAt(0).toUpperCase()
})

const isActive = (path: string) => route.path === path

const handleLogout = async () => {
  if (isLoggingOut.value) return
  isLoggingOut.value = true
  showUserMenu.value = false
  mobileMenuOpen.value = false
  try {
    await authStore.logout()
    router.push('/login')
  } finally {
    isLoggingOut.value = false
  }
}

const handleClickOutside = (event: MouseEvent) => {
  if (!showUserMenu.value) return
  const target = event.target as Node
  if (userMenuRef.value && !userMenuRef.value.contains(target)) {
    showUserMenu.value = false
  }
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    showUserMenu.value = false
    mobileMenuOpen.value = false
  }
}

watch(mobileMenuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: opacity 0.22s ease;
}

.mobile-menu-enter-active > div:last-child,
.mobile-menu-leave-active > div:last-child {
  transition: transform 0.22s ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
}

.mobile-menu-enter-from > div:last-child,
.mobile-menu-leave-to > div:last-child {
  transform: translateX(-100%);
}
</style>
