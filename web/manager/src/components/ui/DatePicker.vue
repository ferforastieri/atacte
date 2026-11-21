<template>
  <div class="space-y-1" :style="{ position: 'relative', zIndex: isOpen ? 10002 : 1 }">
    <label 
      v-if="label" 
      :for="datePickerId"
      class="field-label"
    >
      {{ label }}
      <span v-if="required" class="ml-0.5 text-danger-500">*</span>
    </label>
    
    <div style="position: relative;">
      <button
        :id="datePickerId"
        type="button"
        :disabled="disabled"
        :class="buttonClasses"
        @click="toggleDropdown"
        @blur="handleBlur"
      >
        <CalendarIcon class="mr-2 h-4 w-4 text-ink-subtle" />
        <span :class="displayValueClasses">
          {{ displayValue }}
        </span>
        <ChevronDownIcon class="ml-auto h-4 w-4 text-ink-subtle" />
      </button>
      
      <Transition name="dropdown">
        <div
          v-if="isOpen"
          ref="dropdownRef"
          class="absolute mt-1 w-full overflow-hidden rounded-xl border border-line bg-surface shadow-pop"
          style="z-index: 10001; position: absolute; top: 100%; left: 0; right: 0;"
        >
          <div class="px-4 pt-4 pb-3">
            <div class="flex items-center gap-3 mb-3">
              <button
                type="button"
                @click="previousMonth"
                class="flex-shrink-0 rounded-lg border border-line p-1.5 text-ink-muted transition-colors hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <ChevronLeftIcon class="h-4 w-4" />
              </button>
              
              <div class="flex items-center gap-2 flex-1 justify-center min-w-0">
                <div class="relative flex-1 basis-0 min-w-0" @mousedown.stop>
                  <select
                    data-datepicker-month
                    v-model="selectedMonth"
                    class="w-full cursor-pointer rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink transition-all hover:border-line-strong focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
                    :style="{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', backgroundImage: 'none', paddingRight: '0.75rem' }"
                    @change="updateCalendar"
                    @mousedown.stop
                    @click.stop
                  >
                    <option v-for="(month, index) in months" :key="index" :value="index + 1">
                      {{ month }}
                    </option>
                  </select>
                </div>
                
                <div class="relative flex-1 basis-0 min-w-0" @mousedown.stop>
                  <select
                    data-datepicker-year
                    v-model="selectedYear"
                    class="w-full cursor-pointer rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink transition-all hover:border-line-strong focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
                    :style="{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', backgroundImage: 'none', paddingRight: '0.75rem' }"
                    @change="updateCalendar"
                    @mousedown.stop
                    @click.stop
                  >
                    <option v-for="year in years" :key="year" :value="year">
                      {{ year }}
                    </option>
                  </select>
                </div>
              </div>
              
              <button
                type="button"
                @click="nextMonth"
                class="flex-shrink-0 rounded-lg border border-line p-1.5 text-ink-muted transition-colors hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <ChevronRightIcon class="h-4 w-4" />
              </button>
            </div>
            
            <div class="grid grid-cols-7 gap-0.5 mb-1.5">
              <div
                v-for="day in weekDays"
                :key="day"
                class="py-2 text-center text-xs font-semibold text-ink-muted"
              >
                {{ day }}
              </div>
            </div>
            
            <div class="grid grid-cols-7 gap-0.5">
              <button
                v-for="(day, index) in calendarDays"
                :key="index"
                type="button"
                :disabled="!day.isCurrentMonth || day.isDisabled"
                :class="[
                  'text-center py-2 rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500',
                  day.isCurrentMonth 
                    ? day.isToday
                      ? 'bg-primary-100 font-semibold text-primary-700 ring-2 ring-primary-500 dark:bg-primary-900/40 dark:text-primary-300'
                      : day.isSelected
                        ? 'bg-primary-700 text-white hover:bg-primary-800'
                        : 'text-ink hover:bg-surface-muted'
                    : 'cursor-not-allowed text-ink-subtle',
                  day.isDisabled ? 'opacity-50 cursor-not-allowed' : '',
                  !day.isCurrentMonth || day.isDisabled ? '' : 'cursor-pointer'
                ]"
                @click="selectDate(day)"
              >
                {{ day.day }}
              </button>
            </div>
          </div>
          
          <div class="flex justify-end border-t border-line bg-surface-muted/60 px-4 py-2.5">
            <button
              type="button"
              @click="clearDate"
              class="rounded-lg border border-line px-3 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Limpar
            </button>
          </div>
        </div>
      </Transition>
    </div>
    
    <p v-if="error" class="field-error">
      {{ error }}
    </p>
    
    <p v-else-if="help" class="field-hint">
      {{ help }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { parse, format } from 'date-fns'
import { CalendarIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

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

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const currentDate = computed(() => {
  if (props.modelValue) {
    const date = parse(props.modelValue, 'yyyy-MM-dd', new Date())
    if (!isNaN(date.getTime())) {
      return date
    }
  }
  return new Date()
})

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

const today = computed(() => {
  const now = new Date()
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate()
  }
})

const selectedDate = computed(() => {
  if (props.modelValue) {
    const date = parse(props.modelValue, 'yyyy-MM-dd', new Date())
    if (!isNaN(date.getTime())) {
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
      }
    }
  }
  return null
})

