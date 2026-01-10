<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Header -->
    <AppHeader
      :show-logo="true"
      :show-navigation="true"
    />

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <!-- Header do Calendário - Estilo Google Agenda -->
      <div class="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <!-- Lado Esquerdo: Botão de Data + Navegação -->
        <div class="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <!-- Botão de Data (Grande, Clicável) -->
          <div class="relative flex-shrink-0">
            <button
              @click.stop="showDatePicker = !showDatePicker"
              class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 justify-between border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 min-w-0"
            >
              <span class="truncate">{{ getCurrentDateLabel() }}</span>
              <ChevronDownIcon class="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            </button>
            
            <!-- Mini Calendário (como Google Agenda) -->
            <Transition name="dropdown">
              <div
                v-if="showDatePicker"
                @click.stop
                class="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-50"
              >
                <div class="p-3">
                  <!-- Cabeçalho do Mini Calendário -->
                  <div class="flex items-center justify-between mb-3">
                    <button
                      @click="navigateDateInPicker(-1)"
                      class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    >
                      <ChevronLeftIcon class="w-4 h-4 text-gray-700 dark:text-gray-300" />
                    </button>
                    <button
                      @click="showMonthYearPicker = !showMonthYearPicker"
                      class="px-3 py-1 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    >
                      {{ format(currentDate, 'MMMM yyyy', { locale: ptBR }) }}
                    </button>
                    <button
                      @click="navigateDateInPicker(1)"
                      class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    >
                      <ChevronRightIcon class="w-4 h-4 text-gray-700 dark:text-gray-300" />
                    </button>
                  </div>
                  
                  <!-- Seletor de Mês/Ano -->
                  <div v-if="showMonthYearPicker" class="mb-3 grid grid-cols-2 gap-2">
                    <BaseSelect
                      v-model.number="selectedMonth"
                      class="w-full text-sm"
                    >
                      <option v-for="(month, index) in months" :key="index" :value="index + 1">
                        {{ month }}
                      </option>
                    </BaseSelect>
                    <BaseSelect
                      v-model.number="selectedYear"
                      class="w-full text-sm"
                    >
                      <option v-for="year in availableYears" :key="year" :value="year">
                        {{ year }}
                      </option>
                    </BaseSelect>
                    <div class="col-span-2 flex gap-2">
                      <BaseButton
                        variant="primary"
                        @click="goToSelectedDate"
                        class="flex-1 text-sm"
                      >
                        Ir
                      </BaseButton>
                      <BaseButton
                        variant="secondary"
                        @click="showMonthYearPicker = false"
                        class="flex-1 text-sm"
                      >
                        Cancelar
                      </BaseButton>
                    </div>
                  </div>
                  
                  <!-- Mini Calendário -->
                  <div v-else>
                    <div class="grid grid-cols-7 gap-1 mb-2">
                      <div
                        v-for="day in weekDaysShort"
                        :key="day"
                        class="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1"
                      >
                        {{ day }}
                      </div>
                    </div>
                    <div class="grid grid-cols-7 gap-1">
                      <button
                        v-for="(day, index) in miniCalendarDays"
                        :key="index"
                        @click="selectDateFromPicker(day.date)"
                        class="aspect-square flex items-center justify-center text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border"
                        :class="{
                          'text-gray-400 dark:text-gray-600 border-transparent': !day.isCurrentMonth,
                          'bg-primary-600 text-white font-semibold border-primary-600': isToday(day.date),
                          'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-primary-300 dark:border-primary-700': !isToday(day.date) && day.isSelected,
                          'text-gray-900 dark:text-gray-100 border-transparent': day.isCurrentMonth && !isToday(day.date) && !day.isSelected,
                        }"
                      >
                        {{ format(day.date, 'd') }}
                      </button>
                    </div>
                    <button
                      @click="goToToday"
                      class="w-full mt-3 px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors border border-primary-200 dark:border-primary-800"
                    >
                      Hoje
                    </button>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Botões de Navegação -->
          <div class="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800 flex-shrink-0">
            <button
              @click="navigateDate(-1)"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-r border-gray-300 dark:border-gray-600 touch-manipulation"
            >
              <ChevronLeftIcon class="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              @click="navigateDate(1)"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
            >
              <ChevronRightIcon class="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
          
          <!-- Botão Hoje -->
          <button
            @click="goToToday"
            class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 flex-shrink-0 touch-manipulation"
          >
            Hoje
          </button>
        </div>

        <!-- Lado Direito: Seletor de Visualização -->
        <div class="flex items-center space-x-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-1 w-full sm:w-auto">
          <button
            v-for="view in viewOptions"
            :key="view.value"
            @click="currentView = view.value"
            class="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded transition-colors border touch-manipulation"
            :class="currentView === view.value
              ? 'bg-primary-600 text-white border-primary-600'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-transparent'"
          >
            {{ view.label }}
          </button>
        </div>
      </div>

      <!-- Visualização do Calendário -->
      <!-- Visualização Mensal -->
      <div v-if="currentView === 'month'" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <!-- Dias da semana -->
        <div class="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          <div
            v-for="day in weekDays"
            :key="day"
            class="p-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900"
          >
            {{ day }}
          </div>
        </div>

        <!-- Dias do mês -->
        <div class="grid grid-cols-7">
          <div
            v-for="(day, index) in calendarDays"
            :key="index"
            @click="openCreateModalForDay(day.date)"
            class="min-h-[80px] sm:min-h-[100px] md:min-h-[120px] border-r border-b border-gray-200 dark:border-gray-700 p-1 sm:p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer touch-manipulation active:bg-gray-100 dark:active:bg-gray-600"
            :class="{
              'bg-gray-100 dark:bg-gray-900': !day.isCurrentMonth,
              'bg-blue-50 dark:bg-blue-900/20': isToday(day.date),
            }"
          >
            <div class="flex items-center justify-between mb-1">
              <span
                class="text-xs sm:text-sm font-medium"
                :class="{
                  'text-gray-400 dark:text-gray-600': !day.isCurrentMonth,
                  'text-blue-600 dark:text-blue-400 font-bold': isToday(day.date),
                  'text-gray-900 dark:text-gray-100': day.isCurrentMonth && !isToday(day.date),
                }"
              >
                {{ format(day.date, 'd') }}
              </span>
            </div>
            <div class="space-y-1 overflow-hidden">
              <div
                v-for="event in getEventsForDay(day.date)"
                :key="event.id"
                @click.stop="openEventModal(event)"
                class="text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded cursor-pointer truncate touch-manipulation active:opacity-80 transition-opacity"
                :style="{ backgroundColor: event.color + '20', color: event.color, borderLeft: `2px solid ${event.color}` }"
                :title="event.title"
              >
                <span class="line-clamp-1">{{ event.title }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Visualização Semanal -->
      <div v-if="currentView === 'week'" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
          <div class="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900"></div>
          <div
            v-for="day in weekDaysData"
            :key="day.date.toISOString()"
            class="p-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700"
            :class="{
              'bg-blue-50 dark:bg-blue-900/20': isToday(day.date),
            }"
          >
            <div>{{ day.dayName }}</div>
            <div class="text-lg font-bold mt-1" :class="{
              'text-blue-600 dark:text-blue-400': isToday(day.date),
              'text-gray-900 dark:text-gray-100': !isToday(day.date),
            }">
              {{ day.dayNumber }}
            </div>
          </div>
        </div>
        <div class="grid grid-cols-8">
          <div class="border-r border-gray-200 dark:border-gray-700">
            <div
              v-for="hour in hours"
              :key="hour"
              class="h-16 border-b border-gray-200 dark:border-gray-700 p-2 text-xs text-gray-500 dark:text-gray-400"
            >
              {{ hour }}:00
            </div>
          </div>
          <div
            v-for="day in weekDaysData"
            :key="day.date.toISOString()"
            class="border-r border-b border-gray-200 dark:border-gray-700 min-h-[600px]"
          >
            <div class="relative h-full">
              <div
                v-for="hour in hours"
                :key="hour"
                class="h-16 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                @click="openCreateModalForTime(day.date, hour)"
              ></div>
              <!-- Eventos do dia -->
              <div
                v-for="event in getEventsForDay(day.date)"
                :key="event.id"
                @click.stop="openEventModal(event)"
                class="absolute left-1 right-1 rounded px-1 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs cursor-pointer truncate touch-manipulation active:opacity-80 transition-opacity"
                :style="{
                  backgroundColor: event.color + '20',
                  color: event.color,
                  borderLeft: `2px solid ${event.color}`,
                  top: getEventPosition(event),
                  height: getEventHeight(event),
                }"
                :title="event.title"
              >
                <span class="line-clamp-1">{{ event.title }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Visualização Diária -->
      <div v-if="currentView === 'day'" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }) }}
          </h3>
        </div>
        <div class="grid grid-cols-12">
          <div class="col-span-2 border-r border-gray-200 dark:border-gray-700">
            <div
              v-for="hour in hours"
              :key="hour"
              class="h-16 border-b border-gray-200 dark:border-gray-700 p-2 text-sm text-gray-500 dark:text-gray-400"
            >
              {{ hour }}:00
            </div>
          </div>
          <div class="col-span-10">
            <div class="relative h-full min-h-[600px]">
              <div
                v-for="hour in hours"
                :key="hour"
                class="h-16 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                @click="openCreateModalForTime(currentDate, hour)"
              ></div>
              <!-- Eventos do dia -->
              <div
                v-for="event in getEventsForDay(currentDate)"
                :key="event.id"
                @click.stop="openEventModal(event)"
                class="absolute left-1 right-1 rounded px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm cursor-pointer truncate touch-manipulation active:opacity-80 transition-opacity"
                :style="{
                  backgroundColor: event.color + '20',
                  color: event.color,
                  borderLeft: `3px solid ${event.color}`,
                  top: getEventPosition(event),
                  height: getEventHeight(event),
                }"
                :title="event.title"
              >
                <span class="line-clamp-2">{{ event.title }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>


      <!-- Lista de eventos do mês -->
      <div class="mt-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Eventos deste mês
        </h3>
        <div class="space-y-2">
          <div
            v-for="event in monthEvents"
            :key="event.id"
            @click="openEventModal(event)"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 cursor-pointer hover:shadow-md transition-shadow touch-manipulation active:bg-gray-50 dark:active:bg-gray-700"
          >
            <div class="flex items-start">
              <div
                class="w-1 h-full rounded mr-4"
                :style="{ backgroundColor: event.color }"
              ></div>
              <div class="flex-1">
                <h4 class="font-semibold text-gray-900 dark:text-gray-100">{{ event.title }}</h4>
                <p v-if="event.description" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ event.description }}
                </p>
                <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span class="flex items-center">
                    <CalendarIcon class="w-4 h-4 mr-1" />
                    {{ formatEventDate(event) }}
                  </span>
                  <span v-if="event.location" class="flex items-center">
                    <MapPinIcon class="w-4 h-4 mr-1" />
                    {{ event.location }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="monthEvents.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
          Nenhum evento este mês
        </div>
      </div>
    </div>

    <!-- Create/Edit Event Modal -->
    <CalendarEventModal
      :show="showCreateModal || showEditModal"
      :event="selectedEvent"
      :is-edit="showEditModal"
      @close="closeModal"
      @created="handleEventCreated"
      @updated="handleEventUpdated"
    />
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.touch-manipulation {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday as isTodayFn, addMonths, addWeeks, addDays, getYear, getMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import calendarApi, { type CalendarEvent } from '@/api/calendar'
import { useToast } from '@/hooks/useToast'
import { AppHeader, BaseButton, BaseSelect } from '@/components/ui'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  MapPinIcon,
  ChevronDownIcon
} from '@heroicons/vue/24/outline'
import CalendarEventModal from '@/components/calendar/CalendarEventModal.vue'

const toast = useToast()
const currentDate = ref(new Date())
const events = ref<CalendarEvent[]>([])
const loading = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedEvent = ref<CalendarEvent | null>(null)
const currentView = ref<'day' | 'week' | 'month'>('month')
const showDatePicker = ref(false)
const showMonthYearPicker = ref(false)
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedYear = ref(new Date().getFullYear())

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const weekDaysShort = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const viewOptions = [
  { label: 'Dia', value: 'day' },
  { label: 'Semana', value: 'week' },
  { label: 'Mês', value: 'month' },
]

const hours = Array.from({ length: 24 }, (_, i) => i)

const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear - 10; i <= currentYear + 10; i++) {
    years.push(i)
  }
  return years
})

