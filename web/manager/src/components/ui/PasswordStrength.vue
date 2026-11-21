<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between gap-3 text-xs">
      <span class="font-medium" :class="strengthTextClass">{{ strengthLabel }}</span>
      <span v-if="crackTime" class="truncate text-ink-subtle">{{ crackTime }}</span>
    </div>

    <div class="flex gap-1" aria-hidden="true">
      <span
        v-for="index in 5"
        :key="index"
        class="h-1.5 flex-1 rounded-full transition-colors duration-300"
        :class="index <= strengthBars ? strengthBarClass : 'bg-line'"
      ></span>
    </div>

    <div v-if="feedback && (feedback.warning || feedback.suggestions?.length)" class="space-y-1">
      <p v-if="feedback.warning" class="text-xs font-medium text-warning-700 dark:text-warning-400">
        {{ feedback.warning }}
      </p>
      <ul v-if="feedback.suggestions?.length" class="space-y-0.5 text-xs text-ink-muted">
        <li v-for="suggestion in feedback.suggestions" :key="suggestion" class="flex gap-1.5">
          <span class="text-ink-subtle" aria-hidden="true">•</span>
          <span>{{ suggestion }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  score?: number
  feedback?: {
    warning?: string
    suggestions?: string[]
  }
  crackTime?: string
}

const props = defineProps<Props>()

const strengthBars = computed(() => {
  if (props.score === undefined) return 0
  return props.score + 1
})

const strengthLabel = computed(() => {
  if (props.score === undefined) return 'Digite uma senha'
  const labels = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Excelente']
  return labels[props.score] || 'Desconhecida'
})

const strengthBarClass = computed(() => {
  const classes = ['bg-danger-500', 'bg-orange-500', 'bg-warning-500', 'bg-info-500', 'bg-primary-500']
  return classes[props.score ?? 0] || 'bg-line'
})

const strengthTextClass = computed(() => {
  if (props.score === undefined) return 'text-ink-muted'
  const classes = [
    'text-danger-600 dark:text-danger-400',
    'text-orange-700 dark:text-orange-400',
    'text-warning-700 dark:text-warning-400',
    'text-info-600 dark:text-info-400',
    'text-primary-700 dark:text-primary-400'
  ]
  return classes[props.score] || 'text-ink-muted'
})
</script>
