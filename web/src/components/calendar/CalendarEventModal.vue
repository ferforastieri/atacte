<template>
  <BaseModal :show="show" @close="$emit('close')" size="lg">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {{ event && event.id && isEdit ? 'Editar Evento' : 'Novo Evento' }}
      </h3>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Título -->
      <div>
        <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Título *
        </label>
        <BaseInput
          id="title"
          v-model="form.title"
          type="text"
          placeholder="Ex: Reunião, Aniversário, Lembrete"
          required
          :error="errors.title"
        />
      </div>

      <!-- Descrição -->
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Descrição
        </label>
        <BaseTextarea
          id="description"
          v-model="form.description"
          placeholder="Adicione uma descrição para o evento"
          rows="3"
        />
      </div>

      <!-- Data e Hora -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="startDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Data de Início *
          </label>
          <BaseInput
            id="startDate"
            v-model="form.startDate"
            type="datetime-local"
            required
            :error="errors.startDate"
          />
        </div>
        <div>
          <label for="endDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Data de Fim
          </label>
          <BaseInput
            id="endDate"
            v-model="form.endDate"
            type="datetime-local"
            :error="errors.endDate"
          />
        </div>
      </div>

      <!-- Dia Inteiro -->
      <div class="flex items-center">
        <input
          id="isAllDay"
          v-model="form.isAllDay"
          type="checkbox"
          class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label for="isAllDay" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
          Evento de dia inteiro
        </label>
      </div>

      <!-- Localização -->
      <div>
        <label for="location" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Localização
        </label>
        <BaseInput
          id="location"
          v-model="form.location"
          type="text"
          placeholder="Ex: Sala de reuniões, Casa, etc."
        />
      </div>

      <!-- Cor -->
      <div>
        <label for="color" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Cor
        </label>
        <div class="flex items-center space-x-2">
          <input
            id="color"
            v-model="form.color"
            type="color"
            class="h-10 w-20 rounded border border-gray-300 dark:border-gray-600"
          />
          <BaseInput
            v-model="form.color"
            type="text"
            placeholder="#3b82f6"
            class="flex-1"
          />
        </div>
      </div>

      <!-- Repetição -->
      <div>
        <label for="recurrenceType" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Repetir
        </label>
        <BaseSelect
          id="recurrenceType"
          v-model="form.recurrenceType"
          placeholder="Não repetir"
        >
          <option value="">Não repetir</option>
          <option value="NONE">Não repetir</option>
          <option value="DAILY">Diariamente</option>
          <option value="WEEKLY">Semanalmente</option>
          <option value="MONTHLY">Mensalmente</option>
          <option value="YEARLY">Anualmente</option>
          <option value="CUSTOM">Personalizado</option>
        </BaseSelect>
        
        <!-- Opções de repetição baseadas no tipo -->
        <div v-if="form.recurrenceType && form.recurrenceType !== 'NONE'" class="mt-4 space-y-4">
          <!-- Intervalo (para todos os tipos) -->
          <div v-if="form.recurrenceType !== 'WEEKLY' && form.recurrenceType !== 'MONTHLY'">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              A cada
            </label>
            <div class="flex items-center space-x-2">
              <BaseInput
                v-model.number="form.recurrenceInterval"
                type="number"
                min="1"
                class="w-20"
              />
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ getRecurrenceIntervalLabel() }}
              </span>
            </div>
          </div>
          
          <!-- Dias da semana (para WEEKLY) -->
          <div v-if="form.recurrenceType === 'WEEKLY'">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dias da semana
            </label>
            <div class="grid grid-cols-7 gap-2">
              <div
                v-for="(day, index) in weekDays"
                :key="index"
                class="flex flex-col items-center"
              >
                <input
                  :id="`day-${index}`"
                  v-model="form.recurrenceDaysOfWeek"
                  :value="index"
                  type="checkbox"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  :for="`day-${index}`"
                  class="mt-1 text-xs text-gray-700 dark:text-gray-300"
                >
                  {{ day }}
                </label>
              </div>
            </div>
            <div class="mt-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                A cada
              </label>
              <div class="flex items-center space-x-2">
                <BaseInput
                  v-model.number="form.recurrenceInterval"
                  type="number"
                  min="1"
                  class="w-20"
                />
                <span class="text-sm text-gray-600 dark:text-gray-400">semana(s)</span>
              </div>
            </div>
          </div>
          
          <!-- Opções mensais -->
          <div v-if="form.recurrenceType === 'MONTHLY'">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Repetir em
            </label>
            <div class="space-y-2">
              <div class="flex items-center">
                <input
                  id="monthly-day"
                  v-model="monthlyRecurrenceMode"
                  value="day"
                  type="radio"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <label for="monthly-day" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Dia
                  <BaseInput
                    v-model.number="form.recurrenceDayOfMonth"
                    type="number"
                    min="1"
                    max="31"
                    class="w-20 ml-2 inline-block"
                  />
                  de cada mês
                </label>
              </div>
              <div class="flex items-center">
                <input
                  id="monthly-week"
                  v-model="monthlyRecurrenceMode"
                  value="week"
                  type="radio"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <label for="monthly-week" class="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <BaseSelect
                    v-model.number="form.recurrenceWeekOfMonth"
                    class="w-32"
                  >
                    <option :value="1">Primeira</option>
                    <option :value="2">Segunda</option>
                    <option :value="3">Terceira</option>
                    <option :value="4">Quarta</option>
                    <option :value="-1">Última</option>
                  </BaseSelect>
                  <BaseSelect
                    v-model.number="selectedDayOfWeek"
                    class="w-32"
                    @update:modelValue="updateMonthlyDayOfWeek"
                  >
                    <option v-for="(day, index) in weekDays" :key="index" :value="index">{{ day }}</option>
                  </BaseSelect>
                </label>
              </div>
            </div>
            <div class="mt-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                A cada
              </label>
              <div class="flex items-center space-x-2">
                <BaseInput
                  v-model.number="form.recurrenceInterval"
                  type="number"
                  min="1"
                  class="w-20"
                />
                <span class="text-sm text-gray-600 dark:text-gray-400">mês(es)</span>
              </div>
            </div>
          </div>
          
          <!-- Data final da repetição -->
          <div>
            <label for="recurrenceEndDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Até
            </label>
            <BaseInput
              id="recurrenceEndDate"
              v-model="form.recurrenceEndDate"
              type="date"
            />
            <div class="mt-1">
              <input
                id="noEndDate"
                v-model="noRecurrenceEndDate"
                type="checkbox"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label for="noEndDate" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Sem data de término
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Lembretes -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Lembretes
        </label>
        <div class="space-y-2">
          <div
            v-for="reminder in reminderOptions"
            :key="reminder.value"
            class="flex items-center"
          >
            <input
              :id="`reminder-${reminder.value}`"
              v-model="form.reminderMinutes"
              :value="reminder.value"
              type="checkbox"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label
              :for="`reminder-${reminder.value}`"
              class="ml-2 block text-sm text-gray-700 dark:text-gray-300"
            >
              {{ reminder.label }}
            </label>
          </div>
        </div>
      </div>

      <!-- Botões -->
      <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <BaseButton
          type="button"
          variant="secondary"
          @click="$emit('close')"
        >
          Cancelar
        </BaseButton>
        <BaseButton
          type="submit"
          variant="primary"
          :loading="loading"
        >
          {{ event && event.id && isEdit ? 'Atualizar' : 'Criar' }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { format } from 'date-fns'
import calendarApi, { type CalendarEvent, type CreateCalendarEventRequest } from '@/api/calendar'
import { useToast } from '@/hooks/useToast'
import { BaseModal, BaseInput, BaseTextarea, BaseButton, BaseSelect } from '@/components/ui'

interface Props {
  show: boolean
  event?: CalendarEvent | null
  isEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isEdit: false
})
const emit = defineEmits<{
  close: []
  created: []
  updated: []
}>()

