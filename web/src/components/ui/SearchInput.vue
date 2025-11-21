<template>
  <div class="search-input-container">
    <div class="search-input-wrapper">
      <MagnifyingGlassIcon class="search-icon" />
      <input
        ref="inputRef"
        v-model="inputValue"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        class="search-input"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown.enter="handleEnter"
        @keydown.escape="handleEscape"
      />
      <button
        v-if="showClearButton && inputValue"
        type="button"
        class="clear-button"
        @click="handleClear"
        :disabled="disabled"
      >
        <XMarkIcon class="clear-icon" />
      </button>
    </div>
    
    <!-- Loading indicator -->
    <div v-if="isSearching" class="search-loading">
      <div class="loading-spinner"></div>
    </div>
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

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'search', value: string): void
  (e: 'clear'): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'enter', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Pesquisar...',
  debounceMs: 300,
  disabled: false,
  autoFocus: false,
  showClearButton: true,
  minLength: 1
})

const emit = defineEmits<Emits>()

const inputRef = ref<HTMLInputElement>()
const inputValue = ref<string>(props.modelValue || '')
const isSearching = ref<boolean>(false)
let debounceTimer: number | null = null
let searchTimeout: number | null = null


const debounce = (func: Function, delay: number) => {
  return (...args: any[]) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = window.setTimeout(() => func.apply(this, args), delay)
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

<style scoped>
.search-input-container {
  @apply relative w-full;
}

.search-input-wrapper {
  @apply relative flex items-center;
}

.search-input {
  @apply w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
         placeholder-gray-500 dark:placeholder-gray-400
         focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400
         disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed;
}

.search-icon {
  @apply absolute left-3 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none;
}

.clear-button {
  @apply absolute right-3 p-1 rounded-full 
         hover:bg-gray-100 dark:hover:bg-gray-700
         focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
         disabled:opacity-50 disabled:cursor-not-allowed;
}

.clear-icon {
  @apply h-4 w-4 text-gray-400 dark:text-gray-500;
}

.search-loading {
  @apply absolute right-12 top-1/2 transform -translate-y-1/2;
}

.loading-spinner {
  @apply h-4 w-4 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin;
}
</style>
