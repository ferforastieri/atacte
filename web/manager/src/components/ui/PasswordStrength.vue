<template>
  <div class="password-strength">
    <div class="strength-bar">
      <div 
        class="strength-fill"
        :class="strengthClasses"
        :style="{ width: strengthPercentage + '%' }"
      ></div>
    </div>
    
    <div class="strength-info">
      <span class="strength-label" :class="strengthTextClasses">
        {{ strengthLabel }}
      </span>
      
      <span v-if="score !== undefined" class="strength-score">
        {{ score }}/4
      </span>
    </div>
    
    <div v-if="feedback && (feedback.warning || feedback.suggestions?.length)" class="strength-feedback">
      <p v-if="feedback.warning" class="feedback-warning">
        {{ feedback.warning }}
      </p>
      
      <ul v-if="feedback.suggestions?.length" class="feedback-suggestions">
        <li v-for="suggestion in feedback.suggestions" :key="suggestion">
          {{ suggestion }}
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

const strengthPercentage = computed(() => {
  if (props.score === undefined) return 0
  return ((props.score + 1) / 5) * 100
})

const strengthLabel = computed(() => {
  if (props.score === undefined) return 'Digite uma senha'
  
  const labels = {
    0: 'Muito fraca',
    1: 'Fraca',
    2: 'Razoável',
    3: 'Boa',
    4: 'Excelente'
  }
  
  return labels[props.score as keyof typeof labels] || 'Desconhecida'
})

const strengthClasses = computed(() => {
  if (props.score === undefined) return 'bg-gray-300'
  
  const classes = {
    0: 'bg-red-500',
    1: 'bg-orange-500',
    2: 'bg-yellow-500',
    3: 'bg-blue-500',
    4: 'bg-green-500'
  }
  
  return classes[props.score as keyof typeof classes] || 'bg-gray-300'
})

const strengthTextClasses = computed(() => {
  if (props.score === undefined) return 'text-gray-500'
  
  const classes = {
    0: 'text-red-600',
    1: 'text-orange-600',
    2: 'text-yellow-600',
    3: 'text-blue-600',
    4: 'text-green-600'
  }
  
  return classes[props.score as keyof typeof classes] || 'text-gray-500'
})
</script>

<style scoped>
.password-strength {
  @apply space-y-2;
}

.strength-bar {
  @apply w-full h-2 bg-gray-200 rounded-full overflow-hidden;
}

.strength-fill {
  @apply h-full transition-all duration-300 ease-in-out;
}

.strength-info {
  @apply flex justify-between items-center text-sm;
}

.strength-label {
  @apply font-medium;
}

.strength-score {
  @apply text-gray-500 text-xs;
}

.strength-feedback {
  @apply space-y-1;
}

.feedback-warning {
  @apply text-sm text-orange-600;
}

.feedback-suggestions {
  @apply text-sm text-gray-600 space-y-1;
}

.feedback-suggestions li {
  @apply flex items-start;
}

.feedback-suggestions li::before {
  content: '•';
  @apply text-gray-400 mr-2 mt-0.5;
}
</style>

