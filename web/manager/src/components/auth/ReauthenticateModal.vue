<template>
  <BaseModal :show="visible" @close="close(false)" size="md">
    <template #header>Confirme sua identidade</template>
    <form @submit.prevent="confirm" class="space-y-4">
      <p>Digite sua senha para autorizar esta ação. A confirmação vale por 5 minutos.</p>
      <BaseInput v-model="password" type="password" label="Senha mestra" :error="error" />
      <BaseButton type="submit" :loading="busy">Confirmar</BaseButton>
      <BaseButton type="button" variant="ghost" @click="close(false)">Cancelar</BaseButton>
    </form>
  </BaseModal>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { BaseModal, BaseInput, BaseButton } from '@/components/ui'
import api from '@/api'
const visible = ref(false), password = ref(''), error = ref(''), busy = ref(false)
let complete: ((ok: boolean) => void) | undefined
function open(event: Event) { complete = (event as CustomEvent).detail; password.value = ''; error.value = ''; visible.value = true }
function close(ok: boolean) { visible.value = false; password.value = ''; complete?.(ok); complete = undefined }
async function confirm() {
  busy.value = true
  try { await api.post('/auth/reauthenticate', { password: password.value }); close(true) }
  catch { error.value = 'Não foi possível confirmar sua senha' }
  finally { busy.value = false }
}
onMounted(() => window.addEventListener('reauthentication-required', open))
onUnmounted(() => { window.removeEventListener('reauthentication-required', open); close(false) })
</script>
