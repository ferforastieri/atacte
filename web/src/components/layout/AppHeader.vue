<template>
  <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Left Side -->
        <div class="flex items-center space-x-4">
          <!-- Hamburger Menu Button (Mobile Only) -->
          <button
            v-if="showNavigation"
            @click="mobileMenuOpen = true"
            class="md:hidden flex items-center justify-center w-9 h-9 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Open navigation menu"
          >
            <Bars3Icon class="h-5 w-5 text-gray-900 dark:text-gray-100" />
          </button>

          <!-- Back Button -->
          <router-link
            v-if="showBackButton"
            :to="backRoute"
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeftIcon class="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 dark:text-gray-400" />
          </router-link>

          <!-- Logo -->
          <Logo v-if="showLogo" :size="32" text-size="text-lg sm:text-xl" />

          <!-- Title -->
          <h1 v-if="title" class="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {{ title }}
          </h1>

          <!-- Navigation Buttons (Desktop Only) -->
          <div v-if="showNavigation" class="hidden md:flex items-center space-x-2">
            <router-link
              to="/dashboard"
              class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="isActive('/dashboard') 
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
            >
              Dashboard
            </router-link>
            
            <router-link
              to="/location"
              class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="isActive('/location') 
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
            >
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Localização
            </router-link>
            
            <router-link
              to="/secure-notes"
              class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="isActive('/secure-notes') 
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
            >
              <DocumentTextIcon class="w-4 h-4 inline mr-1" />
              Notas Seguras
            </router-link>
          </div>
        </div>

        <!-- Right Side - Always shows ThemeToggle and UserMenu -->
        <div class="flex items-center space-x-2 sm:space-x-3">
          <!-- Theme Toggle -->
          <ThemeToggle />

          <!-- User Menu - Always visible -->
          <div class="relative">
            <button
              @click="showUserMenuDropdown = !showUserMenuDropdown"
              class="flex items-center space-x-1 sm:space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <div class="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <UserIcon class="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <span class="text-gray-700 dark:text-gray-300 hidden sm:inline">{{ userEmail }}</span>
              <ChevronDownIcon class="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </button>

            <!-- Dropdown Menu -->
            <Transition name="fade">
              <div
                v-if="showUserMenuDropdown"
                class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700"
              >
                <router-link
                  to="/profile"
                  class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  @click="showUserMenuDropdown = false"
                >
                  Perfil
                </router-link>
                <router-link
                  to="/settings"
                  class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  @click="showUserMenuDropdown = false"
                >
                  Configurações
                </router-link>
                <button
                  @click="handleLogout"
                  class="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Sair
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Menu Modal (Valk UI Style) -->
    <Transition name="mobile-menu">
      <div
        v-if="mobileMenuOpen && showNavigation"
        class="fixed inset-0 z-50 md:hidden"
        @click="mobileMenuOpen = false"
      >
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300" />

        <!-- Menu Panel -->
        <div
          class="fixed inset-x-0 top-0 z-50 mx-4 mt-16 max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
          @click.stop
        >
          <!-- Drag Handle -->
          <div class="flex items-center justify-center pt-3 pb-2">
            <div class="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>

          <!-- Header -->
          <div class="flex items-center justify-between px-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3">
              <Logo :size="32" text-size="text-lg" />
            </div>
            <button
              @click="mobileMenuOpen = false"
              class="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close navigation menu"
            >
              <XMarkIcon class="h-5 w-5 text-gray-900 dark:text-gray-100" />
            </button>
          </div>

          <!-- Navigation Items -->
          <nav class="px-4 py-4">
            <div class="space-y-1">
              <router-link
                to="/dashboard"
                @click="mobileMenuOpen = false"
                class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
                :class="isActive('/dashboard')
                  ? 'text-gray-900 dark:text-gray-100 bg-primary-100 dark:bg-primary-900 shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'"
              >
                <KeyIcon class="h-5 w-5 flex-shrink-0" />
                <span class="text-sm font-medium">Dashboard</span>
                <div v-if="isActive('/dashboard')" class="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400" />
              </router-link>

              <router-link
                to="/location"
                @click="mobileMenuOpen = false"
                class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
                :class="isActive('/location')
                  ? 'text-gray-900 dark:text-gray-100 bg-primary-100 dark:bg-primary-900 shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'"
              >
                <MapPinIcon class="h-5 w-5 flex-shrink-0" />
                <span class="text-sm font-medium">Localização</span>
                <div v-if="isActive('/location')" class="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400" />
              </router-link>

              <router-link
                to="/secure-notes"
                @click="mobileMenuOpen = false"
                class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
                :class="isActive('/secure-notes')
                  ? 'text-gray-900 dark:text-gray-100 bg-primary-100 dark:bg-primary-900 shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'"
              >
                <DocumentTextIcon class="h-5 w-5 flex-shrink-0" />
                <span class="text-sm font-medium">Notas Seguras</span>
                <div v-if="isActive('/secure-notes')" class="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400" />
              </router-link>

              <router-link
                to="/profile"
                @click="mobileMenuOpen = false"
                class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
                :class="isActive('/profile')
                  ? 'text-gray-900 dark:text-gray-100 bg-primary-100 dark:bg-primary-900 shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'"
              >
                <UserIcon class="h-5 w-5 flex-shrink-0" />
                <span class="text-sm font-medium">Perfil</span>
                <div v-if="isActive('/profile')" class="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400" />
              </router-link>
            </div>
          </nav>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Logo, ThemeToggle } from '@/components/ui'
import { ArrowLeftIcon, UserIcon, ChevronDownIcon, DocumentTextIcon, Bars3Icon, XMarkIcon, KeyIcon, MapPinIcon } from '@heroicons/vue/24/outline'

interface Props {
  showLogo?: boolean
  showBackButton?: boolean
  backRoute?: string
  title?: string
  showNavigation?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showLogo: true,
  showBackButton: false,
  backRoute: '/dashboard',
  title: '',
  showNavigation: false
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const showUserMenuDropdown = ref(false)
const mobileMenuOpen = ref(false)

const userEmail = computed(() => authStore.userEmail || '')

const isActive = (path: string) => {
  return route.path === path
}

const handleLogout = async () => {
  showUserMenuDropdown.value = false
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.mobile-menu-enter-active {
  transition: all 0.3s ease-out;
}

.mobile-menu-leave-active {
  transition: all 0.2s ease-in;
}

.mobile-menu-enter-from {
  opacity: 0;
}

.mobile-menu-enter-to {
  opacity: 1;
}

.mobile-menu-leave-from {
  opacity: 1;
}

.mobile-menu-leave-to {
  opacity: 0;
}

.mobile-menu-enter-from > div:last-child {
  transform: translateY(-100%);
  opacity: 0;
}

.mobile-menu-enter-to > div:last-child {
  transform: translateY(0);
  opacity: 1;
}

.mobile-menu-leave-from > div:last-child {
  transform: translateY(0);
  opacity: 1;
}

.mobile-menu-leave-to > div:last-child {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
