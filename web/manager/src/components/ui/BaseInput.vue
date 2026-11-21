<template>
  <div class="space-y-1.5">
    <label
      v-if="label"
      :for="fieldId"
      class="field-label"
    >
      {{ label }}
      <span v-if="required" class="ml-0.5 text-danger-500" aria-hidden="true">*</span>
    </label>

    <div class="relative">
      <div
        v-if="leftIcon"
        class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5"
      >
        <component :is="leftIcon" class="h-4 w-4 text-ink-subtle" aria-hidden="true" />
      </div>

      <input
        :id="fieldId"
        :type="inputType"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :name="name"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :minlength="minlength"
        :maxlength="maxlength"
        :min="min"
        :max="max"
        :step="step"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error || help ? descriptionId : undefined"
        :class="inputClasses"
        :style="inputStyle"
        @input="handleInput"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      />

      <div
        v-if="rightIcon || showPasswordToggle"
        class="absolute inset-y-0 right-0 flex items-center pr-2.5"
      >
        <button
          v-if="showPasswordToggle"
          type="button"
          class="rounded-lg p-1.5 text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          :aria-label="passwordVisible ? 'Ocultar senha' : 'Mostrar senha'"
          :title="passwordVisible ? 'Ocultar senha' : 'Mostrar senha'"
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
          class="h-4 w-4 text-ink-subtle"
          aria-hidden="true"
        />
      </div>
    </div>

    <p v-if="error" :id="descriptionId" class="field-error" role="alert">
      {{ error }}
    </p>

    <p v-else-if="help" :id="descriptionId" class="field-hint">
      {{ help }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import type { Component } from 'vue'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'

interface Props {
  id?: string
  modelValue: string | number
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'search'
  label?: string
  placeholder?: string
  help?: string
  error?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  leftIcon?: string | Component
  rightIcon?: string | Component
  showPasswordToggle?: boolean
  name?: string
  autocomplete?: string
  inputmode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'
  minlength?: number | string
  maxlength?: number | string
  min?: number | string
  max?: number | string
  step?: number | string
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

const uid = useId()
const fieldId = computed(() => props.id || `input-${uid}`)
const descriptionId = computed(() => `${fieldId.value}-description`)
const passwordVisible = ref(false)

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (props.type === 'number') {
    emit('update:modelValue', parseFloat(target.value) || 0)
  } else {
    emit('update:modelValue', target.value)
  }
}

const inputType = computed(() => {
  if (props.type === 'password' && passwordVisible.value) {
    return 'text'
  }
  return props.type
})

const inputClasses = computed(() => {
  const baseClasses = 'block w-full rounded-xl border bg-surface text-base text-ink shadow-sm transition-colors placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-subtle sm:text-sm'

  const stateClasses = props.error
    ? 'border-danger-400 focus:border-danger-500 focus:ring-danger-500'
    : 'border-line hover:border-line-strong focus:border-primary-500'

  const readonlyClasses = props.readonly
    ? 'cursor-not-allowed bg-surface-muted'
    : ''

  return [
    baseClasses,
    stateClasses,
    readonlyClasses,
    'py-2.5'
  ].join(' ')
})

const inputStyle = computed(() => {
  if (props.leftIcon) {
    if (props.rightIcon || props.showPasswordToggle) {
      return { paddingLeft: '2.5rem', paddingRight: '2.75rem' }
    }
    return { paddingLeft: '2.5rem', paddingRight: '0.875rem' }
  }
  if (props.rightIcon || props.showPasswordToggle) {
    return { paddingLeft: '0.875rem', paddingRight: '2.75rem' }
  }
  return { paddingLeft: '0.875rem', paddingRight: '0.875rem' }
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
