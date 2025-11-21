<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Header -->
    <AppHeader
      :show-logo="true"
      :show-navigation="true"
    />

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Action Button -->
      <div class="mb-6 flex justify-end">
        <BaseButton
          variant="primary"
          size="sm"
          @click="startCreatingZone"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nova Zona
        </BaseButton>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Map Container -->
        <div class="lg:col-span-2">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Mapa</h2>
            </div>
            <div class="relative">
              <!-- Leaflet Map -->
              <div id="map" class="h-96 bg-gray-100 dark:bg-gray-700 rounded-b-lg" style="z-index: 1;"></div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Family Members -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Membros da Família</h3>
            </div>
            <div class="p-4">
              <div v-if="isLoading" class="text-center py-4">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Carregando...</p>
              </div>
              <div v-else-if="familyMembers.length === 0" class="text-center py-4">
                <p class="text-gray-500 dark:text-gray-400">Nenhum membro encontrado</p>
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="member in familyMembers"
                  :key="member.id"
                  class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div class="flex-shrink-0">
                    <div class="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <span class="text-sm font-medium text-green-800 dark:text-green-200">
                        {{ member.name?.charAt(0) || '?' }}
                      </span>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {{ member.name || 'Membro' }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ member.lastSeen ? formatTime(member.lastSeen) : 'Nunca visto' }}
                    </p>
                  </div>
                  <div v-if="member.batteryLevel !== null" class="flex items-center space-x-1">
                    <svg class="w-4 h-4" :class="member.batteryLevel < 0.2 ? 'text-red-500' : 'text-green-500'" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 1v10h10V5H5z" clip-rule="evenodd" />
                    </svg>
                    <span class="text-xs text-gray-500 dark:text-gray-400">{{ Math.round(member.batteryLevel * 100) }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Geofence Zones -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Zonas</h3>
            </div>
            <div class="p-4">
              <div v-if="zonesLoading" class="text-center py-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
              </div>
              <div v-else-if="zones.length === 0" class="text-center py-4">
                <p class="text-gray-500 dark:text-gray-400 text-sm">Nenhuma zona criada</p>
                <button
                  @click="startCreatingZone"
                  class="mt-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm font-medium"
                >
                  Criar primeira zona
                </button>
              </div>
              <div v-else class="space-y-2">
                <div
                  v-for="zone in zones"
                  :key="zone.id"
                  class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ zone.name }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ zone.radius }}m de raio</p>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span
                      :class="zone.isActive ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'"
                      class="px-2 py-1 text-xs font-medium rounded-full"
                    >
                      {{ zone.isActive ? 'Ativa' : 'Inativa' }}
                    </span>
                    <button
                      @click="deleteZone(zone.id)"
                      class="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Zone Modal -->
    <div v-if="showCreateZoneModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 overflow-y-auto h-full w-full z-[9999]">
      <div class="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Criar Nova Zona</h3>
            <button
              @click="closeModal"
              class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form @submit.prevent="createZone" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome da Zona</label>
              <input
                v-model="newZone.name"
                type="text"
                required
                class="mt-1 block w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Ex: Casa, Trabalho, Escola"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição (opcional)</label>
              <textarea
                v-model="newZone.description"
                rows="2"
                class="mt-1 block w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Descrição da zona..."
              />
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Latitude</label>
                <input
                  v-model.number="newZone.latitude"
                  type="number"
                  step="any"
                  required
                  class="mt-1 block w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="-23.5505"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Longitude</label>
                <input
                  v-model.number="newZone.longitude"
                  type="number"
                  step="any"
                  required
                  class="mt-1 block w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="-46.6333"
                />
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Raio (metros)</label>
              <select
                v-model.number="newZone.radius"
                class="mt-1 block w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="50">50m</option>
                <option value="100">100m</option>
                <option value="200">200m</option>
                <option value="500">500m</option>
                <option value="1000">1km</option>
                <option value="2000">2km</option>
                <option value="5000">5km</option>
                <option value="10000">10km</option>
              </select>
            </div>
            
            <div class="flex items-center space-x-4">
              <label class="flex items-center">
                <input
                  v-model="newZone.notifyOnEnter"
                  type="checkbox"
                  class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Notificar entrada</span>
              </label>
              <label class="flex items-center">
                <input
                  v-model="newZone.notifyOnExit"
                  type="checkbox"
                  class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Notificar saída</span>
              </label>
            </div>
            
            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                :disabled="isCreatingZone"
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {{ isCreatingZone ? 'Criando...' : 'Criar Zona' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useToast } from 'vue-toastification'
import { locationApi, type FamilyMember, type GeofenceZone, type CreateZoneData } from '@/api/location'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { AppHeader, BaseButton, BaseCard } from '@/components/ui'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'

// Types
interface NewZone {
  name: string
  description: string
  latitude: number
  longitude: number
  radius: number
  notifyOnEnter: boolean
  notifyOnExit: boolean
}

// Reactive data
const isLoading = ref(false)
const zonesLoading = ref(false)
const isCreatingZone = ref(false)
const showCreateZoneModal = ref(false)
const familyMembers = ref<FamilyMember[]>([])
const zones = ref<GeofenceZone[]>([])

// Map variables
let map: L.Map | null = null
let markers: L.Marker[] = []
let zoneCircles: L.Circle[] = []
let isCreatingZoneMode = false
let tempCircle: L.Circle | null = null

const newZone = ref<NewZone>({
  name: '',
  description: '',
  latitude: -23.5505,
  longitude: -46.6333,
  radius: 100,
  notifyOnEnter: true,
  notifyOnExit: true
})

const toast = useToast()

// Methods
const initMap = () => {
  if (map) return

  // Inicializar mapa Leaflet
  map = L.map('map').setView([-23.5505, -46.6333], 12)

  // Adicionar tiles do OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map)

  // Adicionar controles
  map.addControl(L.control.zoom({ position: 'topright' }))
  map.addControl(L.control.scale({ position: 'bottomright' }))

  // Eventos do mapa
  map.on('click', onMapClick)
  map.on('mousemove', onMapMouseMove)

  // Carregar dados iniciais
  updateMapMarkers()
  updateMapZones()
}

// Evento de clique no mapa para criar zona
const onMapClick = (e: L.LeafletMouseEvent) => {
  if (!isCreatingZoneMode) return

  const { lat, lng } = e.latlng
  
  // Atualizar coordenadas no formulário
  newZone.value.latitude = lat
  newZone.value.longitude = lng
  
  // Mostrar círculo temporário
  if (tempCircle) {
    map?.removeLayer(tempCircle)
  }
  
  tempCircle = L.circle([lat, lng], {
    radius: newZone.value.radius,
    color: '#16a34a',
    fillColor: '#16a34a',
    fillOpacity: 0.2,
    weight: 2
  }).addTo(map!)
  
  // Sair do modo criação e mostrar modal
  isCreatingZoneMode = false
  map?.closePopup()
  showCreateZoneModal.value = true
}

// Evento de movimento do mouse para atualizar círculo
const onMapMouseMove = (e: L.LeafletMouseEvent) => {
  if (!isCreatingZoneMode || !tempCircle) return
  
  const { lat, lng } = e.latlng
  tempCircle.setLatLng([lat, lng])
}

// Iniciar criação de zona
const startCreatingZone = () => {
  isCreatingZoneMode = true
  showCreateZoneModal.value = false
  
  // Adicionar instrução visual
  if (map) {
    const instruction = L.popup()
      .setLatLng(map.getCenter())
      .setContent(`
        <div style="text-align: center; padding: 10px;">
          <strong style="color: #1f2937; font-size: 16px;">🗺️ Clique no mapa para criar uma zona</strong>
          <br><br>
          <button onclick="cancelZoneCreation()" style="
            padding: 8px 16px; 
            background: #dc2626; 
            color: white; 
            border: none; 
            border-radius: 6px; 
            cursor: pointer;
            font-weight: 500;
          ">❌ Cancelar</button>
        </div>
      `)
      .openOn(map)
  }
}

// Cancelar criação de zona
const cancelZoneCreation = () => {
  isCreatingZoneMode = false
  if (tempCircle) {
    map?.removeLayer(tempCircle)
    tempCircle = null
  }
  map?.closePopup()
}

// Fechar modal e sair do modo criação
const closeModal = () => {
  showCreateZoneModal.value = false
  isCreatingZoneMode = false
  if (tempCircle) {
    map?.removeLayer(tempCircle)
    tempCircle = null
  }
}

const updateMapMarkers = () => {
  if (!map) return

  // Limpar marcadores existentes
  markers.forEach(marker => map?.removeLayer(marker))
  markers = []

  // Adicionar marcadores dos membros da família
  familyMembers.value.forEach(member => {
    if (member.latitude && member.longitude) {
      // Criar ícone personalizado baseado na bateria
      const iconColor = member.batteryLevel && member.batteryLevel < 0.2 ? '#dc2626' : '#16a34a'
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background-color: ${iconColor};
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })

      const marker = L.marker([member.latitude, member.longitude], { icon })
        .bindPopup(`
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937;">${member.name}</h3>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">Última localização: ${formatTime(member.lastSeen || '')}</p>
            ${member.batteryLevel !== null ? `<p style="margin: 0; font-size: 14px; color: #6b7280;">Bateria: ${Math.round(member.batteryLevel * 100)}%</p>` : ''}
          </div>
        `)
        .addTo(map)

      markers.push(marker)
    }
  })
}

