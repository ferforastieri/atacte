/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_MANAGER_URL?: string
  readonly VITE_GITHUB_REPOSITORY?: string
  readonly VITE_ANDROID_APK_URL?: string
  readonly VITE_BUILD_VERSION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  electronAPI?: {
    getBackendUrl?: () => string | null
    getCsrfToken?: () => Promise<string | null>
  }
  ATACTE_BACKEND_URL?: string
}