const calendarDays = computed(() => {
  const monthStart = startOfMonth(currentDate.value)
  const monthEnd = endOfMonth(currentDate.value)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  
  return eachDayOfInterval({ start: calendarStart, end: calendarEnd }).map(date => ({
    date,
    isCurrentMonth: isSameMonth(date, currentDate.value)
  }))
})

const weekDaysData = computed(() => {
  const weekStart = startOfWeek(currentDate.value, { weekStartsOn: 0 })
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i)
    return {
      date,
      dayName: format(date, 'EEE', { locale: ptBR }),
      dayNumber: format(date, 'd')
    }
  })
})

const miniCalendarDays = computed(() => {
  const monthStart = startOfMonth(currentDate.value)
  const monthEnd = endOfMonth(currentDate.value)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  
  return eachDayOfInterval({ start: calendarStart, end: calendarEnd }).map(date => ({
    date,
    isCurrentMonth: isSameMonth(date, currentDate.value),
    isSelected: format(date, 'yyyy-MM-dd') === format(currentDate.value, 'yyyy-MM-dd')
  }))
})

const monthEvents = computed(() => {
  const monthStart = startOfMonth(currentDate.value)
  const monthEnd = endOfMonth(currentDate.value)
  
  return events.value.filter(event => {
    const eventDate = new Date(event.startDate)
    return eventDate >= monthStart && eventDate <= monthEnd
  }).sort((a, b) => {
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  })
})