const updateMapZones = () => {
  if (!map) return

  // Limpar círculos existentes
  zoneCircles.forEach(circle => map?.removeLayer(circle))
  zoneCircles = []

  // Adicionar círculos das zonas
  if (zones.value && Array.isArray(zones.value)) {
    zones.value.forEach(zone => {
      const circle = L.circle([zone.latitude, zone.longitude], {
        radius: zone.radius,
        color: zone.isActive ? '#16a34a' : '#6b7280',
        fillColor: zone.isActive ? '#16a34a' : '#6b7280',
        fillOpacity: 0.2,
        weight: 2,
        opacity: 0.8
      })
        .bindPopup(`
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937;">${zone.name}</h3>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">Raio: ${zone.radius}m</p>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Status: ${zone.isActive ? 'Ativa' : 'Inativa'}</p>
          </div>
        `)
        .addTo(map)

      zoneCircles.push(circle)
    })
  }
}

const refreshLocations = async () => {
  isLoading.value = true
  try {
    familyMembers.value = await locationApi.getFamilyLocations()
    updateMapMarkers()
  } catch (error) {
    // Toast já é mostrado pelo interceptor do axios
    console.error('Erro ao carregar localizações:', error)
  } finally {
    isLoading.value = false
  }
}

const loadZones = async () => {
  zonesLoading.value = true
  try {
    zones.value = await locationApi.getZones()
    updateMapZones()
  } catch (error) {
    // Toast já é mostrado pelo interceptor do axios
    console.error('Erro ao carregar zonas:', error)
  } finally {
    zonesLoading.value = false
  }
}

