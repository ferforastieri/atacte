<template>
  <div
    :class="['skeleton', variantClass]"
    aria-hidden="true"
  ></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'text' | 'title' | 'circle' | 'rect' | 'button'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'text'
})

const variantClass = computed(() => {
  const variants = {
    text: 'h-3.5 w-full',
    title: 'h-5 w-2/3',
    circle: 'h-10 w-10 rounded-full',
    rect: 'h-24 w-full rounded-xl',
    button: 'h-10 w-28 rounded-xl'
  }
  return variants[props.variant]
})
</script>
