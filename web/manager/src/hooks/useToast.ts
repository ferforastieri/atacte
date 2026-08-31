import { useToastStore } from '@/stores/toast'

export const useToast = () => {
  const toastStore = useToastStore()

  return {
    success: toastStore.showSuccess,
    error: toastStore.showError,
    info: toastStore.showInfo,
    warning: toastStore.showWarning,
    hide: toastStore.hideToast
  }
}
