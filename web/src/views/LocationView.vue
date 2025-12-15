<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Header -->
    <AppHeader
      :show-logo="true"
      :show-navigation="true"
    />

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
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
                  class="flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors"
                  :class="
                    member.id === authStore.userId
                      ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-400'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  "
                  @click="goToMemberLocation(member)"
                >
                  <div class="flex-shrink-0">
                    <img
                      v-if="member.profilePicture"
                      :src="member.profilePicture"
                      :alt="member.name || 'Membro'"
                      class="w-10 h-10 rounded-full object-cover border-2"
                      :class="
                        member.id === authStore.userId
                          ? 'border-green-500 dark:border-green-400'
                          : 'border-green-200 dark:border-green-800'
                      "
                    />
                    <div
                      v-else
                      class="w-10 h-10 rounded-full flex items-center justify-center"
                      :class="
                        member.id === authStore.userId
                          ? 'bg-green-500 dark:bg-green-600'
                          : 'bg-green-100 dark:bg-green-900'
                      "
                    >
                      <span
                        class="text-sm font-medium"
                        :class="
                          member.id === authStore.userId
                            ? 'text-white'
                            : 'text-green-800 dark:text-green-200'
                        "
                      >
                        {{ member.name?.charAt(0) || '?' }}
                      </span>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {{ member.name || 'Membro' }}
                      </p>
                      <span
                        v-if="member.id === authStore.userId"
                        class="text-xs font-medium text-green-600 dark:text-green-400"
                      >
                        (Você)
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ member.lastSeen ? formatTime(member.lastSeen) : 'Nunca visto' }}
                    </p>
                  </div>
                  <div class="flex items-center space-x-2">
                    <div v-if="member.batteryLevel !== null" class="flex items-center space-x-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" :class="member.batteryLevel < 0.2 ? 'text-red-500' : 'text-green-500'">
                        <rect x="2" y="7" width="16" height="10" rx="2" ry="2" fill="none" />
                        <line x1="20" y1="10" x2="20" y2="14" stroke-linecap="round" />
                        <rect x="4" y="9" :width="Math.max(0, 12 * member.batteryLevel)" height="6" rx="1" :fill="member.batteryLevel < 0.2 ? '#ef4444' : '#16a34a'" />
                      </svg>
                      <span class="text-xs text-gray-500 dark:text-gray-400">{{ Math.round(member.batteryLevel * 100) }}%</span>
                    </div>
                    <BaseButton
                      variant="ghost"
                      size="sm"
                      @click.stop="viewLocationHistory(member)"
                      title="Ver histórico de localização"
                    >
                      <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m3 8H9m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </BaseButton>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Geofence Zones -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Zonas</h3>
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
            </div>
            <div class="p-4">
              <div v-if="zonesLoading" class="text-center py-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
              </div>
              <div v-else-if="zones.length === 0" class="text-center py-4">
                <p class="text-gray-500 dark:text-gray-400 text-sm">Nenhuma zona criada</p>
                <BaseButton
                  variant="ghost"
                  size="sm"
                  @click="startCreatingZone"
                  class="mt-2"
                >
                  Criar primeira zona
                </BaseButton>
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
                    <BaseButton
                      variant="ghost"
                      size="sm"
                      @click="openDeleteZoneModal(zone.id)"
                      class="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </BaseButton>
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
            <BaseButton
              variant="ghost"
              size="sm"
              @click="closeModal"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </BaseButton>
          </div>
          
          <form @submit.prevent="createZone" class="space-y-4">
            <BaseInput
              v-model="newZone.name"
              type="text"
              label="Nome da Zona"
              placeholder="Ex: Casa, Trabalho, Escola"
              required
              :left-icon="MapPinIcon"
            />
            
            <BaseTextarea
              v-model="newZone.description"
              label="Descrição (opcional)"
              placeholder="Descrição da zona..."
              :rows="2"
            />
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="latitude" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Latitude *
                </label>
                <input
                  id="latitude"
                  v-model="latitudeInput"
                  type="number"
                  placeholder="-23.5505"
                  step="any"
                  required
                  class="block w-full rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-800 py-1.5 px-3"
                />
              </div>
              <div>
                <label for="longitude" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Longitude *
                </label>
                <input
                  id="longitude"
                  v-model="longitudeInput"
                  type="number"
                  placeholder="-46.6333"
                  step="any"
                  required
                  class="block w-full rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-800 py-1.5 px-3"
                />
              </div>
            </div>
            
            <BaseSelect
              v-model.number="newZone.radius"
              label="Raio (metros)"
            >
              <option value="50">50m</option>
              <option value="100">100m</option>
              <option value="200">200m</option>
              <option value="500">500m</option>
              <option value="1000">1km</option>
              <option value="2000">2km</option>
              <option value="5000">5km</option>
              <option value="10000">10km</option>
            </BaseSelect>
            
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
              <BaseButton
                type="button"
                variant="ghost"
                @click="closeModal"
              >
                Cancelar
              </BaseButton>
              <BaseButton
                type="submit"
                variant="primary"
                :loading="isCreatingZone"
                :disabled="isCreatingZone"
              >
                Criar Zona
              </BaseButton>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Zone Confirmation Modal -->
    <ConfirmModal
      :show="showDeleteZoneModal"
      title="Deletar Zona"
      message="Tem certeza que deseja deletar esta zona? Esta ação não pode ser desfeita."
      confirm-text="Deletar"
      cancel-text="Cancelar"
      :loading="isDeletingZone"
      @confirm="confirmDeleteZone"
      @cancel="closeDeleteZoneModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { locationApi, type FamilyMember, type GeofenceZone, type CreateZoneData } from '@/api/location'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { AppHeader, BaseButton, BaseCard, BaseInput, BaseSelect, BaseTextarea, ConfirmModal } from '@/components/ui'
