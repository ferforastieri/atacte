<template>
  <div class="relative w-full">
    <MagnifyingGlassIcon
      class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
      aria-hidden="true"
    />
    <input
      ref="inputRef"
      v-model="inputValue"
      type="text"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-10 text-base text-ink shadow-sm transition-colors placeholder:text-ink-subtle focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-surface-muted sm:text-sm"
      :aria-label="placeholder"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown.enter="handleEnter"
      @keydown.escape="handleEscape"
    />
    <span
      v-if="isSearching"
      class="absolute right-11 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-line border-t-primary-500"
      aria-hidden="true"
    ></span>
    <button
      v-if="showClearButton && inputValue"
      type="button"
      class="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50"
      aria-label="Limpar busca"
      :disabled="disabled"
      @click="handleClear"
    >
      <XMarkIcon class="h-4 w-4" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/vue/24/outline'

interface Props {
  modelValue?: string
  placeholder?: string
  debounceMs?: number
  disabled?: boolean
  autoFocus?: boolean
  showClearButton?: boolean
  minLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Pesquisar...',
  debounceMs: 500,
  disabled: false,
  autoFocus: false,
  showClearButton: true,
  minLength: 2
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [value: string]
  clear: []
  focus: []
  blur: []
  enter: [value: string]
}>()

const inputRef = ref<HTMLInputElement>()
const inputValue = ref<string>(props.modelValue || '')
const isSearching = ref<boolean>(false)
let debounceTimer: number | null = null
let searchTimeout: number | null = null

const debounce = <T,>(func: (value: T) => void, delay: number) => {
  return (value: T) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = window.setTimeout(() => func(value), delay)
  }
}

const debouncedSearch = debounce((value: string) => {
  if (value.length >= props.minLength) {
    isSearching.value = true
    emit('search', value)
    searchTimeout = window.setTimeout(() => {
      isSearching.value = false
    }, 200)
  } else if (value.length === 0) {
    isSearching.value = false
    emit('search', '')
  }
}, props.debounceMs)

const handleInput = () => {
  emit('update:modelValue', inputValue.value)
  debouncedSearch(inputValue.value)
}

const handleClear = () => {
  inputValue.value = ''
  emit('update:modelValue', '')
  emit('clear')
  emit('search', '')
  isSearching.value = false

  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }

  inputRef.value?.focus()
}

const handleEnter = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  emit('enter', inputValue.value)
  emit('search', inputValue.value)
}

const handleEscape = () => {
  handleClear()
}

const handleFocus = () => {
  emit('focus')
}

const handleBlur = () => {
  emit('blur')
}

watch(() => props.modelValue, (newValue) => {
  if (newValue !== inputValue.value) {
    inputValue.value = newValue || ''
  }
})

onMounted(() => {
  if (props.autoFocus) {
    inputRef.value?.focus()
  }
})

onUnmounted(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})

defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  clear: handleClear,
  getValue: () => inputValue.value
})
</script>