const calendarDays = computed(() => {
  const firstDayOfMonth = new Date(selectedYear.value, selectedMonth.value - 1, 1)
  const lastDayOfMonth = new Date(selectedYear.value, selectedMonth.value, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()
  
  const days: Array<{
    day: number
    isCurrentMonth: boolean
    isToday: boolean
    isSelected: boolean
    isDisabled: boolean
    date: Date
  }> = []
  
  const previousMonthLastDay = new Date(selectedYear.value, selectedMonth.value - 1, 0).getDate()
  
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const day = previousMonthLastDay - i
    const date = new Date(selectedYear.value, selectedMonth.value - 2, day)
    days.push({
      day,
      isCurrentMonth: false,
      isToday: false,
      isSelected: false,
      isDisabled: isDateDisabled(date),
      date
    })
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(selectedYear.value, selectedMonth.value - 1, day)
    const isToday = day === today.value.day && 
                    selectedMonth.value === today.value.month && 
                    selectedYear.value === today.value.year
    const isSelected = !!(selectedDate.value && 
                      day === selectedDate.value.day && 
                      selectedMonth.value === selectedDate.value.month && 
                      selectedYear.value === selectedDate.value.year)
    
    days.push({
      day,
      isCurrentMonth: true,
      isToday,
      isSelected,
      isDisabled: isDateDisabled(date),
      date
    })
  }
  
  const remainingDays = 42 - days.length
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(selectedYear.value, selectedMonth.value, day)
    days.push({
      day,
      isCurrentMonth: false,
      isToday: false,
      isSelected: false,
      isDisabled: isDateDisabled(date),
      date
    })
  }
  
  return days
})

const isDateDisabled = (date: Date): boolean => {
  if (props.min) {
    const minDate = new Date(props.min)
    minDate.setHours(0, 0, 0, 0)
    if (date < minDate) return true
  }
  
  if (props.max) {
    const maxDate = new Date(props.max)
    maxDate.setHours(23, 59, 59, 999)
    if (date > maxDate) return true
  }
  
  return false
}

const displayValue = computed(() => {
  if (!props.modelValue) return props.placeholder
  
  const date = parse(props.modelValue, 'yyyy-MM-dd', new Date())
  if (isNaN(date.getTime())) return props.placeholder

  return format(date, 'dd/MM/yyyy')
})

const displayValueClasses = computed(() => {
  return props.modelValue
    ? 'text-ink'
    : 'text-ink-subtle'
})

const buttonClasses = computed(() => {
  const baseClasses = 'flex w-full items-center rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-subtle hover:border-line-strong'
  
  const errorClasses = props.error 
    ? 'border-danger-400 focus:border-danger-500 focus-visible:ring-danger-500' 
    : ''
  
  return [
    baseClasses,
    errorClasses
  ].join(' ')
})

const selectDate = (day: { day: number; isCurrentMonth: boolean; isDisabled: boolean; date: Date }) => {
  if (!day.isCurrentMonth || day.isDisabled) return
  
  const dateString = format(new Date(selectedYear.value, selectedMonth.value - 1, day.day), 'yyyy-MM-dd')
  emit('update:modelValue', dateString)
  isOpen.value = false
}

const clearDate = () => {
  emit('update:modelValue', '')
  isOpen.value = false
}

const previousMonth = () => {
  if (selectedMonth.value === 1) {
    selectedMonth.value = 12
    selectedYear.value--
  } else {
    selectedMonth.value--
  }
  updateCalendar()
}

const nextMonth = () => {
  if (selectedMonth.value === 12) {
    selectedMonth.value = 1
    selectedYear.value++
  } else {
    selectedMonth.value++
  }
  updateCalendar()
}

const updateCalendar = () => {
  if (selectedMonth.value < 1) {
    selectedMonth.value = 12
    selectedYear.value--
  } else if (selectedMonth.value > 12) {
    selectedMonth.value = 1
    selectedYear.value++
  }
}

const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  
  if (isOpen.value && props.modelValue) {
    const date = parse(props.modelValue, 'yyyy-MM-dd', new Date())
    if (!isNaN(date.getTime())) {
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
    const date = parse(newValue, 'yyyy-MM-dd', new Date())
    if (!isNaN(date.getTime())) {
      selectedMonth.value = date.getMonth() + 1
      selectedYear.value = date.getFullYear()
    }
  }
})

onMounted(() => {
  if (props.modelValue) {
    const date = parse(props.modelValue, 'yyyy-MM-dd', new Date())
    if (!isNaN(date.getTime())) {
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
