import api from './index'

export interface LocationData {
  id: string
  userId: string
  latitude: number
  longitude: number
  accuracy?: number
  altitude?: number
  speed?: number
  heading?: number
  address?: string
  timestamp: string
  batteryLevel?: number
  isMoving: boolean
}

export interface FamilyMember {
  id: string
  name: string
  email: string
  profilePicture?: string | null
  lastSeen: string | null
  batteryLevel: number | null
  latitude?: number
  longitude?: number
  isOnline: boolean
}

export interface GeofenceZone {
  id: string
  name: string
  description?: string
  latitude: number
  longitude: number
  radius: number
  isActive: boolean
  notifyOnEnter: boolean
  notifyOnExit: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateZoneData {
  name: string
  description?: string
  latitude: number
  longitude: number
  radius: number
  notifyOnEnter: boolean
  notifyOnExit: boolean
}

export const locationApi = {
  async getFamilyLocations(): Promise<FamilyMember[]> {
    try {
      const familiesResponse = await api.get('/family')
      const families = familiesResponse.data.data 
      
      
      if (!families || families.length === 0) {
        return []
      }
      
      const allMembers: FamilyMember[] = []
      
      for (const family of families) {
        try {
          const locationResponse = await api.get(`/location/family/${family.id}`)
          const familyData = locationResponse.data
          
          
          if (familyData && familyData.data && familyData.data.members) {
            const members = familyData.data.members.map((member: any) => ({
              id: member.userId,
              name: member.userName || member.nickname || 'Membro',
              email: '', 
              profilePicture: member.profilePicture || null,
              lastSeen: member.timestamp,
              batteryLevel: member.batteryLevel,
              latitude: member.latitude,
              longitude: member.longitude,
              isOnline: true 
            }))
            
            allMembers.push(...members)
          }
        } catch (error) {
        }
      }
      
      return allMembers
    } catch (error) {
      return []
    }
  },

  async getZones(): Promise<GeofenceZone[]> {
    const response = await api.get('/geofence/zones')
    return response.data.data || response.data || []
  },

  async createZone(data: CreateZoneData): Promise<GeofenceZone> {
    const response = await api.post('/geofence/zones', data)
    return response.data
  },

  async updateZone(id: string, data: Partial<CreateZoneData>): Promise<GeofenceZone> {
    const response = await api.patch(`/geofence/zones/${id}`, data)
    return response.data
  },

  async deleteZone(id: string): Promise<void> {
    await api.delete(`/geofence/zones/${id}`)
  },

  async toggleZone(id: string, isActive: boolean): Promise<GeofenceZone> {
    const response = await api.patch(`/geofence/zones/${id}`, { isActive })
    return response.data
  },

  async getLocationHistory(
    userId: string,
    startDate: Date,
    endDate: Date,
    limit?: number
  ): Promise<LocationData[]> {
    const formatDateForAPI = (date: Date): string => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
    }

    const params = new URLSearchParams({
      startDate: formatDateForAPI(startDate),
      endDate: formatDateForAPI(endDate),
    })
    if (limit) {
      params.append('limit', limit.toString())
    }
    const response = await api.get(`/location/history/${userId}?${params.toString()}`)
    return response.data.data || []
  }
}
