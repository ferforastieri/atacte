<template>
  <BaseModal
    :show="visible"
    title="Confirme sua identidade"
    subtitle="A confirmação vale por 5 minutos."
    :icon="ShieldCheckIcon"
    size="sm"
    :close-on-overlay="!busy"
    :close-on-escape="!busy"
    :closable="!busy"
    @close="close(false)"
  >
    <form class="space-y-4" @submit.prevent="confirm">
      <p class="rounded-xl border border-line bg-surface-muted p-3.5 text-sm leading-relaxed text-ink-muted">
        Digite sua senha para autorizar esta ação. A confirmação vale por 5 minutos.
      </p>

      <BaseInput
        v-model="password"
        type="password"
        label="Senha mestra"
        autocomplete="current-password"
        :error="error"
        :left-icon="LockClosedIcon"
        show-password-toggle
      />
    </form>

    <template #footer>
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <BaseButton variant="ghost" :disabled="busy" @click="close(false)">
          Cancelar
        </BaseButton>
        <BaseButton :loading="busy" :disabled="busy" @click="confirm">
          Confirmar
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { LockClosedIcon, ShieldCheckIcon } from '@heroicons/vue/24/outline'
import { BaseModal, BaseInput, BaseButton } from '@/components/ui'
import api from '@/api'

const visible = ref(false)
const password = ref('')
const error = ref('')
const busy = ref(false)
let complete: ((ok: boolean) => void) | undefined

function open(event: Event) {
  complete = (event as CustomEvent).detail
  password.value = ''
  error.value = ''
  visible.value = true
}

function close(ok: boolean) {
  visible.value = false
  password.value = ''
  complete?.(ok)
  complete = undefined
}

async function confirm() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await api.post('/auth/reauthenticate', { password: password.value })
    close(true)
  } catch {
    error.value = 'Não foi possível confirmar sua senha'
  } finally {
    busy.value = false
  }
}

onMounted(() => window.addEventListener('reauthentication-required', open))
onUnmounted(() => {
  window.removeEventListener('reauthentication-required', open)
  close(false)
})
</script>
