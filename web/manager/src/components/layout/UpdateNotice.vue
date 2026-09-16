<template>
  <aside v-if="available" class="update-toast" role="status" aria-live="polite">
    <div class="update-toast__copy"><strong>Nova versão disponível: {{ latestVersion }}</strong><span>A atualização deve ser feita pelo responsável no servidor.</span></div>
    <div class="update-toast__actions"><a :href="releaseUrl" target="_blank" rel="noopener noreferrer">Ver release</a><button type="button" @click="dismiss">Agora não</button></div>
  </aside>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import systemApi from '@/api/system'
const available = ref(false), latestVersion = ref(''), releaseUrl = ref('')
let timer: ReturnType<typeof setInterval> | undefined
function dismiss() { available.value = false; sessionStorage.setItem('atacte-dismissed-update', latestVersion.value) }
async function check() {
  try {
    const info = await systemApi.updates()
    latestVersion.value = info.latestVersion || ''; releaseUrl.value = info.releaseUrl || ''
    available.value = info.updateAvailable && sessionStorage.getItem('atacte-dismissed-update') !== latestVersion.value
  } catch { /* An unavailable release service must not interrupt vault access. */ }
}
onMounted(() => { void check(); timer = setInterval(check, 30 * 60000) })
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.update-toast {
  position: fixed;
  z-index: 10000;
  right: max(18px, env(safe-area-inset-right));
  bottom: max(18px, env(safe-area-inset-bottom));
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  width: min(560px, calc(100vw - 36px));
  border: 1px solid theme('colors.primary.600');
  border-radius: 0.5rem;
  background: theme('colors.white');
  padding: 18px;
  color: theme('colors.gray.900');
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.45);
  font-family: 'Inter', system-ui, sans-serif;
  animation: update-toast-enter 180ms ease-out both;
}

.update-toast__copy {
  display: grid;
  min-width: 0;
  gap: 6px;
}

.update-toast__copy strong {
  font-size: 0.9rem;
  font-weight: 700;
}

.update-toast__copy span {
  overflow-wrap: anywhere;
  color: theme('colors.gray.600');
  font-size: 0.75rem;
  line-height: 1.5;
}

.update-toast__actions {
  display: flex;
  gap: 8px;
}

.update-toast button {
  min-height: 40px;
  cursor: pointer;
  border: 1px solid theme('colors.gray.600');
  border-radius: 0.375rem;
  background: transparent;
  padding: 0 13px;
  color: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  transition: background-color 150ms ease, border-color 150ms ease, opacity 150ms ease;
}

.update-toast button:focus-visible {
  outline: 2px solid theme('colors.primary.500');
  outline-offset: 2px;
}

.update-toast button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.update-toast__confirm {
  border-color: theme('colors.primary.500') !important;
  background: theme('colors.primary.600') !important;
  color: white !important;
}

.update-toast__confirm:hover:not(:disabled) {
  background: theme('colors.primary.700') !important;
}

.update-toast__dismiss:hover {
  border-color: theme('colors.gray.400');
  background: theme('colors.gray.100');
}

:global(.dark) .update-toast {
  border-color: theme('colors.primary.500');
  background: theme('colors.gray.800');
  color: theme('colors.gray.100');
}

:global(.dark) .update-toast__copy span {
  color: theme('colors.gray.400');
}

:global(.dark) .update-toast__dismiss:hover {
  border-color: theme('colors.gray.500');
  background: theme('colors.gray.700');
}

@keyframes update-toast-enter {
  from {
    opacity: 0;
    transform: translateX(14px);
  }
}

@media (max-width: 620px) {
  .update-toast {
    left: 12px;
    right: 12px;
    bottom: 12px;
    grid-template-columns: 1fr;
    width: auto;
    gap: 14px;
    padding: 16px;
  }

  .update-toast__actions,
  .update-toast button {
    flex: 1;
  }
}
</style>