const createZone = async () => {
  isCreatingZone.value = true
  try {
    await locationApi.createZone(newZone.value)
    
    toast.success('Zona criada com sucesso!')
    showCreateZoneModal.value = false
    
    // Limpar círculo temporário e sair do modo criação
    if (tempCircle) {
      map?.removeLayer(tempCircle)
      tempCircle = null
    }
    isCreatingZoneMode = false
    
    // Reset form
    newZone.value = {
      name: '',
      description: '',
      latitude: -23.5505,
      longitude: -46.6333,
      radius: 100,
      notifyOnEnter: true,
      notifyOnExit: true
    }
    
    // Reload zones
    await loadZones()
  } catch (error) {
    // Toast de erro já é mostrado pelo interceptor do axios
    console.error('Erro ao criar zona:', error)
  } finally {
    isCreatingZone.value = false
  }
}

const deleteZone = async (zoneId: string) => {
  if (!confirm('Tem certeza que deseja deletar esta zona?')) return
  
  try {
    await locationApi.deleteZone(zoneId)
    
    toast.success('Zona deletada com sucesso!')
    await loadZones()
  } catch (error) {
    // Toast de erro já é mostrado pelo interceptor do axios
    console.error('Erro ao deletar zona:', error)
  }
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return 'Agora'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}min atrás`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`
  return `${Math.floor(diff / 86400000)}d atrás`
}

// Expor função global para cancelar criação
;(window as any).cancelZoneCreation = cancelZoneCreation

// Lifecycle
onMounted(() => {
  refreshLocations()
  loadZones()
  // Aguardar um pouco para o DOM estar pronto
  setTimeout(() => {
    initMap()
  }, 100)
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>
