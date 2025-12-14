<template>
  <div class="space-y-1" :style="{ position: 'relative', zIndex: isOpen ? 9999 : 'auto' }">
    <label 
      v-if="label" 
      :for="selectId"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>
    
    <div class="relative">
      <select
        :id="selectId"
        ref="selectRef"
        :value="modelValue"
        :disabled="disabled"
        :class="selectClasses"
        style="position: absolute; opacity: 0; pointer-events: none; width: 100%; height: 100%;"
        @change="handleChange"
        @focus="handleSelectFocus"
      >
        <slot />
      </select>
      
      <button
        type="button"
        :disabled="disabled"
        :class="buttonClasses"
        @click="toggleDropdown"
        @blur="handleBlur"
      >
        <span :class="displayValueClasses">
          {{ displayText }}
        </span>
        <ChevronDownIcon class="h-4 w-4 text-gray-400 dark:text-gray-500 ml-auto" />
      </button>
      
      <Transition name="dropdown">
        <div
          v-if="isOpen"
          ref="dropdownRef"
          class="absolute mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl overflow-hidden"
          style="position: absolute; top: 100%; left: 0; right: 0; max-height: 200px; overflow-y: auto; z-index: 9999;"
        >
          <div class="py-1">
            <button
              v-for="option in options"
              :key="option.value"
              type="button"
              :class="[
                'w-full text-left px-3 py-2 text-sm transition-colors',
                option.value === modelValue
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium'
                  : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
              @click="selectOption(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </Transition>
    </div>
    
    <p v-if="error" class="text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </p>
    
    <p v-else-if="help" class="text-sm text-gray-500 dark:text-gray-400">
      {{ help }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'

const selectRef = ref<HTMLSelectElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)

interface Option {
  value: string | number
  label: string
}

interface Props {
  modelValue: string | number
  label?: string
  placeholder?: string
  help?: string
  error?: string
  required?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  change: [event: Event]
}>()

const selectId = computed(() => `select-${Math.random().toString(36).substr(2, 9)}`)

const options = ref<Option[]>([])

const extractOptions = () => {
  if (!selectRef.value) return
  
  const opts: Option[] = []
  const selectElement = selectRef.value
  
  Array.from(selectElement.options).forEach((option) => {
    const value = option.value
    const label = option.textContent || option.value
    
    if (option.value === '' && props.placeholder) {
      opts.push({ value: '', label: props.placeholder })
    } else if (option.value !== '' || !props.placeholder) {
      opts.push({ value, label })
    }
  })
  
  options.value = opts
}

onMounted(() => {
  nextTick(() => {
    extractOptions()
  })
})

watch(() => props.modelValue, () => {
  nextTick(() => {
    extractOptions()
  })
})

const displayText = computed(() => {
  if ((props.modelValue === '' || props.modelValue === null || props.modelValue === undefined) && props.placeholder) {
    return props.placeholder
  }
  
  const selectedOption = options.value.find(opt => String(opt.value) === String(props.modelValue))
  return selectedOption ? selectedOption.label : String(props.modelValue || '')
})

const displayValueClasses = computed(() => {
  return props.modelValue || !props.placeholder
    ? 'text-gray-900 dark:text-gray-100'
    : 'text-gray-500 dark:text-gray-400'
})

const selectClasses = computed(() => {
  return 'block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 px-3 py-1.5 appearance-none cursor-pointer pr-10 transition-all hover:border-gray-400 dark:hover:border-gray-500'
})

const buttonClasses = computed(() => {
  const baseClasses = 'w-full flex items-center px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 focus:outline-none disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-800 transition-all hover:border-gray-400 dark:hover:border-gray-500'
  
  const errorClasses = props.error 
    ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
    : ''
  
  return [
    baseClasses,
    errorClasses
  ].join(' ')
})

const selectOption = (value: string | number) => {
  const finalValue = typeof props.modelValue === 'number' ? Number(value) : value
  emit('update:modelValue', finalValue)
  
  if (selectRef.value) {
    selectRef.value.value = String(value)
    const changeEvent = new Event('change', { bubbles: true })
    selectRef.value.dispatchEvent(changeEvent)
  }
  
  emit('change', new Event('change'))
  isOpen.value = false
}

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const value = typeof props.modelValue === 'number' ? Number(target.value) : target.value
  emit('update:modelValue', value)
  emit('change', event)
}

const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    extractOptions()
    emit('focus', new FocusEvent('focus'))
  }
}

const handleSelectFocus = () => {
  toggleDropdown()
}

const handleBlur = (event: FocusEvent) => {
  setTimeout(() => {
    if (!isOpen.value) {
      emit('blur', event)
    }
  }, 200)
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  const selectElement = selectRef.value
  const dropdown = dropdownRef.value
  
  if (selectElement && dropdown) {
    const container = selectElement.parentElement
    if (container) {
      const isClickInside = container.contains(target) || dropdown.contains(target)
      if (!isClickInside && isOpen.value) {
        isOpen.value = false
      }
    }
  }
}

watch(isOpen, (newValue) => {
  if (newValue) {
    document.addEventListener('click', handleClickOutside)
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
