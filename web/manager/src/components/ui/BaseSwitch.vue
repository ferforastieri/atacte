<template>
  <label
    class="flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-3.5 transition-colors focus-within:ring-2 focus-within:ring-primary-500"
    :class="modelValue
      ? 'border-primary-500 bg-primary-50/60 dark:border-primary-500 dark:bg-primary-900/20'
      : 'border-line bg-surface hover:border-line-strong'"
  >
    <span class="min-w-0">
      <span class="block text-sm font-medium text-ink">{{ label }}</span>
      <span v-if="description" class="mt-0.5 block text-xs text-ink-muted">{{ description }}</span>
    </span>

    <span
      class="relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors"
      :class="modelValue ? 'bg-primary-700' : 'bg-line-strong'"
      aria-hidden="true"
    >
      <span
        class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
        :class="modelValue ? 'translate-x-[1.15rem]' : 'translate-x-[0.18rem]'"
      ></span>
    </span>

    <input
      type="checkbox"
      class="sr-only"
      :checked="modelValue"
      :disabled="disabled"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
  </label>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  label: string
  description?: string
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  description: '',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>
