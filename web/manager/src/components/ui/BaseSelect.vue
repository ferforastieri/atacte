<template>
  <div class="space-y-1.5">
    <label
      v-if="label"
      :for="selectId"
      class="field-label"
    >
      {{ label }}
      <span v-if="required" class="ml-0.5 text-danger-500" aria-hidden="true">*</span>
    </label>

    <div class="relative">
      <select
        :id="selectId"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error || help ? descriptionId : undefined"
        :class="selectClasses"
        @change="handleChange"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      >
        <slot />
      </select>

      <ChevronDownIcon
        class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
        aria-hidden="true"
      />
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
import { computed, useId } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'

interface Props {
  id?: string
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

const uid = useId()
const selectId = computed(() => props.id || `select-${uid}`)
const descriptionId = computed(() => `${selectId.value}-description`)

const selectClasses = computed(() => {
  const baseClasses = 'block w-full appearance-none rounded-xl border bg-surface py-2.5 pl-3.5 pr-10 text-base text-ink shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-subtle sm:text-sm'

  const stateClasses = props.error
    ? 'border-danger-400 focus:border-danger-500 focus:ring-danger-500'
    : 'border-line hover:border-line-strong focus:border-primary-500'

  return [baseClasses, stateClasses].join(' ')
})

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const value = typeof props.modelValue === 'number' ? Number(target.value) : target.value
  emit('update:modelValue', value)
  emit('change', event)
}
</script>
