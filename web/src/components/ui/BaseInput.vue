<template>
  <div class="space-y-1">
    <label 
      v-if="label" 
      :for="inputId"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>
    
    <div class="relative">
      <input
        :id="inputId"
        :type="inputType"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :step="step"
        :class="inputClasses"
        @input="handleInput"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      />
      
      <!-- Ícone à esquerda -->
      <div v-if="leftIcon" class="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
        <component :is="leftIcon" class="h-4 w-4 text-gray-400 dark:text-gray-500" />
      </div>
      
      <!-- Ícone à direita -->
      <div v-if="rightIcon || showPasswordToggle" class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <button
          v-if="showPasswordToggle"
          type="button"
          class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
          @click="togglePasswordVisibility"
        >
          <component 
            :is="passwordVisible ? EyeSlashIcon : EyeIcon" 
            class="h-4 w-4" 
          />
        </button>
        <component 
          v-else-if="rightIcon" 
          :is="rightIcon" 
          class="h-4 w-4 text-gray-400 dark:text-gray-500" 
        />
      </div>
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
import { computed, ref, watch } from 'vue'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'

interface Props {
  modelValue: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date'
  label?: string
  placeholder?: string
  help?: string
  error?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  leftIcon?: any
  rightIcon?: any
  showPasswordToggle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false,
  readonly: false,
  showPasswordToggle: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (props.type === 'number') {
    emit('update:modelValue', parseFloat(target.value) || 0)
  } else {
    emit('update:modelValue', target.value)
  }
}

const passwordVisible = ref(false)

const inputId = computed(() => `input-${Math.random().toString(36).substr(2, 9)}`)

const inputType = computed(() => {
  if (props.type === 'password' && passwordVisible.value) {
    return 'text'
  }
  return props.type
})

const inputClasses = computed(() => {
  const baseClasses = 'block w-full rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400'
  
  const sizeClasses = props.leftIcon || props.rightIcon || props.showPasswordToggle 
    ? 'pl-8 pr-10' 
    : 'px-3'
  
  const errorClasses = props.error 
    ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
    : ''
  
  const readonlyClasses = props.readonly 
    ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' 
    : 'bg-white dark:bg-gray-800'
  
  return [
    baseClasses,
    sizeClasses,
    errorClasses,
    readonlyClasses,
    'py-1.5'
  ].join(' ')
})

const togglePasswordVisibility = () => {
  passwordVisible.value = !passwordVisible.value
}

watch(() => props.type, (newType) => {
  if (newType !== 'password') {
    passwordVisible.value = false
  }
})
</script>

