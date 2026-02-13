<template>
  <BaseModal :show="show" @close="$emit('close')" size="lg">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Gerador de Senha</h3>
    </template>

    <div class="space-y-6">
      <div class="space-y-4">
        <h4 class="text-md font-medium text-gray-900 dark:text-gray-100">Opções de Geração</h4>

        <div class="flex items-center justify-between">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Comprimento
          </label>
          <BaseInput
            v-model="length"
            type="number"
            :min="1"
            :max="128"
            class="w-20"
          />
        </div>

        <div class="flex items-center justify-between">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Maiúsculas (A-Z)
          </label>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="includeUppercase"
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div class="flex items-center justify-between">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Minúsculas (a-z)
          </label>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="includeLowercase"
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div class="flex items-center justify-between">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Números (0-9)
          </label>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="includeNumbers"
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div class="flex items-center justify-between">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Símbolos (!@#$...)
          </label>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="includeSymbols"
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>

      <div class="space-y-2">
        <h4 class="text-md font-medium text-gray-900 dark:text-gray-100">Senha Gerada</h4>
        
        <BaseInput
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Senha será gerada aqui..."
        >
          <template #right-icon>
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <EyeIcon v-if="showPassword" class="h-5 w-5" />
              <EyeSlashIcon v-else class="h-5 w-5" />
            </button>
          </template>
        </BaseInput>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <BaseButton
          variant="primary"
          @click="generatePassword"
          :loading="isGenerating"
        >
          Gerar
        </BaseButton>
        <BaseButton
          variant="secondary"
          @click="handleUsePassword"
          :disabled="!password"
        >
          Usar
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'
import { BaseModal, BaseInput, BaseButton } from '@/components/ui'
import { useToast } from '@/hooks/useToast'

interface Props {
  show: boolean
  initialPassword?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'password-generated', password: string): void
}

const props = withDefaults(defineProps<Props>(), {
  initialPassword: ''
})

const emit = defineEmits<Emits>()
const toast = useToast()

const password = ref(props.initialPassword)
const showPassword = ref(false)
const length = ref('16')
const includeUppercase = ref(true)
const includeLowercase = ref(true)
const includeNumbers = ref(true)
const includeSymbols = ref(true)
const isGenerating = ref(false)

watch(() => props.initialPassword, (newPassword) => {
  if (newPassword && props.show) {
    password.value = newPassword
  }
})

watch(() => props.show, (show) => {
  if (show && props.initialPassword) {
    password.value = props.initialPassword
  }
})

const generatePassword = () => {
  isGenerating.value = true
  
  const lengthNum = parseInt(length.value, 10)
  if (isNaN(lengthNum) || lengthNum < 1 || lengthNum > 128) {
    toast.error('Comprimento deve ser entre 1 e 128')
    isGenerating.value = false
    return
  }
  
  let charset = ''
  if (includeLowercase.value) charset += 'abcdefghijklmnopqrstuvwxyz'
  if (includeUppercase.value) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (includeNumbers.value) charset += '0123456789'
  if (includeSymbols.value) charset += '!@#$%^&*'
  
  if (charset.length === 0) {
    toast.error('Selecione pelo menos um tipo de caractere')
    isGenerating.value = false
    return
  }
  
  let newPassword = ''
  for (let i = 0; i < lengthNum; i++) {
    newPassword += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  
  password.value = newPassword
  showPassword.value = true
  isGenerating.value = false
}

const handleUsePassword = () => {
  if (password.value) {
    emit('password-generated', password.value)
    emit('close')
    toast.success('Senha aplicada!')
  }
}
</script>