import { ArrowPathIcon, MapPinIcon } from '@heroicons/vue/24/outline'

interface NewZone {
  name: string
  description: string
  latitude: number
  longitude: number
  radius: number
  notifyOnEnter: boolean
  notifyOnExit: boolean
}

const isLoading = ref(false)
const zonesLoading = ref(false)
const isCreatingZone = ref(false)
const showCreateZoneModal = ref(false)
const showDeleteZoneModal = ref(false)
const deletingZoneId = ref<string | null>(null)
const isDeletingZone = ref(false)
const familyMembers = ref<FamilyMember[]>([])
const zones = ref<GeofenceZone[]>([])

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

const latitudeInput = computed({
  get: () => newZone.value.latitude.toString(),
  set: (val: string | number) => {
    newZone.value.latitude = typeof val === 'number' ? val : parseFloat(val) || 0
  }
})

const longitudeInput = computed({
  get: () => newZone.value.longitude.toString(),
  set: (val: string | number) => {
    newZone.value.longitude = typeof val === 'number' ? val : parseFloat(val) || 0
  }
})

const toast = useToast()
const authStore = useAuthStore()
const router = useRouter()

const currentUserMember = computed(() => {
  return familyMembers.value.find(member => member.id === authStore.userId)
})

const initMap = () => {
  if (map) return

  let initialLat = -23.5505
  let initialLng = -46.6333
  let initialZoom = 12

  if (currentUserMember.value?.latitude && currentUserMember.value?.longitude) {
    initialLat = currentUserMember.value.latitude
    initialLng = currentUserMember.value.longitude
    initialZoom = 14
  }

  map = L.map('map').setView([initialLat, initialLng], initialZoom)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map)

  map.addControl(L.control.zoom({ position: 'topright' }))
  map.addControl(L.control.scale({ position: 'bottomright' }))

  map.on('click', onMapClick)
  map.on('mousemove', onMapMouseMove)

  updateMapMarkers()
  updateMapZones()
}

const onMapClick = (e: L.LeafletMouseEvent) => {
  if (!isCreatingZoneMode) return

  const { lat, lng } = e.latlng
  
  newZone.value.latitude = lat
  newZone.value.longitude = lng
  latitudeInput.value = lat.toString()
  longitudeInput.value = lng.toString()
  
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
  
  isCreatingZoneMode = false
  map?.closePopup()
  showCreateZoneModal.value = true
}

const onMapMouseMove = (e: L.LeafletMouseEvent) => {
  if (!isCreatingZoneMode || !tempCircle) return
  
  const { lat, lng } = e.latlng
  tempCircle.setLatLng([lat, lng])
}