const toast = useToast()
const loading = ref(false)
const errors = ref<Record<string, string>>({})

const reminderOptions = [
  { label: '5 minutos antes', value: 5 },
  { label: '15 minutos antes', value: 15 },
  { label: '30 minutos antes', value: 30 },
  { label: '1 hora antes', value: 60 },
  { label: '24 horas antes', value: 1440 },
]

const recurrenceTypeOptions = [
  { label: 'Não repetir', value: 'NONE' },
  { label: 'Diariamente', value: 'DAILY' },
  { label: 'Semanalmente', value: 'WEEKLY' },
  { label: 'Mensalmente', value: 'MONTHLY' },
  { label: 'Anualmente', value: 'YEARLY' },
  { label: 'Personalizado', value: 'CUSTOM' },
]

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const weekOfMonthOptions = [
  { label: 'Primeira', value: 1 },
  { label: 'Segunda', value: 2 },
  { label: 'Terceira', value: 3 },
  { label: 'Quarta', value: 4 },
  { label: 'Última', value: -1 },
]

const weekDaysOptions = weekDays.map((day, index) => ({
  label: day,
  value: index
}))

const monthlyRecurrenceMode = ref<'day' | 'week'>('day')
const noRecurrenceEndDate = ref(false)
const selectedDayOfWeek = ref<number>(0)

