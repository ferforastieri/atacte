<template>
  <BaseModal :show="show" @close="$emit('close')" size="lg">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/40">
          <SparklesIcon class="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Gerador de Senha</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">Crie uma senha forte e única em segundos</p>
        </div>
      </div>
    </template>

    <div class="space-y-6">
      <!-- Senha gerada -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-5 shadow-lg ring-1 ring-white/10">
        <div class="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-primary-500/20 blur-3xl"></div>

        <div class="relative">
          <div class="flex items-start gap-3">
            <p class="min-h-[3rem] flex-1 break-all font-mono text-lg leading-relaxed tracking-wide text-white sm:text-xl">
              <template v-if="password">
                {{ showPassword ? password : maskedPassword }}
              </template>
              <span v-else class="text-gray-500">Clique em gerar...</span>
            </p>

            <div class="flex flex-shrink-0 items-center gap-1">
              <button
                type="button"
                class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                :title="copied ? 'Copiado!' : 'Copiar senha'"
                @click="copyPassword"
              >
                <CheckIcon v-if="copied" class="h-5 w-5 text-primary-400" />
                <ClipboardIcon v-else class="h-5 w-5" />
              </button>

              <button
                type="button"
                class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                :title="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                @click="showPassword = !showPassword"
              >
                <EyeSlashIcon v-if="showPassword" class="h-5 w-5" />
                <EyeIcon v-else class="h-5 w-5" />
              </button>
            </div>
          </div>

          <!-- Força da senha -->
          <div class="mt-4">
            <div class="mb-1.5 flex items-center justify-between gap-3 text-xs">
              <span class="font-medium" :class="strengthTextClass">{{ strengthLabel }}</span>
              <span v-if="crackTimeLabel" class="truncate text-gray-400">{{ crackTimeLabel }}</span>
            </div>
            <div class="flex gap-1">
              <span
                v-for="index in 5"
                :key="index"
                class="h-1.5 flex-1 rounded-full transition-colors duration-300"
                :class="index <= strengthBars ? strengthBarClass : 'bg-white/10'"
              ></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Comprimento -->
      <div>
        <div class="mb-2 flex items-center justify-between">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Comprimento</label>
          <span class="inline-flex min-w-[2.75rem] items-center justify-center rounded-lg bg-primary-50 px-2 py-0.5 text-sm font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
            {{ settings.length }}
          </span>
        </div>

        <input
          v-model.number="settings.length"
          type="range"
          min="8"
          max="64"
          step="1"
          class="password-length-slider w-full"
          :style="{ '--slider-progress': `${sliderProgress}%` }"
        />

        <div class="mt-1 flex justify-between text-[11px] font-medium text-gray-400 dark:text-gray-500">
          <span>8</span>
          <span>64</span>
        </div>
      </div>

      <!-- Opções de caracteres -->
      <div>
        <p class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Incluir caracteres</p>

        <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <label
            v-for="option in characterOptions"
            :key="option.key"
            class="flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition-colors"
            :class="settings[option.key]
              ? 'border-primary-500 bg-primary-50/60 dark:border-primary-500 dark:bg-primary-900/20'
              : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'"
          >
            <span class="flex min-w-0 items-center gap-3">
              <span
                class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold"
                :class="settings[option.key]
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'"
              >
                {{ option.sample }}
              </span>
              <span class="min-w-0">
                <span class="block truncate text-sm font-medium text-gray-900 dark:text-gray-100">{{ option.label }}</span>
                <span class="block truncate text-xs text-gray-500 dark:text-gray-400">{{ option.description }}</span>
              </span>
            </span>

            <span
              class="relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors"
              :class="settings[option.key] ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
            >
              <span
                class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                :class="settings[option.key] ? 'translate-x-[1.15rem]' : 'translate-x-[0.18rem]'"
              ></span>
            </span>

            <input v-model="settings[option.key]" type="checkbox" class="sr-only" />
          </label>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <BaseButton variant="ghost" @click="$emit('close')">
          Cancelar
        </BaseButton>
        <BaseButton variant="secondary" @click="generatePassword">
          <ArrowPathIcon class="mr-2 h-4 w-4" />
          Gerar outra
        </BaseButton>
        <BaseButton variant="primary" @click="handleUsePassword" :disabled="!password">
          <CheckIcon class="mr-2 h-4 w-4" />
          Usar senha
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import {
  ArrowPathIcon,
  CheckIcon,
  ClipboardIcon,
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon
} from '@heroicons/vue/24/outline'
import zxcvbn from 'zxcvbn'
import { BaseModal, BaseButton } from '@/components/ui'
import { copyToClipboard } from '@/utils/clipboard'

type CharacterOptionKey = 'uppercase' | 'lowercase' | 'numbers' | 'symbols'

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

const MIN_LENGTH = 8
const MAX_LENGTH = 64

const password = ref(props.initialPassword)
const showPassword = ref(false)
const copied = ref(false)
let copiedTimeout: ReturnType<typeof setTimeout> | null = null

const settings = reactive({
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true
})

