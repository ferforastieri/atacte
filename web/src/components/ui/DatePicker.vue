<template>
  <div class="space-y-1 relative">
      <label 
      v-if="label" 
      :for="datePickerId.value"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>
    
    <div class="relative">
      <button
        :id="datePickerId.value"
        type="button"
        :disabled="disabled"
        :class="buttonClasses"
        @click="toggleDropdown"
        @blur="handleBlur"
      >
        <CalendarIcon class="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
        <span :class="displayValueClasses">
          {{ displayValue }}
        </span>
        <ChevronDownIcon class="h-4 w-4 text-gray-400 dark:text-gray-500 ml-auto" />
      </button>
      
      <Transition name="dropdown">
        <div
          v-if="isOpen"
          ref="dropdownRef"
          class="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden"
          @mousedown.prevent
        >
          <div class="p-3 border-b border-gray-200 dark:border-gray-700">
            <div class="grid grid-cols-3 gap-2">
              <select
                v-model="selectedDay"
                class="px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500"
                @change="updateDate"
              >
                <option v-for="day in daysInMonth" :key="day" :value="day">
                  {{ day }}
                </option>
              </select>
              
              <select
                v-model="selectedMonth"
                class="px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500"
                @change="updateDate"
              >
                <option v-for="(month, index) in months" :key="index" :value="index + 1">
                  {{ month }}
                </option>
              </select>
              
              <select
                v-model="selectedYear"
                class="px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500"
                @change="updateDate"
              >
                <option v-for="year in years" :key="year" :value="year">
                  {{ year }}
                </option>
              </select>
            </div>
          </div>
          
          <div class="p-2 flex justify-end gap-2 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              @click="clearDate"
              class="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
            >
              Limpar
            </button>
            <button
              type="button"
              @click="confirmDate"
              class="px-3 py-1.5 text-sm rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors"
            >
              Confirmar
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { CalendarIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'

const dropdownRef = ref<HTMLElement | null>(null)

interface Props {
  modelValue: string
  label?: string
  placeholder?: string
  help?: string
  error?: string
  required?: boolean
  disabled?: boolean
  min?: string
  max?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Selecione uma data',
  required: false,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const datePickerId = ref(`datepicker-${Math.random().toString(36).substr(2, 9)}`)
const isOpen = ref(false)

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const currentDate = computed(() => {
  if (props.modelValue) {
    const date = new Date(props.modelValue)
    if (!isNaN(date.getTime())) {
      return date
    }
  }
  return new Date()
})

const selectedDay = ref(currentDate.value.getDate())
const selectedMonth = ref(currentDate.value.getMonth() + 1)
const selectedYear = ref(currentDate.value.getFullYear())

const years = computed(() => {
  const currentYear = new Date().getFullYear()
  const yearList = []
  for (let i = currentYear - 100; i <= currentYear + 10; i++) {
    yearList.push(i)
  }
  return yearList
})

const daysInMonth = computed(() => {
  const days = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
  return Array.from({ length: days }, (_, i) => i + 1)
})

const displayValue = computed(() => {
  if (!props.modelValue) return props.placeholder
  
  const date = new Date(props.modelValue)
  if (isNaN(date.getTime())) return props.placeholder
  
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
})

const displayValueClasses = computed(() => {
  return props.modelValue
    ? 'text-gray-900 dark:text-gray-100'
    : 'text-gray-500 dark:text-gray-400'
})

const buttonClasses = computed(() => {
  const baseClasses = 'w-full flex items-center px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-800 transition-colors'
  
  const errorClasses = props.error 
    ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
    : ''
  
  return [
    baseClasses,
    errorClasses
  ].join(' ')
})

const updateDate = () => {
  const date = new Date(selectedYear.value, selectedMonth.value - 1, selectedDay.value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dateString = `${year}-${month}-${day}`
  
  if (props.min && dateString < props.min) {
    const minDate = new Date(props.min)
    selectedDay.value = minDate.getDate()
    selectedMonth.value = minDate.getMonth() + 1
    selectedYear.value = minDate.getFullYear()
    return
  }
  
  if (props.max && dateString > props.max) {
    const maxDate = new Date(props.max)
    selectedDay.value = maxDate.getDate()
    selectedMonth.value = maxDate.getMonth() + 1
    selectedYear.value = maxDate.getFullYear()
    return
  }
}

const confirmDate = () => {
  const date = new Date(selectedYear.value, selectedMonth.value - 1, selectedDay.value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dateString = `${year}-${month}-${day}`
  
  emit('update:modelValue', dateString)
  isOpen.value = false
}

const clearDate = () => {
  emit('update:modelValue', '')
  isOpen.value = false
}

const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  
  if (props.modelValue) {
    const date = new Date(props.modelValue)
    if (!isNaN(date.getTime())) {
      selectedDay.value = date.getDate()
      selectedMonth.value = date.getMonth() + 1
      selectedYear.value = date.getFullYear()
    }
  }
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
  const datePickerElement = document.getElementById(datePickerId.value)
  const dropdown = dropdownRef.value
  
  if (datePickerElement && dropdown) {
    const isClickInside = datePickerElement.contains(target) || dropdown.contains(target)
    if (!isClickInside && isOpen.value) {
      isOpen.value = false
    }
  } else if (datePickerElement && !datePickerElement.contains(target) && isOpen.value) {
    isOpen.value = false
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

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    const date = new Date(newValue)
    if (!isNaN(date.getTime())) {
      selectedDay.value = date.getDate()
      selectedMonth.value = date.getMonth() + 1
      selectedYear.value = date.getFullYear()
    }
  }
})

watch(() => selectedMonth.value, () => {
  const maxDay = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
  if (selectedDay.value > maxDay) {
    selectedDay.value = maxDay
  }
})

onMounted(() => {
  if (props.modelValue) {
    const date = new Date(props.modelValue)
    if (!isNaN(date.getTime())) {
      selectedDay.value = date.getDate()
      selectedMonth.value = date.getMonth() + 1
      selectedYear.value = date.getFullYear()
    }
  }
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

