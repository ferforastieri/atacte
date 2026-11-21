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

    <textarea
      :id="fieldId"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :rows="rows"
      :maxlength="maxlength"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error || help ? descriptionId : undefined"
      :class="textareaClasses"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
    />

    <p v-if="error" :id="descriptionId" class="field-error" role="alert">
      {{ error }}
    </p>

    <p v-else-if="help" :id="descriptionId" class="field-hint">
      {{ help }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'

interface Props {
  id?: string
  modelValue: string
  label?: string
  placeholder?: string
  help?: string
  error?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  rows?: number
  maxlength?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false,
  readonly: false,
  rows: 3
})

defineEmits<{
  'update:modelValue': [value: string]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const uid = useId()
const fieldId = computed(() => props.id || `textarea-${uid}`)
const descriptionId = computed(() => `${fieldId.value}-description`)

const textareaClasses = computed(() => {
  const baseClasses = 'block w-full resize-y rounded-xl border bg-surface px-3.5 py-2.5 text-base text-ink shadow-sm transition-colors placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-subtle sm:text-sm'

  const stateClasses = props.error
    ? 'border-danger-400 focus:border-danger-500 focus:ring-danger-500'
    : 'border-line hover:border-line-strong focus:border-primary-500'

  const readonlyClasses = props.readonly
    ? 'cursor-not-allowed bg-surface-muted'
    : ''

  return [baseClasses, stateClasses, readonlyClasses].join(' ')
})
</script>