const characterOptions: Array<{
  key: CharacterOptionKey
  label: string
  description: string
  sample: string
  chars: string
}> = [
  { key: 'uppercase', label: 'Maiúsculas', description: 'A-Z', sample: 'A', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
  { key: 'lowercase', label: 'Minúsculas', description: 'a-z', sample: 'a', chars: 'abcdefghijklmnopqrstuvwxyz' },
  { key: 'numbers', label: 'Números', description: '0-9', sample: '7', chars: '0123456789' },
  { key: 'symbols', label: 'Símbolos', description: '!@#$%^&*', sample: '#', chars: '!@#$%^&*' }
]

const maskedPassword = computed(() => '•'.repeat(Math.min(password.value.length, 32)))
const sliderProgress = computed(() => {
  const range = MAX_LENGTH - MIN_LENGTH
  return ((settings.length - MIN_LENGTH) / range) * 100
})

const strength = computed(() => {
  if (!password.value) return null
  return zxcvbn(password.value)
})

const strengthScore = computed(() => strength.value?.score ?? 0)
const strengthBars = computed(() => (password.value ? strengthScore.value + 1 : 0))

const strengthLabel = computed(() => {
  if (!password.value) return 'Aguardando geração'
  return ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Excelente'][strengthScore.value] ?? 'Desconhecida'
})

const strengthTextClass = computed(() => {
  if (!password.value) return 'text-gray-400'
  return ['text-red-400', 'text-orange-400', 'text-yellow-400', 'text-blue-400', 'text-green-400'][strengthScore.value]
})

const strengthBarClass = computed(() => {
  return ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'][strengthScore.value]
})

const crackTimeLabel = computed(() => {
  if (!strength.value) return ''

  const seconds = Number(strength.value.crack_times_seconds.offline_slow_hashing_1e4_per_second)

  if (seconds < 1) return 'Quebraria quase instantaneamente'
  if (seconds < 60) return `Quebraria em ${Math.round(seconds)} segundos`
  if (seconds < 3600) return `Quebraria em ${Math.round(seconds / 60)} minutos`
  if (seconds < 86400) return `Quebraria em ${Math.round(seconds / 3600)} horas`
  if (seconds < 31536000) return `Quebraria em ${Math.round(seconds / 86400)} dias`
  if (seconds < 31536000 * 100) return `Quebraria em ${Math.round(seconds / 31536000)} anos`

  return 'Praticamente impossível de quebrar'
})

const randomInt = (max: number) => {
  const randomBytes = new Uint32Array(1)
  crypto.getRandomValues(randomBytes)
  return (randomBytes[0] ?? 0) % max
}

const randomChar = (chars: string) => chars.charAt(randomInt(chars.length))

const shuffle = (chars: string[]) => {
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    const current = chars[i] as string
    chars[i] = chars[j] as string
    chars[j] = current
  }
  return chars
}

const generatePassword = () => {
  const length = Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, Math.round(settings.length)))
  const selectedOptions = characterOptions.filter(option => settings[option.key])

  if (selectedOptions.length === 0) {
    password.value = ''
    return
  }

  // Garante pelo menos um caractere de cada tipo selecionado.
  const requiredChars = selectedOptions.map(option => randomChar(option.chars))
  const charset = selectedOptions.map(option => option.chars).join('')

  const remainingChars: string[] = []
  for (let i = requiredChars.length; i < length; i++) {
    remainingChars.push(randomChar(charset))
  }

  password.value = shuffle([...requiredChars, ...remainingChars]).join('')
  showPassword.value = true
  copied.value = false
}

const copyPassword = async () => {
  if (!password.value) return

  const result = await copyToClipboard(password.value)
  if (!result.success) return

  copied.value = true
  if (copiedTimeout) {
    clearTimeout(copiedTimeout)
  }
  copiedTimeout = setTimeout(() => {
    copied.value = false
  }, 2000)
}

const handleUsePassword = () => {
  if (password.value) {
    emit('password-generated', password.value)
    emit('close')
  }
}

watch(() => props.show, (show) => {
  if (!show) return

  copied.value = false

  if (props.initialPassword) {
    password.value = props.initialPassword
    showPassword.value = false
  } else {
    generatePassword()
  }
}, { immediate: true })

watch(() => props.initialPassword, (newPassword) => {
  if (newPassword && props.show) {
    password.value = newPassword
  }
})

watch(
  () => [settings.length, settings.uppercase, settings.lowercase, settings.numbers, settings.symbols],
  () => {
    if (props.show) {
      generatePassword()
    }
  }
)

onBeforeUnmount(() => {
  if (copiedTimeout) {
    clearTimeout(copiedTimeout)
  }
})
</script>

<style scoped>
.password-length-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 0.5rem;
  border-radius: 9999px;
  background: linear-gradient(
    to right,
    #16a34a 0%,
    #16a34a var(--slider-progress, 0%),
    #e5e7eb var(--slider-progress, 0%),
    #e5e7eb 100%
  );
  outline: none;
}

:global(.dark) .password-length-slider {
  background: linear-gradient(
    to right,
    #16a34a 0%,
    #16a34a var(--slider-progress, 0%),
    #374151 var(--slider-progress, 0%),
    #374151 100%
  );
}

.password-length-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 9999px;
  background: #ffffff;
  border: 2px solid #16a34a;
  box-shadow: 0 1px 4px rgb(0 0 0 / 0.2);
  cursor: pointer;
}

.password-length-slider::-moz-range-thumb {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 9999px;
  background: #ffffff;
  border: 2px solid #16a34a;
  box-shadow: 0 1px 4px rgb(0 0 0 / 0.2);
  cursor: pointer;
}

.password-length-slider::-moz-range-track {
  background: transparent;
}

.password-length-slider:focus-visible {
  outline: 2px solid #22c55e;
  outline-offset: 2px;
}
</style>