const updateMonthlyDayOfWeek = (value: number) => {
  if (form.value.recurrenceType === 'MONTHLY' && monthlyRecurrenceMode.value === 'week') {
    form.value.recurrenceDaysOfWeek = [value]
  }
}

const form = ref<CreateCalendarEventRequest & { 
  reminderMinutes: number[]
  recurrenceType?: string | null
  recurrenceInterval?: number | null
  recurrenceEndDate?: string | null
  recurrenceDaysOfWeek?: number[]
  recurrenceDayOfMonth?: number | null
  recurrenceWeekOfMonth?: number | null
}>({
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  isAllDay: false,
  reminderMinutes: [],
  color: '#3b82f6',
  location: '',
  recurrenceType: null,
  recurrenceInterval: 1,
  recurrenceEndDate: null,
  recurrenceDaysOfWeek: [],
  recurrenceDayOfMonth: null,
  recurrenceWeekOfMonth: null,
})

const getRecurrenceIntervalLabel = () => {
  if (!form.value.recurrenceType) return ''
  const labels: Record<string, string> = {
    'DAILY': 'dia(s)',
    'WEEKLY': 'semana(s)',
    'MONTHLY': 'mês(es)',
    'YEARLY': 'ano(s)',
    'CUSTOM': 'dia(s)',
  }
  return labels[form.value.recurrenceType] || ''
}

const formatDateTimeLocal = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const formatDateLocal = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

watch(() => props.event, (newEvent) => {
  if (newEvent && newEvent.id && props.isEdit) {
    form.value = {
      title: newEvent.title,
      description: newEvent.description || '',
      startDate: formatDateTimeLocal(newEvent.startDate),
      endDate: newEvent.endDate ? formatDateTimeLocal(newEvent.endDate) : '',
      isAllDay: newEvent.isAllDay,
      reminderMinutes: newEvent.reminderMinutes || [],
      color: newEvent.color,
      location: newEvent.location || '',
      recurrenceType: newEvent.recurrenceType || null,
      recurrenceInterval: newEvent.recurrenceInterval || 1,
      recurrenceEndDate: newEvent.recurrenceEndDate ? formatDateLocal(newEvent.recurrenceEndDate) : null,
      recurrenceDaysOfWeek: newEvent.recurrenceDaysOfWeek || [],
      recurrenceDayOfMonth: newEvent.recurrenceDayOfMonth || null,
      recurrenceWeekOfMonth: newEvent.recurrenceWeekOfMonth || null,
    }
    noRecurrenceEndDate.value = !newEvent.recurrenceEndDate
    if (newEvent.recurrenceDayOfMonth) {
      monthlyRecurrenceMode.value = 'day'
    } else if (newEvent.recurrenceWeekOfMonth) {
      monthlyRecurrenceMode.value = 'week'
    }
  } else if (newEvent && !props.isEdit) {
    const startDate = new Date(newEvent.startDate)
    form.value = {
      title: '',
      description: '',
      startDate: formatDateTimeLocal(newEvent.startDate),
      endDate: '',
      isAllDay: false,
      reminderMinutes: [15, 60],
      color: '#3b82f6',
      location: '',
      recurrenceType: null,
      recurrenceInterval: 1,
      recurrenceEndDate: null,
      recurrenceDaysOfWeek: [],
      recurrenceDayOfMonth: null,
      recurrenceWeekOfMonth: null,
    }
    noRecurrenceEndDate.value = true
    monthlyRecurrenceMode.value = 'day'
  } else {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    
    form.value = {
      title: '',
      description: '',
      startDate: formatDateTimeLocal(tomorrow.toISOString()),
      endDate: '',
      isAllDay: false,
      reminderMinutes: [15, 60],
      color: '#3b82f6',
      location: '',
      recurrenceType: null,
      recurrenceInterval: 1,
      recurrenceEndDate: null,
      recurrenceDaysOfWeek: [],
      recurrenceDayOfMonth: null,
      recurrenceWeekOfMonth: null,
    }
    noRecurrenceEndDate.value = true
    monthlyRecurrenceMode.value = 'day'
  }
}, { immediate: true })

