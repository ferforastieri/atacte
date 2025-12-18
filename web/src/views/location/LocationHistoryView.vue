<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Header -->
    <AppHeader
      :show-logo="true"
      :show-back-button="true"
      :back-route="'/location'"
      :show-navigation="true"
    />

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">

      <!-- Header Card -->
      <BaseCard class="mb-6">
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          Histórico - {{ memberName }}
        </h1>
      </BaseCard>

      <!-- Date Filter -->
      <BaseCard class="mb-6" style="overflow: visible; position: relative; z-index: 10;">
        <div class="flex flex-col sm:flex-row gap-4" style="position: relative; overflow: visible;">
          <div class="flex-1">
            <DatePicker
              v-model="startDate"
              label="Data Inicial"
              @update:modelValue="loadHistory"
            />
          </div>
          <div class="flex-1">
            <DatePicker
              v-model="endDate"
              label="Data Final"
              @update:modelValue="loadHistory"
            />
          </div>
          <div class="flex items-end">
            <BaseButton
              variant="primary"
              @click="loadHistory"
              :loading="isLoading"
            >
              Buscar
            </BaseButton>
          </div>
        </div>
      </BaseCard>

      <!-- Map Container -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6" style="position: relative; z-index: 1;">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Mapa</h2>
        </div>
        <div class="relative">
          <div id="history-map" class="h-96 bg-gray-100 dark:bg-gray-700 rounded-b-lg"></div>
        </div>
      </div>

      <!-- Locations List -->
      <BaseCard>
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Localizações ({{ locations.length }})
          </h2>
        </div>
        <div class="p-4">
          <div v-if="isLoading" class="text-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Carregando...</p>
          </div>
          <div v-else-if="locations.length === 0" class="text-center py-8">
            <p class="text-gray-500 dark:text-gray-400">Nenhuma localização encontrada no período selecionado</p>
          </div>
          <div v-else class="space-y-3 max-h-96 overflow-y-auto">
            <div
              v-for="location in locations"
              :key="location.id"
              class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              @click="goToLocation(location)"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ formatDateTime(location.timestamp) }}
                  </p>
                  <p v-if="location.address" class="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1.5 flex items-start gap-1.5">
                    <span class="text-primary-600 dark:text-primary-400">📍</span>
                    <span class="flex-1">{{ location.address }}</span>
                  </p>
                  <p v-else class="text-xs text-gray-500 dark:text-gray-400 mt-1.5 italic">
                    Endereço não disponível
                  </p>
                  <div class="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>Lat: {{ location.latitude.toFixed(6) }}</span>
                    <span>Lng: {{ location.longitude.toFixed(6) }}</span>
                    <span v-if="location.accuracy">Precisão: {{ Math.round(location.accuracy) }}m</span>
                  </div>
                </div>
                <div class="ml-4">
                  <div
                    class="w-3 h-3 rounded-full"
                    :style="{ backgroundColor: getLocationColor(location) }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { locationApi, type LocationData } from '@/api/location'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { startOfDay, endOfDay } from 'date-fns'
import { AppHeader, BaseButton, BaseCard, DatePicker } from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const userId = computed(() => route.params.userId as string)
const memberName = computed(() => (route.query.name as string) || 'Membro')

const isLoading = ref(false)
const locations = ref<LocationData[]>([])

const today = new Date()
const yesterday = new Date(today)
yesterday.setDate(yesterday.getDate() - 1)

const startDate = ref(yesterday.toISOString().split('T')[0])
const endDate = ref(today.toISOString().split('T')[0])

let map: L.Map | null = null
let markers: L.Marker[] = []
let polyline: L.Polyline | null = null

const initMap = () => {
  if (map) return

  const initialLat = locations.value.length > 0 ? locations.value[0].latitude : -23.5505
  const initialLng = locations.value.length > 0 ? locations.value[0].longitude : -46.6333
  const initialZoom = locations.value.length > 0 ? 13 : 12

  map = L.map('history-map').setView([initialLat, initialLng], initialZoom)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map)

  map.addControl(L.control.zoom({ position: 'topright' }))
  map.addControl(L.control.scale({ position: 'bottomright' }))

  updateMapMarkers()
}