const isToday = (date: Date) => {
  return isTodayFn(date)
}

const getEventsForDay = (date: Date) => {
  return events.value.filter(event => {
    const eventDate = new Date(event.startDate)
    return format(eventDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
  })
}

const formatEventDate = (event: CalendarEvent) => {
  const startDate = new Date(event.startDate)
  if (event.isAllDay) {
    return format(startDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  }
  return format(startDate, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
}

const getCurrentDateLabel = () => {
  switch (currentView.value) {
    case 'day':
      return format(currentDate.value, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    case 'week':
      const weekStart = startOfWeek(currentDate.value, { weekStartsOn: 0 })
      const weekEnd = endOfWeek(currentDate.value, { weekStartsOn: 0 })
      if (isSameMonth(weekStart, weekEnd)) {
        return `${format(weekStart, 'd')} - ${format(weekEnd, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`
      }
      return `${format(weekStart, "d 'de' MMMM", { locale: ptBR })} - ${format(weekEnd, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`
    case 'month':
      return format(currentDate.value, 'MMMM yyyy', { locale: ptBR })
    default:
      return format(currentDate.value, 'MMMM yyyy', { locale: ptBR })
  }
}

const navigateDate = (direction: number) => {
  switch (currentView.value) {
    case 'day':
      currentDate.value = addDays(currentDate.value, direction)
      break
    case 'week':
      currentDate.value = addWeeks(currentDate.value, direction)
      break
    case 'month':
      currentDate.value = addMonths(currentDate.value, direction)
      break
  }
  updateSelectedDate()
  loadEvents()
}

const navigateDateInPicker = (direction: number) => {
  currentDate.value = addMonths(currentDate.value, direction)
  updateSelectedDate()
}

const selectDateFromPicker = (date: Date) => {
  currentDate.value = date
  showDatePicker.value = false
  updateSelectedDate()
  loadEvents()
}

const goToToday = () => {
  currentDate.value = new Date()
  updateSelectedDate()
  showDatePicker.value = false
  loadEvents()
}

const goToSelectedDate = () => {
  const newDate = new Date(selectedYear.value, selectedMonth.value - 1, 1)
  currentDate.value = newDate
  showMonthYearPicker.value = false
  showDatePicker.value = false
  updateSelectedDate()
  loadEvents()
}

const updateSelectedDate = () => {
  selectedMonth.value = getMonth(currentDate.value) + 1
  selectedYear.value = getYear(currentDate.value)
}

const getEventPosition = (event: CalendarEvent) => {
  if (event.isAllDay) return '0px'
  const startDate = new Date(event.startDate)
  const hours = startDate.getHours()
  const minutes = startDate.getMinutes()
  return `${(hours * 64) + (minutes / 60 * 64)}px`
}

const getEventHeight = (event: CalendarEvent) => {
  if (event.isAllDay) return 'auto'
  if (!event.endDate) return '32px'
  const startDate = new Date(event.startDate)
  const endDate = new Date(event.endDate)
  const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60)
  return `${Math.max(32, (duration / 60) * 64)}px`
}

const openCreateModalForTime = (date: Date, hour: number) => {
  const startDate = new Date(date)
  startDate.setHours(hour, 0, 0, 0)
  
  selectedEvent.value = {
    id: '',
    title: '',
    description: '',
    startDate: startDate.toISOString(),
    endDate: '',
    isAllDay: false,
    reminderMinutes: [],
    color: '#3b82f6',
    location: '',
    createdAt: '',
    updatedAt: ''
  } as CalendarEvent
  
  showCreateModal.value = true
}

watch(currentView, () => {
  loadEvents()
})

watch(() => currentDate.value, () => {
  updateSelectedDate()
})

const loadEvents = async () => {
  try {
    loading.value = true
    let startDate: Date
    let endDate: Date
    
    switch (currentView.value) {
      case 'day':
        startDate = new Date(currentDate.value)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(currentDate.value)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'week':
        startDate = startOfWeek(currentDate.value, { weekStartsOn: 0 })
        endDate = endOfWeek(currentDate.value, { weekStartsOn: 0 })
        endDate.setHours(23, 59, 59, 999)
        break
      case 'month':
        startDate = startOfMonth(currentDate.value)
        endDate = endOfMonth(currentDate.value)
        endDate.setHours(23, 59, 59, 999)
        break
      default:
        startDate = startOfMonth(currentDate.value)
        endDate = endOfMonth(currentDate.value)
        endDate.setHours(23, 59, 59, 999)
    }
    
    const response = await calendarApi.searchEvents({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    })
    
    if (response.success) {
      events.value = response.data || []
    }
  } catch (error: unknown) {
    toast.error('Erro ao carregar eventos')
  } finally {
    loading.value = false
  }
}

const openEventModal = (event: CalendarEvent) => {
  selectedEvent.value = event
  showEditModal.value = true
}

const openCreateModalForDay = (date: Date) => {
  selectedEvent.value = null
  const startDate = new Date(date)
  startDate.setHours(9, 0, 0, 0)
  
  selectedEvent.value = {
    id: '',
    title: '',
    description: '',
    startDate: startDate.toISOString(),
    endDate: '',
    isAllDay: false,
    reminderMinutes: [],
    color: '#3b82f6',
    location: '',
    createdAt: '',
    updatedAt: ''
  } as CalendarEvent
  
  showCreateModal.value = true
}

const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  selectedEvent.value = null
}

const handleEventCreated = () => {
  closeModal()
  loadEvents()
  toast.success('Evento criado com sucesso!')
}

const handleEventUpdated = () => {
  closeModal()
  loadEvents()
  toast.success('Evento atualizado com sucesso!')
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative') && showDatePicker.value) {
    showDatePicker.value = false
    showMonthYearPicker.value = false
  }
}

onMounted(() => {
  updateSelectedDate()
  loadEvents()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

