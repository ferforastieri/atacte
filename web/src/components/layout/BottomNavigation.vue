<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden"
  >
    <div class="flex items-center justify-around h-16 px-2">
      <router-link
        v-for="item in navigationItems"
        :key="item.name"
        :to="item.route"
        class="flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200"
        :class="
          isActive(item.route)
            ? 'text-green-500 dark:text-green-400'
            : 'text-gray-500 dark:text-gray-400'
        "
        @click="handleNavigate(item.route)"
      >
        <component
          :is="isActive(item.route) ? item.iconActive : item.iconInactive"
          class="h-6 w-6 mb-1"
        />
        <span
          class="text-xs font-medium"
          :class="
            isActive(item.route)
              ? 'text-green-500 dark:text-green-400'
              : 'text-gray-500 dark:text-gray-400'
          "
        >
          {{ item.label }}
        </span>
      </router-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import {
  KeyIcon,
  MapPinIcon,
  DocumentTextIcon,
  UserIcon,
} from '@heroicons/vue/24/outline'
import {
  KeyIcon as KeyIconSolid,
  MapPinIcon as MapPinIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  UserIcon as UserIconSolid,
} from '@heroicons/vue/24/solid'

const route = useRoute()
const router = useRouter()

interface NavigationItem {
  name: string
  label: string
  route: string
  iconActive: any
  iconInactive: any
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    label: 'Senhas',
    route: '/dashboard',
    iconActive: KeyIconSolid,
    iconInactive: KeyIcon,
  },
  {
    name: 'Location',
    label: 'Localização',
    route: '/location',
    iconActive: MapPinIconSolid,
    iconInactive: MapPinIcon,
  },
  {
    name: 'SecureNotes',
    label: 'Notas',
    route: '/secure-notes',
    iconActive: DocumentTextIconSolid,
    iconInactive: DocumentTextIcon,
  },
  {
    name: 'Profile',
    label: 'Perfil',
    route: '/profile',
    iconActive: UserIconSolid,
    iconInactive: UserIcon,
  },
]

const isActive = (path: string): boolean => {
  if (path === '/dashboard') {
    return route.path === '/dashboard'
  }
  return route.path.startsWith(path)
}

const handleNavigate = (path: string) => {
  if (route.path !== path) {
    router.push(path)
  }
}
</script>

<style scoped>
.router-link-active {
  @apply text-green-500 dark:text-green-400;
}
</style>