const updateMapMarkers = () => {
  if (!map) return

  markers.forEach(marker => map?.removeLayer(marker))
  markers = []

  if (polyline) {
    map.removeLayer(polyline)
    polyline = null
  }

  if (locations.value.length === 0) return

  const latlngs: L.LatLngExpression[] = []
  const colors = ['#16a34a', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b']

  locations.value.forEach((location, index) => {
    const color = colors[index % colors.length]
    const isFirst = index === 0
    const isLast = index === locations.value.length - 1

    latlngs.push([location.latitude, location.longitude])

    let icon: L.Icon | L.DivIcon
    if (isFirst) {
      icon = L.divIcon({
        className: 'custom-marker-start',
        html: `<div style="
          background-color: #16a34a;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
    } else if (isLast) {
      icon = L.divIcon({
        className: 'custom-marker-end',
        html: `<div style="
          background-color: #dc2626;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
    } else {
      icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background-color: ${color};
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      })
    }

    const marker = L.marker([location.latitude, location.longitude], { icon })
      .bindPopup(`
        <div style="padding: 8px; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937;">${formatDateTime(location.timestamp)}</h3>
          ${location.address ? `<p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 500; color: #374151;">📍 ${location.address}</p>` : '<p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af; font-style: italic;">Endereço não disponível</p>'}
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">Lat: ${location.latitude.toFixed(6)}</p>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">Lng: ${location.longitude.toFixed(6)}</p>
            ${location.accuracy ? `<p style="margin: 0; font-size: 12px; color: #6b7280;">Precisão: ${Math.round(location.accuracy)}m</p>` : ''}
          </div>
        </div>
      `)
      .addTo(map!)

    markers.push(marker)
  })

  if (latlngs.length > 1) {
    polyline = L.polyline(latlngs, {
      color: '#3b82f6',
      weight: 4,
      opacity: 0.7
    }).addTo(map!)

    map.fitBounds(polyline.getBounds(), { padding: [50, 50] })
  } else if (latlngs.length === 1) {
    const firstLatLng = latlngs[0]
    if (Array.isArray(firstLatLng)) {
      map.setView([firstLatLng[0], firstLatLng[1]], 15)
    } else {
      map.setView([firstLatLng.lat, firstLatLng.lng], 15)
    }
  }
}

const getLocationColor = (location: LocationData): string => {
  const index = locations.value.findIndex(l => l.id === location.id)
  const colors = ['#16a34a', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b']
  return colors[index % colors.length]
}

const goToLocation = (location: LocationData) => {
  if (!map) return
  map.setView([location.latitude, location.longitude], 15)
  
  const marker = markers.find(m => {
    const latlng = m.getLatLng()
    return latlng.lat === location.latitude && latlng.lng === location.longitude
  })
  
  if (marker) {
    marker.openPopup()
  }
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadHistory = async () => {
  if (!userId.value) return

  isLoading.value = true
  try {
    const startDateObj = new Date(startDate.value + 'T00:00:00')
    const start = startOfDay(startDateObj)
    
    const endDateObj = new Date(endDate.value + 'T00:00:00')
    const end = endOfDay(endDateObj)

    if (start > end) {
      toast.error('Data inicial deve ser anterior à data final')
      isLoading.value = false
      return
    }

    locations.value = await locationApi.getLocationHistory(userId.value, start, end, 1000)
    
    if (locations.value.length === 0) {
      toast.info('Nenhuma localização encontrada no período selecionado')
    } else {
      toast.success(`${locations.value.length} localização(ões) encontrada(s)`)
    }

    if (map) {
      updateMapMarkers()
    } else {
      setTimeout(() => {
        initMap()
      }, 100)
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Erro ao carregar histórico de localização')
  } finally {
    isLoading.value = false
  }
}

const goBack = () => {
  router.push({ name: 'Location' })
}

onMounted(async () => {
  await loadHistory()
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

