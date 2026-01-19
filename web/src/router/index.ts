import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'


import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import ForgotPasswordView from '@/views/auth/ForgotPasswordView.vue'
import DashboardView from '@/views/DashboardView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'Login',
      component: LoginView,
      meta: { 
        requiresAuth: false,
        title: 'Login - Sentro'
      }
    },
    {
      path: '/register',
      name: 'Register',
      component: RegisterView,
      meta: { 
        requiresAuth: false,
        title: 'Registro - Sentro'
      }
    },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: ForgotPasswordView,
      meta: { 
        requiresAuth: false,
        title: 'Recuperar Senha - Sentro'
      }
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: DashboardView,
      meta: { 
        requiresAuth: true,
        title: 'Dashboard - Sentro'
      }
    },
    {
      path: '/passwords/:id',
      name: 'PasswordDetail',
      component: () => import('@/views/passwords/PasswordDetailView.vue'),
      meta: { 
        requiresAuth: true,
        title: 'Detalhes da Senha - Sentro'
      }
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('@/views/user/ProfileView.vue'),
      meta: { 
        requiresAuth: true,
        title: 'Perfil - Sentro'
      }
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/views/user/SettingsView.vue'),
      meta: { 
        requiresAuth: true,
        title: 'Configurações - Sentro'
      }
    },
    {
      path: '/audit',
      name: 'AuditLogs',
      component: () => import('@/views/user/AuditLogsView.vue'),
      meta: { 
        requiresAuth: true,
        requiresAdmin: true,
        title: 'Logs de Auditoria - Sentro'
      }
    },
    {
      path: '/sessions',
      name: 'Sessions',
      component: () => import('@/views/user/SessionsView.vue'),
      meta: { 
        requiresAuth: true,
        requiresAdmin: true,
        title: 'Sessões - Sentro'
      }
    },
    {
      path: '/admin/users',
      name: 'AdminUsers',
      component: () => import('@/views/admin/UsersView.vue'),
      meta: { 
        requiresAuth: true,
        requiresAdmin: true,
        title: 'Gerenciar Usuários - Sentro'
      }
    },
    {
      path: '/totp',
      name: 'Totp',
      component: () => import('@/views/totp/TotpView.vue'),
      meta: { 
        requiresAuth: true,
        title: 'Sentro'
      }
    },
    {
      path: '/secure-notes',
      name: 'SecureNotes',
      component: () => import('@/views/secureNotes/SecureNotesView.vue'),
      meta: { 
        requiresAuth: true,
        title: 'Notas Seguras - Sentro'
      }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { 
        requiresAuth: false,
        title: 'Página não encontrada - Sentro'
      }
    }
  ]
})


router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      next('/login')
      return
    }
    
    if (to.meta.requiresAdmin && !authStore.isAdmin) {
      next('/dashboard')
      return
    }
    
    next()
  } else {
    
    if (authStore.isAuthenticated && (to.name === 'Login' || to.name === 'Register')) {
      next('/dashboard')
    } else {
      next()
    }
  }
})


router.onError((error) => {
})

export default router