const startCreatingZone = () => {
  isCreatingZoneMode = true
  showCreateZoneModal.value = false
  
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

const cancelZoneCreation = () => {
  isCreatingZoneMode = false
  if (tempCircle) {
    map?.removeLayer(tempCircle)
    tempCircle = null
  }
  map?.closePopup()
}

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

  markers.forEach(marker => map?.removeLayer(marker))
  markers = []

  familyMembers.value.forEach(member => {
    if (member.latitude && member.longitude) {
      const isCurrentUser = member.id === authStore.userId
      const iconColor = member.batteryLevel && member.batteryLevel < 0.2 ? '#dc2626' : '#16a34a'
      const borderColor = isCurrentUser ? '#22c55e' : 'white'
      const borderWidth = isCurrentUser ? 3 : 2
      const iconSize = isCurrentUser ? 26 : 20
      
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background-color: ${iconColor};
          width: ${iconSize}px;
          height: ${iconSize}px;
          border-radius: 50%;
          border: ${borderWidth}px solid ${borderColor};
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [iconSize, iconSize],
        iconAnchor: [iconSize / 2, iconSize / 2]
      })

      const marker = L.marker([member.latitude, member.longitude], { icon })
        .bindPopup(`
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937;">${member.name}</h3>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">Última localização: ${formatTime(member.lastSeen || '')}</p>
            ${member.batteryLevel !== null ? `<p style="margin: 0; font-size: 14px; color: #6b7280;">Bateria: ${Math.round(member.batteryLevel * 100)}%</p>` : ''}
          </div>
        `)
        .addTo(map!)

      markers.push(marker)
    }
  })
}

const updateMapZones = () => {
  if (!map) return

  zoneCircles.forEach(circle => map?.removeLayer(circle))
  zoneCircles = []

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
        .addTo(map!)

      zoneCircles.push(circle)
    })
  }
}

const refreshLocations = async () => {
  isLoading.value = true
  try {
    familyMembers.value = await locationApi.getFamilyLocations()
    updateMapMarkers()
    
    if (!map && currentUserMember.value?.latitude && currentUserMember.value?.longitude) {
      setTimeout(() => {
        initMap()
      }, 100)
    } else if (map && currentUserMember.value?.latitude && currentUserMember.value?.longitude) {
      map.setView([currentUserMember.value.latitude, currentUserMember.value.longitude], 14)
    }
  } catch (error) {
  } finally {
    isLoading.value = false
  }
}

const goToMemberLocation = (member: FamilyMember) => {
  if (!map) return
  
  if (member.latitude && member.longitude) {
    map.setView([member.latitude, member.longitude], 14)
    
    const marker = markers.find(m => {
      const latlng = m.getLatLng()
      return latlng.lat === member.latitude && latlng.lng === member.longitude
    })
    
    if (marker) {
      marker.openPopup()
    }
  } else {
    toast.info(`${member.name} não possui localização disponível`)
  }
}

const viewLocationHistory = (member: FamilyMember) => {
  router.push({
    name: 'LocationHistory',
    params: { userId: member.id },
    query: { name: member.name || 'Membro' }
  })
}

const loadZones = async () => {
  zonesLoading.value = true
  try {
    zones.value = await locationApi.getZones()
    updateMapZones()
  } catch (error) {
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
    
    if (tempCircle) {
      map?.removeLayer(tempCircle)
      tempCircle = null
    }
    isCreatingZoneMode = false
    
    newZone.value = {
      name: '',
      description: '',
      latitude: -23.5505,
      longitude: -46.6333,
      radius: 100,
      notifyOnEnter: true,
      notifyOnExit: true
    }
    latitudeInput.value = newZone.value.latitude.toString()
    longitudeInput.value = newZone.value.longitude.toString()
    
    await loadZones()
  } catch (error) {
  } finally {
    isCreatingZone.value = false
  }
}

const openDeleteZoneModal = (zoneId: string) => {
  deletingZoneId.value = zoneId
  showDeleteZoneModal.value = true
}

const closeDeleteZoneModal = () => {
  showDeleteZoneModal.value = false
  deletingZoneId.value = null
}

const confirmDeleteZone = async () => {
  if (!deletingZoneId.value) return
  
  isDeletingZone.value = true
  try {
    await locationApi.deleteZone(deletingZoneId.value)
    
    toast.success('Zona deletada com sucesso!')
    closeDeleteZoneModal()
    await loadZones()
  } catch (error) {
    toast.error('Erro ao deletar zona')
  } finally {
    isDeletingZone.value = false
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

;(window as any).cancelZoneCreation = cancelZoneCreation

onMounted(async () => {
  await refreshLocations()
  await loadZones()
  
  setTimeout(() => {
    if (!map) {
      initMap()
    }
  }, 100)
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>