watch(noRecurrenceEndDate, (value) => {
  if (value) {
    form.value.recurrenceEndDate = null
  }
})

watch(monthlyRecurrenceMode, (mode) => {
  if (mode === 'day') {
    form.value.recurrenceWeekOfMonth = null
    form.value.recurrenceDaysOfWeek = []
  } else {
    form.value.recurrenceDayOfMonth = null
    if (form.value.recurrenceDaysOfWeek && form.value.recurrenceDaysOfWeek.length > 0) {
      selectedDayOfWeek.value = form.value.recurrenceDaysOfWeek[0]
    } else {
      selectedDayOfWeek.value = new Date(form.value.startDate).getDay()
    }
  }
})

watch(() => form.value.recurrenceDaysOfWeek, (days) => {
  if (form.value.recurrenceType === 'MONTHLY' && monthlyRecurrenceMode.value === 'week' && days && days.length > 0) {
    selectedDayOfWeek.value = days[0]
  }
}, { deep: true })

const handleSubmit = async () => {
  try {
    loading.value = true
    errors.value = {}

    const eventData: CreateCalendarEventRequest = {
      title: form.value.title,
      startDate: new Date(form.value.startDate).toISOString(),
      isAllDay: form.value.isAllDay,
      reminderMinutes: form.value.reminderMinutes || [],
      color: form.value.color,
    }

    if (form.value.description) {
      eventData.description = form.value.description
    }
    if (form.value.endDate) {
      eventData.endDate = new Date(form.value.endDate).toISOString()
    }
    if (form.value.location) {
      eventData.location = form.value.location
    }

    if (form.value.recurrenceType && form.value.recurrenceType !== 'NONE') {
      eventData.recurrenceType = form.value.recurrenceType
      if (form.value.recurrenceInterval) {
        eventData.recurrenceInterval = form.value.recurrenceInterval
      }
      if (form.value.recurrenceType === 'WEEKLY' && form.value.recurrenceDaysOfWeek && form.value.recurrenceDaysOfWeek.length > 0) {
        eventData.recurrenceDaysOfWeek = form.value.recurrenceDaysOfWeek
      }
      if (form.value.recurrenceType === 'MONTHLY') {
        if (monthlyRecurrenceMode.value === 'day' && form.value.recurrenceDayOfMonth) {
          eventData.recurrenceDayOfMonth = form.value.recurrenceDayOfMonth
        } else if (monthlyRecurrenceMode.value === 'week') {
          if (form.value.recurrenceWeekOfMonth) {
            eventData.recurrenceWeekOfMonth = form.value.recurrenceWeekOfMonth
          }
          if (form.value.recurrenceDaysOfWeek && form.value.recurrenceDaysOfWeek.length > 0) {
            eventData.recurrenceDaysOfWeek = form.value.recurrenceDaysOfWeek
          }
        }
      }
      if (!noRecurrenceEndDate.value && form.value.recurrenceEndDate) {
        eventData.recurrenceEndDate = new Date(form.value.recurrenceEndDate).toISOString()
      }
    }

    if (props.event && props.event.id && props.isEdit) {
      await calendarApi.updateEvent(props.event.id, eventData)
      emit('updated')
    } else {
      await calendarApi.createEvent(eventData)
      emit('created')
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { errors?: Array<{ field?: string; param?: string; message?: string; msg?: string }> } } };
      if (axiosError.response?.data?.errors) {
        axiosError.response.data.errors.forEach((err) => {
          errors.value[err.field || err.param || ''] = err.message || err.msg || ''
        })
      }
    } else {
      toast.error('Erro ao salvar evento')
    }
  } finally {
    loading.value = false
  }
}
</script>

