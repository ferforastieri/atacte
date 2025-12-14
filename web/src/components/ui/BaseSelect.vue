<template>
  <div class="space-y-1">
    <label 
      v-if="label" 
      :for="selectId"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>
    
    <select
      :id="selectId"
      :value="modelValue"
      :disabled="disabled"
      :class="selectClasses"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
    >
      <slot />
    </select>
    
    <p v-if="error" class="text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </p>
    
    <p v-else-if="help" class="text-sm text-gray-500 dark:text-gray-400">
      {{ help }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: string | number
  label?: string
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
}>()

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const value = typeof props.modelValue === 'number' ? Number(target.value) : target.value
  emit('update:modelValue', value)
}

const selectId = computed(() => `select-${Math.random().toString(36).substr(2, 9)}`)

const selectClasses = computed(() => {
  const baseClasses = 'block w-full rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 px-3 py-1.5'
  
  const errorClasses = props.error 
    ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
    : ''
  
  return [
    baseClasses,
    errorClasses
  ].join(' ')
})
</script>

