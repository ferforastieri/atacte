import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ToastData {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
  duration?: number
}

export const useToastStore = defineStore('toast', () => {
  
  const toasts = ref<ToastData[]>([])

  
  const showToast = (type: ToastData['type'], message: string, title?: string, duration?: number) => {
    const id = Date.now().toString()
    const toast: ToastData = {
      id,
      type,
      title: title || getDefaultTitle(type),
      message,
      duration: duration || getDefaultDuration(type)
    }
    
    toasts.value.push(toast)

    
    setTimeout(() => {
      hideToast(id)
    }, toast.duration)
  }

  const showSuccess = (message: string, title?: string) => {
    showToast('success', message, title)
  }

  const showError = (message: string, title?: string) => {
    showToast('error', message, title)
  }

  const showInfo = (message: string, title?: string) => {
    showToast('info', message, title)
  }

  const showWarning = (message: string, title?: string) => {
    showToast('warning', message, title)
  }

  const hideToast = (id?: string) => {
    if (id) {
      toasts.value = toasts.value.filter(toast => toast.id !== id)
    } else {
      toasts.value = []
    }
  }

  
  const getDefaultTitle = (type: ToastData['type']): string => {
    switch (type) {
      case 'success': return 'Sucesso!'
      case 'error': return 'Erro!'
      case 'info': return 'Informação'
      case 'warning': return 'Atenção!'
      default: return 'Notificação'
    }
  }

  const getDefaultDuration = (type: ToastData['type']): number => {
    switch (type) {
      case 'error': return 5000
      default: return 4000
    }
  }

  return {
    
    toasts,
    
    
    showSuccess,
    showError,
    showInfo,
    showWarning,
    hideToast
  }
})
